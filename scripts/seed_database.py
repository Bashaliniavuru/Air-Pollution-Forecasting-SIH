"""
Seed Script: Populate Supabase tables with initial reference data.
Inserts the 5 Delhi-NCR regions/stations and sample pollution/weather data.
"""

import os
import sys
from datetime import datetime, timezone

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.db.supabase_client import get_supabase_client


def seed_regions(client):
    """Insert the 5 Delhi-NCR cities as regions."""
    regions = [
        {
            "region_id": "delhi",
            "city_name": "Delhi",
            "state": "Delhi",
            "latitude": 28.6139,
            "longitude": 77.2090,
        },
        {
            "region_id": "noida",
            "city_name": "Noida",
            "state": "Uttar Pradesh",
            "latitude": 28.5355,
            "longitude": 77.3910,
        },
        {
            "region_id": "gurugram",
            "city_name": "Gurugram",
            "state": "Haryana",
            "latitude": 28.4595,
            "longitude": 77.0266,
        },
        {
            "region_id": "ghaziabad",
            "city_name": "Ghaziabad",
            "state": "Uttar Pradesh",
            "latitude": 28.6692,
            "longitude": 77.4538,
        },
        {
            "region_id": "faridabad",
            "city_name": "Faridabad",
            "state": "Haryana",
            "latitude": 28.4089,
            "longitude": 77.3178,
        },
    ]

    print("Inserting regions...")
    # Check if regions already exist
    existing = client.table("regions").select("region_id").execute()
    if existing.data:
        print(f"  - {len(existing.data)} regions already exist, skipping insert")
        return existing.data
    result = client.table("regions").insert(regions).execute()
    print(f"  ✓ {len(result.data)} regions inserted")
    return result.data


def seed_stations(client):
    """Insert monitoring stations for each region."""
    stations = [
        # Delhi stations
        {
            "station_id": "delhi_anand_vihar",
            "station_name": "Anand Vihar",
            "region_id": "delhi",
            "latitude": 28.6468,
            "longitude": 77.3160,
            "source": "CPCB",
            "is_active": True,
        },
        {
            "station_id": "delhi_ito",
            "station_name": "ITO",
            "region_id": "delhi",
            "latitude": 28.6289,
            "longitude": 77.2413,
            "source": "DPCC",
            "is_active": True,
        },
        {
            "station_id": "delhi_rohini",
            "station_name": "Rohini",
            "region_id": "delhi",
            "latitude": 28.7320,
            "longitude": 77.1198,
            "source": "DPCC",
            "is_active": True,
        },
        # Noida
        {
            "station_id": "noida_sec62",
            "station_name": "Sector 62",
            "region_id": "noida",
            "latitude": 28.6244,
            "longitude": 77.3600,
            "source": "CPCB",
            "is_active": True,
        },
        # Gurugram
        {
            "station_id": "gurugram_teri",
            "station_name": "TERI Gram",
            "region_id": "gurugram",
            "latitude": 28.4490,
            "longitude": 77.0510,
            "source": "CPCB",
            "is_active": True,
        },
        # Ghaziabad
        {
            "station_id": "ghaziabad_vasundhara",
            "station_name": "Vasundhara",
            "region_id": "ghaziabad",
            "latitude": 28.6600,
            "longitude": 77.3570,
            "source": "CPCB",
            "is_active": True,
        },
        # Faridabad
        {
            "station_id": "faridabad_sec16a",
            "station_name": "Sector 16A",
            "region_id": "faridabad",
            "latitude": 28.4220,
            "longitude": 77.3100,
            "source": "CPCB",
            "is_active": True,
        },
    ]

    print("Inserting stations...")
    existing = client.table("stations").select("station_id").execute()
    if existing.data:
        print(f"  - {len(existing.data)} stations already exist, skipping insert")
        return existing.data
    result = client.table("stations").insert(stations).execute()
    print(f"  ✓ {len(result.data)} stations inserted")
    return result.data


