import json
import os
from typing import Any, Dict, List, Optional
from backend.config import settings
from models.schemas import GeminiExplainRequest, GeminiExplainResponse
from utils.logger import setup_logger
from utils.helpers import get_utc_timestamp

logger = setup_logger("gemini_service")


class GeminiService:
    """
    Reusable Google Gemini API Service for generating physics-grounded,
    natural-language environmental explanations, weather coupling insights,
    and role-tailored preventive advisories for Delhi-NCR.
    """

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "").strip()
        self.model_name = settings.GEMINI_MODEL or "gemini-2.5-flash"
        self._client = None
        self._init_client()

    def _init_client(self):
        """Initializes Google GenAI Client if API key is configured."""
        if self.api_key and self.api_key != "your_gemini_api_key_here":
            try:
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
                logger.info(f"GeminiService initialized with model '{self.model_name}'.")
            except Exception as e:
                logger.error(f"Failed to initialize Google GenAI Client: {str(e)}")
                self._client = None
        else:
            logger.warning(
                "GEMINI_API_KEY is not configured or set to placeholder. "
                "GeminiService will operate in Physics-Coupled Fallback mode."
            )
            self._client = None

    def is_available(self) -> bool:
        """Returns True if Gemini API client is initialized and configured."""
        return self._client is not None

    def generate_environmental_explanation(self, req: GeminiExplainRequest) -> GeminiExplainResponse:
        """
        Generates natural-language atmospheric explanations for Delhi air quality.
        Uses actual station telemetry and coupled meteorological forecast data.
        Falls back seamlessly to deterministic physics engine if API key is absent or unreachable.
        """
        if not self._client:
            return self._generate_physics_fallback(
                req,
                error_msg="Gemini API key is not configured in backend/.env. Using physics-coupled explanation engine."
            )

        prompt = self._build_grounded_prompt(req)

        try:
            from google import genai
            from google.genai import types

            response = self._client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.3,
                )
            )

            response_text = response.text or "{}"
            parsed = json.loads(response_text)

            return GeminiExplainResponse(
                status="SUCCESS",
                model=self.model_name,
                is_ai_generated=True,
                is_fallback=False,
                station_name=req.station_name or "Delhi Station",
                summary=parsed.get("summary", f"Air quality at {req.station_name} is currently {req.category} (AQI {req.current_aqi})."),
                aqi_condition_analysis=parsed.get("aqi_condition_analysis", ""),
                meteorological_coupling_analysis=parsed.get("meteorological_coupling_analysis", ""),
                forecast_interpretation=parsed.get("forecast_interpretation", ""),
                early_warning_explanation=parsed.get("early_warning_explanation", ""),
                preventive_recommendations=parsed.get("preventive_recommendations", {
                    "sensitive_groups": ["Limit strenuous outdoor activities", "Keep prescribed inhalers accessible"],
                    "general_public": ["Wear N95/N99 respirators during peak morning hours", "Use public transit"],
                    "regulators": ["Enforce mechanized road sweeping", "Monitor dust suppression at construction corridors"]
                }),
                disclaimer="🟡 DEMO DATA – For Prototype Demonstration Only – Powered by Google Gemini & Physics Coupling",
                timestamp=get_utc_timestamp(),
                error_message=None
            )

        except Exception as e:
            logger.error(f"Gemini API invocation failed: {str(e)}")
            return self._generate_physics_fallback(
                req,
                error_msg=f"Gemini API request encountered an issue ({type(e).__name__}). Showing physics-coupled explanation."
            )

    def _build_grounded_prompt(self, req: GeminiExplainRequest) -> str:
        """Constructs a strictly grounded prompt with exact telemetry numbers."""
        return f"""
You are an atmospheric scientist and environmental health AI analyst specializing in Delhi-NCR meteorological coupling.
Analyze the following atmospheric and air quality telemetry for '{req.station_name}' ({req.location}, Delhi-NCR):

--- OBSERVED TELEMETRY ---
- Current AQI: {req.current_aqi} ({req.category})
- Particulate Concentrations: PM2.5 = {req.pm2_5} µg/m³ (Safe limit: 60), PM10 = {req.pm10} µg/m³ (Safe limit: 100)
- Gaseous Concentrations: NO2 = {req.no2} µg/m³, O3 = {req.o3} µg/m³, SO2 = {req.so2} µg/m³, CO = {req.co} mg/m³
- Surface Temperature: {req.temperature_c} °C
- Relative Humidity: {req.humidity_pct} %
- Wind Speed: {req.wind_speed_kmh} km/h (Direction: {req.wind_direction_deg}°)
- Planetary Boundary Layer (PBL) Mixing Height: {req.pbl_height_m} meters
- Ventilation Index (Vi): {req.ventilation_index} m²/s
- Thermal Inversion Risk: {req.inversion_risk}
- Atmospheric Stagnation Multiplier: {req.stagnation_multiplier}×
- 24-Hour Coupled Forecast AQI: {req.forecast_aqi} ({req.forecast_category})
{f"- User Query / Focus: {req.custom_query}" if req.custom_query else ""}

--- STRICT GROUNDING & SCIENTIFIC RULES ---
1. Base your explanation strictly on the numerical data provided above.
2. Explain the atmospheric physics coupling clearly:
   - Wind speed ({req.wind_speed_kmh} km/h): Explain whether horizontal advection/dispersion is active or suppressed (<8 km/h indicates calm stagnation).
   - PBL height ({req.pbl_height_m}m): Explain how shallow boundary layer mixing volume traps pollutants near the surface (<500m indicates severe compression).
   - Relative Humidity ({req.humidity_pct}%): Explain gas-to-particle photochemical transformation (secondary aerosol formation) if humidity > 75%.
   - Thermal Inversion ({req.inversion_risk}): Explain nocturnal capping preventing vertical lifting.
3. Forecast Interpretation: Explain why the AQI is projected to reach {req.forecast_aqi} ({req.forecast_category}) in 24 hours based on these coupled factors.
4. Early Warning & Recommendations: Provide concrete, categorized actions for:
   - sensitive_groups: Children, elderly, respiratory patients.
   - general_public: Commuters, outdoor workers, residents.
   - regulators: CPCB/DPCC/CAQM Graded Response Action Plan (GRAP) actions.
5. Do NOT invent external sensor dates, live real-time CPCB feeds, or fake accuracy stats.
6. Return ONLY a valid JSON object matching this schema:

{{
  "summary": "1-2 sentence executive summary of current air quality and main meteorological driver",
  "aqi_condition_analysis": "Detailed scientific assessment of current AQI and pollutant concentrations relative to national standards",
  "meteorological_coupling_analysis": "Explanation of how wind speed, PBL height, humidity, and inversion are physically interacting to trap or disperse pollutants",
  "forecast_interpretation": "Coupled interpretation of the 24h forecasted AQI trend and meteorological trajectory",
  "early_warning_explanation": "Assessment of early warning risk level and thermal stagnation severity",
  "preventive_recommendations": {{
    "sensitive_groups": ["action 1", "action 2"],
    "general_public": ["action 1", "action 2"],
    "regulators": ["action 1", "action 2"]
  }}
}}
"""

    def _generate_physics_fallback(self, req: GeminiExplainRequest, error_msg: Optional[str] = None) -> GeminiExplainResponse:
        """
        Deterministic, physics-informed coupled explanation engine.
        Ensures the system produces rich, grounded scientific explanations even without an active Gemini API key.
        """
        wind = req.wind_speed_kmh or 5.8
        pbl = req.pbl_height_m or 410.0
        humidity = req.humidity_pct or 78.0
        aqi = req.current_aqi or 355
        fc_aqi = req.forecast_aqi or 390
        pm25 = req.pm2_5 or 195.0

        # Physical mechanics deductions
        wind_desc = (
            f"Calm surface winds of {wind} km/h (below the critical 8 km/h advection threshold) prevent horizontal atmospheric dispersion."
            if wind < 8.0 else
            f"Moderate surface wind speed of {wind} km/h provides partial horizontal ventilation."
        )

        pbl_desc = (
            f"A compressed Planetary Boundary Layer (PBL) mixing height of {pbl}m restricts vertical dispersion volume, concentrating particulates near breathing level."
            if pbl < 500.0 else
            f"A boundary layer mixing height of {pbl}m allows moderate vertical air volume mixing."
        )

        hum_desc = (
            f"Elevated relative humidity ({humidity}%) accelerates hygroscopic growth and secondary aerosol conversion from gaseous precursors (NO₂/SO₂ to nitrates/sulfates)."
            if humidity > 75.0 else
            f"Relative humidity at {humidity}% provides low aerosol formation potential."
        )

        stag_factor = req.stagnation_multiplier or (1.6 if wind < 8 else 1.2)
        inversion = req.inversion_risk or ("HIGH" if pbl < 500 and wind < 7 else "MODERATE")

        summary = (
            f"Air quality at {req.station_name} is in the {req.category} category (AQI {aqi}) with PM2.5 at {pm25} µg/m³. "
            f"Severe meteorological stagnation (factor {stag_factor}×) is driven by calm winds ({wind} km/h) and a shallow boundary layer ({pbl}m)."
        )

        aqi_analysis = (
            f"Current AQI of {aqi} ({req.category}) is primarily dominated by fine particulate matter (PM2.5: {pm25} µg/m³, which is {round(pm25/60, 1)}× the Indian 24-hour NAAQS safe limit of 60 µg/m³). "
            f"Coarse particulates (PM10: {req.pm10} µg/m³) and traffic precursors (NO₂: {req.no2} µg/m³) further elevate overall respiratory hazard."
        )

        coupling_analysis = f"{wind_desc} {pbl_desc} {hum_desc} The calculated Ventilation Index is {req.ventilation_index} m²/s with a {inversion} thermal inversion risk."

        forecast_interp = (
            f"The physics-informed coupled model projects the AQI to trend toward {fc_aqi} ({req.forecast_category}) over the next 24 hours. "
            f"Persistent boundary layer compression and low ventilation will continue to compound localized particulate buildup unless surface wind speeds increase above 10 km/h."
        )

        early_warning = (
            f"EARLY WARNING STATUS: {inversion} RISK. Meteorological conditions indicate high probability of overnight surface stagnation and thermal trapping. "
            f"Preventive interventions under GRAP Stage {3 if aqi > 300 else 2} are strongly indicated."
        )

        recommendations = {
            "sensitive_groups": [
                "Avoid all outdoor physical exertion and exercise during morning and evening inversion hours.",
                "Keep prescribed bronchodilators and respiratory inhalers readily accessible.",
                "Utilize HEPA indoor air filtration in sleeping and work quarters."
            ],
            "general_public": [
                "Wear certified N95 or N99 particulate respirators when commuting or working outdoors.",
                "Minimize personal private vehicle use; opt for Delhi Metro and electric public transit.",
                "Avoid dry sweeping and burning of domestic or garden biomass."
            ],
            "regulators": [
                f"Enforce Graded Response Action Plan (GRAP) Stage {3 if aqi > 300 else 2} mitigation measures across {req.station_name} and neighboring corridors.",
                "Intensify mechanized vacuum sweeping and water misting along arterial road networks.",
                "Enforce strict anti-dust compliance at all active infrastructure and construction sites."
            ]
        }

        return GeminiExplainResponse(
            status="SUCCESS",
            model=self.model_name if self._client else "physics-coupled-v1.0 (deterministic fallback)",
            is_ai_generated=False,
            is_fallback=True,
            station_name=req.station_name or "Delhi Station",
            summary=summary,
            aqi_condition_analysis=aqi_analysis,
            meteorological_coupling_analysis=coupling_analysis,
            forecast_interpretation=forecast_interp,
            early_warning_explanation=early_warning,
            preventive_recommendations=recommendations,
            disclaimer="🟡 DEMO DATA – For Prototype Demonstration Only – Physics-Coupled Explanation Engine",
            timestamp=get_utc_timestamp(),
            error_message=error_msg
        )
