import { FC } from "react";

const About: FC = () => {
  return (
    <div className="about-page">
      <div className="about-content">
        <h2>About NICAR Network</h2>
        <p>
          I made this website for a Lightning Talk at NICAR 2026. Basically I figured that since the NICAR website lets you download the schedule in JSON format, the organizers probably want me to do something with the data. I think network visializations are neat, and I tend to think about data in terms of networks, so I wanted to try visualizing some of the features of the data from a network perspective.
        </p>
        <h3>Data Sources</h3>
        <p>
          The data was derived from NICAR conference schedules between 2015 and 2026. I couldn't find the 2021 conference schedule online so I asked the organizers and they kindly provided me with a CSV file. This project required a lot of data cleaning (standardizing speaker and outlet names), and I probably made a few mistakes. If I changed your affiliated outlet to something incorrect, or I combined you with another journalist who has a similar name, please let me know by creating an issue on{" "}
          <a target="_blank" rel="noreferrer" href="https://github.com/trislee/nicar-network/">
          GitHub
          </a>.
        </p>
        <h3>Visualization</h3>
        <p>
          This application was built using{" "}
          <a target="_blank" rel="noreferrer" href="https://reactjs.org/">
            React
          </a>{" "}
          and{" "}
          <a target="_blank" rel="noreferrer" href="https://www.sigmajs.org">
            sigma.js
          </a>
          . Sigma.js is my favorite network visualization library: it has great performance and it's easy to get started with—check out their <a target="_blank" rel="noreferrer" href="https://www.sigmajs.org/storybook/?path=/story/load-gexf-file--story">
            examples
          </a>. The network layouts were created using{" "}
          <a target="_blank" rel="noreferrer" href="https://gephi.org/">
            Gephi
          </a>{" "}
          using the <a target="_blank" rel="noreferrer" href="https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0098679">
          Force Atlas 2
          </a>{" "} algorithm with the "LinLog mode" and "Prevent Overlap" options enabled.
        </p>
        <h3>Source Code</h3>
        <p>
          The source code for this project, including the scripts used to generate the networks and clean the data, is available on{" "}
          <a
            target="_blank"
            rel="noreferrer"
            href="https://github.com/trislee/nicar-network"
          >
            GitHub
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default About;
