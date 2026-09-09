from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from utils.constants import AppStatus, TaskStatus, AQICategory


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
    # Meteorological coupled parameters
    temperature_c: float
    humidity_pct: float
    wind_speed_kmh: float
    wind_direction_deg: float
    pbl_height_m: float  # Planetary boundary layer height
    ventilation_index: float
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
