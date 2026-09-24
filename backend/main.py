'''
FireLine API

    uvicorn backend.main:app --port 8119      (run from the repo root)
'''
import os

import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.mapping import mappings
from backend.input_class import BurnInput
from backend.burn_model import BurnModel
from backend.burn_simulator_service import generate_nested_geojson_polygons, downwind_bearing
from backend.weather_service import get_weather, get_scale_factor

app = FastAPI(title="FireLine API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# NumPy re-implementation of sequential-model-2.h5 (no TensorFlow needed), see burn_model.py
model = BurnModel()

FEATURES = ['street_type', 'fire_unit', 'structure_type', 'structure_category', 'roof_material', 'eaves',
            'exterior_siding', 'window_pane', 'attached_patio_material', 'attached_fence_material']
reversed_mappings = {k: {v: k for k, v in v.items()} for k, v in mappings.items()}


@app.get("/api/health")
def health():
    return {"ok": True}


def _simulate(latitude: float, longitude: float):
    weather_data = get_weather(latitude, longitude)
    scale_factor = get_scale_factor(weather_data)
    bearing = downwind_bearing(float(weather_data['wind_direction']))
    rings = generate_nested_geojson_polygons((latitude, longitude), scale_factor, bearing)
    return weather_data, scale_factor, rings


@app.get("/api/simulate")
def simulate(latitude: float, longitude: float):
    '''
    Simulate a fire started at (latitude, longitude).

    returns: the weather used, the scale factor, and 5 nested GeoJSON polygons (smallest first)
    '''
    weather_data, scale_factor, rings = _simulate(latitude, longitude)
    return {"weather": weather_data, "scale_factor": scale_factor, "rings": rings}


@app.get("/api/simulatePoints")
def simulate_points(latitude: float, longitude: float):
    '''Original hackathon endpoint: just the list of nested polygons.'''
    try:
        return _simulate(latitude, longitude)[2]
    except Exception as e:
        return {"error": f"An error occurred: {e}"}


@app.post("/api/calculateBurn")
def calculate_burn(input_data: BurnInput):
    """
    Predict the burn classification (damage) based on the input data.
    """
    try:
        encoded_input = [reversed_mappings[name][getattr(input_data, name)] for name in FEATURES]
        encoded_input.append(input_data.age)
    except KeyError as e:
        return {"error": f"Invalid input value: {e}"}

    prediction = model.predict(np.array(encoded_input, dtype=float).reshape(1, -1))
    predicted_class = int(prediction.argmax(axis=1)[0])
    labels = [mappings['damage'][i] for i in range(len(mappings['damage']))]
    return {
        "predicted_damage": labels[predicted_class],
        "probabilities": prediction.tolist(),
        "labels": labels,
    }
