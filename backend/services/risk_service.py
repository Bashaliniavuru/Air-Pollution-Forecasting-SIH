"""
Pollution Risk Assessment and Early-Warning Service for Delhi-NCR.

Transforms raw predicted AQI values and coupled atmospheric meteorological vectors
(wind speed, relative humidity, precipitation/rainfall, and boundary layer height)
into clear, actionable risk levels and grounded early-warning advisories.

Follows Indian National Air Quality Standards and Graded Response Action Plan (GRAP)
mitigation protocols while strictly adhering to scientifically sound explanations
without claiming unsupported direct causation.
"""

from enum import Enum
from typing import Any, Dict, List, Optional, Union
import datetime


class RiskLevel(str, Enum):
    """Understandable 4-tier public risk classification."""
    LOW = "Low"
    MODERATE = "Moderate"
    HIGH = "High"
    SEVERE = "Severe"


class AQICategory(str, Enum):
    """Standard Indian National Air Quality Index (NAQI) categories."""
    GOOD = "Good"                 # 0 - 50
    SATISFACTORY = "Satisfactory" # 51 - 100
    MODERATE = "Moderate"         # 101 - 200
    POOR = "Poor"                 # 201 - 300
    VERY_POOR = "Very Poor"       # 301 - 400
    SEVERE = "Severe"             # 401 - 500
    SEVERE_PLUS = "Severe Plus"   # > 500


def get_category_from_aqi(aqi: Union[int, float]) -> AQICategory:
    """
    Maps numeric AQI to Indian National Air Quality Index categories.
    """
    aqi_val = round(float(aqi))
    if aqi_val <= 50:
        return AQICategory.GOOD
    elif aqi_val <= 100:
        return AQICategory.SATISFACTORY
    elif aqi_val <= 200:
        return AQICategory.MODERATE
    elif aqi_val <= 300:
        return AQICategory.POOR
    elif aqi_val <= 400:
        return AQICategory.VERY_POOR
    elif aqi_val <= 500:
        return AQICategory.SEVERE
    else:
        return AQICategory.SEVERE_PLUS


def get_risk_level_from_aqi(aqi: Union[int, float]) -> RiskLevel:
    """
    Converts predicted AQI into understandable 4-tier risk levels:
    - Low: 0 - 100 (Covers Good & Satisfactory)
    - Moderate: 101 - 200 (Covers Moderate)
    - High: 201 - 300 (Covers Poor)
    - Severe: 301+ (Covers Very Poor, Severe & Severe Plus)
    """
    aqi_val = round(float(aqi))
    if aqi_val <= 100:
        return RiskLevel.LOW
    elif aqi_val <= 200:
        return RiskLevel.MODERATE
    elif aqi_val <= 300:
        return RiskLevel.HIGH
    else:
        return RiskLevel.SEVERE


