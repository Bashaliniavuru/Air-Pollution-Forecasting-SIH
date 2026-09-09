import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Brain,
  Wind,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  Info,
  CheckCircle2,
  ChevronRight,
  Layers,
  Lightbulb,
  Leaf,
  Activity,
  HeartPulse,
  ShieldAlert,
  ArrowRight,
  Zap
} from 'lucide-react';
import { fetchGeminiExplanation, fetchGeminiStatus } from '../services/api';

export default function GeminiInsightsCard({
  station,
  forecastResult,
  simWind,
  simPbl
}) {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [geminiStatus, setGeminiStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'coupling' | 'forecast_risk' | 'advisory'

  useEffect(() => {
    fetchGeminiStatus().then((st) => setGeminiStatus(st)).catch(() => {});
  }, []);

  const loadExplanation = async () => {
    if (!station) return;
    setLoading(true);

    const payload = {
      station_id: station.station_id || 'DELHI_CENTRAL',
      station_name: station.station_name || 'Delhi',
      location: station.location || 'Central Delhi',
      current_aqi: station.current_aqi !== undefined ? station.current_aqi : 355,
      category: station.category || 'VERY_POOR',
      pm2_5: station.pm2_5 !== undefined ? station.pm2_5 : 195.0,
      pm10: station.pm10 !== undefined ? station.pm10 : 310.0,
      no2: station.no2 !== undefined ? station.no2 : 72.0,
      o3: station.o3 !== undefined ? station.o3 : 38.0,
      so2: station.so2 !== undefined ? station.so2 : 15.0,
      co: station.co !== undefined ? station.co : 2.4,
      temperature_c: station.temperature_c !== undefined ? station.temperature_c : 19.0,
      humidity_pct: station.humidity_pct !== undefined ? station.humidity_pct : 78.0,
      wind_speed_kmh: simWind !== undefined ? simWind : (station.wind_speed_kmh !== undefined ? station.wind_speed_kmh : 5.8),
      wind_direction_deg: station.wind_direction_deg !== undefined ? station.wind_direction_deg : 295.0,
      pbl_height_m: simPbl !== undefined ? simPbl : (station.pbl_height_m !== undefined ? station.pbl_height_m : 410.0),
      ventilation_index: forecastResult?.ventilation_index_m2_s || station.ventilation_index || 660.8,
      forecast_aqi: forecastResult?.forecast_aqi !== undefined ? forecastResult.forecast_aqi : 390,
      forecast_category: forecastResult?.aqi_category || 'VERY_POOR',
      inversion_risk: forecastResult?.thermal_inversion_risk || 'HIGH',
      stagnation_multiplier: forecastResult?.stagnation_multiplier || 1.6
    };

    try {
      const data = await fetchGeminiExplanation(payload);
      setExplanation(data);
    } catch (err) {
      console.error('Failed to generate Gemini explanation:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-load on station or simulation changes
  useEffect(() => {
    if (station) {
      loadExplanation();
    }
  }, [station?.station_id, forecastResult?.forecast_aqi, simWind, simPbl]);

  if (!station) return null;

  const isGeminiOnline = explanation?.is_ai_generated && !explanation?.is_fallback;

  return (
    <section
      id="ai-weather-pollution-insight-section"
      className="white-card"
      style={{
        marginBottom: '2rem',
        padding: '1.85rem 2rem',
        background: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1.5px solid rgba(254, 215, 170, 0.95)',
        boxShadow: '0 12px 36px rgba(180, 83, 9, 0.09)',
        borderRadius: 'var(--radius-2xl)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Decorative ambient background glow */}
      <div
        style={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(251, 146, 60, 0.18) 0%, rgba(255, 255, 255, 0) 70%)',
          pointerEvents: 'none'
        }}
      />

      {/* ========================================================================= */}
      {/* 1. SECTION HEADER: Title, Engine Status Badge, Refresh Button             */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1.6rem',
          paddingBottom: '1rem',
          borderBottom: '1.5px solid #fbf3e8'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.2rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 10px rgba(234, 88, 12, 0.25)'
              }}
            >
              <Sparkles size={17} />
            </div>
            <h2
              style={{
                fontSize: '1.35rem',
                fontWeight: 850,
                color: '#1c1917',
                margin: 0,
                fontFamily: 'var(--font-heading)',
                letterSpacing: '-0.02em'
              }}
            >
              AI Weather & Pollution Insight
            </h2>
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#78716c', fontWeight: 600 }}>
            Natural-language atmospheric reasoning grounded in live telemetry & meteorological coupling for <strong>{station.station_name}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Engine Status Pill */}
          <span
            style={{
              padding: '0.3rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.71875rem',
              fontWeight: 800,
              background: isGeminiOnline ? '#f0fdf4' : '#fff7ed',
              border: isGeminiOnline ? '1px solid #bbf7d0' : '1px solid #fed7aa',
              color: isGeminiOnline ? '#15803d' : '#ea580c',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Bot size={13} />
            <span>
              {isGeminiOnline
                ? `Google Gemini (${explanation?.model || 'gemini-2.5-flash'})`
                : 'Physics-Coupled Reasoning Engine (Active)'}
            </span>
          </span>

          {/* Refresh Insights Button */}
          <button
            id="btn-refresh-gemini-ai"
            onClick={loadExplanation}
            disabled={loading}
            className="btn-secondary"
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.78125rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={13} className={loading ? 'pulse-dot' : ''} />
            <span>{loading ? 'Analyzing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. NAVIGATION TABS: Overview • Weather Coupling • Forecast & Risk • Actions*/}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1.5px solid #fbf3e8',
          paddingBottom: '0.85rem',
          marginBottom: '1.4rem',
          flexWrap: 'wrap'
        }}
      >
        {[
          { id: 'overview', label: 'Overview & Current AQI', icon: <Lightbulb size={14} /> },
          { id: 'coupling', label: 'Weather-Pollution Relationship', icon: <Wind size={14} /> },
          { id: 'forecast_risk', label: 'Forecast Trend & Pollution Risk', icon: <TrendingUp size={14} /> },
          { id: 'advisory', label: 'Preventive Recommendations', icon: <ShieldCheck size={14} /> }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-gemini-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: isActive ? 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)' : '#f5eee4',
                color: isActive ? '#ffffff' : '#57534e',
                fontSize: '0.8125rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 3px 10px rgba(234, 88, 12, 0.25)' : 'none'
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 3. TAB CONTENT                                                            */}
      {/* ========================================================================= */}
      {loading ? (
        <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#78716c' }}>
          <Sparkles size={32} className="pulse-dot" style={{ color: '#ea580c', margin: '0 auto 0.75rem' }} />
          <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#1c1917' }}>
            AI Engine is analyzing coupled atmospheric physics & telemetry...
          </div>
          <div style={{ fontSize: '0.78125rem', color: '#78716c', marginTop: '4px' }}>
            Evaluating surface wind advection, nocturnal inversion layers, and particulate concentrations
          </div>
        </div>
      ) : (
        <div>
          {/* TAB 1: OVERVIEW & CURRENT AQI */}
          {activeTab === 'overview' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.25rem'
              }}
            >
              {/* Executive Summary Card */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #fffbf5 0%, #fff7ed 100%)',
                  border: '1.5px solid #fed7aa',
                  borderRadius: 'var(--radius-xl)',
                  padding: '1.4rem',
                  display: 'flex',
                  gap: '1.15rem',
                  alignItems: 'flex-start',
                  boxShadow: '0 4px 16px rgba(180, 83, 9, 0.04)'
                }}
              >
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 4px 14px rgba(234, 88, 12, 0.25)'
                  }}
                >
                  <Bot size={26} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.71875rem', fontWeight: 800, color: '#9a3412', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Executive Atmospheric Summary
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 850, color: '#1c1917', margin: '2px 0 0.5rem' }}>
                    Why is Air Quality at {station.station_name} {station.category?.replace('_', ' ')}?
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.84375rem', color: '#44403c', lineHeight: 1.65, fontWeight: 500 }}>
                    {explanation?.summary || 'Elevated particulate trapping is actively driven by low surface wind speed and shallow boundary layer capping.'}
                  </p>
                </div>
              </div>

              {/* Current AQI Condition Analysis */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1.5px solid rgba(254, 215, 170, 0.85)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '1.4rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 16px rgba(180, 83, 9, 0.03)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Activity size={17} color="#ea580c" />
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 850, color: '#1c1917', margin: 0 }}>
                      Current AQI & Pollutant Breakdown
                    </h4>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: '#44403c', lineHeight: 1.65, margin: 0 }}>
                    {explanation?.aqi_condition_analysis ||
                      `Current AQI of ${station.current_aqi || 355} (${station.category || 'VERY_POOR'}) is dominated by PM2.5 (${station.pm2_5 || 195} µg/m³) and PM10 (${station.pm10 || 310} µg/m³), reflecting severe particulate accumulation.`}
                  </p>
                </div>

                <div
                  style={{
                    borderTop: '1px solid #fbf3e8',
                    paddingTop: '0.65rem',
                    marginTop: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: '#78716c'
                  }}
                >
                  <span>Ground Sensor: <strong>{station.location || station.station_name}</strong></span>
                  <span style={{ color: '#ea580c', fontWeight: 800 }}>Live CPCB Ground Truth</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WEATHER-POLLUTION RELATIONSHIP (METEOROLOGICAL COUPLING) */}
          {activeTab === 'coupling' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.25rem'
              }}
            >
              <div
                style={{
                  background: '#ffffff',
                  border: '1.5px solid rgba(254, 215, 170, 0.85)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '1.4rem',
                  boxShadow: '0 4px 16px rgba(180, 83, 9, 0.03)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.65rem' }}>
                  <Wind size={18} color="#ea580c" />
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 850, color: '#1c1917', margin: 0 }}>
                    Atmospheric Dispersion & Wind Dynamics
                  </h4>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#44403c', lineHeight: 1.65, margin: 0 }}>
                  {explanation?.meteorological_coupling_analysis ||
                    'Calm surface wind speeds and shallow boundary layer mixing volume prevent horizontal advective transport, trapping fine particulates within the ground layer.'}
                </p>
              </div>

              <div
                style={{
                  background: '#ffffff',
                  border: '1.5px solid rgba(254, 215, 170, 0.85)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '1.4rem',
                  boxShadow: '0 4px 16px rgba(180, 83, 9, 0.03)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.65rem' }}>
                  <Layers size={18} color="#0891b2" />
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 850, color: '#1c1917', margin: 0 }}>
                    Moisture & Boundary Layer Capping
                  </h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.8125rem', color: '#44403c' }}>
                  <div>
                    <strong>Relative Humidity ({station.humidity_pct || 78}%): </strong>
                    <span>High atmospheric moisture promotes hygroscopic aerosol expansion and secondary chemical conversion.</span>
                  </div>
                  <div>
                    <strong>Boundary Layer ({station.pbl_height_m || 410}m): </strong>
                    <span>Shallow nocturnal inversion acts as an atmospheric lid, restricting vertical dilution.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FORECAST TREND & POLLUTION RISK */}
          {activeTab === 'forecast_risk' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.25rem'
              }}
            >
              {/* 24h Forecast Trend */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1.5px solid rgba(254, 215, 170, 0.85)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '1.4rem',
                  boxShadow: '0 4px 16px rgba(180, 83, 9, 0.03)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.65rem' }}>
                  <TrendingUp size={18} color="#ea580c" />
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 850, color: '#1c1917', margin: 0 }}>
                    24-Hour Coupled Forecast Trend
                  </h4>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#44403c', lineHeight: 1.65, margin: 0 }}>
                  {explanation?.forecast_interpretation ||
                    `The physics-informed model projects the AQI to trend toward ${forecastResult?.forecast_aqi || 390} (${forecastResult?.aqi_category || 'VERY_POOR'}) over the next 24 hours due to persistent boundary layer compression.`}
                </p>
              </div>

              {/* Early Warning & Risk Level */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1.5px solid rgba(254, 215, 170, 0.85)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '1.4rem',
                  boxShadow: '0 4px 16px rgba(180, 83, 9, 0.03)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.65rem' }}>
                  <ShieldAlert size={18} color="#dc2626" />
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 850, color: '#1c1917', margin: 0 }}>
                    Pollution Risk & Early Warning Assessment
                  </h4>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#44403c', lineHeight: 1.65, margin: 0 }}>
                  {explanation?.early_warning_explanation ||
                    `EARLY WARNING STATUS: ${forecastResult?.thermal_inversion_risk || 'HIGH'} RISK. Meteorological conditions indicate high probability of nocturnal surface stagnation.`}
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: PREVENTIVE RECOMMENDATIONS */}
          {activeTab === 'advisory' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.25rem'
              }}
            >
              {/* Sensitive Groups */}
              <div
                style={{
                  background: '#fffbeb',
                  border: '1.5px solid #fde68a',
                  borderRadius: 'var(--radius-xl)',
                  padding: '1.25rem 1.35rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.65rem' }}>
                  <HeartPulse size={17} color="#b45309" />
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 850, color: '#b45309', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    1. Sensitive Groups
                  </h4>
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.15rem', fontSize: '0.78125rem', color: '#78350f', lineHeight: 1.6 }}>
                  {(explanation?.preventive_recommendations?.sensitive_groups || [
                    'Avoid outdoor exercise in early mornings and late evenings.',
                    'Keep prescribed bronchodilators and respiratory medications readily accessible.',
                    'Utilize indoor HEPA air purifiers in sleeping and work quarters.'
                  ]).map((act, i) => (
                    <li key={i} style={{ marginBottom: '0.35rem' }}>{act}</li>
                  ))}
                </ul>
              </div>

              {/* General Public */}
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #bbf7d0',
                  borderRadius: 'var(--radius-xl)',
                  padding: '1.25rem 1.35rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.65rem' }}>
                  <ShieldCheck size={17} color="#15803d" />
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 850, color: '#15803d', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    2. General Public
                  </h4>
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.15rem', fontSize: '0.78125rem', color: '#14532d', lineHeight: 1.6 }}>
                  {(explanation?.preventive_recommendations?.general_public || [
                    'Wear certified N95 or N99 particulate respirators when commuting.',
                    'Prioritize Delhi Metro and electrified public transit over personal private vehicles.',
                    'Avoid dry sweeping and burning of domestic or garden biomass.'
                  ]).map((act, i) => (
                    <li key={i} style={{ marginBottom: '0.35rem' }}>{act}</li>
                  ))}
                </ul>
              </div>

              {/* Regulators & GRAP */}
              <div
                style={{
                  background: '#fff7ed',
                  border: '1.5px solid #fed7aa',
                  borderRadius: 'var(--radius-xl)',
                  padding: '1.25rem 1.35rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.65rem' }}>
                  <Zap size={17} color="#c2410c" />
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 850, color: '#c2410c', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    3. Regulators (GRAP)
                  </h4>
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.15rem', fontSize: '0.78125rem', color: '#7c2d12', lineHeight: 1.6 }}>
                  {(explanation?.preventive_recommendations?.regulators || [
                    'Enforce Graded Response Action Plan (GRAP) Stage 3 measures across corridors.',
                    'Intensify mechanized vacuum sweeping and water misting along arterial networks.',
                    'Enforce strict anti-dust compliance at all active infrastructure sites.'
                  ]).map((act, i) => (
                    <li key={i} style={{ marginBottom: '0.35rem' }}>{act}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. FOOTER DISCLAIMER & ATTRIBUTION                                       */}
      {/* ========================================================================= */}
      <div
        style={{
          marginTop: '1.4rem',
          paddingTop: '0.85rem',
          borderTop: '1px solid #fbf3e8',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          fontSize: '0.71875rem',
          color: '#78716c'
        }}
      >
        <span style={{ fontWeight: 600, color: '#d97706' }}>
          {explanation?.disclaimer || '🟡 DEMO DATA – For Prototype Demonstration Only – Physics-Grounded AI Analysis'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#16a34a', fontWeight: 700 }}>
          <Leaf size={13} color="#16a34a" />
          <span>SIX WARRIORS Atmospheric Intelligence Platform</span>
        </div>
      </div>
    </section>
  );
}
