import React from "react";
import Modal from '@mui/material/Modal';

function InformationModal({ open, handleClose, title, bodyText }) {
    return (
        <Modal open={open}
        onClose={handleClose}>
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-white p-5 rounded shadow-lg w-80 pointer-events-auto  text-white bg-white/10 backdrop-blur-lg border border-white/20 w-3/5 p-3 rounded-lg drop-shadow-xl">
            <h2 className="text-xl font-bold mb-3">{title}</h2>
            <p>{bodyText}</p>
            </div>
        </Modal>
    );
}

export default InformationModal;
