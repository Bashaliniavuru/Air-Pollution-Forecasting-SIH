import React from 'react';
import { Layers, CheckCircle, Zap } from 'lucide-react';

export default function ModulesOverview({ modules = [] }) {
  const defaultModules = [
    { module_name: 'CPCB & Sensor Ingress', status: 'ACTIVE', latency_ms: 12.4, details: 'Ingesting 19 Delhi-NCR continuous ambient stations' },
    { module_name: 'IMD Weather Ingress', status: 'ACTIVE', latency_ms: 18.1, details: 'Coupling temperature, humidity, wind & PBL height' },
    { module_name: 'Ventilation & Inversion Engine', status: 'ACTIVE', latency_ms: 22.8, details: 'Computing dynamic dispersion multipliers' },
    { module_name: 'AI Coupled Forecaster', status: 'ACTIVE', latency_ms: 38.6, details: '24h–72h multi-horizon predictive ML model' },
    { module_name: 'GRAP Early Warning Dispatcher', status: 'ACTIVE', latency_ms: 6.2, details: 'Evaluating emergency mitigation thresholds' },
    { module_name: 'Schema & Boundary Guard', status: 'ACTIVE', latency_ms: 4.1, details: 'Strict Pydantic v2 validation active' }
  ];

  const displayList = modules.length > 0 ? modules : defaultModules;

  return (
    <div className="white-card" style={{ marginBottom: '2rem', background: '#ffffff', border: '1.5px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Layers size={18} />
        </div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>6-Pillar Coupled Forecasting Architecture</h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {displayList.map((m, idx) => (
          <div
            key={idx}
            style={{
              background: '#fdfbf7',
              border: '1.5px solid #eeddc8',
              borderRadius: 'var(--radius-lg)',
              padding: '1.1rem',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                {m.module_name}
              </span>
              <span className="badge badge-online" style={{ fontSize: '0.6875rem' }}>
                <CheckCircle size={10} />
                {m.status}
              </span>
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              {m.details || 'Modular coupled pipeline node.'}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>Avg Latency</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#ea580c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Zap size={12} />
                {m.latency_ms} ms
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
