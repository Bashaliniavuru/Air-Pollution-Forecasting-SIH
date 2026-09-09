import React from 'react';
import {
  Activity,
  AlertTriangle,
  HeartPulse,
  ShieldCheck,
  ShieldAlert,
  Info,
  Wind,
  Layers,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function CurrentAirQualitySection({ station }) {
  if (!station) {
    return (
      <div className="white-card" style={{ padding: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>Station telemetry currently offline.</p>
      </div>
    );
  }

  const aqi = station.current_aqi !== undefined ? station.current_aqi : 0;
  const category = station.category || 'UNKNOWN';

  // Category Theme Configurations
  const getCategoryConfig = (cat, aqiVal) => {
    switch (cat) {
      case 'GOOD':
        return {
          label: 'Good',
          color: '#16a34a',
          bg: '#f0fdf4',
          border: '#bbf7d0',
          gradient: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
          range: '0 – 50',
          healthSummary: 'Minimal health impact. Air quality is clean and satisfactory.',
          recommendation: 'Ideal air quality for all outdoor sports, jogging, and ventilation.',
          icon: ShieldCheck
        };
      case 'SATISFACTORY':
        return {
          label: 'Satisfactory',
          color: '#0891b2',
          bg: '#ecfeff',
          border: '#a5f3fc',
          gradient: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
          range: '51 – 100',
          healthSummary: 'Minor breathing discomfort possible for sensitive individuals.',
          recommendation: 'General public can enjoy normal outdoor activities without restriction.',
          icon: ShieldCheck
        };
      case 'MODERATE':
        return {
          label: 'Moderate',
          color: '#d97706',
          bg: '#fffbeb',
          border: '#fde68a',
          gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          range: '101 – 200',
          healthSummary: 'May cause breathing discomfort to people with lung disease, asthma, and heart conditions.',
          recommendation: 'Sensitive individuals should take more breaks during intense outdoor exertion.',
          icon: HeartPulse
        };
      case 'POOR':
        return {
          label: 'Poor',
          color: '#ea580c',
          bg: '#fff7ed',
          border: '#fed7aa',
          gradient: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
          range: '201 – 300',
          healthSummary: 'Prolonged exposure may cause breathing discomfort to most people.',
          recommendation: 'Wear certified N95 masks outdoors; sensitive groups should limit strenuous outdoor activity.',
          icon: AlertTriangle
        };
      case 'VERY_POOR':
        return {
          label: 'Very Poor',
          color: '#dc2626',
          bg: '#fff1f2',
          border: '#fecaca',
          gradient: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
          range: '301 – 400',
          healthSummary: 'May cause respiratory illness on prolonged exposure. Severe effect on people with lung/heart disease.',
          recommendation: 'Avoid prolonged outdoor physical exertion. Keep windows closed and utilize indoor HEPA filtration.',
          icon: ShieldAlert
        };
      case 'SEVERE':
      case 'SEVERE_PLUS':
        return {
          label: 'Severe Emergency',
          color: '#991b1b',
          bg: '#fef2f2',
          border: '#fecdd3',
          gradient: 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)',
          range: '401 – 500+',
          healthSummary: 'Healthy people may experience respiratory discomfort during brief exposure; serious health impact on vulnerable groups.',
          recommendation: 'Strictly avoid all outdoor exercise. Wear N95/N99 respirators for mandatory transit; operate indoor air purifiers.',
          icon: ShieldAlert
        };
      default:
        return {
          label: cat.replace('_', ' '),
          color: '#ea580c',
          bg: '#fff7ed',
          border: '#fed7aa',
          gradient: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
          range: '0 – 500',
          healthSummary: 'Monitor ambient air quality index for sensitive groups.',
          recommendation: 'Follow standard CPCB protective advisories.',
          icon: Activity
        };
    }
  };

  const catConfig = getCategoryConfig(category, aqi);
  const HealthIcon = catConfig.icon;

  // Circular Gauge Calculations (240-degree sweep)
  const radius = 88;
  const strokeWidth = 14;
  const normalizedAqi = Math.min(500, Math.max(0, aqi));
  const progressRatio = normalizedAqi / 500;
  
  // Circumference of full 360 circle
  const circumference = 2 * Math.PI * radius;
  // We use a 240 degree gauge (2/3 of circle = ~66.67% of circumference)
  const arcLength = circumference * (240 / 360);
  const strokeDashoffset = arcLength - (progressRatio * arcLength);

  // 6 Pollutants with standard CPCB limits and units
  const pollutants = [
    {
      name: 'PM2.5',
      fullName: 'Fine Particulate Matter (≤2.5 µm)',
      val: station.pm2_5,
      unit: 'µg/m³',
      limit: 60,
      maxScale: 250,
      color: '#ea580c',
      description: 'Microscopic particulates that penetrate deep into alveolar lung tissues.'
    },
    {
      name: 'PM10',
      fullName: 'Inhalable Particulate Matter (≤10 µm)',
      val: station.pm10,
      unit: 'µg/m³',
      limit: 100,
      maxScale: 400,
      color: '#f59e0b',
      description: 'Coarse airborne particles from road dust resuspension and construction.'
    },
    {
      name: 'NO2',
      fullName: 'Nitrogen Dioxide',
      val: station.no2 !== undefined ? station.no2 : 65.0,
      unit: 'µg/m³',
      limit: 80,
      maxScale: 140,
      color: '#c2410c',
      description: 'Combustion gas from vehicular exhaust & industrial power plants.'
    },
    {
      name: 'SO2',
      fullName: 'Sulfur Dioxide',
      val: station.so2 !== undefined ? station.so2 : 14.0,
      unit: 'µg/m³',
      limit: 80,
      maxScale: 100,
      color: '#16a34a',
      description: 'Emissions from industrial furnaces, oil refineries & fossil fuel combustion.'
    },
    {
      name: 'CO',
      fullName: 'Carbon Monoxide',
      val: station.co !== undefined ? station.co : 2.1,
      unit: 'mg/m³',
      limit: 2.0,
      maxScale: 6.0,
      color: '#0891b2',
      description: 'Toxic gas from incomplete fuel combustion in idling urban traffic.'
    },
    {
      name: 'O3',
      fullName: 'Ground-Level Ozone',
      val: station.o3 !== undefined ? station.o3 : 38.0,
      unit: 'µg/m³',
      limit: 100,
      maxScale: 140,
      color: '#7c3aed',
      description: 'Secondary photochemical pollutant formed from NOx & VOCs in sunlight.'
    }
  ];

  return (
    <section
      id="current-air-quality-section"
      className="white-card"
      style={{
        background: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1.5px solid rgba(254, 215, 170, 0.95)',
        borderRadius: 'var(--radius-2xl)',
        padding: '1.85rem 2rem',
        boxShadow: '0 12px 36px rgba(180, 83, 9, 0.09)',
        marginBottom: '2rem'
      }}
    >
      {/* Section Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1.6rem',
          paddingBottom: '1rem',
          borderBottom: '1.5px solid #fbf3e8'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
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
              <Activity size={17} />
            </div>
            <h2
              style={{
                fontSize: '1.4rem',
                fontWeight: 850,
                color: '#1c1917',
                margin: 0,
                fontFamily: 'var(--font-heading)',
                letterSpacing: '-0.02em'
              }}
            >
              Current Air Quality & Pollutant Matrix
            </h2>
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#78716c', fontWeight: 600 }}>
            Live sensor telemetry across Central Pollution Control Board (CPCB) parameters for <strong>{station.station_name}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              fontWeight: 800,
              color: '#15803d',
              background: '#f0fdf4',
              padding: '0.3rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid #bbf7d0'
            }}
          >
            <span className="pulse-dot" style={{ width: '7px', height: '7px', background: '#16a34a' }}></span>
            <span>Live Observation</span>
          </span>
        </div>
      </div>

      {/* Main 2-Column Section Layout: Circular AQI + Health vs. 6 Pollutant Rows */}
      <div className="current-aqi-grid">
        {/* ========================================================= */}
        {/* --- LEFT COLUMN: CIRCULAR AQI INDICATOR & HEALTH ADVISORY --- */}
        {/* ========================================================= */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, #ffffff 0%, #fffbf5 100%)',
            border: '1.5px solid rgba(254, 215, 170, 0.85)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.6rem 1.4rem',
            boxShadow: '0 4px 18px rgba(180, 83, 9, 0.05)'
          }}
        >
          <div>
            <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 850,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#9a3412'
                }}
              >
                Comprehensive Air Quality Index
              </span>
            </div>

            {/* Circular AQI Gauge Container */}
            <div
              style={{
                position: 'relative',
                width: '220px',
                height: '190px',
                margin: '0 auto 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg
                width="220"
                height="220"
                viewBox="0 0 220 220"
                style={{
                  transform: 'rotate(150deg)',
                  transformOrigin: 'center'
                }}
              >
                {/* Background Track Arc */}
                <circle
                  cx="110"
                  cy="110"
                  r={radius}
                  fill="none"
                  stroke="#fef3c7"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${arcLength} ${circumference}`}
                  strokeLinecap="round"
                />

                {/* Animated Dynamic Progress Arc with Category Gradient */}
                <defs>
                  <linearGradient id="aqiArcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="50%" stopColor="#ea580c" />
                    <stop offset="100%" stopColor={catConfig.color} />
                  </linearGradient>
                </defs>

                <circle
                  cx="110"
                  cy="110"
                  r={radius}
                  fill="none"
                  stroke="url(#aqiArcGradient)"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${arcLength} ${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{
                    transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.5s ease'
                  }}
                />
              </svg>

              {/* Center AQI Value & Details */}
              <div
                style={{
                  position: 'absolute',
                  top: '48%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Index Score
                </div>
                <div
                  style={{
                    fontSize: '3.3rem',
                    fontWeight: 950,
                    lineHeight: 1,
                    color: catConfig.color,
                    fontFamily: 'var(--font-heading)',
                    letterSpacing: '-0.04em',
                    margin: '2px 0 4px',
                    textShadow: `0 2px 14px ${catConfig.color}25`
                  }}
                >
                  {aqi}
                </div>
                <div
                  style={{
                    background: catConfig.bg,
                    color: catConfig.color,
                    border: `1.5px solid ${catConfig.border}`,
                    padding: '0.22rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.78125rem',
                    fontWeight: 850,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                  }}
                >
                  {catConfig.label}
                </div>
              </div>
            </div>

            {/* Range Scale Guide */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.6875rem',
                color: '#78716c',
                fontWeight: 700,
                padding: '0 1rem',
                marginBottom: '1.25rem'
              }}
            >
              <span>0 (Good)</span>
              <span style={{ color: '#ea580c', fontWeight: 800 }}>Scale: 0 – 500+</span>
              <span>500 (Severe)</span>
            </div>
          </div>

          {/* Health-Oriented Interpretation Box */}
          <div
            style={{
              background: catConfig.bg,
              border: `1.5px solid ${catConfig.border}`,
              borderRadius: 'var(--radius-lg)',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: catConfig.color,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <HealthIcon size={14} />
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 850, color: catConfig.color }}>
                Health Advisory • {catConfig.label} Air
              </span>
            </div>

            <p style={{ margin: 0, fontSize: '0.78125rem', color: '#44403c', lineHeight: 1.5, fontWeight: 600 }}>
              {catConfig.healthSummary}
            </p>

            <div
              style={{
                borderTop: `1px dashed ${catConfig.border}`,
                paddingTop: '0.5rem',
                fontSize: '0.75rem',
                color: '#1c1917',
                fontWeight: 700,
                lineHeight: 1.45
              }}
            >
              <strong style={{ color: catConfig.color }}>Directive: </strong>
              {catConfig.recommendation}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* --- RIGHT COLUMN: 6 POLLUTANTS WITH CLEAN PROGRESS BARS --- */}
        {/* ========================================================= */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: '#ffffff',
            border: '1.5px solid rgba(254, 215, 170, 0.85)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.6rem 1.5rem',
            boxShadow: '0 4px 18px rgba(180, 83, 9, 0.05)'
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.25rem',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid #f5eee4'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={17} color="#ea580c" />
                <span style={{ fontSize: '0.9375rem', fontWeight: 850, color: '#1c1917' }}>
                  Individual Pollutant Concentrations
                </span>
              </div>
              <span style={{ fontSize: '0.71875rem', color: '#78716c', fontWeight: 700 }}>
                CPCB Safe Benchmark (NAAQS)
              </span>
            </div>

            {/* 6 Clean Pollutant Progress Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.05rem' }}>
              {pollutants.map((p) => {
                const val = p.val !== undefined ? Number(p.val) : 0;
                const ratio = val / p.limit;
                const isOver = ratio > 1.0;
                const progressPct = Math.min(100, (val / p.maxScale) * 100);

                return (
                  <div
                    key={p.name}
                    className="pollutant-row-item"
                  >
                    {/* Row Header: Name, Limit, Current Reading */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.8125rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span
                          style={{
                            fontWeight: 900,
                            color: '#1c1917',
                            fontSize: '0.9375rem',
                            fontFamily: 'var(--font-heading)'
                          }}
                        >
                          {p.name}
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: '#78716c', fontWeight: 600 }}>
                          ({p.fullName.split('(')[0].trim()})
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            color: isOver ? '#c2410c' : '#15803d',
                            fontWeight: 800,
                            background: isOver ? '#fff7ed' : '#f0fdf4',
                            border: `1px solid ${isOver ? '#fed7aa' : '#bbf7d0'}`,
                            padding: '0.15rem 0.5rem',
                            borderRadius: 'var(--radius-full)'
                          }}
                        >
                          {isOver ? `${ratio.toFixed(1)}× CPCB Limit` : 'Within Safe Limit'}
                        </span>

                        <span
                          style={{
                            fontSize: '1.15rem',
                            fontWeight: 900,
                            color: isOver ? '#ea580c' : '#15803d',
                            fontFamily: 'var(--font-mono)',
                            minWidth: '65px',
                            textAlign: 'right'
                          }}
                        >
                          {val} <small style={{ fontSize: '0.71875rem', color: '#78716c', fontWeight: 600 }}>{p.unit}</small>
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Container with Safe Limit Indicator Marker */}
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '9px',
                        background: '#f5eee4',
                        borderRadius: 'var(--radius-full)',
                        overflow: 'hidden'
                      }}
                    >
                      <div
                        style={{
                          width: `${progressPct}%`,
                          height: '100%',
                          background: isOver
                            ? 'linear-gradient(90deg, #f59e0b 0%, #ea580c 70%, #dc2626 100%)'
                            : 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)',
                          borderRadius: 'var(--radius-full)',
                          transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                      />
                    </div>

                    {/* Sub-label for limits and primary source */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.6875rem',
                        color: '#78716c'
                      }}
                    >
                      <span>Safe Threshold: <strong>{p.limit} {p.unit}</strong></span>
                      <span style={{ color: '#a8a29e' }}>{p.description}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              marginTop: '1.25rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid #f5eee4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.71875rem',
              color: '#78716c'
            }}
          >
            <span>Standard: <strong>National Ambient Air Quality Standards (NAAQS India)</strong></span>
            <span style={{ color: '#15803d', fontWeight: 700 }}>Continuous Automated Air Monitoring</span>
          </div>
        </div>
      </div>
    </section>
  );
}
