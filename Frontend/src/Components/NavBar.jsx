import { useState } from "react";
import { motion } from "framer-motion";
import { FaFireAlt, FaTrashAlt } from "react-icons/fa";
import { FaHouseFire, FaBuildingCircleExclamation } from "react-icons/fa6";
import FormModal from "./FormModal";

function ToolButton({ active, onClick, icon, label, activeClass, id }) {
  return (
    <motion.button
      id={id}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition cursor-pointer ${
        active ? activeClass : "text-white/80 hover:text-white hover:bg-white/10"
      }`}
    >
      {icon}
      <span>{label}</span>
    </motion.button>
  );
}

function NavBar({ setAddFireMode, addFireMode, showHouses, setShowHouses, hasSimulations, clearSimulations }) {
  const [openModal, setOpenModal] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass rounded-2xl p-1.5 flex gap-1 pointer-events-auto"
    >
      <ToolButton
        id="tool-fire"
        active={addFireMode}
        onClick={() => setAddFireMode(!addFireMode)}
        icon={<FaFireAlt size={15} className={addFireMode ? "" : "text-orange-400"} />}
        label="Simulate fire"
        activeClass="bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-[0_0_24px_rgba(255,110,50,0.55)]"
      />
      <ToolButton
        id="tool-house"
        active={openModal}
        onClick={() => setOpenModal(true)}
        icon={<FaHouseFire size={15} className="text-amber-300" />}
        label="Will my house burn?"
        activeClass="bg-white/15 text-white"
      />
      <ToolButton
        id="tool-structures"
        active={showHouses}
        onClick={() => setShowHouses((prev) => !prev)}
        icon={<FaBuildingCircleExclamation size={15} className={showHouses ? "" : "text-sky-300"} />}
        label="Damaged structures"
        activeClass="bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-[0_0_24px_rgba(56,189,248,0.5)]"
      />
      {hasSimulations && (
        <ToolButton
          id="tool-clear"
          onClick={clearSimulations}
          icon={<FaTrashAlt size={13} />}
          label="Clear"
          activeClass=""
        />
      )}
      <FormModal open={openModal} handleClose={() => setOpenModal(false)} />
    </motion.div>
  );
}

export default NavBar;
