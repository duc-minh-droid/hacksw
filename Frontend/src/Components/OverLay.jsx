import React from "react";
import Slider from "./TimeSlider";
import Board from "./Board";
import NavBar from "./NavBar";


function OverLay({ addFireMode, setAddFireMode, yearBounds, setYearBounds, showHouses, setShowHouses }) {
  return (
    <div className="flex flex-col justify-between pointer-events-none w-full h-full">
      <div className="flex justify-between pointer-events-auto w-full p-5">
        <Board />
        <NavBar setAddFireMode={setAddFireMode} addFireMode={addFireMode} showHouses={showHouses} setShowHouses={setShowHouses} />
        <div className="w-60" />
      </div>

      {/* Bottom white bar */}
      <Slider yearBounds={yearBounds} setYearBounds={setYearBounds} />
    </div>
  );
}

export default OverLay;
