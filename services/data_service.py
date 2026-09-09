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

# Helper to convert AQI integer to AQICategory enum
def aqi_to_category(aqi_val: int) -> AQICategory:
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
        """Populates default stations with coupled pollution and weather metrics as offline fallback."""
        default_stations = [
            {
                "station_id": "DELHI_ANAND_VIHAR",
                "station_name": "Anand Vihar Station",
                "location": "East Delhi (Industrial/Transport Hub)",
                "current_aqi": 268,
                "category": AQICategory.POOR,
                "pm2_5": 185.4,
                "pm10": 290.2,
                "no2": 78.5,
                "temperature_c": 34.2,
                "humidity_pct": 62.0,
                "wind_speed_kmh": 8.5,
                "wind_direction_deg": 220.0,
                "pbl_height_m": 1200.0,
                "ventilation_index": 2833.3
            },
            {
                "station_id": "DELHI_ITO",
                "station_name": "ITO Junction Station",
                "location": "Central Delhi (High Traffic Corridor)",
                "current_aqi": 235,
                "category": AQICategory.POOR,
                "pm2_5": 162.0,
                "pm10": 245.8,
                "no2": 65.2,
                "temperature_c": 34.0,
                "humidity_pct": 63.5,
                "wind_speed_kmh": 7.8,
                "wind_direction_deg": 215.0,
                "pbl_height_m": 1180.0,
                "ventilation_index": 2556.7
            },
            {
                "station_id": "DELHI_RK_PURAM",
                "station_name": "R.K. Puram Station",
                "location": "South Delhi (Residential & Institutional)",
                "current_aqi": 205,
                "category": AQICategory.POOR,
                "pm2_5": 142.0,
                "pm10": 215.0,
                "no2": 52.3,
                "temperature_c": 34.5,
                "humidity_pct": 60.0,
                "wind_speed_kmh": 8.2,
                "wind_direction_deg": 225.0,
                "pbl_height_m": 1220.0,
                "ventilation_index": 2778.9
            },
            {
                "station_id": "DELHI_PUNJABI_BAGH",
                "station_name": "Punjabi Bagh Station",
                "location": "West Delhi (Commercial & Mixed)",
                "current_aqi": 255,
                "category": AQICategory.POOR,
                "pm2_5": 178.5,
                "pm10": 272.0,
                "no2": 70.4,
                "temperature_c": 33.9,
                "humidity_pct": 64.0,
                "wind_speed_kmh": 7.5,
                "wind_direction_deg": 210.0,
                "pbl_height_m": 1150.0,
                "ventilation_index": 2395.8
            },
            {
                "station_id": "NOIDA_SEC_62",
                "station_name": "Sector 62 Station",
                "location": "Noida (Institutional & Commercial Sector)",
                "current_aqi": 210,
                "category": AQICategory.POOR,
                "pm2_5": 145.6,
                "pm10": 220.3,
                "no2": 55.8,
                "temperature_c": 33.8,
                "humidity_pct": 65.0,
                "wind_speed_kmh": 7.2,
                "wind_direction_deg": 210.0,
                "pbl_height_m": 1100.0,
                "ventilation_index": 2200.0
            },
            {
                "station_id": "GURUGRAM_VIKAS_SADAN",
                "station_name": "Vikas Sadan Station",
                "location": "Gurugram (Civic Center & Highway Corridor)",
                "current_aqi": 188,
                "category": AQICategory.MODERATE,
                "pm2_5": 130.2,
                "pm10": 198.7,
                "no2": 48.3,
                "temperature_c": 35.1,
                "humidity_pct": 58.0,
                "wind_speed_kmh": 10.3,
                "wind_direction_deg": 230.0,
                "pbl_height_m": 1300.0,
                "ventilation_index": 3719.4
            },
            {
                "station_id": "GHAZIABAD_VASUNDHARA",
                "station_name": "Vasundhara Station",
                "location": "Ghaziabad (Residential & High Density Traffic)",
                "current_aqi": 252,
                "category": AQICategory.POOR,
                "pm2_5": 175.8,
                "pm10": 265.4,
                "no2": 72.1,
                "temperature_c": 33.5,
                "humidity_pct": 68.0,
                "wind_speed_kmh": 6.8,
                "wind_direction_deg": 200.0,
                "pbl_height_m": 1050.0,
                "ventilation_index": 1983.3
            },
            {
                "station_id": "FARIDABAD_SEC_16A",
                "station_name": "Sector 16A Station",
                "location": "Faridabad (Commercial & Mixed Industrial)",
                "current_aqi": 170,
                "category": AQICategory.MODERATE,
                "pm2_5": 120.5,
                "pm10": 180.3,
                "no2": 42.7,
                "temperature_c": 34.8,
                "humidity_pct": 60.0,
                "wind_speed_kmh": 9.1,
                "wind_direction_deg": 225.0,
                "pbl_height_m": 1250.0,
                "ventilation_index": 3159.7
            }
        ]

        for s in default_stations:
            obs = StationObservation(
                station_id=s["station_id"],
                station_name=s["station_name"],
                location=s["location"],
                current_aqi=s["current_aqi"],
                category=s["category"],
                pm2_5=s["pm2_5"],
                pm10=s["pm10"],
                no2=s["no2"],
                temperature_c=s["temperature_c"],
                humidity_pct=s["humidity_pct"],
                wind_speed_kmh=s["wind_speed_kmh"],
                wind_direction_deg=s["wind_direction_deg"],
                pbl_height_m=s["pbl_height_m"],
                ventilation_index=s["ventilation_index"],
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
                    "pollutants": {"pm2_5": s["pm2_5"], "pm10": s["pm10"], "no2": s["no2"], "aqi": s["current_aqi"]},
                    "meteorology": {"temp_c": s["temperature_c"], "humidity_pct": s["humidity_pct"], "wind_speed_kmh": s["wind_speed_kmh"], "pbl_height_m": s["pbl_height_m"]}
                },
                confidence_score=0.98,
                created_at=get_utc_timestamp()
            )
            self._fallback_records.append(record)

    def list_stations(self) -> List[StationObservation]:
        """
        Returns real-time coupled pollution and weather observations across Delhi-NCR stations
        fetched live from Supabase.
        """
        client = self._get_supabase_client()
        if not client:
            logger.info("Supabase client unavailable, using fallback stations.")
            return self._fallback_stations

        try:
            stations_res = client.table("stations").select("*").eq("is_active", True).execute()
            stations_data = stations_res.data
            if not stations_data:
                return self._fallback_stations

            # Query latest pollution & weather measurements
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
                # Ventilation index (m²/s) = wind speed (m/s) * PBL height (m) = (wind_kmh / 3.6) * pbl_m
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
                    temperature_c=float(w.get("temperature_c", 30.0)),
                    humidity_pct=float(w.get("humidity_pct", 60.0)),
                    wind_speed_kmh=wind_speed,
                    wind_direction_deg=float(w.get("wind_direction_deg", 220.0)),
                    pbl_height_m=pbl,
                    ventilation_index=float(w.get("ventilation_index") or vent_index),
                    timestamp=p.get("timestamp") or w.get("timestamp") or get_utc_timestamp()
                )
                observations.append(obs)

            return observations if observations else self._fallback_stations

        except Exception as e:
            logger.error(f"Error querying stations from Supabase: {e}")
            return self._fallback_stations

    def get_station(self, station_id: str) -> Optional[StationObservation]:
        """
        Retrieves a single station observation by its ID.
        """
        stations = self.list_stations()
        sid_norm = station_id.strip().upper()
        for s in stations:
            if s.station_id.upper() == sid_norm or s.station_id.lower() == station_id.strip().lower():
                return s
        return None

    def list_records(self, category: Optional[str] = None) -> List[DataRecord]:
        """
        Returns list of ingested telemetry and data records from Supabase.
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
            
            # Map weather by station_id
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
