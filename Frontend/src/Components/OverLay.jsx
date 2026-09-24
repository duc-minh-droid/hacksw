
import { AnimatePresence, motion } from "framer-motion";
import Slider from "./TimeSlider";
import Board from "./Board";
import NavBar from "./NavBar";
import SimulationPanel from "./SimulationPanel";
import { API_URL } from "../lib/api";

function OverLay({
  loading, addFireMode, setAddFireMode, yearBounds, setYearBounds, yearRange, perYear, stats,
  showHouses, setShowHouses, simulations, clearSimulations, hover,
}) {
  const latest = simulations[simulations.length - 1];
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-5 left-5">
        <Board stats={stats} yearBounds={yearBounds} />
      </div>

      <div className="absolute top-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
        <NavBar
          setAddFireMode={setAddFireMode}
          addFireMode={addFireMode}
          showHouses={showHouses}
          setShowHouses={setShowHouses}
          hasSimulations={simulations.length > 0}
          clearSimulations={clearSimulations}
        />
        <AnimatePresence>
          {addFireMode && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="glass rounded-full px-4 py-1.5 text-sm text-amber-100 flex items-center gap-2"
            >
              <span className="h-2 w-2 rounded-full bg-orange-400 animate-ping" />
              Click anywhere in California to start a fire
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute top-5 right-5">
        <AnimatePresence>{latest && <SimulationPanel key={latest.id} sim={latest} count={simulations.length} />}</AnimatePresence>
      </div>

      {hover && (
        <div
          className="absolute glass rounded-lg px-3 py-2 text-xs text-white/90 pointer-events-none"
          style={{ left: hover.x + 14, top: hover.y + 14 }}
        >
          <div className="font-semibold text-sm text-white">{hover.FIRE_NAME ? titleCase(hover.FIRE_NAME) : "Unnamed fire"}</div>
          <div className="text-white/60">
            {hover.YEAR_}
            {hover.GIS_ACRES ? ` · ${Number(hover.GIS_ACRES).toLocaleString()} acres` : ""}
            {hover.UNIT_ID ? ` · ${hover.UNIT_ID}` : ""}
          </div>
        </div>
      )}

      <Slider yearBounds={yearBounds} setYearBounds={setYearBounds} yearRange={yearRange} perYear={perYear} />

      <div className="absolute bottom-5 left-5 glass rounded-full px-3 py-1 text-[11px] text-white/70 pointer-events-auto flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${API_URL ? "bg-emerald-400" : "bg-amber-400"}`} />
        {API_URL ? "Connected to FireLine API" : "Demo mode · model runs in your browser"}
      </div>

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8 } }}
            className="absolute inset-0 bg-[#0b0f14] flex flex-col items-center justify-center gap-4"
          >
            <img src="/fire.svg" alt="" className="h-14 w-14 flicker" />
            <div className="font-display text-2xl tracking-wide text-white">FireLine</div>
            <div className="text-sm text-white/50">Loading 70 years of California fire perimeters…</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function titleCase(s) {
  return String(s).toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default OverLay;
