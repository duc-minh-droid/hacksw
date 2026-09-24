import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Slider from "@mui/material/Slider";
import PlayButton from "./PlayButton";

function TimeSlider({ yearBounds, setYearBounds, yearRange, perYear }) {
  const [minYear, maxYear] = yearRange;
  const minGap = 1; // Minimum 1-year gap

  const [isPlaying, setIsPlaying] = useState(false); // Controlled by play button

  const handleChange = (event, newValue) => {
    if (!Array.isArray(newValue)) return;
    let [start, end] = newValue;
    if (end - start < minGap) {
      if (start === yearBounds[0]) end = start + minGap;
      else start = end - minGap;
    }
    setYearBounds([Math.max(start, minYear), Math.min(end, maxYear)]);
  };

  // Play: sweep the end year from the start year forward, one year every 250 ms
  useEffect(() => {
    let intervalId;
    if (isPlaying) {
      setYearBounds(([start, end]) => (end >= maxYear ? [start, start] : [start, end]));
      intervalId = setInterval(() => {
        setYearBounds(([start, end]) => {
          if (end < maxYear) return [start, end + 1];
          clearInterval(intervalId);
          setIsPlaying(false);
          return [start, end];
        });
      }, 250);
    }
    return () => clearInterval(intervalId);
  }, [isPlaying, setYearBounds, maxYear]);

  const years = useMemo(() => {
    const out = [];
    for (let y = minYear; y <= maxYear; y++) out.push(y);
    return out;
  }, [minYear, maxYear]);
  const peak = Math.max(1, ...years.map((y) => perYear[y] || 0));

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[min(760px,60vw)] glass rounded-2xl px-5 pt-4 pb-2 pointer-events-auto"
    >
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-2 text-white">
          <span className="font-display text-2xl tabular-nums">{yearBounds[0]}</span>
          <span className="text-white/40">→</span>
          <span className="font-display text-2xl tabular-nums text-orange-300">{yearBounds[1]}</span>
        </div>
        <div className="text-[10px] uppercase tracking-wider text-white/45">Fires per year</div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="mt-2 flex h-10 items-end gap-[2px] px-[7px]">
            {years.map((y) => {
              const inRange = y >= yearBounds[0] && y <= yearBounds[1];
              return (
                <div
                  key={y}
                  title={`${y}: ${perYear[y] || 0} fires`}
                  className="flex-1 rounded-t-sm transition-colors duration-200"
                  style={{
                    height: `${Math.max(4, ((perYear[y] || 0) / peak) * 100)}%`,
                    background: inRange
                      ? `linear-gradient(to top, #e8452c, ${y === yearBounds[1] ? "#ffe08a" : "#ffb347"})`
                      : "rgba(255,255,255,0.12)",
                  }}
                />
              );
            })}
          </div>
          <Slider
            min={minYear}
            max={maxYear}
            step={1}
            value={yearBounds}
            onChange={handleChange}
            valueLabelDisplay="auto"
            disableSwap
            size="small"
            sx={{
              color: "#ff7a3d",
              mt: -0.5,
              "& .MuiSlider-thumb": { width: 14, height: 14, backgroundColor: "#fff", boxShadow: "0 0 0 4px rgba(255,122,61,0.3)" },
              "& .MuiSlider-rail": { opacity: 0.25, backgroundColor: "#fff" },
              "& .MuiSlider-valueLabel": { backgroundColor: "#1f1410", fontSize: 11 },
            }}
          />
        </div>
        <PlayButton isPlaying={isPlaying} setIsPlaying={setIsPlaying} />
      </div>
    </motion.div>
  );
}

export default TimeSlider;
