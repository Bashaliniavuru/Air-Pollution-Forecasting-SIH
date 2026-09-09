"""
Coupled Feature Engineering Pipeline for Delhi-NCR Air Pollution & Weather Forecasting.

Implements:
1. Calendar/Temporal features: hour, day, day_of_week, month
2. AQI lag features: previous_1_hour_AQI, previous_3_hour_AQI, previous_6_hour_AQI
3. AQI rolling features: rolling_3_hour_AQI, rolling_6_hour_AQI, rolling_12_hour_AQI
4. Pollution lag features: previous_PM2.5, previous_PM10
5. Weather features: temperature, humidity, wind_speed, wind_direction, atmospheric_pressure, rainfall
6. Atmospheric coupling features: ventilation_index, atmospheric_stagnation_index, pm_ratio

All time-based features are computed strictly grouped by location with zero future data leakage.
"""

import os
import sys
from pathlib import Path
from typing import List, Optional
import numpy as np
import pandas as pd

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

try:
    from utils.logger import setup_logger
    logger = setup_logger("feature_engineering")
except ImportError:
    import logging
    logging.basicConfig(level=logging.INFO, format="[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s")
    logger = logging.getLogger("feature_engineering")


class FeatureEngineeringPipeline:
    """
    Constructs leak-free lag, rolling, temporal, and coupled meteorological features
    isolated on a per-location basis for multi-station forecasting.
    """

    REQUIRED_WEATHER_FEATURES: List[str] = [
        "temperature",
        "humidity",
        "wind_speed",
        "wind_direction",
        "atmospheric_pressure",
        "rainfall"
    ]

    def __init__(self, input_path: Optional[str] = None, output_path: Optional[str] = None):
        self.input_path = Path(input_path) if input_path else REPO_ROOT / "data" / "processed" / "delhi_ncr_processed_data.csv"
        # Fallback to demo data if processed data not found
        if not self.input_path.exists():
            self.input_path = REPO_ROOT / "data" / "delhi_ncr_demo_data.csv"
            
        self.output_path = Path(output_path) if output_path else REPO_ROOT / "data" / "processed" / "delhi_ncr_featured_training_data.csv"

    def load_data(self, file_path: Optional[str] = None) -> pd.DataFrame:
        target = Path(file_path) if file_path else self.input_path
        if not target.exists():
            raise FileNotFoundError(f"Source data file not found: {target}")
        logger.info(f"Loading data for feature engineering from: {target}")
        df = pd.read_csv(target)
        if "timestamp" in df.columns:
            df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True)
        # Ensure chronological ordering per location before time calculations
        df = df.sort_values(by=["location", "timestamp"]).reset_index(drop=True)
        logger.info(f"Loaded {len(df)} records across {df['location'].nunique()} locations.")
        return df

    def add_temporal_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Generates calendar and cyclic time features from timestamp:
        - hour (0 - 23)
        - day (1 - 31)
        - day_of_week (0 - 6, Monday=0)
        - month (1 - 12)
        """
        logger.info("Generating temporal features (hour, day, day_of_week, month)...")
        df = df.copy()
        ts = df["timestamp"].dt
        df["hour"] = ts.hour
        df["day"] = ts.day
        df["day_of_week"] = ts.dayofweek
        df["month"] = ts.month

        # Cyclic sin/cos transformations for neural networks and tree models
        df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24.0).round(4)
        df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24.0).round(4)
        df["day_of_week_sin"] = np.sin(2 * np.pi * df["day_of_week"] / 7.0).round(4)
        df["day_of_week_cos"] = np.cos(2 * np.pi * df["day_of_week"] / 7.0).round(4)
        return df

    def add_aqi_lag_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Generates strictly causal AQI lag features grouped per location:
        - previous_1_hour_AQI (t-1)
        - previous_3_hour_AQI (t-3)
        - previous_6_hour_AQI (t-6)
        """
        logger.info("Generating location-isolated AQI lag features (1h, 3h, 6h)...")
        df = df.copy()
        grouped = df.groupby("location")["AQI"]

        # Shift operations executed strictly within each location group
        df["previous_1_hour_AQI"] = grouped.shift(1)
        df["previous_3_hour_AQI"] = grouped.shift(3)
        df["previous_6_hour_AQI"] = grouped.shift(6)

        # Impute edge initial NaNs with backward-fill within each location so ML models have zero nulls
        for col in ["previous_1_hour_AQI", "previous_3_hour_AQI", "previous_6_hour_AQI"]:
            df[col] = df.groupby("location")[col].transform(lambda s: s.bfill().fillna(df["AQI"]))
            df[col] = df[col].round().astype(int)

        return df

    def add_aqi_rolling_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Generates backward-looking AQI rolling features:
        - rolling_3_hour_AQI (mean of preceding 3 hours: t-1, t-2, t-3)
        - rolling_6_hour_AQI (mean of preceding 6 hours: t-1, ..., t-6)
        - rolling_12_hour_AQI (mean of preceding 12 hours: t-1, ..., t-12)

        CRITICAL LEAKAGE PREVENTION:
        By applying .shift(1) BEFORE the rolling window, the observation at time t
        and any future observations (t+1, ...) are strictly excluded from the rolling window.
        """
        logger.info("Generating location-isolated causal AQI rolling features (3h, 6h, 12h)...")
        df = df.copy()

        # Grouped backward-looking rolling means using past values
        for window in [3, 6, 12]:
            col_name = f"rolling_{window}_hour_AQI"
            df[col_name] = (
                df.groupby("location")["AQI"]
                .transform(lambda s: s.shift(1).rolling(window=window, min_periods=1).mean())
            )
            # Edge fallback for the very first step of each series
            df[col_name] = df.groupby("location")[col_name].transform(lambda s: s.bfill().fillna(df["AQI"])).round(1)

        return df

    def add_pollution_lag_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Generates pollution lag features grouped per location:
        - previous_PM2.5 (t-1)
        - previous_PM10 (t-1)
        """
        logger.info("Generating location-isolated pollutant lag features (previous PM2.5, PM10)...")
        df = df.copy()
        
        df["previous_PM2.5"] = df.groupby("location")["PM2.5"].shift(1)
        df["previous_PM10"] = df.groupby("location")["PM10"].shift(1)

        # Impute edge initial values per location
        df["previous_PM2.5"] = df.groupby("location")["previous_PM2.5"].transform(lambda s: s.bfill().fillna(df["PM2.5"])).round(2)
        df["previous_PM10"] = df.groupby("location")["previous_PM10"].transform(lambda s: s.bfill().fillna(df["PM10"])).round(2)

        return df

    def verify_weather_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Ensures all 6 mandatory weather features are present and validates coupled atmospheric indices.
        """
        logger.info("Verifying required weather and atmospheric dispersion features...")
        missing_weather = [col for col in self.REQUIRED_WEATHER_FEATURES if col not in df.columns]
        if missing_weather:
            raise ValueError(f"Missing required weather features: {missing_weather}")

        # Compute coupled meteorological interaction indices if not already present
        if "ventilation_index" not in df.columns:
            wind_speed_ms = df["wind_speed"] * 1000.0 / 3600.0
            pbl_est = (350.0 + 950.0 * np.sin((df["hour"] - 6) * np.pi / 12).clip(lower=0.0) * (1.0 - df["humidity"] / 150.0)).round(1)
            df["estimated_pbl_height_m"] = pbl_est
            df["ventilation_index"] = (wind_speed_ms * pbl_est).round(1)

        if "atmospheric_stagnation_index" not in df.columns:
            calm_wind = (1.0 - (df["wind_speed"] / 15.0).clip(lower=0.0, upper=1.0))
            high_humidity = ((df["humidity"] - 40.0) / 60.0).clip(lower=0.0, upper=1.0)
            df["atmospheric_stagnation_index"] = (0.6 * calm_wind + 0.4 * high_humidity).round(3)

        if "pm_ratio" not in df.columns:
            df["pm_ratio"] = (df["PM2.5"] / (df["PM10"] + 1e-5)).round(3)

        return df

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Executes the end-to-end feature engineering transformation.
        """
        logger.info("Executing feature engineering pipeline transformation...")
        df = self.add_temporal_features(df)
        df = self.add_aqi_lag_features(df)
        df = self.add_aqi_rolling_features(df)
        df = self.add_pollution_lag_features(df)
        df = self.verify_weather_features(df)
        return df

    def run_pipeline(self, input_path: Optional[str] = None, output_path: Optional[str] = None) -> pd.DataFrame:
        """
        Loads input data, computes all features, and exports the final matrix.
        """
        df = self.load_data(input_path)
        featured_df = self.transform(df)

        target_output = Path(output_path) if output_path else self.output_path
        target_output.parent.mkdir(parents=True, exist_ok=True)
        logger.info(f"Saving feature-engineered dataset to: {target_output}")
        featured_df.to_csv(target_output, index=False)
        logger.info(f"Saved {len(featured_df)} records with {len(featured_df.columns)} features.")
        return featured_df


def main():
    pipeline = FeatureEngineeringPipeline()
    try:
        featured_df = pipeline.run_pipeline()
        print("\n=== FEATURE ENGINEERING PIPELINE SUMMARY ===")
        print(f"Total Rows: {len(featured_df)}")
        print(f"Total Features: {len(featured_df.columns)}")
        print(f"Locations: {featured_df['location'].unique().tolist()}")
        print("\nKey Generated Features:")
        key_cols = [
            "timestamp", "location", "hour", "day_of_week",
            "AQI", "previous_1_hour_AQI", "previous_3_hour_AQI", "previous_6_hour_AQI",
            "rolling_3_hour_AQI", "rolling_6_hour_AQI", "rolling_12_hour_AQI",
            "PM2.5", "previous_PM2.5", "PM10", "previous_PM10",
            "temperature", "humidity", "wind_speed", "ventilation_index"
        ]
        available_key_cols = [c for c in key_cols if c in featured_df.columns]
        print(featured_df[available_key_cols].head(5).to_string())
        print(f"\nFeature matrix successfully written to: {pipeline.output_path}")
    except Exception as e:
        logger.error(f"Feature engineering failed: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
