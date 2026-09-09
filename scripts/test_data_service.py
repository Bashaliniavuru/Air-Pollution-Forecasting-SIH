import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.db.supabase_client import get_supabase_client
from utils.constants import AQICategory

def test_fetch():
    client = get_supabase_client()
    stations = client.table("stations").select("*").eq("is_active", True).execute().data
    pol_res = client.table("pollution_measurements").select("*").order("timestamp", desc=True).execute().data
    wth_res = client.table("weather_measurements").select("*").order("timestamp", desc=True).execute().data

    latest_pol = {}
    for p in pol_res:
        sid = p["station_id"]
        if sid not in latest_pol:
            latest_pol[sid] = p

    latest_wth = {}
    for w in wth_res:
        sid = w["station_id"]
        if sid not in latest_wth:
            latest_wth[sid] = w

    print("Stations loaded from Supabase:")
    for s in stations:
        sid = s["station_id"]
        p = latest_pol.get(sid, {})
        w = latest_wth.get(sid, {})
        print(f"  {sid} ({s.get('city')}): AQI={p.get('aqi')}, Temp={w.get('temperature_c')}°C, Humidity={w.get('humidity_pct')}%, Wind={w.get('wind_speed_kmh')}km/h, PBL={w.get('pbl_height_m')}m")

if __name__ == "__main__":
    test_fetch()
