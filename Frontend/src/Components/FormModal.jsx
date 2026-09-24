import { useEffect, useState } from "react";
import Modal from "@mui/material/Modal";
import { motion } from "framer-motion";
import { predictBurn } from "../lib/api";
import { preloadModel } from "../lib/burnModel";

// Answer options per field. Labels must match backend/mapping.py (the encoding the model was trained with).
const options = {
  structure_type: [
    "Single Family Residence Single Story", "Single Family Residence Multi Story", "Multi Family Residence Single Story",
    "Multi Family Residence Multi Story", "Mobile Home Single Wide", "Mobile Home Double Wide", "Mobile Home Triple Wide",
    "Motor Home", "Mixed Commercial/Residential", "Commercial Building Single Story", "Commercial Building Multi Story",
    "Utility Misc Structure", "Infrastructure", "School", "Church", "Hospital", "Agriculture",
  ],
  structure_category: [
    "Single Residence", "Multiple Residence", "Mixed Commercial/Residential", "Nonresidential Commercial",
    "Other Minor Structure", "Infrastructure", "Agriculture",
  ],
  roof_material: ["Asphalt", "Tile", "Metal", "Concrete", "Wood", "Combustible", "Fire Resistant", "Other", "Unknown"],
  exterior_siding: ["Wood", "Stucco Brick Cement", "Metal", "Vinyl", "Ignition Resistant", "Combustible", "Fire Resistant", "Other", "Unknown"],
  eaves: ["Unenclosed", "Enclosed", "No Eaves", "Not Applicable", "Unknown"],
  window_pane: ["Single Pane", "Multi Pane", "No Windows", "Radiant Heat", "Unknown"],
  attached_patio_material: ["No Patio Cover/Carport", "Combustible", "Non Combustible", "Unknown"],
  attached_fence_material: ["No Fence", "Combustible", "Non Combustible", "Unknown"],
  street_type: [
    "Road", "Street", "Drive", "Lane", "Avenue", "Way", "Court", "Place", "Circle", "Boulevard", "Parkway", "Loop",
    "Trail", "Terrace", "Alley", "Route", "Hwy", "Grade", "Pass", "Dirt road", "Other",
  ],
  fire_unit: [
    "LNU", "AEU", "BTU", "SLU", "SKU", "SCU", "BEU", "LMU", "RRU", "BDU", "KRN", "NEU", "SHU", "TGU", "LAC", "MEU", "MVU",
    "HUU", "TUU", "FKU", "MMU", "CZU", "ORC", "VNC", "TCU", "SBC", "SDU",
  ],
};

const LABELS = {
  structure_type: "Structure type",
  structure_category: "Category",
  roof_material: "Roof",
  exterior_siding: "Exterior siding",
  eaves: "Eaves",
  window_pane: "Windows",
  attached_patio_material: "Patio / carport",
  attached_fence_material: "Attached fence",
  street_type: "Street type",
  fire_unit: "CAL FIRE unit",
};

const PRESETS = {
  "Old wooden cabin": {
    structure_type: "Single Family Residence Single Story", structure_category: "Single Residence", roof_material: "Wood",
    exterior_siding: "Combustible", eaves: "Unenclosed", window_pane: "Single Pane", attached_patio_material: "Combustible",
    attached_fence_material: "Combustible", street_type: "Road", fire_unit: "BTU", age: "65",
  },
  "Hardened new build": {
    structure_type: "Single Family Residence Multi Story", structure_category: "Single Residence", roof_material: "Tile",
    exterior_siding: "Stucco Brick Cement", eaves: "Enclosed", window_pane: "Multi Pane", attached_patio_material: "Non Combustible",
    attached_fence_material: "No Fence", street_type: "Court", fire_unit: "LAC", age: "3",
  },
};

const DAMAGE_COLORS = {
  "No Damage": "#34d399",
  "Affected (1-9%)": "#a3e635",
  "Minor (10-25%)": "#facc15",
  "Major (26-50%)": "#fb923c",
  "Destroyed (>50%)": "#ef4444",
  Inaccessible: "#94a3b8",
};

const emptyForm = Object.keys(options).reduce((acc, key) => ({ ...acc, [key]: "" }), { age: "" });

