
import Modal from '@mui/material/Modal';

function InformationModal({ open, handleClose, title }) {
  return (
    <Modal open={open} onClose={handleClose}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 glass-strong rounded-2xl p-6 w-[440px] text-white outline-none">
        <h2 className="font-display text-xl mb-3">{title}</h2>
        <ul className="space-y-3 text-sm text-white/75">
          <li>
            <span className="text-orange-300 font-medium">Fire perimeters</span> — CAL FIRE historic fire perimeters
            (data.ca.gov), filtered to fires larger than 2.5 km² and simplified. About 5,500 fires from 1950 to 2025.
          </li>
          <li>
            <span className="text-sky-300 font-medium">Damaged structures</span> — CAL FIRE Damage Inspection (DINS)
            records: about 100,000 inspected buildings, 2013–2024, with construction details and damage level.
          </li>
          <li>
            <span className="text-amber-200 font-medium">Will my house burn?</span> — a small Keras network trained on the
            DINS records (84.6% test accuracy). It sees building materials and age, not location or weather.
          </li>
          <li>
            <span className="text-rose-300 font-medium">Spread simulation</span> — a hackathon heuristic, not a physics
            model: live weather sets the size, wind direction sets where the tail points.
          </li>
        </ul>
        <button onClick={handleClose} className="mt-5 text-xs text-white/60 hover:text-white cursor-pointer">Close</button>
      </div>
    </Modal>
  );
}

export default InformationModal;
