"""
Simple CLI predictor that reads JSON from stdin and writes JSON { prediction: ... } to stdout.

Input example (stdin):
  { "area_m2": 2500, "ndvi_mean": 0.12, "landType": "Agricultural", "soilType": "Black Cotton Soil" }

Ensure `ml/models/price_model.json` and `ml/models/feature_columns.json` exist (created by training script).
"""
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from xgboost import XGBRegressor


MODEL_DIR = Path(__file__).resolve().parent / 'models'


def load_model():
    model_path = MODEL_DIR / 'price_model.json'
    feature_path = MODEL_DIR / 'feature_columns.json'
    if not model_path.exists() or not feature_path.exists():
        print(json.dumps({'error': 'model not found'}))
        sys.exit(2)

    model = XGBRegressor()
    model.load_model(str(model_path))

    with feature_path.open('r', encoding='utf-8') as f:
        feature_columns = json.load(f)
    return model, feature_columns


def build_row(input_json, feature_columns):
    # base numeric fields
    row = {c: 0 for c in feature_columns}
    # area
    if 'area_m2' in feature_columns:
        row['area_m2'] = float(input_json.get('area_m2') or 0)
    else:
        # try to find any numeric column name that contains 'area'
        for c in feature_columns:
            if 'area' in c.lower():
                row[c] = float(input_json.get('area_m2') or 0)
                break

    # ndvi_mean
    if 'ndvi_mean' in feature_columns:
        row['ndvi_mean'] = float(input_json.get('ndvi_mean') or 0)

    # categorical columns encoded as e.g., landType_Agricultural
    land_val = input_json.get('landType') or input_json.get('land_type')
    soil_val = input_json.get('soilType') or input_json.get('soil_type')

    for col in feature_columns:
        if col.startswith('landType_') and land_val is not None:
            if col == f'landType_{land_val}':
                row[col] = 1
        if col.startswith('soilType_') and soil_val is not None:
            if col == f'soilType_{soil_val}':
                row[col] = 1

    return [row[c] for c in feature_columns]


def main():
    try:
        body = json.load(sys.stdin)
    except Exception:
        print(json.dumps({'error': 'invalid input'}))
        sys.exit(2)

    model, feature_columns = load_model()
    row = build_row(body, feature_columns)
    X = pd.DataFrame([row], columns=feature_columns)
    pred = model.predict(X.values)[0]

    print(json.dumps({'prediction': float(pred)}))


if __name__ == '__main__':
    main()
