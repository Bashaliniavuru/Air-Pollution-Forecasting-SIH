"""
Root services alias for backend.services.risk_service.
Allows seamless imports from `services.risk_service` or `backend.services.risk_service`.
"""
import sys
import os

# Ensure root is in path
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from backend.services.risk_service import (
    RiskLevel,
    AQICategory,
    WeatherAnalysis,
    PollutionRiskService,
    get_category_from_aqi,
    get_risk_level_from_aqi,
    get_risk_service
)

__all__ = [
    "RiskLevel",
    "AQICategory",
    "WeatherAnalysis",
    "PollutionRiskService",
    "get_category_from_aqi",
    "get_risk_level_from_aqi",
    "get_risk_service"
]
