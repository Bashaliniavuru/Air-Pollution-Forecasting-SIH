import React, { useState } from 'react';
import { MapPin, Search, ChevronDown, Compass, Navigation } from 'lucide-react';

export default function LocationSelector({ stations = [], selectedStationId, onSelectStation }) {
  const [searchTerm, setSearchTerm] = useState('');

  const getCategoryColor = (category) => {
    switch (category) {
      case 'GOOD': return '#16a34a';
      case 'SATISFACTORY': return '#0891b2';
      case 'MODERATE': return '#f59e0b';
      case 'POOR': return '#ea580c';
      case 'VERY_POOR': return '#dc2626';
      case 'SEVERE':
      case 'SEVERE_PLUS': return '#991b1b';
      default: return '#78716c';
    }
  };

  const [selectedZone, setSelectedZone] = useState('ALL');

  const selectedStation = stations.find(s => s.station_id === selectedStationId) || stations[0];

  const zones = [
    { id: 'ALL', label: 'All Delhi (19)' },
    { id: 'CENTRAL', label: 'Central' },
    { id: 'NORTH', label: 'North' },
    { id: 'SOUTH', label: 'South' },
    { id: 'EAST', label: 'East' },
    { id: 'WEST', label: 'West' }
  ];

  const filteredStations = stations.filter(st => {
    const matchesSearch = st.station_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    if (selectedZone === 'ALL') return true;
    return st.location.toUpperCase().includes(selectedZone);
  });

  return (
    <div
      id="delhi-location-selector"
      className="white-card"
      style={{
        marginBottom: '1.75rem',
        padding: '1.25rem 1.5rem',
        border: '1.5px solid var(--border-subtle)',
        background: '#ffffff'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              padding: '0.45rem',
              borderRadius: 'var(--radius-sm)',
              background: '#ffedd5',
              color: '#ea580c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <MapPin size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Delhi Locality & Monitoring Area Selector
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              19 monitored National Capital Territory (NCT) Delhi localities • Filter by zone or search
            </span>
          </div>
        </div>

        {/* Search Input and Dropdown */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              id="input-locality-search"
              type="text"
              placeholder="Search Delhi locality..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                background: '#fdfbf7',
                border: '1.5px solid #eeddc8',
                borderRadius: 'var(--radius-md)',
                padding: '0.55rem 0.85rem 0.55rem 2rem',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                outline: 'none'
              }}
            />
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#ea580c'
              }}
            />
          </div>

          <div style={{ position: 'relative', minWidth: '200px' }}>
            <select
              id="select-station-dropdown"
              value={selectedStationId}
              onChange={(e) => onSelectStation(e.target.value)}
              style={{
                width: '100%',
                background: '#ffffff',
                border: '1.5px solid #fed7aa',
                borderRadius: 'var(--radius-md)',
                padding: '0.55rem 2rem 0.55rem 0.85rem',
                color: '#1c1917',
                fontSize: '0.8125rem',
                fontWeight: 700,
                appearance: 'none',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {stations.map((st) => (
                <option key={st.station_id} value={st.station_id}>
                  {st.station_name} — AQI {st.current_aqi} ({st.category})
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: '#ea580c'
              }}
            />
          </div>
        </div>
      </div>

      {/* Zone Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '0.25rem', fontWeight: 700 }}>
          Zones:
        </span>
        {zones.map((z) => {
          const isActive = selectedZone === z.id;
          return (
            <button
              key={z.id}
              onClick={() => setSelectedZone(z.id)}
              style={{
                background: isActive ? '#ea580c' : '#f5eee4',
                border: 'none',
                color: isActive ? '#ffffff' : '#57534e',
                padding: '0.25rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
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

      {/* Quick Select Locality Chips */}
      <div
        className="custom-scroll"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
          gap: '0.5rem',
          maxHeight: '145px',
          overflowY: 'auto',
          paddingRight: '4px'
        }}
      >
        {filteredStations.map((st) => {
          const isSelected = st.station_id === selectedStationId;
          const catColor = getCategoryColor(st.category);

          return (
            <button
              key={st.station_id}
              id={`station-chip-${st.station_id}`}
              onClick={() => onSelectStation(st.station_id)}
              style={{
                textAlign: 'left',
                background: isSelected ? '#fff7ed' : '#fdfbf7',
                border: isSelected ? '1.5px solid #ea580c' : '1px solid #eeddc8',
                borderRadius: 'var(--radius-md)',
                padding: '0.5rem 0.75rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: isSelected ? 800 : 600, color: isSelected ? '#ea580c' : 'var(--text-primary)' }}>
                  {st.station_name.replace(' Station', '')}
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  color: catColor,
                  background: `${catColor}15`,
                  padding: '0.1rem 0.35rem',
                  borderRadius: 'var(--radius-full)',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                {st.current_aqi}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
