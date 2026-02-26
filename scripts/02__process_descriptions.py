import json
from pathlib import Path
from collections import Counter, defaultdict
from itertools import chain, combinations
import re

import spacy
from bs4 import BeautifulSoup
import networkx as nx
import pandas as pd

SCHEDULE_DIR = Path("../schedules")
BAD_NER_LABELS = set(["TIME", "ORDINAL", "DATE", "CARDINAL", "MONEY"])
CLEANING_JSON = Path("cleaning") / "descriptions.json"
GRAPHML_DIR = Path("graphml")
FREQUENCY_THRESHOLD = 3

def get_programming_language(text):
    keywords = []
    if bool(re.search(r'\bR\b', text, re.IGNORECASE)):
        keywords.append("r.")
    if bool(re.search(r'\bPython\b', text, re.IGNORECASE)):
        keywords.append("python")
    return keywords

def _process_entity(s):
    _s = s.lower()

    if _s.endswith("'s"):
        _s = "'s".join(_s.split("'s")[:-1])
    if _s.endswith("’s"):
        _s = "'s".join(_s.split("’s")[:-1])

    if _s.startswith("the"):
        _s = "the".join(_s.split("the")[1:])
    if _s.startswith("•"):
        _s = "•".join(_s.split("the")[1:])

    if len(_s.split()) > 3:
        return None
    if ":" in _s:
        return None
    if "•" in _s:
        return None
    if "marriott" in _s:
        return None

    return _s.strip()

def extract_entities(text):
    doc = nlp(text)
    ents_nlp = [ent.text.lower() for ent in doc.ents if ent.label_ not in BAD_NER_LABELS]
    ents = []
    for ent in ents_nlp:
        if replaced_ent := entity_processing["replace"].get(ent):
            _ent = _process_entity(replaced_ent)
        else:
            _ent = _process_entity(ent)
        if _ent in entity_processing["ignore_entities"]:
            continue
        ents.append(_ent)
    return set(filter(None, ents))

def extract_descriptions_json(session):

    if session.get("keywords_display"):
        keywords = session["keywords_display"]
    elif session.get("keywords"):
        keywords = session["keywords"]
    else:
        keywords = []

    keywords_text =  " " + " ".join(keywords)

    if "description" in session.keys():
        if "title" in session.keys():
            title = session["title"] + ". "
            description = session["description"]
        else:
            title = session["session_title"] + ". "
            description = session["description"]
            if description.startswith("<"):
                description = BeautifulSoup(description, features="lxml").get_text()
        return  title + description + keywords_text
    elif "session_description" in session.keys():
        description = session["session_description"]
        if description.startswith("<"):
            return session["session_title"] + ". " + BeautifulSoup(description, features="lxml").get_text() + keywords_text
        return session["session_title"] + ". " + description + keywords_text
    else:
        raise ValueError

def extract_descriptions_html(event_content):
    title = event_content.find("h3", class_ = "title").get_text()

    description_text = title + ". "

    for paragraph in event_content.find_all('p'):
        first_child = paragraph.find()

        if first_child and first_child.name in ('strong', 'em'):
            continue

        text = paragraph.get_text()
        if any(text.startswith(bad_start) for bad_start in ignore_starts):
            continue

        description_text += text

    return description_text

def parse_csv(filename):
    df = pd.read_csv(filename)

    if "session_title" in df.columns:
        title = df["session_title"]
    else:
        title = df["Title"]

    if "session_description" in df.columns:
        description = df["session_description"]
    else:
        description = df["Description"]

    title = title.fillna("")
    description = description.fillna("")

    combined = title + ". " + description
    return [item for item in combined]

def parse_json(filename):
    with open(filename, "r") as f:
        d = json.load(f)
    if isinstance(d, dict):
        if "data" in d.keys():
            d = d["data"]
        else:
            d = d["sessions"]
    entities_by_session = []
    for session in d:
        entities = extract_descriptions_json(session = session)
        entities_by_session.append(entities)
    return entities_by_session

def parse_html(filename):
    with open(filename, "rb") as f:
        data = f.read()
    soup = BeautifulSoup(data, features = "lxml")
    events = soup.find_all("div", class_ = "event-content")
    entities_by_session = [extract_descriptions_html(event_content=event) for event in events]
    return entities_by_session

if __name__ == "__main__":

    nlp = spacy.load('en_core_web_sm')

    all_descriptions = []

    with open(CLEANING_JSON, "r") as f:
        entity_processing = json.load(f)

    ignore_starts = entity_processing["ignore_starts"]

    input_files = SCHEDULE_DIR.glob("*")

    all_descriptions = []
    for file in sorted(input_files):
        print(file)
        if file.name.endswith(".json"):
            all_descriptions.extend(parse_json(file))
        elif file.name.endswith(".csv"):
            all_descriptions.extend(parse_csv(file))
        else:
            all_descriptions.extend(parse_html(file))

    all_entities = [extract_entities(description) for description in all_descriptions]

    c = Counter(chain.from_iterable(all_entities))

    with open("entities_raw__full_1.txt", "w") as f:
        for item, count in c.most_common():
            f.write(f"{item:<30} {count}\n")

    with open("descriptions.txt", "w") as f:
        f.write("\n\n".join(all_descriptions))

    entities_set = {k for k, v in c.items() if v > FREQUENCY_THRESHOLD}

    replacement_dict = entity_processing["replace"].copy()
    replacement_dict.update({e : e for e in entities_set})
    replacement_dict.update({e : e for e in entity_processing["missing"]})
    replacement_dict = {k : v for k, v in replacement_dict.items() if ((k not in entity_processing["ignore_entities"]) & (v not in entity_processing["ignore_entities"]))}

    replacement_tuples = sorted([(k, v) for k, v in replacement_dict.items()], key = lambda e : len(e[0]), reverse = True)

    all_entities_round_2 = []
    for description in all_descriptions:
        _description = description.lower()
        entities_round_2 = []
        for entity, replacement_entity in replacement_tuples:
            if re.search(rf'\b{re.escape(entity)}\b', _description, re.IGNORECASE):
                _description = _description.replace(entity, "")
                entities_round_2.append(replacement_entity)
        all_entities_round_2.append(set(entities_round_2))

    c = Counter(chain.from_iterable(all_entities_round_2))

    with open("entities_raw__full_2.txt", "w") as f:
        for item, count in c.most_common():
            f.write(f"{item:<30} {count}\n")

    frequency = dict(c.most_common())
    all_combinations = defaultdict(float)
    for entities in all_entities_round_2:
        filtered_entities = []
        for entity in entities:
            if frequency[entity] > FREQUENCY_THRESHOLD:
                filtered_entities.append(entity)
            for combo in combinations(filtered_entities, 2):
                all_combinations[tuple(sorted(combo))] += 1/len(filtered_entities)

    edge_list = [(e1, e2, w) for (e1, e2), w in all_combinations.items()]

    G = nx.Graph()
    G.add_weighted_edges_from(edge_list)
    node_frequency = {n : frequency[n] for n in G.nodes}
    nx.set_node_attributes(G=G, values=node_frequency, name="frequency")
    nx.set_node_attributes(G=G, values={k : v**0.5 for k, v in node_frequency.items()}, name="frequency_root_2")
    connected_components = [len(c) for c in sorted(nx.connected_components(G), key=len, reverse=True)]
    print(connected_components[0], sum(connected_components[1:]))
    print(connected_components[0] / sum(connected_components))

    nx.write_graphml(G = G, path = GRAPHML_DIR / "descriptions_raw.graphml")