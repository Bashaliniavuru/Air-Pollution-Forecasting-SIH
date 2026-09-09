import React from 'react';
import { Server, CheckCircle2, ShieldCheck, Clock, RefreshCw } from 'lucide-react';

export default function SystemHealth({ health, onRefresh, loading }) {
  const services = health?.services || {};

  return (
    <div className="glass-card" style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Server size={20} color="#6366f1" />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>System Telemetry & Architecture Health</h3>
        </div>
        <button
          id="btn-refresh-health"
          onClick={onRefresh}
          className="btn-secondary"
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8125rem' }}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'pulse-dot' : ''} />
          <span>{loading ? 'Checking...' : 'Ping Telemetry'}</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>FastAPI Status</div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: health?.status === 'ONLINE' ? '#34d399' : '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="pulse-dot" style={{ backgroundColor: health?.status === 'ONLINE' ? '#34d399' : '#fbbf24' }}></span>
            {health?.status || 'STANDBY'}
          </div>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Core Version</div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
            v{health?.version || '1.0.0'}
          </div>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Service Uptime</div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} />
            {health?.uptime_seconds ? `${health.uptime_seconds}s` : 'Initializing'}
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 600 }}>
          Sub-Services Operational Matrix:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {Object.entries(services).map(([name, status]) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'rgba(0, 0, 0, 0.2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                {name.replace(/_/g, ' ')}
              </span>
              <span style={{ fontSize: '0.6875rem', color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={12} />
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
