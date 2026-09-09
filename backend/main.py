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

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API v1 Routers
app.include_router(api_router, prefix=settings.API_V1_STR)


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
