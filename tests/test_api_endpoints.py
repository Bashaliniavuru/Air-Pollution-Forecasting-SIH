"""
Verification test suite for all FastAPI endpoints in the backend.
"""

import sys
import os
from fastapi.testclient import TestClient

# Ensure root workspace directory is in python search path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ONLINE"
    assert data["focus_region"] == "Delhi-NCR"
    print("PASS: Root endpoint '/' returned 200 OK.")


def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ONLINE"
    assert data["region"] == "Delhi-NCR"
    print("PASS: Health endpoint '/api/v1/health' returned 200 OK.")


def test_stations_endpoint():
    response = client.get("/api/v1/stations")
    assert response.status_code == 200
    stations = response.json()
    assert len(stations) >= 4
    for stn in stations:
        assert "station_id" in stn
        assert "current_aqi" in stn
        assert "pm2_5" in stn
        assert "temperature_c" in stn
    print(f"PASS: Stations endpoint returned {len(stations)} active stations.")


def test_metrics_endpoint():
    response = client.get("/api/v1/metrics")
    assert response.status_code == 200
    metrics = response.json()
    assert "modules" in metrics
    assert len(metrics["modules"]) == 6
    print("PASS: Metrics endpoint returned 6 operational pillars.")


def test_records_endpoint():
    response = client.get("/api/v1/records")
    assert response.status_code == 200
    records = response.json()
    assert len(records) > 0
    print(f"PASS: Records endpoint returned {len(records)} ingested telemetry feeds.")


def test_task_execute_and_history():
    payload = {
        "task_type": "FORECAST_24H_AQI",
        "station_id": "DELHI_ANAND_VIHAR",
        "input_data": {
            "wind_speed_kmh": 4.2,
            "pbl_height_m": 350,
            "humidity_pct": 85.0,
            "temp_c": 17.5
        }
    }
    response = client.post("/api/v1/tasks/execute", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "COMPLETED"
    assert data["result"] is not None
    print("PASS: Task execution endpoint executed successfully.")

    # Check history
    hist_response = client.get("/api/v1/tasks/history?limit=5")
    assert hist_response.status_code == 200
    history = hist_response.json()
    assert len(history) > 0
    print(f"PASS: Task history returned {len(history)} entries.")


if __name__ == "__main__":
    print("=" * 60)
    print("Running API Endpoints Diagnostic Test Suite...")
    print("=" * 60)
    test_root_endpoint()
    test_health_endpoint()
    test_stations_endpoint()
    test_metrics_endpoint()
    test_records_endpoint()
    test_task_execute_and_history()
    print("=" * 60)
    print("ALL API ENDPOINTS PASSED SUCCESSFULLY!")
    print("=" * 60)
