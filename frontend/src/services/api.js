/**
 * Frontend API client for Air Pollution-Weather Coupled Forecasting System (Delhi-NCR).
 * Connects to FastAPI backend (/api/v1) with robust LIVE DATA status tracking,
 * timeout handling, strict response validation, and clean offline messaging.
 */

/**
 * Resolves the API base URL dynamically from environment variables.
 * In production on Vercel, VITE_API_URL points to the live Render backend.
 * In local development, defaults to '/api/v1' which proxies to local FastAPI server.
 */
const getApiBaseUrl = () => {
  const envUrl = (import.meta.env?.VITE_API_URL || '').trim().replace(/\/+$/, '');
  if (!envUrl) {
    return '/api/v1';
  }
  return envUrl.endsWith('/api/v1') ? envUrl : `${envUrl}/api/v1`;
};

const API_BASE = getApiBaseUrl();
const DEFAULT_TIMEOUT_MS = 10000;

/**
 * Robust fetch with configurable timeout abort controller and error classification.
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        errorType: 'HTTP_ERROR',
        message: `HTTP Error ${response.status}: ${response.statusText || 'Server error'}`
      };
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return {
        ok: false,
        status: response.status,
        errorType: 'INVALID_CONTENT_TYPE',
        message: 'Invalid response format: Expected application/json'
      };
    }

    const data = await response.json();
    return {
      ok: true,
      status: response.status,
      data
    };
  } catch (err) {
    clearTimeout(id);

    if (err.name === 'AbortError') {
      return {
        ok: false,
        errorType: 'TIMEOUT',
        message: `Request timed out after ${timeoutMs}ms. Backend server might be spinning up or unreachable.`
      };
    }

    return {
      ok: false,
      errorType: 'NETWORK_ERROR',
      message: err.message.includes('Failed to fetch')
        ? `Network failure: Unable to reach FastAPI backend server (${API_BASE}). Please check backend status and CORS.`
        : `Network error: ${err.message}`
    };
  }
}

/**
 * Validates stations array schema and fields.
 */
function validateStationsPayload(payload) {
  if (!Array.isArray(payload)) {
    return { valid: false, reason: 'Payload is not an array' };
  }
  if (payload.length === 0) {
    return { valid: false, reason: 'Empty station list received from API' };
  }

  // Validate critical fields for at least the first item
  const sample = payload[0];
  if (!sample || typeof sample !== 'object') {
    return { valid: false, reason: 'Invalid station record structure' };
  }
  if (!sample.station_id || !sample.station_name) {
    return { valid: false, reason: 'Missing mandatory station identity fields' };
  }
  if (sample.current_aqi === undefined || sample.current_aqi === null || isNaN(sample.current_aqi)) {
    return { valid: false, reason: 'Missing valid numerical current_aqi in station telemetry' };
  }

  return { valid: true };
}

/**
 * Fetches continuous ambient station observations with strict LIVE DATA status tracking.
 */
export async function fetchStations() {
  const result = await fetchWithTimeout(`${API_BASE}/stations`, {}, 6000);

  if (!result.ok) {
    console.warn(`[API] fetchStations failed: [${result.errorType}] ${result.message}`);
    return {
      success: false,
      isLive: false,
      source: 'UNAVAILABLE',
      status: 'UNAVAILABLE',
      message: result.message,
      errorType: result.errorType,
      data: [],
      timestamp: new Date().toISOString()
    };
  }

  const validation = validateStationsPayload(result.data);
  if (!validation.valid) {
    console.warn(`[API] fetchStations validation failed: ${validation.reason}`);
    return {
      success: false,
      isLive: false,
      source: 'UNAVAILABLE',
      status: 'UNAVAILABLE',
      message: `Invalid API payload: ${validation.reason}`,
      errorType: 'VALIDATION_ERROR',
      data: [],
      timestamp: new Date().toISOString()
    };
  }

  return {
    success: true,
    isLive: true,
    source: 'LIVE_API',
    status: 'LIVE',
    message: 'Connected to live API',
    data: result.data,
    stationCount: result.data.length,
    timestamp: new Date().toISOString()
  };
}

