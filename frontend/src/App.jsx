import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  Database, 
  PlayCircle, 
  Zap, 
  Layers, 
  CheckCircle2, 
  ArrowUpRight, 
  Sparkles,
  Wind,
  Gauge,
  Thermometer,
  CloudFog,
  MapPin
} from 'lucide-react';
import Navbar from './components/Navbar';
import MetricCard from './components/MetricCard';
import SystemHealth from './components/SystemHealth';
import ModulesOverview from './components/ModulesOverview';
import DataViewer from './components/DataViewer';
import TaskRunner from './components/TaskRunner';
import { fetchHealth, fetchMetrics, fetchStations } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [health, setHealth] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [stations, setStations] = useState([]);
  const [loadingHealth, setLoadingHealth] = useState(false);

  const loadData = async () => {
    setLoadingHealth(true);
    try {
      const [hData, mData, sData] = await Promise.all([
        fetchHealth(),
        fetchMetrics(),
        fetchStations()
      ]);
      setHealth(hData);
      setMetrics(mData);
      setStations(sData);
    } catch (err) {
      console.error('Data load error:', err);
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        healthStatus={health}
      />

      <main className="main-content">
        {/* Header Hero Banner */}
        <section style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-full)', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', marginBottom: '1rem', color: '#38bdf8', fontSize: '0.8125rem', fontWeight: 600 }}>
            <MapPin size={14} />
            <span>Focus Region: Delhi-NCR • Smart India Hackathon Prototype</span>
          </div>

          <h1 style={{ fontSize: '2.35rem', lineHeight: 1.2, marginBottom: '0.75rem' }}>
            Air Pollution - Weather <span className="gradient-text">Coupled Forecasting System</span>
          </h1>
          <p style={{ fontSize: '1.0625rem', color: 'var(--text-secondary)', maxWidth: '850px', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            <strong>Objective:</strong> Forecast upcoming air-pollution levels by considering both pollution data and weather conditions, rather than only showing the current AQI.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button 
              id="hero-btn-quick-run" 
              className="btn-primary" 
              onClick={() => setActiveTab('tasks')}
            >
              <Zap size={16} />
              <span>Simulate 24h Coupled Forecast</span>
            </button>
            <button 
              id="hero-btn-view-modules" 
              className="btn-secondary" 
              onClick={() => setActiveTab('modules')}
            >
              <Layers size={16} />
              <span>Coupled Architecture Pillars</span>
            </button>
            <a 
              href="http://localhost:8000/docs" 
              target="_blank" 
              rel="noreferrer" 
              className="btn-secondary"
              style={{ textDecoration: 'none' }}
            >
              <ArrowUpRight size={16} />
              <span>FastAPI Swagger Docs</span>
            </a>
          </div>
        </section>

        {/* Top Key Metrics Row */}
        <div className="grid-cards">
          <MetricCard
            title="Delhi-NCR Stations"
            value={`${stations.length} Active`}
            subtitle="Anand Vihar, ITO, RK Puram, Punjabi Bagh"
            icon={MapPin}
            color="cyan"
          />
          <MetricCard
            title="Coupled Meteorology"
            value="Wind + PBL"
            subtitle="Ventilation Index & Inversion Risk"
            icon={Wind}
            color="indigo"
          />
          <MetricCard
            title="Forecast Horizon"
            value="24h – 72h"
            subtitle="Predictive vs Static AQI"
            icon={CloudFog}
            color="purple"
          />
          <MetricCard
            title="Current Average AQI"
            value="350 (Very Poor)"
            subtitle="Projected Severe Stagnation Ahead"
            icon={Gauge}
            color="emerald"
          />
        </div>

        {/* Tab Switcher Body */}
        {activeTab === 'overview' && (
          <>
            <DataViewer stations={stations} />
            <div className="grid-two-col">
              <TaskRunner />
              <SystemHealth
                health={health}
                onRefresh={loadData}
                loading={loadingHealth}
              />
            </div>
            <ModulesOverview modules={metrics?.modules} />
          </>
        )}

        {activeTab === 'modules' && (
          <ModulesOverview modules={metrics?.modules} />
        )}

        {activeTab === 'data' && (
          <DataViewer stations={stations} />
        )}

        {activeTab === 'tasks' && (
          <TaskRunner />
        )}
      </main>

      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
        <div>Air Pollution - Weather Coupled Forecasting System (Delhi-NCR) • React 18 + FastAPI + Python 3.13</div>
      </footer>
    </div>
  );
}
