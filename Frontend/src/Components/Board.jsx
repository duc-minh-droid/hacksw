import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import InformationModal from './InformationModal';

function formatBig(n) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return `${Math.round(n)}`;
}

function Stat({ label, value, accent }) {
  return (
    <div className="flex flex-col">
      <motion.span
        key={value}
        initial={{ opacity: 0.4, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        className={`font-display text-xl leading-none ${accent}`}
      >
        {value}
      </motion.span>
      <span className="mt-1 text-[10px] uppercase tracking-wider text-white/45">{label}</span>
    </div>
  );
}

function Board({ stats, yearBounds }) {
  const [openDataModal, setOpenDataModal] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      className="glass rounded-2xl p-4 w-72 text-white pointer-events-auto"
    >
      <div className="flex items-center gap-3">
        <img src="/fire.svg" alt="" className="h-9 w-9 flicker" />
        <div>
          <h1 className="font-display text-xl leading-tight">FireLine</h1>
          <p className="text-xs text-white/55">California wildfire explorer · HackSW 2025</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-3">
        <Stat label="Fires" value={stats ? stats.count.toLocaleString() : '–'} accent="text-orange-300" />
        <Stat label="Acres" value={stats ? formatBig(stats.acres) : '–'} accent="text-amber-200" />
        <Stat label="Structures" value={stats ? formatBig(stats.damaged) : '–'} accent="text-sky-300" />
      </div>
      <p className="mt-2 text-[11px] text-white/45">
        Perimeters over 2.5 km² between {yearBounds[0]} and {yearBounds[1]}
      </p>

      <button
        onClick={() => setOpenDataModal(true)}
        className="mt-3 text-xs text-orange-300 hover:text-orange-200 transition cursor-pointer"
      >
        About the data →
      </button>

      <AnimatePresence>
        {openDataModal && (
          <InformationModal
            open={openDataModal}
            handleClose={() => setOpenDataModal(false)}
            title="About the data"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Board;
