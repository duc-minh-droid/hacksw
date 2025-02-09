''''''
from fastapi import FastAPI
import numpy as np
from backend.mapping import mappings
from backend.input_class import BurnInput
from backend.burn_simulator_service import generate_nested_geojson_polygons
from backend.weather_service import get_weather, get_scale_factor
from tensorflow.keras.models import load_model
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all domains (change this to ["http://localhost:5173"] for security)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods
    allow_headers=["*"],  # Allows all headers
)
model = load_model('sequential-model-2.h5')

@app.get("/api/simulatePoints")
async def  simulate_points(latitude: float, longitude: float):
    '''
    Simulate the points based on the given latitude and longitude

    params
    - latitude: Latitude of the point
    - longitude: Longitude of the point

    returns [geojson] : The simulated simulated 7 circles
    '''
    # Get weather api data
    try:
        weather_data = get_weather(latitude, longitude)

        scale_factor:int = get_scale_factor(weather_data)

        direction:int = int(weather_data['wind_direction'])

        geojson =  generate_nested_geojson_polygons((latitude, longitude), scale_factor, direction)
        return geojson
    except Exception as e:
        return {"error": f"An error occurred: {e}"}

@app.post("/api/calculateBurn")
def calculate_burn(input_data: BurnInput):
    """
    Predict the burn classification (damage) based on the input data.
    """

    reversed_mappings = {k: {v: k for k, v in v.items()} for k, v in mappings.items()}

    # Encode the input data
    try:
        encoded_input = [
            reversed_mappings['street_type'][input_data.street_type],
            reversed_mappings['fire_unit'][input_data.fire_unit],
            reversed_mappings['structure_type'][input_data.structure_type],
            reversed_mappings['structure_category'][input_data.structure_category],
            reversed_mappings['roof_material'][input_data.roof_material],
            reversed_mappings['eaves'][input_data.eaves],
            reversed_mappings['exterior_siding'][input_data.exterior_siding],
            reversed_mappings['window_pane'][input_data.window_pane],
            reversed_mappings['attached_patio_material'][input_data.attached_patio_material],
            reversed_mappings['attached_fence_material'][input_data.attached_fence_material],
            input_data.age,
        ]

        # Convert input to a NumPy array and reshape for model prediction
        encoded_input = np.array(encoded_input).reshape(1, -1)

        # Predict with the model
        prediction = model.predict(encoded_input)
        predicted_class = prediction.argmax(axis=1)[0]

        # Decode the prediction to a readable class
        damage_mapping = {v: k for k, v in reversed_mappings['damage'].items()}
        predicted_label = damage_mapping[predicted_class]

        # Return the result
        return {"predicted_damage": predicted_label, "probabilities": prediction.tolist()}
    except KeyError as e:
        return {"error": f"Invalid input value: {e}"}
