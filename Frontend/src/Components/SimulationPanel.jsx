
import { motion } from "framer-motion";
import { FaTemperatureHigh, FaTint, FaWind } from "react-icons/fa";
import { RING_COLORS } from "../lib/simulator";

const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
const compass = (deg) => COMPASS[Math.round(((deg % 360) + 360) % 360 / 45) % 8];

const SOURCE_LABEL = {
  "open-meteo": "live weather · Open-Meteo",
  openweathermap: "live weather · OpenWeatherMap",
  demo: "sample weather (offline demo)",
};

function Reading({ icon, value, unit, label }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2">
      <div className="flex items-center gap-1.5 text-white/45 text-[10px] uppercase tracking-wider">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-display text-lg text-white leading-none">
        {value}
        <span className="text-xs text-white/50 ml-0.5">{unit}</span>
      </div>
    </div>
  );
}

function SimulationPanel({ sim, count }) {
  const w = sim.weather;
  const loading = sim.status === "loading";
  const downwind = w ? (w.wind_direction + 180) % 360 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className="glass rounded-2xl p-4 w-80 text-white pointer-events-auto"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-orange-300">Simulated ignition{count > 1 ? ` #${count}` : ""}</div>
          <div className="font-display text-lg leading-tight">
            {sim.lat.toFixed(3)}°N, {Math.abs(sim.lng).toFixed(3)}°W
          </div>
        </div>
        <span className="text-[10px] rounded-full bg-white/10 px-2 py-0.5 text-white/60">
          {sim.engine === "api" ? "FastAPI" : "in-browser"}
        </span>
      </div>

      {loading ? (
        <div className="mt-4 space-y-2">
          <div className="h-12 rounded-xl bg-white/5 animate-pulse" />
          <div className="h-24 rounded-xl bg-white/5 animate-pulse" />
          <div className="text-xs text-white/50">Fetching weather at the ignition point…</div>
        </div>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Reading icon={<FaTemperatureHigh />} label="Temp" value={Math.round(w.temperature)} unit="°C" />
            <Reading icon={<FaTint />} label="Humidity" value={Math.round(w.humidity)} unit="%" />
            <Reading icon={<FaWind />} label="Wind" value={w.wind_speed.toFixed(1)} unit="m/s" />
          </div>

          <div className="mt-3 flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-3">
            <div className="relative h-14 w-14 shrink-0 rounded-full border border-white/15">
              {["N", "E", "S", "W"].map((d, i) => (
                <span
                  key={d}
                  className="absolute text-[8px] text-white/40"
                  style={{
                    left: `${50 + 42 * Math.sin((i * Math.PI) / 2)}%`,
                    top: `${50 - 42 * Math.cos((i * Math.PI) / 2)}%`,
                    transform: "translate(-50%,-50%)",
                  }}
                >
                  {d}
                </span>
              ))}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ rotate: 0 }}
                animate={{ rotate: downwind }}
                transition={{ type: "spring", stiffness: 40, damping: 8 }}
              >
                <svg width="14" height="36" viewBox="0 0 14 36">
                  <path d="M7 0 L13 12 L8.5 10 L8.5 36 L5.5 36 L5.5 10 L1 12 Z" fill="#ffb347" />
                </svg>
              </motion.div>
            </div>
            <div className="text-xs text-white/65 leading-relaxed">
              Wind from <b className="text-white">{compass(w.wind_direction)}</b> ({Math.round(w.wind_direction)}°), so the
              fire&apos;s head runs <b className="text-orange-300">{compass(downwind)}</b>.
              <div className="text-[10px] text-white/40 mt-0.5">{SOURCE_LABEL[w.source] || w.source}</div>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex justify-between text-[10px] uppercase tracking-wider text-white/45">
              <span>Spread stages</span>
              <span>{sim.status === "done" ? "complete" : `stage ${sim.stage}/5`}</span>
            </div>
            <div className="mt-2 space-y-1.5">
              {sim.areas.map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="w-12 text-white/50">T+{i + 1}</span>
                  <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: RING_COLORS[i] }}
                      initial={{ width: 0 }}
                      animate={{ width: i < sim.stage ? `${Math.max(6, (a / sim.areas[4]) * 100)}%` : 0 }}
                      transition={{ duration: 0.7 }}
                    />
                  </div>
                  <span className="w-16 text-right tabular-nums text-white/75">{i < sim.stage ? `${a.toFixed(1)} km²` : "…"}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 text-[10px] text-white/35 leading-snug">
            Heuristic: heat, dryness and wind scale the burn area; shapes come from hand-made templates.
          </p>
        </>
      )}
    </motion.div>
  );
}

export default SimulationPanel;
