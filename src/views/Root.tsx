import { FullScreenControl, SigmaContainer, ZoomControl } from "@react-sigma/core";
import { createNodeImageProgram } from "@sigma/node-image";
import { DirectedGraph } from "graphology";
import { constant, keyBy, mapValues, omit } from "lodash";
import { FC, useEffect, useMemo, useState } from "react";
import { BiBookContent, BiRadioCircleMarked } from "react-icons/bi";
import { BsArrowsFullscreen, BsFullscreenExit, BsZoomIn, BsZoomOut } from "react-icons/bs";
import { GrClose } from "react-icons/gr";
import { Settings } from "sigma/settings";

import { drawHover, drawLabel } from "../canvas-utils";
import { Dataset, FiltersState } from "../types";
import ClustersPanel from "./ClustersPanel";
import DescriptionPanel from "./DescriptionPanel";
import GraphDataController from "./GraphDataController";
import GraphEventsController from "./GraphEventsController";
import GraphSettingsController from "./GraphSettingsController";
import GraphTitle from "./GraphTitle";
import SearchField from "./SearchField";
import Navbar from "./Navbar";
import About from "./About";

const Root: FC = () => {
  const graph = useMemo(() => new DirectedGraph(), []);
  const [showContents, setShowContents] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [filtersState, setFiltersState] = useState<FiltersState>({
    clusters: {},
  });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"speakers" | "descriptions" | "about">("speakers");
  const sigmaSettings: Partial<Settings> = useMemo(
    () => ({
      nodeProgramClasses: {
        image: createNodeImageProgram({
          size: { mode: "force", value: 256 },
        }),
      },
      defaultDrawNodeLabel: drawLabel,
      defaultDrawNodeHover: drawHover,
      defaultNodeType: "image",
      defaultEdgeType: "arrow",
      labelDensity: 0.07,
      labelGridCellSize: 60,
      labelRenderedSizeThreshold: dataset?.labelThreshold || 15,
      labelFont: "Lato, sans-serif",
      zIndex: true,
    }),
    [dataset?.labelThreshold],
  );

  /**
   * Initialize active tab from URL hash, defaulting to "speakers":
   */
  useEffect(() => {
    const validTabs: ("speakers" | "descriptions" | "about")[] = ["speakers", "descriptions", "about"];

    const getTabFromHash = (): "speakers" | "descriptions" | "about" => {
      const hash = window.location.hash.slice(1); // Remove the '#'
      return validTabs.includes(hash as any) ? (hash as "speakers" | "descriptions" | "about") : "speakers";
    };

    // Set initial tab from hash
    const initialTab = getTabFromHash();
    setActiveTab(initialTab);

    // If no hash or invalid hash, set default hash (using replaceState to avoid triggering hashchange)
    const currentHash = window.location.hash.slice(1);
    if (!currentHash || !validTabs.includes(currentHash as any)) {
      window.history.replaceState(null, "", "#speakers");
    }

    // Listen for hash changes (back/forward buttons)
    const handleHashChange = () => {
      const newTab = getTabFromHash();
      setActiveTab(newTab);
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  /**
   * Update URL hash when activeTab changes (from user interaction):
   */
  useEffect(() => {
    const currentHash = window.location.hash.slice(1);
    if (currentHash !== activeTab) {
      window.location.hash = activeTab;
    }
  }, [activeTab]);

  // Load data when activeTab changes (only for speakers/descriptions):
  useEffect(() => {
    if (activeTab === "about") {
      return;
    }
    setDataReady(false);
    const jsonFile = activeTab === "speakers" ? "speakers.json" : "descriptions.json";
    fetch(`./${jsonFile}`)
      .then((res) => res.json())
      .then((dataset: Dataset) => {
        setFiltersState({
          clusters: mapValues(keyBy(dataset.clusters, "key"), constant(true)),
        });
        setDataset(dataset);
        requestAnimationFrame(() => setDataReady(true));
      });
  }, [activeTab]);

  if (activeTab === "about") {
    return (
      <div id="app-root">
        <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
        <About />
      </div>
    );
  }

  if (!dataset) return null;

  return (
    <div id="app-root" className={showContents ? "show-contents" : ""}>
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      <SigmaContainer graph={graph} settings={sigmaSettings} className="react-sigma">
        <GraphSettingsController hoveredNode={hoveredNode} />
        <GraphEventsController setHoveredNode={setHoveredNode} />
        <GraphDataController dataset={dataset} filters={filtersState} />

        {dataReady && (
          <>
            <div className="controls">
              <div className="react-sigma-control ico">
                <button
                  type="button"
                  className="show-contents"
                  onClick={() => setShowContents(true)}
                  title="Show caption and description"
                >
                  <BiBookContent />
                </button>
              </div>
              <FullScreenControl className="ico">
                <BsArrowsFullscreen />
                <BsFullscreenExit />
              </FullScreenControl>

              <ZoomControl className="ico">
                <BsZoomIn />
                <BsZoomOut />
                <BiRadioCircleMarked />
              </ZoomControl>
            </div>
            <div className="contents">
              <div className="ico">
                <button
                  type="button"
                  className="ico hide-contents"
                  onClick={() => setShowContents(false)}
                  title="Show caption and description"
                >
                  <GrClose />
                </button>
              </div>
              <GraphTitle filters={filtersState} activeTab={activeTab} />
              <div className="panels">
                <SearchField filters={filtersState} />
                <DescriptionPanel activeTab={activeTab} />
                <ClustersPanel
                  clusters={dataset.clusters}
                  filters={filtersState}
                  setClusters={(clusters) =>
                    setFiltersState((filters) => ({
                      ...filters,
                      clusters,
                    }))
                  }
                  toggleCluster={(cluster) => {
                    setFiltersState((filters) => ({
                      ...filters,
                      clusters: filters.clusters[cluster]
                        ? omit(filters.clusters, cluster)
                        : { ...filters.clusters, [cluster]: true },
                    }));
                  }}
                  activeTab={activeTab}
                />
              </div>
            </div>
          </>
        )}
      </SigmaContainer>
    </div>
  );
};

export default Root;
