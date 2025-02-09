import json

# Input and output file paths
input_file = "califires(all).json"
output_file = "optimised_fires.json"

# Load the GeoJSON data
with open(input_file, "r", encoding="utf-8") as f:
    data = json.load(f)

# Ensure it's a valid FeatureCollection
if data.get("type") == "FeatureCollection" and "features" in data:
    # Filter features based on Shape_Area
    filtered_features = [
        feature for feature in data["features"]
        if feature.get("properties", {}).get("Shape__Area", 0) > 2500000
    ]

    # Create a new GeoJSON object
    optimised_data = {
        "type": "FeatureCollection",
        "features": filtered_features
    }

    # Write to output file
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(optimised_data, f, ensure_ascii=False, indent=2)

    print(f"Filtered GeoJSON saved to {output_file}. {len(filtered_features)} features retained.")
else:
    print("Invalid GeoJSON format. Ensure the input file is a valid FeatureCollection.")
