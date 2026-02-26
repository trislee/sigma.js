import { FullScreenControl, SigmaContainer, ZoomControl } from "@react-sigma/core";
import Graph from "graphology";
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
import { IS_MOBILE } from "../is-mobile";

const VALID_TABS = ["speakers", "descriptions", "about"] as const;
type Tab = (typeof VALID_TABS)[number];

function getTabFromHash(): Tab {
  if (typeof window === "undefined") return "speakers";
  const hash = window.location.hash.slice(1);
  return VALID_TABS.includes(hash as Tab) ? (hash as Tab) : "speakers";
}

const Root: FC = () => {
  const graph = useMemo(() => new Graph(), []);
  const [showContents, setShowContents] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [filtersState, setFiltersState] = useState<FiltersState>({
    clusters: {},
  });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(getTabFromHash);
  const sigmaSettings: Partial<Settings> = useMemo(
    () => ({
      defaultDrawNodeLabel: drawLabel,
      defaultDrawNodeHover: drawHover,
      defaultEdgeColor: "#999",
      labelColor: { color: "#000" },
      labelDensity: 0.07,
      labelGridCellSize: 60,
      labelRenderedSizeThreshold: (dataset?.labelThreshold ?? 15) * (IS_MOBILE ? 0.5 : 1),
      labelFont: "Lato, sans-serif",
      zIndex: true,
      minEdgeThickness: IS_MOBILE ? 0.75 : 1.5,
    }),
    [dataset?.labelThreshold],
  );

  useEffect(() => {
    const currentHash = window.location.hash.slice(1);
    if (!currentHash || !VALID_TABS.includes(currentHash as Tab)) {
      window.history.replaceState(null, "", "#speakers");
    }

    const handleHashChange = () => {
      setActiveTab(getTabFromHash());
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
    setHoveredNode(null);
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
          {dataReady && (
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
          )}
          <GraphTitle filters={filtersState} activeTab={activeTab} dataReady={dataReady} />
          {dataReady && (
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
          )}
        </div>
      </SigmaContainer>
    </div>
  );
};

export default Root;
