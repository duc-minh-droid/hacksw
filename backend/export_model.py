'''
Recover the feature scaler used during training and export the model for the browser.

    python backend/export_model.py

1. Re-runs the preprocessing from californa-juypter/model2.ipynb on
   cleaned_dataset.csv (same label encoding, same 80/20 split, same seed) and
   fits StandardScaler on the training split -> backend/scaler.json
2. Checks the NumPy forward pass against the held-out test split.
3. Writes Frontend/public/model/burn-model.json (weights + scaler + label
   mappings) so the frontend can run the same model client-side in demo mode.

Needs pandas, scikit-learn, h5py, numpy.
'''
import json
import os
import sys

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, ROOT)

from backend.burn_model import BurnModel, _load_layers, SCALER_PATH  # noqa: E402
from backend.mapping import mappings  # noqa: E402

CSV = os.path.join(ROOT, 'californa-juypter', 'cleaned_dataset.csv')
OUT = os.path.join(ROOT, 'Frontend', 'public', 'model', 'burn-model.json')
BINNED = ['damage', 'street_type', 'fire_unit', 'structure_type', 'structure_category', 'roof_material',
          'eaves', 'exterior_siding', 'window_pane', 'attached_patio_material', 'attached_fence_material']


def preprocess():
    df = pd.read_csv(CSV)
    for column in BINNED:
        mapping = {unit: idx for idx, unit in enumerate(df[column].unique())}
        df[column] = df[column].map(mapping)
    df['year_built'] = pd.to_numeric(df['year_built'], errors='coerce')
    df['incident_year'] = pd.to_datetime(df['incident_start_date'], format='%m/%d/%Y %I:%M:%S %p').dt.year
    df['year_built'] = df['year_built'].fillna(df['year_built'].median())
    df['age'] = (df['incident_year'] - df['year_built']).astype(int)
    df = df.drop(columns=['incident_start_date', 'year_built', 'incident_year'])
    X = df.drop(columns=['damage'])
    y = df['damage']
    return X, y


def main():
    X, y = preprocess()
    print('feature order:', list(X.columns))
    X_train, X_test, _, y_test = train_test_split(X, y.values, test_size=0.2, random_state=42)
    scaler = StandardScaler().fit(X_train)

    with open(SCALER_PATH, 'w', encoding='utf-8') as f:
        json.dump({'features': list(X.columns), 'mean': scaler.mean_.tolist(), 'scale': scaler.scale_.tolist()}, f, indent=1)

    model = BurnModel()
    acc_scaled = (model.predict(X_test.values).argmax(1) == y_test).mean()
    acc_raw = (model.predict(X_test.values, scaled=True).argmax(1) == y_test).mean()
    print(f'test accuracy with recovered scaler: {acc_scaled:.3f}   without scaling (old API): {acc_raw:.3f}')

    def r(a):
        return np.round(a.astype(np.float64), 5).tolist()

    layers = []
    for layer in _load_layers():
        if layer[0] == 'dense':
            layers.append({'type': 'dense', 'kernel': r(layer[1]), 'bias': r(layer[2]), 'activation': layer[3]})
        else:
            layers.append({'type': 'bn', 'gamma': r(layer[1]), 'beta': r(layer[2]),
                           'mean': r(layer[3]), 'variance': r(layer[4]), 'epsilon': 1e-3})

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    payload = {
        'features': list(X.columns),
        'scaler': {'mean': scaler.mean_.tolist(), 'scale': scaler.scale_.tolist()},
        'mappings': {k: {str(i): v for i, v in m.items()} for k, m in mappings.items()},
        'layers': layers,
        'test_accuracy': round(float(acc_scaled), 4),
    }
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(payload, f, separators=(',', ':'))
    print('wrote', OUT, os.path.getsize(OUT) // 1024, 'KB')


if __name__ == '__main__':
    main()