def seed_sample_pollution(client):
    """Insert sample pollution measurements for demo purposes."""
    now = datetime.now(timezone.utc).isoformat()

    # Actual columns: id, station_id, timestamp, pm25, pm10, no2, so2, co, o3, aqi, created_at
    measurements = [
        {
            "station_id": "DELHI_ANAND_VIHAR",
            "timestamp": now,
            "pm2_5": 185.4,
            "pm10": 290.2,
            "no2": 78.5,
            "so2": 18.3,
            "co": 2.8,
            "o3": 32.1,
            "aqi": 268,
            "category": "Very Poor",
        },
        {
            "station_id": "DELHI_ITO",
            "timestamp": now,
            "pm2_5": 162.0,
            "pm10": 245.8,
            "no2": 65.2,
            "so2": 15.1,
            "co": 2.3,
            "o3": 28.7,
            "aqi": 235,
            "category": "Poor",
        },
        {
            "station_id": "DELHI_RK_PURAM",
            "timestamp": now,
            "pm2_5": 142.0,
            "pm10": 215.0,
            "no2": 52.3,
            "so2": 13.0,
            "co": 1.8,
            "o3": 34.5,
            "aqi": 205,
            "category": "Poor",
        },
        {
            "station_id": "DELHI_PUNJABI_BAGH",
            "timestamp": now,
            "pm2_5": 178.5,
            "pm10": 272.0,
            "no2": 70.4,
            "so2": 16.5,
            "co": 2.4,
            "o3": 31.0,
            "aqi": 255,
            "category": "Very Poor",
        },
        {
            "station_id": "NOIDA_SEC_62",
            "timestamp": now,
            "pm2_5": 145.6,
            "pm10": 220.3,
            "no2": 55.8,
            "so2": 12.4,
            "co": 1.9,
            "o3": 35.2,
            "aqi": 210,
            "category": "Poor",
        },
        {
            "station_id": "GURUGRAM_VIKAS_SADAN",
            "timestamp": now,
            "pm2_5": 130.2,
            "pm10": 198.7,
            "no2": 48.3,
            "so2": 10.8,
            "co": 1.6,
            "o3": 40.5,
            "aqi": 188,
            "category": "Moderate",
        },
        {
            "station_id": "GHAZIABAD_VASUNDHARA",
            "timestamp": now,
            "pm2_5": 175.8,
            "pm10": 265.4,
            "no2": 72.1,
            "so2": 16.9,
            "co": 2.5,
            "o3": 30.3,
            "aqi": 252,
            "category": "Very Poor",
        },
        {
            "station_id": "FARIDABAD_SEC_16A",
            "timestamp": now,
            "pm2_5": 120.5,
            "pm10": 180.3,
            "no2": 42.7,
            "so2": 9.5,
            "co": 1.4,
            "o3": 45.8,
            "aqi": 170,
            "category": "Moderate",
        },
    ]

    print("Inserting pollution measurements...")
    result = client.table("pollution_measurements").insert(measurements).execute()
    print(f"  ✓ {len(result.data)} pollution records inserted")
    return result.data


def seed_sample_weather(client):
    """Insert sample weather data for demo purposes."""
    now = datetime.now(timezone.utc).isoformat()

    weather_entries = [
        {"station_id": "DELHI_ANAND_VIHAR", "timestamp": now, "temperature_c": 34.2, "humidity_pct": 62.0, "wind_speed_kmh": 8.5, "wind_direction_deg": 220.0, "pbl_height_m": 1200.0, "rainfall_mm": 0.0, "inversion_detected": False},
        {"station_id": "DELHI_ITO", "timestamp": now, "temperature_c": 34.0, "humidity_pct": 63.5, "wind_speed_kmh": 7.8, "wind_direction_deg": 215.0, "pbl_height_m": 1180.0, "rainfall_mm": 0.0, "inversion_detected": False},
        {"station_id": "DELHI_RK_PURAM", "timestamp": now, "temperature_c": 34.5, "humidity_pct": 60.0, "wind_speed_kmh": 8.2, "wind_direction_deg": 225.0, "pbl_height_m": 1220.0, "rainfall_mm": 0.0, "inversion_detected": False},
        {"station_id": "DELHI_PUNJABI_BAGH", "timestamp": now, "temperature_c": 33.9, "humidity_pct": 64.0, "wind_speed_kmh": 7.5, "wind_direction_deg": 210.0, "pbl_height_m": 1150.0, "rainfall_mm": 0.0, "inversion_detected": False},
        {"station_id": "NOIDA_SEC_62", "timestamp": now, "temperature_c": 33.8, "humidity_pct": 65.0, "wind_speed_kmh": 7.2, "wind_direction_deg": 210.0, "pbl_height_m": 1100.0, "rainfall_mm": 0.0, "inversion_detected": False},
        {"station_id": "GURUGRAM_VIKAS_SADAN", "timestamp": now, "temperature_c": 35.1, "humidity_pct": 58.0, "wind_speed_kmh": 10.3, "wind_direction_deg": 230.0, "pbl_height_m": 1300.0, "rainfall_mm": 0.0, "inversion_detected": False},
        {"station_id": "GHAZIABAD_VASUNDHARA", "timestamp": now, "temperature_c": 33.5, "humidity_pct": 68.0, "wind_speed_kmh": 6.8, "wind_direction_deg": 200.0, "pbl_height_m": 1050.0, "rainfall_mm": 0.0, "inversion_detected": False},
        {"station_id": "FARIDABAD_SEC_16A", "timestamp": now, "temperature_c": 34.8, "humidity_pct": 60.0, "wind_speed_kmh": 9.1, "wind_direction_deg": 225.0, "pbl_height_m": 1250.0, "rainfall_mm": 0.0, "inversion_detected": False},
    ]

    print("Inserting weather measurements...")
    result = client.table("weather_measurements").insert(weather_entries).execute()
    print(f"  ✓ {len(result.data)} weather records inserted")
    return result.data


def main():
    print("=" * 60)
    print("  Seeding Supabase Database with Delhi-NCR Data")
    print("=" * 60)
    print()

    client = get_supabase_client()

    try:
        seed_regions(client)
        seed_stations(client)
        seed_sample_pollution(client)
        seed_sample_weather(client)

        print()
        print("=" * 60)
        print("  ✅ Database seeding complete!")
        print("=" * 60)

        # Verify
        print("\nVerification:")
        regions = client.table("regions").select("*").execute()
        stations = client.table("stations").select("*").execute()
        pollution = client.table("pollution_measurements").select("*", count="exact").execute()
        weather = client.table("weather_measurements").select("*", count="exact").execute()

        print(f"  Regions:              {len(regions.data)}")
        print(f"  Stations:             {len(stations.data)}")
        print(f"  Pollution Records:    {len(pollution.data)}")
        print(f"  Weather Records:      {len(weather.data)}")

    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        raise


if __name__ == "__main__":
    main()
