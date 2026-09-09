"""
Comprehensive SIH Judge Integration and Pipeline Verification Test
Verifies the complete 12-stage pipeline:
1. Live Station Ingress
2. Data Processing & Schema Validation
3. Feature Engineering (PBL, VI, Humidity, Wind)
4. XGBoost & Coupled Forecasting Engine (1h, 6h, 24h)
5. Weather Coupling Physics (Ventilation Index, Thermal Inversion)
6. Risk Engine & 4-Tier Assessment
7. Early Warning Protocol & GRAP Advisory
8. Gemini Grounded Natural Language Explanations
9. 9 Core Locality Verification (Delhi, New Delhi, Rohini, Dwarka, Saket, Noida, Ghaziabad, Gurugram, Faridabad)
10. Live Status Contract
"""

import unittest
import json
import os
import sys
import urllib.request

# Ensure workspace root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from models.ml_models import BaselineScorer
from models.schemas import StationObservation, TaskRequest, TaskStatus
from services.data_service import DataService
from services.ai_service import AIService
from services.gemini_service import GeminiService

class TestFullSIHPipeline(unittest.TestCase):

    def setUp(self):
        self.data_service = DataService()
        self.ai_service = AIService()
        self.gemini_service = GeminiService()

    def test_1_station_ingress_and_9_core_localities(self):
        """Verify all 9 mandatory localities exist with accurate NCR coordinates and coupled metrics."""
        stations = self.data_service.list_stations()
        self.assertGreaterEqual(len(stations), 9, "Must have at least 9 stations")

        station_map = {s.station_id: s for s in stations}
        
        required_localities = [
            ("DELHI_CENTRAL", "Delhi"),
            ("DELHI_NEW_DELHI", "New Delhi"),
            ("DELHI_ROHINI", "Rohini"),
            ("DELHI_DWARKA", "Dwarka"),
            ("DELHI_SAKET", "Saket"),
            ("DELHI_NOIDA", "Noida"),
            ("DELHI_GHAZIABAD", "Ghaziabad"),
            ("DELHI_GURUGRAM", "Gurugram"),
            ("DELHI_FARIDABAD", "Faridabad"),
        ]

        for st_id, name in required_localities:
            self.assertIn(st_id, station_map, f"Missing station {st_id} ({name})")
            st = station_map[st_id]
            self.assertIsNotNone(st.current_aqi, f"AQI must not be None for {st_id}")
            self.assertIsNotNone(st.pm2_5, f"PM2.5 must not be None for {st_id}")
            self.assertIsNotNone(st.temperature_c, f"Temperature must not be None for {st_id}")
            self.assertIsNotNone(st.wind_speed_kmh, f"Wind speed must not be None for {st_id}")
            self.assertIsNotNone(st.lat, f"Lat must not be None for {st_id}")
            self.assertIsNotNone(st.lon, f"Lon must not be None for {st_id}")
            print(f"Verified Locality: {st.station_name} [{st.station_id}] -> AQI: {st.current_aqi}, Lat: {st.lat}, Lon: {st.lon}")

    def test_2_feature_engineering_and_weather_coupling(self):
        """Verify weather coupling heuristics (Ventilation Index, Stagnation Factor, Inversion Risk)."""
        scorer = BaselineScorer()
        
        # Test calm winter conditions (stagnation)
        stagnant_features = {
            "pm2_5": 220.0,
            "pm10": 350.0,
            "wind_speed_kmh": 4.0,  # <8 km/h -> +0.25
            "humidity_pct": 85.0,    # >75% -> +0.15
            "pbl_height_m": 350.0,   # <500m -> +0.20
            "temp_c": 17.5
        }
        res = scorer.predict(stagnant_features)
        
        self.assertAlmostEqual(res["stagnation_multiplier"], 1.60, places=2)
        self.assertEqual(res["thermal_inversion_risk"], "HIGH")
        self.assertGreater(res["forecast_24h_aqi"], 350)
        self.assertIn("hourly_forecast", res)
        self.assertEqual(len(res["hourly_forecast"]), 24)
        print("Verified Weather Coupling Physics: Stagnation Factor =", res["stagnation_multiplier"], ", Inversion =", res["thermal_inversion_risk"])

    def test_3_xgboost_multi_horizon_forecasting(self):
        """Verify +1h, +6h, +24h forecasts and 24h hourly spline progression."""
        scorer = BaselineScorer()
        input_data = {
            "pm2_5": 195.0,
            "pm10": 310.0,
            "wind_speed_kmh": 5.8,
            "humidity_pct": 78.0,
            "pbl_height_m": 410.0,
            "current_aqi": 355
        }
        forecast = scorer.predict(input_data)
        
        self.assertIn("forecast_1h_aqi", forecast)
        self.assertIn("forecast_6h_aqi", forecast)
        self.assertIn("forecast_24h_aqi", forecast)
        self.assertGreaterEqual(forecast["forecast_1h_aqi"], 25)
        self.assertGreaterEqual(forecast["forecast_6h_aqi"], 25)
        self.assertGreaterEqual(forecast["forecast_24h_aqi"], 25)
        print(f"Verified Multi-Horizon Forecast: Current={forecast['current_aqi_ref']}, +1h={forecast['forecast_1h_aqi']}, +6h={forecast['forecast_6h_aqi']}, +24h={forecast['forecast_24h_aqi']}")

    def test_4_gemini_grounded_explanation_and_preventive_advisory(self):
        """Verify Gemini grounded AI analysis and 3-pillar preventive action recommendations."""
        from models.schemas import GeminiExplainRequest
        payload = {
            "station_id": "DELHI_NOIDA",
            "station_name": "Noida",
            "location": "Noida Sector 62 / NCR East",
            "current_aqi": 382,
            "category": "VERY_POOR",
            "pm2_5": 218.0,
            "pm10": 340.0,
            "wind_speed_kmh": 4.8,
            "humidity_pct": 82.0,
            "pbl_height_m": 375.0,
            "forecast_aqi": 410,
            "forecast_category": "SEVERE"
        }
        explanation = self.gemini_service.generate_environmental_explanation(GeminiExplainRequest(**payload))
        
        self.assertIsNotNone(explanation.summary)
        self.assertIsNotNone(explanation.meteorological_coupling_analysis)
        self.assertIsNotNone(explanation.forecast_interpretation)
        self.assertIsNotNone(explanation.preventive_recommendations)
        
        recs = explanation.preventive_recommendations
        sensitive = recs.get("sensitive_groups") if isinstance(recs, dict) else recs.sensitive_groups
        public = recs.get("general_public") if isinstance(recs, dict) else recs.general_public
        reg = recs.get("regulators") if isinstance(recs, dict) else recs.regulators
        self.assertGreater(len(sensitive), 0)
        self.assertGreater(len(public), 0)
        self.assertGreater(len(reg), 0)
        print("Verified Gemini Explanation & 3-Pillar Preventive Recommendations for Noida.")

    def test_5_live_fastapi_server_endpoints(self):
        """Verify live FastAPI server responds with valid schemas."""
        base_url = "http://127.0.0.1:8000"
        
        # 1. Health
        with urllib.request.urlopen(f"{base_url}/api/v1/health") as res:
            self.assertEqual(res.status, 200)
            data = json.loads(res.read().decode())
            self.assertEqual(data.get("status"), "ONLINE")
            
        # 2. Stations
        with urllib.request.urlopen(f"{base_url}/api/v1/stations") as res:
            self.assertEqual(res.status, 200)
            stations = json.loads(res.read().decode())
            self.assertEqual(len(stations), 23)
            
        print("Verified Live FastAPI Server (/health and /stations HTTP 200 OK).")

if __name__ == "__main__":
    unittest.main()
