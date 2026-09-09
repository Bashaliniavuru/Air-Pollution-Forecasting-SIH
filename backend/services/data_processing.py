"""
Data Processing Pipeline for Air Pollution-Weather Coupled Forecasting (Delhi-NCR).

Implements the 9-stage engineering pipeline:
1. Dataset loading
2. Data validation
3. Timestamp conversion
4. Sorting by location and timestamp
5. Duplicate detection/removal
6. Missing-value handling
7. Numerical validation
8. Basic outlier handling where appropriate
9. Preparation of clean training data
"""

import os
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import numpy as np
import pandas as pd

# Ensure repository root is on sys.path
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

try:
    from utils.logger import setup_logger
    logger = setup_logger("data_processing")
except ImportError:
    import logging
    logging.basicConfig(level=logging.INFO, format="[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s")
    logger = logging.getLogger("data_processing")


class DataProcessingPipeline:
    """
    Modular, robust Pandas & NumPy data processing pipeline for coupled
    air pollution and meteorological timeseries datasets.
    """

    MANDATORY_COLUMNS: List[str] = [
        "timestamp", "location", "latitude", "longitude", "AQI",
        "PM2.5", "PM10", "NO2", "SO2", "CO", "O3",
        "temperature", "humidity", "wind_speed", "wind_direction",
        "atmospheric_pressure", "rainfall"
    ]

    NUMERICAL_BOUNDS: Dict[str, Tuple[float, float]] = {
        "PM2.5": (0.0, 1000.0),
        "PM10": (0.0, 1500.0),
        "NO2": (0.0, 800.0),
        "SO2": (0.0, 1000.0),
        "CO": (0.0, 50.0),
        "O3": (0.0, 1000.0),
        "AQI": (0.0, 500.0),
        "temperature": (-10.0, 60.0),
        "humidity": (0.0, 100.0),
        "wind_speed": (0.0, 150.0),
        "wind_direction": (0.0, 360.0),
        "atmospheric_pressure": (850.0, 1100.0),
        "rainfall": (0.0, 500.0),
    }

    def __init__(self, raw_data_path: Optional[str] = None, processed_data_path: Optional[str] = None):
        self.raw_data_path = Path(raw_data_path) if raw_data_path else REPO_ROOT / "data" / "delhi_ncr_demo_data.csv"
        self.processed_data_path = Path(processed_data_path) if processed_data_path else REPO_ROOT / "data" / "processed" / "delhi_ncr_processed_data.csv"
        self.pipeline_metrics: Dict[str, any] = {}

    # 1. Dataset loading
    def load_dataset(self, file_path: Optional[str] = None) -> pd.DataFrame:
        target_path = Path(file_path) if file_path else self.raw_data_path
        if not target_path.exists():
            raise FileNotFoundError(f"Source dataset not found at: {target_path}")
        
        logger.info(f"[Stage 1/9] Loading dataset from: {target_path}")
        df = pd.read_csv(target_path)
        logger.info(f"Loaded {len(df)} records with {len(df.columns)} columns.")
        self.pipeline_metrics["raw_record_count"] = len(df)
        return df

    # 2. Data validation
    def validate_schema(self, df: pd.DataFrame) -> pd.DataFrame:
        logger.info("[Stage 2/9] Validating dataset schema...")
        missing_cols = [col for col in self.MANDATORY_COLUMNS if col not in df.columns]
        if missing_cols:
            error_msg = f"Schema validation failed! Missing required columns: {missing_cols}"
            logger.error(error_msg)
            raise ValueError(error_msg)

        logger.info(f"Schema validation successful. All {len(self.MANDATORY_COLUMNS)} mandatory columns present.")
        self.pipeline_metrics["validated_columns"] = list(df.columns)
        return df

    # 3. Timestamp conversion
    def convert_timestamps(self, df: pd.DataFrame, col: str = "timestamp") -> pd.DataFrame:
        logger.info("[Stage 3/9] Converting timestamp column to UTC datetime...")
        df = df.copy()
        df[col] = pd.to_datetime(df[col], utc=True, errors="coerce")
        null_ts = df[col].isnull().sum()
        if null_ts > 0:
            logger.warning(f"Detected {null_ts} invalid timestamp entries. Dropping unparseable timestamps.")
            df = df.dropna(subset=[col])
        logger.info("Timestamp conversion completed successfully.")
        return df

    # 4. Sorting by location and timestamp
    def sort_data(self, df: pd.DataFrame) -> pd.DataFrame:
        logger.info("[Stage 4/9] Sorting dataset by ['location', 'timestamp']...")
        df = df.sort_values(by=["location", "timestamp"], ascending=[True, True]).reset_index(drop=True)
        return df

    # 5. Duplicate detection/removal
    def remove_duplicates(self, df: pd.DataFrame) -> pd.DataFrame:
        logger.info("[Stage 5/9] Detecting and removing duplicates...")
        initial_len = len(df)
        df = df.drop_duplicates(subset=["location", "timestamp"], keep="first").reset_index(drop=True)
        duplicates_removed = initial_len - len(df)
        logger.info(f"Duplicates removed: {duplicates_removed}. Remaining records: {len(df)}")
        self.pipeline_metrics["duplicates_removed"] = duplicates_removed
        return df

    # 6. Missing-value handling
    def handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        logger.info("[Stage 6/9] Handling missing values using grouped forward/backward fill and medians...")
        df = df.copy()
        numerical_cols = list(self.NUMERICAL_BOUNDS.keys())
        missing_before = df[numerical_cols].isnull().sum().to_dict()

        # Group-wise forward-fill and backward-fill within each location timeseries
        df[numerical_cols] = df.groupby("location")[numerical_cols].transform(
            lambda group: group.ffill().bfill()
        )

        # Fallback to location-level median for any remaining edge NaNs
        for col in numerical_cols:
            if df[col].isnull().any():
                df[col] = df.groupby("location")[col].transform(lambda g: g.fillna(g.median()))
                # Global fallback if entire location is null
                if df[col].isnull().any():
                    df[col] = df[col].fillna(df[col].median())

        missing_after = df[numerical_cols].isnull().sum().to_dict()
        logger.info(f"Missing-value handling complete. Null counts remaining: {sum(missing_after.values())}")
        self.pipeline_metrics["missing_values_handled"] = {k: missing_before[k] - missing_after[k] for k in missing_before}
        return df

    # 7. Numerical validation
    def validate_numerical_ranges(self, df: pd.DataFrame) -> pd.DataFrame:
        logger.info("[Stage 7/9] Enforcing numerical sanity bounds and non-negativity...")
        df = df.copy()
        adjustments = {}

        for col, (min_val, max_val) in self.NUMERICAL_BOUNDS.items():
            if col in df.columns:
                out_of_bounds = ((df[col] < min_val) | (df[col] > max_val)).sum()
                if out_of_bounds > 0:
                    logger.warning(f"Feature '{col}' had {out_of_bounds} values outside [{min_val}, {max_val}]. Clipping...")
                    adjustments[col] = int(out_of_bounds)
                df[col] = df[col].clip(lower=min_val, upper=max_val)

        # Round values for clean floating precision
        df["AQI"] = df["AQI"].round().astype(int)
        for col in ["PM2.5", "PM10", "NO2", "SO2", "O3", "temperature", "humidity", "wind_speed", "wind_direction", "atmospheric_pressure", "rainfall"]:
            df[col] = df[col].round(2)
        df["CO"] = df["CO"].round(3)

        self.pipeline_metrics["numerical_bound_adjustments"] = adjustments
        return df

    # 8. Basic outlier handling where appropriate
    def handle_outliers(self, df: pd.DataFrame) -> pd.DataFrame:
        logger.info("[Stage 8/9] Applying adaptive quantile-based outlier capping per location...")
        df = df.copy()
        pollutant_cols = ["PM2.5", "PM10", "NO2", "SO2", "CO", "O3"]
        outlier_counts = {}

        # Use 0.5% and 99.5% quantiles per location to suppress unphysical sensor spikes while preserving legitimate severe smog episodes
        for col in pollutant_cols:
            def clip_series(s: pd.Series) -> pd.Series:
                q_low = s.quantile(0.005)
                q_high = s.quantile(0.995)
                return s.clip(lower=q_low, upper=q_high)

            before = df[col].copy()
            df[col] = df.groupby("location")[col].transform(clip_series)
            diffs = (before != df[col]).sum()
            outlier_counts[col] = int(diffs)

        logger.info(f"Adaptive outlier capping applied: {outlier_counts}")
        self.pipeline_metrics["outliers_capped"] = outlier_counts
        return df

    # 9. Preparation of clean training data & feature engineering
    def prepare_training_data(self, df: pd.DataFrame, output_path: Optional[str] = None) -> pd.DataFrame:
        logger.info("[Stage 9/9] Engineering coupled meteorological-air pollution features for model training...")
        df = df.copy()

        # Feature 1: Approximate Ventilation Index = Wind Speed (m/s) * Estimated Boundary Layer Height (m)
        # Using temperature and solar proxy to estimate boundary layer height (300m night to 1500m day)
        hour = df["timestamp"].dt.hour
        solar_proxy = np.sin((hour - 6) * np.pi / 12).clip(lower=0.0)
        df["estimated_pbl_height_m"] = (350.0 + 950.0 * solar_proxy * (1.0 - df["humidity"] / 150.0)).round(1)
        wind_speed_ms = df["wind_speed"] * 1000.0 / 3600.0
        df["ventilation_index"] = (wind_speed_ms * df["estimated_pbl_height_m"]).round(1)

        # Feature 2: Stagnation Index (0 to 1, higher means worse dispersion)
        # Calm winds (< 6 km/h) and high humidity (> 70%) trigger stagnation
        calm_wind_factor = (1.0 - (df["wind_speed"] / 15.0).clip(lower=0.0, upper=1.0))
        high_humidity_factor = ((df["humidity"] - 40.0) / 60.0).clip(lower=0.0, upper=1.0)
        df["atmospheric_stagnation_index"] = (0.6 * calm_wind_factor + 0.4 * high_humidity_factor).round(3)

        # Feature 3: PM Ratio (PM2.5 / PM10) indicating combustion vs mechanical dust
        df["pm_ratio"] = (df["PM2.5"] / (df["PM10"] + 1e-5)).round(3)

        # Feature 4: Temporal lag and rolling features per location (3-hour rolling means)
        df["pm2_5_roll_3h"] = df.groupby("location")["PM2.5"].transform(lambda s: s.rolling(3, min_periods=1).mean()).round(2)
        df["pm10_roll_3h"] = df.groupby("location")["PM10"].transform(lambda s: s.rolling(3, min_periods=1).mean()).round(2)
        df["aqi_roll_3h"] = df.groupby("location")["AQI"].transform(lambda s: s.rolling(3, min_periods=1).mean()).round(1)

        # Target export path
        target_output = Path(output_path) if output_path else self.processed_data_path
        target_output.parent.mkdir(parents=True, exist_ok=True)

        logger.info(f"Saving clean processed training data separately to: {target_output}")
        df.to_csv(target_output, index=False)
        logger.info(f"Processed dataset saved successfully ({len(df)} rows, {len(df.columns)} columns).")
        logger.info(f"CRITICAL CHECK: Raw source at '{self.raw_data_path}' left completely unmodified.")

        self.pipeline_metrics["processed_record_count"] = len(df)
        self.pipeline_metrics["processed_features"] = list(df.columns)
        self.pipeline_metrics["processed_output_path"] = str(target_output)
        return df

    def run_pipeline(self, input_file: Optional[str] = None, output_file: Optional[str] = None) -> pd.DataFrame:
        """Executes the complete 9-stage data processing pipeline."""
        logger.info("================ STARTING DATA PROCESSING PIPELINE ================")
        df = self.load_dataset(input_file)
        df = self.validate_schema(df)
        df = self.convert_timestamps(df)
        df = self.sort_data(df)
        df = self.remove_duplicates(df)
        df = self.handle_missing_values(df)
        df = self.validate_numerical_ranges(df)
        df = self.handle_outliers(df)
        clean_df = self.prepare_training_data(df, output_file)
        logger.info("================ DATA PROCESSING PIPELINE COMPLETED ================")
        return clean_df


def main():
    pipeline = DataProcessingPipeline()
    try:
        processed_df = pipeline.run_pipeline()
        print("\n--- Pipeline Summary Statistics ---")
        print(f"Total Processed Records: {len(processed_df)}")
        print(f"Locations Covered: {processed_df['location'].unique().tolist()}")
        print(f"Time Range: {processed_df['timestamp'].min()} to {processed_df['timestamp'].max()}")
        print(f"Total Columns: {len(processed_df.columns)}")
        print("\nEngineered Columns:", [c for c in processed_df.columns if c not in DataProcessingPipeline.MANDATORY_COLUMNS])
        print("\nFirst 3 rows of processed dataset:")
        print(processed_df[["timestamp", "location", "AQI", "PM2.5", "ventilation_index", "atmospheric_stagnation_index"]].head(3).to_string())
        print(f"\nProcessed data successfully saved to: {pipeline.processed_data_path}")
    except Exception as e:
        logger.error(f"Pipeline failure: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
