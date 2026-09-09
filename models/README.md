# Models Layer (`models/`)

This directory houses all data schemas, Pydantic request/response validation contracts, and AI/ML model abstractions for the Air Pollution-Weather Coupled Forecasting System.

## Architecture

- **`schemas.py`**: Defines Pydantic v2 data models (`StationObservation`, `AQIForecastItem`, `TaskRequest`, `TaskResponse`, `SystemMetrics`, `HealthResponse`) enforcing strict types on pollutant concentrations (PM2.5, PM10, NO2) and meteorological features (Temperature, Wind Speed, PBL Height, Humidity).
- **`ml_models.py`**: Defines `BaseInferenceModel` interface and `BaselineScorer` implementing physics-informed meteorological coupling (Ventilation Index = Wind Speed × PBL Height; Stagnation Factor modifiers).

## Adding a Custom ML/Deep Learning Forecaster

1. Subclass `BaseInferenceModel` in `models/ml_models.py` (e.g. LSTM, XGBoost, or Spatio-Temporal Graph Neural Network).
2. Implement `load_model(model_path)` and `predict(input_features)`.
3. Accept multi-station timeseries from `models/schemas.py`.
4. Integrate the inference pipeline into `services/ai_service.py`.
