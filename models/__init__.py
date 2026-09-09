"""
Models layer for Air Pollution-Weather Coupled Forecasting System (Delhi-NCR).
Includes Pydantic request/response schemas and ML/AI model abstraction interfaces.
"""

from .schemas import (
    HealthResponse,
    SystemMetrics,
    DataRecord,
    StationObservation,
    AQIForecastItem,
    TaskRequest,
    TaskResponse,
    ModuleStatus,
    RiskAssessmentRequest,
    RiskAssessmentResponse
)
from .ml_models import BaseInferenceModel, BaselineScorer, XGBoostForecaster

__all__ = [
    "HealthResponse",
    "SystemMetrics",
    "DataRecord",
    "StationObservation",
    "AQIForecastItem",
    "TaskRequest",
    "TaskResponse",
    "ModuleStatus",
    "RiskAssessmentRequest",
    "RiskAssessmentResponse",
    "BaseInferenceModel",
    "BaselineScorer",
    "XGBoostForecaster",
]
