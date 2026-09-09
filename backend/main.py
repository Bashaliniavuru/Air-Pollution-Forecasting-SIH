import sys
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Ensure root workspace directory is in python search path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.config import settings
from backend.api.v1.router import api_router
from utils.logger import setup_logger

logger = setup_logger("backend_main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown routines."""
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION} [{settings.ENVIRONMENT}]")
    logger.info(f"Focus Region: {settings.FOCUS_REGION}")
    yield
    logger.info(f"Shutting down {settings.PROJECT_NAME}")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Coupled Air Pollution and Meteorological Forecasting Platform for Delhi-NCR with 24h-72h Predictive Horizons.",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Configure CORS Middleware with Vercel origin regex and configured origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_origin_regex=r"https://.*\.vercel\.app",
)

# Register API v1 Routers
app.include_router(api_router, prefix=settings.API_V1_STR)


# ==============================================================================
# Direct Compatibility Endpoints (/api/...)
# ==============================================================================

@app.get("/api/locations", summary="List All Monitored Locations", tags=["Compatibility Endpoints"])
def get_locations() -> JSONResponse:
    from services.data_service import DataService
    data_svc = DataService()
    stations = data_svc.list_stations()
    return JSONResponse(
        content={
            "region": settings.FOCUS_REGION,
            "count": len(stations),
            "locations": [
                {
                    "station_id": s.station_id,
                    "station_name": s.station_name,
                    "location": s.location,
                    "lat": s.lat,
                    "lon": s.lon,
                    "current_aqi": s.current_aqi,
                    "category": s.category.value if hasattr(s.category, "value") else str(s.category)
                }
                for s in stations
            ]
        }
    )


@app.get("/api/all-locations", summary="All Location Telemetry", tags=["Compatibility Endpoints"])
def get_all_locations() -> JSONResponse:
    from services.data_service import DataService
    data_svc = DataService()
    stations = data_svc.list_stations()
    return JSONResponse(
        content=[s.model_dump() if hasattr(s, "model_dump") else s.dict() for s in stations]
    )


@app.get("/api/current/{location}", summary="Current Telemetry for Location", tags=["Compatibility Endpoints"])
def get_current_location(location: str) -> JSONResponse:
    from services.data_service import DataService
    data_svc = DataService()
    station = data_svc.get_station(location)
    if not station:
        # Check partial station_name match
        for s in data_svc.list_stations():
            if location.lower() in s.station_name.lower() or location.lower() in s.location.lower():
                station = s
                break
    if not station:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Location '{location}' not found")
    return JSONResponse(
        content=station.model_dump() if hasattr(station, "model_dump") else station.dict()
    )


@app.get("/api/forecast/{location}", summary="Coupled 24h Forecast for Location", tags=["Compatibility Endpoints"])
def get_forecast_location(location: str) -> JSONResponse:
    from services.data_service import DataService
    from services.ai_service import AIService

    data_svc = DataService()
    ai_svc = AIService()
    station = data_svc.get_station(location)
    if not station:
        for s in data_svc.list_stations():
            if location.lower() in s.station_name.lower() or location.lower() in s.location.lower():
                station = s
                break

    stn_id = station.station_id if station else location
    stn_data = {
        "pm2_5": station.pm2_5 if station else 195.0,
        "pm10": station.pm10 if station else 310.0,
        "temperature_c": station.temperature_c if station else 28.0,
        "humidity_pct": station.humidity_pct if station else 75.0,
        "wind_speed_kmh": station.wind_speed_kmh if station else 5.8,
        "pbl_height_m": station.pbl_height_m if station else 410.0,
    }
    task_res = ai_svc.execute_task(
        task_type="FORECAST_24H_AQI",
        input_data=stn_data,
        station_id=stn_id
    )
    return JSONResponse(
        content=task_res.model_dump() if hasattr(task_res, "model_dump") else task_res.dict()
    )


@app.get("/", summary="Root Status Endpoint")
def root_status() -> JSONResponse:
    return JSONResponse(
        content={
            "app": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "focus_region": settings.FOCUS_REGION,
            "objective": "Forecast upcoming air-pollution levels by considering both pollution data and weather conditions, rather than only showing the current AQI.",
            "status": "ONLINE",
            "documentation": "/docs",
            "api_v1": settings.API_V1_STR,
            "health_endpoint": f"{settings.API_V1_STR}/health"
        }
    )


if __name__ == "__main__":
    import uvicorn
    host = "0.0.0.0"
    port = int(os.environ.get("PORT", 10000))
    app_import = "main:app" if os.path.exists("main.py") else "backend.main:app"
    uvicorn.run(app_import, host=host, port=port, reload=settings.DEBUG)
