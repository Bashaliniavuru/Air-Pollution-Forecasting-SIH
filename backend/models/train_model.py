"""
XGBoost AQI Forecasting Model Pipeline for Delhi-NCR.

Features:
- Direct multi-horizon forecasting (1-hour, 6-hour, 24-hour ahead AQI)
- Time-series feature integration (pollution, weather, lags, rolling, calendar)
- Strict chronological train/test split without data shuffling
- Evaluation with genuine test MAE, RMSE, and R2 metrics
- Persistent serialization under models/
- Modular inference interface extensible to future deep learning models (LSTM/GRU)
"""

import os
import sys
import json
import math
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Ensure root workspace directory is in python search path
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.services.feature_engineering import FeatureEngineeringPipeline
from utils.logger import setup_logger
from utils.constants import AQICategory

logger = setup_logger("train_model")


# ---------------------------------------------------------------------------
# 1. Abstract Forecaster Interface (Modular for XGBoost, LSTM, GRU)
# ---------------------------------------------------------------------------
class BaseForecaster(ABC):
    """
    Abstract interface for time-series air pollution forecasting models.
    Enables pluggable integration for XGBoost, LSTM, GRU, and Transformers.
    """

    @abstractmethod
    def load_models(self, models_dir: str) -> bool:
        """Loads model weights/artifacts from disk."""
        pass

    @abstractmethod
    def predict_1h(self, features: Union[Dict[str, Any], pd.DataFrame]) -> float:
        """Predicts AQI for 1-hour ahead horizon."""
        pass

    @abstractmethod
    def predict_6h(self, features: Union[Dict[str, Any], pd.DataFrame]) -> float:
        """Predicts AQI for 6-hour ahead horizon."""
        pass

    @abstractmethod
    def predict_24h(self, features: Union[Dict[str, Any], pd.DataFrame]) -> float:
        """Predicts AQI for 24-hour ahead horizon."""
        pass

    @abstractmethod
    def predict_all_horizons(self, features: Union[Dict[str, Any], pd.DataFrame]) -> Dict[str, Any]:
        """Predicts AQI across all supported multi-horizon targets (1h, 6h, 24h)."""
        pass


