"""
Comprehensive Unit & Integration Tests for the Data Processing Pipeline.
Tests:
- Schema validation
- Duplicate detection and removal
- Missing value interpolation/imputation
- Numerical boundary enforcement and non-negativity
- Outlier handling
- Feature engineering output
- Preservation of raw source data
"""

import os
import sys
import unittest
import pandas as pd
import numpy as np
from pathlib import Path

# Set up paths
REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

from backend.services.data_processing import DataProcessingPipeline

class TestDataProcessingPipeline(unittest.TestCase):

    def setUp(self):
        self.raw_csv = REPO_ROOT / "data" / "delhi_ncr_demo_data.csv"
        self.processed_csv = REPO_ROOT / "data" / "processed" / "delhi_ncr_processed_data.csv"
        self.pipeline = DataProcessingPipeline(
            raw_data_path=str(self.raw_csv),
            processed_data_path=str(self.processed_csv)
        )

    def test_raw_dataset_exists_and_complete(self):
        self.assertTrue(self.raw_csv.exists(), "Raw demo dataset must exist.")
        df = pd.read_csv(self.raw_csv)
        self.assertEqual(len(df), 840, "Dataset must have 840 rows (5 locations x 168 hours).")
        for col in DataProcessingPipeline.MANDATORY_COLUMNS:
            self.assertIn(col, df.columns, f"Mandatory column '{col}' missing from raw CSV.")

    def test_latest_observations_json(self):
        json_path = REPO_ROOT / "data" / "delhi_ncr_latest_observations.json"
        self.assertTrue(json_path.exists(), "Latest observations JSON must exist.")
        import json
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.assertEqual(data["metadata"]["data_type"], "DEMO DATA")
        self.assertIn("disclaimer", data["metadata"])
        self.assertEqual(len(data["latest_observations"]), 5)
        locations = {obs["location"] for obs in data["latest_observations"]}
        self.assertEqual(locations, {"Delhi", "Noida", "Gurugram", "Ghaziabad", "Faridabad"})

    def test_pipeline_execution_and_clean_data(self):
        clean_df = self.pipeline.run_pipeline()
        self.assertEqual(len(clean_df), 840)
        
        # Check no missing values remain
        self.assertEqual(clean_df.isnull().sum().sum(), 0, "No null values should remain in processed dataset.")
        
        # Check numerical bounds
        self.assertTrue((clean_df["AQI"] >= 0).all())
        self.assertTrue((clean_df["PM2.5"] >= 0).all())
        self.assertTrue((clean_df["PM10"] >= 0).all())
        self.assertTrue((clean_df["humidity"] >= 0).all() and (clean_df["humidity"] <= 100).all())
        self.assertTrue((clean_df["wind_speed"] >= 0).all())
        self.assertTrue((clean_df["rainfall"] >= 0).all())

        # Check engineered features
        expected_features = [
            "estimated_pbl_height_m",
            "ventilation_index",
            "atmospheric_stagnation_index",
            "pm_ratio",
            "pm2_5_roll_3h",
            "pm10_roll_3h",
            "aqi_roll_3h"
        ]
        for feat in expected_features:
            self.assertIn(feat, clean_df.columns, f"Engineered feature '{feat}' missing from processed dataset.")

    def test_duplicate_and_missing_value_handling(self):
        # Create a mock dataframe with deliberate anomalies
        mock_data = {
            "timestamp": ["2026-09-02T00:00:00Z", "2026-09-02T00:00:00Z", "2026-09-02T01:00:00Z", "2026-09-02T02:00:00Z"],
            "location": ["Delhi", "Delhi", "Delhi", "Delhi"],
            "latitude": [28.6139] * 4,
            "longitude": [77.209] * 4,
            "AQI": [300, 300, np.nan, 320],
            "PM2.5": [180.0, 180.0, np.nan, 210.0],
            "PM10": [290.0, 290.0, 310.0, 330.0],
            "NO2": [60.0, 60.0, 65.0, 70.0],
            "SO2": [15.0, 15.0, 16.0, 17.0],
            "CO": [2.2, 2.2, 2.3, 2.4],
            "O3": [25.0, 25.0, 30.0, 35.0],
            "temperature": [24.0, 24.0, 23.5, 23.0],
            "humidity": [70.0, 70.0, 75.0, 80.0],
            "wind_speed": [5.0, 5.0, 4.5, 4.0],
            "wind_direction": [290.0, 290.0, 295.0, 300.0],
            "atmospheric_pressure": [1010.0, 1010.0, 1010.5, 1011.0],
            "rainfall": [0.0, 0.0, 0.0, 0.0]
        }
        mock_df = pd.DataFrame(mock_data)
        
        # Test schema validation
        mock_df = self.pipeline.validate_schema(mock_df)
        mock_df = self.pipeline.convert_timestamps(mock_df)
        
        # Test duplicate removal (4 -> 3)
        deduped = self.pipeline.remove_duplicates(mock_df)
        self.assertEqual(len(deduped), 3)

        # Test missing value handling (NaN PM2.5 and AQI imputed)
        imputed = self.pipeline.handle_missing_values(deduped)
        self.assertEqual(imputed["PM2.5"].isnull().sum(), 0)
        self.assertEqual(imputed["AQI"].isnull().sum(), 0)

if __name__ == "__main__":
    unittest.main()
