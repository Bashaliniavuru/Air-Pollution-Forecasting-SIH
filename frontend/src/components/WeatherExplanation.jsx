import React from 'react';
import {
  Wind,
  Compass,
  Droplets,
  Thermometer,
  CloudRain,
  Gauge,
  Layers,
  Zap,
  Sliders,
  Info,
  Sparkles,
  HelpCircle,
  Activity,
  ArrowRight
} from 'lucide-react';

export default function WeatherExplanation({
  station,
  forecastResult,
  simWind,
  setSimWind,
  simPbl,
  setSimPbl,
  onRecalculate,
  loading
}) {
  if (!station) return null;

  const currentWind = simWind !== undefined ? simWind : (station.wind_speed_kmh !== undefined ? station.wind_speed_kmh : 5.8);
  const currentPbl = simPbl !== undefined ? simPbl : (station.pbl_height_m !== undefined ? station.pbl_height_m : 410.0);
  const humidity = station.humidity_pct !== undefined ? station.humidity_pct : 78.0;
  const temp = station.temperature_c !== undefined ? station.temperature_c : 19.0;
  const rainfall = station.rainfall_mm !== undefined ? station.rainfall_mm : 0.0;
  const pressure = station.pressure_hpa !== undefined ? station.pressure_hpa : 1014.0;
  const windDir = station.wind_direction_deg !== undefined ? station.wind_direction_deg : 295.0;

  const getWindCardinal = (deg) => {
    if (deg === undefined || deg === null || isNaN(deg)) return 'NW';
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const idx = Math.round(Number(deg) / 22.5) % 16;
    return directions[idx] || 'NW';
  };

  // Calculated ventilation index = Wind Speed (m/s) * PBL (m)
  const ventIndex = Math.round(((Number(currentWind) * 1000) / 3600) * Number(currentPbl));
  const ventQuality = ventIndex < 1000 ? 'Low Ventilation • Reduced Dispersion' : ventIndex < 2500 ? 'Moderate Ventilation' : 'Active Atmospheric Dispersion';
  const ventColor = ventIndex < 1000 ? '#dc2626' : ventIndex < 2500 ? '#d97706' : '#16a34a';

  const inversionRisk = (Number(currentPbl) < 500 && Number(currentWind) < 7.0) ? 'HIGH' : Number(currentPbl) < 800 ? 'MODERATE' : 'LOW';
  const inversionColor = inversionRisk === 'HIGH' ? '#dc2626' : inversionRisk === 'MODERATE' ? '#d97706' : '#16a34a';

  // 6 Core Meteorological Coupling Drivers with Scientifically Cautious Phrasing
  const couplingFactors = [
    {
      id: 'factor-wind-speed',
      title: 'Wind Speed & Horizontal Transport',
      liveValue: `${currentWind} km/h`,
      statusPill: currentWind < 8 ? 'Low Dispersion Regime' : 'Active Transport',
      icon: <Wind size={20} color="#ea580c" />,
      themeColor: '#ea580c',
      badgeBg: '#fff7ed',
      badgeBorder: '#fed7aa',
      cautiousExplanation:
        'Low wind conditions may reduce pollutant dispersion. When horizontal surface airflow drops, local vehicular and combustion emissions tend to concentrate near the breathing layer rather than diluting downwind.'
    },
    {
      id: 'factor-wind-direction',
      title: 'Wind Direction & Regional Plumes',
      liveValue: `${getWindCardinal(windDir)} (${windDir}°)`,
      statusPill: 'North-Westerly Vector',
      icon: <Compass size={20} color="#7c3aed" />,
      themeColor: '#7c3aed',
      badgeBg: '#f5f3ff',
      badgeBorder: '#ddd6fe',
      cautiousExplanation:
        'Wind direction can influence the transport pathway of regional air masses. In Delhi-NCR, north-westerly wind trajectories are frequently associated with incoming upwind agricultural, biomass, and regional industrial plumes.'
    },
    {
      id: 'factor-humidity',
      title: 'Humidity & Aerosol Behaviour',
      liveValue: `${humidity}%`,
      statusPill: humidity > 75 ? 'Elevated Moisture' : 'Moderate Moisture',
      icon: <Droplets size={20} color="#0891b2" />,
      themeColor: '#0891b2',
      badgeBg: '#ecfeff',
      badgeBorder: '#a5f3fc',
      cautiousExplanation:
        'Humidity can influence particulate behaviour. Elevated moisture levels promote the hygroscopic swelling of fine particles and can facilitate secondary particulate formation from gaseous precursors like NO₂ and SO₂.'
    },
    {
      id: 'factor-temperature',
      title: 'Temperature & Boundary Inversions',
      liveValue: `${temp}°C`,
      statusPill: temp < 20 ? 'Nocturnal Cooling Layer' : 'Thermal Profile',
      icon: <Thermometer size={20} color="#d97706" />,
      themeColor: '#d97706',
      badgeBg: '#fffbeb',
      badgeBorder: '#fde68a',
      cautiousExplanation:
        'Cool surface temperatures, especially during evening and pre-dawn hours, can contribute to thermal inversion layers where cool surface air is trapped beneath warmer air aloft, limiting vertical mixing volume.'
    },
    {
      id: 'factor-rainfall',
      title: 'Rainfall & Wet Particulate Scavenging',
      liveValue: `${rainfall} mm`,
      statusPill: rainfall > 0 ? 'Active Washout' : 'Dry Period (No Washout)',
      icon: <CloudRain size={20} color="#0284c7" />,
      themeColor: '#0284c7',
      badgeBg: '#eff6ff',
      badgeBorder: '#bfdbfe',
      cautiousExplanation:
        'Rainfall can be associated with changes in particulate concentrations. Precipitation mechanically removes suspended particulates through wet scavenging, whereas prolonged dry conditions allow particulates to persist.'
    },
    {
      id: 'factor-pressure',
      title: 'Atmospheric Pressure & Stability',
      liveValue: `${pressure} hPa`,
      statusPill: pressure > 1013 ? 'High Pressure Ridge' : 'Surface Gradient',
      icon: <Gauge size={20} color="#c2410c" />,
      themeColor: '#c2410c',
      badgeBg: '#fff7ed',
      badgeBorder: '#fed7aa',
      cautiousExplanation:
        'High atmospheric pressure regimes are often characterized by stable, sinking air (subsidence) and low wind velocities, which can suppress vertical air convection and contribute to localized pollution retention.'
    }
  ];

  return (
    <section
      id="why-pollution-changing-section"
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
      {/* ========================================================================= */}
      {/* 1. SECTION HEADER: "Why is Air Quality Changing?"                         */}
      {/* ========================================================================= */}
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
              <HelpCircle size={17} />
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
              Why is Air Quality Changing?
            </h2>
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#78716c', fontWeight: 600 }}>
            Understanding the physics of weather-pollution coupling across Delhi-NCR atmospheric variables
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.75rem',
              fontWeight: 800,
              color: '#c2410c',
              background: '#fff7ed',
              padding: '0.3rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid #fed7aa'
            }}
          >
            <Sparkles size={12} color="#ea580c" />
            <span>Weather-Coupled Physics Engine</span>
          </span>
        </div>
      </div>

      {/* Core Principle Callout Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #fffbf5 0%, #fff7ed 100%)',
          border: '1.5px solid #fed7aa',
          borderRadius: 'var(--radius-xl)',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.6rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem',
          boxShadow: '0 4px 16px rgba(180, 83, 9, 0.04)'
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 3px 10px rgba(234, 88, 12, 0.25)'
          }}
        >
          <Activity size={20} />
        </div>

        <div>
          <h4 style={{ fontSize: '0.9375rem', fontWeight: 850, color: '#9a3412', margin: '0 0 0.25rem' }}>
            Pollution is Never Constant — It Is Actively Coupled to the Atmosphere
          </h4>
          <p style={{ fontSize: '0.8125rem', color: '#44403c', lineHeight: 1.55, margin: 0, fontWeight: 500 }}>
            Air pollution levels do not depend solely on emission rates. Local weather conditions govern whether pollutants disperse safely across the atmosphere or become trapped close to the ground. Our coupled machine learning models analyze these interactions in real-time.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. 6 INTERACTIVE WEATHER-COUPLING CARDS                                   */}
      {/* ========================================================================= */}
      <div
        id="weather-coupling-6cards-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.6rem'
        }}
      >
        {couplingFactors.map((factor) => (
          <div
            key={factor.id}
            id={factor.id}
            className="weather-coupling-card"
            style={{
              background: '#ffffff',
              border: '1.5px solid rgba(254, 215, 170, 0.85)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.35rem 1.4rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 2px 12px rgba(180, 83, 9, 0.03)',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div>
              {/* Card Header: Icon, Title, Live Value */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: factor.badgeBg,
                      border: `1px solid ${factor.badgeBorder}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {factor.icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 850, color: '#1c1917', margin: 0, lineHeight: 1.25 }}>
                      {factor.title.split('&')[0].trim()}
                    </h3>
                    <span style={{ fontSize: '0.6875rem', color: '#78716c', fontWeight: 600 }}>
                      {factor.title.includes('&') ? factor.title.split('&')[1].trim() : 'Coupling Driver'}
                    </span>
                  </div>
                </div>

                {/* Live Value Pill */}
                <span
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 900,
                    color: factor.themeColor,
                    fontFamily: 'var(--font-mono)',
                    background: factor.badgeBg,
                    border: `1px solid ${factor.badgeBorder}`,
                    padding: '0.2rem 0.55rem',
                    borderRadius: 'var(--radius-md)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {factor.liveValue}
                </span>
              </div>

              {/* Scientifically Cautious Explanation */}
              <p
                style={{
                  fontSize: '0.78125rem',
                  color: '#44403c',
                  lineHeight: 1.55,
                  margin: '0.5rem 0',
                  fontWeight: 500
                }}
              >
                {factor.cautiousExplanation}
              </p>
            </div>

            {/* Bottom Status Tag */}
            <div
              style={{
                borderTop: '1px solid #fbf3e8',
                paddingTop: '0.6rem',
                marginTop: '0.6rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.6875rem'
              }}
            >
              <span style={{ color: '#78716c', fontWeight: 600 }}>Current Atmospheric State:</span>
              <span style={{ color: factor.themeColor, fontWeight: 800 }}>{factor.statusPill}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 3. DIAGNOSTIC DISPERSION SUMMARY BAR                                      */}
      {/* ========================================================================= */}
      <div
        id="dispersion-diagnostic-bar"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          background: '#fffbf5',
          border: '1.5px solid #fed7aa',
          padding: '1.25rem 1.4rem',
          borderRadius: 'var(--radius-xl)',
          marginBottom: '1.6rem'
        }}
      >
        <div>
          <div style={{ fontSize: '0.71875rem', color: '#78716c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Ventilation Index ($V_i$)
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 950, color: ventColor, fontFamily: 'var(--font-mono)', margin: '2px 0' }}>
            {ventIndex} <small style={{ fontSize: '0.75rem' }}>m²/s</small>
          </div>
          <div style={{ fontSize: '0.75rem', color: ventColor, fontWeight: 800 }}>
            {ventQuality}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.71875rem', color: '#78716c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Thermal Inversion Risk
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 950, color: inversionColor, fontFamily: 'var(--font-heading)', margin: '2px 0' }}>
            {inversionRisk} RISK
          </div>
          <div style={{ fontSize: '0.75rem', color: '#78716c', fontWeight: 700 }}>
            Boundary mixing depth: <strong>{currentPbl} m</strong>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.71875rem', color: '#78716c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Model Stagnation Multiplier
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 950, color: '#ea580c', fontFamily: 'var(--font-mono)', margin: '2px 0' }}>
            {forecastResult?.stagnation_multiplier || 1.6}×
          </div>
          <div style={{ fontSize: '0.75rem', color: '#78716c', fontWeight: 700 }}>
            Cumulative meteorological weighting
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. INTERACTIVE "WHAT-IF" SIMULATION SLIDERS                              */}
      {/* ========================================================================= */}
      <div
        id="what-if-meteorological-simulator"
        style={{
          background: '#ffffff',
          border: '1.5px dashed #fed7aa',
          borderRadius: 'var(--radius-xl)',
          padding: '1.35rem 1.5rem',
          boxShadow: '0 2px 10px rgba(180, 83, 9, 0.02)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sliders size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 850, color: '#1c1917', margin: 0 }}>
                Interactive "What-If" Weather Coupling Simulator
              </h3>
              <span style={{ fontSize: '0.71875rem', color: '#78716c' }}>
                Simulate how shifting wind speeds and boundary layer heights alter air pollution dispersion
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78125rem', marginBottom: '0.45rem' }}>
              <span style={{ color: '#1c1917', fontWeight: 750 }}>Simulated Wind Speed</span>
              <span style={{ color: '#ea580c', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>{currentWind} km/h</span>
            </div>
            <input
              id="slider-wind-speed"
              type="range"
              min="1"
              max="25"
              step="0.5"
              value={currentWind}
              onChange={(e) => setSimWind && setSimWind(Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer', accentColor: '#ea580c' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: '#78716c', marginTop: '4px' }}>
              <span>1 km/h (Calm Stagnation)</span>
              <span>25 km/h (Active Advection)</span>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78125rem', marginBottom: '0.45rem' }}>
              <span style={{ color: '#1c1917', fontWeight: 750 }}>Mixing Layer Height (PBL)</span>
              <span style={{ color: '#c2410c', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>{currentPbl} m</span>
            </div>
            <input
              id="slider-pbl-height"
              type="range"
              min="150"
              max="1500"
              step="25"
              value={currentPbl}
              onChange={(e) => setSimPbl && setSimPbl(Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer', accentColor: '#ea580c' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: '#78716c', marginTop: '4px' }}>
              <span>150 m (Winter Inversion)</span>
              <span>1500 m (Convective Lifting)</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            id="btn-recalculate-coupled-forecast"
            onClick={onRecalculate}
            className="btn-primary"
            disabled={loading}
            style={{
              padding: '0.65rem 1.5rem',
              fontSize: '0.8125rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Zap size={14} className={loading ? 'pulse-dot' : ''} />
            <span>{loading ? 'Re-evaluating Coupled Model...' : 'Simulate Model Response'}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
