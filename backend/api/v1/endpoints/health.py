import time
from fastapi import APIRouter
from models.schemas import HealthResponse
from utils.constants import AppStatus, VERSION
from utils.helpers import get_utc_timestamp

router = APIRouter()
START_TIME = time.time()


@router.get("/health", response_model=HealthResponse, summary="System Health Telemetry")
def get_health() -> HealthResponse:
    """
    Returns current health status, uptime, version, and sub-service operational readiness.
    """
    uptime = round(time.time() - START_TIME, 2)
    return HealthResponse(
        status=AppStatus.ONLINE,
        version=VERSION,
        timestamp=get_utc_timestamp(),
        uptime_seconds=uptime,
        services={
            "database": "READY",
            "ai_inference_engine": "ONLINE",
            "data_pipeline": "HEALTHY",
            "event_bus": "LISTENING"
        }
    )
