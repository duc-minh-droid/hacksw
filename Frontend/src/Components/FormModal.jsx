import React, { useState } from "react";
import axios from "axios";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import { ToastContainer, toast } from 'react-toastify';

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
  maxHeight: "80vh",
  overflowY: "auto",
};

// All the question options (mappings for each field)
const options = {
  street_type: {
    0: "Road",
    1: "Lane",
    2: "Other",
    3: "Trail",
    4: "Drive",
    5: "Street",
    6: "None",
    7: "Way",
    8: "Avenue",
    9: "Court",
    10: "Loop",
    11: "Route",
    12: "Place",
    13: "Alley",
    14: "Terrace",
    15: "Circle",
    16: "Boulevard",
    17: "Parkway",
    19: " ",
    20: "Hwy",
    21: "Dirt road",
    22: "-",
    23: "not given",
    24: "Grade",
    25: "Ext.",
    26: "not noted",
    27: "Unk",
    28: "Pass",
  },
  fire_unit: {
    0: "LNU",
    1: "AEU",
    2: "BTU",
    3: "SLU",
    4: "SKU",
    5: "SCU",
    6: "BEU",
    7: "LMU",
    8: "RRU",
    9: "BDU",
    10: "KRN",
    11: "NEU",
    12: "SHU",
    13: "TGU",
    14: "LAC",
    15: "MEU",
    16: "MVU",
    17: "HUU",
    18: "TUU",
    19: "FKU",
    20: "MMU",
    21: "CZU",
    22: "ORC",
    23: "VNC",
    24: "TCU",
    25: "SBC",
    26: "SDU",
  },
  structure_type: {
    0: "Single Family Residence Multi Story",
    1: "Single Family Residence Single Story",
    2: "Utility Misc Structure",
    3: "Mobile Home Double Wide",
    4: "Motor Home",
    5: "Multi Family Residence Multi Story",
    6: "Commercial Building Single Story",
    7: "Mobile Home Single Wide",
    8: "Mixed Commercial/Residential",
    9: "Mobile Home Triple Wide",
    10: "Infrastructure",
    11: "School",
    12: "Multi Family Residence Single Story",
    13: "Commercial Building Multi Story",
    14: "Church",
    15: "Hospital",
    16: "Agriculture",
    17: "Single Famliy Residence Single Story",
    18: "Utility or Miscellaneous Structure > 120 sqft",
  },
  structure_category: {
    0: "Single Residence",
    1: "Other Minor Structure",
    2: "Multiple Residence",
    3: "Nonresidential Commercial",
    4: "Mixed Commercial/Residential",
    5: "Infrastructure",
    6: "Agriculture",
  },
  roof_material: {
    0: "Asphalt",
    1: "Tile",
    2: "Unknown",
    3: "Metal",
    4: "Concrete",
    5: "Other",
    6: "Wood",
    7: " ",
    8: "Combustible",
    9: "Fire Resistant",
    11: "No Deck/Porch",
  },
  eaves: {
    0: "Unenclosed",
    1: "Enclosed",
    2: "Unknown",
    3: "No Eaves",
    4: " ",
    5: "Not Applicable",
  },
  exterior_siding: {
    0: "Wood",
    1: "Stucco Brick Cement",
    2: "Unknown",
    3: "Metal",
    4: "Other",
    5: "Vinyl",
    6: "Ignition Resistant",
    7: "Combustible",
    8: " ",
    9: "Fire Resistant",
    11: "Stucco/Brick/Cement",
  },
  window_pane: {
    0: "Single Pane",
    1: "Multi Pane",
    2: "Unknown",
    3: "No Windows",
    4: " ",
    6: "No Deck/Porch",
    7: "Radiant Heat",
  },
  attached_patio_material: {
    0: "No Patio Cover/Carport",
    1: "Combustible",
    2: "Unknown",
    3: "Non Combustible",
    4: " ",
  },
  attached_fence_material: {
    0: "No Fence",
    1: "Combustible",
    2: "Unknown",
    3: "Non Combustible",
  },
};

function FormModal({ open, handleClose }) {
  // Build initial state with each option field set to an empty string and include "age"
  const initialFormState = Object.keys(options).reduce(
    (acc, key) => ({ ...acc, [key]: "" }),
    { age: "" }
  );

  const [formData, setFormData] = useState(initialFormState);
  const [responseMessage, setResponseMessage] = useState("");
  const [responseModalOpen, setResponseModalOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // For the age field, allow only digits (positive numbers)
    if (name === "age" && !/^\d*$/.test(value)) {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      // Send the form data as JSON to your endpoint
      const response = await axios.post(
        "http://127.0.0.1:8000/api/calculateBurn",
        JSON.stringify(formData),
        { headers: { "Content-Type": "application/json" } }
      );
      toast.success(`Predicted Damage: ${response.data.predicted_damage}`, {
        position: "top-right",
        autoClose: 5000, // Auto close after 5 seconds
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setResponseMessage(response.data.damage);
      console.log("Server Response:", response.data);
      // Clear the form after successful submission
      setFormData(initialFormState);
      // Optionally, close the modal
      handleClose();
    } catch (error) {
      console.error("Error sending data:", error);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} aria-labelledby="form-modal">
      <Box sx={style}>
        <Button sx={{color: "red"}}>Will My House Burn?</Button>

        {/* Age Input Field */}
        <TextField
          label="Age"
          type="number"
          name="age"
          value={formData.age}
          onChange={handleChange}
          fullWidth
          margin="normal"
          inputProps={{ min: "1" }} // Only allow positive numbers
        />

        {/* Render a dropdown for each field in the options object */}
        {Object.entries(options).map(([key, values]) => (
          <FormControl fullWidth sx={{ mb: 2 }} key={key}>
            <InputLabel>{key.replace("_", " ").toUpperCase()}</InputLabel>
            <Select name={key} value={formData[key]} onChange={handleChange}>
              {Object.entries(values).map(([value, label]) => (
                <MenuItem key={value} value={label}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ))}

        <Button variant="contained" color="primary" fullWidth onClick={handleSubmit}>
          Submit
        </Button>

        
      </Box>
    </Modal>
  );
}

export default FormModal;
