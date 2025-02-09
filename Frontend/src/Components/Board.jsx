import React, { useState } from 'react';
import InformationModal from './InformationModal';

function Board() {
  const [openDataModal, setOpenDataModal] = useState(false);

  return (
    <>
      <div className="p-3 rounded shadow-lg w-60 text-white pointer-events-auto bg-white/10 backdrop-blur-lg border border-white/20 w-3/5 p-3 rounded-lg pointer-events-auto drop-shadow-xl ">
        <div className="bg-white p-3 rounded shadow-lg w-60 text-black pointer-events-auto z-20">
          <h1>Wildfire Data</h1>
          <p>
            Visualizing historical fire data from the 1950s to 2025.
          </p>
          <button
            onClick={() => setOpenDataModal(true)}
            className="text-white mt-2 shadow-lg hover:underline transition">
            About the data
          </button>
        </div>
        {openDataModal && (
          <InformationModal
            open={openDataModal}
            handleClose={() => setOpenDataModal(false)}
            title="About the data"
            bodyText="Using ove 100,000 data points on fire building damage and 20,000 data points on historical fire data between 1950 and 2025."
          />
        )}
      </div>
    </>
  );
}

export default Board;
