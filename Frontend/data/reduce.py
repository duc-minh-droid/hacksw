import json

# Input and output file paths
input_file = "optimised_fires.json"
output_file = "final_fires.json"

# Load the GeoJSON data
with open(input_file, "r", encoding="utf-8") as f:
    data = json.load(f)

# Function to reduce coordinate density
def simplify_coordinates(coordinates, step=10):
    """Keeps only 1 in every 'step' coordinate pairs."""
    return coordinates[::step]

# Process each feature
for feature in data.get("features", []):
    geometry = feature.get("geometry", {})
    
    if geometry.get("type") == "Polygon":
        # Simplify the outer boundary and inner rings (if any)
        geometry["coordinates"] = [simplify_coordinates(ring) for ring in geometry["coordinates"]]
    
    elif geometry.get("type") == "MultiPolygon":
        # Simplify each polygon in the MultiPolygon
        geometry["coordinates"] = [
            [simplify_coordinates(ring) for ring in polygon] 
            for polygon in geometry["coordinates"]
        ]

# Write to output file
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Optimised coordinate GeoJSON saved to {output_file}.")
