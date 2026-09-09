"""
Comprehensive Backend Diagnostics & Health Check Suite.
Tests syntax, OpenAPI schemas, and every REST route in the FastAPI application.
"""

import sys
import os

# Add root directory to sys.path
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from fastapi.testclient import TestClient
from backend.main import app


def run_diagnostics():
    print("=" * 80)
    print("RUNNING COMPREHENSIVE BACKEND HEALTH & ROUTE DIAGNOSTICS")
    print("=" * 80)

    # 1. OpenAPI generation
    print("\n--- 1. OpenAPI Specification Generation ---")
    openapi = app.openapi()
    paths = openapi.get("paths", {})
    print(f"OpenAPI generated successfully with {len(paths)} unique paths:")
    for path, methods in paths.items():
        for m in methods:
            print(f"  {m.upper():<6} {path}")

    # 2. Test every endpoint
    print("\n--- 2. End-to-End Endpoint Requests ---")
    client = TestClient(app)

    test_cases = [
        ("GET", "/", 200, None),
        ("GET", "/api/v1/health", 200, None),
        ("GET", "/api/v1/metrics", 200, None),
        ("GET", "/api/v1/stations", 200, None),
        ("GET", "/api/v1/records", 200, None),
        (
            "POST",
            "/api/v1/tasks/execute",
            200,
            {
                "task_type": "FORECAST_24H_AQI",
                "station_id": "DELHI_ANAND_VIHAR",
                "input_data": {"pm2_5": 210, "wind_speed_kmh": 4.5}
            }
        ),
        ("GET", "/api/v1/tasks/history", 200, None),
        (
            "POST",
            "/api/v1/risk/assess",
            200,
            {
                "predicted_aqi": 350,
                "wind_speed_kmh": 4.2,
                "humidity_pct": 85.0,
                "rainfall_mm": 0.0,
                "pbl_height_m": 360.0
            }
        ),
        ("GET", "/api/v1/risk/stations", 200, None),
        ("GET", "/api/v1/risk/stations/DELHI_ANAND_VIHAR", 200, None),
        ("GET", "/api/v1/risk/stations/NON_EXISTENT_STATION", 404, None),
    ]

    passed = 0
    for method, url, expected_status, payload in test_cases:
        if method == "GET":
            resp = client.get(url)
        else:
            resp = client.post(url, json=payload)

        if resp.status_code == expected_status:
            print(f"  [PASS] {method:<4} {url:<45} -> Status {resp.status_code}")
            passed += 1
        else:
            print(f"  [FAIL] {method:<4} {url:<45} -> Expected {expected_status}, got {resp.status_code}: {resp.text}")

    print("\n" + "=" * 80)
    if passed == len(test_cases):
        print(f"DIAGNOSTICS COMPLETE: {passed}/{len(test_cases)} tests passed! ZERO ERRORS FOUND.")
    else:
        print(f"DIAGNOSTICS FAILED: {passed}/{len(test_cases)} tests passed.")
        sys.exit(1)
    print("=" * 80)


if __name__ == "__main__":
    run_diagnostics()
