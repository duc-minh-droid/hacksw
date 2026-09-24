
import { FaPlay, FaPause } from 'react-icons/fa';

function PlayButton({ isPlaying, setIsPlaying }) {
  return (
    <button
      id="play-button"
      onClick={() => setIsPlaying(!isPlaying)}
      aria-label={isPlaying ? "Pause" : "Play timeline"}
      className="flex shrink-0 items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-[0_0_20px_rgba(255,110,50,0.45)] hover:brightness-110 transition cursor-pointer"
    >
      {isPlaying ? <FaPause className="h-4 w-4" /> : <FaPlay className="h-4 w-4 ml-0.5" />}
    </button>
  );
}

export default PlayButton;
