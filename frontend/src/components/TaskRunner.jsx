import React, { useState } from 'react';
import { Play, Sparkles, AlertTriangle, Wind, Thermometer, ShieldAlert, Loader2 } from 'lucide-react';
import { executeTask } from '../services/api';

export default function TaskRunner() {
  const [stationId, setStationId] = useState('DELHI_ANAND_VIHAR');
  const [taskType, setTaskType] = useState('FORECAST_24H_AQI');
  const [windSpeed, setWindSpeed] = useState(4.8);
  const [pblHeight, setPblHeight] = useState(380);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const handleRunTask = async () => {
    setLoading(true);
    try {
      const payload = {
        station_id: stationId,
        task_type: taskType,
        wind_speed_kmh: Number(windSpeed),
        pbl_height_m: Number(pblHeight),
        temp_c: 18.2,
        humidity_pct: 82.0
      };
      const result = await executeTask(taskType, payload, stationId);
      setLastResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="white-card" style={{ marginBottom: '2rem', background: '#ffffff', border: '1.5px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={18} />
        </div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>Coupled Weather-Pollution Forecasting Pipeline</h3>
      </div>

      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
        Simulate how changing meteorological dynamics (wind dispersion, planetary boundary layer height, temperature inversions) affect upcoming 24h air pollution severity in Delhi-NCR.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 700 }}>
            Target Delhi-NCR Station
          </label>
          <select
            id="select-target-station"
            value={stationId}
            onChange={(e) => setStationId(e.target.value)}
            style={{
              width: '100%',
              background: '#fdfbf7',
              border: '1.5px solid #eeddc8',
              borderRadius: 'var(--radius-md)',
              padding: '0.6rem 0.8rem',
              color: 'var(--text-primary)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              outline: 'none'
            }}
          >
            <option value="DELHI_ANAND_VIHAR">Anand Vihar (East Delhi)</option>
            <option value="DELHI_NEW_DELHI">New Delhi (Central Delhi)</option>
            <option value="DELHI_ROHINI">Rohini (North-West Delhi)</option>
            <option value="DELHI_DWARKA">Dwarka (South-West Delhi)</option>
            <option value="DELHI_PUNJABI_BAGH">Punjabi Bagh (West Delhi)</option>
            <option value="NOIDA_SEC_62">Sector 62 (Noida)</option>
            <option value="GURUGRAM_VIKAS_SADAN">Vikas Sadan (Gurugram)</option>
            <option value="GHAZIABAD_VASUNDHARA">Vasundhara (Ghaziabad)</option>
            <option value="FARIDABAD_SEC_16A">Sector 16A (Faridabad)</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 700 }}>
            Wind Speed ({windSpeed} km/h)
          </label>
          <input
            id="input-wind-speed"
            type="range"
            min="1"
            max="25"
            step="0.5"
            value={windSpeed}
            onChange={(e) => setWindSpeed(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 700 }}>
            PBL Mixing Height ({pblHeight} m)
          </label>
          <input
            id="input-pbl-height"
            type="range"
            min="150"
            max="1500"
            step="25"
            value={pblHeight}
            onChange={(e) => setPblHeight(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      <button
        id="btn-execute-forecast-task"
        className="btn-primary"
        onClick={handleRunTask}
        disabled={loading}
        style={{ width: '100%', padding: '0.75rem', fontSize: '0.875rem' }}
      >
        {loading ? <Loader2 size={16} className="pulse-dot" /> : <Play size={16} />}
        <span>{loading ? 'Computing Coupled Forecast Model...' : 'Calculate 24-Hour Projected Air Pollution'}</span>
      </button>

      {lastResult && lastResult.result && (
        <div style={{ marginTop: '1.25rem', borderTop: '1px solid #f5eee4', paddingTop: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={16} color="#ea580c" />
              Forecast Horizon: {lastResult.result.forecast_horizon}
            </div>
            <span className="badge badge-active">
              {lastResult.result.aqi_category} (Projected AQI {lastResult.result.forecast_aqi})
            </span>
          </div>

          <div style={{ background: '#fdfbf7', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1.5px solid #fed7aa', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.8125rem', color: '#c2410c', marginBottom: '0.4rem', fontWeight: 700 }}>
              Meteorological Driver:
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              {lastResult.result.meteorological_driver}
            </div>

            <div style={{ fontSize: '0.8125rem', color: '#d97706', marginBottom: '0.4rem', fontWeight: 700 }}>
              Actionable Advisory / Intervention:
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              {lastResult.result.advisory}
            </div>
          </div>

          <div className="code-box">
            {JSON.stringify(lastResult, null, 2)}
          </div>
        </div>
      )}
    </div>
  );
}
