# ML: Price prediction

This folder contains utilities to train and run a price prediction model using XGBoost.

Requirements
- Python 3.8+
- Install dependencies:

```bash
pip install -r ml/requirements.txt
```

Training

Provide a CSV with at least a `price` column (target) and an area column such as `area_m2`.

Example:

```bash
python ml/train_price_model.py --csv /path/to/your/dataset.csv --out-dir ml/models
```

This creates `ml/models/price_model.json` and `ml/models/feature_columns.json`.

Prediction (used by the app)

The Next.js API calls `ml/predict_price.py` and sends a JSON object on stdin. Example input:

```json
{ "area_m2": 2500, "ndvi_mean": 0.12, "landType": "Agricultural" }
```

The script prints a JSON object with `prediction` to stdout.

Notes
- The training script uses pandas.get_dummies for categorical features and saves the final feature column order to `feature_columns.json`. Keep that file alongside the model so predictions are encoded identically.
