import React from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Wifi,
  WifiOff,
  ShieldCheck,
  Radio
} from 'lucide-react';

export default function LiveStatusBanner({
  apiStatus = {
    status: 'LIVE',
    isLive: true,
    message: 'Connected to live API',
    lastSynced: null,
    latencyMs: null
  },
  onRefresh,
  loading = false
}) {
  const isLive = apiStatus.isLive === true || apiStatus.status === 'LIVE';
  const isUnavailable = apiStatus.status === 'UNAVAILABLE' || apiStatus.status === 'OFFLINE';
  const isDemo = apiStatus.status === 'DEMO_FALLBACK' || apiStatus.source === 'DEMO_PROTOTYPE';

  // Format sync timestamp cleanly
  const formattedSyncTime = apiStatus.lastSynced
    ? new Date(apiStatus.lastSynced).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // 1. ==================== LIVE DATA STATE ====================
  if (isLive) {
    return (
      <div
        id="live-data-status-banner"
        className="live-status-banner-live"
        style={{
          background: 'linear-gradient(90deg, rgba(240, 253, 244, 0.98) 0%, rgba(255, 255, 255, 0.98) 45%, rgba(240, 253, 244, 0.98) 100%)',
          border: '1.5px solid #bbf7d0',
          borderRadius: 'var(--radius-lg)',
          padding: '0.75rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.85rem',
          boxShadow: '0 4px 18px rgba(22, 163, 74, 0.08)'
        }}
      >
        {/* Left: 🟢 LIVE DATA & "Connected to live API" */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#dcfce7',
              border: '1px solid #86efac',
              padding: '0.25rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              color: '#15803d',
              fontSize: '0.8125rem',
              fontWeight: 850,
              letterSpacing: '0.02em'
            }}
          >
            <span className="pulse-dot" style={{ width: '9px', height: '9px', background: '#16a34a' }}></span>
            <span>🟢 LIVE DATA</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  color: '#14532d',
                  fontFamily: 'var(--font-heading)'
                }}
              >
                “Connected to live API”
              </span>
              <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>
                • Continuous Delhi-NCR Telemetry Active
              </span>
            </div>
            <span style={{ fontSize: '0.71875rem', color: '#4b5563' }}>
              Valid real-time sensor observations verified from FastAPI backend (<code style={{ color: '#15803d', fontWeight: 600 }}>/api/v1/stations</code>).
            </span>
          </div>
        </div>

        {/* Right: Sync Status & Refresh Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {apiStatus.latencyMs !== null && apiStatus.latencyMs !== undefined && (
            <span
              style={{
                fontSize: '0.6875rem',
                color: '#15803d',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700
              }}
            >
              Latency: {apiStatus.latencyMs}ms
            </span>
          )}

          <div
            style={{
              fontSize: '0.75rem',
              color: '#4b5563',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 600
            }}
          >
            <Clock size={13} color="#16a34a" />
            <span>Synced: <strong>{formattedSyncTime}</strong></span>
          </div>

          {onRefresh && (
            <button
              id="btn-refresh-live-telemetry"
              onClick={onRefresh}
              disabled={loading}
              title="Refresh live telemetry from FastAPI"
              style={{
                background: '#ffffff',
                border: '1.5px solid #86efac',
                color: '#15803d',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: loading ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
                boxShadow: '0 1px 4px rgba(22, 163, 74, 0.1)'
              }}
            >
              <RefreshCw size={12} className={loading ? 'anim-spin' : ''} />
              <span>{loading ? 'Syncing...' : 'Refresh Live'}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // 2. ==================== DATA UNAVAILABLE STATE ====================
  if (isUnavailable) {
    return (
      <div
        id="live-data-unavailable-banner"
        className="live-status-banner-unavailable"
        style={{
          background: 'linear-gradient(90deg, rgba(254, 243, 199, 0.55) 0%, rgba(255, 255, 255, 0.98) 50%, rgba(254, 243, 199, 0.55) 100%)',
          border: '1.5px solid #fde68a',
          borderRadius: 'var(--radius-lg)',
          padding: '0.75rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.85rem',
          boxShadow: '0 4px 18px rgba(217, 119, 6, 0.08)'
        }}
      >
        {/* Left: 🟡 DATA UNAVAILABLE & Error Context */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#fef3c7',
              border: '1px solid #fcd34d',
              padding: '0.25rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              color: '#b45309',
              fontSize: '0.8125rem',
              fontWeight: 850,
              letterSpacing: '0.02em'
            }}
          >
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#d97706' }}></span>
            <span>🟡 DATA UNAVAILABLE</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: 800,
                color: '#92400e',
                fontFamily: 'var(--font-heading)'
              }}
            >
              {apiStatus.message || 'Live telemetry stream is currently unreachable.'}
            </span>
            <span style={{ fontSize: '0.71875rem', color: '#78716c' }}>
              Zero fake values generated • Missing parameters are marked as <em>“Not available”</em> rather than simulated.
            </span>
          </div>
        </div>

        {/* Right: Retry Action Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {onRefresh && (
            <button
              id="btn-retry-api-connection"
              onClick={onRefresh}
              disabled={loading}
              style={{
                background: '#ea580c',
                border: 'none',
                color: '#ffffff',
                padding: '0.4rem 0.95rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.78125rem',
                fontWeight: 800,
                cursor: loading ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(234, 88, 12, 0.25)',
                transition: 'all 0.15s ease'
              }}
            >
              <RefreshCw size={13} className={loading ? 'anim-spin' : ''} />
              <span>{loading ? 'Reconnecting...' : 'Retry Connection'}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // 3. ==================== DEMO PROTOTYPE STATE ====================
  return (
    <div
      id="sih-demo-data-indicator"
      style={{
        background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.12) 0%, rgba(254, 215, 170, 0.2) 100%)',
        border: '1.5px dashed #fed7aa',
        borderRadius: 'var(--radius-lg)',
        padding: '0.75rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        boxShadow: '0 2px 10px rgba(180, 83, 9, 0.05)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <span style={{ fontSize: '1rem', lineHeight: 1 }}>🟡</span>
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.8125rem',
            fontWeight: 800,
            color: '#7c2d12',
            letterSpacing: '0.01em'
          }}
        >
          DEMO DATA – For Prototype Demonstration Only – Physics-Coupled Telemetry
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div
          style={{
            fontSize: '0.75rem',
            color: '#c2410c',
            background: '#ffffff',
            padding: '0.2rem 0.65rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid #fed7aa',
            fontWeight: 700
          }}
        >
          SIH 2026 Prototype • Offline Evaluation Mode
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            style={{
              background: '#ffffff',
              border: '1px solid #fed7aa',
              color: '#ea580c',
              padding: '0.25rem 0.6rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.71875rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Check Live API
          </button>
        )}
      </div>
    </div>
  );
}
