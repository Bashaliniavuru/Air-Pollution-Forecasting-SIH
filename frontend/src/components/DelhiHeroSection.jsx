import React, { useState, useRef, useCallback } from 'react';
import { MapPin, Search, ChevronDown, ArrowRight, Navigation, Leaf, Sparkles, Wind } from 'lucide-react';

export default function DelhiHeroSection({
  selectedStationName = 'Delhi (NCT Overview)',
  stations = [],
  selectedStationId,
  onSelectStation,
  onExploreForecast
}) {
  const containerRef = useRef(null);
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 to 1
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2; // -1 to 1
    setParallaxOffset({ x, y });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setParallaxOffset({ x: 0, y: 0 });
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      if (id === 'section-24h-forecast') {
        el.classList.add('forecast-section-highlight');
        setTimeout(() => el.classList.remove('forecast-section-highlight'), 2800);
      }
    }
  };

  const handleExploreForecastClick = () => {
    if (onExploreForecast) {
      onExploreForecast();
    } else {
      scrollToSection('section-24h-forecast');
    }
  };

  // Key Delhi-NCR Localities
  const delhiAreas = [
    { name: 'Delhi', id: 'DELHI_CENTRAL' },
    { name: 'New Delhi', id: 'DELHI_NEW_DELHI' },
    { name: 'Rohini', id: 'DELHI_ROHINI' },
    { name: 'Dwarka', id: 'DELHI_DWARKA' },
    { name: 'Saket', id: 'DELHI_SAKET' },
    { name: 'Noida', id: 'DELHI_NOIDA' },
    { name: 'Ghaziabad', id: 'DELHI_GHAZIABAD' },
    { name: 'Gurugram', id: 'DELHI_GURUGRAM' },
    { name: 'Faridabad', id: 'DELHI_FARIDABAD' },
    { name: 'Punjabi Bagh', id: 'DELHI_PUNJABI_BAGH' },
    { name: 'Anand Vihar', id: 'DELHI_ANAND_VIHAR' }
  ];

  const activeStation = stations.find(s => s.station_id === selectedStationId) || stations[0];

  return (
    <div
      ref={containerRef}
      id="delhi-hero-banner"
      className="hero-delhi-container"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-2xl)',
        overflow: 'hidden',
        marginBottom: '2rem',
        minHeight: '490px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '3.1rem 2.85rem 3.1rem',
        boxShadow: '0 20px 50px rgba(180, 83, 9, 0.16)',
        border: '1.5px solid rgba(254, 215, 170, 0.85)',
        background: 'linear-gradient(180deg, #ea580c 0%, #f97316 25%, #fb923c 50%, #fed7aa 75%, #fef3c7 92%, #faf6f0 100%)'
      }}
    >
      {/* ========================================================= */}
      {/* --- CINEMATIC DELHI ATMOSPHERE & MULTI-LAYER SKY --- */}
      {/* ========================================================= */}

      {/* 1. Background Image Layer with Subtle Depth Parallax */}
      <div
        className="hero-bg-image"
        style={{
          position: 'absolute',
          inset: '-15px',
          backgroundImage: `url('/delhi_hero_sunset.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 38%',
          opacity: 0.88,
          zIndex: 0,
          pointerEvents: 'none',
          transform: `translate3d(${parallaxOffset.x * -6}px, ${parallaxOffset.y * -3}px, 0)`,
          transition: 'transform 0.45s cubic-bezier(0.2, 0.8, 0.4, 1)'
        }}
      />

      {/* 2. Soft Atmospheric Sunset Haze & Contrast Masks */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, rgba(254, 243, 199, 0.96) 0%, rgba(254, 243, 199, 0.84) 42%, rgba(254, 215, 170, 0.48) 70%, rgba(251, 146, 60, 0.15) 100%)',
          zIndex: 1,
          pointerEvents: 'none'
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 12% 24%, rgba(255, 255, 255, 0.75) 0%, transparent 62%)',
          zIndex: 1,
          pointerEvents: 'none'
        }}
      />

      {/* 3. Luminous Golden Sun Disc with Breathing Glow & Parallax */}
      <div
        style={{
          position: 'absolute',
          top: '25px',
          right: '24%',
          pointerEvents: 'none',
          zIndex: 1,
          transform: `translate3d(${parallaxOffset.x * -10}px, ${parallaxOffset.y * -5}px, 0)`,
          transition: 'transform 0.45s cubic-bezier(0.2, 0.8, 0.4, 1)'
        }}
      >
        <div
          className="anim-sun-breathe"
          style={{
            width: '130px',
            height: '130px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #ffffff 15%, #fef08a 40%, rgba(253, 224, 71, 0.5) 65%, rgba(251, 146, 60, 0) 80%)',
            boxShadow: '0 0 60px rgba(254, 240, 138, 0.9), 0 0 100px rgba(251, 146, 60, 0.4)',
            opacity: 0.85
          }}
        />
      </div>

      {/* ========================================================= */}
      {/* --- MULTIPLE CONTINUOUS CLOUD LAYERS (DIFFERENT SPEEDS) --- */}
      {/* ========================================================= */}

      {/* Cloud Layer 1: High Atmosphere Soft Cirrus Clouds (Very Slow, 120s Loop) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 1,
          transform: `translate3d(${parallaxOffset.x * 12}px, ${parallaxOffset.y * 4}px, 0)`,
          transition: 'transform 0.45s cubic-bezier(0.2, 0.8, 0.4, 1)'
        }}
      >
        {/* Stream 1 */}
        <div
          className="cloud-layer-slow-1"
          style={{
            position: 'absolute',
            top: '8px',
            left: '0%',
            width: '280px',
            opacity: 0.28,
            filter: 'blur(1.2px)'
          }}
        >
          <svg width="280" height="95" viewBox="0 0 280 95" fill="none">
            <path
              d="M 40 75 Q 20 75 20 58 Q 20 38 48 38 Q 60 12 98 20 Q 135 0 178 24 Q 215 12 238 40 Q 265 40 265 58 Q 265 75 238 75 Z"
              fill="#ffffff"
            />
          </svg>
        </div>

        {/* Stream 2 (Offset by -60s for continuous stream) */}
        <div
          className="cloud-layer-slow-2"
          style={{
            position: 'absolute',
            top: '18px',
            left: '0%',
            width: '260px',
            opacity: 0.26,
            filter: 'blur(1px)'
          }}
        >
          <svg width="260" height="90" viewBox="0 0 260 90" fill="none">
            <path
              d="M 35 70 Q 15 70 15 54 Q 15 36 44 36 Q 55 10 90 18 Q 125 0 165 22 Q 200 10 220 38 Q 248 38 248 54 Q 248 70 220 70 Z"
              fill="#fffdfa"
            />
          </svg>
        </div>
      </div>

      {/* Cloud Layer 2: Mid Atmosphere Sunset Clouds (Medium Speed, 85s Loop) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 1,
          transform: `translate3d(${parallaxOffset.x * 20}px, ${parallaxOffset.y * 7}px, 0)`,
          transition: 'transform 0.45s cubic-bezier(0.2, 0.8, 0.4, 1)'
        }}
      >
        {/* Stream 1 */}
        <div
          className="cloud-layer-mid-1"
          style={{
            position: 'absolute',
            top: '48px',
            left: '0%',
            width: '210px',
            opacity: 0.38
          }}
        >
          <svg width="210" height="75" viewBox="0 0 210 75" fill="none">
            <path
              d="M 30 60 Q 12 60 12 44 Q 12 28 38 28 Q 48 10 78 16 Q 108 5 138 18 Q 168 10 185 32 Q 202 32 202 44 Q 202 60 185 60 Z"
              fill="#ffffff"
              filter="drop-shadow(0 4px 16px rgba(254, 215, 170, 0.8))"
            />
          </svg>
        </div>

        {/* Stream 2 (Offset by -42.5s) */}
        <div
          className="cloud-layer-mid-2"
          style={{
            position: 'absolute',
            top: '65px',
            left: '0%',
            width: '190px',
            opacity: 0.35
          }}
        >
          <svg width="190" height="70" viewBox="0 0 190 70" fill="none">
            <path
              d="M 28 55 Q 10 55 10 40 Q 10 26 35 26 Q 44 8 72 14 Q 100 4 126 16 Q 154 8 170 28 Q 186 28 186 40 Q 186 55 170 55 Z"
              fill="#fffbf5"
              filter="drop-shadow(0 4px 14px rgba(254, 215, 170, 0.7))"
            />
          </svg>
        </div>
      </div>

      {/* Cloud Layer 3: Horizon Atmospheric Mist Wisps (Gentle Drift, 60s Loop) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 1,
          transform: `translate3d(${parallaxOffset.x * 28}px, ${parallaxOffset.y * 10}px, 0)`,
          transition: 'transform 0.45s cubic-bezier(0.2, 0.8, 0.4, 1)'
        }}
      >
        {/* Stream 1 */}
        <div
          className="cloud-layer-fast-1"
          style={{
            position: 'absolute',
            top: '88px',
            left: '0%',
            width: '160px',
            opacity: 0.28
          }}
        >
          <svg width="160" height="55" viewBox="0 0 160 55" fill="none">
            <path
              d="M 22 45 Q 8 45 8 32 Q 8 20 28 20 Q 36 6 60 12 Q 82 4 104 14 Q 126 8 140 24 Q 154 24 154 32 Q 154 45 140 45 Z"
              fill="#ffffff"
            />
          </svg>
        </div>

        {/* Stream 2 (Offset by -30s) */}
        <div
          className="cloud-layer-fast-2"
          style={{
            position: 'absolute',
            top: '110px',
            left: '0%',
            width: '140px',
            opacity: 0.24
          }}
        >
          <svg width="140" height="50" viewBox="0 0 140 50" fill="none">
            <path
              d="M 20 40 Q 6 40 6 28 Q 6 18 24 18 Q 30 6 52 10 Q 72 3 92 12 Q 110 7 122 21 Q 135 21 135 28 Q 135 40 122 40 Z"
              fill="#fffaf0"
            />
          </svg>
        </div>
      </div>

      {/* ========================================================= */}
      {/* --- SUBTLE FLOATING ENVIRONMENTAL ELEMENTS & PARTICLES --- */}
      {/* ========================================================= */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 1,
          transform: `translate3d(${parallaxOffset.x * 35}px, ${parallaxOffset.y * 12}px, 0)`,
          transition: 'transform 0.45s cubic-bezier(0.2, 0.8, 0.4, 1)'
        }}
      >
        {/* Floating Golden Mote 1 */}
        <div
          className="anim-particle-1"
          style={{
            position: 'absolute',
            bottom: '35%',
            left: '42%',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #fef08a 20%, #f97316 100%)',
            boxShadow: '0 0 10px rgba(254, 240, 138, 0.9)'
          }}
        />

        {/* Floating Golden Mote 2 */}
        <div
          className="anim-particle-2"
          style={{
            position: 'absolute',
            bottom: '25%',
            left: '60%',
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #ffffff 20%, #fb923c 100%)',
            boxShadow: '0 0 12px rgba(251, 146, 60, 0.8)'
          }}
        />

        {/* Floating Golden Mote 3 */}
        <div
          className="anim-particle-3"
          style={{
            position: 'absolute',
            bottom: '45%',
            left: '75%',
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #bbf7d0 20%, #16a34a 100%)',
            boxShadow: '0 0 10px rgba(34, 197, 94, 0.7)'
          }}
        />

        {/* Floating Green Leaf Mote 1 */}
        <div
          className="anim-leaf-mote-1"
          style={{
            position: 'absolute',
            bottom: '30%',
            right: '28%',
            color: '#16a34a',
            opacity: 0.65
          }}
        >
          <Leaf size={14} />
        </div>

        {/* Floating Green Leaf Mote 2 */}
        <div
          className="anim-leaf-mote-2"
          style={{
            position: 'absolute',
            bottom: '50%',
            right: '18%',
            color: '#15803d',
            opacity: 0.55
          }}
        >
          <Leaf size={11} />
        </div>

        {/* Distant Birds Silhouette in Sunset Sky */}
        <div
          style={{
            position: 'absolute',
            top: '42px',
            right: '38%',
            opacity: 0.38
          }}
        >
          <svg width="90" height="45" viewBox="0 0 90 45" fill="none" stroke="#7c2d12" strokeWidth="1.8" strokeLinecap="round">
            <path d="M 10 22 Q 18 14 26 22 Q 34 14 42 22" />
            <path d="M 48 14 Q 54 8 60 14 Q 66 8 72 14" />
            <path d="M 28 34 Q 34 29 40 34 Q 46 29 52 34" />
          </svg>
        </div>
      </div>

      {/* ========================================================= */}
      {/* --- HERO CONTENT & INTERACTIVE CONTROLS --- */}
      {/* ========================================================= */}
      <div style={{ position: 'relative', zIndex: 2, maxWidth: '780px' }}>
        {/* Small Heading from User Specification */}
        <div
          className="fade-enter-1"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.8125rem',
            fontWeight: 850,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#9a3412',
            marginBottom: '0.75rem'
          }}
        >
          <span>CLEANER AIR</span>
          <span style={{ color: '#ea580c' }}>•</span>
          <span>HEALTHIER TOMORROW</span>
        </div>

        {/* Main Heading with Elegant Orange Gradient Highlight */}
        <h1
          className="fade-enter-2 hero-main-heading"
          style={{
            fontSize: '3.6rem',
            lineHeight: 1.08,
            fontWeight: 900,
            color: '#1c1917',
            marginBottom: '1rem',
            fontFamily: 'var(--font-heading)',
            letterSpacing: '-0.03em'
          }}
        >
          Delhi Air Quality <br />
          <span
            style={{
              background: 'linear-gradient(135deg, #c2410c 0%, #ea580c 45%, #f97316 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 14px rgba(234, 88, 12, 0.2)'
            }}
          >
            Forecasting System
          </span>
        </h1>

        {/* Description from User Specification */}
        <p
          className="fade-enter-3 hero-description"
          style={{
            fontSize: '1.08rem',
            color: '#44403c',
            lineHeight: 1.6,
            marginBottom: '1.85rem',
            maxWidth: '680px',
            fontWeight: 600
          }}
        >
          AI-powered air-quality forecasting that combines pollution and weather conditions to identify future risks and provide early warnings.
        </p>

        {/* Floating Search / Select Box with "Select Delhi Area" and "Explore Forecast →" */}
        <div
          id="hero-delhi-search-box"
          className="fade-enter-4 hero-search-pill"
          style={{
            background: 'rgba(255, 255, 255, 0.96)',
            borderRadius: 'var(--radius-full)',
            padding: '0.45rem 0.55rem 0.45rem 1.25rem',
            boxShadow: '0 12px 35px rgba(180, 83, 9, 0.16)',
            border: '1.5px solid rgba(254, 215, 170, 0.95)',
            marginBottom: '1.4rem',
            maxWidth: '580px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            backdropFilter: 'blur(12px)'
          }}
        >
          <div style={{ color: '#ea580c', display: 'flex', alignItems: 'center' }}>
            <MapPin size={19} />
          </div>

          {/* Area Selector Dropdown */}
          <div style={{ position: 'relative', flex: 1 }}>
            <select
              id="hero-select-station-dropdown"
              value={selectedStationId}
              onChange={(e) => onSelectStation && onSelectStation(e.target.value)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                padding: '0.55rem 1.8rem 0.55rem 0',
                fontSize: '0.9375rem',
                color: '#1c1917',
                fontWeight: 700,
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none'
              }}
            >
              <option value="" disabled>Select Delhi Area</option>
              {stations.map((st) => (
                <option key={st.station_id} value={st.station_id}>
                  {st.station_name} (AQI {st.current_aqi} • {st.category})
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              style={{
                position: 'absolute',
                right: '4px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: '#ea580c'
              }}
            />
          </div>

          {/* "Explore Forecast →" Button */}
          <button
            id="btn-hero-explore-forecast"
            onClick={handleExploreForecastClick}
            className="btn-primary"
            style={{
              padding: '0.65rem 1.4rem',
              fontSize: '0.875rem',
              fontWeight: 800,
              whiteSpace: 'nowrap',
              gap: '6px'
            }}
          >
            <span>Explore Forecast</span>
            <ArrowRight size={15} />
          </button>
        </div>

        {/* 10 Specified Delhi Area Chips */}
        <div
          className="fade-enter-5"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem', color: '#7c2d12', fontWeight: 800, marginRight: '0.2rem' }}>
            <Navigation size={13} color="#ea580c" />
            <span>Popular Areas:</span>
          </div>

          {delhiAreas.map((area) => {
            const isSelected = activeStation?.station_id === area.id;
            return (
              <button
                key={area.id}
                id={`chip-delhi-area-${area.id}`}
                onClick={() => onSelectStation && onSelectStation(area.id)}
                style={{
                  background: isSelected ? '#ea580c' : 'rgba(255, 255, 255, 0.9)',
                  color: isSelected ? '#ffffff' : '#44403c',
                  border: isSelected ? '1px solid #c2410c' : '1px solid rgba(254, 215, 170, 0.85)',
                  padding: '0.35rem 0.8rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.78125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 2px 6px rgba(180, 83, 9, 0.05)'
                }}
              >
                {area.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right-Top Script Callout: "Better Air • Healthier People • Greener Delhi" from Reference */}
      <div
        className="hero-right-callout"
        style={{
          position: 'absolute',
          top: '32px',
          right: '40px',
          textAlign: 'right',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '2px'
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontStyle: 'italic',
            fontSize: '1.35rem',
            fontWeight: 850,
            color: '#7c2d12',
            lineHeight: 1.25,
            textShadow: '0 2px 8px rgba(255, 255, 255, 0.9)'
          }}
        >
          <div>Better Air</div>
          <div>Healthier People</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-end', color: '#15803d' }}>
            <span>Greener Delhi</span>
            <Leaf size={18} color="#16a34a" />
          </div>
        </div>
      </div>
    </div>
  );
}

