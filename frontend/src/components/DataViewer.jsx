import React from 'react';
import { MapPin, Wind, Thermometer, Droplets, AlertTriangle, Layers } from 'lucide-react';

export default function DataViewer({ stations = [] }) {
  const getCategoryBadge = (category) => {
    switch (category) {
      case 'GOOD':
        return <span className="badge badge-online">Good (0-50)</span>;
      case 'SATISFACTORY':
        return <span className="badge badge-active">Satisfactory (51-100)</span>;
      case 'MODERATE':
        return <span className="badge badge-idle">Moderate (101-200)</span>;
      case 'POOR':
        return <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.4)' }}>Poor (201-300)</span>;
      case 'VERY_POOR':
        return <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)' }}>Very Poor (301-400)</span>;
      case 'SEVERE':
      case 'SEVERE_PLUS':
        return <span className="badge badge-error">Severe (401-500+)</span>;
      default:
        return <span className="badge badge-idle">{category}</span>;
    }
  };

  return (
    <div className="glass-card" style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapPin size={20} color="#38bdf8" />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Delhi-NCR Coupled Station Observatories (`data/` Ingress)</h3>
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
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '1rem' }}>
                    {st.station_name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {st.location}
                  </div>
                </div>
                {getCategoryBadge(st.category)}
              </div>

              {/* Current AQI Banner */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Current AQI:</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f43f5e', fontFamily: 'var(--font-heading)' }}>
                  {st.current_aqi}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                  Ventilation: {st.ventilation_index} m²/s
                </span>
              </div>

              {/* Pollutants vs Weather Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
                <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>PM2.5 / PM10</div>
                  <div style={{ fontWeight: 600, color: '#fb7185' }}>{st.pm2_5} / {st.pm10} µg/m³</div>
                </div>
                <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>NO2 Level</div>
                  <div style={{ fontWeight: 600, color: '#fbbf24' }}>{st.no2} µg/m³</div>
                </div>
                <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>Wind Speed & Dir</div>
                  <div style={{ fontWeight: 600, color: '#38bdf8' }}>{st.wind_speed_kmh} km/h ({st.wind_direction_deg}°)</div>
                </div>
                <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>PBL Mixing Height</div>
                  <div style={{ fontWeight: 600, color: '#a855f7' }}>{st.pbl_height_m} m</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
