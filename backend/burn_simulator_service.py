'''
Simulator service for generating GeoJSON polygons representing fire spread shapes.
'''
import math
import json
import random
from shapely.geometry import Polygon, mapping, shape
from shapely.affinity import rotate, scale, translate

def _generate_fire_spread_template(num_points=40, base_radius=1, tail_factor=1.5,
                                    tail_angle_range=(math.radians(60), math.radians(120))):
    """
    Generates a rounded polygon that mimics a fire spread shape.
    
    Parameters:
        - num_points: Number of vertices to create
        - base_radius: The base radius of the circle
        - tail_factor: Multiplier for the radius within the tail region
        - tail_angle_range: (min_angle, max_angle) in radians where the tail extension is applied
    
    Returns:
        - A list of (x,y) tuples representing the polygon’s vertices
    """
    coords = []
    for i in range(num_points):
        angle = 2 * math.pi * i / num_points
        # If the point is in the tail region, extend its radius.
        if tail_angle_range[0] <= angle <= tail_angle_range[1]:
            r = base_radius * tail_factor
        else:
            r = base_radius
        # Optional: Add a small random irregularity for a natural look.
        r *= (1 + random.uniform(-0.05, 0.05))
        x = r * math.cos(angle)
        y = r * math.sin(angle)
        coords.append((x, y))
    # Ensure the polygon is closed by appending the first point at the end.
    coords.append(coords[0])
    return coords
import math

def generate_fire_v_polygon(centroid=(0, 0), 
                            length_front=10.0, 
                            width_front=4.0, 
                            length_sides=5.0, 
                            width_sides=2.0,
                            direction=math.radians(90)):
    """
    Generates a V-shaped fire spread polygon centered at the specified centroid.

    Parameters:
        - centroid: Tuple (x, y) for the center of the polygon.
        - length_front: Length of the front section.
        - width_front: Maximum width at the front section.
        - length_sides: Length of the tapering sides.
        - width_sides: Maximum width at the sides.
        - direction: Direction (in radians) the polygon is pointing towards.

    Returns:
        - A list of (x, y) tuples representing the polygon vertices.
    """
    cx, cy = centroid
    dir_x = math.cos(direction)
    dir_y = math.sin(direction)
    
    # Calculate the main directional vectors
    perp_dir_x = -math.sin(direction)  # Perpendicular to direction
    perp_dir_y = math.cos(direction)
    
    # Compute vertices
    vertices = [
        # Back vertices (base of the V)
        (cx - dir_x * length_sides - perp_dir_x * width_sides / 2,
         cy - dir_y * length_sides - perp_dir_y * width_sides / 2),
        (cx - dir_x * length_sides + perp_dir_x * width_sides / 2,
         cy - dir_y * length_sides + perp_dir_y * width_sides / 2),
        
        # Front vertices (tip of the V)
        (cx + dir_x * length_front + perp_dir_x * width_front / 2,
         cy + dir_y * length_front + perp_dir_y * width_front / 2),
        (cx + dir_x * length_front - perp_dir_x * width_front / 2,
         cy + dir_y * length_front - perp_dir_y * width_front / 2),
        
        # Back to base to close the polygon
        (cx - dir_x * length_sides + perp_dir_x * width_sides / 2,
         cy - dir_y * length_sides + perp_dir_y * width_sides / 2),
    ]
    
    return vertices


# Create template shapes
TEMPLATES = {
    1: _generate_fire_spread_template(num_points=40, base_radius=1, tail_factor=1.5, tail_angle_range=(math.radians(60), math.radians(120))),
    2: _generate_fire_spread_template(num_points=40, base_radius=1, tail_factor=1.3, tail_angle_range=(math.radians(30), math.radians(90))),
    3: _generate_fire_spread_template(num_points=40, base_radius=1, tail_factor=1.4, tail_angle_range=(math.radians(80), math.radians(140))),
    4: _generate_fire_spread_template(num_points=40, base_radius=1, tail_factor=1.6, tail_angle_range=(math.radians(50), math.radians(110))),
    5: _generate_fire_spread_template(num_points=40, base_radius=1, tail_factor=1.2, tail_angle_range=(math.radians(70), math.radians(130))),
    6: _generate_fire_spread_template(num_points=40, base_radius=1, tail_factor=1.7, tail_angle_range=(math.radians(40), math.radians(100))),
    7: _generate_fire_spread_template(num_points=40, base_radius=1, tail_factor=1.5, tail_angle_range=(math.radians(90), math.radians(150))),
    8: _generate_fire_spread_template(num_points=40, base_radius=1, tail_factor=1.3, tail_angle_range=(math.radians(20), math.radians(80))),
    9: _generate_fire_spread_template(num_points=40, base_radius=1, tail_factor=1.4, tail_angle_range=(math.radians(100), math.radians(160))),
    11: [(-2.0, -0.07142857142857142), (-1.0, 0.42857142857142855), (1.0, 0.9285714285714286), (2.0, -0.07142857142857142),(1.0, -1.0714285714285714), (-1.0, -0.5714285714285714),(-2.0, -0.07142857142857142)],
    12: [(-2.22, 0.0), (-1.22, 0.5), (0.78, 1.0), (1.78, 0.0), (0.78, -1.0), (-1.22, -0.5), (-2.22, 0.0)],
    13: [(0.0, 1.0), (0.87, 0.5), (0.87, -0.5), (0.0, -1.0), (-0.87, -0.5), (-0.87, 0.5), (0.0, 1.0)],
    14:[(-2.0, 0.0), (-1.0, 1.0), (1.0, 1.0), (2.0, 0.0), (1.0, -1.0), (-1.0, -1.0), (-2.0, 0.0)],
    15:[(-2.0, 0.0), (-1.0, 1.0), (0.0, -1.0), (1.0, 1.0), (2.0, 0.0), (1.0, -1.0), (0.0, 1.0), (-1.0, -1.0), (-2.0, 0.0)]
}

