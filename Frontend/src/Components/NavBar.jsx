import React, { useState } from "react";
import { FaFireAlt, FaSearch, FaLayerGroup } from "react-icons/fa";
import { FaHouseFire, FaBuildingCircleExclamation } from "react-icons/fa6";
import FormModal from "./FormModal";
import { Tooltip } from "react-tooltip";


function NavBar({ setAddFireMode, addFireMode, setShowHouses }) {
  const [openModal, setOpenModal] = useState(false);

  return (
    <div className="flex gap-4 z-50 pointer-events-auto">
      <button
        data-tooltip-id="addFire"
        onClick={() => setAddFireMode(!addFireMode)}
        className={`flex items-center justify-center w-14 h-14 ${addFireMode ? 'bg-[#c82821] border-3 border-white' : 'bg-[#F95952]'
          } text-white rounded-full shadow-lg hover:bg-[#c82821] transition hover:cursor-pointer drop-shadow-4xl`}>
        <FaFireAlt size={24} />
      </button>
      <Tooltip id="addFire" effect="solid" place="bottom" content="Simulate Fire Spread" />

      {/* Marker Icon (Opens Modal) */}

      <button
        data-tooltip-id="willBurn"
        onClick={() => setOpenModal(true)}
        className="flex items-center justify-center w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition hover:cursor-pointer drop-shadow-4xl"
      >
        <FaHouseFire size={24} />
      </button>
      <Tooltip id="willBurn" effect="solid" place="bottom" content="How Will My House Burn?" />

      {/* Search Icon */}
      <button
        data-tooltip-id="addHouses"

        onClick={() => setShowHouses(prev => !prev)}
        className="flex items-center justify-center w-14 h-14 bg-[#e4b90c] text-white rounded-full shadow-lg hover:bg-[#F5890A] transition hover:cursor-pointer drop-shadow-4xl">
        <FaBuildingCircleExclamation size={24} />
      </button>
      <Tooltip id="addHouses" effect="solid" place="bottom" content="Toggle Structure Damage" />
      {/* 🔥 Modal */}
      <FormModal open={openModal} handleClose={() => setOpenModal(false)} />
    </div>
  );
}

export default NavBar;
