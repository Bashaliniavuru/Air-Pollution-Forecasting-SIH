"""
Demo Data Generator for Delhi-NCR Coupled Air Pollution & Weather Forecasting.
Generates 7 days of internally consistent hourly observations for:
- Delhi
- Noida
- Gurugram
- Ghaziabad
- Faridabad

Metadata:
data_type = "DEMO DATA"
disclaimer = "For Prototype Demonstration Only – Live API not connected."
"""

import os
import math
import random
import json
import csv
from datetime import datetime, timedelta, timezone

# Target Locations in Delhi-NCR
LOCATIONS = [
    {
        "location": "Delhi",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "base_pm25": 175.0,
        "base_pm10": 290.0,
        "base_no2": 65.0,
        "base_so2": 16.0,
        "base_co": 2.4,
    },
    {
        "location": "Noida",
        "latitude": 28.5355,
        "longitude": 77.3910,
        "base_pm25": 160.0,
        "base_pm10": 270.0,
        "base_no2": 58.0,
        "base_so2": 14.0,
        "base_co": 2.1,
    },
    {
        "location": "Gurugram",
        "latitude": 28.4595,
        "longitude": 77.0266,
        "base_pm25": 168.0,
        "base_pm10": 285.0,
        "base_no2": 62.0,
        "base_so2": 15.0,
        "base_co": 2.3,
    },
    {
        "location": "Ghaziabad",
        "latitude": 28.6692,
        "longitude": 77.4538,
        "base_pm25": 195.0,
        "base_pm10": 325.0,
        "base_no2": 72.0,
        "base_so2": 22.0,
        "base_co": 2.7,
    },
    {
        "location": "Faridabad",
        "latitude": 28.4089,
        "longitude": 77.3178,
        "base_pm25": 182.0,
        "base_pm10": 305.0,
        "base_no2": 66.0,
        "base_so2": 20.0,
        "base_co": 2.5,
    }
]

def calculate_cpcb_subindex(conc: float, breakpoints: list) -> float:
    """Calculates AQI subindex based on official CPCB piecewise linear breakpoints."""
    for b_lo, b_hi, i_lo, i_hi in breakpoints:
        if b_lo <= conc <= b_hi:
            return ((i_hi - i_lo) / (b_hi - b_lo)) * (conc - b_lo) + i_lo
    if conc > breakpoints[-1][1]:
        # Extrapolate beyond top breakpoint
        b_lo, b_hi, i_lo, i_hi = breakpoints[-1]
        return min(500.0, ((i_hi - i_lo) / (b_hi - b_lo)) * (conc - b_lo) + i_lo)
    return 0.0

def calculate_aqi(pm25: float, pm10: float, no2: float, so2: float, co: float, o3: float) -> int:
    """Computes Indian National AQI from pollutant sub-indices."""
    pm25_bp = [(0, 30, 0, 50), (31, 60, 51, 100), (61, 90, 101, 200), (91, 120, 201, 300), (121, 250, 301, 400), (250.1, 400, 401, 500)]
    pm10_bp = [(0, 50, 0, 50), (51, 100, 51, 100), (101, 250, 101, 200), (251, 350, 201, 300), (351, 430, 301, 400), (430.1, 600, 401, 500)]
    no2_bp = [(0, 40, 0, 50), (41, 80, 51, 100), (81, 180, 101, 200), (181, 280, 201, 300), (281, 400, 301, 400), (401, 800, 401, 500)]
    so2_bp = [(0, 40, 0, 50), (41, 80, 51, 100), (81, 380, 101, 200), (381, 800, 201, 300), (801, 1600, 301, 400), (1601, 2000, 401, 500)]
    co_bp = [(0, 1.0, 0, 50), (1.1, 2.0, 51, 100), (2.1, 10.0, 101, 200), (10.1, 17.0, 201, 300), (17.1, 34.0, 301, 400), (34.1, 50.0, 401, 500)]
    o3_bp = [(0, 50, 0, 50), (51, 100, 51, 100), (101, 168, 101, 200), (169, 208, 201, 300), (209, 748, 301, 400), (749, 1000, 401, 500)]

    sub_indices = [
        calculate_cpcb_subindex(pm25, pm25_bp),
        calculate_cpcb_subindex(pm10, pm10_bp),
        calculate_cpcb_subindex(no2, no2_bp),
        calculate_cpcb_subindex(so2, so2_bp),
        calculate_cpcb_subindex(co, co_bp),
        calculate_cpcb_subindex(o3, o3_bp)
    ]
    return int(round(max(sub_indices)))


