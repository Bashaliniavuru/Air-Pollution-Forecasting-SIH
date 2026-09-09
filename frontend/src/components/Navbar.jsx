import React, { useState, useEffect } from 'react';
import {
  Leaf,
  MapPin,
  ChevronDown,
  Menu,
  X,
  ArrowRight,
  LayoutDashboard,
  TrendingUp,
  Activity,
  CloudSun,
  Layers,
  Sparkles,
  ShieldAlert,
  Wind,
  Radio,
  Sliders,
  HeartPulse,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  healthStatus,
  apiStatus,
  stations = [],
  selectedStationId,
  onSelectStation,
  onExploreForecast,
  dashboardHubOpen: externalHubOpen,
  setDashboardHubOpen: setExternalHubOpen
}) {
  const [internalHubOpen, setInternalHubOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');

  const dashboardHubOpen = externalHubOpen !== undefined ? externalHubOpen : internalHubOpen;
  const setDashboardHubOpen = setExternalHubOpen || setInternalHubOpen;
  const isLive = apiStatus?.isLive === true || apiStatus?.status === 'LIVE';
  const isUnavailable = apiStatus?.status === 'UNAVAILABLE' || apiStatus?.status === 'OFFLINE';

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setDashboardHubOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setDashboardHubOpen]);

  // Track active section on scroll for overview tab
  useEffect(() => {
    if (activeTab === 'modules') {
      setActiveSection('about');
      return;
    }
    if (activeTab === 'data') {
      setActiveSection('data');
      return;
    }
    if (activeTab === 'tasks') {
      setActiveSection('tasks');
      return;
    }
    if (activeTab === 'health') {
      setActiveSection('health');
      return;
    }

    const sectionIds = [
      { id: 'delhi-hero-banner', name: 'dashboard' },
      { id: 'current-air-quality-section', name: 'current-aqi' },
      { id: 'weather-conditions-card-section', name: 'weather' },
      { id: 'section-24h-forecast', name: 'forecast' },
      { id: 'delhi-hotspot-map-section', name: 'map' },
      { id: 'ai-weather-pollution-insight-section', name: 'ai-insights' },
      { id: 'early-warning-section', name: 'early-warning' }
    ];

    const handleScroll = () => {
      const scrollY = window.scrollY;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i].id);
        if (el) {
          const top = el.offsetTop - 200;
          if (scrollY >= top) {
            setActiveSection(sectionIds[i].name);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab]);

  const triggerForecastOpen = () => {
    setActiveSection('forecast');
    setActiveTab('overview');
    setDashboardHubOpen(false);

    if (onExploreForecast) {
      onExploreForecast();
    } else {
      setTimeout(() => {
        const el = document.getElementById('section-24h-forecast');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          el.classList.add('forecast-section-highlight');
          setTimeout(() => el.classList.remove('forecast-section-highlight'), 2800);
        }
      }, 80);
    }
  };

  const scrollToSection = (id, sectionName = null) => {
    if (sectionName) {
      setActiveSection(sectionName);
    }
    setActiveTab('overview');
    setDashboardHubOpen(false);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (id === 'section-24h-forecast') {
          el.classList.add('forecast-section-highlight');
          setTimeout(() => el.classList.remove('forecast-section-highlight'), 2800);
        }
      }
    }, 60);
  };

  const handleNavClick = (tabId, targetSection = null, sectionName = null) => {
    setActiveTab(tabId);
    setDashboardHubOpen(false);

    if (sectionName) {
      setActiveSection(sectionName);
    } else if (tabId === 'modules') {
      setActiveSection('about');
    } else if (tabId === 'overview') {
      setActiveSection('dashboard');
    }

    if (targetSection) {
      scrollToSection(targetSection, sectionName);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const activeStation = stations.find((s) => s.station_id === selectedStationId) || stations[0];

  // 8 Specific Required Navigation Options
  const primarySidebarItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      desc: 'Landing hero, live telemetry & overview cards',
      icon: LayoutDashboard,
      color: '#ea580c',
      bg: '#ffedd5',
      action: () => handleNavClick('overview', 'delhi-hero-banner', 'dashboard')
    },
    {
      id: 'current-aqi',
      label: 'Current Air Quality',
      desc: 'Circular AQI gauge & pollutant sub-indices',
      icon: Activity,
      color: '#ea580c',
      bg: '#ffedd5',
      action: () => scrollToSection('current-air-quality-section', 'current-aqi')
    },
    {
      id: 'weather',
      label: 'Weather',
      desc: 'Temperature, humidity, wind & barometric data',
      icon: CloudSun,
      color: '#0891b2',
      bg: '#ecfeff',
      action: () => scrollToSection('weather-conditions-card-section', 'weather')
    },
    {
      id: 'forecast',
      label: 'Explore Forecast',
      desc: '24-Hour coupled ML predictive trajectory (1h, 6h, 24h)',
      icon: TrendingUp,
      color: '#ea580c',
      bg: '#ffedd5',
      badge: 'LIVE ML',
      action: triggerForecastOpen
    },
    {
      id: 'map',
      label: 'Delhi NCR Map',
      desc: 'Interactive spatial AQI hotspot distribution',
      icon: MapPin,
      color: '#0284c7',
      bg: '#e0f2fe',
      action: () => scrollToSection('delhi-hotspot-map-section', 'map')
    },
    {
      id: 'early-warning',
      label: 'Early Warning',
      desc: '4-tier risk classification & GRAP health directives',
      icon: ShieldAlert,
      color: '#dc2626',
      bg: '#fee2e2',
      action: () => scrollToSection('early-warning-section', 'early-warning')
    },
    {
      id: 'ai-insights',
      label: 'AI Insights',
      desc: 'Gemini AI natural language meteorological explanations',
      icon: Sparkles,
      color: '#7c3aed',
      bg: '#ede9fe',
      action: () => scrollToSection('ai-weather-pollution-insight-section', 'ai-insights')
    },
    {
      id: 'about',
      label: 'About / How It Works',
      desc: '6-Pillar coupled forecasting architecture & specs',
      icon: Layers,
      color: '#b45309',
      bg: '#fef3c7',
      action: () => handleNavClick('modules', null, 'about')
    }
  ];

  return (
    <header className="navbar-wrapper">
      <nav className="navbar" id="main-floating-navbar">
        <div className="navbar-inner">
          {/* ========================================================= */}
          {/* --- LEFT: ENVIRONMENTAL LEAF ICON & BRANDING --- */}
          {/* ========================================================= */}
          <a
            href="#home"
            className="nav-brand"
            id="nav-brand-logo"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('overview', 'delhi-hero-banner', 'dashboard');
            }}
          >
            <div className="brand-icon">
              <Leaf size={20} />
            </div>
            <div>
              <div
                style={{
                  fontWeight: 850,
                  fontSize: '1.125rem',
                  letterSpacing: '-0.025em',
                  color: '#1c1917',
                  lineHeight: 1.15
                }}
              >
                SIX WARRIORS
              </div>
              <div
                style={{
                  fontSize: '0.6875rem',
                  color: '#78716c',
                  letterSpacing: '0.01em',
                  fontWeight: 600,
                  lineHeight: 1.2
                }}
              >
                Air Pollution–Weather Forecasting System
              </div>
            </div>
          </a>

          {/* ========================================================= */}
          {/* --- CENTER: DESKTOP NAVIGATION PILLS --- */}
          {/* ========================================================= */}
          <div className="nav-links" id="desktop-nav-links">
            <button
              id="nav-link-home"
              className={`nav-tab ${activeTab === 'overview' && activeSection === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleNavClick('overview', 'delhi-hero-banner', 'dashboard')}
            >
              <span>Home</span>
            </button>

            <button
              id="nav-link-forecast"
              className={`nav-tab ${activeSection === 'forecast' ? 'active' : ''}`}
              onClick={triggerForecastOpen}
            >
              <TrendingUp size={14} />
              <span>Forecast</span>
            </button>

            <button
              id="nav-link-map"
              className={`nav-tab ${activeSection === 'map' ? 'active' : ''}`}
              onClick={() => scrollToSection('delhi-hotspot-map-section', 'map')}
            >
              <span>Map</span>
            </button>

            <button
              id="nav-link-insights"
              className={`nav-tab ${activeSection === 'ai-insights' ? 'active' : ''}`}
              onClick={() => scrollToSection('ai-weather-pollution-insight-section', 'ai-insights')}
            >
              <span>Insights</span>
            </button>

            <button
              id="nav-link-about"
              className={`nav-tab ${activeTab === 'modules' ? 'active' : ''}`}
              onClick={() => handleNavClick('modules', null, 'about')}
            >
              <span>About</span>
            </button>
          </div>

          {/* ========================================================= */}
          {/* --- RIGHT: DELHI NCR SELECTOR, STATUS & CORNER DASHBOARD ICON --- */}
          {/* ========================================================= */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexShrink: 0 }}>
            {/* Delhi NCR Location Selector Pill */}
            {stations.length > 0 && onSelectStation && (
              <div
                id="navbar-location-selector-container"
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: 'var(--radius-full)',
                  border: '1.5px solid rgba(254, 215, 170, 0.95)',
                  boxShadow: '0 2px 6px rgba(180, 83, 9, 0.06)',
                  padding: '0 0.5rem 0 0.75rem',
                  height: '36px'
                }}
              >
                <div style={{ color: '#ea580c', display: 'flex', alignItems: 'center', marginRight: '5px' }}>
                  <MapPin size={15} />
                </div>
                <select
                  id="header-location-selector"
                  value={selectedStationId}
                  onChange={(e) => onSelectStation(e.target.value)}
                  style={{
                    background: 'transparent',
                    color: '#1c1917',
                    border: 'none',
                    padding: '0 1.25rem 0 0',
                    fontSize: '0.8125rem',
                    fontWeight: 750,
                    outline: 'none',
                    cursor: 'pointer',
                    appearance: 'none',
                    maxWidth: '140px'
                  }}
                  title="Delhi NCR Location Selector"
                >
                  {stations.map((st) => (
                    <option key={st.station_id} value={st.station_id}>
                      {st.station_name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: '#ea580c'
                  }}
                />
              </div>
            )}

            {/* Live API Status Pill */}
            {isLive ? (
              <div
                id="system-status-indicator"
                className="badge badge-online"
                title="Connected to live API • Real-time telemetry feed"
                style={{
                  fontSize: '0.6875rem',
                  padding: '0.35rem 0.65rem',
                  background: '#f0fdf4',
                  border: '1px solid #86efac',
                  color: '#15803d',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <span className="pulse-dot" style={{ background: '#16a34a' }}></span>
                <span>🟢 LIVE</span>
              </div>
            ) : isUnavailable ? (
              <div
                id="system-status-indicator"
                className="badge badge-idle"
                title={apiStatus?.message || 'Data unavailable'}
                style={{
                  fontSize: '0.6875rem',
                  padding: '0.35rem 0.65rem',
                  background: '#fef3c7',
                  border: '1px solid #fcd34d',
                  color: '#b45309',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#d97706' }}></span>
                <span>🟡 OFFLINE</span>
              </div>
            ) : (
              <div
                id="system-status-indicator"
                className="badge badge-idle"
                style={{
                  fontSize: '0.6875rem',
                  padding: '0.35rem 0.65rem',
                  background: '#faf6f0',
                  border: '1px solid #fed7aa',
                  color: '#7c2d12',
                  fontWeight: 800
                }}
              >
                <span>🟡 DEMO</span>
              </div>
            )}

            {/* ========================================================= */}
            {/* --- DASHBOARD / MENU ICON IN TOP CORNER --- */}
            {/* ========================================================= */}
            <button
              id="btn-corner-dashboard-hub"
              className="btn-corner-dashboard"
              onClick={() => setDashboardHubOpen(true)}
              title="Open Navigation Drawer & Dashboard Hub"
              aria-label="Dashboard Menu"
            >
              <LayoutDashboard size={17} color="#ea580c" />
              <span>Dashboard</span>
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              id="btn-mobile-menu-toggle"
              className="nav-mobile-toggle"
              onClick={() => setDashboardHubOpen(true)}
              aria-label="Open Navigation Menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* ========================================================= */}
      {/* --- SLIDE-OUT NAVIGATION DRAWER / SIDEBAR --- */}
      {/* ========================================================= */}
      {dashboardHubOpen && (
        <div
          id="dashboard-hub-backdrop-modal"
          className="dashboard-hub-backdrop"
          onClick={() => setDashboardHubOpen(false)}
        >
          <div
            id="dashboard-hub-drawer-content"
            className="dashboard-hub-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1.5px solid #fed7aa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 3px 10px rgba(234, 88, 12, 0.3)'
                  }}
                >
                  <LayoutDashboard size={19} />
                </div>
                <div>
                  <div style={{ fontWeight: 850, fontSize: '1.05rem', color: '#1c1917', lineHeight: 1.2 }}>
                    Navigation & Dashboard
                  </div>
                  <div style={{ fontSize: '0.71875rem', color: '#78716c', fontWeight: 600 }}>
                    Coupled Forecasting Platform
                  </div>
                </div>
              </div>

              <button
                id="btn-close-dashboard-hub"
                onClick={() => setDashboardHubOpen(false)}
                aria-label="Close Navigation Drawer"
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #fed7aa',
                  color: '#78716c',
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--radius-full)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Live Telemetry Status Bar inside Drawer */}
            <div
              style={{
                padding: '0.85rem 1.5rem',
                background: '#faf6f0',
                borderBottom: '1px solid #eeddc8'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid #fed7aa' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="pulse-dot" style={{ background: isLive ? '#16a34a' : '#d97706' }}></span>
                  <span style={{ fontSize: '0.78125rem', fontWeight: 800, color: isLive ? '#15803d' : '#b45309' }}>
                    {isLive ? 'Live Sensor Feed' : 'Telemetry Offline'}
                  </span>
                </div>
                <div style={{ fontSize: '0.71875rem', fontWeight: 700, color: '#78716c' }}>
                  {activeStation ? activeStation.station_name : `${stations.length} Stations`}
                </div>
              </div>
            </div>

            {/* The 8 Main Navigation Options */}
            <div style={{ padding: '1.2rem 1.5rem', flex: 1 }}>
              <div style={{ fontSize: '0.71875rem', fontWeight: 800, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                Navigation Options
              </div>

              {primarySidebarItems.map((item) => {
                const ItemIcon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-nav-${item.id}`}
                    className={`dashboard-hub-item ${isActive ? 'active' : ''}`}
                    onClick={item.action}
                  >
                    <div
                      className="hub-item-icon"
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '9px',
                        background: item.bg,
                        color: item.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <ItemIcon size={18} />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.875rem', color: isActive ? '#c2410c' : '#1c1917' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#78716c', lineHeight: 1.25 }}>
                        {item.desc}
                      </div>
                    </div>

                    {item.badge && (
                      <span
                        style={{
                          fontSize: '0.625rem',
                          background: '#ea580c',
                          color: '#fff',
                          padding: '0.15rem 0.45rem',
                          borderRadius: 'var(--radius-full)',
                          fontWeight: 850,
                          letterSpacing: '0.04em'
                        }}
                      >
                        {item.badge}
                      </span>
                    )}

                    <ChevronRight size={15} color={isActive ? '#ea580c' : '#a8a29e'} style={{ opacity: 0.7 }} />
                  </button>
                );
              })}

              {/* Advanced System Tools Section */}
              <div style={{ fontSize: '0.71875rem', fontWeight: 800, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '1.25rem 0 0.5rem' }}>
                System Architecture & Tooling
              </div>

              {/* All Station Feeds */}
              <button
                id="sidebar-nav-data"
                className={`dashboard-hub-item ${activeTab === 'data' ? 'active' : ''}`}
                onClick={() => handleNavClick('data', null, 'data')}
              >
                <div className="hub-item-icon" style={{ width: '34px', height: '34px', borderRadius: '9px', background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Radio size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.875rem' }}>Station Sensor Feeds</div>
                  <div style={{ fontSize: '0.6875rem', color: '#78716c' }}>Continuous ambient observations</div>
                </div>
              </button>

              {/* Task Runner Simulator */}
              <button
                id="sidebar-nav-tasks"
                className={`dashboard-hub-item ${activeTab === 'tasks' ? 'active' : ''}`}
                onClick={() => handleNavClick('tasks', null, 'tasks')}
              >
                <div className="hub-item-icon" style={{ width: '34px', height: '34px', borderRadius: '9px', background: '#ffedd5', color: '#c2410c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Sliders size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.875rem' }}>Forecast Simulator Engine</div>
                  <div style={{ fontSize: '0.6875rem', color: '#78716c' }}>Direct manual ML task execution</div>
                </div>
              </button>

              {/* System Health Matrix */}
              <button
                id="sidebar-nav-health"
                className={`dashboard-hub-item ${activeTab === 'health' ? 'active' : ''}`}
                onClick={() => handleNavClick('health', null, 'health')}
              >
                <div className="hub-item-icon" style={{ width: '34px', height: '34px', borderRadius: '9px', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <HeartPulse size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.875rem' }}>System Telemetry & Health</div>
                  <div style={{ fontSize: '0.6875rem', color: '#78716c' }}>Service readiness & latency matrix</div>
                </div>
              </button>
            </div>

            {/* Drawer Footer with Quick Action */}
            <div
              style={{
                padding: '1rem 1.5rem',
                borderTop: '1.5px solid #eeddc8',
                background: '#fdfbf7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: '#78716c' }}>
                <Leaf size={14} color="#16a34a" />
                <span>SIH 2026 Delhi Platform</span>
              </div>
              <button
                id="drawer-btn-explore-forecast"
                onClick={triggerForecastOpen}
                className="btn-primary"
                style={{ padding: '0.5rem 1.1rem', fontSize: '0.8125rem', fontWeight: 800, gap: '6px' }}
              >
                <span>Explore Forecast</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}


