import json
import sys
from shapely.geometry import shape, mapping, Polygon, MultiPolygon
from shapely.geometry.polygon import orient

def fix_geometry(geom):
    """
    Reorient polygons and multipolygons so that their exterior rings are
    clockwise (i.e. following the right-hand rule) and holes are counterclockwise.
    """
    # Convert the GeoJSON geometry to a Shapely geometry
    shapely_geom = shape(geom)

    if isinstance(shapely_geom, Polygon):
        # Use sign=-1.0 to force exterior ring clockwise
        fixed = orient(shapely_geom, sign=-1.0)
        return mapping(fixed)

    if isinstance(shapely_geom, MultiPolygon):
        fixed_polys = []
        for poly in shapely_geom.geoms:  # <--- Use the geoms attribute
            fixed = orient(poly, sign=-1.0)
            fixed_polys.append(fixed)
        fixed_multi = MultiPolygon(fixed_polys)
        return mapping(fixed_multi)


    # If the geometry is not a polygon/multipolygon, return as is.
    return geom

def fix_geojson(data):
    """
    Fixes the GeoJSON data by:
      - Removing the 'crs' property if it exists.
      - Reorienting all Polygon and MultiPolygon geometries.
    """
    # Remove deprecated CRS member if present
    if "crs" in data:
        print("Removing 'crs' member...")
        data.pop("crs")

    # Check if this is a FeatureCollection
    if data.get("type") == "FeatureCollection" and "features" in data:
        for feature in data["features"]:
            geom = feature.get("geometry")
            if geom and geom.get("type") in ["Polygon", "MultiPolygon"]:
                feature["geometry"] = fix_geometry(geom)
    # If the data is a single Feature
    elif data.get("type") == "Feature":
        geom = data.get("geometry")
        if geom and geom.get("type") in ["Polygon", "MultiPolygon"]:
            data["geometry"] = fix_geometry(geom)
    # Or if the data is just a geometry
    elif data.get("type") in ["Polygon", "MultiPolygon"]:
        data = fix_geometry(data)

    return data

def main(input_path, output_path):
    # Load the GeoJSON data
    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print("Fixing GeoJSON...")
    fixed_data = fix_geojson(data)

    # Write the fixed data to the output file
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(fixed_data, f, ensure_ascii=False, indent=2)

    print(f"Fixed GeoJSON saved to {output_path}")

if __name__ == '__main__':
    input_file = 'califires(all).json'
    output_file = 'fixed_cali_fires(all).json'
    main(input_file, output_file)