from fastapi import APIRouter
from backend.api.v1.endpoints import health, overview, tasks

api_router = APIRouter()

api_router.include_router(health.router, tags=["System Health"])
api_router.include_router(overview.router, tags=["Overview & Metrics"])
api_router.include_router(tasks.router, tags=["Task Processing"])