def generate_dataset(days: int = 7, end_time: datetime = None):
    random.seed(42)
    if end_time is None:
        end_time = datetime(2026, 9, 8, 23, 0, 0, tzinfo=timezone.utc)
    
    total_hours = days * 24
    start_time = end_time - timedelta(hours=total_hours - 1)
    
    records = []
    latest_by_location = {}

    for loc in LOCATIONS:
        name = loc["location"]
        lat = loc["latitude"]
        lon = loc["longitude"]

        for h in range(total_hours):
            current_dt = start_time + timedelta(hours=h)
            hour_of_day = current_dt.hour
            day_of_sim = h // 24

            # Diurnal atmospheric curves
            # Temperature: minimum ~05:00 (19-21C), maximum ~14:00 (31-34C)
            temp_diurnal = math.sin((hour_of_day - 8) * math.pi / 12)
            temperature = round(26.5 + 6.0 * temp_diurnal + random.uniform(-0.8, 0.8), 1)

            # Humidity: inverse to temperature, high at dawn (75-88%), low in afternoon (40-52%)
            humidity = round(max(35.0, min(95.0, 64.0 - 20.0 * temp_diurnal + random.uniform(-2.5, 2.5))), 1)

            # Wind speed: calmer at night (3-6 km/h), stronger in afternoon (10-16 km/h)
            wind_speed = round(max(1.5, 7.5 + 4.5 * temp_diurnal + random.uniform(-1.0, 1.0)), 1)
            
            # Wind direction: North-Westerly predominant (275° - 315°)
            wind_direction = round((295.0 + 15.0 * math.cos(hour_of_day * math.pi / 12) + random.uniform(-10.0, 10.0)) % 360, 1)

            # Atmospheric pressure: ~1010 hPa with subtle semi-diurnal barometric tide
            atm_pressure = round(1010.5 + 1.2 * math.cos(2 * math.pi * hour_of_day / 12) + random.uniform(-0.3, 0.3), 1)

            # Rainfall: dry period with light passing drizzle on Day 3 evening
            rainfall = 0.0
            if day_of_sim == 3 and 16 <= hour_of_day <= 19:
                rainfall = round(random.uniform(1.2, 3.8), 1)
            elif day_of_sim == 5 and hour_of_day == 21:
                rainfall = round(random.uniform(0.2, 0.8), 1)

            # Stagnation & Scavenging effects on pollutants
            # Stagnation is high when wind is calm (<6 km/h) and humidity is high (>75%)
            stagnation = 1.0
            if wind_speed < 6.0:
                stagnation += 0.30
            if humidity > 75.0:
                stagnation += 0.15
            if rainfall > 0.0:
                # Rain wash / wet deposition scavenging
                stagnation *= max(0.4, 1.0 - (rainfall * 0.18))

            # Traffic rush hour multipliers (08:00-10:00 and 18:00-21:00)
            traffic = 1.0
            if 8 <= hour_of_day <= 10:
                traffic = 1.35
            elif 18 <= hour_of_day <= 21:
                traffic = 1.45
            elif 1 <= hour_of_day <= 4:
                traffic = 0.70

            # Pollutants calculation
            noise = random.uniform(0.92, 1.08)
            pm25 = round(loc["base_pm25"] * stagnation * (1.0 + 0.15 * math.cos((hour_of_day - 4) * math.pi / 12)) * noise, 1)
            pm10 = round(loc["base_pm10"] * stagnation * (1.0 + 0.18 * math.cos((hour_of_day - 4) * math.pi / 12)) * noise, 1)
            no2 = round(loc["base_no2"] * traffic * (0.9 + 0.2 * stagnation) * noise, 1)
            so2 = round(loc["base_so2"] * (0.95 + 0.1 * stagnation) * noise, 1)
            co = round(loc["base_co"] * traffic * (0.9 + 0.15 * stagnation) * noise, 2)
            
            # O3 (Ozone) peaks in bright afternoon sunlight
            o3_solar = max(0.0, math.sin((hour_of_day - 7) * math.pi / 11))
            o3 = round(max(8.0, 18.0 + 75.0 * o3_solar * (1.0 - (humidity / 120.0)) + random.uniform(-2.0, 2.0)), 1)

            # Compute synchronized AQI
            aqi = calculate_aqi(pm25, pm10, no2, so2, co, o3)

            row = {
                "timestamp": current_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "location": name,
                "latitude": lat,
                "longitude": lon,
                "AQI": aqi,
                "PM2.5": pm25,
                "PM10": pm10,
                "NO2": no2,
                "SO2": so2,
                "CO": co,
                "O3": o3,
                "temperature": temperature,
                "humidity": humidity,
                "wind_speed": wind_speed,
                "wind_direction": wind_direction,
                "atmospheric_pressure": atm_pressure,
                "rainfall": rainfall
            }
            records.append(row)
            latest_by_location[name] = row

    return records, list(latest_by_location.values())

def main():
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    data_dir = os.path.join(repo_root, "data")
    os.makedirs(data_dir, exist_ok=True)

    csv_path = os.path.join(data_dir, "delhi_ncr_demo_data.csv")
    json_path = os.path.join(data_dir, "delhi_ncr_latest_observations.json")

    print(f"Generating 7-day hourly coupled demo data for 5 Delhi-NCR locations...")
    records, latest = generate_dataset(days=7)

    # 1. Write CSV
    headers = [
        "timestamp", "location", "latitude", "longitude", "AQI",
        "PM2.5", "PM10", "NO2", "SO2", "CO", "O3",
        "temperature", "humidity", "wind_speed", "wind_direction",
        "atmospheric_pressure", "rainfall"
    ]

    with open(csv_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(records)

    print(f"Successfully generated {len(records)} rows in {csv_path}")

    # 2. Write JSON with required metadata
    payload = {
        "metadata": {
            "data_type": "DEMO DATA",
            "disclaimer": "For Prototype Demonstration Only – Live API not connected.",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "region": "Delhi-NCR",
            "time_horizon": "7 Days (Hourly: 168 hours per station)",
            "total_records": len(records),
            "locations": [loc["location"] for loc in LOCATIONS]
        },
        "latest_observations": latest
    }

    with open(json_path, mode="w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    print(f"Successfully generated latest observations snapshot in {json_path}")

if __name__ == "__main__":
    main()
