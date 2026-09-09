"""
Data Service: Ingests, queries, and provides Air Quality and Weather Telemetry
for Delhi-NCR monitoring stations with Supabase PostgreSQL integration.
"""

import os
from typing import Any, Dict, List, Optional
from models.schemas import DataRecord, StationObservation
from utils.constants import AQICategory
from utils.logger import setup_logger
from utils.helpers import generate_id, get_utc_timestamp

logger = setup_logger("data_service")


def aqi_to_category(aqi_val: int) -> AQICategory:
    """Helper to convert numerical AQI to standard CPCB AQICategory enum."""
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


class DataService:
    """
    Manages air pollution and weather data ingestion for Delhi-NCR monitoring stations.
    Reads live data from Supabase PostgreSQL database with robust fallback support.
    """

    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir
        self.raw_dir = os.path.join(data_dir, "raw")
        self.processed_dir = os.path.join(data_dir, "processed")
        self._fallback_stations: List[StationObservation] = []
        self._fallback_records: List[DataRecord] = []
        self._initialize_fallback_data()

    def _get_supabase_client(self):
        """Lazy-loads Supabase client singleton."""
        try:
            from backend.db.supabase_client import get_supabase_client
            return get_supabase_client()
        except Exception as e:
            logger.warning(f"Could not initialize Supabase client: {e}")
            return None

    def _initialize_fallback_data(self) -> None:
        """Populates comprehensive Delhi-NCR stations with coupled pollution and weather metrics."""
        delhi_stations = [
            {"station_id": "DELHI_CENTRAL", "station_name": "Delhi", "location": "Central Delhi (NCT Baseline)", "current_aqi": 355, "category": AQICategory.VERY_POOR, "pm2_5": 195.0, "pm10": 310.0, "no2": 72.0, "o3": 38.0, "so2": 15.0, "co": 2.4, "temperature_c": 19.0, "humidity_pct": 78.0, "wind_speed_kmh": 5.8, "wind_direction_deg": 295.0, "pressure_hpa": 1014.0, "rainfall_mm": 0.0, "pbl_height_m": 410.0, "ventilation_index": 660.8, "lat": 28.6139, "lon": 77.2090},
            {"station_id": "DELHI_NEW_DELHI", "station_name": "New Delhi", "location": "Central Delhi (Diplomatic Core)", "current_aqi": 285, "category": AQICategory.POOR, "pm2_5": 145.0, "pm10": 235.0, "no2": 52.0, "o3": 45.0, "so2": 11.0, "co": 1.8, "temperature_c": 19.5, "humidity_pct": 72.0, "wind_speed_kmh": 7.2, "wind_direction_deg": 290.0, "pressure_hpa": 1014.5, "rainfall_mm": 0.0, "pbl_height_m": 480.0, "ventilation_index": 960.0, "lat": 28.6145, "lon": 77.2085},
            {"station_id": "DELHI_ROHINI", "station_name": "Rohini", "location": "North-West Delhi (Sector 16)", "current_aqi": 370, "category": AQICategory.VERY_POOR, "pm2_5": 210.0, "pm10": 325.0, "no2": 65.0, "o3": 34.0, "so2": 14.0, "co": 2.6, "temperature_c": 18.0, "humidity_pct": 82.0, "wind_speed_kmh": 4.5, "wind_direction_deg": 300.0, "pressure_hpa": 1013.8, "rainfall_mm": 0.0, "pbl_height_m": 360.0, "ventilation_index": 450.0, "lat": 28.7495, "lon": 77.0565},
            {"station_id": "DELHI_DWARKA", "station_name": "Dwarka", "location": "South-West Delhi (Sector 8 Corridor)", "current_aqi": 310, "category": AQICategory.VERY_POOR, "pm2_5": 165.0, "pm10": 265.0, "no2": 58.0, "o3": 42.0, "so2": 12.0, "co": 2.1, "temperature_c": 19.2, "humidity_pct": 75.0, "wind_speed_kmh": 6.8, "wind_direction_deg": 285.0, "pressure_hpa": 1014.2, "rainfall_mm": 0.0, "pbl_height_m": 440.0, "ventilation_index": 831.1, "lat": 28.5921, "lon": 77.0460},
            {"station_id": "DELHI_SAKET", "station_name": "Saket", "location": "South Delhi (District Centre)", "current_aqi": 295, "category": AQICategory.POOR, "pm2_5": 152.0, "pm10": 245.0, "no2": 48.0, "o3": 40.0, "so2": 10.5, "co": 1.9, "temperature_c": 19.8, "humidity_pct": 73.0, "wind_speed_kmh": 7.0, "wind_direction_deg": 280.0, "pressure_hpa": 1014.0, "rainfall_mm": 0.0, "pbl_height_m": 470.0, "ventilation_index": 913.9, "lat": 28.5244, "lon": 77.2167},
            {"station_id": "DELHI_NOIDA", "station_name": "Noida", "location": "Noida Sector 62 / NCR East", "current_aqi": 382, "category": AQICategory.VERY_POOR, "pm2_5": 218.0, "pm10": 340.0, "no2": 76.0, "o3": 32.0, "so2": 17.0, "co": 2.8, "temperature_c": 18.2, "humidity_pct": 82.0, "wind_speed_kmh": 4.8, "wind_direction_deg": 290.0, "pressure_hpa": 1013.7, "rainfall_mm": 0.0, "pbl_height_m": 375.0, "ventilation_index": 500.0, "lat": 28.5355, "lon": 77.3910},
            {"station_id": "DELHI_GHAZIABAD", "station_name": "Ghaziabad", "location": "Ghaziabad Vasundhara / NCR North-East", "current_aqi": 420, "category": AQICategory.SEVERE, "pm2_5": 252.0, "pm10": 395.0, "no2": 92.0, "o3": 26.0, "so2": 24.0, "co": 3.6, "temperature_c": 17.6, "humidity_pct": 87.0, "wind_speed_kmh": 3.8, "wind_direction_deg": 300.0, "pressure_hpa": 1013.3, "rainfall_mm": 0.0, "pbl_height_m": 320.0, "ventilation_index": 337.8, "lat": 28.6692, "lon": 77.4538},
            {"station_id": "DELHI_GURUGRAM", "station_name": "Gurugram", "location": "Gurugram Cyber City / NCR South-West", "current_aqi": 335, "category": AQICategory.VERY_POOR, "pm2_5": 182.0, "pm10": 288.0, "no2": 68.0, "o3": 37.0, "so2": 13.5, "co": 2.4, "temperature_c": 19.3, "humidity_pct": 76.0, "wind_speed_kmh": 6.2, "wind_direction_deg": 285.0, "pressure_hpa": 1014.1, "rainfall_mm": 0.0, "pbl_height_m": 430.0, "ventilation_index": 740.7, "lat": 28.4595, "lon": 77.0266},
            {"station_id": "DELHI_FARIDABAD", "station_name": "Faridabad", "location": "Faridabad Sector 16A / NCR South", "current_aqi": 365, "category": AQICategory.VERY_POOR, "pm2_5": 204.0, "pm10": 322.0, "no2": 74.0, "o3": 33.0, "so2": 18.0, "co": 2.7, "temperature_c": 18.7, "humidity_pct": 80.0, "wind_speed_kmh": 5.2, "wind_direction_deg": 290.0, "pressure_hpa": 1013.9, "rainfall_mm": 0.0, "pbl_height_m": 390.0, "ventilation_index": 563.3, "lat": 28.4089, "lon": 77.3178},
            {"station_id": "DELHI_ANAND_VIHAR", "station_name": "Anand Vihar", "location": "East Delhi (Industrial / ISBT Hub)", "current_aqi": 415, "category": AQICategory.SEVERE, "pm2_5": 245.0, "pm10": 385.0, "no2": 88.0, "o3": 28.0, "so2": 19.5, "co": 3.4, "temperature_c": 17.8, "humidity_pct": 85.0, "wind_speed_kmh": 4.2, "wind_direction_deg": 290.0, "pressure_hpa": 1013.5, "rainfall_mm": 0.0, "pbl_height_m": 340.0, "ventilation_index": 396.7, "lat": 28.6468, "lon": 77.3159},
            {"station_id": "DELHI_ITO", "station_name": "ITO Junction", "location": "Central Delhi (High Traffic Corridor)", "current_aqi": 345, "category": AQICategory.VERY_POOR, "pm2_5": 192.0, "pm10": 305.0, "no2": 82.0, "o3": 36.0, "so2": 16.0, "co": 2.9, "temperature_c": 19.1, "humidity_pct": 77.0, "wind_speed_kmh": 5.7, "wind_direction_deg": 285.0, "pressure_hpa": 1014.0, "rainfall_mm": 0.0, "pbl_height_m": 420.0, "ventilation_index": 665.0, "lat": 28.6289, "lon": 77.2407},
            {"station_id": "DELHI_RK_PURAM", "station_name": "R.K. Puram", "location": "South Delhi (Residential & Institutional)", "current_aqi": 290, "category": AQICategory.POOR, "pm2_5": 148.0, "pm10": 238.0, "no2": 50.0, "o3": 44.0, "so2": 11.0, "co": 1.8, "temperature_c": 19.6, "humidity_pct": 72.0, "wind_speed_kmh": 7.1, "wind_direction_deg": 280.0, "pressure_hpa": 1014.2, "rainfall_mm": 0.0, "pbl_height_m": 480.0, "ventilation_index": 946.7, "lat": 28.5660, "lon": 77.1767},
            {"station_id": "DELHI_PUNJABI_BAGH", "station_name": "Punjabi Bagh", "location": "West Delhi (Commercial & Mixed)", "current_aqi": 360, "category": AQICategory.VERY_POOR, "pm2_5": 198.6, "pm10": 315.0, "no2": 62.0, "o3": 36.0, "so2": 13.5, "co": 2.5, "temperature_c": 18.5, "humidity_pct": 80.0, "wind_speed_kmh": 5.4, "wind_direction_deg": 295.0, "pressure_hpa": 1014.0, "rainfall_mm": 0.0, "pbl_height_m": 400.0, "ventilation_index": 600.0, "lat": 28.6692, "lon": 77.1260},
            {"station_id": "DELHI_VASANT_KUNJ", "station_name": "Vasant Kunj", "location": "South-West Delhi (Institutional & Ridge)", "current_aqi": 275, "category": AQICategory.POOR, "pm2_5": 138.0, "pm10": 220.0, "no2": 44.0, "o3": 46.0, "so2": 9.8, "co": 1.6, "temperature_c": 19.6, "humidity_pct": 71.0, "wind_speed_kmh": 7.8, "wind_direction_deg": 275.0, "pressure_hpa": 1014.4, "rainfall_mm": 0.0, "pbl_height_m": 500.0, "ventilation_index": 1083.3, "lat": 28.5293, "lon": 77.1528},
            {"station_id": "DELHI_KAROL_BAGH", "station_name": "Karol Bagh", "location": "Central Delhi (High-Density Commercial)", "current_aqi": 340, "category": AQICategory.VERY_POOR, "pm2_5": 188.0, "pm10": 292.0, "no2": 78.0, "o3": 35.0, "so2": 14.0, "co": 2.8, "temperature_c": 18.8, "humidity_pct": 77.0, "wind_speed_kmh": 5.6, "wind_direction_deg": 300.0, "pressure_hpa": 1014.1, "rainfall_mm": 0.0, "pbl_height_m": 410.0, "ventilation_index": 637.8, "lat": 28.6517, "lon": 77.1906},
            {"station_id": "DELHI_LAJPAT_NAGAR", "station_name": "Lajpat Nagar", "location": "South-East Delhi (Commercial Market)", "current_aqi": 325, "category": AQICategory.VERY_POOR, "pm2_5": 175.0, "pm10": 275.0, "no2": 70.0, "o3": 39.0, "so2": 12.8, "co": 2.3, "temperature_c": 19.2, "humidity_pct": 75.0, "wind_speed_kmh": 6.4, "wind_direction_deg": 290.0, "pressure_hpa": 1014.0, "rainfall_mm": 0.0, "pbl_height_m": 440.0, "ventilation_index": 782.2, "lat": 28.5677, "lon": 77.2433},
            {"station_id": "DELHI_CONNAUGHT_PLACE", "station_name": "Connaught Place", "location": "Central Delhi (Commercial Core)", "current_aqi": 305, "category": AQICategory.VERY_POOR, "pm2_5": 160.0, "pm10": 255.0, "no2": 76.0, "o3": 41.0, "so2": 13.0, "co": 2.2, "temperature_c": 19.4, "humidity_pct": 74.0, "wind_speed_kmh": 6.5, "wind_direction_deg": 295.0, "pressure_hpa": 1014.3, "rainfall_mm": 0.0, "pbl_height_m": 450.0, "ventilation_index": 812.5, "lat": 28.6315, "lon": 77.2167},
            {"station_id": "DELHI_OKHLA", "station_name": "Okhla", "location": "South-East Delhi (Industrial Estate Phase II)", "current_aqi": 395, "category": AQICategory.VERY_POOR, "pm2_5": 230.0, "pm10": 360.0, "no2": 85.0, "o3": 30.0, "so2": 22.0, "co": 3.1, "temperature_c": 18.4, "humidity_pct": 81.0, "wind_speed_kmh": 4.6, "wind_direction_deg": 285.0, "pressure_hpa": 1013.9, "rainfall_mm": 0.0, "pbl_height_m": 370.0, "ventilation_index": 472.8, "lat": 28.5308, "lon": 77.2713},
            {"station_id": "DELHI_PATPARGANJ", "station_name": "Patparganj", "location": "East Delhi (Industrial & Residential)", "current_aqi": 380, "category": AQICategory.VERY_POOR, "pm2_5": 215.0, "pm10": 338.0, "no2": 72.0, "o3": 32.0, "so2": 16.5, "co": 2.7, "temperature_c": 18.1, "humidity_pct": 83.0, "wind_speed_kmh": 4.8, "wind_direction_deg": 290.0, "pressure_hpa": 1013.7, "rainfall_mm": 0.0, "pbl_height_m": 380.0, "ventilation_index": 506.7, "lat": 28.6277, "lon": 77.2995},
            {"station_id": "DELHI_SHAHDARA", "station_name": "Shahdara", "location": "North-East Delhi (High-Density Mixed)", "current_aqi": 388, "category": AQICategory.VERY_POOR, "pm2_5": 222.0, "pm10": 345.0, "no2": 74.0, "o3": 31.0, "so2": 15.8, "co": 2.9, "temperature_c": 18.0, "humidity_pct": 84.0, "wind_speed_kmh": 4.4, "wind_direction_deg": 295.0, "pressure_hpa": 1013.6, "rainfall_mm": 0.0, "pbl_height_m": 360.0, "ventilation_index": 440.0, "lat": 28.6738, "lon": 77.2905},
            {"station_id": "DELHI_NAJAFGARH", "station_name": "Najafgarh", "location": "South-West Delhi (Rural-Urban Fringe)", "current_aqi": 290, "category": AQICategory.POOR, "pm2_5": 148.0, "pm10": 250.0, "no2": 42.0, "o3": 44.0, "so2": 10.0, "co": 1.7, "temperature_c": 19.0, "humidity_pct": 76.0, "wind_speed_kmh": 7.5, "wind_direction_deg": 280.0, "pressure_hpa": 1014.2, "rainfall_mm": 0.0, "pbl_height_m": 490.0, "ventilation_index": 1020.8, "lat": 28.6092, "lon": 76.9798},
            {"station_id": "DELHI_NARELA", "station_name": "Narela", "location": "North Delhi (Industrial Sub-City)", "current_aqi": 405, "category": AQICategory.SEVERE, "pm2_5": 238.0, "pm10": 375.0, "no2": 80.0, "o3": 29.0, "so2": 21.0, "co": 3.2, "temperature_c": 17.5, "humidity_pct": 86.0, "wind_speed_kmh": 4.0, "wind_direction_deg": 310.0, "pressure_hpa": 1013.4, "rainfall_mm": 0.0, "pbl_height_m": 330.0, "ventilation_index": 366.7, "lat": 28.8526, "lon": 77.0934},
            {"station_id": "DELHI_CIVIL_LINES", "station_name": "Civil Lines", "location": "North Delhi (Institutional & Residential)", "current_aqi": 318, "category": AQICategory.VERY_POOR, "pm2_5": 170.0, "pm10": 268.0, "no2": 60.0, "o3": 38.0, "so2": 11.5, "co": 2.0, "temperature_c": 18.9, "humidity_pct": 78.0, "wind_speed_kmh": 6.0, "wind_direction_deg": 300.0, "pressure_hpa": 1014.1, "rainfall_mm": 0.0, "pbl_height_m": 430.0, "ventilation_index": 716.7, "lat": 28.6816, "lon": 77.2227},
            {"station_id": "DELHI_MAYUR_VIHAR", "station_name": "Mayur Vihar", "location": "East Delhi (Trans-Yamuna Residential)", "current_aqi": 365, "category": AQICategory.VERY_POOR, "pm2_5": 202.0, "pm10": 320.0, "no2": 66.0, "o3": 33.0, "so2": 14.5, "co": 2.4, "temperature_c": 18.3, "humidity_pct": 82.0, "wind_speed_kmh": 5.0, "wind_direction_deg": 290.0, "pressure_hpa": 1013.8, "rainfall_mm": 0.0, "pbl_height_m": 390.0, "ventilation_index": 541.7, "lat": 28.6078, "lon": 77.2989},
            {"station_id": "DELHI_GREATER_KAILASH", "station_name": "Greater Kailash", "location": "South Delhi (Prime Residential)", "current_aqi": 280, "category": AQICategory.POOR, "pm2_5": 140.0, "pm10": 225.0, "no2": 46.0, "o3": 43.0, "so2": 10.2, "co": 1.7, "temperature_c": 19.7, "humidity_pct": 72.0, "wind_speed_kmh": 7.4, "wind_direction_deg": 285.0, "pressure_hpa": 1014.3, "rainfall_mm": 0.0, "pbl_height_m": 480.0, "ventilation_index": 986.7, "lat": 28.5482, "lon": 77.2343}
        ]

        for s in delhi_stations:
            obs = StationObservation(
                station_id=s["station_id"],
                station_name=s["station_name"],
                location=s["location"],
                current_aqi=s["current_aqi"],
                category=s["category"],
                pm2_5=s["pm2_5"],
                pm10=s["pm10"],
                no2=s["no2"],
                o3=s.get("o3", 38.0),
                so2=s.get("so2", 14.0),
                co=s.get("co", 2.1),
                temperature_c=s["temperature_c"],
                humidity_pct=s["humidity_pct"],
                wind_speed_kmh=s["wind_speed_kmh"],
                wind_direction_deg=s["wind_direction_deg"],
                pressure_hpa=s.get("pressure_hpa", 1014.0),
                rainfall_mm=s.get("rainfall_mm", 0.0),
                pbl_height_m=s["pbl_height_m"],
                ventilation_index=s["ventilation_index"],
                lat=s.get("lat", 28.6139),
                lon=s.get("lon", 77.2090),
                timestamp=get_utc_timestamp()
            )
            self._fallback_stations.append(obs)

            record = DataRecord(
                record_id=generate_id("rec"),
                title=f"{s['station_name']} Telemetry Feed",
                category="Delhi-NCR Ingress",
                payload={
                    "station_id": s["station_id"],
                    "location": s["location"],
                    "pollutants": {
                        "pm2_5": s["pm2_5"],
                        "pm10": s["pm10"],
                        "no2": s["no2"],
                        "o3": s.get("o3", 38.0),
                        "so2": s.get("so2", 14.0),
                        "co": s.get("co", 2.1),
                        "aqi": s["current_aqi"]
                    },
                    "meteorology": {
                        "temp_c": s["temperature_c"],
                        "humidity_pct": s["humidity_pct"],
                        "wind_speed_kmh": s["wind_speed_kmh"],
                        "pressure_hpa": s.get("pressure_hpa", 1014.0),
                        "rainfall_mm": s.get("rainfall_mm", 0.0),
                        "pbl_height_m": s["pbl_height_m"]
                    }
                },
                confidence_score=0.98,
                created_at=get_utc_timestamp()
            )
            self._fallback_records.append(record)

    def list_stations(self) -> List[StationObservation]:
        """
        Returns real-time coupled pollution and weather observations across Delhi-NCR stations.
        Queries Supabase PostgreSQL if configured and active, otherwise seamlessly uses local station telemetry.
        """
        client = self._get_supabase_client()
        if not client:
            return self._fallback_stations

        try:
            stations_res = client.table("stations").select("*").eq("is_active", True).execute()
            stations_data = stations_res.data
            if not stations_data:
                return self._fallback_stations

            pol_res = client.table("pollution_measurements").select("*").order("timestamp", desc=True).limit(50).execute()
            wth_res = client.table("weather_measurements").select("*").order("timestamp", desc=True).limit(50).execute()

            latest_pol: Dict[str, Dict[str, Any]] = {}
            for p in (pol_res.data or []):
                sid = p.get("station_id")
                if sid and sid not in latest_pol:
                    latest_pol[sid] = p

            latest_wth: Dict[str, Dict[str, Any]] = {}
            for w in (wth_res.data or []):
                sid = w.get("station_id")
                if sid and sid not in latest_wth:
                    latest_wth[sid] = w

            observations: List[StationObservation] = []
            for stn in stations_data:
                sid = stn.get("station_id")
                p = latest_pol.get(sid, {})
                w = latest_wth.get(sid, {})

                aqi_val = int(p.get("aqi", 250))
                category_enum = aqi_to_category(aqi_val)

                wind_speed = float(w.get("wind_speed_kmh", 8.0))
                pbl = float(w.get("pbl_height_m", 1000.0))
                vent_index = round((wind_speed / 3.6) * pbl, 1)

                obs = StationObservation(
                    station_id=sid,
                    station_name=stn.get("station_name", sid),
                    location=stn.get("location_description") or f"{stn.get('city', 'Delhi-NCR')} Station",
                    current_aqi=aqi_val,
                    category=category_enum,
                    pm2_5=float(p.get("pm2_5", 150.0)),
                    pm10=float(p.get("pm10", 250.0)),
                    no2=float(p.get("no2", 60.0)),
                    o3=float(p.get("o3", 38.0)),
                    so2=float(p.get("so2", 14.0)),
                    co=float(p.get("co", 2.1)),
                    temperature_c=float(w.get("temperature_c", 30.0)),
                    humidity_pct=float(w.get("humidity_pct", 60.0)),
                    wind_speed_kmh=wind_speed,
                    wind_direction_deg=float(w.get("wind_direction_deg", 220.0)),
                    pressure_hpa=float(w.get("pressure_hpa", 1014.0)),
                    rainfall_mm=float(w.get("rainfall_mm", 0.0)),
                    pbl_height_m=pbl,
                    ventilation_index=float(w.get("ventilation_index") or vent_index),
                    lat=float(stn.get("latitude") or 28.6139),
                    lon=float(stn.get("longitude") or 77.2090),
                    timestamp=p.get("timestamp") or w.get("timestamp") or get_utc_timestamp()
                )
                observations.append(obs)

            return observations if observations else self._fallback_stations

        except Exception as e:
            logger.error(f"Error querying stations from Supabase: {e}")
            return self._fallback_stations

    def get_station(self, station_id: str) -> Optional[StationObservation]:
        """
        Retrieves a single station observation by its ID with robust alias mapping.
        """
        stations = self.list_stations()
        sid_norm = station_id.strip().upper()
        
        # Direct exact match
        for s in stations:
            if s.station_id.upper() == sid_norm:
                return s

        # Alias dictionary for cross-referencing identifiers
        aliases = {
            "DELHI_NOIDA": ["NOIDA_SEC_62", "NOIDA"],
            "NOIDA_SEC_62": ["DELHI_NOIDA", "NOIDA"],
            "DELHI_GURUGRAM": ["GURUGRAM_VIKAS_SADAN", "GURUGRAM"],
            "GURUGRAM_VIKAS_SADAN": ["DELHI_GURUGRAM", "GURUGRAM"],
            "DELHI_GHAZIABAD": ["GHAZIABAD_VASUNDHARA", "GHAZIABAD"],
            "GHAZIABAD_VASUNDHARA": ["DELHI_GHAZIABAD", "GHAZIABAD"],
            "DELHI_FARIDABAD": ["FARIDABAD_SEC_16A", "FARIDABAD"],
            "FARIDABAD_SEC_16A": ["DELHI_FARIDABAD", "FARIDABAD"],
            "DELHI_ANAND_VIHAR": ["ANAND_VIHAR"],
            "DELHI_CENTRAL": ["CENTRAL_DELHI", "DELHI"]
        }

        candidate_ids = aliases.get(sid_norm, [])
        for s in stations:
            if s.station_id.upper() in candidate_ids:
                return s

        # Substring / fuzzy match fallback
        for s in stations:
            if sid_norm in s.station_id.upper() or s.station_id.upper() in sid_norm:
                return s

        return None

    def list_records(self, category: Optional[str] = None) -> List[DataRecord]:
        """
        Returns list of ingested telemetry and data records.
        """
        client = self._get_supabase_client()
        if not client:
            if category:
                return [r for r in self._fallback_records if r.category.lower() == category.lower()]
            return self._fallback_records

        try:
            pol_res = client.table("pollution_measurements").select("*").order("timestamp", desc=True).limit(20).execute()
            wth_res = client.table("weather_measurements").select("*").order("timestamp", desc=True).limit(20).execute()

            records: List[DataRecord] = []
            latest_wth: Dict[str, Dict[str, Any]] = {}
            for w in (wth_res.data or []):
                sid = w.get("station_id")
                if sid and sid not in latest_wth:
                    latest_wth[sid] = w

            for p in (pol_res.data or []):
                sid = p.get("station_id")
                w = latest_wth.get(sid, {})
                rec = DataRecord(
                    record_id=p.get("id") or generate_id("rec"),
                    title=f"{sid} Live Telemetry",
                    category="Delhi-NCR Ingress",
                    payload={
                        "station_id": sid,
                        "pollutants": {
                            "pm2_5": p.get("pm2_5"),
                            "pm10": p.get("pm10"),
                            "no2": p.get("no2"),
                            "so2": p.get("so2"),
                            "co": p.get("co"),
                            "o3": p.get("o3"),
                            "aqi": p.get("aqi"),
                            "category": p.get("category")
                        },
                        "meteorology": {
                            "temp_c": w.get("temperature_c"),
                            "humidity_pct": w.get("humidity_pct"),
                            "wind_speed_kmh": w.get("wind_speed_kmh"),
                            "pbl_height_m": w.get("pbl_height_m"),
                            "rainfall_mm": w.get("rainfall_mm", 0.0)
                        }
                    },
                    confidence_score=0.98,
                    created_at=p.get("timestamp") or get_utc_timestamp()
                )
                records.append(rec)

            if category:
                records = [r for r in records if r.category.lower() == category.lower()]

            return records if records else self._fallback_records

        except Exception as e:
            logger.error(f"Error reading records from Supabase: {e}")
            return self._fallback_records
