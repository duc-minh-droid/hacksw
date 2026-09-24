'''
Builds the static data files the frontend loads from public/data/.

    python Frontend/data/build_data.py

public/data/fires.geojson
    CAL FIRE historic fire perimeters (https://data.ca.gov/dataset/california-fire-perimeters-all),
    queried from the ArcGIS FeatureServer with the same filter the hackathon scripts used
    (optimise.py: Shape__Area > 2,500,000) and server-side simplification instead of reduce.py.
    Only fires from 1950 onwards are kept (the range the timeline shows).

public/data/structures.json
    Damaged-structure points from location.json (CAL FIRE DINS, coordinates rounded to 0.01 deg),
    aggregated to [lng, lat, year, count] rows.
'''
import collections
import json
import os
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.join(HERE, '..', 'public', 'data')
LAYER = ('https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/'
         'California_Historic_Fire_Perimeters/FeatureServer/0/query')
PAGE = 2000


def fetch_fires():
    features, offset = [], 0
    while True:
        params = {
            'where': 'Shape__Area>2500000 AND YEAR_>=1950',
            'outFields': 'YEAR_,FIRE_NAME,GIS_ACRES,UNIT_ID',
            'outSR': 4326,
            'maxAllowableOffset': 0.004,
            'geometryPrecision': 3,
            'resultOffset': offset,
            'resultRecordCount': PAGE,
            'orderByFields': 'OBJECTID',
            'f': 'geojson',
        }
        with urllib.request.urlopen(f'{LAYER}?{urllib.parse.urlencode(params)}', timeout=120) as r:
            page = json.load(r)['features']
        features += [f for f in page if f.get('geometry')]
        print(f'fetched {len(features)} fires')
        if len(page) < PAGE:
            break
        offset += PAGE

    for f in features:
        p = f['properties']
        p.pop('OBJECTID', None)
        p['YEAR_'] = int(p['YEAR_']) if p.get('YEAR_') else None
        if p.get('GIS_ACRES'):
            p['GIS_ACRES'] = round(p['GIS_ACRES'])
        f['properties'] = {k: v for k, v in p.items() if v is not None}
    features = [f for f in features if f['properties'].get('YEAR_')]
    out = {'type': 'FeatureCollection', 'name': 'California_Fire_Perimeters', 'features': features}
    with open(os.path.join(PUBLIC, 'fires.geojson'), 'w', encoding='utf-8') as f:
        json.dump(out, f, separators=(',', ':'))


def build_structures():
    with open(os.path.join(HERE, 'location.json'), encoding='utf-8') as f:
        points = json.load(f)['data']
    counts = collections.Counter((round(p['Longitude'], 2), round(p['Latitude'], 2), p['YEAR_']) for p in points)
    rows = [[lng, lat, year, n] for (lng, lat, year), n in counts.items()]
    with open(os.path.join(PUBLIC, 'structures.json'), 'w', encoding='utf-8') as f:
        json.dump(rows, f, separators=(',', ':'))
    print(f'{len(points)} structures -> {len(rows)} points')


if __name__ == '__main__':
    os.makedirs(PUBLIC, exist_ok=True)
    build_structures()
    fetch_fires()
