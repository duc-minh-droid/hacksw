import React, { useEffect, useState } from "react";
import Slider from "@mui/material/Slider";
import PlayButton from "./PlayButton";

function TimeSlider({ yearBounds, setYearBounds }) {
  const minYear = 1950;
  const maxYear = 2025;
  const minGap = 1; // Minimum 1-year gap

  const [isPlaying, setIsPlaying] = useState(false); // Controlled by play button

  const handleChange = (event, newValue) => {
    if (!Array.isArray(newValue)) return; // Ensure newValue is an array

    let [start, end] = newValue;

    // Ensure a minimum gap of 1 year
    if (end - start < minGap) {
      if (start === yearBounds[0]) {
        end = start + minGap;
      } else {
        start = end - minGap;
      }
    }

    // Keep values within bounds
    start = Math.max(start, minYear);
    end = Math.min(end, maxYear);

    setYearBounds([start, end]);
  };

  useEffect(() => {
    let intervalId;

    if (isPlaying) {
      setYearBounds((prevBounds) => {
        const [start, currentYear] = prevBounds;
        return currentYear === maxYear ? [minYear, minYear] : prevBounds;
      });

      intervalId = setInterval(() => {
        setYearBounds((prevBounds) => {
          const [start, currentYear] = prevBounds;
          if (currentYear < maxYear) {
            return [start, currentYear + 1];
          } else {
            clearInterval(intervalId);
            setIsPlaying(false);
            return prevBounds;
          }
        });
      }, 250);
    }
    return () => clearInterval(intervalId);
  }, [isPlaying, setYearBounds]);

  return (
    <div className="h-26 absolute bottom-5 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-lg border border-white/20 w-3/5 p-3 rounded-lg shadow-lg text-center pointer-events-auto drop-shadow-xl">
      <div className="flex items-center justify-between px-2 space-x-4">
        <Slider
          min={minYear}
          max={maxYear}
          step={1}
          value={yearBounds}
          onChange={handleChange}
          valueLabelDisplay="auto"
          valueLabelFormat={(val) => `${val}`}
          style={{ color: "#F95952" }}
          disableSwap
        />

        <PlayButton isPlaying={isPlaying} setIsPlaying={setIsPlaying} />
      </div>

      <div className="mt-2 flex justify-between text-sm text-white-700 ">
        <span>Start: {yearBounds[0]}</span>
        <span>End: {yearBounds[1]}</span>
      </div>
    </div>
  );
}

export default TimeSlider;
