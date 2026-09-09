import React from 'react';

export default function MetricCard({ title, value, subtitle, icon: Icon, color = 'indigo' }) {
  const colorMap = {
    indigo: {
      border: 'rgba(99, 102, 241, 0.3)',
      bg: 'rgba(99, 102, 241, 0.1)',
      text: '#818cf8'
    },
    cyan: {
      border: 'rgba(6, 182, 212, 0.3)',
      bg: 'rgba(6, 182, 212, 0.1)',
      text: '#38bdf8'
    },
    emerald: {
      border: 'rgba(16, 185, 129, 0.3)',
      bg: 'rgba(16, 185, 129, 0.1)',
      text: '#34d399'
    },
    purple: {
      border: 'rgba(168, 85, 247, 0.3)',
      bg: 'rgba(168, 85, 247, 0.1)',
      text: '#c084fc'
    }
  };

  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          {title}
        </span>
        {Icon && (
          <div style={{
            padding: '0.4rem',
            borderRadius: 'var(--radius-sm)',
            background: scheme.bg,
            color: scheme.text,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon size={18} />
          </div>
        )}
      </div>

      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
        {value}
      </div>

      {subtitle && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
