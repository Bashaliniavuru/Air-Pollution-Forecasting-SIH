from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from utils.constants import AppStatus, TaskStatus, AQICategory, RiskLevel


class HealthResponse(BaseModel):
    status: AppStatus = AppStatus.ONLINE
    version: str
    region: str = "Delhi-NCR"
    timestamp: str
    uptime_seconds: float
    services: Dict[str, str] = Field(default_factory=dict)


class ModuleStatus(BaseModel):
    module_name: str
    status: str
    latency_ms: float
    details: Optional[str] = None


class SystemMetrics(BaseModel):
    total_requests: int = 0
    active_tasks: int = 0
    completed_tasks: int = 0
    system_load: float = 0.0
    memory_usage_mb: float = 0.0
    focus_region: str = "Delhi-NCR"
    modules: List[ModuleStatus] = Field(default_factory=list)


class StationObservation(BaseModel):
    station_id: str
    station_name: str
    location: str
    current_aqi: int
    category: AQICategory
    pm2_5: float
    pm10: float
    no2: float
    o3: Optional[float] = 38.4
    so2: Optional[float] = 14.2
    co: Optional[float] = 2.1
    # Meteorological coupled parameters
    temperature_c: float
    humidity_pct: float
    wind_speed_kmh: float
    wind_direction_deg: float
    pressure_hpa: Optional[float] = 1014.0
    rainfall_mm: Optional[float] = 0.0
    pbl_height_m: float  # Planetary boundary layer height
    ventilation_index: float
    lat: Optional[float] = 28.6139
    lon: Optional[float] = 77.2090
    timestamp: str


class DataRecord(BaseModel):
    record_id: str
    title: str
    category: str
    payload: Dict[str, Any]
    confidence_score: Optional[float] = None
    created_at: str


class AQIForecastItem(BaseModel):
    horizon_hours: int
    predicted_aqi: int
    category: AQICategory
    predicted_pm2_5: float
    predicted_pm10: float
    ventilation_risk: str
    inversion_risk: str
    recommendation: str


class TaskRequest(BaseModel):
    task_type: str = Field(..., description="Type of task: 'FORECAST_24H_AQI', 'ANALYZE_INVERSION', 'INGEST_STATION_DATA'")
    station_id: Optional[str] = "DELHI_ANAND_VIHAR"
    input_data: Dict[str, Any] = Field(default_factory=dict)
    priority: Optional[str] = "NORMAL"


class TaskResponse(BaseModel):
    task_id: str
    status: TaskStatus
    task_type: str
    station_id: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    created_at: str
    completed_at: Optional[str] = None
    message: Optional[str] = None


class GeminiExplainRequest(BaseModel):
    station_id: Optional[str] = "DELHI_CENTRAL"
    station_name: Optional[str] = "Delhi (NCT Overview)"
    location: Optional[str] = "Central Delhi"
    current_aqi: Optional[int] = 355
    category: Optional[str] = "VERY_POOR"
    pm2_5: Optional[float] = 195.0
    pm10: Optional[float] = 310.0
    no2: Optional[float] = 72.0
    o3: Optional[float] = 38.0
    so2: Optional[float] = 15.0
    co: Optional[float] = 2.4
    temperature_c: Optional[float] = 19.0
    humidity_pct: Optional[float] = 78.0
    wind_speed_kmh: Optional[float] = 5.8
    wind_direction_deg: Optional[float] = 295.0
    pbl_height_m: Optional[float] = 410.0
    ventilation_index: Optional[float] = 660.8
    forecast_aqi: Optional[int] = 390
    forecast_category: Optional[str] = "VERY_POOR"
    inversion_risk: Optional[str] = "HIGH"
    stagnation_multiplier: Optional[float] = 1.6
    custom_query: Optional[str] = None


class GeminiExplainResponse(BaseModel):
    status: str = "SUCCESS"
    model: str = "gemini-2.5-flash"
    is_ai_generated: bool = True
    is_fallback: bool = False
    station_name: str
    summary: str
    aqi_condition_analysis: str
    meteorological_coupling_analysis: str
    forecast_interpretation: str
    early_warning_explanation: str
    preventive_recommendations: Dict[str, List[str]] = Field(default_factory=dict)
    disclaimer: str = "🟡 DEMO DATA – For Prototype Demonstration Only – Physics-Grounded AI Analysis"
    timestamp: str
    error_message: Optional[str] = None


class RiskAssessmentRequest(BaseModel):
    predicted_aqi: int = Field(..., ge=0, description="Predicted numerical AQI value for Delhi-NCR")
    wind_speed_kmh: Optional[float] = Field(default=None, description="Wind speed in km/h")
    humidity_pct: Optional[float] = Field(default=None, description="Relative humidity in percentage (0-100)")
    rainfall_mm: Optional[float] = Field(default=0.0, description="Rainfall in mm (for precipitation scavenging)")
    pbl_height_m: Optional[float] = Field(default=None, description="Planetary boundary layer height in meters")
    temp_c: Optional[float] = Field(default=None, description="Temperature in degrees Celsius")
    station_id: Optional[str] = Field(default="DELHI_ANAND_VIHAR", description="Target Delhi-NCR station identifier")
    forecast_horizon: Optional[str] = Field(default="24h", description="Forecast time horizon (e.g., '24h', '48h', '72h')")


class RiskAssessmentResponse(BaseModel):
    predicted_aqi: int
    category: str
    risk_level: str
    warning_message: str
    recommendation: str
    region: str = "Delhi-NCR"
    station_id: Optional[str] = None
    forecast_horizon: str
    timestamp: str
    weather_analysis: Dict[str, Any] = Field(default_factory=dict)
    detailed_recommendations: Optional[Dict[str, Any]] = None

