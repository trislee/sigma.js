import { FC } from "react";
import { BsInfoCircle } from "react-icons/bs";

import Panel from "./Panel";

const DESCRIPTIONS = {
  speakers: (
    <>
      <p>
        This interactive visualization represents a <i>network</i> of speakers at NICAR (National Institute for Computer-Assisted Reporting) conferences between 2015 and 2026. Each{" "}
        <i>node</i> represents a speaker, and <i>edges</i> between nodes indicate that speakers have appeared together in one or more sessions.
      </p>
      <p>
        This kind of visualization allows us to better understand the structure of the data journalism community.
      </p>
      <p>
        This web application was developed by{" "}
        <a target="_blank" rel="noreferrer" href="https://tristanl.ee/">
          Tristan Lee
        </a>{" "}
        for a Lightning Talk at{" "}
        <a target="_blank" rel="noreferrer" href="https://www.ire.org/training/conferences/nicar-2026/">
        NICAR 2026
        </a> using{" "}
        <a target="_blank" rel="noreferrer" href="https://gephi.org/">
          Gephi
        </a>,{" "}
        <a target="_blank" rel="noreferrer" href="https://reactjs.org/">
          react
        </a>,{" "}
        and{" "}
        <a target="_blank" rel="noreferrer" href="https://www.sigmajs.org">
          sigma.js
        </a>
        . You can read the source code{" "}
        <a target="_blank" rel="noreferrer" href="https://github.com/trislee/nicar-network/">
          on GitHub
        </a>
        .
      </p>
      <p>
        The area of each node is proportional to the number of sessions in which the speaker has appeared. Nodes are colored based on the speaker's primary affiliation (the outlet that's appeared by their name most frequently at NICAR conferences).
      </p>
    </>
  ),
  descriptions: (
    <>
      <p>
        This interactive visualization represents a <i>network</i> of{" "}
        <a target="_blank" rel="noreferrer" href="https://gephi.org/">
        named entities
        </a>{" "}
        extracted from the descriptions, titles, and keywords of NICAR conference sessions between 2015 and 2026. Each{" "}
        <i>node</i> represents a key term or concept from the session, and <i>edges</i> between nodes indicate that the two terms have been discussed together in at least one session.
      </p>
      <p>
      This kind of visualization allows us to better understand the topics of interest to the data journalism community, and how they relate to each other.
      </p>
      <p>
        This web application was developed by{" "}
        <a target="_blank" rel="noreferrer" href="https://tristanl.ee/">
          Tristan Lee
        </a>{" "}
        for a Lightning Talk at{" "}
        <a target="_blank" rel="noreferrer" href="https://www.ire.org/training/conferences/nicar-2026/">
        NICAR 2026
        </a> using{" "}
        <a target="_blank" rel="noreferrer" href="https://gephi.org/">
          Gephi
        </a>,{" "}
        <a target="_blank" rel="noreferrer" href="https://reactjs.org/">
          react
        </a>,{" "}
        and{" "}
        <a target="_blank" rel="noreferrer" href="https://www.sigmajs.org">
          sigma.js
        </a>
        . You can read the source code{" "}
        <a target="_blank" rel="noreferrer" href="https://github.com/trislee/nicar-network/">
          on GitHub
        </a>
        .
      </p>
      <p>
        The area of each node is proportional to the number of sessions in which the entity was listed in. Nodes are coloured based on a{" "}
        <a target="_blank" rel="noreferrer" href="https://arxiv.org/abs/0803.0476">
        community detection algorithm
        </a>. Edges are weighted by the number of sessions that include both entities.
        </p>
    </>
  ),
};

const DescriptionPanel: FC<{ activeTab: "speakers" | "descriptions" }> = ({ activeTab }) => {
  return (
    <Panel
      initiallyDeployed
      title={
        <>
          <BsInfoCircle className="text-muted" /> Description
        </>
      }
    >
      {DESCRIPTIONS[activeTab]}
    </Panel>
  );
};

export default DescriptionPanel;
