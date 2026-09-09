import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  ShieldAlert,
  Sparkles,
  Navigation,
  Layers,
  Compass,
  Wind,
  Droplets,
  Thermometer,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Activity,
  Layers3,
  Flame,
  CloudRain,
  Eye
} from 'lucide-react';

export default function DelhiMapHotspots({
  stations = [],
  selectedStationId,
  onSelectStation
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  const [activeFilter, setActiveFilter] = useState('ALL');
  const [tileLayerType, setTileLayerType] = useState('carto'); // 'carto' | 'osm'
  const [hoveredStation, setHoveredStation] = useState(null);

  // Delhi NCR Regional Bounding Center
  const NCR_CENTER = [28.6139, 77.2090];
  const NCR_DEFAULT_ZOOM = 10;

  // The 9 specific key localities requested
  const priorityLocalityIds = [
    'DELHI_CENTRAL',
    'DELHI_NEW_DELHI',
    'DELHI_ROHINI',
    'DELHI_DWARKA',
    'DELHI_SAKET',
    'DELHI_NOIDA',
    'DELHI_GHAZIABAD',
    'DELHI_GURUGRAM',
    'DELHI_FARIDABAD'
  ];

  // Helper for CPCB Risk Level & Color Token Mapping
  const getRiskInfo = (aqi, category) => {
    if (aqi > 400 || category === 'SEVERE' || category === 'SEVERE_PLUS') {
      return {
        level: 'SEVERE',
        label: 'Severe Risk',
        short: 'SEVERE',
        color: '#991b1b',
        bg: '#fef2f2',
        border: '#fecdd3',
        textColor: '#991b1b',
        glow: 'rgba(153, 27, 27, 0.45)'
      };
    }
    if (aqi > 300 || category === 'VERY_POOR') {
      return {
        level: 'VERY_POOR',
        label: 'Very Poor',
        short: 'VERY POOR',
        color: '#dc2626',
        bg: '#fff1f2',
        border: '#fecaca',
        textColor: '#dc2626',
        glow: 'rgba(220, 38, 38, 0.4)'
      };
    }
    if (aqi > 200 || category === 'POOR') {
      return {
        level: 'HIGH',
        label: 'High Risk',
        short: 'POOR',
        color: '#ea580c',
        bg: '#fff7ed',
        border: '#fed7aa',
        textColor: '#ea580c',
        glow: 'rgba(234, 88, 12, 0.4)'
      };
    }
    if (aqi > 100 || category === 'MODERATE') {
      return {
        level: 'MODERATE',
        label: 'Moderate Risk',
        short: 'MODERATE',
        color: '#d97706',
        bg: '#fffbeb',
        border: '#fde68a',
        textColor: '#b45309',
        glow: 'rgba(217, 119, 6, 0.35)'
      };
    }
    if (aqi > 50 || category === 'SATISFACTORY') {
      return {
        level: 'SATISFACTORY',
        label: 'Satisfactory',
        short: 'SATISFACTORY',
        color: '#0891b2',
        bg: '#ecfeff',
        border: '#a5f3fc',
        textColor: '#0e7490',
        glow: 'rgba(8, 145, 178, 0.35)'
      };
    }
    return {
      level: 'LOW',
      label: 'Low Risk',
      short: 'GOOD',
      color: '#16a34a',
      bg: '#f0fdf4',
      border: '#bbf7d0',
      textColor: '#15803d',
      glow: 'rgba(22, 163, 74, 0.35)'
    };
  };

  // Filter stations based on selected region filter chip
  const filteredStations = stations.filter((st) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'PRIORITY_9') {
      return priorityLocalityIds.includes(st.station_id);
    }
    if (activeFilter === 'DELHI_CORE') {
      return (
        st.station_id === 'DELHI_CENTRAL' ||
        st.station_id === 'DELHI_NEW_DELHI' ||
        st.station_id === 'DELHI_ROHINI' ||
        st.station_id === 'DELHI_DWARKA' ||
        st.station_id === 'DELHI_SAKET'
      );
    }
    if (activeFilter === 'NCR_SATELLITE') {
      return (
        st.station_id === 'DELHI_NOIDA' ||
        st.station_id === 'DELHI_GHAZIABAD' ||
        st.station_id === 'DELHI_GURUGRAM' ||
        st.station_id === 'DELHI_FARIDABAD'
      );
    }
    const nameUpper = st.station_name.toUpperCase();
    const locUpper = st.location.toUpperCase();
    return nameUpper.includes(activeFilter) || locUpper.includes(activeFilter);
  });

  // Active selected station object
  const activeStation =
    stations.find((s) => s.station_id === selectedStationId) || stations[0] || null;
  const activeRisk = activeStation
    ? getRiskInfo(activeStation.current_aqi, activeStation.category)
    : null;

  // Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: NCR_CENTER,
        zoom: NCR_DEFAULT_ZOOM,
        minZoom: 9,
        maxZoom: 15,
        zoomControl: false,
        attributionControl: false
      });

      // Default Clean Warm Voyager Tile Layer
      const voyagerTile = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          subdomains: 'abcd',
          maxZoom: 19
        }
      );

      voyagerTile.addTo(map);

      // Attribution
      L.control
        .attribution({
          position: 'bottomright',
          prefix:
            '<span style="font-size:10px; color:#78716c;">© <a href="https://www.openstreetmap.org/copyright" target="_blank" style="color:#ea580c;">OpenStreetMap</a> contributors • Leaflet</span>'
        })
        .addTo(map);

      // Dedicated layer group for all Delhi NCR markers
      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Switch Tile Layer when tileLayerType changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    let newTileUrl = '';
    if (tileLayerType === 'osm') {
      newTileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    } else {
      newTileUrl =
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    }

    L.tileLayer(newTileUrl, {
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);
  }, [tileLayerType]);

  // Render and Update Custom Markers
  const renderMarkers = useCallback(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    filteredStations.forEach((st) => {
      if (!st.lat || !st.lon) return;

      const isSelected = st.station_id === selectedStationId;
      const risk = getRiskInfo(st.current_aqi, st.category);

      // Custom HTML Marker Element
      const markerHtml = `
        <div class="delhi-ncr-custom-marker ${isSelected ? 'is-selected' : ''}" style="--marker-color: ${risk.color}; --marker-bg: ${risk.bg}; --marker-glow: ${risk.glow};">
          ${isSelected ? '<div class="marker-pulse-radar"></div>' : ''}
          <div class="marker-card-bubble">
            <div class="marker-top-row">
              <span class="marker-locality-title">${st.station_name.replace(' Station', '')}</span>
              <span class="marker-risk-badge" style="background: ${risk.color}; color: #ffffff;">${risk.short}</span>
            </div>
            <div class="marker-bottom-row">
              <span class="marker-aqi-label">AQI</span>
              <span class="marker-aqi-number" style="color: ${risk.color};">${st.current_aqi}</span>
            </div>
          </div>
          <div class="marker-pointer-stem" style="border-top-color: ${risk.color};"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'leaflet-ncr-custom-div-icon',
        iconSize: [110, 52],
        iconAnchor: [55, 52],
        popupAnchor: [0, -50]
      });

      const marker = L.marker([st.lat, st.lon], {
        icon: customIcon,
        zIndexOffset: isSelected ? 1000 : 100
      });

      // Interactive Popup with coupled telemetry summary
      const popupContent = `
        <div class="delhi-ncr-map-popup">
          <div class="popup-header">
            <div>
              <div class="popup-title">${st.station_name}</div>
              <div class="popup-sub">${st.location}</div>
            </div>
            <span class="popup-risk-tag" style="background: ${risk.bg}; color: ${risk.color}; border: 1px solid ${risk.border};">
              ${risk.label}
            </span>
          </div>
          
          <div class="popup-aqi-row">
            <div class="popup-aqi-box">
              <span class="popup-aqi-lbl">Current AQI</span>
              <span class="popup-aqi-val" style="color: ${risk.color};">${st.current_aqi}</span>
            </div>
            <div class="popup-aqi-status">
              <span>Category: <strong>${st.category.replace('_', ' ')}</strong></span>
              <span>PM2.5: <strong>${st.pm2_5} µg/m³</strong></span>
            </div>
          </div>

          <div class="popup-weather-grid">
            <div class="popup-weather-item">
              <span class="lbl">Temp</span>
              <span class="val">${st.temperature_c}°C</span>
            </div>
            <div class="popup-weather-item">
              <span class="lbl">Humidity</span>
              <span class="val">${st.humidity_pct}%</span>
            </div>
            <div class="popup-weather-item">
              <span class="lbl">Wind</span>
              <span class="val">${st.wind_speed_kmh} km/h</span>
            </div>
            <div class="popup-weather-item">
              <span class="lbl">PBL Height</span>
              <span class="val">${st.pbl_height_m} m</span>
            </div>
          </div>

          <div class="popup-cta-hint">
            ${isSelected ? '✓ Currently Selected Station' : '👆 Click marker to synchronize full dashboard telemetry'}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: false,
        className: 'delhi-ncr-leaflet-popup-wrapper',
        maxWidth: 280
      });

      // Marker Click Event: Triggers 8-way global synchronization
      marker.on('click', () => {
        onSelectStation(st.station_id);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([st.lat, st.lon], 11, {
            duration: 0.6,
            easeLinearity: 0.25
          });
        }
      });

      marker.on('mouseover', () => {
        setHoveredStation(st);
      });

      marker.on('mouseout', () => {
        setHoveredStation(null);
      });

      marker.addTo(markersLayer);
    });
  }, [filteredStations, selectedStationId, onSelectStation]);

  useEffect(() => {
    renderMarkers();
  }, [renderMarkers]);

  // Smoothly center on selected station when selection changes
  const handleLocalityChipClick = (stationId) => {
    onSelectStation(stationId);
    const target = stations.find((s) => s.station_id === stationId);
    if (target && mapInstanceRef.current && target.lat && target.lon) {
      mapInstanceRef.current.flyTo([target.lat, target.lon], 11.5, {
        duration: 0.7
      });
    }
  };

  const handleResetMap = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(NCR_CENTER, NCR_DEFAULT_ZOOM, {
        duration: 0.6
      });
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const filterTabs = [
    { id: 'ALL', label: 'All Delhi-NCR' },
    { id: 'PRIORITY_9', label: '9 Core Localities' },
    { id: 'DELHI_CORE', label: 'Delhi Core' },
    { id: 'NCR_SATELLITE', label: 'NCR Satellite' }
  ];

  // Specific 9 required localities for direct quick selector buttons
  const coreNineLocalities = [
    { name: 'Delhi', id: 'DELHI_CENTRAL' },
    { name: 'New Delhi', id: 'DELHI_NEW_DELHI' },
    { name: 'Rohini', id: 'DELHI_ROHINI' },
    { name: 'Dwarka', id: 'DELHI_DWARKA' },
    { name: 'Saket', id: 'DELHI_SAKET' },
    { name: 'Noida', id: 'DELHI_NOIDA' },
    { name: 'Ghaziabad', id: 'DELHI_GHAZIABAD' },
    { name: 'Gurugram', id: 'DELHI_GURUGRAM' },
    { name: 'Faridabad', id: 'DELHI_FARIDABAD' }
  ];

  return (
    <div
      id="delhi-hotspot-map-section"
      className="white-card"
      style={{
        padding: '1.5rem',
        background: '#ffffff',
        border: '1.5px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 30px rgba(180, 83, 9, 0.06)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* ========================================================= */}
      {/* 1. HEADER & INTERACTIVE REGIONAL CONTROLS */}
      {/* ========================================================= */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.85rem'
        }}
      >
        {/* Title & Regional Context */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              padding: '0.55rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)',
              color: '#ea580c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(234, 88, 12, 0.15)'
            }}
          >
            <MapPin size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 850,
                  color: 'var(--text-primary)',
                  margin: 0,
                  fontFamily: 'var(--font-heading)'
                }}
              >
                Delhi NCR AQI Map
              </h3>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  background: '#f0fdf4',
                  color: '#15803d',
                  border: '1px solid #bbf7d0',
                  padding: '0.15rem 0.5rem',
                  borderRadius: 'var(--radius-full)'
                }}
              >
                Live OpenStreetMap
              </span>
            </div>
            <span style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)' }}>
              Interactive spatial monitoring • Click any marker to synchronize AQI, pollutants, weather, forecast, risk & AI insight
            </span>
          </div>
        </div>

        {/* Tile & View Switchers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Tile Layer Selector */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#fdfbf7',
              border: '1px solid #eeddc8',
              borderRadius: 'var(--radius-full)',
              padding: '2px'
            }}
          >
            <button
              onClick={() => setTileLayerType('carto')}
              style={{
                background: tileLayerType === 'carto' ? '#ea580c' : 'transparent',
                color: tileLayerType === 'carto' ? '#ffffff' : '#78716c',
                border: 'none',
                padding: '0.25rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.71875rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Warm Map
            </button>
            <button
              onClick={() => setTileLayerType('osm')}
              style={{
                background: tileLayerType === 'osm' ? '#ea580c' : 'transparent',
                color: tileLayerType === 'osm' ? '#ffffff' : '#78716c',
                border: 'none',
                padding: '0.25rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.71875rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              OpenStreetMap
            </button>
          </div>

          {/* Reset Map View */}
          <button
            onClick={handleResetMap}
            title="Reset Delhi-NCR Center"
            style={{
              background: '#fdfbf7',
              border: '1px solid #eeddc8',
              color: '#57534e',
              padding: '0.35rem 0.65rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.71875rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease'
            }}
          >
            <RotateCcw size={12} color="#ea580c" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. REGION FILTER & THE 9 CORE LOCALITY CHIPS */}
      {/* ========================================================= */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          marginBottom: '0.85rem'
        }}
      >
        {/* The 9 Specific Localities (Delhi, New Delhi, Rohini, Dwarka, Saket, Noida, Ghaziabad, Gurugram, Faridabad) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            flexWrap: 'wrap',
            background: '#faf6f0',
            padding: '0.45rem 0.65rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid #eeddc8'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              color: '#9a3412',
              fontWeight: 800,
              marginRight: '0.2rem'
            }}
          >
            <Navigation size={13} color="#ea580c" />
            <span>9 Key Localities:</span>
          </div>

          {coreNineLocalities.map((loc) => {
            const isSelected = selectedStationId === loc.id;
            const stationData = stations.find((s) => s.station_id === loc.id);
            const risk = stationData
              ? getRiskInfo(stationData.current_aqi, stationData.category)
              : { color: '#ea580c', short: 'AQI --' };

            return (
              <button
                key={loc.id}
                id={`map-core-chip-${loc.id}`}
                onClick={() => handleLocalityChipClick(loc.id)}
                style={{
                  background: isSelected ? '#ea580c' : '#ffffff',
                  color: isSelected ? '#ffffff' : '#292524',
                  border: isSelected ? '1.5px solid #c2410c' : '1px solid #eeddc8',
                  padding: '0.22rem 0.55rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.71875rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: isSelected
                    ? '0 2px 8px rgba(234, 88, 12, 0.3)'
                    : '0 1px 3px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{loc.name}</span>
                {stationData && (
                  <span
                    style={{
                      fontSize: '0.65625rem',
                      fontWeight: 800,
                      color: isSelected ? '#fed7aa' : risk.color,
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    {stationData.current_aqi}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. LEAFLET / OPENSTREETMAP INTERACTIVE CANVAS */}
      {/* ========================================================= */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '460px',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: '1.5px solid #eeddc8',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.04)'
        }}
      >
        {/* Leaflet Map DOM Target */}
        <div
          ref={mapContainerRef}
          id="leaflet-delhi-ncr-map-target"
          style={{ width: '100%', height: '100%', zIndex: 1 }}
        />

        {/* Custom On-Map Zoom Controls */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 400,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.12)',
            border: '1px solid #eeddc8',
            backdropFilter: 'blur(8px)'
          }}
        >
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            style={{
              width: '28px',
              height: '28px',
              background: '#ffffff',
              border: '1px solid #fed7aa',
              borderRadius: 'var(--radius-sm)',
              fontSize: '1rem',
              fontWeight: 800,
              color: '#ea580c',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1
            }}
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            style={{
              width: '28px',
              height: '28px',
              background: '#ffffff',
              border: '1px solid #fed7aa',
              borderRadius: 'var(--radius-sm)',
              fontSize: '1rem',
              fontWeight: 800,
              color: '#ea580c',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1
            }}
          >
            -
          </button>
        </div>

        {/* Spatial Legend Overlay Badge */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            zIndex: 400,
            background: 'rgba(255, 255, 255, 0.94)',
            padding: '0.45rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #eeddc8',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            backdropFilter: 'blur(8px)',
            maxWidth: '240px',
            pointerEvents: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
            <Activity size={12} color="#ea580c" />
            <span style={{ fontSize: '0.71875rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Delhi-NCR Spatial AQI
            </span>
          </div>
          <div style={{ fontSize: '0.65625rem', color: 'var(--text-muted)' }}>
            Showing {filteredStations.length} active stations with real-time coupled meteorology.
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. ACTIVE SELECTED LOCATION SYNCHRONIZATION BANNER */}
      {/* ========================================================= */}
      {activeStation && activeRisk && (
        <div
          id="map-active-station-sync-card"
          style={{
            marginTop: '0.85rem',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-lg)',
            background: activeRisk.bg,
            border: `1.5px solid ${activeRisk.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            transition: 'all 0.2s ease'
          }}
        >
          {/* Left: Active Station Details */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: activeRisk.color,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '0.8125rem',
                boxShadow: `0 0 12px ${activeRisk.glow}`
              }}
            >
              {activeStation.current_aqi}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ fontWeight: 850, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                  {activeStation.station_name}
                </span>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    background: activeRisk.color,
                    color: '#ffffff',
                    padding: '0.1rem 0.45rem',
                    borderRadius: 'var(--radius-full)'
                  }}
                >
                  {activeRisk.label}
                </span>
              </div>
              <div style={{ fontSize: '0.71875rem', color: 'var(--text-secondary)' }}>
                {activeStation.location} • PM2.5: <strong>{activeStation.pm2_5} µg/m³</strong> • Wind: <strong>{activeStation.wind_speed_kmh} km/h</strong> • PBL: <strong>{activeStation.pbl_height_m} m</strong>
              </div>
            </div>
          </div>

          {/* Right: Cascade Sync Indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                fontSize: '0.71875rem',
                color: '#15803d',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: '#ffffff',
                padding: '0.3rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid #bbf7d0'
              }}
            >
              <CheckCircle2 size={13} color="#16a34a" />
              <span>Full Dashboard Synchronized</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. CPCB AQI RISK LEVEL LEGEND FOOTER */}
      {/* ========================================================= */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.6rem',
          marginTop: '0.85rem',
          paddingTop: '0.85rem',
          borderTop: '1px solid #f5eee4',
          fontSize: '0.71875rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#16a34a' }} />
            <span>Good (0-50)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#0891b2' }} />
            <span>Satisfactory (51-100)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#d97706' }} />
            <span>Moderate (101-200)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ea580c' }} />
            <span>Poor (201-300)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#dc2626' }} />
            <span>Very Poor (301-400)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#991b1b' }} />
            <span>Severe (401+)</span>
          </div>
        </div>

        <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>
          Standard CPCB National Air Quality Index Categories
        </div>
      </div>
    </div>
  );
}
