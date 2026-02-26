import re
from pathlib import Path
import json
from itertools import combinations, chain
from collections import Counter, defaultdict

import pandas as pd
from bs4 import BeautifulSoup

import networkx as nx


SCHEDULE_DIR = Path("./schedules")
CLEANING_JSON = Path("./cleaning") / "speakers.json"
GRAPHML_DIR = Path("./graphml")


def process_name(s):
    _s = s.replace("  ", " ").strip().split("(")[0].replace(",", "")
    return speaker_map.get(_s, _s).strip()

def process_employer(s):
    if not s:
        return None
    employer = str(s)
    if employer in employer_map:
        employer = employer_map.get(employer)
    employer = employer.split("/")[0].strip()
    # re-mapping after split for consistency
    if employer in employer_map:
        employer = employer_map.get(employer)
    return employer.strip()

def process_speakers_csv(s):
    if pd.isnull(s):
        return None
    groups = s.split(";")
    speakers = []
    for group in groups:
        split = group.split(",")
        if len(split) == 1:
            all_people = ""
            outlet = split[0]
        elif len(split) > 2:
            all_people = split[0]
            outlet = ",".join(split[1:])
        else:
            all_people, outlet = split
        if all_people is None:
            people = [None]
        else:
            people = all_people.split("&")
        for person in people:
            speaker = {
                "name": person,
                "affiliation": outlet.strip().split("(")[0]
            }
            speakers.append(speaker)
    return speakers

def process_speakers_csv_2021(s):
    if pd.isnull(s):
        return None
    groups = s.split(";")
    speakers = []
    for group in groups:
        split = group.split(",")
        if len(split) == 1:
            all_people = split[0]
            outlet = ""
        elif len(split) > 2:
            all_people = split[0]
            outlet = ",".join(split[1:])
        else:
            all_people, outlet = split
        if all_people is None:
            people = [None]
        else:
            people = all_people.split("&")
        for person in people:
            speaker = {
                "name": person,
                "affiliation": outlet.strip().split("(")[0]
            }
            speakers.append(speaker)
    return speakers

def process_speakers_json(d):
    speakers = []
    for speaker in d:
        if "first" not in speaker.keys():
            _d = {
                "name": speaker['name'],
                "affiliation": speaker["affiliation"].strip()
            }
        else:
            _d = {
                "name": f"{speaker['first'].split(" ")[0]} {speaker['last']}",
                "affiliation": speaker["affiliation"].strip()
            }
        speakers.append(_d)
    return speakers

def process_speakers_html(s):
    items = []
    groups = s.split(";")
    for group in groups:
        split = group.split(" of ")
        items.append({"name": split[0], "affiliation": " of ".join(split[1:]).strip()})
    return items

def parse_json(file):
    with open(file, "r") as f:
        d = json.load(f)
    if isinstance(d, dict):
        if "data" in d.keys():
            d = d["data"]
        else:
            d = d["sessions"]
    names_by_session = []
    for session in d:
        speakers = process_speakers_json(session["speakers"])
        names_by_session.append(speakers)
    return names_by_session

def parse_json_2026(file):
    with open(file, "r") as f:
        d = json.load(f)
    sessions = d["sessions"]
    speakers = d["speakers"]
    speakers_dict = {d["id"] : d for d in speakers}

    names_by_session = []
    for session in sessions:
        session_speakers = []
        for speaker_id in session["speakers"]:
            speaker = speakers_dict[speaker_id]
            _d = {
                    "name": f"{speaker['first_name']} {speaker['last_name']}",
                    "affiliation": speaker["affiliation"].strip()
                }
            session_speakers.append(_d)
        names_by_session.append(session_speakers)
    return names_by_session

def parse_csv(file):
    df = pd.read_csv(file)
    sessions = []

    for column_name in ["speakers", "Speakers with affiliations"]:
        if column_name in df.columns:
            speakers = df[column_name]

    for s in speakers:
        if "21" in file.name:
            speakers = process_speakers_csv_2021(s)
        else:
            speakers = process_speakers_csv(s)
        if speakers:
            sessions.append(speakers)
    return sessions

