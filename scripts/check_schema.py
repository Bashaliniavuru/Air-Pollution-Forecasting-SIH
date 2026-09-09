"""Check actual station IDs in the database."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.db.supabase_client import get_supabase_client

client = get_supabase_client()
stations = client.table("stations").select("station_id, station_name, region_id").execute()
print("Existing stations:")
for s in stations.data:
    print(f"  {s['station_id']} | {s['station_name']} | region: {s['region_id']}")

print(f"\nTotal: {len(stations.data)}")
