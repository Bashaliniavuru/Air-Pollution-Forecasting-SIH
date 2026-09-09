import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MainDashboard from './components/MainDashboard';
import DataViewer from './components/DataViewer';
import TaskRunner from './components/TaskRunner';
import ModulesOverview from './components/ModulesOverview';
import SystemHealth from './components/SystemHealth';
import { fetchHealth, fetchMetrics, fetchStations } from './services/api';
import { Leaf, Info } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStationId, setSelectedStationId] = useState('DELHI_CENTRAL');
  const [health, setHealth] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [stations, setStations] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [apiStatus, setApiStatus] = useState({
    status: 'CONNECTING',
    isLive: false,
    source: 'INITIALIZING',
    message: 'Connecting to live API...',
    lastSynced: null,
    latencyMs: null,
    error: null
  });

  const loadData = async () => {
    setLoadingData(true);
    const startTime = performance.now();
    try {
      const [hResult, mResult, sResult] = await Promise.all([
        fetchHealth(),
        fetchMetrics(),
        fetchStations()
      ]);

      const latency = Math.round(performance.now() - startTime);

      if (sResult.isLive && sResult.data && sResult.data.length > 0) {
        setStations(sResult.data);
        setHealth(hResult.data);
        setMetrics(mResult.data);
        setApiStatus({
          status: 'LIVE',
          isLive: true,
          source: 'LIVE_API',
          message: 'Connected to live API',
          lastSynced: new Date().toISOString(),
          latencyMs: latency,
          error: null
        });
      } else {
        // API failed (timeout, network error, missing fields, invalid/empty response)
        const errorMsg = sResult.message || 'Live sensor API unavailable';
        setStations(sResult.data || []);
        setHealth(hResult.data || null);
        setMetrics(mResult.data || null);
        setApiStatus({
          status: 'UNAVAILABLE',
          isLive: false,
          source: 'UNAVAILABLE',
          message: errorMsg,
          lastSynced: null,
          latencyMs: latency,
          error: errorMsg
        });
      }
    } catch (err) {
      console.error('Data load error:', err);
      setApiStatus({
        status: 'UNAVAILABLE',
        isLive: false,
        source: 'UNAVAILABLE',
        message: 'Network failure or backend unreachable',
        lastSynced: null,
        latencyMs: null,
        error: err.message
      });
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        healthStatus={health}
        apiStatus={apiStatus}
        stations={stations}
        selectedStationId={selectedStationId}
        onSelectStation={(id) => setSelectedStationId(id)}
      />

      <main className="main-content">
        {activeTab === 'overview' && (
          <MainDashboard
            stations={stations}
            apiStatus={apiStatus}
            onRefreshData={loadData}
            loadingData={loadingData}
            selectedStationId={selectedStationId}
            onSelectStation={(id) => setSelectedStationId(id)}
          />
        )}

        {activeTab === 'data' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 850, color: 'var(--text-primary)' }}>Delhi-NCR Monitoring Station Feeds</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Continuous ambient air quality & IMD meteorological parameters across Delhi-NCR.
              </p>
            </div>
            <DataViewer stations={stations} />
          </div>
        )}

        {activeTab === 'tasks' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 850, color: 'var(--text-primary)' }}>Coupled Forecast Simulator & What-If Engine</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Direct manual execution of coupled atmospheric dispersion simulation tasks.
              </p>
            </div>
            <TaskRunner />
          </div>
        )}

        {activeTab === 'modules' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 850, color: 'var(--text-primary)' }}>6-Pillar Coupled System Architecture</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Real-time operational status across all six decoupled pillars.
              </p>
            </div>
            <ModulesOverview modules={metrics?.modules} />
          </div>
        )}

        {activeTab === 'health' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 850, color: 'var(--text-primary)' }}>System Telemetry & Health Matrix</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                FastAPI service readiness, operational latency, and background daemon status.
              </p>
            </div>
            <SystemHealth
              health={health}
              onRefresh={loadData}
              loading={loadingData}
            />
          </div>
        )}
      </main>

      {/* Footer from Reference Image with Environmental Branding */}
      <footer
        style={{
          borderTop: '1.5px solid var(--border-subtle)',
          padding: '1.5rem 1.5rem',
          color: 'var(--text-secondary)',
          fontSize: '0.78125rem',
          background: '#fdfbf7'
        }}
      >
        <div
          style={{
            maxWidth: '1340px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          {/* Left: Brand Logo & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#1c1917' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'linear-gradient(135deg, #ea580c 0%, #16a34a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Leaf size={14} />
            </div>
            <span>SIX WARRIORS</span>
            <span style={{ color: '#a8a29e', fontWeight: 400 }}>|</span>
            <span style={{ color: '#78716c', fontWeight: 600 }}>Air Pollution-Weather Forecasting System</span>
          </div>

          {/* Center: Disclaimer from Reference */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#78716c', fontSize: '0.75rem' }}>
            <Info size={13} color="#ea580c" />
            <span>DEMO DATA • Prototype website for demonstration • Atmospheric Physics Coupled Modeling</span>
          </div>

          {/* Right: Environmental Mission */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803d', fontWeight: 700, fontSize: '0.75rem' }}>
            <Leaf size={13} color="#16a34a" />
            <span>Cleaner Air | Healthier Communities | A Sustainable Future</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