def parse_html(file):
    with open(file, "rb") as f:
        soup = BeautifulSoup(f.read(), features = "lxml")

    p_tags = soup.find_all("p", class_ = "event-speakers")
    if len(p_tags) > 0:
        sessions = [re.split("Speakers:|Speaker:", p.text)[-1].strip() for p in p_tags]
        return [process_speakers_html(s) for s in sessions]
    else:
        p_tags = soup.find_all("p")
        sessions = [p.text.split("Speakers: ")[-1].strip() for p in p_tags if "Speakers:" in p.text]
        # speakers = [speakers.split(", ") for speakers in sessions if speakers != "TBA"]
        speakers = [[{"name": name.strip(), "affiliation": None} for name in speakers.split(", ")] for speakers in sessions if speakers != "TBA"]

        return speakers


if __name__ == "__main__":

    # 1. Convert data from all schedules into standardized form

    with open(CLEANING_JSON, "r") as f:
        cleaning = json.load(f)
    employer_map = cleaning["employer_map"]
    speaker_map = cleaning["speaker_map"]

    all_sessions = []

    for file in sorted(SCHEDULE_DIR.glob("*")):

        print(file)

        if file.name.endswith(".json"):
            if "2026" in file.name:
                all_sessions.extend(parse_json_2026(file))
            else:
                all_sessions.extend(parse_json(file))
        elif file.name.endswith(".csv"):
            all_sessions.extend(parse_csv(file))
        else:
            all_sessions.extend(parse_html(file))

    all_sessions = [[{"name": process_name(d["name"]), "affiliation": process_employer(d["affiliation"])} for d in session] for session in all_sessions]

    all_session_names = [[d["name"] for d in session] for session in all_sessions]

    # 2. Convert list of sessions into weighted edge list of all speakers who shared a session

    edge_list = []
    for session in all_sessions:
        if len(session) < 2:
            continue
        speakers = [d["name"] for d in session]
        for speaker_1, speaker_2 in combinations(speakers, 2):
            edge_list.append((speaker_1, speaker_2))

    weighted_edge_list = [(k[0], k[1], v) for k, v in Counter(edge_list).items()]

    # 3. Convert outlet/employer for each speaker to standardized form

    employers = defaultdict(list)

    for session in all_sessions:
        for speaker in session:
            employer = speaker.get("affiliation")
            if employer:
                employers[speaker['name']].append(employer)

    employers = dict(employers)

    name_to_employer = {
    k: Counter(x for x in v if x).most_common(1)[0][0] if any(v) else None
    for k, v in employers.items()
}

    # # DEBUG
    # with open("all_speakers.txt", "w") as f:
    #     for k in sorted(name_to_employer.keys()):
    #         f.write(k + "\n")

    # 4. Convert data into GraphML format, for use in Gephi

    G = nx.Graph()
    G.add_weighted_edges_from(weighted_edge_list)
    _G = G.subgraph(max(nx.connected_components(G), key=len))
    connected_components = [len(c) for c in sorted(nx.connected_components(G), key=len, reverse=True)]
    print(connected_components)
    print(connected_components[0], sum(connected_components[1:]))
    print(connected_components[0] / sum(connected_components))

    centrality = nx.betweenness_centrality(G, normalized=True)
    top10 = sorted(centrality.items(), key=lambda x: x[1], reverse=True)[:12]
    print(f"{'Rank':<6} {'Speaker':<20} {'Betweenness Centrality':<25}")
    print("-" * 42)
    for rank, (node, score) in enumerate(top10, start=1):
        print(f"{rank:<6} {str(node):<20} {score * 100:.2f}%")

    for i, name in enumerate(nx.shortest_path(G=G, source="Callum Thomson", target="Audrey Nielsen", weight = None)):
        print(f"{i}. {name}")

    number_of_sessions = dict(Counter(chain.from_iterable(all_session_names)))
    nx.set_node_attributes(G=_G, values=number_of_sessions, name="sessions")
    nx.set_node_attributes(G=_G, values={k :v **0.5 for k, v in number_of_sessions.items()}, name="sessions_root_2")
    nx.set_node_attributes(G=G, values=name_to_employer, name = "affiliation")

    # DEBUG
    # GRAPHML_DIR.mkdir(exist_ok=True)
    # nx.write_graphml(G=_G, path = GRAPHML_DIR / "speakers_raw.graphml")

    # # 5. [LOGS] Verify data and output, improve consolidation

    # all_employees = list(chain.from_iterable(employers.values()))
    # employer_frequency = Counter(all_employees).most_common()
    # with open("employers_list.txt", "w") as f:
    #     f.write("\n".join(sorted(set(all_employees))))
    # with open("employers_frequency.txt", "w") as f:
    #     for employer, count in employer_frequency:
    #         f.write(f"{employer:<50} {count}\n")
