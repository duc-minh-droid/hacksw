import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import "./map.css";
import californiaGeoJSON from "./cali.json";
import OverLay from "./OverLay";
import { baseStyle } from "../lib/mapStyle";
import { simulateFire } from "../lib/api";
import { ringAreaKm2, RING_COLORS } from "../lib/simulator";


const CALIFORNIA_BOUNDS = [[-138, 32], [-103, 43]];
const YEAR_MIN = 1950;
const YEAR_MAX = 2025;
const FORCE_DEMO_WEATHER = new URLSearchParams(window.location.search).has("demo");

const yearFilter = ([a, b]) => ["all", [">=", ["get", "YEAR_"], a], ["<=", ["get", "YEAR_"], b]];

export default function Map() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [fires, setFires] = useState(null);
  const [structures, setStructures] = useState(null);
  const [yearBounds, setYearBounds] = useState([YEAR_MIN, YEAR_MAX]);
  const [showHouses, setShowHouses] = useState(false);
  const [addFireMode, setAddFireMode] = useState(false);
  const addFireModeRef = useRef(addFireMode);
  const [simulations, setSimulations] = useState([]);
  const [hover, setHover] = useState(null);
  const markers = useRef([]);

  // ---- data ---------------------------------------------------------------
  useEffect(() => {
    fetch("/data/fires.geojson").then((r) => r.json()).then(setFires);
    fetch("/data/structures.json")
      .then((r) => r.json())
      .then((rows) =>
        setStructures({
          type: "FeatureCollection",
          features: rows.map(([lng, lat, year, count]) => ({
            type: "Feature",
            properties: { YEAR_: year, count },
            geometry: { type: "Point", coordinates: [lng, lat] },
          })),
        })
      );
  }, []);

  // ---- map ----------------------------------------------------------------
  useEffect(() => {
    if (map.current) return;
    map.current = new maptilersdk.Map({
      container: mapContainer.current,
      style: baseStyle(),
      maxBounds: CALIFORNIA_BOUNDS,
      minZoom: 5,
      maxZoom: 15,
      navigationControl: "bottom-right",
      geolocateControl: false,
      attributionControl: { compact: true },
    });
    window.__firelineMap = map.current; // handy from the devtools console (and used by the demo recorder)
    map.current.fitBounds([[-124.6, 32.4], [-114.1, 42.1]], { padding: { top: 90, bottom: 170, left: 40, right: 40 }, duration: 0 });

    map.current.on("load", () => {
      const m = map.current;
      m.addSource("california-border", { type: "geojson", data: californiaGeoJSON });
      m.addLayer({
        id: "california-border-glow",
        type: "line",
        source: "california-border",
        paint: { "line-color": "#ff7a3d", "line-width": 8, "line-blur": 8, "line-opacity": 0.35 },
      });
      m.addLayer({
        id: "california-border-layer",
        type: "line",
        source: "california-border",
        paint: { "line-color": "#ffb347", "line-width": 1.5, "line-opacity": 0.9 },
      });
      setMapReady(true);
    });
  }, []);

  useEffect(() => {
    addFireModeRef.current = addFireMode;
    if (map.current) map.current.getCanvas().style.cursor = addFireMode ? "crosshair" : "";
  }, [addFireMode]);

  // fire perimeters
  useEffect(() => {
    if (!mapReady || !fires) return;
    const m = map.current;
    m.addSource("cali_fires", { type: "geojson", data: fires, generateId: true });
    const color = ["interpolate", ["linear"], ["get", "YEAR_"], 1950, "#6d1a2a", 1985, "#b3302b", 2010, "#f05a2a", 2025, "#ffb13b"];
    m.addLayer({
      id: "cali_fires_layer",
      type: "fill",
      source: "cali_fires",
      paint: {
        "fill-color": color,
        // fade historic perimeters when zoomed in so simulated fires stay readable
        "fill-opacity": ["interpolate", ["linear"], ["zoom"],
          7, ["case", ["boolean", ["feature-state", "hover"], false], 0.85, 0.5],
          11, ["case", ["boolean", ["feature-state", "hover"], false], 0.55, 0.18]],
      },
    }, "california-border-glow");
    m.addLayer({
      id: "cali_fires_outline",
      type: "line",
      source: "cali_fires",
      paint: {
        "line-color": ["case", ["boolean", ["feature-state", "hover"], false], "#fff4d6", color],
        "line-width": ["case", ["boolean", ["feature-state", "hover"], false], 2, 0.6],
      },
    }, "california-border-glow");

    let hoveredId = null;
    m.on("mousemove", "cali_fires_layer", (e) => {
      if (addFireModeRef.current || !e.features.length) return;
      const f = e.features[0];
      if (hoveredId !== null) m.setFeatureState({ source: "cali_fires", id: hoveredId }, { hover: false });
      hoveredId = f.id;
      m.setFeatureState({ source: "cali_fires", id: hoveredId }, { hover: true });
      m.getCanvas().style.cursor = "pointer";
      setHover({ x: e.point.x, y: e.point.y, ...f.properties });
    });
    m.on("mouseleave", "cali_fires_layer", () => {
      if (hoveredId !== null) m.setFeatureState({ source: "cali_fires", id: hoveredId }, { hover: false });
      hoveredId = null;
      m.getCanvas().style.cursor = addFireModeRef.current ? "crosshair" : "";
      setHover(null);
    });
  }, [mapReady, fires]);

  // damaged structures (heatmap when zoomed out, dots when zoomed in)
  useEffect(() => {
    if (!mapReady || !structures) return;
    const m = map.current;
    m.addSource("locations", { type: "geojson", data: structures });
    m.addLayer({
      id: "structures-heat",
      type: "heatmap",
      source: "locations",
      maxzoom: 11,
      layout: { visibility: "none" },
      paint: {
        "heatmap-weight": ["interpolate", ["linear"], ["get", "count"], 1, 0.15, 60, 1],
        "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 5, 0.8, 10, 2.5],
        "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 5, 6, 10, 22],
        "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 9, 0.9, 11, 0],
        "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"],
          0, "rgba(0,0,0,0)", 0.2, "#3b82f6", 0.45, "#22d3ee", 0.7, "#e0f2fe", 1, "#ffffff"],
      },
    });
    m.addLayer({
      id: "blue-dots-layer",
      type: "circle",
      source: "locations",
      minzoom: 8,
      layout: { visibility: "none" },
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["get", "count"], 1, 2, 80, 6],
        "circle-color": "#38bdf8",
        "circle-stroke-color": "#e0f2fe",
        "circle-stroke-width": 0.8,
        "circle-opacity": ["interpolate", ["linear"], ["zoom"], 8, 0, 9.5, 0.9],
        "circle-stroke-opacity": ["interpolate", ["linear"], ["zoom"], 8, 0, 9.5, 0.9],
      },
    });
  }, [mapReady, structures]);

  useEffect(() => {
    if (!mapReady) return;
    const m = map.current;
    const filter = yearFilter(yearBounds);
    ["cali_fires_layer", "cali_fires_outline", "structures-heat", "blue-dots-layer"].forEach((id) => {
      if (m.getLayer(id)) m.setFilter(id, filter);
    });
  }, [mapReady, fires, structures, yearBounds]);

  useEffect(() => {
    if (!mapReady || !structures) return;
    ["structures-heat", "blue-dots-layer"].forEach((id) => {
      if (map.current.getLayer(id)) map.current.setLayoutProperty(id, "visibility", showHouses ? "visible" : "none");
    });
  }, [mapReady, structures, showHouses]);

  // ---- fire simulation ----------------------------------------------------
  const startFire = useCallback(async (lng, lat) => {
    const m = map.current;
    const id = `${Date.now()}`;
    const el = document.createElement("div");
    el.className = "ignition";
    el.innerHTML = '<span class="ignition-pulse"></span><span class="ignition-pulse delay"></span><img src="/3d-fire.png" alt="" />';
    const marker = new maptilersdk.Marker({ element: el }).setLngLat([lng, lat]).addTo(m);
    markers.current.push(marker);

    setSimulations((s) => [...s, { id, lat, lng, status: "loading" }]);
    setAddFireMode(false);

    const result = await simulateFire(lat, lng, { demoWeather: FORCE_DEMO_WEATHER });
    const rings = result.rings;
    const outer = rings[rings.length - 1].geometry.coordinates[0];
    const lngs = outer.map((p) => p[0]);
    const lats = outer.map((p) => p[1]);
    m.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], {
      padding: { top: 150, bottom: 230, left: 380, right: 420 },
      maxZoom: 12.5,
      duration: 1800,
    });

    setSimulations((s) =>
      s.map((sim) =>
        sim.id === id
          ? { ...sim, ...result, status: "spreading", stage: 0, areas: rings.map((r) => ringAreaKm2(r.geometry.coordinates[0])) }
          : sim
      )
    );

    await new Promise((r) => setTimeout(r, 1400));
    for (let i = 0; i < rings.length; i++) {
      const src = `sim-${id}-${i}`;
      m.addSource(src, { type: "geojson", data: rings[i] });
      const before = i === 0 ? undefined : `sim-${id}-${i - 1}-fill`;
      m.addLayer({
        id: `${src}-fill`,
        type: "fill",
        source: src,
        paint: { "fill-color": RING_COLORS[i], "fill-opacity": 0, "fill-opacity-transition": { duration: 900 } },
      }, before);
      m.addLayer({
        id: `${src}-line`,
        type: "line",
        source: src,
        paint: { "line-color": RING_COLORS[i], "line-width": 1.5, "line-opacity": 0, "line-opacity-transition": { duration: 900 } },
      }, before);
      requestAnimationFrame(() => {
        m.setPaintProperty(`${src}-fill`, "fill-opacity", i === 0 ? 0.8 : 0.5);
        m.setPaintProperty(`${src}-line`, "line-opacity", 0.9);
      });
      setSimulations((s) => s.map((sim) => (sim.id === id ? { ...sim, stage: i + 1 } : sim)));
      await new Promise((r) => setTimeout(r, 750));
    }
    setSimulations((s) => s.map((sim) => (sim.id === id ? { ...sim, status: "done" } : sim)));
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    const m = map.current;
    const onClick = (e) => {
      if (addFireModeRef.current) startFire(e.lngLat.lng, e.lngLat.lat);
    };
    m.on("click", onClick);
    return () => m.off("click", onClick);
  }, [mapReady, startFire]);

  const clearSimulations = () => {
    const m = map.current;
    simulations.forEach((sim) => {
      for (let i = 0; i < 5; i++) {
        const src = `sim-${sim.id}-${i}`;
        [`${src}-fill`, `${src}-line`].forEach((l) => m.getLayer(l) && m.removeLayer(l));
        if (m.getSource(src)) m.removeSource(src);
      }
    });
    markers.current.forEach((mk) => mk.remove());
    markers.current = [];
    setSimulations([]);
  };

  // ---- stats for the overlay ----------------------------------------------
  const perYear = useMemo(() => {
    const counts = {};
    if (fires) for (const f of fires.features) counts[f.properties.YEAR_] = (counts[f.properties.YEAR_] || 0) + 1;
    return counts;
  }, [fires]);

  const stats = useMemo(() => {
    if (!fires) return null;
    const [a, b] = yearBounds;
    let count = 0, acres = 0, damaged = 0;
    for (const f of fires.features) {
      const y = f.properties.YEAR_;
      if (y >= a && y <= b) {
        count++;
        acres += f.properties.GIS_ACRES || 0;
      }
    }
    if (structures) for (const s of structures.features) if (s.properties.YEAR_ >= a && s.properties.YEAR_ <= b) damaged += s.properties.count;
    return { count, acres, damaged };
  }, [fires, structures, yearBounds]);

  return (
    <div className="map-wrap">
      <div ref={mapContainer} className="map" />
      <OverLay
        loading={!mapReady || !fires}
        setAddFireMode={setAddFireMode}
        addFireMode={addFireMode}
        yearBounds={yearBounds}
        setYearBounds={setYearBounds}
        yearRange={[YEAR_MIN, YEAR_MAX]}
        perYear={perYear}
        stats={stats}
        showHouses={showHouses}
        setShowHouses={setShowHouses}
        simulations={simulations}
        clearSimulations={clearSimulations}
        hover={hover}
      />
    </div>
  );
}