# ---------------------------------------------------------------------------
# 2. Delhi-NCR Multi-Station Realistic Dataset Generator
# ---------------------------------------------------------------------------
def generate_delhi_ncr_timeseries(
    num_days: int = 180,
    output_path: Optional[str] = None
) -> pd.DataFrame:
    """
    Generates realistic hourly air pollution & coupled meteorological time-series
    data for 4 CPCB Delhi-NCR stations incorporating atmospheric physics:
    - Anand Vihar: High industrial/transport emissions
    - ITO: High traffic corridor
    - R.K. Puram: Mixed residential/institutional
    - Punjabi Bagh: Commercial & residential
    """
    logger.info(f"Generating realistic {num_days}-day Delhi-NCR hourly dataset...")
    np.random.seed(42)

    stations = [
        {"id": "DELHI_ANAND_VIHAR", "name": "Anand Vihar", "base_pm25": 160.0, "base_pm10": 260.0},
        {"id": "DELHI_ITO", "name": "ITO Junction", "base_pm25": 135.0, "base_pm10": 220.0},
        {"id": "DELHI_RK_PURAM", "name": "R.K. Puram", "base_pm25": 110.0, "base_pm10": 185.0},
        {"id": "DELHI_PUNJABI_BAGH", "name": "Punjabi Bagh", "base_pm25": 140.0, "base_pm10": 230.0},
    ]

    start_date = pd.Timestamp("2026-01-01 00:00:00")
    total_hours = num_days * 24
    records = []

    for stn in stations:
        curr_pm25 = stn["base_pm25"]
        curr_pm10 = stn["base_pm10"]

        for h in range(total_hours):
            current_time = start_date + pd.Timedelta(hours=h)
            hour_val = current_time.hour
            month_val = current_time.month
            day_val = current_time.day

            # 1. Seasonal Meteorology: Winter (Jan/Feb) cold & stagnant, Summer warm, Monsoon rainy
            is_winter = month_val in [1, 2, 11, 12]
            is_monsoon = month_val in [7, 8, 9]

            base_temp = 14.0 if is_winter else 34.0 if month_val in [5, 6] else 26.0
            temp_c = base_temp + 6.0 * math.sin((hour_val - 9) * math.pi / 12) + np.random.normal(0, 1.5)

            humidity_pct = (
                80.0 - 20.0 * math.sin((hour_val - 9) * math.pi / 12) + np.random.normal(0, 4)
            )
            if is_monsoon:
                humidity_pct = min(98.0, humidity_pct + 15.0)
            humidity_pct = float(np.clip(humidity_pct, 20.0, 98.0))

            # Wind speed: higher in afternoon, calm at night/winter
            wind_speed = 3.5 + 4.0 * max(0.0, math.sin((hour_val - 10) * math.pi / 12)) + np.random.exponential(1.2)
            if is_winter:
                wind_speed *= 0.65  # Winter calm winds
            wind_speed = float(np.clip(wind_speed, 1.0, 25.0))

            wind_direction = float((270.0 + 30.0 * math.sin(h / 48) + np.random.normal(0, 15)) % 360)
            atmospheric_pressure = float(1015.0 - (temp_c - 15.0) * 0.4 + np.random.normal(0, 1.0))

            # Rainfall: sporadic, prominent in monsoon
            rainfall = 0.0
            if is_monsoon and np.random.random() < 0.12:
                rainfall = float(np.random.exponential(4.5))

            # Planetary Boundary Layer (PBL) Height (m): Collapses at night/winter (<400m), expands in day (>1200m)
            base_pbl = 380.0 if is_winter else 750.0
            pbl_height_m = base_pbl + 800.0 * max(0.0, math.sin((hour_val - 8) * math.pi / 12)) + np.random.normal(0, 50)
            pbl_height_m = float(np.clip(pbl_height_m, 200.0, 2200.0))

            # 2. Dynamic Emission Coupling:
            # Morning rush (8-10 AM), Evening rush (6-9 PM)
            traffic_multiplier = 1.0
            if 7 <= hour_val <= 10:
                traffic_multiplier = 1.45
            elif 17 <= hour_val <= 21:
                traffic_multiplier = 1.55

            # Atmospheric Stagnation Multiplier
            stagnation = 1.0
            if wind_speed < 6.0:
                stagnation += 0.30
            if pbl_height_m < 500.0:
                stagnation += 0.25
            if humidity_pct > 75.0:
                stagnation += 0.15

            # Monsoon rain scavenging
            washout = 0.65 if rainfall > 2.0 else 1.0

            # Autoregressive PM transition
            target_pm25 = (stn["base_pm25"] * traffic_multiplier * stagnation * washout)
            curr_pm25 = 0.82 * curr_pm25 + 0.18 * target_pm25 + np.random.normal(0, 6.0)
            curr_pm25 = float(np.clip(curr_pm25, 15.0, 550.0))

            target_pm10 = (stn["base_pm10"] * traffic_multiplier * stagnation * washout)
            curr_pm10 = 0.84 * curr_pm10 + 0.16 * target_pm10 + np.random.normal(0, 10.0)
            curr_pm10 = float(np.clip(curr_pm10, 30.0, 750.0))

            # Approximate Indian National AQI calculation
            current_aqi = int(min(500, max(25, curr_pm25 * 1.7 + curr_pm10 * 0.35 + np.random.normal(0, 3))))

            records.append({
                "timestamp": current_time.isoformat(),
                "station_id": stn["id"],
                "location": stn["name"],
                "current_aqi": current_aqi,
                "pm2_5": round(curr_pm25, 1),
                "pm10": round(curr_pm10, 1),
                "temperature": round(temp_c, 1),
                "humidity": round(humidity_pct, 1),
                "wind_speed": round(wind_speed, 1),
                "wind_direction": round(wind_direction, 1),
                "atmospheric_pressure": round(atmospheric_pressure, 1),
                "rainfall": round(rainfall, 1),
                "pbl_height_m": round(pbl_height_m, 1),
            })

    df = pd.DataFrame(records)
    logger.info(f"Generated {len(df)} total hourly records across {len(stations)} stations.")

    if output_path:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        df.to_csv(output_path, index=False)
        logger.info(f"Saved raw time-series to {output_path}")

    return df


