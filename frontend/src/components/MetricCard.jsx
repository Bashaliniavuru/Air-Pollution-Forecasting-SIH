import React from 'react';

export default function MetricCard({ title, value, subtitle, icon: Icon, color = 'orange' }) {
  const colorMap = {
    orange: {
      border: '#fed7aa',
      bg: '#fff7ed',
      text: '#ea580c'
    },
    amber: {
      border: '#fde68a',
      bg: '#fffbeb',
      text: '#d97706'
    },
    emerald: {
      border: '#bbf7d0',
      bg: '#f0fdf4',
      text: '#15803d'
    },
    cyan: {
      border: '#a5f3fc',
      bg: '#ecfeff',
      text: '#0891b2'
    }
  };

  const scheme = colorMap[color] || colorMap.orange;

  return (
    <div className="white-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#ffffff', border: `1.5px solid ${scheme.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
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

      <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', fontFamily: 'var(--font-heading)' }}>
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
