"""Database package for Air Pollution-Weather Coupled Forecasting System."""
from backend.db.supabase_client import get_supabase_client

__all__ = ["get_supabase_client"]
