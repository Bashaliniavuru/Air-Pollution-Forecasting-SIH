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
    <div className="glass-card" style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <Sparkles size={20} color="#a855f7" />
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Coupled Weather-Pollution Forecasting Pipeline</h3>
      </div>

      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
        Simulate how changing meteorological dynamics (wind dispersion, planetary boundary layer height, temperature inversions) affect upcoming 24h air pollution severity in Delhi-NCR.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
            Target Delhi-NCR Station
          </label>
          <select
            id="select-target-station"
            value={stationId}
            onChange={(e) => setStationId(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.6rem 0.8rem',
              color: '#f8fafc',
              fontSize: '0.8125rem',
              outline: 'none'
            }}
          >
            <option value="DELHI_ANAND_VIHAR">Anand Vihar (East Delhi)</option>
            <option value="DELHI_ITO">ITO Junction (Central Delhi)</option>
            <option value="DELHI_RK_PURAM">R.K. Puram (South Delhi)</option>
            <option value="DELHI_PUNJABI_BAGH">Punjabi Bagh (West Delhi)</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
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
            style={{ width: '100%', accentColor: '#38bdf8' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
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
            style={{ width: '100%', accentColor: '#a855f7' }}
          />
        </div>
      </div>

      <button
        id="btn-execute-forecast-task"
        className="btn-primary"
        onClick={handleRunTask}
        disabled={loading}
        style={{ width: '100%', padding: '0.75rem' }}
      >
        {loading ? <Loader2 size={16} className="pulse-dot" /> : <Play size={16} />}
        <span>{loading ? 'Computing Coupled Forecast Model...' : 'Calculate 24-Hour Projected Air Pollution'}</span>
      </button>

      {lastResult && lastResult.result && (
        <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={16} color="#f43f5e" />
              Forecast Horizon: {lastResult.result.forecast_horizon}
            </div>
            <span className="badge badge-error">
              {lastResult.result.aqi_category} (Projected AQI {lastResult.result.forecast_aqi})
            </span>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.35)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.8125rem', color: '#38bdf8', marginBottom: '0.4rem', fontWeight: 600 }}>
              Meteorological Driver:
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              {lastResult.result.meteorological_driver}
            </div>

            <div style={{ fontSize: '0.8125rem', color: '#f59e0b', marginBottom: '0.4rem', fontWeight: 600 }}>
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
