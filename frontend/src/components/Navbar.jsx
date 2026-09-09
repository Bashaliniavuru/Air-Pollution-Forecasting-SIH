import React, { useState } from 'react';
import { Leaf, MapPin, ChevronDown, User, Menu, X, ArrowRight, Activity } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  healthStatus,
  apiStatus,
  stations = [],
  selectedStationId,
  onSelectStation
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLive = apiStatus?.isLive === true || apiStatus?.status === 'LIVE';
  const isUnavailable = apiStatus?.status === 'UNAVAILABLE' || apiStatus?.status === 'OFFLINE';

  const scrollToSection = (id) => {
    setActiveTab('overview');
    setMobileMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 60);
  };

  const handleNavClick = (tabId, targetSection = null) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    if (targetSection) {
      scrollToSection(targetSection);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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
              handleNavClick('overview');
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
              className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => handleNavClick('overview')}
            >
              <span>Home</span>
            </button>

            <button
              id="nav-link-forecast"
              className="nav-tab"
              onClick={() => scrollToSection('section-24h-forecast')}
            >
              <span>Forecast</span>
            </button>

            <button
              id="nav-link-map"
              className="nav-tab"
              onClick={() => scrollToSection('delhi-hotspot-map-section')}
            >
              <span>Map</span>
            </button>

            <button
              id="nav-link-insights"
              className="nav-tab"
              onClick={() => scrollToSection('why-pollution-changing-section')}
            >
              <span>Insights</span>
            </button>

            <button
              id="nav-link-about"
              className={`nav-tab ${activeTab === 'modules' ? 'active' : ''}`}
              onClick={() => handleNavClick('modules')}
            >
              <span>About</span>
            </button>
          </div>

          {/* ========================================================= */}
          {/* --- RIGHT: DELHI NCR LOCATION SELECTOR & STATUS --- */}
          {/* ========================================================= */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
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
                    maxWidth: '150px'
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
                <span>🟢 LIVE DATA</span>
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
                <span>🟡 UNAVAILABLE</span>
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

            {/* Mobile Hamburger Menu Toggle Button */}
            <button
              id="btn-mobile-menu-toggle"
              className="nav-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ========================================================= */}
      {/* --- MOBILE DROPDOWN NAVIGATION DRAWER --- */}
      {/* ========================================================= */}
      <div
        id="mobile-nav-drawer"
        className={`mobile-nav-drawer ${mobileMenuOpen ? 'open' : ''}`}
      >
        <button
          className={`mobile-nav-link ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleNavClick('overview')}
        >
          <span>Home</span>
          <ArrowRight size={16} />
        </button>

        <button
          className="mobile-nav-link"
          onClick={() => scrollToSection('section-24h-forecast')}
        >
          <span>Forecast</span>
          <ArrowRight size={16} />
        </button>

        <button
          className="mobile-nav-link"
          onClick={() => scrollToSection('delhi-hotspot-map-section')}
        >
          <span>Map</span>
          <ArrowRight size={16} />
        </button>

        <button
          className="mobile-nav-link"
          onClick={() => scrollToSection('why-pollution-changing-section')}
        >
          <span>Insights</span>
          <ArrowRight size={16} />
        </button>

        <button
          className={`mobile-nav-link ${activeTab === 'modules' ? 'active' : ''}`}
          onClick={() => handleNavClick('modules')}
        >
          <span>About</span>
          <ArrowRight size={16} />
        </button>

        <button
          className={`mobile-nav-link ${activeTab === 'data' ? 'active' : ''}`}
          onClick={() => handleNavClick('data')}
        >
          <span>All Stations</span>
          <ArrowRight size={16} />
        </button>

        <button
          className={`mobile-nav-link ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => handleNavClick('tasks')}
        >
          <span>Simulator</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </header>
  );
}

