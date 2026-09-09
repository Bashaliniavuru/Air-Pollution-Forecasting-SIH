import React from 'react';
import { Wind, Activity, Cpu, Database, PlayCircle, MapPin } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, healthStatus }) {
  const isOnline = healthStatus?.status === 'ONLINE';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <a href="#overview" className="nav-brand" id="nav-brand-logo">
          <div className="brand-icon">
            <Wind size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.125rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>AIR POLLUTION -</span>
              <span className="gradient-text">WEATHER COUPLED</span>
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={10} color="#38bdf8" />
              <span>Delhi-NCR Forecasting System</span>
            </div>
          </div>
        </a>

        <div className="nav-links">
          <button
            id="tab-btn-overview"
            className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Activity size={16} />
            <span>Overview & Stations</span>
          </button>

          <button
            id="tab-btn-modules"
            className={`nav-tab ${activeTab === 'modules' ? 'active' : ''}`}
            onClick={() => setActiveTab('modules')}
          >
            <Cpu size={16} />
            <span>Architecture</span>
          </button>

          <button
            id="tab-btn-data"
            className={`nav-tab ${activeTab === 'data' ? 'active' : ''}`}
            onClick={() => setActiveTab('data')}
          >
            <Database size={16} />
            <span>Coupled Feeds</span>
          </button>

          <button
            id="tab-btn-tasks"
            className={`nav-tab ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            <PlayCircle size={16} />
            <span>Forecast Forecaster</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            id="system-status-indicator"
            className={`badge ${isOnline ? 'badge-online' : 'badge-idle'}`}
          >
            <span className="pulse-dot"></span>
            <span>{isOnline ? 'FastAPI Engine Active' : 'Offline Preview'}</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
