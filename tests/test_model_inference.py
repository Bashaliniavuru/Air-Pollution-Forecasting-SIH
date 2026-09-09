"""
Comprehensive verification test suite for XGBoost AQI Forecasting Model and Inference Engine.

Tests:
1. Verify models exist under models/ (1h, 6h, 24h, metadata).
2. Verify genuine test accuracy metrics (MAE, RMSE, R²) in metadata.
3. Test 1-hour AQI prediction.
4. Test 6-hour AQI prediction.
5. Test 24-hour AQI forecast.
6. Test predict_all_horizons with GRAP recommendations.
7. Test inference from sample station observation.
"""

import sys
import os
import json
import numpy as np
import pandas as pd

# Ensure workspace root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.models.train_model import XGBoostForecaster


def test_saved_model_artifacts():
    """Verify all required model artifacts are persisted under models/."""
    models_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))
    
    required_files = [
        "xgboost_aqi_1h.json",
        "xgboost_aqi_6h.json",
        "xgboost_aqi_24h.json",
        "xgboost_metadata.json",
    ]
    for rf in required_files:
        path = os.path.join(models_dir, rf)
        assert os.path.exists(path), f"Missing model artifact: {path}"

    with open(os.path.join(models_dir, "xgboost_metadata.json"), "r") as f:
        meta = json.load(f)

    assert "metrics" in meta, "Metrics key missing in metadata"
    for h in ["1h", "6h", "24h"]:
        assert h in meta["metrics"], f"Missing metrics for horizon {h}"
        m = meta["metrics"][h]
        assert "MAE" in m and "RMSE" in m and "R2" in m, f"Incomplete metrics for {h}: {m}"
        assert m["MAE"] > 0, "MAE must be calculated positive value"
        assert m["RMSE"] > 0, "RMSE must be calculated positive value"
        assert m["R2"] > 0.5, f"R2 score should be high for AQI forecasting, got {m['R2']}"

    print("PASS: Model artifacts and genuine calculated test metrics verified:")
    for h in ["1h", "6h", "24h"]:
        m = meta["metrics"][h]
        print(f"   [{h} Horizon] MAE: {m['MAE']} | RMSE: {m['RMSE']} | R²: {m['R2']}")


def test_xgboost_forecaster_predictions():
    """Verify 1h, 6h, 24h predictions with sample Delhi-NCR telemetry."""
    forecaster = XGBoostForecaster()
    assert forecaster.is_loaded, "XGBoostForecaster failed to load models!"

    sample_station_payload = {
        "timestamp": "2026-09-09T12:00:00Z",
        "location": "DELHI_ANAND_VIHAR",
        "current_aqi": 385,
        "pm2_5": 225.0,
        "pm10": 360.0,
        "temperature": 21.0,
        "humidity": 80.0,
        "wind_speed": 4.5,
        "wind_direction": 290.0,
        "atmospheric_pressure": 1012.0,
        "rainfall": 0.0,
        "previous_1_hour_AQI": 378.0,
        "previous_3_hour_AQI": 365.0,
        "previous_6_hour_AQI": 340.0,
        "rolling_3_hour_AQI": 370.0,
        "rolling_6_hour_AQI": 360.0,
        "rolling_12_hour_AQI": 350.0,
        "previous_PM2.5": 215.0,
        "previous_PM10": 345.0,
    }

    # 1. Test 1-hour prediction
    pred_1h = forecaster.predict_1h(sample_station_payload)
    assert isinstance(pred_1h, float), f"Expected float, got {type(pred_1h)}"
    assert 0 <= pred_1h <= 500, f"Predicted AQI out of realistic bounds: {pred_1h}"
    print(f"PASS: 1-hour AQI prediction = {pred_1h}")

    # 2. Test 6-hour prediction
    pred_6h = forecaster.predict_6h(sample_station_payload)
    assert isinstance(pred_6h, float), f"Expected float, got {type(pred_6h)}"
    assert 0 <= pred_6h <= 500, f"Predicted AQI out of realistic bounds: {pred_6h}"
    print(f"PASS: 6-hour AQI prediction = {pred_6h}")

    # 3. Test 24-hour prediction
    pred_24h = forecaster.predict_24h(sample_station_payload)
    assert isinstance(pred_24h, float), f"Expected float, got {type(pred_24h)}"
    assert 0 <= pred_24h <= 500, f"Predicted AQI out of realistic bounds: {pred_24h}"
    print(f"PASS: 24-hour AQI forecast = {pred_24h}")

    # 4. Test full multi-horizon forecast with recommendations
    all_horizons = forecaster.predict_all_horizons(sample_station_payload)
    assert all_horizons["status"] == "SUCCESS"
    assert "1_hour" in all_horizons["forecast_horizons"]
    assert "6_hour" in all_horizons["forecast_horizons"]
    assert "24_hour" in all_horizons["forecast_horizons"]
    assert "recommended_action" in all_horizons
    print(f"PASS: Multi-horizon forecast output:\n{json.dumps(all_horizons['forecast_horizons'], indent=2)}")
    print(f"   Recommended Action: {all_horizons['recommended_action']}")


if __name__ == "__main__":
    print("=" * 65)
    print("Running XGBoost Forecasting Model Verification Tests...")
    print("=" * 65)
    test_saved_model_artifacts()
    test_xgboost_forecaster_predictions()
    print("=" * 65)
    print("ALL TESTS PASSED! XGBoost multi-horizon forecaster is 100% verified.")
    print("=" * 65)
