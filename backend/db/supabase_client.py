"""
Supabase Database Client for Air Pollution-Weather Coupled Forecasting System.
Provides a singleton Supabase client connected to the project's PostgreSQL instance.
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from .env file
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", "")

_client: Client = None


def get_supabase_client() -> Client:
    """Returns or creates the shared Supabase client singleton."""
    global _client
    if _client is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError(
                "SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env file. "
                "Please configure your Supabase credentials."
            )
        _client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _client


if __name__ == "__main__":
    print("Testing Supabase connection...")
    print(f"URL: {SUPABASE_URL}")
    print(f"Key: {SUPABASE_KEY[:20]}..." if SUPABASE_KEY else "Key: NOT SET")

    try:
        client = get_supabase_client()
        # Test by querying regions table
        result = client.table("regions").select("*").execute()
        print(f"Connection successful! Regions found: {len(result.data)}")
        for r in result.data:
            print(f"  - {r['city_name']} ({r['region_id']})")
    except Exception as e:
        print(f"Connection test result: {e}")
