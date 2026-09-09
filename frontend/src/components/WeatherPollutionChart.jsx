import React, { useState, useMemo } from 'react';
import { Wind, Thermometer, Droplets, CloudRain, Activity, Layers, Filter } from 'lucide-react';

export default function WeatherPollutionChart({ station, forecastResult }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Metric visibility toggles
  const [showAqi, setShowAqi] = useState(true);
  const [showWind, setShowWind] = useState(true);
  const [showTemp, setShowTemp] = useState(true);
  const [showHumidity, setShowHumidity] = useState(true);
  const [showRain, setShowRain] = useState(true);

  const baseAqi = station?.current_aqi || 350;
  const baseTemp = station?.temperature_c || 18.2;
  const baseHumidity = station?.humidity_pct || 80.0;
  const baseWind = station?.wind_speed_kmh || 5.2;
  const targetAqi = forecastResult?.forecast_aqi || Math.round(baseAqi * 1.15);

  // Compute 9 synchronized hourly intervals across 24h (+0h, +3h, +6h, +9h, +12h, +15h, +18h, +21h, +24h)
  const seriesData = useMemo(() => {
    const baseDate = new Date();
    const intervals = [
      { h: 0, aqiMult: 1.00, tempDelta: 0.0, humDelta: 0.0, windMult: 1.00, rain: 0.0, tag: 'Daytime baseline' },
      { h: 3, aqiMult: 1.04, tempDelta: -1.8, humDelta: +4.0, windMult: 0.90, rain: 0.0, tag: 'Sunset surface cooling' },
      { h: 6, aqiMult: 1.10, tempDelta: -3.5, humDelta: +7.0, windMult: 0.75, rain: 0.0, tag: 'Evening traffic & calm winds' },
      { h: 9, aqiMult: 1.14, tempDelta: -5.0, humDelta: +9.5, windMult: 0.65, rain: 0.0, tag: 'Night thermal inversion begins' },
      { h: 12, aqiMult: 1.18, tempDelta: -6.2, humDelta: +12.0, windMult: 0.55, rain: 0.0, tag: 'Midnight boundary layer collapse' },
      { h: 15, aqiMult: 1.20, tempDelta: -6.8, humDelta: +13.5, windMult: 0.50, rain: 0.0, tag: 'Peak nocturnal stagnation' },
      { h: 18, aqiMult: 1.15, tempDelta: -5.5, humDelta: +10.0, windMult: 0.65, rain: 0.0, tag: 'Dawn ground inversion' },
      { h: 21, aqiMult: 1.08, tempDelta: -1.0, humDelta: +3.0, windMult: 0.95, rain: 0.0, tag: 'Morning solar heating & lift' },
      { h: 24, aqiMult: (targetAqi / baseAqi), tempDelta: +1.5, humDelta: -2.0, windMult: 1.10, rain: 0.0, tag: 'Coupled 24h forecast outlook' }
    ];

    return intervals.map((item, idx) => {
      const pointDate = new Date(baseDate.getTime() + item.h * 60 * 60 * 1000);
      const timeStr = pointDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const aqi = Math.min(500, Math.round(baseAqi * item.aqiMult));
      const temp = Number((baseTemp + item.tempDelta).toFixed(1));
      const humidity = Math.min(98, Math.max(30, Math.round(baseHumidity + item.humDelta)));
      const wind = Number((baseWind * item.windMult).toFixed(1));
      const rain = item.rain;

      let category = 'VERY_POOR';
      if (aqi <= 50) category = 'GOOD';
      else if (aqi <= 100) category = 'SATISFACTORY';
      else if (aqi <= 200) category = 'MODERATE';
      else if (aqi <= 300) category = 'POOR';
      else if (aqi <= 400) category = 'VERY_POOR';
      else category = 'SEVERE';

      return {
        index: idx,
        hour: item.h,
        time: timeStr,
        aqi,
        category,
        temp,
        humidity,
        wind,
        rain,
        tag: item.tag
      };
    });
  }, [baseAqi, baseTemp, baseHumidity, baseWind, targetAqi]);

  // Chart coordinate math
  const width = 800;
  const height = 300;
  const padding = { top: 25, right: 60, bottom: 45, left: 55 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  const getX = (idx) => padding.left + (idx / (seriesData.length - 1)) * graphWidth;

  // Normalized Y coordinate functions
  const getY_Aqi = (val) => padding.top + graphHeight - (val / 500) * graphHeight;
  const getY_Temp = (val) => padding.top + graphHeight - ((val - 5) / 30) * graphHeight;
  const getY_Hum = (val) => padding.top + graphHeight - (val / 100) * graphHeight;
  const getY_Wind = (val) => padding.top + graphHeight - (val / 25) * graphHeight;

  // Smooth bezier curve generator
  const createPath = (getYFunc, key) => {
    if (seriesData.length === 0) return '';
    let path = `M ${getX(0)},${getYFunc(seriesData[0][key])}`;
    for (let i = 0; i < seriesData.length - 1; i++) {
      const x0 = getX(i);
      const y0 = getYFunc(seriesData[i][key]);
      const x1 = getX(i + 1);
      const y1 = getYFunc(seriesData[i + 1][key]);
      const cx = (x0 + x1) / 2;
      path += ` C ${cx},${y0} ${cx},${y1} ${x1},${y1}`;
    }
    return path;
  };

  const aqiPath = useMemo(() => createPath(getY_Aqi, 'aqi'), [seriesData]);
  const tempPath = useMemo(() => createPath(getY_Temp, 'temp'), [seriesData]);
  const humPath = useMemo(() => createPath(getY_Hum, 'humidity'), [seriesData]);
  const windPath = useMemo(() => createPath(getY_Wind, 'wind'), [seriesData]);

  const activePoint = hoveredIndex !== null ? seriesData[hoveredIndex] : null;

  return (
    <div
      id="weather-pollution-chart-card"
      className="white-card"
      style={{
        marginBottom: '2rem',
        padding: '1.5rem',
        border: '1.5px solid var(--border-subtle)',
        background: '#ffffff',
        position: 'relative'
      }}
    >
      {/* Header & Metric Toggles */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={16} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Weather-Pollution Coupling Visualization
            </h3>
          </div>
          <p style={{ fontSize: '0.78125rem', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
            Simultaneous multi-parameter tracking: AQI, Temperature, Humidity, Wind Speed, and Rainfall dynamics.
          </p>
        </div>

        {/* Interactive Metric Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            id="toggle-metric-aqi"
            onClick={() => setShowAqi(!showAqi)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '0.3rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              border: `1.5px solid ${showAqi ? '#ea580c' : '#eeddc8'}`,
              background: showAqi ? '#fff7ed' : '#ffffff',
              color: showAqi ? '#c2410c' : '#78716c',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ea580c' }} />
            <span>AQI</span>
          </button>

          <button
            id="toggle-metric-wind"
            onClick={() => setShowWind(!showWind)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '0.3rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              border: `1.5px solid ${showWind ? '#0284c7' : '#eeddc8'}`,
              background: showWind ? '#f0f9ff' : '#ffffff',
              color: showWind ? '#0369a1' : '#78716c',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7' }} />
            <span>Wind</span>
          </button>

          <button
            id="toggle-metric-temp"
            onClick={() => setShowTemp(!showTemp)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '0.3rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              border: `1.5px solid ${showTemp ? '#d97706' : '#eeddc8'}`,
              background: showTemp ? '#fffbeb' : '#ffffff',
              color: showTemp ? '#b45309' : '#78716c',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d97706' }} />
            <span>Temp (°C)</span>
          </button>

          <button
            id="toggle-metric-humidity"
            onClick={() => setShowHumidity(!showHumidity)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '0.3rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              border: `1.5px solid ${showHumidity ? '#7c3aed' : '#eeddc8'}`,
              background: showHumidity ? '#f5f3ff' : '#ffffff',
              color: showHumidity ? '#6d28d9' : '#78716c',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7c3aed' }} />
            <span>Humidity (%)</span>
          </button>

          <button
            id="toggle-metric-rain"
            onClick={() => setShowRain(!showRain)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '0.3rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              border: `1.5px solid ${showRain ? '#2563eb' : '#eeddc8'}`,
              background: showRain ? '#eff6ff' : '#ffffff',
              color: showRain ? '#1d4ed8' : '#78716c',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }} />
            <span>Rainfall</span>
          </button>
        </div>
      </div>

      {/* SVG Chart Canvas */}
      <div style={{ position: 'relative', width: '100%', background: '#fdfbf7', borderRadius: 'var(--radius-lg)', padding: '0.5rem 0', border: '1px solid #eeddc8' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        >
          {/* Horizontal Grid lines */}
          {[0, 100, 200, 300, 400, 500].map((val) => {
            const y = getY_Aqi(val);
            return (
              <g key={val}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#f5eee4"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="#a8a29e"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Right Y-Axis label for Weather */}
          <text x={width - padding.right + 8} y={padding.top + 5} fill="#a8a29e" fontSize="9" fontFamily="var(--font-mono)">
            100% / 30°C / 25km/h
          </text>
          <text x={width - padding.right + 8} y={padding.top + graphHeight} fill="#a8a29e" fontSize="9" fontFamily="var(--font-mono)">
            0% / 5°C / 0km/h
          </text>

          {/* Rainfall bars */}
          {showRain && seriesData.map((pt) => {
            const x = getX(pt.index);
            const barH = pt.rain > 0 ? (pt.rain / 10) * 40 : 4;
            return (
              <rect
                key={`rain-${pt.index}`}
                x={x - 6}
                y={padding.top + graphHeight - barH}
                width={12}
                height={barH}
                fill="#2563eb"
                opacity={pt.rain > 0 ? 0.7 : 0.25}
                rx={2}
              />
            );
          })}

          {/* Humidity Line */}
          {showHumidity && (
            <path
              d={humPath}
              fill="none"
              stroke="#7c3aed"
              strokeWidth="2"
              strokeDasharray="4 3"
              opacity="0.85"
            />
          )}

          {/* Temperature Line */}
          {showTemp && (
            <path
              d={tempPath}
              fill="none"
              stroke="#d97706"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.9"
            />
          )}

          {/* Wind Speed Line */}
          {showWind && (
            <path
              d={windPath}
              fill="none"
              stroke="#0284c7"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}

          {/* AQI Line (Primary Orange) */}
          {showAqi && (
            <path
              d={aqiPath}
              fill="none"
              stroke="#ea580c"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* X Axis Timestamps & Active Crosshair */}
          {seriesData.map((pt) => {
            const x = getX(pt.index);
            const isHovered = hoveredIndex === pt.index;

            return (
              <g key={pt.index}>
                {isHovered && (
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={padding.top + graphHeight}
                    stroke="#ea580c"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    opacity="0.8"
                  />
                )}

                <text
                  x={x}
                  y={height - 18}
                  textAnchor="middle"
                  fill={isHovered ? '#ea580c' : '#78716c'}
                  fontSize={isHovered ? '11' : '10'}
                  fontWeight={isHovered ? '700' : '500'}
                  fontFamily="var(--font-mono)"
                >
                  {pt.hour === 0 ? 'Now' : `+${pt.hour}h`}
                </text>
                <text
                  x={x}
                  y={height - 5}
                  textAnchor="middle"
                  fill="#a8a29e"
                  fontSize="9"
                  fontFamily="var(--font-mono)"
                >
                  {pt.time}
                </text>

                {/* AQI node dot */}
                {showAqi && (
                  <circle
                    cx={x}
                    cy={getY_Aqi(pt.aqi)}
                    r={isHovered ? 5.5 : 3.5}
                    fill="#ea580c"
                    stroke="#ffffff"
                    strokeWidth={1.5}
                  />
                )}

                {/* Wind node dot */}
                {showWind && (
                  <circle
                    cx={x}
                    cy={getY_Wind(pt.wind)}
                    r={isHovered ? 4.5 : 2.5}
                    fill="#0284c7"
                    stroke="#ffffff"
                    strokeWidth={1}
                  />
                )}
              </g>
            );
          })}

          {/* Hover interaction targets */}
          {seriesData.map((pt, idx) => {
            const x = getX(idx);
            const stepW = graphWidth / (seriesData.length - 1);
            return (
              <rect
                key={`wp-hit-${idx}`}
                x={x - stepW / 2}
                y={padding.top}
                width={stepW}
                height={graphHeight}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIndex(idx)}
                onTouchStart={() => setHoveredIndex(idx)}
              />
            );
          })}
        </svg>

        {/* Unified Synchronized Tooltip */}
        {activePoint && (
          <div
            id="weather-pollution-tooltip"
            style={{
              position: 'absolute',
              top: '12px',
              left: `${Math.min(72, Math.max(12, (activePoint.index / (seriesData.length - 1)) * 100))}%`,
              transform: 'translateX(-50%)',
              background: 'rgba(255, 255, 255, 0.95)',
              border: '1.5px solid #fed7aa',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1.1rem',
              boxShadow: '0 8px 30px rgba(180, 83, 9, 0.15)',
              backdropFilter: 'blur(10px)',
              pointerEvents: 'none',
              zIndex: 30,
              minWidth: '240px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1c1917', fontFamily: 'var(--font-mono)' }}>
                {activePoint.hour === 0 ? 'Current Observation' : `+${activePoint.hour}h Forecast (${activePoint.time})`}
              </span>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: '#ea580c',
                  background: '#fff7ed',
                  padding: '0.15rem 0.45rem',
                  borderRadius: 'var(--radius-full)'
                }}
              >
                {activePoint.category}
              </span>
            </div>

            {/* Metrics Matrix */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', margin: '6px 0', fontSize: '0.78125rem' }}>
              <div style={{ color: '#ea580c', fontWeight: 700 }}>
                AQI: <span style={{ fontSize: '1rem', fontFamily: 'var(--font-heading)' }}>{activePoint.aqi}</span>
              </div>
              <div style={{ color: '#0284c7', fontWeight: 600 }}>
                Wind: <strong>{activePoint.wind} km/h</strong>
              </div>
              <div style={{ color: '#d97706', fontWeight: 600 }}>
                Temp: <strong>{activePoint.temp}°C</strong>
              </div>
              <div style={{ color: '#7c3aed', fontWeight: 600 }}>
                Humidity: <strong>{activePoint.humidity}%</strong>
              </div>
            </div>

            <div style={{ fontSize: '0.7rem', color: '#78716c', borderTop: '1px solid #f5eee4', paddingTop: '4px', marginTop: '6px' }}>
              🌪️ <em>{activePoint.tag}</em>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
