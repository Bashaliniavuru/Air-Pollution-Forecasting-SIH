import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.db.supabase_client import get_supabase_client

client = get_supabase_client()
for table in ['regions', 'stations', 'pollution_measurements', 'weather_measurements', 'ml_forecasts']:
    try:
        res = client.table(table).select('*').limit(1).execute()
        print(f"Table '{table}' exists! Sample data / columns:")
        if res.data:
            for k, v in res.data[0].items():
                print(f"   {k}: {type(v).__name__} = {v}")
        else:
            print("   (Empty table)")
    except Exception as e:
        print(f"Table '{table}' error: {e}")