# ---------------------------------------------------------------------------
# 3. Model Trainer Class (XGBoost Regressors)
# ---------------------------------------------------------------------------
class AQIModelTrainer:
    """
    Trains and evaluates XGBoost multi-horizon AQI models with strict
    chronological validation to prevent time-series data leakage.
    """

    HORIZONS: List[int] = [1, 6, 24]
    
    # Complete feature list explicitly aligned with specification
    FEATURE_COLUMNS: List[str] = [
        # Time features
        "hour", "day", "day_of_week", "month",
        # Current pollution features
        "pm2_5", "pm10",
        # Lag features
        "previous_1_hour_AQI", "previous_3_hour_AQI", "previous_6_hour_AQI",
        "previous_PM2.5", "previous_PM10",
        # Rolling features
        "rolling_3_hour_AQI", "rolling_6_hour_AQI", "rolling_12_hour_AQI",
        # Weather features
        "temperature", "humidity", "wind_speed", "wind_direction",
        "atmospheric_pressure", "rainfall"
    ]

    def __init__(self, models_dir: str = "models"):
        self.models_dir = os.path.abspath(models_dir)
        os.makedirs(self.models_dir, exist_ok=True)
        self.models: Dict[int, xgb.XGBRegressor] = {}
        self.evaluation_metrics: Dict[str, Dict[str, float]] = {}

    def prepare_dataset(
        self,
        df: pd.DataFrame
    ) -> Tuple[pd.DataFrame, List[str]]:
        """
        Runs FeatureEngineeringPipeline and constructs future multi-horizon targets.
        """
        logger.info("Executing feature engineering pipeline on raw time-series...")
        pipeline = FeatureEngineeringPipeline(
            avoid_leakage=True,
            fill_initial_lags=True,
            keep_original_columns=True
        )
        engineered_df = pipeline.fit_transform(df)

        # Sort chronologically by location and timestamp
        engineered_df["_dt"] = pd.to_datetime(engineered_df["timestamp"])
        loc_col = "location" if "location" in engineered_df.columns else "station_id"
        engineered_df = engineered_df.sort_values(by=[loc_col, "_dt"]).reset_index(drop=True)

        # Construct target columns for future horizons strictly per location
        grouped = engineered_df.groupby(loc_col, group_keys=False)
        for h in self.HORIZONS:
            target_col = f"target_{h}h_aqi"
            engineered_df[target_col] = grouped["current_aqi"].shift(-h)

        # Drop rows where future target is NaN (tail of each station's series)
        max_horizon = max(self.HORIZONS)
        engineered_df = engineered_df.dropna(subset=[f"target_{max_horizon}h_aqi"]).reset_index(drop=True)

        logger.info(f"Dataset prepared with {len(engineered_df)} valid samples.")
        return engineered_df, self.FEATURE_COLUMNS

    def split_chronologically(
        self,
        df: pd.DataFrame,
        train_ratio: float = 0.80
    ) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Splits data chronologically.
        DOES NOT SHUFFLE THE DATA.
        Train on earlier timestamps, Test on strictly later timestamps.
        """
        df["_dt"] = pd.to_datetime(df["timestamp"])
        # Global chronological cutoff ensuring all stations are split temporally
        unique_timestamps = np.sort(df["_dt"].unique())
        split_idx = int(len(unique_timestamps) * train_ratio)
        cutoff_time = unique_timestamps[split_idx]

        train_df = df[df["_dt"] < cutoff_time].copy()
        test_df = df[df["_dt"] >= cutoff_time].copy()

        logger.info(f"Chronological split completed at timestamp: {cutoff_time}")
        logger.info(f"Train samples: {len(train_df)} | Test samples: {len(test_df)}")

        return train_df, test_df

    def train_models(
        self,
        train_df: pd.DataFrame,
        test_df: pd.DataFrame
    ) -> Dict[str, Dict[str, float]]:
        """
        Trains an XGBoost regressor for each prediction horizon (1h, 6h, 24h)
        and computes genuine test set MAE, RMSE, and R2.
        """
        X_train = train_df[self.FEATURE_COLUMNS]
        X_test = test_df[self.FEATURE_COLUMNS]

        self.evaluation_metrics = {}

        for h in self.HORIZONS:
            target_col = f"target_{h}h_aqi"
            y_train = train_df[target_col]
            y_test = test_df[target_col]

            logger.info(f"Training XGBoost Regressor for {h}-hour ahead AQI forecasting...")

            # Model hyperparameters tuned for coupled atmospheric time-series
            model = xgb.XGBRegressor(
                n_estimators=250,
                learning_rate=0.04,
                max_depth=5,
                subsample=0.85,
                colsample_bytree=0.85,
                min_child_weight=3,
                random_state=42,
                n_jobs=-1
            )

            model.fit(
                X_train, y_train,
                eval_set=[(X_train, y_train), (X_test, y_test)],
                verbose=False
            )

            self.models[h] = model

            # Evaluate strictly on unseen chronological test data
            y_pred = model.predict(X_test)
            mae = float(mean_absolute_error(y_test, y_pred))
            mse = float(mean_squared_error(y_test, y_pred))
            rmse = float(np.sqrt(mse))
            r2 = float(r2_score(y_test, y_pred))

            metrics = {
                "horizon_hours": h,
                "MAE": round(mae, 3),
                "RMSE": round(rmse, 3),
                "R2": round(r2, 4),
                "test_samples": len(y_test),
                "target_mean": round(float(y_test.mean()), 2),
                "target_std": round(float(y_test.std()), 2),
            }

            self.evaluation_metrics[f"{h}h"] = metrics
            logger.info(f"[{h}-Hour Ahead Horizon] Calculated Test Metrics: MAE={metrics['MAE']}, RMSE={metrics['RMSE']}, R²={metrics['R2']}")

        return self.evaluation_metrics

    def save_models(self) -> Dict[str, str]:
        """Saves trained models and metadata under models/."""
        saved_paths = {}

        for h, model in self.models.items():
            model_path = os.path.join(self.models_dir, f"xgboost_aqi_{h}h.json")
            model.save_model(model_path)
            saved_paths[f"{h}h"] = model_path
            logger.info(f"Saved {h}h XGBoost model to {model_path}")

        metadata = {
            "model_family": "XGBoost",
            "model_type": "DirectMultiHorizonRegressor",
            "feature_columns": self.FEATURE_COLUMNS,
            "horizons_supported": self.HORIZONS,
            "metrics": self.evaluation_metrics,
            "trained_at": pd.Timestamp.now("UTC").isoformat(),
            "status": "TRAINED_AND_VERIFIED",
        }

        metadata_path = os.path.join(self.models_dir, "xgboost_metadata.json")
        with open(metadata_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)

        saved_paths["metadata"] = metadata_path
        logger.info(f"Saved model metadata to {metadata_path}")
        return saved_paths


# ---------------------------------------------------------------------------
# 4. Modular Inference Class (Compatible with BaseInferenceModel & BaseForecaster)
# ---------------------------------------------------------------------------
class XGBoostForecaster(BaseForecaster):
    """
    Production inference engine for multi-horizon AQI forecasting.
    Implements BaseForecaster to ensure plug-and-play modularity
    alongside future LSTM and GRU models.
    """

    def __init__(self, models_dir: str = "models"):
        self.models_dir = os.path.abspath(models_dir)
        self.models: Dict[int, xgb.XGBRegressor] = {}
        self.metadata: Dict[str, Any] = {}
        self.feature_columns: List[str] = AQIModelTrainer.FEATURE_COLUMNS
        self.is_loaded: bool = False
        self.load_models(self.models_dir)

    def load_models(self, models_dir: str) -> bool:
        """Loads serialized XGBoost models from disk using robust multi-path resolution."""
        candidate_dirs = [
            os.path.abspath(models_dir),
            os.path.join(ROOT_DIR, "models"),
            os.path.join(ROOT_DIR, models_dir),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "models")),
        ]
        
        target_dir = os.path.abspath(models_dir)
        for cd in candidate_dirs:
            if os.path.exists(os.path.join(cd, "xgboost_aqi_1h.json")):
                target_dir = cd
                break
                
        self.models_dir = target_dir
        try:
            for h in [1, 6, 24]:
                model_path = os.path.join(self.models_dir, f"xgboost_aqi_{h}h.json")
                if os.path.exists(model_path):
                    model = xgb.XGBRegressor()
                    model.load_model(model_path)
                    self.models[h] = model
                else:
                    logger.warning(f"Model file not found: {model_path}")

            meta_path = os.path.join(self.models_dir, "xgboost_metadata.json")
            if os.path.exists(meta_path):
                with open(meta_path, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
                self.feature_columns = self.metadata.get("feature_columns", self.feature_columns)

            self.is_loaded = len(self.models) == 3
            if self.is_loaded:
                logger.info(f"XGBoostForecaster successfully loaded all 3 horizon models from {self.models_dir}")
            return self.is_loaded
        except Exception as e:
            logger.error(f"Failed to load models from {models_dir}: {e}")
            self.is_loaded = False
            return False

    def _prepare_feature_row(self, features: Union[Dict[str, Any], pd.DataFrame]) -> pd.DataFrame:
        """Validates and arranges input features into model input shape."""
        if isinstance(features, dict):
            # Check if feature engineering needs to run
            if not all(col in features for col in self.feature_columns):
                # Run single-row or batch feature engineering
                temp_df = pd.DataFrame([features])
                pipeline = FeatureEngineeringPipeline(keep_original_columns=True)
                features_df = pipeline.fit_transform(temp_df)
            else:
                features_df = pd.DataFrame([features])
        elif isinstance(features, pd.DataFrame):
            if not all(col in features.columns for col in self.feature_columns):
                pipeline = FeatureEngineeringPipeline(keep_original_columns=True)
                features_df = pipeline.fit_transform(features)
            else:
                features_df = features.copy()
        else:
            raise ValueError(f"Unsupported features type: {type(features)}")

        # Ensure all required columns exist, imputing default if necessary
        for col in self.feature_columns:
            if col not in features_df.columns:
                features_df[col] = 0.0

        return features_df[self.feature_columns]

    def predict_1h(self, features: Union[Dict[str, Any], pd.DataFrame]) -> float:
        """Produces 1-hour ahead AQI prediction."""
        X = self._prepare_feature_row(features)
        pred = self.models[1].predict(X)
        return round(float(np.clip(pred[0], 0, 500)), 1)

    def predict_6h(self, features: Union[Dict[str, Any], pd.DataFrame]) -> float:
        """Produces 6-hour ahead AQI prediction."""
        X = self._prepare_feature_row(features)
        pred = self.models[6].predict(X)
        return round(float(np.clip(pred[0], 0, 500)), 1)

    def predict_24h(self, features: Union[Dict[str, Any], pd.DataFrame]) -> float:
        """Produces 24-hour ahead AQI forecast."""
        X = self._prepare_feature_row(features)
        pred = self.models[24].predict(X)
        return round(float(np.clip(pred[0], 0, 500)), 1)

    def predict_all_horizons(self, features: Union[Dict[str, Any], pd.DataFrame]) -> Dict[str, Any]:
        """
        Produces multi-horizon forecasts:
        - 1-hour AQI prediction
        - 6-hour AQI prediction
        - 24-hour AQI forecast
        Alongside calculated AQI categories and emergency GRAP stage recommendations.
        """
        X = self._prepare_feature_row(features)

        p1 = round(float(np.clip(self.models[1].predict(X)[0], 0, 500)), 1)
        p6 = round(float(np.clip(self.models[6].predict(X)[0], 0, 500)), 1)
        p24 = round(float(np.clip(self.models[24].predict(X)[0], 0, 500)), 1)

        def get_category(val: float) -> str:
            if val <= 50:
                return AQICategory.GOOD.value
            elif val <= 100:
                return AQICategory.SATISFACTORY.value
            elif val <= 200:
                return AQICategory.MODERATE.value
            elif val <= 300:
                return AQICategory.POOR.value
            elif val <= 400:
                return AQICategory.VERY_POOR.value
            else:
                return AQICategory.SEVERE.value

        grap_stage = "None"
        if p24 > 450:
            grap_stage = "GRAP Stage IV (Severe+ / Emergency)"
        elif p24 > 400:
            grap_stage = "GRAP Stage III (Severe)"
        elif p24 > 300:
            grap_stage = "GRAP Stage II (Very Poor)"
        elif p24 > 200:
            grap_stage = "GRAP Stage I (Poor)"

        return {
            "model_type": "XGBoost Regressor",
            "forecast_horizons": {
                "1_hour": {"predicted_aqi": p1, "category": get_category(p1)},
                "6_hour": {"predicted_aqi": p6, "category": get_category(p6)},
                "24_hour": {"predicted_aqi": p24, "category": get_category(p24)},
            },
            "recommended_action": grap_stage,
            "status": "SUCCESS",
            "test_accuracy_metrics": self.metadata.get("metrics", {}),
        }

    def load_model(self, model_path: str = "models") -> bool:
        """Alias for load_models to implement BaseInferenceModel interface."""
        return self.load_models(model_path)

    def predict(self, input_features: Dict[str, Any]) -> Dict[str, Any]:
        """Alias for predict_all_horizons to implement BaseInferenceModel interface."""
        return self.predict_all_horizons(input_features)


# ---------------------------------------------------------------------------
# 5. Pipeline Execution Function
# ---------------------------------------------------------------------------
def train_and_evaluate(
    num_days: int = 180,
    models_dir: str = "models",
    raw_data_path: str = "data/raw/delhi_ncr_hourly.csv",
    processed_data_path: str = "data/processed/delhi_ncr_features.csv"
) -> Dict[str, Any]:
    """
    Unified entry point to generate/load data, engineer features,
    chronologically split, train XGBoost, evaluate test metrics, and serialize.
    """
    logger.info("=" * 65)
    logger.info("STARTING AIR POLLUTION XGBOOST FORECASTING PIPELINE")
    logger.info("=" * 65)

    # Step 1: Load or Generate Dataset
    if not os.path.exists(raw_data_path):
        raw_df = generate_delhi_ncr_timeseries(num_days=num_days, output_path=raw_data_path)
    else:
        logger.info(f"Loading existing raw dataset from {raw_data_path}")
        raw_df = pd.read_csv(raw_data_path)

    # Step 2: Feature Engineering & Multi-Horizon Targets
    trainer = AQIModelTrainer(models_dir=models_dir)
    engineered_df, feature_cols = trainer.prepare_dataset(raw_df)

    # Save processed features
    os.makedirs(os.path.dirname(processed_data_path), exist_ok=True)
    engineered_df.to_csv(processed_data_path, index=False)
    logger.info(f"Processed feature matrix saved to {processed_data_path}")

    # Step 3: Chronological Train / Test Split (Strictly No Shuffling)
    train_df, test_df = trainer.split_chronologically(engineered_df, train_ratio=0.80)

    # Step 4: Train & Calculate MAE, RMSE, R2
    metrics = trainer.train_models(train_df, test_df)

    # Step 5: Save Models & Metadata
    saved_paths = trainer.save_models()

    logger.info("=" * 65)
    logger.info("GENUINE CALCULATED TEST METRICS:")
    for h, met in metrics.items():
        logger.info(f" -> Horizon {h}: MAE = {met['MAE']} | RMSE = {met['RMSE']} | R² = {met['R2']}")
    logger.info("=" * 65)

    return {
        "metrics": metrics,
        "saved_paths": saved_paths,
        "feature_columns": feature_cols,
        "train_samples": len(train_df),
        "test_samples": len(test_df),
    }


if __name__ == "__main__":
    results = train_and_evaluate()
    print("\nTraining completed successfully!")
    print(json.dumps(results["metrics"], indent=2))
