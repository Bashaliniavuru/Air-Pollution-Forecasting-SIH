"""
Pollution Risk Assessment & Meteorological Early-Warning Endpoints.
Provides RESTful APIs to evaluate predicted AQI, atmospheric stagnation,
and Graded Response Action Plan (GRAP) recommendations for Delhi-NCR.
"""

from typing import List
from fastapi import APIRouter, HTTPException, status
from models.schemas import RiskAssessmentRequest, RiskAssessmentResponse
from backend.services.risk_service import get_risk_service
from services.data_service import DataService

router = APIRouter()
risk_service = get_risk_service()
data_service = DataService()


@router.post(
    "/assess",
    response_model=RiskAssessmentResponse,
    status_code=status.HTTP_200_OK,
    summary="Assess Air Pollution Risk & Early Warnings",
    description="Transforms predicted AQI and coupled atmospheric vectors (wind, humidity, rain, PBL) into clear 4-tier risk levels (Low, Moderate, High, Severe), warnings, and recommendations."
)
def assess_pollution_risk(payload: RiskAssessmentRequest) -> RiskAssessmentResponse:
    """
    Evaluates a user-supplied or model-generated predicted AQI and meteorological features.
    """
    weather_dict = {
        "wind_speed_kmh": payload.wind_speed_kmh,
        "humidity_pct": payload.humidity_pct,
        "rainfall_mm": payload.rainfall_mm,
        "pbl_height_m": payload.pbl_height_m,
        "temp_c": payload.temp_c
    }

    result = risk_service.assess_risk(
        predicted_aqi=payload.predicted_aqi,
        weather_data=weather_dict,
        station_id=payload.station_id,
        forecast_horizon=payload.forecast_horizon or "24h"
    )

    return RiskAssessmentResponse(
        predicted_aqi=result["predicted_aqi"],
        category=result["category"],
        risk_level=result["risk_level"],
        warning_message=result["warning_message"],
        recommendation=result["recommendation"],
        region=result.get("region", "Delhi-NCR"),
        station_id=result.get("station_id"),
        forecast_horizon=result.get("forecast_horizon", "24h"),
        timestamp=result["timestamp"],
        weather_analysis=result.get("weather_analysis", {}),
        detailed_recommendations=result.get("detailed_recommendations")
    )


@router.get(
    "/stations",
    response_model=List[RiskAssessmentResponse],
    summary="Get Risk Assessments for All Delhi-NCR Stations",
    description="Retrieves live telemetry across all active Delhi-NCR continuous ambient stations and evaluates their current coupled risk levels."
)
def get_all_stations_risk() -> List[RiskAssessmentResponse]:
    """
    Evaluates current risk levels across all monitoring stations in the Delhi-NCR network.
    """
    stations = data_service.list_stations()
    responses: List[RiskAssessmentResponse] = []

    for stn in stations:
        weather_dict = {
            "wind_speed_kmh": stn.wind_speed_kmh,
            "humidity_pct": stn.humidity_pct,
            "rainfall_mm": 0.0,
            "pbl_height_m": stn.pbl_height_m,
            "temp_c": stn.temperature_c
        }
        res = risk_service.assess_risk(
            predicted_aqi=stn.current_aqi,
            weather_data=weather_dict,
            station_id=stn.station_id,
            forecast_horizon="Current / 24h Outlook"
        )
        responses.append(
            RiskAssessmentResponse(
                predicted_aqi=res["predicted_aqi"],
                category=res["category"],
                risk_level=res["risk_level"],
                warning_message=res["warning_message"],
                recommendation=res["recommendation"],
                region="Delhi-NCR",
                station_id=stn.station_id,
                forecast_horizon=res["forecast_horizon"],
                timestamp=res["timestamp"],
                weather_analysis=res["weather_analysis"],
                detailed_recommendations=res.get("detailed_recommendations")
            )
        )

    return responses


@router.get(
    "/stations/{station_id}",
    response_model=RiskAssessmentResponse,
    summary="Get Risk Assessment for a Specific Station",
    description="Fetches telemetry for a target Delhi-NCR station (e.g., DELHI_ANAND_VIHAR, DELHI_ITO) and calculates its atmospheric stagnation risk and early warnings."
)
def get_station_risk(station_id: str) -> RiskAssessmentResponse:
    """
    Retrieves and evaluates the atmospheric risk profile for a single station.
    """
    stn = data_service.get_station(station_id)
    if not stn:
        available_ids = [s.station_id for s in data_service.list_stations()]
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Station '{station_id}' not found. Available stations: {available_ids}"
        )

    weather_dict = {
        "wind_speed_kmh": stn.wind_speed_kmh,
        "humidity_pct": stn.humidity_pct,
        "rainfall_mm": 0.0,
        "pbl_height_m": stn.pbl_height_m,
        "temp_c": stn.temperature_c
    }

    res = risk_service.assess_risk(
        predicted_aqi=stn.current_aqi,
        weather_data=weather_dict,
        station_id=stn.station_id,
        forecast_horizon="Current / 24h Outlook"
    )

    return RiskAssessmentResponse(
        predicted_aqi=res["predicted_aqi"],
        category=res["category"],
        risk_level=res["risk_level"],
        warning_message=res["warning_message"],
        recommendation=res["recommendation"],
        region="Delhi-NCR",
        station_id=stn.station_id,
        forecast_horizon=res["forecast_horizon"],
        timestamp=res["timestamp"],
        weather_analysis=res["weather_analysis"],
        detailed_recommendations=res.get("detailed_recommendations")
    )
