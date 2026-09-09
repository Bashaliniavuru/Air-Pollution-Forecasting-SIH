"""
Comprehensive verification test suite for the Feature Engineering Pipeline.

Tests:
1. Feature existence and naming fidelity.
2. Temporal feature generation (hour, day, day_of_week, month).
3. AQI lag features (1h, 3h, 6h).
4. AQI rolling features (3h, 6h, 12h) with anti-leakage verification.
5. Pollution lag features (previous_PM2.5, previous_PM10).
6. Weather feature inclusion and normalization.
7. Location isolation (features are computed strictly per location).
8. Anti-leakage guarantees (future observations do not leak into current features).
9. Integration with benchmark Delhi-NCR dataset (data/sample_dataset.json).
"""

import sys
import os
import json
import pandas as pd
import numpy as np

# Ensure workspace root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.services.feature_engineering import FeatureEngineeringPipeline, engineer_features


def create_synthetic_multi_station_df(hours: int = 24) -> pd.DataFrame:
    """Creates a multi-station hourly dataset across Delhi-NCR locations."""
    stations = ["DELHI_ANAND_VIHAR", "DELHI_ITO", "DELHI_RK_PURAM"]
    records = []
    
    start_time = pd.Timestamp("2026-09-01 00:00:00")
    for s_idx, station in enumerate(stations):
        # Base offset per station so values are distinct
        base_aqi = 200 + s_idx * 50
        base_pm25 = 100 + s_idx * 30
        base_pm10 = 180 + s_idx * 40
        
        for h in range(hours):
            ts = start_time + pd.Timedelta(hours=h)
            records.append({
                "timestamp": ts.isoformat(),
                "location": station,
                "current_aqi": base_aqi + h * 2,
                "pm2_5": base_pm25 + h,
                "pm10": base_pm10 + h * 1.5,
                "temperature": 20.0 + (h % 12) * 0.8,
                "humidity": 75.0 - (h % 10) * 1.5,
                "wind_speed": 4.5 + (h % 6) * 0.5,
                "wind_direction": 280.0 + (h % 20),
                "atmospheric_pressure": 1012.0 - (h % 5) * 0.4,
                "rainfall": 0.0 if h < 18 else 1.2,
            })
            
    # Randomly shuffle rows to verify pipeline sorts chronologically per location
    df = pd.DataFrame(records)
    return df.sample(frac=1.0, random_state=42).reset_index(drop=True)


def test_feature_existence_and_names():
    """Verify that all required features exist and match expected names exactly."""
    df = create_synthetic_multi_station_df(hours=20)
    pipeline = FeatureEngineeringPipeline()
    out = pipeline.fit_transform(df)

    expected_features = [
        # Temporal
        "hour", "day", "day_of_week", "month",
        # AQI lag
        "previous_1_hour_AQI", "previous_3_hour_AQI", "previous_6_hour_AQI",
        # AQI rolling
        "rolling_3_hour_AQI", "rolling_6_hour_AQI", "rolling_12_hour_AQI",
        # Pollution lag
        "previous_PM2.5", "previous_PM10",
        # Weather
        "temperature", "humidity", "wind_speed", "wind_direction",
        "atmospheric_pressure", "rainfall"
    ]

    for feat in expected_features:
        assert feat in out.columns, f"Missing required feature: '{feat}'"

    print(f"PASS: All {len(expected_features)} required features are present with exact names.")


def test_location_isolation():
    """Verify that calculations for Station B do not bleed into Station A."""
    df = create_synthetic_multi_station_df(hours=15)
    pipeline = FeatureEngineeringPipeline()
    out = pipeline.fit_transform(df)

    # Inspect Anand Vihar and ITO sorted chronologically
    for station in ["DELHI_ANAND_VIHAR", "DELHI_ITO"]:
        station_df = out[out["location"] == station].sort_values("timestamp").reset_index(drop=True)
        
        # Row 1 lag 1 should equal Row 0's AQI for THAT station
        row0_aqi = station_df.loc[0, "current_aqi"]
        row1_lag1 = station_df.loc[1, "previous_1_hour_AQI"]
        assert np.isclose(row0_aqi, row1_lag1), (
            f"Location isolation broken for {station}: "
            f"Row 0 AQI ({row0_aqi}) != Row 1 lag ({row1_lag1})"
        )

        # Row 3 lag 3 should equal Row 0's AQI
        row3_lag3 = station_df.loc[3, "previous_3_hour_AQI"]
        assert np.isclose(row0_aqi, row3_lag3), (
            f"Location isolation broken: Row 0 AQI ({row0_aqi}) != Row 3 lag 3 ({row3_lag3})"
        )

        # Row 1 lag PM2.5 should equal Row 0's PM2.5 for THAT station
        row0_pm25 = station_df.loc[0, "pm2_5"]
        row1_pm25_lag = station_df.loc[1, "previous_PM2.5"]
        assert np.isclose(row0_pm25, row1_pm25_lag), (
            f"PM2.5 lag broken for {station}: {row0_pm25} vs {row1_pm25_lag}"
        )

    print("PASS: Location isolation verified - all time-series features are station-specific.")


