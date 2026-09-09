import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Clock,
  Zap,
  Activity,
  Wind,
  Layers,
  ShieldAlert,
  Compass,
  AlertTriangle,
  Thermometer,
  Droplets,
  CloudRain,
  Sun,
  CloudSun,
  ArrowRight,
  TrendingUp,
  Brain,
  Sparkles,
  Bot,
  Leaf
} from 'lucide-react';
import DemoBanner from './DemoBanner';
import DelhiHeroSection from './DelhiHeroSection';
import CurrentAirQualitySection from './CurrentAirQualitySection';
import WeatherConditionsCard from './WeatherConditionsCard';
import DelhiAreasPanel from './DelhiAreasPanel';
import PollutantGrid from './PollutantGrid';
import WeatherGrid from './WeatherGrid';
import GeminiInsightsCard from './GeminiInsightsCard';
import AqiForecastChart from './AqiForecastChart';
import ForecastVisualizer from './ForecastVisualizer';
import WeatherExplanation from './WeatherExplanation';
import WeatherPollutionChart from './WeatherPollutionChart';
import DelhiMapHotspots from './DelhiMapHotspots';
import EarlyWarningAdvisory from './EarlyWarningAdvisory';
import { executeTask } from '../services/api';

export default function MainDashboard({
  stations = [],
  apiStatus,
  onRefreshData,
  loadingData,
  selectedStationId,
  onSelectStation,
  onExploreForecast
}) {
  const [internalStationId, setInternalStationId] = useState('DELHI_CENTRAL');
  const [forecastResult, setForecastResult] = useState(null);
  const [loadingForecast, setLoadingForecast] = useState(false);

  // Use props if provided, otherwise internal state
  const activeStationId = selectedStationId || internalStationId;
  const handleSelectStation = (id) => {
    if (onSelectStation) {
      onSelectStation(id);
    } else {
      setInternalStationId(id);
    }
  };

  // What-if simulator state
  const [simWind, setSimWind] = useState(5.8);
  const [simPbl, setSimPbl] = useState(410);

  // Find active station object from Delhi-NCR localities
  const currentStation = stations.find(s => s.station_id === activeStationId) || stations[0] || (apiStatus?.isLive ? null : {
    station_id: 'DELHI_CENTRAL',
    station_name: 'Delhi',
    location: 'Central Delhi (NCT Baseline)',
    current_aqi: 355,
    category: 'VERY_POOR',
    pm2_5: 195.0,
    pm10: 310.0,
    no2: 72.0,
    o3: 38.0,
    so2: 15.0,
    co: 2.4,
    temperature_c: 19.0,
    humidity_pct: 78.0,
    wind_speed_kmh: 5.8,
    wind_direction_deg: 295.0,
    pressure_hpa: 1014.0,
    rainfall_mm: 0.0,
    pbl_height_m: 410.0,
    ventilation_index: 660.8,
    lat: 28.6139,
    lon: 77.2090,
    timestamp: new Date().toISOString()
  });

  // Sync simulator sliders whenever station changes
  useEffect(() => {
    if (currentStation) {
      setSimWind(currentStation.wind_speed_kmh || 5.8);
      setSimPbl(currentStation.pbl_height_m || 410);
      runForecast(currentStation, currentStation.wind_speed_kmh || 5.8, currentStation.pbl_height_m || 410);
    }
  }, [activeStationId]);

  const runForecast = async (stationObj, windVal, pblVal) => {
    if (!stationObj) return;
    setLoadingForecast(true);
    try {
      const payload = {
        station_id: stationObj.station_id,
        task_type: 'FORECAST_24H_AQI',
        pm2_5: stationObj.pm2_5,
        pm10: stationObj.pm10,
        wind_speed_kmh: Number(windVal),
        pbl_height_m: Number(pblVal),
        temp_c: stationObj.temperature_c,
        humidity_pct: stationObj.humidity_pct
      };
      const res = await executeTask('FORECAST_24H_AQI', payload, stationObj.station_id);
      setForecastResult(res?.result || null);
    } catch (err) {
      console.error('Forecast calculation failed:', err);
    } finally {
      setLoadingForecast(false);
    }
  };

  const handleRecalculateSim = () => {
    runForecast(currentStation, simWind, simPbl);
  };

  const getCategoryTheme = (cat) => {
    switch (cat) {
      case 'GOOD': return { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: 'Good (0-50)' };
      case 'SATISFACTORY': return { color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc', label: 'Satisfactory (51-100)' };
      case 'MODERATE': return { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', label: 'Moderate (101-200)' };
      case 'POOR': return { color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', label: 'Poor (201-300)' };
      case 'VERY_POOR': return { color: '#dc2626', bg: '#fff1f2', border: '#fecaca', label: 'Very Poor (301-400)' };
      case 'SEVERE':
      case 'SEVERE_PLUS': return { color: '#991b1b', bg: '#fef2f2', border: '#fecdd3', label: 'Severe (401-500+)' };
      default: return { color: '#78716c', bg: '#faf6f0', border: '#eeddc8', label: cat || 'Unavailable' };
    }
  };

  const catTheme = getCategoryTheme(currentStation?.category);
  const aqiPercentage = currentStation ? Math.min(100, (currentStation.current_aqi / 500) * 100) : 0;

  const getWindCardinal = (deg) => {
    if (deg === undefined || deg === null) return '--';
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const idx = Math.round(deg / 22.5) % 16;
    return directions[idx] || 'NW';
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div id="main-delhi-dashboard" style={{ width: '100%' }}>
      {/* 1. Robust LIVE DATA / UNAVAILABLE Status Banner */}
      <DemoBanner
        apiStatus={apiStatus}
        onRefresh={onRefreshData}
        loading={loadingData}
      />

      {/* 2. Hero Section with Warm Golden Sunset Sky & India Gate Landmark */}
      <DelhiHeroSection
        selectedStationName={currentStation?.station_name || 'Delhi-NCR'}
        stations={stations}
        selectedStationId={activeStationId}
        onSelectStation={handleSelectStation}
        onExploreForecast={onExploreForecast}
      />

      {/* ========================================================================= */}
      {/* 3. 5 PREMIUM FLOATING CARDS (Directly Below Hero with Live API Pipeline)   */}
      {/* ========================================================================= */}
      <section className="live-metrics-section" id="live-telemetry-overview-section">
        <div className="live-metrics-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ea580c' }}></span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 850, color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-heading)' }}>
                Real-Time Atmospheric & Pollution Telemetry
              </h2>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <MapPin size={13} color="#ea580c" />
              <span>Monitoring Location: <strong>{currentStation?.station_name || 'Delhi-NCR'}</strong></span>
              {currentStation?.location && (
                <span style={{ color: 'var(--text-muted)' }}>• {currentStation.location}</span>
              )}
            </div>
          </div>

          {/* Status Indicator: 🟢 LIVE DATA or 🟡 DATA UNAVAILABLE */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {apiStatus?.isLive ? (
              <div id="live-data-badge" className="live-status-pill">
                <span className="pulse-dot" style={{ width: '8px', height: '8px', background: '#16a34a' }}></span>
                <span>🟢 LIVE DATA</span>
                <span style={{ fontSize: '0.71875rem', fontWeight: 700, color: '#15803d', marginLeft: '3px' }}>
                  • Connected to live API
                </span>
              </div>
            ) : (
              <div
                id="live-data-badge"
                className="live-status-pill"
                style={{
                  background: '#fef3c7',
                  border: '1.5px solid #fde68a',
                  color: '#b45309'
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d97706' }}></span>
                <span>🟡 DATA UNAVAILABLE</span>
                <span style={{ fontSize: '0.71875rem', fontWeight: 600, marginLeft: '3px' }}>
                  • {apiStatus?.message || 'Sensor telemetry feed offline'}
                </span>
              </div>
            )}

            {apiStatus?.lastSynced && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} color="#16a34a" />
                <span>Synced: {new Date(apiStatus.lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>
            )}
          </div>
        </div>

        {/* 5-Card Responsive Floating Glass Grid */}
        <div id="hero-live-5-cards" className="live-metrics-5grid">
          {/* CARD 1: Current AQI */}
          <div
            id="card-live-aqi"
            className="metric-glass-card"
            style={{
              borderLeft: `4px solid ${catTheme.color}`
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="metric-label">Current AQI</span>
                <div
                  className="metric-icon-wrap"
                  style={{
                    background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)'
                  }}
                >
                  <Activity size={18} />
                </div>
              </div>

              <div
                className="metric-val"
                style={{
                  color: catTheme.color,
                  textShadow: '0 1px 6px rgba(0,0,0,0.04)'
                }}
              >
                {currentStation?.current_aqi !== undefined ? currentStation.current_aqi : '--'}
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: catTheme.bg,
                  color: catTheme.color,
                  border: `1px solid ${catTheme.border}`,
                  padding: '0.2rem 0.55rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.71875rem',
                  fontWeight: 800,
                  marginBottom: '0.4rem'
                }}
              >
                <span>{currentStation?.category ? currentStation.category.replace('_', ' ') : 'Status Unavailable'}</span>
              </div>
            </div>

            <div className="metric-footer">
              <span>PM2.5: <strong>{currentStation?.pm2_5 !== undefined ? `${currentStation.pm2_5} µg/m³` : '--'}</strong></span>
              <span>PM10: <strong>{currentStation?.pm10 !== undefined ? currentStation.pm10 : '--'}</strong></span>
            </div>
          </div>

          {/* CARD 2: Temperature */}
          <div id="card-live-temp" className="metric-glass-card">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="metric-label">Temperature</span>
                <div
                  className="metric-icon-wrap"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                  }}
                >
                  <Thermometer size={18} />
                </div>
              </div>

              <div className="metric-val">
                {currentStation?.temperature_c !== undefined ? `${currentStation.temperature_c}°C` : '--'}
              </div>

              <div className="metric-sub">
                {currentStation?.temperature_c !== undefined
                  ? (currentStation.temperature_c > 28
                      ? 'Warm Ambient Surface Layer'
                      : currentStation.temperature_c < 15
                      ? 'Inversion Layer Forming'
                      : 'Moderate Thermal Profile')
                  : 'Sensor Offline'}
              </div>
            </div>

            <div className="metric-footer">
              <span>Pressure</span>
              <strong>{currentStation?.pressure_hpa ? `${currentStation.pressure_hpa} hPa` : '1014 hPa'}</strong>
            </div>
          </div>

          {/* CARD 3: Humidity */}
          <div id="card-live-humidity" className="metric-glass-card">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="metric-label">Humidity</span>
                <div
                  className="metric-icon-wrap"
                  style={{
                    background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)'
                  }}
                >
                  <Droplets size={18} />
                </div>
              </div>

              <div className="metric-val" style={{ color: '#0e7490' }}>
                {currentStation?.humidity_pct !== undefined ? `${currentStation.humidity_pct}%` : '--'}
              </div>

              <div className="metric-sub">
                {currentStation?.humidity_pct !== undefined
                  ? (currentStation.humidity_pct > 75
                      ? 'High Moisture • Promotes Aerosols'
                      : currentStation.humidity_pct < 45
                      ? 'Dry Conditions • Low Hygroscopy'
                      : 'Moderate Atmospheric Moisture')
                  : 'Sensor Offline'}
              </div>
            </div>

            <div className="metric-footer">
              <span>PBL Height</span>
              <strong>{currentStation?.pbl_height_m ? `${currentStation.pbl_height_m} m` : '410 m'}</strong>
            </div>
          </div>

          {/* CARD 4: Wind Speed */}
          <div id="card-live-wind" className="metric-glass-card">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="metric-label">Wind Speed</span>
                <div
                  className="metric-icon-wrap"
                  style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)'
                  }}
                >
                  <Wind size={18} />
                </div>
              </div>

              <div className="metric-val" style={{ color: '#0369a1' }}>
                {currentStation?.wind_speed_kmh !== undefined ? `${currentStation.wind_speed_kmh} km/h` : '--'}
              </div>

              <div className="metric-sub">
                {currentStation?.wind_speed_kmh !== undefined
                  ? (currentStation.wind_speed_kmh < 8
                      ? 'Calm • Poor Dispersion'
                      : 'Active Atmospheric Advection')
                  : 'Sensor Offline'}
              </div>
            </div>

            <div className="metric-footer">
              <span>Direction</span>
              <strong>{getWindCardinal(currentStation?.wind_direction_deg)} ({currentStation?.wind_direction_deg || 295}°)</strong>
            </div>
          </div>

          {/* CARD 5: Rainfall */}
          <div id="card-live-rainfall" className="metric-glass-card">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="metric-label">Rainfall</span>
                <div
                  className="metric-icon-wrap"
                  style={{
                    background: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)'
                  }}
                >
                  <CloudRain size={18} />
                </div>
              </div>

              <div className="metric-val" style={{ color: '#1d4ed8' }}>
                {currentStation?.rainfall_mm !== undefined ? `${currentStation.rainfall_mm} mm` : '--'}
              </div>

              <div className="metric-sub">
                {currentStation?.rainfall_mm !== undefined
                  ? (currentStation.rainfall_mm > 0
                      ? 'Active Precipitation Washout'
                      : '0 mm • Zero Washout (Dry Stagnation)')
                  : 'Sensor Offline'}
              </div>
            </div>

            <div className="metric-footer">
              <span>Ventilation Index</span>
              <strong>{currentStation?.ventilation_index ? `${Math.round(currentStation.ventilation_index)} m²/s` : '661 m²/s'}</strong>
            </div>
          </div>
        </div>

        {/* Compact quick-links or transitions if needed */}
      </section>

      {/* ========================================================================= */}
      {/* 3.1 PREMIUM CURRENT AIR QUALITY SECTION (Dynamic Circular Indicator & Pollutants) */}
      {/* ========================================================================= */}
      <CurrentAirQualitySection station={currentStation} />

      {/* ========================================================================= */}
      {/* 3.2 PREMIUM WEATHER CONDITIONS SECTION (Live Temperature, Wind, Rain, Pressure) */}
      {/* ========================================================================= */}
      <WeatherConditionsCard station={currentStation} />




      {/* ========================================================================= */}
      {/* 4. SECOND SECTION: Delhi Map + 24h Forecast + AI Insights Card             */}
      {/* ========================================================================= */}
      <div
        id="middle-dashboard-row"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1fr) minmax(340px, 1.25fr)',
          gap: '1.5rem',
          marginBottom: '2rem',
          alignItems: 'stretch'
        }}
      >
        {/* Left: Delhi NCR AQI Map */}
        <DelhiMapHotspots
          stations={stations}
          selectedStationId={activeStationId}
          onSelectStation={handleSelectStation}
        />

        {/* Right: Delhi Areas Explorer Panel */}
        <DelhiAreasPanel
          stations={stations}
          selectedStationId={activeStationId}
          onSelectStation={handleSelectStation}
        />
      </div>

      {/* 24-HOUR AQI FORECAST SECTION */}
      <div id="section-24h-forecast" style={{ marginBottom: '2rem' }}>
        <AqiForecastChart
          currentStation={currentStation}
          forecastResult={forecastResult}
          loadingForecast={loadingForecast}
        />
        <ForecastVisualizer
          currentStation={currentStation}
          forecastResult={forecastResult}
          loadingForecast={loadingForecast}
        />
      </div>

      {/* GEMINI AI ENVIRONMENTAL INSIGHTS */}
      <GeminiInsightsCard
        station={currentStation}
        forecastResult={forecastResult}
        simWind={simWind}
        simPbl={simPbl}
      />

      {/* EARLY WARNING ADVISORY & GRAP DIRECTIVES */}
      <EarlyWarningAdvisory
        station={currentStation}
        forecastResult={forecastResult}
        currentAqi={currentStation?.current_aqi}
      />

      {/* SECTION 5: AIR QUALITY & WEATHER RELATIONSHIP & WHAT-IF ENGINE */}
      <div id="why-pollution-changing-section" style={{ marginBottom: '2rem' }}>
        <WeatherExplanation
          station={currentStation}
          forecastResult={forecastResult}
          simWind={simWind}
          setSimWind={setSimWind}
          simPbl={simPbl}
          setSimPbl={setSimPbl}
          onRecalculate={handleRecalculateSim}
          loading={loadingForecast}
        />

        {/* Multi-metric Weather-Pollution Correlation Chart */}
        <WeatherPollutionChart
          station={currentStation}
          forecastResult={forecastResult}
        />
      </div>

      {/* ========================================================================= */}
      {/* 5. BOTTOM FEATURE HIGHLIGHT BAR (From reference image)                    */}
      {/* ========================================================================= */}
      <div
        id="bottom-feature-highlight-bar"
        className="white-card"
        style={{
          background: 'linear-gradient(90deg, #ffffff 0%, #fffbf5 100%)',
          border: '1.5px solid var(--border-subtle)',
          padding: '1.5rem 1.75rem',
          marginBottom: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🌱</span>
            <div style={{ fontSize: '1rem', fontWeight: 900, color: '#7c2d12', fontFamily: 'var(--font-heading)' }}>
              Powered by AI for a Cleaner Tomorrow
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Leaf size={14} color="#16a34a" />
            <span>SIH 2026 Environmental Intelligence Platform</span>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            borderTop: '1px solid #f5eee4',
            paddingTop: '1rem'
          }}
        >
          {/* Pillar 1 */}
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Brain size={15} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>AI Forecasting</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>1h / 6h / 24h prediction using coupled ML</div>
            </div>
          </div>

          {/* Pillar 2 */}
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Wind size={15} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>Weather Coupling</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Analyzes how weather affects pollution levels</div>
            </div>
          </div>

          {/* Pillar 3 */}
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldAlert size={15} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>Early Warnings</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Detects risk and alerts before it gets severe</div>
            </div>
          </div>

          {/* Pillar 4 */}
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles size={15} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>Personalized Guidance</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Simple action steps for health and safety</div>
            </div>
          </div>

          {/* Pillar 5 */}
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MapPin size={15} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>Interactive Map</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Explore AQI across Delhi NCR in real-time</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
