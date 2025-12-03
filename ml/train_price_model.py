"""
Train an XGBoost regression model for land price prediction.

Usage:
  python train_price_model.py --csv /path/to/dataset.csv --out-dir ml/models

The dataset must contain a numeric `price` column (target) and at least one area column
such as `area_m2`, `area`, or `area_size`. Optional categorical columns: `landType`, `soilType`.

This script will save:
- model.json (XGBoost model)
- feature_columns.json (list of input columns after one-hot)

"""
import argparse
import json
import os
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
from xgboost import XGBRegressor


def infer_area_column(df: pd.DataFrame):
    candidates = ['area_m2', 'area', 'area_size', 'area_sq_m', 'Area']
    for c in candidates:
        if c in df.columns:
            return c
    # fallback: pick first numeric column that's not price
    for c in df.columns:
        if c.lower().find('price') >= 0:
            continue
        if np.issubdtype(df[c].dtype, np.number):
            return c
    return None


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--csv', required=True, help='Path to CSV dataset')
    p.add_argument('--out-dir', default='ml/models', help='Output directory for model files')
    args = p.parse_args()

    df = pd.read_csv(args.csv)
    # detect target column: prefer explicit 'price', then 'Market_Value' or 'Purchase_Value'
    possible_targets = ['price', 'Price', 'Market_Value', 'MarketValue', 'Market Value', 'Purchase_Value', 'PurchaseValue', 'Purchase Value']
    if args.target:
        if args.target not in df.columns:
            raise SystemExit(f"Specified target column '{args.target}' not found in CSV")
        price_col = args.target
    else:
        price_col = None
        for t in possible_targets:
            if t in df.columns:
                price_col = t
                break
        if price_col is None:
            raise SystemExit('Dataset must include a price-like column (e.g., price, Market_Value, Purchase_Value) or use --target to specify column')

    area_col = infer_area_column(df)
    if area_col is None:
        raise SystemExit('Could not infer an area column. Ensure dataset has area_m2 or area column')

    # Optional features
    cat_cols = []
    for c in ['landType', 'soilType', 'land_type', 'soil_type']:
        if c in df.columns:
            cat_cols.append(c)

    features = [area_col]
    if 'ndvi_mean' in df.columns:
        features.append('ndvi_mean')
    features += cat_cols

    X = df[features].copy()
    y = df[price_col].astype(float).values

    # One-hot encode categorical with pandas.get_dummies
    X_encoded = pd.get_dummies(X, columns=cat_cols, dummy_na=False)

    feature_columns = list(X_encoded.columns)

    X_train, X_test, y_train, y_test = train_test_split(X_encoded.values, y, test_size=0.2, random_state=42)

    model = XGBRegressor(n_estimators=200, max_depth=6, learning_rate=0.05, random_state=42)
    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], early_stopping_rounds=20, verbose=False)

    preds = model.predict(X_test)
    rmse = mean_squared_error(y_test, preds, squared=False)
    print(f'Test RMSE: {rmse:.2f}')

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    model_path = out_dir / 'price_model.json'
    feature_path = out_dir / 'feature_columns.json'

    # Save model
    model.save_model(str(model_path))

    # Save feature columns
    with feature_path.open('w', encoding='utf-8') as f:
        json.dump(feature_columns, f)

    print('Model and feature columns saved to', out_dir)


if __name__ == '__main__':
    main()
