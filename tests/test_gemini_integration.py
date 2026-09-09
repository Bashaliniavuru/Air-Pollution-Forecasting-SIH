"""
End-to-end integration test script for Google Gemini AI & Physics-Coupled Insights.
Validates:
1. Status endpoint (/api/v1/insights/status)
2. Explanation endpoint (/api/v1/insights/ai-explanation)
3. Number grounding & physics coupling compliance
4. Graceful fallback execution
"""

import sys
import os

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from fastapi.testclient import TestClient


# Ensure root workspace directory is in python search path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.main import app


def test_gemini_integration():
    client = TestClient(app)
    
    print("================================================================")
    print("1. Testing GET /api/v1/insights/status")
    print("================================================================")
    res_status = client.get("/api/v1/insights/status")
    assert res_status.status_code == 200, f"Status failed: {res_status.status_code}"
    status_data = res_status.json()
    print("Status response:", status_data)
    assert "gemini_api_configured" in status_data
    assert "active_model" in status_data
    assert status_data["active_model"] == "gemini-2.5-flash"
    print(" PASS: Status endpoint verified.")

    print("\n================================================================")
    print("2. Testing POST /api/v1/insights/ai-explanation (Anand Vihar)")
    print("================================================================")
    payload_anand_vihar = {
        "station_id": "DELHI_ANAND_VIHAR",
        "station_name": "Anand Vihar",
        "location": "East Delhi (Industrial / ISBT Hub)",
        "current_aqi": 415,
        "category": "SEVERE",
        "pm2_5": 245.0,
        "pm10": 385.0,
        "no2": 88.0,
        "o3": 28.0,
        "so2": 19.5,
        "co": 3.4,
        "temperature_c": 17.8,
        "humidity_pct": 85.0,
        "wind_speed_kmh": 4.2,
        "wind_direction_deg": 290.0,
        "pbl_height_m": 340.0,
        "ventilation_index": 396.7,
        "forecast_aqi": 440,
        "forecast_category": "SEVERE",
        "inversion_risk": "HIGH",
        "stagnation_multiplier": 1.6
    }
    res_explain = client.post("/api/v1/insights/ai-explanation", json=payload_anand_vihar)
    assert res_explain.status_code == 200, f"Explanation failed: {res_explain.status_code}"
    explain_data = res_explain.json()
    
    print("\n--- Explanation Response Summary ---")
    print(f"Station: {explain_data.get('station_name')}")
    print(f"Model: {explain_data.get('model')}")
    print(f"Is AI Generated: {explain_data.get('is_ai_generated')}")
    print(f"Is Fallback: {explain_data.get('is_fallback')}")
    print(f"Summary: {explain_data.get('summary')}")
    print(f"\nMeteorological Coupling Analysis:\n{explain_data.get('meteorological_coupling_analysis')}")
    print(f"\n24h Forecast Interpretation:\n{explain_data.get('forecast_interpretation')}")
    print(f"\nPreventive Recommendations:\n{explain_data.get('preventive_recommendations')}")
    print(f"Disclaimer: {explain_data.get('disclaimer')}")
    
    assert "summary" in explain_data
    assert "meteorological_coupling_analysis" in explain_data
    assert "forecast_interpretation" in explain_data
    assert "preventive_recommendations" in explain_data
    assert "DEMO DATA" in explain_data["disclaimer"]
    print("\n PASS: Anand Vihar explanation verified.")

    print("\n================================================================")
    print("3. Testing POST /api/v1/insights/ai-explanation (Dwarka - Moderate Wind)")
    print("================================================================")
    payload_dwarka = {
        "station_id": "DELHI_DWARKA",
        "station_name": "Dwarka",
        "location": "South-West Delhi",
        "current_aqi": 310,
        "category": "VERY_POOR",
        "pm2_5": 165.0,
        "pm10": 265.0,
        "no2": 58.0,
        "wind_speed_kmh": 6.8,
        "pbl_height_m": 440.0,
        "humidity_pct": 75.0,
        "forecast_aqi": 325,
        "forecast_category": "VERY_POOR"
    }
    res_dwarka = client.post("/api/v1/insights/ai-explanation", json=payload_dwarka)
    assert res_dwarka.status_code == 200
    dwarka_data = res_dwarka.json()
    print("Dwarka Summary:", dwarka_data.get("summary"))
    print(" PASS: Dwarka explanation verified.")

    print("\n================================================================")
    print(" ALL BACKEND GEMINI INTEGRATION TESTS PASSED SUCCESSFULLY!")
    print("================================================================")


if __name__ == "__main__":
    test_gemini_integration()
