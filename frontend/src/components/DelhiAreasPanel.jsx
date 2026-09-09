import React, { useState } from 'react';
import { MapPin, Search, ChevronRight, Filter } from 'lucide-react';

export default function DelhiAreasPanel({ stations = [], selectedStationId, onSelectStation }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState('ALL');

  const getCategoryColor = (category) => {
    switch (category) {
      case 'GOOD': return { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' };
      case 'SATISFACTORY': return { bg: '#ecfeff', text: '#0891b2', border: '#a5f3fc' };
      case 'MODERATE': return { bg: '#fffbeb', text: '#d97706', border: '#fde68a' };
      case 'POOR': return { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' };
      case 'VERY_POOR': return { bg: '#fff1f2', text: '#dc2626', border: '#fecaca' };
      case 'SEVERE':
      case 'SEVERE_PLUS': return { bg: '#fef2f2', text: '#991b1b', border: '#fecdd3' };
      default: return { bg: '#faf6f0', text: '#57534e', border: '#eeddc8' };
    }
  };

  const zones = [
    { id: 'ALL', label: 'All NCR' },
    { id: 'CENTRAL', label: 'Central' },
    { id: 'NORTH', label: 'North' },
    { id: 'SOUTH', label: 'South' },
    { id: 'EAST', label: 'East' },
    { id: 'WEST', label: 'West' },
    { id: 'NCR', label: 'NCR Satellite' }
  ];

  const filteredStations = stations.filter((st) => {
    const matchesSearch =
      st.station_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.location.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedZone === 'ALL') return true;
    if (selectedZone === 'NCR') {
      return (
        st.station_id === 'DELHI_NOIDA' ||
        st.station_id === 'DELHI_GHAZIABAD' ||
        st.station_id === 'DELHI_GURUGRAM' ||
        st.station_id === 'DELHI_FARIDABAD' ||
        st.location.toUpperCase().includes('NCR')
      );
    }
    return st.location.toUpperCase().includes(selectedZone);
  });

  return (
    <div
      id="delhi-areas-panel"
      className="white-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '440px',
        padding: '1.5rem',
        background: '#ffffff',
        border: '1.5px solid var(--border-subtle)'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              padding: '0.35rem',
              borderRadius: 'var(--radius-sm)',
              background: '#ffedd5',
              color: '#ea580c'
            }}
          >
            <MapPin size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Delhi-NCR Areas Directory
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {stations.length || 23} Regional Monitoring Stations
            </span>
          </div>
        </div>

        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            color: '#ea580c',
            background: '#fff7ed',
            padding: '0.2rem 0.65rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid #fed7aa'
          }}
        >
          {filteredStations.length} Localities
        </span>
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
        <input
          id="input-areas-panel-search"
          type="text"
          placeholder="Search Delhi area..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            background: '#fdfbf7',
            border: '1.5px solid #eeddc8',
            borderRadius: 'var(--radius-md)',
            padding: '0.55rem 0.75rem 0.55rem 2.1rem',
            color: 'var(--text-primary)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
        />
        <Search
          size={14}
          style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#ea580c'
          }}
        />
      </div>

      {/* Zone Filter Chips */}
      <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
        {zones.map((z) => {
          const isActive = selectedZone === z.id;
          return (
            <button
              key={z.id}
              onClick={() => setSelectedZone(z.id)}
              style={{
                background: isActive ? '#ea580c' : '#f5eee4',
                color: isActive ? '#ffffff' : '#57534e',
                border: 'none',
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.6875rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {z.label}
            </button>
          );
        })}
      </div>

      {/* Area List */}
      <div
        className="custom-scroll"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.45rem',
          flex: 1,
          maxHeight: '380px',
          overflowY: 'auto',
          paddingRight: '4px'
        }}
      >
        {filteredStations.map((st) => {
          const isSelected = st.station_id === selectedStationId;
          const theme = getCategoryColor(st.category);

          return (
            <div
              key={st.station_id}
              id={`area-panel-item-${st.station_id}`}
              onClick={() => onSelectStation(st.station_id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.6rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                background: isSelected ? '#fff7ed' : '#fdfbf7',
                border: isSelected ? '1.5px solid #ea580c' : '1px solid #eeddc8',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ overflow: 'hidden', paddingRight: '0.5rem' }}>
                <div
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: isSelected ? 800 : 600,
                    color: isSelected ? '#ea580c' : 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {st.station_name.replace(' Station', '')}
                </div>
                <div
                  style={{
                    fontSize: '0.6875rem',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {st.location.split('(')[0]}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: theme.text,
                    background: theme.bg,
                    border: `1px solid ${theme.border}`,
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  AQI {st.current_aqi}
                </span>
                <ChevronRight size={14} color={isSelected ? '#ea580c' : '#a8a29e'} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