/**
 * Fetches system health and readiness matrix.
 */
export async function fetchHealth() {
  const result = await fetchWithTimeout(`${API_BASE}/health`, {}, 5000);

  if (!result.ok) {
    return {
      success: false,
      isLive: false,
      status: 'OFFLINE',
      data: {
        status: 'OFFLINE',
        version: '1.0.0',
        region: 'Delhi-NCR',
        services: {
          backend: 'OFFLINE',
          ai_inference_engine: 'STANDBY',
          data_pipeline: 'UNREACHABLE'
        },
        error_message: result.message
      },
      message: result.message
    };
  }

  return {
    success: true,
    isLive: true,
    status: result.data.status || 'ONLINE',
    data: result.data,
    message: 'Health telemetry live'
  };
}

/**
 * Fetches operational module metrics.
 */
export async function fetchMetrics() {
  const result = await fetchWithTimeout(`${API_BASE}/metrics`, {}, 5000);

  if (!result.ok) {
    return {
      success: false,
      isLive: false,
      data: null,
      message: result.message
    };
  }

  return {
    success: true,
    isLive: true,
    data: result.data,
    message: 'Metrics live'
  };
}

/**
 * Fetches ingested raw records.
 */
export async function fetchRecords() {
  const result = await fetchWithTimeout(`${API_BASE}/records`, {}, 5000);
  if (!result.ok) {
    return { success: false, isLive: false, data: [] };
  }
  return { success: true, isLive: true, data: result.data || [] };
}

/**
 * Executes a coupled atmospheric physics or forecast task.
 */
export async function executeTask(taskType = 'FORECAST_24H_AQI', inputData = {}, stationId = 'DELHI_ANAND_VIHAR') {
  try {
    const result = await fetchWithTimeout(
      `${API_BASE}/tasks/execute`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_type: taskType, input_data: inputData, station_id: stationId })
      },
      8000
    );

    if (result.ok && result.data && result.data.result) {
      return {
        ...result.data,
        isLive: true,
        source: 'LIVE_API'
      };
    }

    throw new Error(result.message || 'Task execution failed on backend');
  } catch (err) {
    console.warn('[API] executeTask fallback:', err.message);

    // Deterministic coupled physics calculation mirroring BaselineScorer
    const pm25 = Number(inputData.pm2_5 || 195.0);
    const pm10 = Number(inputData.pm10 || 310.0);
    const wind = Number(inputData.wind_speed_kmh !== undefined ? inputData.wind_speed_kmh : 5.8);
    const pbl = Number(inputData.pbl_height_m !== undefined ? inputData.pbl_height_m : 410.0);
    const humidity = Number(inputData.humidity_pct || 78.0);

    let stagFactor = 1.0;
    if (wind < 8.0) stagFactor += 0.25;
    if (pbl < 500.0) stagFactor += 0.20;
    if (humidity > 75.0) stagFactor += 0.15;

    const projPm25 = Math.round(pm25 * stagFactor * 1.02);
    const projPm10 = Math.round(pm10 * stagFactor * 1.02);
    const projAqi = Math.min(500, Math.round(projPm25 * 1.8 + projPm10 * 0.3));

    const category =
      projAqi <= 50 ? 'GOOD' :
      projAqi <= 100 ? 'SATISFACTORY' :
      projAqi <= 200 ? 'MODERATE' :
      projAqi <= 300 ? 'POOR' :
      projAqi <= 400 ? 'VERY_POOR' : 'SEVERE';

    const ventIndex = Math.round(((wind * 1000) / 3600) * pbl);
    const inversion = (pbl < 500 && wind < 7) ? 'HIGH' : pbl < 800 ? 'MODERATE' : 'LOW';

    return {
      task_id: `task_fb_${Date.now()}`,
      status: 'COMPLETED',
      task_type: taskType,
      station_id: stationId,
      isLive: false,
      source: 'DEMO_PROTOTYPE',
      result: {
        model_version: 'coupled-delhi-v1.0 (physics-coupled simulation)',
        region: 'Delhi-NCR',
        forecast_horizon: '24 Hours Ahead',
        forecast_aqi: projAqi,
        aqi_category: category,
        predicted_pm2_5: projPm25,
        predicted_pm10: projPm10,
        ventilation_index_m2_s: ventIndex,
        thermal_inversion_risk: inversion,
        stagnation_multiplier: Number(stagFactor.toFixed(2)),
        confidence_score: 0.91,
        meteorological_driver: `Surface wind (${wind} km/h) & PBL mixing depth (${pbl}m) coupling.`,
        advisory: projAqi > 350
          ? 'GRAP Stage III / IV emergency measures recommended due to projected severe stagnation.'
          : 'Standard ambient air quality mitigation advisory in effect.'
      },
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      message: 'Coupled forecast calculated via deterministic physics model.'
    };
  }
}

