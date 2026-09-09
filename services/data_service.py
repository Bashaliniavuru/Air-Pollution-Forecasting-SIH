import json
import os
from typing import Any, Dict, List, Optional
from models.schemas import DataRecord, StationObservation
from utils.constants import AQICategory
from utils.logger import setup_logger
from utils.helpers import generate_id, get_utc_timestamp

logger = setup_logger("data_service")


class DataService:
    """
    Manages air pollution and weather data ingestion for Delhi-NCR monitoring stations.
    """
    
    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir
        self.raw_dir = os.path.join(data_dir, "raw")
        self.processed_dir = os.path.join(data_dir, "processed")
        self._stations: List[StationObservation] = []
        self._in_memory_records: List[DataRecord] = []
        self._initialize_seed_data()
        
    def _initialize_seed_data(self) -> None:
        """Populates Delhi-NCR stations with coupled pollution and weather metrics."""
        delhi_stations = [
            {
                "station_id": "DELHI_ANAND_VIHAR",
                "station_name": "Anand Vihar Station",
                "location": "East Delhi (Industrial/Transport Hub)",
                "current_aqi": 382,
                "category": AQICategory.VERY_POOR,
                "pm2_5": 218.4,
                "pm10": 340.2,
                "no2": 68.5,
                "temperature_c": 18.2,
                "humidity_pct": 82.0,
                "wind_speed_kmh": 4.8,
                "wind_direction_deg": 290.0,
                "pbl_height_m": 380.0,
                "ventilation_index": 506.7
            },
            {
                "station_id": "DELHI_ITO",
                "station_name": "ITO Junction Station",
                "location": "Central Delhi (High Traffic Corridor)",
                "current_aqi": 345,
                "category": AQICategory.VERY_POOR,
                "pm2_5": 192.1,
                "pm10": 298.0,
                "no2": 84.2,
                "temperature_c": 19.0,
                "humidity_pct": 76.0,
                "wind_speed_kmh": 6.2,
                "wind_direction_deg": 305.0,
                "pbl_height_m": 420.0,
                "ventilation_index": 723.3
            },
            {
                "station_id": "DELHI_RK_PURAM",
                "station_name": "R.K. Puram Station",
                "location": "South Delhi (Residential & Institutional)",
                "current_aqi": 312,
                "category": AQICategory.VERY_POOR,
                "pm2_5": 165.0,
                "pm10": 260.5,
                "no2": 45.1,
                "temperature_c": 19.8,
                "humidity_pct": 74.0,
                "wind_speed_kmh": 7.5,
                "wind_direction_deg": 285.0,
                "pbl_height_m": 460.0,
                "ventilation_index": 958.3
            },
            {
                "station_id": "DELHI_PUNJABI_BAGH",
                "station_name": "Punjabi Bagh Station",
                "location": "West Delhi (Commercial & Mixed)",
                "current_aqi": 360,
                "category": AQICategory.VERY_POOR,
                "pm2_5": 198.6,
                "pm10": 315.0,
                "no2": 62.0,
                "temperature_c": 18.5,
                "humidity_pct": 80.0,
                "wind_speed_kmh": 5.4,
                "wind_direction_deg": 295.0,
                "pbl_height_m": 400.0,
                "ventilation_index": 600.0
            }
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
                temperature_c=s["temperature_c"],
                humidity_pct=s["humidity_pct"],
                wind_speed_kmh=s["wind_speed_kmh"],
                wind_direction_deg=s["wind_direction_deg"],
                pbl_height_m=s["pbl_height_m"],
                ventilation_index=s["ventilation_index"],
                timestamp=get_utc_timestamp()
            )
            self._stations.append(obs)

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
            self._in_memory_records.append(record)

        logger.info(f"DataService initialized with {len(self._stations)} Delhi-NCR monitoring stations.")

    def list_stations(self) -> List[StationObservation]:
        """Returns all active Delhi-NCR station observations."""
        return self._stations

    def list_records(self, category: Optional[str] = None) -> List[DataRecord]:
        """Returns all ingested records."""
        if category:
            return [r for r in self._in_memory_records if r.category.lower() == category.lower()]
        return self._in_memory_records

    def get_station(self, station_id: str) -> Optional[StationObservation]:
        for s in self._stations:
            if s.station_id == station_id:
                return s
        return None