def generate_geojson_polygon(center, scale_factor, tail_direction_degrees):
    """
    Generate a GeoJSON Feature for a polygon that has been scaled, rotated, 
    and translated.

    Parameters:
        - center: a tuple (latitude, longitude) for the center point.
        - scale_factor: a number by which to scale the shape.
        - tail_direction_degrees: the angle (in degrees) to rotate the shape 
                                    so that the tail points in wind direction.

    Returns:
        - A dictionary in GeoJSON Feature format.
    """
    # Pick a random shape from our templates.
    shape_id = random.randint(1, len(TEMPLATES))
    template = TEMPLATES.get(shape_id)
    if template is None:
        raise ValueError(f"Shape id {shape_id} is not defined.")
    # Create the polygon from the template.
    poly = Polygon(template)
    # Scale the polygon (centered at (0, 0)).
    poly_scaled = scale(poly, xfact=scale_factor, yfact=scale_factor, origin=(0, 0))
    # Rotate the polygon.
    poly_rotated = rotate(poly_scaled, tail_direction_degrees, origin=(0, 0), use_radians=False)
    # Translate the polygon.
    poly_translated = translate(poly_rotated, xoff=center[1], yoff=center[0])
    geometry = mapping(poly_translated)
    feature = {
        "type": "Feature",
        "properties": {
            "shape_id": shape_id,
            "scale_factor": scale_factor,
            "tail_direction": tail_direction_degrees
        },
        "geometry": geometry
    }
    return feature

def generate_nested_geojson_polygons(center, scale_factor, tail_direction_degrees, num_nested=5):
    """
    Generate a list of nested GeoJSON polygon features. 

    Parameters:
        - center: tuple (latitude, longitude) for the polygon center.
        - scale_factor: scale factor for the outer polygon.
        - tail_direction_degrees: rotation angle for the outer polygon.
        - num_nested: number of nested polygons to generate. The largest (at scale 1.0)
                        will be identical to the outer polygon.

    Returns:
        - A list of GeoJSON Feature dictionaries representing the nested polygons.
    """
    scale_factor =+ random.uniform(0.005, 0.03)
    # Generate the outer polygon.
    outer_feature = generate_geojson_polygon(center, scale_factor, tail_direction_degrees)
    # Convert GeoJSON geometry back to a shapely geometry.
    outer_poly = shape(outer_feature["geometry"])
    centroid = outer_poly.centroid

    nested_features = []
    # Choose scale fractions that increase linearly.
    for i in range(1, num_nested + 1):
        fraction = i / num_nested
        # Scale the outer polygon about its centroid.
        nested_poly = scale(outer_poly, xfact=fraction, yfact=fraction, origin=centroid)
        nested_feature = {
            "type": "Feature",
            "properties": {
                "nested_index": i,
                "scale_fraction": fraction
            },
            "geometry": mapping(nested_poly)
        }
        nested_features.append(nested_feature)
    return nested_features

# Local testing usage:
if __name__ == '__main__':
    center_point = (-122.91,41.53)
    TEMP_SCALE_FACTOR = 0.03
    TEMP_TAIL_DIRECTION = 0
    geojson_feature = generate_geojson_polygon(center_point, TEMP_SCALE_FACTOR, TEMP_TAIL_DIRECTION)
    geojson_feature_collection = {
        "type": "FeatureCollection",
        "features": [geojson_feature]
    }

    # Print out the GeoJSON.
    print(json.dumps(geojson_feature_collection, indent=2))
