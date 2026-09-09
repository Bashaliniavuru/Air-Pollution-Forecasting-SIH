import React from 'react';
import { MapPin, Wind, Thermometer, Droplets, AlertTriangle, Layers } from 'lucide-react';

export default function DataViewer({ stations = [] }) {
  const getCategoryBadge = (category) => {
    switch (category) {
      case 'GOOD':
        return <span className="badge badge-online">Good (0-50)</span>;
      case 'SATISFACTORY':
        return <span className="badge" style={{ background: '#ecfeff', color: '#0891b2', border: '1px solid #a5f3fc' }}>Satisfactory (51-100)</span>;
      case 'MODERATE':
        return <span className="badge badge-idle">Moderate (101-200)</span>;
      case 'POOR':
        return <span className="badge badge-active">Poor (201-300)</span>;
      case 'VERY_POOR':
        return <span className="badge badge-error">Very Poor (301-400)</span>;
      case 'SEVERE':
      case 'SEVERE_PLUS':
        return <span className="badge badge-error">Severe (401-500+)</span>;
      default:
        return <span className="badge badge-idle">{category}</span>;
    }
  };

  return (
    <div className="white-card" style={{ marginBottom: '2rem', background: '#ffffff', border: '1.5px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={18} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>Delhi-NCR Coupled Station Observatories (`data/` Ingress)</h3>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Focus Region: Delhi-NCR Continuous Ambient & Meteorological Ingress
        </div>
      </div>

      {stations.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No station telemetry available.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          {stations.map((st) => (
            <div
              key={st.station_id}
              style={{
                background: '#fdfbf7',
                border: '1.5px solid #eeddc8',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1rem' }}>
                    {st.station_name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {st.location}
                  </div>
                </div>
                {getCategoryBadge(st.category)}
              </div>

              {/* Current AQI Banner */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', padding: '0.5rem 0.75rem', background: '#ffffff', borderRadius: 'var(--radius-sm)', border: '1px solid #fed7aa' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Current AQI:</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ea580c', fontFamily: 'var(--font-heading)' }}>
                  {st.current_aqi}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                  Ventilation: {st.ventilation_index} m²/s
                </span>
              </div>

              {/* Pollutants vs Weather Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
                <div style={{ background: '#ffffff', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid #eeddc8' }}>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>PM2.5 / PM10</div>
                  <div style={{ fontWeight: 700, color: '#ea580c' }}>{st.pm2_5} / {st.pm10} µg/m³</div>
                </div>
                <div style={{ background: '#ffffff', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid #eeddc8' }}>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>NO2 Level</div>
                  <div style={{ fontWeight: 700, color: '#d97706' }}>{st.no2} µg/m³</div>
                </div>
                <div style={{ background: '#ffffff', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid #eeddc8' }}>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>Wind Speed & Dir</div>
                  <div style={{ fontWeight: 700, color: '#0284c7' }}>{st.wind_speed_kmh} km/h ({st.wind_direction_deg}°)</div>
                </div>
                <div style={{ background: '#ffffff', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid #eeddc8' }}>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>PBL Mixing Height</div>
                  <div style={{ fontWeight: 700, color: '#c2410c' }}>{st.pbl_height_m} m</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
