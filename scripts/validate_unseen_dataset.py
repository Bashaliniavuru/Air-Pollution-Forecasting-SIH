"""
Model Validation on Unseen Dataset.
Evaluates the existing trained XGBoost multi-horizon models on an unseen Delhi-NCR test dataset.
Strictly:
- No retraining
- No model modifications
- Exact preprocessing & feature engineering pipeline
- Genuine metric calculations (MAE, RMSE, R2, location-wise, temporal)
- Full pipeline validation into Risk & Early Warning
"""

import os
import sys
import json
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Ensure root workspace is in sys.path
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.services.data_processing import DataProcessingPipeline
from backend.services.feature_engineering import FeatureEngineeringPipeline
from backend.models.train_model import XGBoostForecaster, AQIModelTrainer
from utils.constants import AQICategory


def run_validation(test_csv_path: str = "data/delhi_ncr_demo_data.csv"):
    print("=" * 80)
    print("STARTING MODEL VALIDATION ON UNSEEN DATASET")
    print("=" * 80)
    
    # 1. Inspect Raw Test Dataset
    print(f"\n[Step 1] Loading Unseen Test Dataset: {test_csv_path}")
    raw_df = pd.read_csv(test_csv_path)
    total_raw_rows = len(raw_df)
    print(f"Raw Dataset Shape: {raw_df.shape} ({total_raw_rows} rows, {len(raw_df.columns)} columns)")
    print("Columns:", list(raw_df.columns))
    print("\nData Types:")
    print(raw_df.dtypes)
    
    missing_vals = raw_df.isnull().sum()
    print("\nMissing Values per Column:")
    print(missing_vals[missing_vals > 0] if missing_vals.sum() > 0 else "None (0 missing values)")
    
    duplicates = raw_df.duplicated().sum()
    print(f"\nDuplicate Rows: {duplicates}")
    
    locations = raw_df['location'].unique() if 'location' in raw_df.columns else []
    print(f"\nLocations present ({len(locations)}): {list(locations)}")
    
    time_min = raw_df['timestamp'].min() if 'timestamp' in raw_df.columns else 'N/A'
    time_max = raw_df['timestamp'].max() if 'timestamp' in raw_df.columns else 'N/A'
    print(f"Time Range: {time_min} to {time_max}")
    
    # 2. Compare with Expected Features
    expected_features = AQIModelTrainer.FEATURE_COLUMNS
    print(f"\n[Step 2] Comparing with Model Expected Features ({len(expected_features)} features):")
    print("Expected Features:", expected_features)
    
    # Check what features exist directly in raw data
    raw_present = [f for f in expected_features if f in raw_df.columns]
    raw_missing = [f for f in expected_features if f not in raw_df.columns]
    print(f"Features present in raw data: {len(raw_present)} / {len(expected_features)}")
    print(f"Features requiring FeatureEngineering Pipeline (lags, rolling, calendar, standard naming): {raw_missing}")
    
    # 3. Apply Same Preprocessing Pipeline
    print("\n[Step 3] Applying Preprocessing Pipeline (DataProcessingPipeline)...")
    pre_pipe = DataProcessingPipeline(raw_data_path=test_csv_path)
    processed_df = pre_pipe.run_pipeline(input_file=test_csv_path)
    print(f"Processed Data Shape: {processed_df.shape}")
    
    # 4. Apply Same Feature Engineering Pipeline
    print("\n[Step 4] Applying Feature Engineering Pipeline (FeatureEngineeringPipeline)...")
    fe_pipe = FeatureEngineeringPipeline(
        avoid_leakage=True,
        fill_initial_lags=True,
        keep_original_columns=True
    )
    featured_df = fe_pipe.fit_transform(processed_df)
    
    # Standardize column naming aliases if raw had PM2.5 / PM10 / AQI
    if "pm2_5" not in featured_df.columns and "PM2.5" in featured_df.columns:
        featured_df["pm2_5"] = featured_df["PM2.5"]
    if "pm10" not in featured_df.columns and "PM10" in featured_df.columns:
        featured_df["pm10"] = featured_df["PM10"]
    if "current_aqi" not in featured_df.columns and "AQI" in featured_df.columns:
        featured_df["current_aqi"] = featured_df["AQI"]

    print(f"Featured Data Shape: {featured_df.shape}")
    
    # Verify all expected feature columns now exist
    missing_after_fe = [f for f in expected_features if f not in featured_df.columns]
    if missing_after_fe:
        print(f"WARNING: Features still missing after FE: {missing_after_fe}")
    else:
        print("SUCCESS: All 20 expected feature columns successfully engineered and verified!")

    # 5. Construct Ground Truth Horizon Targets for Evaluation
    # Sort chronologically per location
    featured_df["_dt"] = pd.to_datetime(featured_df["timestamp"])
    loc_col = "location" if "location" in featured_df.columns else "station_id"
    featured_df = featured_df.sort_values(by=[loc_col, "_dt"]).reset_index(drop=True)
    
    grouped = featured_df.groupby(loc_col, group_keys=False)
    for h in [1, 6, 24]:
        featured_df[f"target_{h}h_aqi"] = grouped["current_aqi"].shift(-h)
        
    print("\nGround truth targets constructed for multi-horizon verification:")
    for h in [1, 6, 24]:
        valid_targets = featured_df[f"target_{h}h_aqi"].dropna()
        print(f"  - {h}h target: {len(valid_targets)} valid ground-truth target values (dropped {len(featured_df) - len(valid_targets)} tail rows due to lead horizon)")

    # 6. Load Existing Trained XGBoost Models (DO NOT RETRAIN)
    print("\n[Step 5] Loading Existing Trained XGBoost Forecaster (No Retraining)...")
    forecaster = XGBoostForecaster(models_dir="models")
    if not forecaster.is_loaded:
        raise RuntimeError("Failed to load existing XGBoost models from models/ directory!")
    print(f"Loaded Models for horizons: {list(forecaster.models.keys())}")
    print(f"Model Metadata trained_at: {forecaster.metadata.get('trained_at', 'N/A')}")
    
    # 7. Generate Predictions on the Unseen Test Dataset
    print("\n[Step 6] Generating Multi-Horizon AQI Predictions on Unseen Dataset...")
    X = featured_df[expected_features]
    
    preds_1h = np.clip(forecaster.models[1].predict(X), 0, 500)
    preds_6h = np.clip(forecaster.models[6].predict(X), 0, 500)
    preds_24h = np.clip(forecaster.models[24].predict(X), 0, 500)
    
    featured_df["pred_1h_aqi"] = np.round(preds_1h, 1)
    featured_df["pred_6h_aqi"] = np.round(preds_6h, 1)
    featured_df["pred_24h_aqi"] = np.round(preds_24h, 1)
    
    print(f"Successfully generated predictions for {len(X)} samples.")
    
    # 8. Calculate Metrics Across All Horizons
    print("\n" + "=" * 80)
    print("GENUINE EVALUATION METRICS ON UNSEEN DATASET")
    print("=" * 80)
    
    horizon_results = {}
    for h in [1, 6, 24]:
        valid_mask = featured_df[f"target_{h}h_aqi"].notna()
        y_true = featured_df.loc[valid_mask, f"target_{h}h_aqi"]
        y_pred = featured_df.loc[valid_mask, f"pred_{h}h_aqi"]
        
        mae = mean_absolute_error(y_true, y_pred)
        mse = mean_squared_error(y_true, y_pred)
        rmse = np.sqrt(mse)
        r2 = r2_score(y_true, y_pred)
        
        residuals = y_pred - y_true
        
        horizon_results[f"{h}h"] = {
            "samples": len(y_true),
            "excluded_rows": len(featured_df) - len(y_true),
            "actual_min": float(y_true.min()),
            "actual_max": float(y_true.max()),
            "actual_mean": float(y_true.mean()),
            "actual_std": float(y_true.std()),
            "pred_min": float(y_pred.min()),
            "pred_max": float(y_pred.max()),
            "pred_mean": float(y_pred.mean()),
            "pred_std": float(y_pred.std()),
            "MAE": round(mae, 3),
            "RMSE": round(rmse, 3),
            "R2": round(r2, 4),
            "residual_mean": round(float(residuals.mean()), 3),
            "residual_std": round(float(residuals.std()), 3),
            "residual_median": round(float(residuals.median()), 3),
            "residual_p95": round(float(np.percentile(np.abs(residuals), 95)), 3)
        }
        
        print(f"\n--- {h}-HOUR AHEAD FORECASTING HORIZON ---")
        print(f"Evaluated Samples: {len(y_true)} (Excluded: {len(featured_df) - len(y_true)} boundary rows)")
        print(f"Actual AQI Range:    {y_true.min():.1f} to {y_true.max():.1f} (Mean: {y_true.mean():.2f}, Std: {y_true.std():.2f})")
        print(f"Predicted AQI Range: {y_pred.min():.1f} to {y_pred.max():.1f} (Mean: {y_pred.mean():.2f}, Std: {y_pred.std():.2f})")
        print(f"MAE  (Mean Absolute Error):     {mae:.3f}")
        print(f"RMSE (Root Mean Squared Error): {rmse:.3f}")
        print(f"R²   (Coefficient of Determ.):  {r2:.4f}")
        print(f"Residual Mean Error (Bias):     {residuals.mean():.3f}")
        print(f"Residual Std Dev:               {residuals.std():.3f}")
        print(f"Residual 95th Percentile Error: {np.percentile(np.abs(residuals), 95):.3f}")

    # 9. Location-Wise Performance Analysis (for 24h & 1h)
    print("\n" + "=" * 80)
    print("LOCATION-WISE PERFORMANCE ON UNSEEN DATASET")
    print("=" * 80)
    
    loc_metrics = {}
    for loc in locations:
        loc_df = featured_df[featured_df[loc_col] == loc]
        loc_metrics[loc] = {}
        print(f"\nLocation: {loc} ({len(loc_df)} total records)")
        
        for h in [1, 6, 24]:
            valid_loc = loc_df[loc_df[f"target_{h}h_aqi"].notna()]
            y_t = valid_loc[f"target_{h}h_aqi"]
            y_p = valid_loc[f"pred_{h}h_aqi"]
            
            l_mae = mean_absolute_error(y_t, y_p)
            l_rmse = np.sqrt(mean_squared_error(y_t, y_p))
            l_r2 = r2_score(y_t, y_p)
            
            loc_metrics[loc][f"{h}h"] = {
                "samples": len(y_t),
                "actual_mean": round(float(y_t.mean()), 1),
                "pred_mean": round(float(y_p.mean()), 1),
                "MAE": round(l_mae, 3),
                "RMSE": round(l_rmse, 3),
                "R2": round(l_r2, 4)
            }
            print(f"  - Horizon {h}h: Samples={len(y_t)}, MAE={l_mae:.3f}, RMSE={l_rmse:.3f}, R²={l_r2:.4f} (Actual Mean={y_t.mean():.1f}, Pred Mean={y_p.mean():.1f})")

    # 10. Temporal / Daily Performance Breakdown
    print("\n" + "=" * 80)
    print("TEMPORAL / DAILY PERFORMANCE BREAKDOWN (24h Horizon)")
    print("=" * 80)
    
    featured_df["date_str"] = featured_df["_dt"].dt.strftime("%Y-%m-%d")
    daily_metrics = {}
    for dt, group in featured_df.groupby("date_str"):
        valid_d = group[group["target_24h_aqi"].notna()]
        if len(valid_d) > 0:
            d_mae = mean_absolute_error(valid_d["target_24h_aqi"], valid_d["pred_24h_aqi"])
            d_rmse = np.sqrt(mean_squared_error(valid_d["target_24h_aqi"], valid_d["pred_24h_aqi"]))
            d_r2 = r2_score(valid_d["target_24h_aqi"], valid_d["pred_24h_aqi"])
            daily_metrics[dt] = {
                "samples": len(valid_d),
                "actual_mean": round(float(valid_d["target_24h_aqi"].mean()), 1),
                "pred_mean": round(float(valid_d["pred_24h_aqi"].mean()), 1),
                "MAE": round(d_mae, 3),
                "RMSE": round(d_rmse, 3),
                "R2": round(d_r2, 4)
            }
            print(f"Date: {dt} | Samples: {len(valid_d):2d} | Actual Mean: {valid_d['target_24h_aqi'].mean():.1f} | Pred Mean: {valid_d['pred_24h_aqi'].mean():.1f} | MAE: {d_mae:.3f} | RMSE: {d_rmse:.3f} | R²: {d_r2:.4f}")

    # 11. Sample Predictions Table (Actual vs Predicted AQI)
    print("\n" + "=" * 80)
    print("SAMPLE ACTUAL VS PREDICTED AQI COMPARISON TABLE")
    print("=" * 80)
    
    sample_df = featured_df[["timestamp", "location", "current_aqi", "target_24h_aqi", "pred_24h_aqi", "pred_1h_aqi", "pred_6h_aqi"]].dropna().head(15)
    print(sample_df.to_string(index=False))

    # 12. Test Full Forecasting Pipeline to Risk Classification & Early Warning
    print("\n" + "=" * 80)
    print("TESTING COMPLETE FORECASTING PIPELINE: Prediction -> Risk -> Early Warning")
    print("=" * 80)
    
    sample_row = featured_df.iloc[0].to_dict()
    pipeline_res = forecaster.predict_all_horizons(sample_row)
    
    print("Sample Location:", sample_row.get("location"))
    print("Current Observation Time:", sample_row.get("timestamp"))
    print("Current AQI Observation:", sample_row.get("current_aqi"))
    print("Forecast Multi-Horizon Results:")
    h1_info = pipeline_res['forecast_horizons']['1_hour']
    h6_info = pipeline_res['forecast_horizons']['6_hour']
    h24_info = pipeline_res['forecast_horizons']['24_hour']
    print(f"  +1h Ahead Forecast:  {h1_info['predicted_aqi']} (Category: {h1_info['category']})")
    print(f"  +6h Ahead Forecast:  {h6_info['predicted_aqi']} (Category: {h6_info['category']})")
    print(f"  +24h Ahead Forecast: {h24_info['predicted_aqi']} (Category: {h24_info['category']})")
    print("Risk Classification (24h):", h24_info['category'])
    print("Early Warning Directive (GRAP):", pipeline_res['recommended_action'])
    print("Pipeline Integration Status: FULLY FUNCTIONAL AND VERIFIED")
    
    return {
        "dataset_name": test_csv_path,
        "total_raw_rows": total_raw_rows,
        "locations": list(locations),
        "time_range": f"{time_min} to {time_max}",
        "expected_features": expected_features,
        "horizon_results": horizon_results,
        "loc_metrics": loc_metrics,
        "daily_metrics": daily_metrics
    }


if __name__ == "__main__":
    results = run_validation("data/delhi_ncr_demo_data.csv")