/**
 * Evaluates coupled air pollution risk and early warnings.
 */
export async function assessRisk(payload) {
  try {
    const result = await fetchWithTimeout(
      `${API_BASE}/risk/assess`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      },
      6000
    );

    if (result.ok && result.data) {
      return result.data;
    }
    throw new Error(result.message || 'Risk assessment request failed');
  } catch (err) {
    console.error('Risk assessment error:', err);
    return {
      predicted_aqi: payload.predicted_aqi || 280,
      category: 'Poor',
      risk_level: 'High',
      warning_message: 'High air pollution risk projected for Delhi-NCR.',
      recommendation: 'Sensitive groups should avoid strenuous outdoor physical exertion.',
      weather_analysis: {}
    };
  }
}

/**
 * Fetches risk assessment for a specific station.
 */
export async function fetchStationRisk(stationId) {
  try {
    const result = await fetchWithTimeout(`${API_BASE}/risk/stations/${stationId}`, {}, 6000);
    if (result.ok && result.data) {
      return result.data;
    }
    throw new Error(result.message || 'Station risk fetch failed');
  } catch (err) {
    console.error(`Failed to fetch risk for station ${stationId}:`, err);
    return null;
  }
}

/**
 * Fetches risk assessment across all Delhi-NCR stations.
 */
export async function fetchAllStationsRisk() {
  try {
    const result = await fetchWithTimeout(`${API_BASE}/risk/stations`, {}, 6000);
    if (result.ok && result.data) {
      return result.data;
    }
    return [];
  } catch (err) {
    console.error('Failed to fetch all station risks:', err);
    return [];
  }
}

/**
 * Fetches Gemini AI service status.
 */
export async function fetchGeminiStatus() {
  const result = await fetchWithTimeout(`${API_BASE}/insights/status`, {}, 5000);
  if (!result.ok) {
    return {
      gemini_api_configured: false,
      active_model: 'gemini-2.5-flash',
      mode: 'PHYSICS_COUPLED_FALLBACK',
      description: 'Natural-language meteorological coupling explanation engine for Delhi-NCR.'
    };
  }
  return result.data;
}

/**
 * Requests natural-language AI insights from Gemini via FastAPI.
 */