class WeatherAnalysis:
    """
    Analyzes atmospheric conditions (wind speed, humidity, precipitation, PBL height)
    and explains their physical contribution to pollutant dispersion or accumulation
    without asserting unproven direct causation.
    """

    @staticmethod
    def analyze(
        wind_speed_kmh: Optional[float] = None,
        humidity_pct: Optional[float] = None,
        rainfall_mm: Optional[float] = None,
        pbl_height_m: Optional[float] = None,
        temp_c: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Evaluates atmospheric factors and provides evidence-grounded scientific commentary.
        """
        evaluations: List[str] = []
        factors: Dict[str, Any] = {}

        # 1. Wind Speed Analysis (Horizontal Advection & Dispersion)
        if wind_speed_kmh is not None:
            speed = float(wind_speed_kmh)
            factors["wind_speed_kmh"] = speed
            if speed < 5.0:
                wind_state = "Calm / Near Stagnant"
                wind_comment = (
                    f"Calm surface winds ({speed} km/h) critically restrict horizontal advection. "
                    "In atmospheric physics, low surface kinetic energy suppresses horizontal ventilation, "
                    "allowing continuous localized emissions (vehicular, domestic, industrial) to pool and "
                    "accumulate near ground level rather than dispersing downwind."
                )
            elif speed < 12.0:
                wind_state = "Light Ventilation"
                wind_comment = (
                    f"Light winds ({speed} km/h) offer modest horizontal transport. While some advective "
                    "displacement occurs, ventilation remains insufficient to counteract sustained urban emission rates."
                )
            elif speed < 25.0:
                wind_state = "Moderate Dispersion"
                wind_comment = (
                    f"Moderate winds ({speed} km/h) promote active atmospheric ventilation and horizontal "
                    "dilution, assisting in lowering particulate concentration peaks."
                )
            else:
                wind_state = "Brisk / Strong Winds"
                wind_comment = (
                    f"Brisk winds ({speed} km/h) ensure strong atmospheric dilution and transport. However, in arid "
                    "or dry unpaved sectors, velocities above 25 km/h may induce mechanical dust resuspension."
                )
            factors["wind_condition"] = wind_state
            evaluations.append(wind_comment)
        else:
            factors["wind_condition"] = "Data Not Supplied"

        # 2. Relative Humidity Analysis (Secondary Aerosol Chemistry & Hygroscopic Growth)
        if humidity_pct is not None:
            rh = float(humidity_pct)
            factors["humidity_pct"] = rh
            if rh >= 80.0:
                rh_state = "High Atmospheric Moisture"
                rh_comment = (
                    f"Elevated relative humidity ({rh}%) provides favorable micro-environments for hygroscopic "
                    "aerosol growth (water vapor condensing onto particulate cores, increasing optical depth and measured mass). "
                    "High moisture also accelerates heterogeneous aqueous-phase chemical reactions converting gaseous "
                    "precursors (SO2, NOx, NH3) into secondary particulate matter (sulfates and nitrates). "
                    "While moisture itself is not a pollutant source, it compounds particulate density under poor ventilation."
                )
            elif rh >= 55.0:
                rh_state = "Moderate Humidity"
                rh_comment = (
                    f"Relative humidity is moderate ({rh}%). Atmospheric moisture levels support typical photochemical "
                    "reactions without inducing rapid hygroscopic condensation or persistent surface fog formation."
                )
            else:
                rh_state = "Dry Atmosphere"
                rh_comment = (
                    f"Dry atmospheric conditions ({rh}% RH) limit moisture-induced secondary aerosol growth. "
                    "Aerosol masses remain relatively unaffected by water vapor condensation."
                )
            factors["humidity_condition"] = rh_state
            evaluations.append(rh_comment)
        else:
            factors["humidity_condition"] = "Data Not Supplied"

        # 3. Rainfall / Precipitation Analysis (Wet Scavenging / Deposition)
        if rainfall_mm is not None:
            rain = float(rainfall_mm)
            factors["rainfall_mm"] = rain
            if rain >= 5.0:
                rain_state = "Significant Wet Scavenging"
                rain_comment = (
                    f"Active precipitation ({rain} mm) provides robust wet deposition and precipitation scavenging (rainout and washout). "
                    "Falling raindrops physically intercept and scavenge coarse (PM10) and fine (PM2.5) airborne particles, "
                    "temporarily cleansing the lower boundary layer."
                )
            elif rain >= 0.5:
                rain_state = "Light Scavenging"
                rain_comment = (
                    f"Light precipitation ({rain} mm) induces localized particulate washout, though sustained air "
                    "cleansing depends on precipitation duration and underlying emission density."
                )
            elif rain > 0.0:
                rain_state = "Trace Drizzle"
                rain_comment = (
                    f"Trace precipitation ({rain} mm) is generally inadequate for significant mechanical washout. "
                    "It may elevate near-surface humidity and foster mist formation without meaningfully clearing airborne particulate burden."
                )
            else:
                rain_state = "No Precipitation (Dry)"
                rain_comment = (
                    "Precipitation is absent (0.0 mm). No wet scavenging or rain-induced atmospheric cleansing is "
                    "active; particulate clearance depends entirely on wind advection and dry gravitational deposition."
                )
            factors["rainfall_condition"] = rain_state
            evaluations.append(rain_comment)
        else:
            factors["rainfall_condition"] = "Data Not Supplied"

        # 4. Planetary Boundary Layer (PBL) Height (Vertical Mixing Volume)
        if pbl_height_m is not None:
            pbl = float(pbl_height_m)
            factors["pbl_height_m"] = pbl
            if pbl < 400.0:
                factors["vertical_dispersion"] = "Severe Compression (Shallow Boundary Layer)"
                evaluations.append(
                    f"Shallow planetary boundary layer height ({pbl} m) severely compresses the vertical mixing "
                    "volume, acting as an atmospheric cap that traps surface emissions within the breathing zone."
                )
            elif pbl < 800.0:
                factors["vertical_dispersion"] = "Moderate Vertical Mixing"
                evaluations.append(
                    f"Moderate boundary layer height ({pbl} m) provides standard seasonal vertical dilution capacity."
                )
            else:
                factors["vertical_dispersion"] = "Deep Vertical Mixing"
                evaluations.append(
                    f"High planetary boundary layer ({pbl} m) offers extensive vertical column volume for thermal convective dilution."
                )

        # 5. Composite Atmospheric Dispersion Assessment
        dispersion_score = "Moderate"
        is_stagnant = False
        is_washout = (rainfall_mm is not None and rainfall_mm >= 3.0)

        calm_wind = (wind_speed_kmh is not None and wind_speed_kmh < 6.0)
        high_humidity = (humidity_pct is not None and humidity_pct >= 75.0)
        low_pbl = (pbl_height_m is not None and pbl_height_m < 450.0)

        if is_washout:
            dispersion_score = "Atmospheric Washout Active"
            summary_statement = (
                "Precipitation scavenging is actively mitigating airborne particulate matter. "
                "Atmospheric cleansing is dominant despite any localized emission sources."
            )
        elif calm_wind and (high_humidity or low_pbl):
            is_stagnant = True
            dispersion_score = "High Stagnation & Trapping Risk"
            summary_statement = (
                "Meteorological conditions exhibit high atmospheric stagnation (calm surface winds combined with "
                "elevated moisture or shallow mixing depth). Observed atmospheric dynamics strongly favor the retention "
                "and hygroscopic amplification of particulate matter rather than effective dispersion."
            )
        elif calm_wind:
            dispersion_score = "Restricted Horizontal Ventilation"
            summary_statement = (
                "Low wind velocities are dampening horizontal dispersion. Emissions remain concentrated near emission "
                "zones, creating localized pollution hot-spots."
            )
        elif wind_speed_kmh is not None and wind_speed_kmh >= 14.0:
            dispersion_score = "Favorable Atmospheric Dispersion"
            summary_statement = (
                "Favorable wind speeds and adequate ventilation facilitate the horizontal transport and dispersion of air pollutants."
            )
        else:
            summary_statement = (
                "Meteorological parameters are within intermediate ranges, yielding moderate atmospheric assimilation capacity."
            )

        factors["dispersion_state"] = dispersion_score
        factors["is_stagnant"] = is_stagnant
        factors["scientific_explanation"] = " ".join(evaluations) if evaluations else "No meteorological inputs provided."
        factors["meteorological_summary"] = summary_statement

        return factors


class PollutionRiskService:
    """
    Core service that translates predicted AQI and weather parameters into
    transparent risk ratings, early warnings, and targeted intervention advisories.
    """

    def __init__(self, region: str = "Delhi-NCR"):
        self.region = region

    def assess_risk(
        self,
        predicted_aqi: Union[int, float],
        weather_data: Optional[Dict[str, Any]] = None,
        station_id: Optional[str] = None,
        forecast_horizon: str = "24h"
    ) -> Dict[str, Any]:
        """
        Evaluates forecast AQI and weather data to generate comprehensive risk assessment.

        Returns a dictionary containing:
        - predicted AQI
        - category
        - risk level
        - warning message
        - recommendation
        plus detailed weather analyses, health advisories, and GRAP mitigation guidance.
        """
        numeric_aqi = round(float(predicted_aqi))
        category = get_category_from_aqi(numeric_aqi)
        risk_level = get_risk_level_from_aqi(numeric_aqi)

        # Weather analysis
        weather_input = weather_data or {}
        weather_analysis = WeatherAnalysis.analyze(
            wind_speed_kmh=weather_input.get("wind_speed_kmh"),
            humidity_pct=weather_input.get("humidity_pct"),
            rainfall_mm=weather_input.get("rainfall_mm"),
            pbl_height_m=weather_input.get("pbl_height_m"),
            temp_c=weather_input.get("temp_c")
        )

        # Warning Message Formulation
        warning_message = self._compose_warning_message(
            predicted_aqi=numeric_aqi,
            category=category,
            risk_level=risk_level,
            weather_analysis=weather_analysis,
            forecast_horizon=forecast_horizon
        )

        # Actionable Recommendations
        recommendation_obj = self._compose_recommendations(
            risk_level=risk_level,
            category=category,
            weather_analysis=weather_analysis
        )

        primary_recommendation_text = recommendation_obj["summary"]

        result = {
            # Required Output Fields
            "predicted_aqi": numeric_aqi,
            "category": category.value,
            "risk_level": risk_level.value,
            "warning_message": warning_message,
            "recommendation": primary_recommendation_text,

            # Aliased fields for flexible API consumption
            "predicted AQI": numeric_aqi,
            "risk level": risk_level.value,
            "warning message": warning_message,

            # Extended contextual metadata
            "region": self.region,
            "station_id": station_id or "DELHI_NCR_REGIONAL",
            "forecast_horizon": forecast_horizon,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "weather_analysis": weather_analysis,
            "detailed_recommendations": recommendation_obj
        }

        return result

    def _compose_warning_message(
        self,
        predicted_aqi: int,
        category: AQICategory,
        risk_level: RiskLevel,
        weather_analysis: Dict[str, Any],
        forecast_horizon: str
    ) -> str:
        """
        Builds clear, scientifically grounded early warning message without claiming unsupported causation.
        """
        horizon_label = f"{forecast_horizon} forecast"

        # Atmospheric modifier notes
        met_note = ""
        is_stagnant = weather_analysis.get("is_stagnant", False)
        rainfall_val = weather_analysis.get("rainfall_mm")

        if rainfall_val is not None and rainfall_val >= 2.0:
            met_note = f" (Active rainfall of {rainfall_val} mm is providing particulate wash-out, mitigating concentration peaks.)"
        elif is_stagnant:
            wind = weather_analysis.get("wind_speed_kmh", "calm")
            rh = weather_analysis.get("humidity_pct", "high")
            met_note = (
                f" (Atmospheric conditions exhibit low wind speed [{wind} km/h] and high relative humidity [{rh}%], "
                "which suppress horizontal dispersion and favor pollutant retention.)"
            )

        if risk_level == RiskLevel.LOW:
            if category == AQICategory.GOOD:
                return (
                    f"LOW RISK ({horizon_label}): Air quality is projected in the GOOD range (AQI {predicted_aqi}). "
                    f"Minimal health impact across all demographics. Atmospheric ventilation is adequate.{met_note}"
                )
            else:
                return (
                    f"LOW RISK ({horizon_label}): Air quality is projected in the SATISFACTORY range (AQI {predicted_aqi}). "
                    f"Minor breathing discomfort may be experienced by exceptionally sensitive individuals upon prolonged outdoor exertion.{met_note}"
                )

        elif risk_level == RiskLevel.MODERATE:
            return (
                f"MODERATE RISK ({horizon_label}): Air quality is projected in the MODERATE range (AQI {predicted_aqi}). "
                "Noticeable breathing discomfort is possible for sensitive groups including children, elderly individuals, "
                f"and persons with underlying respiratory conditions such as asthma or COPD.{met_note}"
            )

        elif risk_level == RiskLevel.HIGH:
            return (
                f"HIGH RISK ({horizon_label}): Air quality is projected in the POOR range (AQI {predicted_aqi}). "
                "Sustained exposure may cause breathing difficulties and respiratory irritation for the general population, "
                f"with pronounced health risks for individuals with cardiopulmonary illness.{met_note}"
            )

        else:  # SEVERE
            if category == AQICategory.VERY_POOR:
                return (
                    f"SEVERE RISK EARLY WARNING ({horizon_label}): Air quality is projected in the VERY POOR tier (AQI {predicted_aqi}). "
                    "Prolonged exposure can lead to respiratory illness. Widespread irritation is expected across healthy individuals, "
                    f"with serious health impacts on vulnerable populations.{met_note}"
                )
            elif category == AQICategory.SEVERE:
                return (
                    f"CRITICAL SEVERE RISK ALERT ({horizon_label}): Air quality is forecast in the SEVERE emergency tier (AQI {predicted_aqi}). "
                    "Severe atmospheric stagnation restricts dispersion, creating hazardous ambient particulate concentrations. "
                    f"Significant health impacts on healthy individuals; acute distress for those with existing conditions.{met_note}"
                )
            else:
                return (
                    f"EMERGENCY SEVERE PLUS ALERT ({horizon_label}): Air quality is projected in the SEVERE PLUS tier (AQI {predicted_aqi}). "
                    "Extreme atmospheric stagnation and dangerous particulate concentrations. Poses severe public health hazard; "
                    f"immediate emergency intervention protocols recommended.{met_note}"
                )

    def _compose_recommendations(
        self,
        risk_level: RiskLevel,
        category: AQICategory,
        weather_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Provides comprehensive health advisories, community protective measures,
        and Graded Response Action Plan (GRAP) regulatory directives.
        """
        is_stagnant = weather_analysis.get("is_stagnant", False)
        rainfall_val = weather_analysis.get("rainfall_mm")

        health_actions: List[str] = []
        regulatory_grap: List[str] = []
        meteorological_advisory: List[str] = []

        if risk_level == RiskLevel.LOW:
            summary = "Air quality is favorable. General population and sensitive groups may engage in regular outdoor activities."
            health_actions.append("Outdoor exercise and daily routines can proceed without restriction.")
            regulatory_grap.append("Maintain baseline municipal dust control and mechanized road sweeping.")

        elif risk_level == RiskLevel.MODERATE:
            summary = "Sensitive individuals should moderate prolonged intense outdoor exertion. Keep home ventilation controlled during peak traffic hours."
            health_actions.extend([
                "Individuals with asthma or chronic bronchitis should keep prescribed inhalers/medication readily accessible.",
                "Reduce heavy morning or evening cardio workouts in proximity to high-density traffic intersections.",
                "Ensure indoor environments are well-filtered if situated near major transport corridors."
            ])
            regulatory_grap.extend([
                "Enforce strict dust suppression at registered construction sites.",
                "Intensify mechanical vacuum sweeping along arterial corridors.",
                "Ensure synchronized traffic signaling to prevent vehicle idling bottlenecks."
            ])

        elif risk_level == RiskLevel.HIGH:
            summary = "High pollution risk. Sensitive groups should avoid strenuous outdoor exertion. General public should wear certified N95 masks during extended outdoor exposure."
            health_actions.extend([
                "Children, seniors, and cardiopulmonary patients should avoid prolonged outdoor physical activities.",
                "General public is advised to use well-fitted N95/FFP2 particulate respirators when commuting.",
                "Operate indoor HEPA air filtration systems in residential and workspace areas.",
                "Avoid burning of waste, leaves, or biomass for heating."
            ])
            regulatory_grap.extend([
                "GRAP Stage I/II Protocols: Enhance water sprinkling on unpaved roads and construction zones.",
                "Deploy mobile anti-smog guns across high-density corridors.",
                "Increase frequency of public transit (metro/bus) and increase parking tariffs to discourage private motor usage.",
                "Prohibit open burning of municipal solid waste."
            ])

        else:  # SEVERE
            summary = "CRITICAL HEALTH ALERT: Minimize all outdoor exposure. Wear N95 respirators if stepping outside. Activate emergency air purification and adhere to GRAP Stage III/IV directives."
            health_actions.extend([
                "All demographic groups: Avoid morning and evening outdoor physical exercise or jogging.",
                "Vulnerable groups (children, pregnant women, elderly, respiratory/cardiac patients) must remain indoors.",
                "Mandatory use of N95/FFP2 respirators if stepping outdoors is unavoidable.",
                "Keep windows and doors securely closed during peak stagnation hours (late evening to mid-morning).",
                "Seek medical guidance promptly upon onset of coughing, chest tightness, wheezing, or eye irritation."
            ])

            if category in (AQICategory.SEVERE, AQICategory.SEVERE_PLUS):
                regulatory_grap.extend([
                    "GRAP Stage III / IV Emergency Measures:",
                    "Strict ban on all non-essential construction and demolition activities across Delhi-NCR.",
                    "Prohibit plying of BS-III petrol and BS-IV diesel four-wheelers in NCT Delhi and adjacent districts.",
                    "Ban entry of non-essential diesel medium and heavy goods vehicles into Delhi.",
                    "Enforce rotational work-from-home (WFH) schedules for 50% capacity in public and commercial establishments.",
                    "Consider temporary hybrid/online schooling for primary and secondary classes."
                ])
            else:
                regulatory_grap.extend([
                    "GRAP Stage II / III Directives:",
                    "Halt non-essential diesel generator set operations except for emergency healthcare facilities.",
                    "Intensive continuous deployment of anti-smog water sprinklers across industrial and transit hot-spots.",
                    "Halt non-compliant construction projects and enforce covered transportation of building materials."
                ])

        # Weather-specific tailored advisories
        if is_stagnant:
            meteorological_advisory.append(
                "Due to atmospheric stagnation (calm winds and high humidity), particulate matter cannot disperse vertically or horizontally. "
                "Municipalities should deploy continuous water misting / anti-smog guns to encourage artificial particulate settling."
            )
        if rainfall_val is not None and rainfall_val >= 2.0:
            meteorological_advisory.append(
                f"Active precipitation ({rainfall_val} mm) is providing natural particulate wash-out. "
                "Road sweeping should focus on clearing wet slurry to prevent resuspension after surface drying."
            )

        return {
            "summary": summary,
            "public_health": health_actions,
            "regulatory_and_grap": regulatory_grap,
            "meteorological_mitigation": meteorological_advisory
        }

    def evaluate_scenarios(self, scenarios: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Processes and benchmarks multiple scenario payloads for testing and validation.
        """
        results = []
        for s in scenarios:
            pred_aqi = s.get("predicted_aqi", s.get("aqi", 150))
            weather = s.get("weather", s.get("weather_data", {}))
            station = s.get("station_id", "DELHI_ANAND_VIHAR")
            horizon = s.get("forecast_horizon", "24h")
            result = self.assess_risk(
                predicted_aqi=pred_aqi,
                weather_data=weather,
                station_id=station,
                forecast_horizon=horizon
            )
            results.append(result)
        return results


# Module-level singleton instance for shared backend usage
_service_instance: Optional[PollutionRiskService] = None


def get_risk_service() -> PollutionRiskService:
    """Returns or creates the shared PollutionRiskService singleton."""
    global _service_instance
    if _service_instance is None:
        _service_instance = PollutionRiskService()
    return _service_instance


if __name__ == "__main__":
    import json
    service = get_risk_service()
    print("=" * 85)
    print("AIR POLLUTION RISK ASSESSMENT & EARLY-WARNING SYSTEM (DELHI-NCR)")
    print("=" * 85)

    test_scenarios = [
        {
            "name": "Scenario 1: Favorable Weather & Clean Dispersion (Low Risk)",
            "predicted_aqi": 45,
            "station_id": "DELHI_LODHI_ROAD",
            "weather": {"wind_speed_kmh": 16.5, "humidity_pct": 45.0, "rainfall_mm": 0.0, "pbl_height_m": 1200.0}
        },
        {
            "name": "Scenario 2: Moderate Urban Baseline (Moderate Risk)",
            "predicted_aqi": 145,
            "station_id": "DELHI_RK_PURAM",
            "weather": {"wind_speed_kmh": 9.0, "humidity_pct": 62.0, "rainfall_mm": 0.0, "pbl_height_m": 750.0}
        },
        {
            "name": "Scenario 3: Subdued Ventilation & Rising Emissions (High Risk)",
            "predicted_aqi": 265,
            "station_id": "DELHI_ITO",
            "weather": {"wind_speed_kmh": 5.5, "humidity_pct": 78.0, "rainfall_mm": 0.0, "pbl_height_m": 480.0}
        },
        {
            "name": "Scenario 4: Winter Inversion & Severe Atmospheric Stagnation (Severe Risk)",
            "predicted_aqi": 435,
            "station_id": "DELHI_ANAND_VIHAR",
            "weather": {"wind_speed_kmh": 3.2, "humidity_pct": 89.0, "rainfall_mm": 0.0, "pbl_height_m": 310.0}
        },
        {
            "name": "Scenario 5: Active Monsoonal / Winter Rain Washout (Low-to-Moderate)",
            "predicted_aqi": 88,
            "station_id": "DELHI_PUNJABI_BAGH",
            "weather": {"wind_speed_kmh": 14.0, "humidity_pct": 92.0, "rainfall_mm": 15.0, "pbl_height_m": 900.0}
        }
    ]

    for sc in test_scenarios:
        print(f"\n>>> {sc['name']}")
        res = service.assess_risk(
            predicted_aqi=sc["predicted_aqi"],
            weather_data=sc["weather"],
            station_id=sc["station_id"]
        )
        print(f" * Predicted AQI:    {res['predicted_aqi']}")
        print(f" * Category:         {res['category']}")
        print(f" * Risk Level:       {res['risk_level']}")
        print(f" * Warning Message:  {res['warning_message']}")
        print(f" * Recommendation:   {res['recommendation']}")
        print(f" * Dispersion State: {res['weather_analysis']['dispersion_state']}")
        print(f" * Weather Summary:  {res['weather_analysis']['meteorological_summary']}")
    print("\n" + "=" * 85)
    print("ALL DEMO SCENARIOS COMPLETED SUCCESSFULLY.")
    print("=" * 85)
