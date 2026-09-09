import React from 'react';
import { Activity, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

export default function PollutantGrid({ station }) {
  if (!station) return null;

  const pollutants = [
    {
      name: 'PM2.5',
      fullName: 'Fine Particulate Matter (≤2.5 µm)',
      value: station.pm2_5,
      unit: 'µg/m³',
      standard: 60,
      color: '#ea580c',
      barColor: '#ea580c',
      source: 'Vehicular exhaust, biomass burning & industrial combustion',
      health: 'Deep lung alveoli penetration & bloodstream entry'
    },
    {
      name: 'PM10',
      fullName: 'Inhalable Particulate Matter (≤10 µm)',
      value: station.pm10,
      unit: 'µg/m³',
      standard: 100,
      color: '#d97706',
      barColor: '#f59e0b',
      source: 'Road and construction dust resuspension',
      health: 'Upper respiratory irritation, bronchitis, and coughing'
    },
    {
      name: 'NO2',
      fullName: 'Nitrogen Dioxide',
      value: station.no2 || 65.0,
      unit: 'µg/m³',
      standard: 80,
      color: '#c2410c',
      barColor: '#fb923c',
      source: 'Heavy commercial vehicles and thermal power stations',
      health: 'Airway inflammation, increases asthma sensitivity'
    },
    {
      name: 'O3',
      fullName: 'Ground-Level Ozone',
      value: station.o3 || 38.0,
      unit: 'µg/m³',
      standard: 100,
      color: '#0891b2',
      barColor: '#06b6d4',
      source: 'Photochemical reaction of NOx + VOCs under sunlight',
      health: 'Chest tightness, reduced pulmonary function'
    },
    {
      name: 'SO2',
      fullName: 'Sulfur Dioxide',
      value: station.so2 || 14.0,
      unit: 'µg/m³',
      standard: 80,
      color: '#16a34a',
      barColor: '#22c55e',
      source: 'Industrial furnace fuel burning, refineries',
      health: 'Bronchospasms and secondary aerosol formation'
    },
    {
      name: 'CO',
      fullName: 'Carbon Monoxide',
      value: station.co || 2.1,
      unit: 'mg/m³',
      standard: 2.0,
      color: '#15803d',
      barColor: '#16a34a',
      source: 'Incomplete combustion in idling vehicle engines',
      health: 'Reduces oxygen carrying capacity of the bloodstream'
    }
  ];

  return (
    <div id="pollutants-breakdown-section" style={{ marginTop: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={15} />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Pollutant Concentration Breakdown
          </h3>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          NAAQS Benchmark: Central Pollution Control Board (CPCB) Standard
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '0.85rem'
        }}
      >
        {pollutants.map((p) => {
          const ratio = p.value / p.standard;
          const isOver = ratio > 1.0;
          const pct = Math.min(100, Math.round(ratio * 100));

          return (
            <div
              key={p.name}
              className="white-card"
              style={{
                padding: '1.1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: '#ffffff',
                border: isOver ? '1.5px solid #fed7aa' : '1px solid #eeddc8'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                  <div>
                    <span style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                      {p.name}
                    </span>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                      {p.fullName}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      color: isOver ? '#c2410c' : '#15803d',
                      background: isOver ? '#fff7ed' : '#f0fdf4',
                      padding: '0.15rem 0.45rem',
                      borderRadius: 'var(--radius-full)',
                      border: `1px solid ${isOver ? '#fed7aa' : '#bbf7d0'}`
                    }}
                  >
                    {isOver ? `${ratio.toFixed(1)}× Limit` : 'Safe'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '0.45rem 0' }}>
                  <span style={{ fontSize: '1.75rem', fontWeight: 900, color: p.color, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                    {p.value}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {p.unit}
                  </span>
                </div>
              </div>

              <div>
                {/* Visual Ratio Progress Bar */}
                <div style={{ width: '100%', height: '6px', background: '#f5eee4', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: '6px' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: p.barColor, transition: 'width 0.4s ease', borderRadius: 'var(--radius-full)' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                  <span>Safe Limit: <strong>{p.standard} {p.unit}</strong></span>
                  <span style={{ color: 'var(--text-muted)' }}>{p.source.split(',')[0]}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