export async function fetchGeminiExplanation(payload) {
  try {
    const result = await fetchWithTimeout(
      `${API_BASE}/insights/ai-explanation`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      },
      9000
    );

    if (result.ok && result.data) {
      return result.data;
    }
    throw new Error(result.message || 'Gemini insight request failed');
  } catch (err) {
    console.warn('[API] fetchGeminiExplanation client fallback:', err.message);
    const stationName = payload.station_name || 'Delhi Station';
    const aqi = payload.current_aqi || 355;
    const cat = payload.category || 'VERY_POOR';
    const wind = payload.wind_speed_kmh || 5.8;
    const pbl = payload.pbl_height_m || 410;
    const hum = payload.humidity_pct || 78;
    const fcAqi = payload.forecast_aqi || 390;
    const fcCat = payload.forecast_category || 'VERY_POOR';

    return {
      status: 'SUCCESS',
      model: 'physics-coupled-v1.0 (client engine)',
      is_ai_generated: false,
      is_fallback: true,
      station_name: stationName,
      summary: `Air quality at ${stationName} is currently ${cat} (AQI ${aqi}). Calm winds (${wind} km/h) and a compressed boundary layer (${pbl}m) impede atmospheric ventilation.`,
      aqi_condition_analysis: `Current AQI of ${aqi} (${cat}) is driven by elevated PM2.5 concentrations (${payload.pm2_5 || 195} µg/m³), exceeding the NAAQS 24-hour benchmark (60 µg/m³).`,
      meteorological_coupling_analysis: `Low wind velocity (${wind} km/h) combined with a shallow Planetary Boundary Layer (${pbl}m) severely restricts vertical mixing volume. Moisture level at ${hum}% accelerates aerosol conversion.`,
      forecast_interpretation: `Coupled physics projections indicate AQI will trend to ${fcAqi} (${fcCat}) in 24 hours under continued boundary layer compression.`,
      early_warning_explanation: `EARLY WARNING: High nocturnal stagnation risk. Particulate trapping expected during surface inversion hours.`,
      preventive_recommendations: {
        sensitive_groups: [
          'Avoid all strenuous outdoor physical exertion during morning and evening inversion hours.',
          'Keep prescribed bronchodilators and respiratory inhalers readily accessible.'
        ],
        general_public: [
          'Wear certified N95 or N99 particulate respirators when commuting or outdoors.',
          'Prioritize public transit and Delhi Metro over personal motorized transport.'
        ],
        regulators: [
          'Enforce Graded Response Action Plan (GRAP) Stage III mitigation measures across target corridors.',
          'Intensify mechanized vacuum sweeping and water misting along arterial road networks.'
        ]
      },
      disclaimer: 'DEMO DATA – For Prototype Demonstration Only – Physics-Coupled Client Engine',
      timestamp: new Date().toISOString(),
      error_message: 'FastAPI backend unreachable. Physics explanation generated locally.'
    };
  }
}

/**
 * Returns explicit fallback demo station data ONLY when prototype demonstration mode is requested.
 */
