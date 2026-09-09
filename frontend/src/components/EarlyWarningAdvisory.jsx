import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  HeartPulse,
  Users,
  Building2,
  BellRing,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Wind,
  Layers,
  Activity,
  ArrowRight,
  Info,
  Clock
} from 'lucide-react';

export default function EarlyWarningAdvisory({ station, forecastResult, currentAqi: propAqi }) {
  const currentAqi = station?.current_aqi !== undefined ? station.current_aqi : (propAqi !== undefined ? propAqi : 350);
  const projectedAqi = forecastResult?.forecast_aqi !== undefined
    ? forecastResult.forecast_aqi
    : Math.min(500, Math.round(currentAqi * 1.15));

  const aqiDelta = projectedAqi - currentAqi;
  const isRising = aqiDelta > 0;

  const windSpeed = station?.wind_speed_kmh !== undefined ? station.wind_speed_kmh : 5.8;
  const humidity = station?.humidity_pct !== undefined ? station.humidity_pct : 78.0;
  const pblHeight = station?.pbl_height_m !== undefined ? station.pbl_height_m : 410.0;
  const pm25 = station?.pm2_5 !== undefined ? station.pm2_5 : 195.0;
  const pm10 = station?.pm10 !== undefined ? station.pm10 : 310.0;
  const ventIndex = forecastResult?.ventilation_index_m2_s || (station?.ventilation_index ? station.ventilation_index : 660.8);
  const inversionRisk = forecastResult?.thermal_inversion_risk || (pblHeight < 500 && windSpeed < 7 ? 'HIGH' : 'MODERATE');

  // =========================================================================
  // Deterministic 4-Tier Risk Assessment Logic based on real telemetry & model
  // =========================================================================
  let riskLevel = 'SEVERE';
  let riskTheme = {
    badge: 'SEVERE POLLUTION RISK',
    icon: ShieldAlert,
    color: '#991b1b',
    border: '#fecdd3',
    bg: '#fef2f2',
    accentBg: '#fee2e2',
    bannerGradient: 'linear-gradient(135deg, #fff5f5 0%, #fef2f2 100%)',
    expectedCondition: 'Extreme air pollution accumulation and severe atmospheric stagnation expected in the coming hours.',
    reason: `Current AQI (${currentAqi}) and projected AQI (${projectedAqi}) indicate hazardous particulate concentrations (PM2.5: ${pm25} µg/m³). Calm surface winds (${windSpeed} km/h) and a compressed boundary layer (${pblHeight}m) prevent natural dispersion.`,
    sensitiveAction: 'Strictly avoid all outdoor activity. Operate indoor HEPA purifiers continuously and keep prescribed respiratory medications readily accessible.',
    publicAction: 'Mandatory N95/N99 respirator masking outdoors. Suspend outdoor workouts and maximize electric transit / Delhi Metro over private vehicles.',
    regulatoryAction: 'Enforce Graded Response Action Plan (GRAP) Stage 3/4 emergency measures: intensify mechanized road sweeping, mist cannons, and halt non-essential diesel generators.'
  };

  if (projectedAqi <= 100 && currentAqi <= 100) {
    riskLevel = 'LOW';
    riskTheme = {
      badge: 'LOW POLLUTION RISK',
      icon: CheckCircle2,
      color: '#15803d',
      border: '#bbf7d0',
      bg: '#f0fdf4',
      accentBg: '#dcfce7',
      bannerGradient: 'linear-gradient(135deg, #fafffa 0%, #f0fdf4 100%)',
      expectedCondition: 'Favorable atmospheric dispersion conditions with minimal pollutant accumulation risk.',
      reason: `Current AQI (${currentAqi}) is within satisfactory thresholds. Active surface winds (${windSpeed} km/h) and adequate boundary layer volume (${pblHeight}m) facilitate continuous natural atmospheric dilution.`,
      sensitiveAction: 'Air quality is suitable for normal outdoor recreational activities and room ventilation.',
      publicAction: 'No health restrictions required. Maintain eco-friendly transit and routine environmental awareness.',
      regulatoryAction: 'Standard routine air quality monitoring and preventive dust management protocols in effect.'
    };
  } else if (projectedAqi <= 200 && currentAqi <= 200) {
    riskLevel = 'MODERATE';
    riskTheme = {
      badge: 'MODERATE POLLUTION RISK',
      icon: AlertTriangle,
      color: '#d97706',
      border: '#fde68a',
      bg: '#fffbeb',
      accentBg: '#fef3c7',
      bannerGradient: 'linear-gradient(135deg, #fffdfa 0%, #fffbeb 100%)',
      expectedCondition: 'Moderate air quality fluctuations expected with localized evening accumulation.',
      reason: `Current AQI (${currentAqi}) with moderate atmospheric mixing. Evening thermal changes and commuter traffic may cause temporary particulate retention near high-density corridors.`,
      sensitiveAction: 'Individuals with respiratory conditions or asthma should take more breaks during prolonged outdoor exertion.',
      publicAction: 'Avoid strenuous outdoor activities near busy traffic junctions during peak evening hours.',
      regulatoryAction: 'Enforce GRAP Stage 1 measures: mechanized sweeping of dust-prone roads and strict anti-dust compliance at building sites.'
    };
  } else if (projectedAqi <= 350 && currentAqi <= 350) {
    riskLevel = 'HIGH';
    riskTheme = {
      badge: 'HIGH POLLUTION RISK',
      icon: AlertTriangle,
      color: '#ea580c',
      border: '#fed7aa',
      bg: '#fff7ed',
      accentBg: '#ffedd5',
      bannerGradient: 'linear-gradient(135deg, #fffaf5 0%, #fff7ed 100%)',
      expectedCondition: 'Elevated pollution conditions may occur in the coming hours.',
      reason: `Projected AQI is trending toward ${projectedAqi} (${isRising ? `+${aqiDelta} increase over baseline` : 'persistent high load'}). High atmospheric humidity (${humidity}%) and limited ventilation (${Math.round(ventilationIndex)} m²/s) exacerbate fine particulate buildup.`,
      sensitiveAction: 'Limit prolonged outdoor physical exertion. Wear certified particulate masks (N95) and utilize indoor air filtration.',
      publicAction: 'Avoid morning and late-night outdoor jogging. Use public transit and avoid open burning of garden or domestic waste.',
      regulatoryAction: 'Enforce GRAP Stage 2 measures: deploy water sprinklers, intensify mechanized vacuum sweeping, and strictly monitor industrial emissions.'
    };
  }

  const RiskIcon = riskTheme.icon;

  return (
    <section
      id="early-warning-section"
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
        position: 'relative'
      }}
    >
      {/* ========================================================================= */}
      {/* 1. SECTION HEADER: Title, Early Warning Agent Beacon, Grounding Info      */}
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
                background: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 10px rgba(220, 38, 38, 0.25)'
              }}
            >
              <BellRing size={17} />
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
              Early Warning & Risk Advisory
            </h2>
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#78716c', fontWeight: 600 }}>
            Proactive risk intelligence synthesized from live meteorological coupled indicators & 24h predictive trajectory
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span
            style={{
              padding: '0.3rem 0.8rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.71875rem',
              fontWeight: 850,
              background: riskTheme.bg,
              border: `1.5px solid ${riskTheme.border}`,
              color: riskTheme.color,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span className="pulse-dot" style={{ width: '7px', height: '7px', background: riskTheme.color }}></span>
            <span>Early Warning Agent Active</span>
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PRIMARY EARLY WARNING CARD: Risk Level • Expected Condition • Reason  */}
      {/* ========================================================================= */}
      <div
        id="primary-early-warning-alert-card"
        style={{
          background: riskTheme.bannerGradient,
          border: `2px solid ${riskTheme.border}`,
          borderRadius: 'var(--radius-xl)',
          padding: '1.5rem 1.6rem',
          marginBottom: '1.6rem',
          boxShadow: `0 8px 24px ${riskTheme.color}14`,
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1.25rem'
        }}
      >
        {/* Risk Icon Badge */}
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: riskTheme.accentBg,
            color: riskTheme.color,
            border: `1.5px solid ${riskTheme.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
          }}
        >
          <RiskIcon size={28} />
        </div>

        <div style={{ flex: 1 }}>
          {/* Header Row: Headline Risk Level Badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span
                id="badge-risk-level-tag"
                style={{
                  fontSize: '0.78125rem',
                  fontWeight: 900,
                  color: '#ffffff',
                  background: riskTheme.color,
                  padding: '0.25rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  letterSpacing: '0.04em',
                  boxShadow: `0 2px 8px ${riskTheme.color}35`
                }}
              >
                ⚠️ {riskTheme.badge}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#78716c', fontWeight: 700 }}>
                Target Location: <strong>{station?.station_name || 'Delhi NCT'}</strong>
              </span>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#78716c', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={13} />
              <span>Forecast Horizon: <strong>Next 24 Hours</strong></span>
            </div>
          </div>

          {/* Expected Condition */}
          <div
            style={{
              fontSize: '1.1875rem',
              fontWeight: 900,
              color: '#1c1917',
              fontFamily: 'var(--font-heading)',
              letterSpacing: '-0.01em',
              marginBottom: '0.45rem',
              lineHeight: 1.3
            }}
          >
            “{riskTheme.expectedCondition}”
          </div>

          {/* Reason (Data-Grounded Scientific Coupling) */}
          <div
            style={{
              fontSize: '0.84375rem',
              color: '#44403c',
              lineHeight: 1.6,
              background: 'rgba(255, 255, 255, 0.75)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-lg)',
              border: `1px solid ${riskTheme.border}`,
              marginTop: '0.65rem'
            }}
          >
            <strong style={{ color: riskTheme.color }}>Analytical Reason: </strong>
            <span>{riskTheme.reason}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. 5-FACTOR COUPLED RISK BREAKDOWN MATRIX                                 */}
      {/* ========================================================================= */}
      <div
        id="risk-factors-breakdown-5grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '1.6rem'
        }}
      >
        {/* Factor 1: Current AQI */}
        <div
          style={{
            background: '#ffffff',
            border: '1.5px solid rgba(254, 215, 170, 0.85)',
            borderRadius: 'var(--radius-xl)',
            padding: '1rem 1.15rem'
          }}
        >
          <div style={{ fontSize: '0.71875rem', fontWeight: 800, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            1. Current AQI
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 950, color: '#ea580c', fontFamily: 'var(--font-heading)', margin: '2px 0' }}>
            {currentAqi}
          </div>
          <div style={{ fontSize: '0.71875rem', color: '#78716c', fontWeight: 600 }}>
            {station?.category ? station.category.replace('_', ' ') : 'Observed Base'}
          </div>
        </div>

        {/* Factor 2: Predicted AQI */}
        <div
          style={{
            background: '#ffffff',
            border: '1.5px solid rgba(254, 215, 170, 0.85)',
            borderRadius: 'var(--radius-xl)',
            padding: '1rem 1.15rem'
          }}
        >
          <div style={{ fontSize: '0.71875rem', fontWeight: 800, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            2. Predicted AQI
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 950, color: riskTheme.color, fontFamily: 'var(--font-heading)', margin: '2px 0' }}>
            {projectedAqi}
          </div>
          <div style={{ fontSize: '0.71875rem', color: '#78716c', fontWeight: 600 }}>
            24h Coupled Target
          </div>
        </div>

        {/* Factor 3: AQI Trend */}
        <div
          style={{
            background: '#ffffff',
            border: '1.5px solid rgba(254, 215, 170, 0.85)',
            borderRadius: 'var(--radius-xl)',
            padding: '1rem 1.15rem'
          }}
        >
          <div style={{ fontSize: '0.71875rem', fontWeight: 800, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            3. AQI Trend
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 950, color: isRising ? '#dc2626' : '#16a34a', fontFamily: 'var(--font-heading)', margin: '2px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {isRising ? `+${aqiDelta}` : aqiDelta}
            {isRising ? <TrendingUp size={18} color="#dc2626" /> : <TrendingDown size={18} color="#16a34a" />}
          </div>
          <div style={{ fontSize: '0.71875rem', color: isRising ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
            {isRising ? 'Accumulating' : 'Dispersing'}
          </div>
        </div>

        {/* Factor 4: Weather Conditions */}
        <div
          style={{
            background: '#ffffff',
            border: '1.5px solid rgba(254, 215, 170, 0.85)',
            borderRadius: 'var(--radius-xl)',
            padding: '1rem 1.15rem'
          }}
        >
          <div style={{ fontSize: '0.71875rem', fontWeight: 800, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            4. Weather Coupling
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0369a1', fontFamily: 'var(--font-heading)', margin: '4px 0 2px' }}>
            {windSpeed} km/h • {Math.round(pblHeight)}m
          </div>
          <div style={{ fontSize: '0.71875rem', color: '#78716c', fontWeight: 600 }}>
            Inversion: <strong style={{ color: riskTheme.color }}>{inversionRisk}</strong>
          </div>
        </div>

        {/* Factor 5: Pollution Conditions */}
        <div
          style={{
            background: '#ffffff',
            border: '1.5px solid rgba(254, 215, 170, 0.85)',
            borderRadius: 'var(--radius-xl)',
            padding: '1rem 1.15rem'
          }}
        >
          <div style={{ fontSize: '0.71875rem', fontWeight: 800, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            5. Particulate Load
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#ea580c', fontFamily: 'var(--font-heading)', margin: '4px 0 2px' }}>
            PM2.5: {pm25} µg/m³
          </div>
          <div style={{ fontSize: '0.71875rem', color: '#78716c', fontWeight: 600 }}>
            PM10: {pm10} µg/m³
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. PREVENTIVE RECOMMENDATIONS (Categorized Action Directives)             */}
      {/* ========================================================================= */}
      <div>
        <div style={{ marginBottom: '0.85rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 850, color: '#1c1917', margin: 0, fontFamily: 'var(--font-heading)' }}>
            Targeted Preventive Recommendations ({riskLevel} Protocol)
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#78716c' }}>
            Evidence-based directives tailored for sensitive individuals, general citizens, and municipal regulators
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem'
          }}
        >
          {/* Pillar 1: Sensitive Groups */}
          <div
            className="early-warning-directive-card"
            style={{
              background: '#fffbeb',
              border: '1.5px solid #fde68a',
              borderRadius: 'var(--radius-xl)',
              padding: '1.35rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
                <div style={{ padding: '0.4rem', borderRadius: '10px', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
                  <HeartPulse size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 850, color: '#92400e', margin: 0 }}>
                    1. Sensitive Individuals
                  </h4>
                  <span style={{ fontSize: '0.6875rem', color: '#b45309', fontWeight: 600 }}>Children, elderly, asthma/COPD patients</span>
                </div>
              </div>

              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#78350f', lineHeight: 1.6, fontWeight: 500 }}>
                {riskTheme.sensitiveAction}
              </p>
            </div>

            <div style={{ borderTop: '1px solid #fde68a', paddingTop: '0.55rem', marginTop: '0.75rem', fontSize: '0.71875rem', color: '#b45309', fontWeight: 700 }}>
              • High Vulnerability Advisory
            </div>
          </div>

          {/* Pillar 2: General Public */}
          <div
            className="early-warning-directive-card"
            style={{
              background: '#f0fdf4',
              border: '1.5px solid #bbf7d0',
              borderRadius: 'var(--radius-xl)',
              padding: '1.35rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
                <div style={{ padding: '0.4rem', borderRadius: '10px', background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>
                  <Users size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 850, color: '#166534', margin: 0 }}>
                    2. General Public
                  </h4>
                  <span style={{ fontSize: '0.6875rem', color: '#15803d', fontWeight: 600 }}>Commuters, residents, outdoor workers</span>
                </div>
              </div>

              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#14532d', lineHeight: 1.6, fontWeight: 500 }}>
                {riskTheme.publicAction}
              </p>
            </div>

            <div style={{ borderTop: '1px solid #bbf7d0', paddingTop: '0.55rem', marginTop: '0.75rem', fontSize: '0.71875rem', color: '#15803d', fontWeight: 700 }}>
              • Population-Wide Precaution
            </div>
          </div>

          {/* Pillar 3: Regulators & GRAP */}
          <div
            className="early-warning-directive-card"
            style={{
              background: '#fff7ed',
              border: '1.5px solid #fed7aa',
              borderRadius: 'var(--radius-xl)',
              padding: '1.35rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
                <div style={{ padding: '0.4rem', borderRadius: '10px', background: '#ffedd5', color: '#c2410c', border: '1px solid #fed7aa' }}>
                  <Building2 size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 850, color: '#9a3412', margin: 0 }}>
                    3. Regulatory Protocol (GRAP)
                  </h4>
                  <span style={{ fontSize: '0.6875rem', color: '#c2410c', fontWeight: 600 }}>Municipal compliance & pollution control</span>
                </div>
              </div>

              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#7c2d12', lineHeight: 1.6, fontWeight: 500 }}>
                {riskTheme.regulatoryAction}
              </p>
            </div>

            <div style={{ borderTop: '1px solid #fed7aa', paddingTop: '0.55rem', marginTop: '0.75rem', fontSize: '0.71875rem', color: '#c2410c', fontWeight: 700 }}>
              • Graded Response Action Protocol
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