function FormModal({ open, handleClose }) {
  const [formData, setFormData] = useState(emptyForm);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) preloadModel();
  }, [open]);

  const complete = Object.values(formData).every((v) => v !== "");

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "age" && !/^\d*$/.test(value)) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await predictBurn(formData);
      const probs = res.probabilities[0];
      setResult({
        ...res,
        ranked: res.labels.map((label, i) => ({ label, p: probs[i] })).sort((a, b) => b.p - a.p),
      });
    } catch (e) {
      setError(`Prediction failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    handleClose();
    setTimeout(() => setResult(null), 300);
  };

  return (
    <Modal open={open} onClose={close} aria-labelledby="form-modal">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 glass-strong rounded-2xl w-[620px] max-h-[88vh] overflow-y-auto text-white outline-none">
        <div className="px-6 pt-5 pb-3 border-b border-white/10 flex items-start justify-between">
          <div>
            <h2 id="form-modal" className="font-display text-xl">Will my house burn?</h2>
            <p className="text-xs text-white/55 mt-0.5">
              Predicted damage if a wildfire reaches the building, from a model trained on ~100k CAL FIRE inspections.
            </p>
          </div>
          <button onClick={close} className="text-white/50 hover:text-white text-xl leading-none cursor-pointer">×</button>
        </div>

        {!result ? (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-6 py-4">
              <div className="flex items-center gap-2 mb-3 text-xs">
                <span className="text-white/45">Try:</span>
                {Object.keys(PRESETS).map((name) => (
                  <button
                    key={name}
                    data-preset={name}
                    onClick={() => setFormData(PRESETS[name])}
                    className="rounded-full border border-white/15 px-2.5 py-1 hover:bg-white/10 cursor-pointer"
                  >
                    {name}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {Object.entries(options).map(([key, values]) => (
                  <label key={key} className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-wider text-white/50">{LABELS[key]}</span>
                    <select name={key} value={formData[key]} onChange={handleChange} className="field">
                      <option value="" disabled>Select…</option>
                      {values.map((label) => (
                        <option key={label} value={label}>{label}</option>
                      ))}
                    </select>
                  </label>
                ))}
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-white/50">Building age (years)</span>
                  <input name="age" value={formData.age} onChange={handleChange} inputMode="numeric" placeholder="e.g. 30" className="field" />
                </label>
              </div>
              {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
              <button
                id="predict-button"
                disabled={!complete || busy}
                onClick={handleSubmit}
                className="mt-5 w-full rounded-xl py-2.5 font-medium bg-gradient-to-r from-orange-500 to-red-600 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition cursor-pointer shadow-[0_0_24px_rgba(255,110,50,0.35)]"
              >
                {busy ? "Running model…" : "Predict damage"}
              </button>
            </motion.div>
          ) : (
            <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-6 py-5">
              <div className="text-[10px] uppercase tracking-wider text-white/45">Most likely outcome</div>
              <div className="font-display text-3xl mt-1" style={{ color: DAMAGE_COLORS[result.predicted_damage] }}>
                {result.predicted_damage}
              </div>
              <div className="text-sm text-white/60">{(result.ranked[0].p * 100).toFixed(1)}% confidence</div>

              <div className="mt-5 space-y-2.5">
                {result.ranked.map(({ label, p }, i) => (
                  <div key={label} className="flex items-center gap-3 text-sm">
                    <span className="w-36 text-white/75">{label}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: DAMAGE_COLORS[label] }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(0.5, p * 100)}%` }}
                        transition={{ duration: 0.8, delay: 0.1 + i * 0.08, ease: "easeOut" }}
                      />
                    </div>
                    <span className="w-14 text-right tabular-nums text-white/70">{(p * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>

              <p className="mt-5 text-[11px] text-white/40">
                Model: 5 dense layers, 84.6% accuracy on a held-out 20% split.{" "}
                {result.engine === "api" ? "Served by the FastAPI backend." : "Running in your browser (no backend)."}{" "}
                It only knows construction details, not vegetation, slope or distance to the fire.
              </p>
              <div className="mt-4 flex gap-2">
                <button onClick={() => setResult(null)} className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/10 cursor-pointer">
                  Edit answers
                </button>
                <button onClick={close} className="rounded-xl px-4 py-2 text-sm text-white/60 hover:text-white cursor-pointer">Close</button>
              </div>
            </motion.div>
          )}
      </div>
    </Modal>
  );
}

export default FormModal;
