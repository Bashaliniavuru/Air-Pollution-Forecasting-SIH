from typing import Dict, Any
from fastapi import APIRouter
from models.schemas import GeminiExplainRequest, GeminiExplainResponse
from services.gemini_service import GeminiService
from backend.config import settings

router = APIRouter()
gemini_service = GeminiService()


@router.post(
    "/ai-explanation",
    response_model=GeminiExplainResponse,
    summary="Generate Physics-Grounded Environmental AI Explanation (Google Gemini)"
)
def generate_ai_explanation(request_data: GeminiExplainRequest) -> GeminiExplainResponse:
    """
    Generates natural-language atmospheric analysis of AQI, meteorological coupling,
    and 24-hour forecasting trends using Google Gemini AI grounded in actual telemetry.
    """
    return gemini_service.generate_environmental_explanation(request_data)


@router.get(
    "/status",
    summary="Check Gemini AI Integration Status"
)
def get_gemini_status() -> Dict[str, Any]:
    """
    Returns the readiness of the Google Gemini API integration and active model.
    """
    is_available = gemini_service.is_available()
    return {
        "gemini_api_configured": is_available,
        "active_model": settings.GEMINI_MODEL,
        "mode": "GEMINI_GENAI_ONLINE" if is_available else "PHYSICS_COUPLED_FALLBACK",
        "description": "Natural-language meteorological coupling explanation engine for Delhi-NCR."
    }
