"""
Comprehensive Unit Tests for Feature Engineering Pipeline.
Verifies:
1. Generation of all requested features:
   - hour, day, day_of_week, month
   - previous_1_hour_AQI, previous_3_hour_AQI, previous_6_hour_AQI
   - rolling_3_hour_AQI, rolling_6_hour_AQI, rolling_12_hour_AQI
   - previous_PM2.5, previous_PM10
   - temperature, humidity, wind_speed, wind_direction, atmospheric_pressure, rainfall
2. Location isolation: shifts and rolling means NEVER cross location boundaries.
3. Causal integrity: strict absence of future data leakage.
"""

import os
import sys
import unittest
import pandas as pd
import numpy as np
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

from backend.services.feature_engineering import FeatureEngineeringPipeline


class TestFeatureEngineeringPipeline(unittest.TestCase):

    def setUp(self):
        self.pipeline = FeatureEngineeringPipeline()

    def test_end_to_end_pipeline_execution(self):
        featured_df = self.pipeline.run_pipeline()
        self.assertEqual(len(featured_df), 840)

        # Check temporal features
        self.assertIn("hour", featured_df.columns)
        self.assertIn("day", featured_df.columns)
        self.assertIn("day_of_week", featured_df.columns)
        self.assertIn("month", featured_df.columns)

        # Check AQI lag features
        self.assertIn("previous_1_hour_AQI", featured_df.columns)
        self.assertIn("previous_3_hour_AQI", featured_df.columns)
        self.assertIn("previous_6_hour_AQI", featured_df.columns)

        # Check AQI rolling features
        self.assertIn("rolling_3_hour_AQI", featured_df.columns)
        self.assertIn("rolling_6_hour_AQI", featured_df.columns)
        self.assertIn("rolling_12_hour_AQI", featured_df.columns)

        # Check pollution lag features
        self.assertIn("previous_PM2.5", featured_df.columns)
        self.assertIn("previous_PM10", featured_df.columns)

        # Check weather features
        for weather_col in ["temperature", "humidity", "wind_speed", "wind_direction", "atmospheric_pressure", "rainfall"]:
            self.assertIn(weather_col, featured_df.columns)

        # Ensure no NaN values remain
        self.assertEqual(featured_df.isnull().sum().sum(), 0)

    def test_lag_accuracy_and_location_isolation(self):
        # Construct controlled synthetic data for 2 locations
        synthetic_data = {
            "timestamp": pd.date_range("2026-09-01 00:00:00", periods=10, freq="h", tz="UTC").tolist() * 2,
            "location": ["Delhi"] * 10 + ["Noida"] * 10,
            "latitude": [28.61] * 20,
            "longitude": [77.20] * 20,
            "AQI": list(range(100, 110)) + list(range(200, 210)),
            "PM2.5": [50.0 + i for i in range(10)] + [150.0 + i for i in range(10)],
            "PM10": [90.0 + i for i in range(10)] + [190.0 + i for i in range(10)],
            "temperature": [25.0] * 20,
            "humidity": [60.0] * 20,
            "wind_speed": [5.0] * 20,
            "wind_direction": [280.0] * 20,
            "atmospheric_pressure": [1010.0] * 20,
            "rainfall": [0.0] * 20
        }
        df = pd.DataFrame(synthetic_data)
        transformed = self.pipeline.transform(df)

        delhi_rows = transformed[transformed["location"] == "Delhi"].reset_index(drop=True)
        noida_rows = transformed[transformed["location"] == "Noida"].reset_index(drop=True)

        # 1. Check lag accuracy for Delhi at step 5
        # AQI at step 5 is 105; previous_1_hour should be 104, previous_3_hour should be 102
        self.assertEqual(delhi_rows.loc[5, "previous_1_hour_AQI"], 104)
        self.assertEqual(delhi_rows.loc[5, "previous_3_hour_AQI"], 102)
        self.assertEqual(delhi_rows.loc[5, "previous_PM2.5"], 54.0)

        # 2. Check location isolation: Noida row 0 MUST NOT bleed Delhi's row 9 values!
        # Noida AQI at row 0 is 200. Because it is the first row for Noida,
        # previous_1_hour_AQI must be 200 (imputed within Noida), NOT Delhi's 109!
        self.assertEqual(noida_rows.loc[0, "previous_1_hour_AQI"], 200)
        self.assertNotEqual(noida_rows.loc[0, "previous_1_hour_AQI"], 109)

        # 3. Check rolling mean causal integrity:
        # At step 3 for Delhi (AQI values so far: t0=100, t1=101, t2=102, t3=103)
        # rolling_3_hour_AQI looks back at past 3 steps (t0, t1, t2) = (100+101+102)/3 = 101.0
        # It must NOT include t3 (103) or future steps!
        expected_rolling_3 = round((100 + 101 + 102) / 3, 1)
        self.assertEqual(delhi_rows.loc[3, "rolling_3_hour_AQI"], expected_rolling_3)

if __name__ == "__main__":
    unittest.main()