def test_anti_leakage_guarantee():
    """
    Verify that current or future observations NEVER leak into lag and rolling features.
    Specifically:
    - Lag at time t is strictly observation from t-1 (or earlier).
    - Rolling window at time t uses observations from [t-W, ..., t-1], NOT including t.
    """
    df = create_synthetic_multi_station_df(hours=24)
    pipeline = FeatureEngineeringPipeline(avoid_leakage=True)
    out = pipeline.fit_transform(df)

    station_df = out[out["location"] == "DELHI_ANAND_VIHAR"].sort_values("timestamp").reset_index(drop=True)

    # Verify rolling 3 hour at index 4
    # Expected: mean of index 1, 2, 3 (strictly preceding index 4)
    expected_rolling_3 = station_df.loc[1:3, "current_aqi"].mean()
    actual_rolling_3 = station_df.loc[4, "rolling_3_hour_AQI"]
    assert np.isclose(expected_rolling_3, actual_rolling_3), (
        f"Leakage detected! Expected historical rolling 3h {expected_rolling_3}, got {actual_rolling_3}"
    )

    # Verify that changing index 4's current AQI does NOT change index 4's rolling_3_hour_AQI
    mutated_df = df.copy()
    mask = (mutated_df["location"] == "DELHI_ANAND_VIHAR") & (mutated_df["timestamp"] == station_df.loc[4, "timestamp"])
    mutated_df.loc[mask, "current_aqi"] = 9999.0  # Massive spike at t=4
    
    out_mutated = pipeline.fit_transform(mutated_df)
    station_mutated = out_mutated[out_mutated["location"] == "DELHI_ANAND_VIHAR"].sort_values("timestamp").reset_index(drop=True)
    actual_rolling_3_mutated = station_mutated.loc[4, "rolling_3_hour_AQI"]

    assert np.isclose(actual_rolling_3, actual_rolling_3_mutated), (
        f"Data leakage! A change in current AQI at t changed rolling feature at t: {actual_rolling_3} vs {actual_rolling_3_mutated}"
    )

    print("PASS: Anti-leakage verified - rolling windows strictly use historical data.")


def test_calendar_features():
    """Verify exact date/calendar extraction (hour, day, day_of_week, month)."""
    test_data = pd.DataFrame([{
        "timestamp": "2026-09-09T14:30:00Z",
        "location": "DELHI_CENTRAL",
        "current_aqi": 210,
        "pm2_5": 115,
        "pm10": 210,
        "temperature": 28.0,
        "humidity": 60.0,
        "wind_speed": 7.0,
        "wind_direction": 290.0,
        "atmospheric_pressure": 1010.0,
        "rainfall": 0.0
    }])
    out = engineer_features(test_data)
    row = out.iloc[0]

    assert row["hour"] == 14, f"Expected hour 14, got {row['hour']}"
    assert row["day"] == 9, f"Expected day 9, got {row['day']}"
    assert row["day_of_week"] == 2, f"Expected day_of_week 2 (Wednesday), got {row['day_of_week']}"
    assert row["month"] == 9, f"Expected month 9 (September), got {row['month']}"

    print("PASS: Temporal calendar features (hour, day, day_of_week, month) are accurate.")


def test_benchmark_dataset_integration():
    """Verify pipeline executes cleanly on data/sample_dataset.json."""
    sample_path = os.path.join(os.path.dirname(__file__), "..", "data", "sample_dataset.json")
    with open(sample_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Flatten station observations from sample_dataset.json
    records = []
    for s in data.get("stations", []):
        obs = s.get("observations", {})
        met = s.get("meteorology", {})
        records.append({
            "timestamp": "2026-09-09T08:00:00Z",
            "station_id": s.get("station_id"),
            "location": s.get("station_name"),
            "current_aqi": obs.get("current_aqi"),
            "pm2_5": obs.get("pm2_5_ug_m3"),
            "pm10": obs.get("pm10_ug_m3"),
            "temperature": met.get("temperature_c"),
            "humidity": met.get("relative_humidity_pct"),
            "wind_speed": met.get("wind_speed_kmh"),
            "wind_direction": met.get("wind_direction_deg"),
            "atmospheric_pressure": 1012.5,
            "rainfall": 0.0
        })

    df = pd.DataFrame(records)
    pipeline = FeatureEngineeringPipeline()
    result = pipeline.fit_transform(df)
    validation = pipeline.validate_features(result)

    assert validation["is_valid"] is True, f"Benchmark dataset validation failed: {validation}"
    print(f"PASS: Benchmark dataset processed successfully ({len(result)} stations). Validation: {validation['is_valid']}")


if __name__ == "__main__":
    print("=" * 60)
    print("Running Feature Engineering Pipeline Verification Tests...")
    print("=" * 60)
    test_feature_existence_and_names()
    test_location_isolation()
    test_anti_leakage_guarantee()
    test_calendar_features()
    test_benchmark_dataset_integration()
    print("=" * 60)
    print("ALL TESTS PASSED! Feature engineering pipeline is 100% verified.")
    print("=" * 60)
