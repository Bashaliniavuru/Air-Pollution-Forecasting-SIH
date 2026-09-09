import React from 'react';
import {
  Thermometer,
  Droplets,
  Wind,
  Compass,
  Gauge,
  CloudRain,
  Sun,
  CloudSun,
  Cloud,
  Layers,
  Activity,
  MapPin,
  Sparkles,
  Info
} from 'lucide-react';

export default function WeatherConditionsCard({ station }) {
  if (!station) {
    return (
      <div className="white-card" style={{ padding: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>Weather telemetry currently unavailable.</p>
      </div>
    );
  }

  // 1. Temperature
  const hasTemp = station.temperature_c !== undefined && station.temperature_c !== null;
  const tempVal = hasTemp ? `${station.temperature_c}°C` : 'Not available';

  // Weather condition determination based on live meteorology
  const getWeatherConditionInfo = () => {
    if (!hasTemp) {
      return { condition: 'Not available', icon: CloudSun, color: '#78716c', bg: '#f5f5f4', border: '#e7e5e4' };
    }
    const temp = station.temperature_c;
    const rain = station.rainfall_mm;
    const hum = station.humidity_pct;
    const wind = station.wind_speed_kmh;

    if (rain !== undefined && rain !== null && rain > 0) {
      return {
        condition: 'Active Precipitation / Rain',
        icon: CloudRain,
        color: '#0284c7',
        bg: '#eff6ff',
        border: '#bfdbfe',
        desc: 'Atmospheric wet scavenging in effect'
      };
    }
    if (hum !== undefined && hum !== null && hum > 75 && temp < 20) {
      return {
        condition: 'Hazy Mist & Boundary Inversion',
        icon: CloudSun,
        color: '#d97706',
        bg: '#fffbeb',
        border: '#fde68a',
        desc: 'High relative humidity trapping fine particulates'
      };
    }
    if (temp >= 32) {
      return {
        condition: 'Sunny & Hot Ambient Layer',
        icon: Sun,
        color: '#ea580c',
        bg: '#fff7ed',
        border: '#fed7aa',
        desc: 'Strong solar radiation driving photochemical ozone'
      };
    }
    if (temp >= 22) {
      return {
        condition: 'Warm & Clear Sky',
        icon: Sun,
        color: '#ea580c',
        bg: '#fff7ed',
        border: '#fed7aa',
        desc: 'Active solar convection layer'
      };
    }
    if (temp >= 15) {
      return {
        condition: 'Mild / Partly Cloudy',
        icon: CloudSun,
        color: '#d97706',
        bg: '#fffbeb',
        border: '#fde68a',
        desc: 'Moderate boundary layer thermal gradient'
      };
    }
    return {
      condition: 'Cool Surface Layer & Low Inversion',
      icon: Cloud,
      color: '#0891b2',
      bg: '#ecfeff',
      border: '#a5f3fc',
      desc: 'Nocturnal cooling promotes stable stagnation'
    };
  };

  const weatherCond = getWeatherConditionInfo();
  const ConditionIcon = weatherCond.icon;

  // 2. Humidity
  const hasHumidity = station.humidity_pct !== undefined && station.humidity_pct !== null;
  const humidityVal = hasHumidity ? `${station.humidity_pct}%` : 'Not available';

  // 3. Wind Speed
  const hasWindSpeed = station.wind_speed_kmh !== undefined && station.wind_speed_kmh !== null;
  const windSpeedVal = hasWindSpeed ? `${station.wind_speed_kmh} km/h` : 'Not available';

  // 4. Wind Direction
  const getWindCardinal = (deg) => {
    if (deg === undefined || deg === null || isNaN(deg)) return 'Not available';
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const idx = Math.round(Number(deg) / 22.5) % 16;
    return `${directions[idx] || 'NW'} (${deg}°)`;
  };
  const hasWindDir = station.wind_direction_deg !== undefined && station.wind_direction_deg !== null;
  const windDirVal = hasWindDir ? getWindCardinal(station.wind_direction_deg) : 'Not available';

  // 5. Rainfall
  const hasRainfall = station.rainfall_mm !== undefined && station.rainfall_mm !== null;
  const rainfallVal = hasRainfall ? `${station.rainfall_mm} mm` : 'Not available';

  // 6. Pressure
  const hasPressure = station.pressure_hpa !== undefined && station.pressure_hpa !== null;
  const pressureVal = hasPressure ? `${station.pressure_hpa} hPa` : 'Not available';

  // Weather parameters cards
  const weatherMetrics = [
    {
      id: 'weather-temp',
      title: 'Temperature',
      value: tempVal,
      isAvailable: hasTemp,
      subLabel: weatherCond.condition,
      icon: <Thermometer size={20} color="#ea580c" />,
      themeColor: '#ea580c',
      badgeBg: '#fff7ed',
      badgeBorder: '#fed7aa',
      note: 'Surface atmospheric thermal layer'
    },
    {
      id: 'weather-humidity',
      title: 'Humidity',
      value: humidityVal,
      isAvailable: hasHumidity,
      subLabel: hasHumidity
        ? (station.humidity_pct > 75
            ? 'High moisture • Accelerates aerosols'
            : station.humidity_pct < 45
            ? 'Dry air • Low hygroscopic growth'
            : 'Normal atmospheric moisture')
        : 'Telemetry unavailable',
      icon: <Droplets size={20} color="#0891b2" />,
      themeColor: '#0891b2',
      badgeBg: '#ecfeff',
      badgeBorder: '#a5f3fc',
      note: 'Relative atmospheric water vapor'
    },
    {
      id: 'weather-wind-speed',
      title: 'Wind Speed',
      value: windSpeedVal,
      isAvailable: hasWindSpeed,
      subLabel: hasWindSpeed
        ? (station.wind_speed_kmh < 8
            ? 'Calm stagnation (<8 km/h)'
            : 'Active horizontal dispersion')
        : 'Telemetry unavailable',
      icon: <Wind size={20} color="#0284c7" />,
      themeColor: '#0284c7',
      badgeBg: '#f0f9ff',
      badgeBorder: '#bae6fd',
      note: 'Horizontal air movement velocity'
    },
    {
      id: 'weather-wind-dir',
      title: 'Wind Direction',
      value: windDirVal,
      isAvailable: hasWindDir,
      subLabel: hasWindDir ? 'Dominant seasonal advection vector' : 'Telemetry unavailable',
      icon: <Compass size={20} color="#7c3aed" />,
      themeColor: '#7c3aed',
      badgeBg: '#f5f3ff',
      badgeBorder: '#ddd6fe',
      note: 'Direction from which the wind originates'
    },
    {
      id: 'weather-rainfall',
      title: 'Rainfall',
      value: rainfallVal,
      isAvailable: hasRainfall,
      subLabel: hasRainfall
        ? (station.rainfall_mm > 0
            ? 'Active wet particulate washout'
            : 'Zero precipitation (Dry accumulation)')
        : 'Telemetry unavailable',
      icon: <CloudRain size={20} color="#16a34a" />,
      themeColor: '#16a34a',
      badgeBg: '#f0fdf4',
      badgeBorder: '#bbf7d0',
      note: 'Precipitation depth for atmospheric scavenging'
    },
    {
      id: 'weather-pressure',
      title: 'Atmospheric Pressure',
      value: pressureVal,
      isAvailable: hasPressure,
      subLabel: hasPressure
        ? (station.pressure_hpa > 1013
            ? 'High pressure ridge • Stable air'
            : 'Low pressure gradient')
        : 'Telemetry unavailable',
      icon: <Gauge size={20} color="#d97706" />,
      themeColor: '#d97706',
      badgeBg: '#fffbeb',
      badgeBorder: '#fde68a',
      note: 'Barometric surface pressure (hPa)'
    }
  ];

  return (
    <section
      id="weather-conditions-card-section"
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
      {/* Header */}
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
                background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 10px rgba(234, 88, 12, 0.25)'
              }}
            >
              <Sun size={17} />
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
              Weather Conditions
            </h2>
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#78716c', fontWeight: 600 }}>
            Live meteorological parameters driving air pollution dispersion & accumulation in <strong>{station.station_name}</strong>
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
              color: '#15803d',
              background: '#f0fdf4',
              padding: '0.3rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid #bbf7d0'
            }}
          >
            <span className="pulse-dot" style={{ width: '7px', height: '7px', background: '#16a34a' }}></span>
            <span>Live Weather Feed</span>
          </span>
        </div>
      </div>

      {/* Main Feature Highlight: Ambient Condition Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #fffbf5 0%, #fff7ed 100%)',
          border: '1.5px solid #fed7aa',
          borderRadius: 'var(--radius-xl)',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 4px 16px rgba(180, 83, 9, 0.04)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: weatherCond.bg,
              border: `1.5px solid ${weatherCond.border}`,
              color: weatherCond.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
              flexShrink: 0
            }}
          >
            <ConditionIcon size={28} />
          </div>

          <div>
            <div style={{ fontSize: '0.71875rem', fontWeight: 800, color: '#9a3412', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Current Weather Condition
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1c1917', fontFamily: 'var(--font-heading)', margin: '1px 0' }}>
              {weatherCond.condition}
            </div>
            <div style={{ fontSize: '0.78125rem', color: '#78716c', fontWeight: 600 }}>
              {weatherCond.desc || 'Real-time boundary atmosphere status'}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            background: '#ffffff',
            padding: '0.65rem 1.15rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid #fed7aa'
          }}
        >
          <div>
            <div style={{ fontSize: '0.6875rem', color: '#78716c', fontWeight: 700 }}>Temperature</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 950, color: '#ea580c', fontFamily: 'var(--font-heading)' }}>
              {tempVal}
            </div>
          </div>
          <div style={{ width: '1px', height: '32px', background: '#fed7aa' }}></div>
          <div>
            <div style={{ fontSize: '0.6875rem', color: '#78716c', fontWeight: 700 }}>Humidity</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 950, color: '#0891b2', fontFamily: 'var(--font-heading)' }}>
              {humidityVal}
            </div>
          </div>
        </div>
      </div>

      {/* 6 Grid Metric Cards for Weather Parameters */}
      <div
        id="weather-parameters-6grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem'
        }}
      >
        {weatherMetrics.map((item) => (
          <div
            key={item.id}
            id={item.id}
            className="weather-metric-item-card"
            style={{
              background: '#ffffff',
              border: '1.5px solid rgba(254, 215, 170, 0.75)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.25rem 1.35rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 2px 10px rgba(180, 83, 9, 0.03)',
              cursor: 'default'
            }}
          >
            <div>
              {/* Card Top: Label & Icon */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <span
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 800,
                    color: '#44403c',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}
                >
                  {item.title}
                </span>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: item.badgeBg,
                    border: `1px solid ${item.badgeBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {item.icon}
                </div>
              </div>

              {/* Large Value */}
              <div
                style={{
                  fontSize: item.isAvailable ? '1.85rem' : '1.15rem',
                  fontWeight: 950,
                  color: item.isAvailable ? item.themeColor : '#78716c',
                  fontFamily: item.isAvailable ? 'var(--font-heading)' : 'var(--font-sans)',
                  lineHeight: 1.15,
                  margin: '0.35rem 0 0.45rem',
                  letterSpacing: '-0.02em'
                }}
              >
                {item.value}
              </div>

              {/* Dynamic Status / Interpretation */}
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 750,
                  color: item.isAvailable ? item.themeColor : '#a8a29e',
                  lineHeight: 1.35,
                  marginBottom: '0.5rem'
                }}
              >
                {item.subLabel}
              </div>
            </div>

            {/* Note / Descriptor */}
            <div
              style={{
                borderTop: '1px solid #fbf3e8',
                paddingTop: '0.5rem',
                marginTop: '0.5rem',
                fontSize: '0.6875rem',
                color: '#78716c',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>{item.note}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
