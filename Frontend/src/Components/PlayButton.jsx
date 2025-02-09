import React from "react";
import { FaPlay, FaPause } from 'react-icons/fa';

function PlayButton({ isPlaying, setIsPlaying }) {
  return (
    <button
      onClick={() => setIsPlaying(!isPlaying)}
      className="flex items-center justify-center w-12 h-12 text-[#F95952] rounded-full hover:opacity-80 transition"
    >
      {isPlaying ? (
        <FaPause className="h-6 w-6" />
      ) : (
        <FaPlay className="h-6 w-6" />
      )}
    </button>
  );
}

export default PlayButton;