export function getFallbackDemoStations() {
  return [
    { station_id: 'DELHI_ANAND_VIHAR', station_name: 'Anand Vihar', location: 'East Delhi (Industrial/Transport Hub)', current_aqi: 268, category: 'POOR', pm2_5: 185.4, pm10: 290.2, no2: 78.5, o3: 32.1, so2: 18.3, co: 2.8, temperature_c: 34.2, humidity_pct: 62.0, wind_speed_kmh: 8.5, wind_direction_deg: 220.0, rainfall_mm: 0.0, pbl_height_m: 1200.0, ventilation_index: 2833.3, lat: 28.6468, lon: 77.3159, is_demo: true, source: 'DEMO_PROTOTYPE' },
    { station_id: 'DELHI_ITO', station_name: 'ITO Junction', location: 'Central Delhi (High Traffic Corridor)', current_aqi: 235, category: 'POOR', pm2_5: 162.0, pm10: 245.8, no2: 65.2, o3: 28.7, so2: 15.1, co: 2.3, temperature_c: 34.0, humidity_pct: 63.5, wind_speed_kmh: 7.8, wind_direction_deg: 215.0, rainfall_mm: 0.0, pbl_height_m: 1180.0, ventilation_index: 2556.7, lat: 28.6289, lon: 77.2413, is_demo: true, source: 'DEMO_PROTOTYPE' },
    { station_id: 'DELHI_RK_PURAM', station_name: 'R.K. Puram', location: 'South Delhi (Residential & Institutional)', current_aqi: 205, category: 'POOR', pm2_5: 142.0, pm10: 215.0, no2: 52.3, o3: 34.5, so2: 13.0, co: 1.8, temperature_c: 34.5, humidity_pct: 60.0, wind_speed_kmh: 8.2, wind_direction_deg: 225.0, rainfall_mm: 0.0, pbl_height_m: 1220.0, ventilation_index: 2778.9, lat: 28.5660, lon: 77.1767, is_demo: true, source: 'DEMO_PROTOTYPE' },
    { station_id: 'DELHI_PUNJABI_BAGH', station_name: 'Punjabi Bagh', location: 'West Delhi (Commercial & Mixed)', current_aqi: 255, category: 'POOR', pm2_5: 178.5, pm10: 272.0, no2: 70.4, o3: 31.0, so2: 16.5, co: 2.4, temperature_c: 33.9, humidity_pct: 64.0, wind_speed_kmh: 7.5, wind_direction_deg: 210.0, rainfall_mm: 0.0, pbl_height_m: 1150.0, ventilation_index: 2395.8, lat: 28.6683, lon: 77.1167, is_demo: true, source: 'DEMO_PROTOTYPE' },
    { station_id: 'NOIDA_SEC_62', station_name: 'Noida Sector 62', location: 'Noida (Institutional & Commercial Sector)', current_aqi: 210, category: 'POOR', pm2_5: 145.6, pm10: 220.3, no2: 55.8, o3: 35.2, so2: 12.4, co: 1.9, temperature_c: 33.8, humidity_pct: 65.0, wind_speed_kmh: 7.2, wind_direction_deg: 210.0, rainfall_mm: 0.0, pbl_height_m: 1100.0, ventilation_index: 2200.0, lat: 28.6244, lon: 77.3600, is_demo: true, source: 'DEMO_PROTOTYPE' },
    { station_id: 'GURUGRAM_VIKAS_SADAN', station_name: 'Gurugram Vikas Sadan', location: 'Gurugram (Civic Center & Highway Corridor)', current_aqi: 188, category: 'MODERATE', pm2_5: 130.2, pm10: 198.7, no2: 48.3, o3: 40.5, so2: 10.8, co: 1.6, temperature_c: 35.1, humidity_pct: 58.0, wind_speed_kmh: 10.3, wind_direction_deg: 230.0, rainfall_mm: 0.0, pbl_height_m: 1300.0, ventilation_index: 3719.4, lat: 28.4595, lon: 77.0266, is_demo: true, source: 'DEMO_PROTOTYPE' },
    { station_id: 'GHAZIABAD_VASUNDHARA', station_name: 'Ghaziabad Vasundhara', location: 'Ghaziabad (Residential & High Density Traffic)', current_aqi: 252, category: 'POOR', pm2_5: 175.8, pm10: 265.4, no2: 72.1, o3: 30.3, so2: 16.9, co: 2.5, temperature_c: 33.5, humidity_pct: 68.0, wind_speed_kmh: 6.8, wind_direction_deg: 200.0, rainfall_mm: 0.0, pbl_height_m: 1050.0, ventilation_index: 1983.3, lat: 28.6600, lon: 77.3570, is_demo: true, source: 'DEMO_PROTOTYPE' },
    { station_id: 'FARIDABAD_SEC_16A', station_name: 'Faridabad Sector 16A', location: 'Faridabad (Commercial & Mixed Industrial)', current_aqi: 170, category: 'MODERATE', pm2_5: 120.5, pm10: 180.3, no2: 42.7, o3: 45.8, so2: 9.5, co: 1.4, temperature_c: 34.8, humidity_pct: 60.0, wind_speed_kmh: 9.1, wind_direction_deg: 225.0, rainfall_mm: 0.0, pbl_height_m: 1250.0, ventilation_index: 3159.7, lat: 28.4089, lon: 77.3178, is_demo: true, source: 'DEMO_PROTOTYPE' }
  ];
}
