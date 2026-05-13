import { useState, useEffect, useMemo, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import 'echarts-gl';
import { faultCampaignService } from '../services/api';
import './SAIHeatmap3D.css';

const groupKey = (g) => `${g.layer}::${g.target_type}`;

const baseAxes = (zLabel, zMin, zMax, positionLabels) => ({
  xAxis3D: {
    type: 'value',
    name: 'Bit position',
    min: 0,
    max: 31,
    nameTextStyle: { color: '#ddd' },
    axisLine: { lineStyle: { color: '#666' } },
    axisLabel: { color: '#bbb' },
  },
  yAxis3D: {
    type: 'category',
    name: 'Kernel position',
    data: positionLabels,
    nameTextStyle: { color: '#ddd' },
    axisLine: { lineStyle: { color: '#666' } },
    axisLabel: { color: '#bbb' },
  },
  zAxis3D: {
    type: 'value',
    name: zLabel,
    min: zMin,
    max: zMax,
    nameTextStyle: { color: '#ddd' },
    axisLine: { lineStyle: { color: '#666' } },
    axisLabel: { color: '#bbb' },
  },
  grid3D: {
    boxWidth: 110,
    boxDepth: 80,
    viewControl: { autoRotate: false, distance: 200 },
    light: {
      main: { intensity: 1.2, shadow: false },
      ambient: { intensity: 0.4 },
    },
  },
});

// Color helpers (single-value charts use a diverging scale; signed charts
// use one solid hue per fault type for clarity)
const colorForSigned = (v) => {
  // v ∈ [-1, 1]. Diverging blue→red.
  if (v === null || v === undefined || Number.isNaN(v)) return '#888';
  const t = Math.max(-1, Math.min(1, v));
  if (t >= 0) {
    // 0 → pale, 1 → deep red
    const r = 215 + (255 - 215) * (1 - t);
    const g = 25 + (200 - 25) * (1 - t);
    const b = 28 + (200 - 28) * (1 - t);
    return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
  } else {
    // 0 → pale, -1 → deep blue
    const k = -t;
    const r = 44 + (200 - 44) * (1 - k);
    const g = 123 + (220 - 123) * (1 - k);
    const b = 182 + (255 - 182) * (1 - k);
    return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
  }
};

const buildScatter3DOption = ({ campaigns, metricKey, metricLabel }) => {
  const valid = campaigns.filter(
    (c) => c[metricKey] !== null && c[metricKey] !== undefined
  );
  const positionLabels = Array.from(
    new Set(valid.map((c) => c.position_label))
  );
  const data = valid.map((c) => ({
    value: [
      c.bit_position,
      positionLabels.indexOf(c.position_label),
      c[metricKey],
    ],
    itemStyle: { color: colorForSigned(c[metricKey]) },
    campaign: c,
  }));

  return {
    tooltip: {
      formatter: (params) => {
        const c = params.data?.campaign;
        if (!c) return '';
        const v = c[metricKey];
        const valStr = v !== null && v !== undefined ? v.toFixed(4) : 'N/A';
        const date = c.timestamp ? new Date(c.timestamp).toLocaleString() : '—';
        return `
          <div style="font-family: monospace; font-size: 12px;">
            <strong>${metricLabel}: ${valStr}</strong><br/>
            Campaign: ${c.campaign_id}<br/>
            Model: ${c.model_name || '—'}<br/>
            Position: ${c.position_label}<br/>
            Bit: ${c.bit_position}<br/>
            Date: ${date}
          </div>`;
      },
    },
    ...baseAxes(metricLabel, -1, 1, positionLabels),
    series: [
      {
        type: 'scatter3D',
        data,
        symbolSize: 22,
        itemStyle: { opacity: 0.95 },
        emphasis: { itemStyle: { color: '#fff', opacity: 1 } },
      },
    ],
  };
};

// Signed scatter: s@1 above zero (red), s@0 below zero (blue).
// Implemented as TWO series for clarity; legend shows both fault types.
const buildSignedScatter3DOption = ({
  campaigns,
  s0Key,
  s1Key,
  metricLabel,
}) => {
  const validForLabels = campaigns.filter(
    (c) =>
      (c[s0Key] !== null && c[s0Key] !== undefined) ||
      (c[s1Key] !== null && c[s1Key] !== undefined)
  );
  const positionLabels = Array.from(
    new Set(validForLabels.map((c) => c.position_label))
  );

  const buildPoint = (c, z, ft, raw) => ({
    value: [c.bit_position, positionLabels.indexOf(c.position_label), z],
    itemStyle: { color: ft === 'stuck_at_1' ? '#d7191c' : '#2c7bb6' },
    campaign: c,
    faultType: ft,
    rawValue: raw,
  });

  const s1Data = [];
  const s0Data = [];
  for (const c of validForLabels) {
    if (c[s1Key] !== null && c[s1Key] !== undefined) {
      s1Data.push(buildPoint(c, c[s1Key], 'stuck_at_1', c[s1Key]));
    }
    if (c[s0Key] !== null && c[s0Key] !== undefined) {
      s0Data.push(buildPoint(c, -c[s0Key], 'stuck_at_0', c[s0Key]));
    }
  }

  const tooltipFormatter = (params) => {
    const c = params.data?.campaign;
    if (!c) return '';
    const ft = params.data.faultType;
    const raw = params.data.rawValue;
    const rawStr =
      raw !== null && raw !== undefined ? raw.toFixed(4) : 'N/A';
    const date = c.timestamp ? new Date(c.timestamp).toLocaleString() : '—';
    return `
      <div style="font-family: monospace; font-size: 12px;">
        <strong>${metricLabel} (${ft}): ${rawStr}</strong><br/>
        Campaign: ${c.campaign_id}<br/>
        Model: ${c.model_name || '—'}<br/>
        Position: ${c.position_label}<br/>
        Bit: ${c.bit_position}<br/>
        Date: ${date}
      </div>`;
  };

  return {
    tooltip: { formatter: tooltipFormatter },
    legend: {
      data: ['stuck_at_1 (↑ +)', 'stuck_at_0 (↓ −)'],
      textStyle: { color: '#ccc' },
      top: 10,
    },
    ...baseAxes(`${metricLabel}  (s@1 ↑ / s@0 ↓)`, -1, 1, positionLabels),
    series: [
      {
        name: 'stuck_at_1 (↑ +)',
        type: 'scatter3D',
        data: s1Data,
        symbolSize: 22,
        itemStyle: { color: '#d7191c', opacity: 0.95 },
        emphasis: { itemStyle: { color: '#fff' } },
      },
      {
        name: 'stuck_at_0 (↓ −)',
        type: 'scatter3D',
        data: s0Data,
        symbolSize: 22,
        itemStyle: { color: '#2c7bb6', opacity: 0.95 },
        emphasis: { itemStyle: { color: '#fff' } },
      },
    ],
  };
};

const SAIHeatmap3D = ({ refreshKey }) => {
  const [groups, setGroups] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await faultCampaignService.getSAIHeatmap();
      const gs = response.groups || [];
      setGroups(gs);
      if (gs.length > 0) {
        setSelectedKey((prev) =>
          prev && gs.some((g) => groupKey(g) === prev) ? prev : groupKey(gs[0])
        );
      } else {
        setSelectedKey(null);
      }
    } catch (e) {
      setError(e.message || 'Error loading heatmap data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  // Auto-refresca cuando la pestaña vuelve a estar visible (por ejemplo,
  // tras correr una campaña en la pestaña principal y volver a esta)
  // ! PILAS REVISAR QUE ESTO NO CAUSE PROBLEMAS DE RENDIMIENTO O PETICIONES DEMASIADO FRECUENTES
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', fetchData);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', fetchData);
    };
  }, [fetchData]);

  const selectedGroup = useMemo(
    () => groups.find((g) => groupKey(g) === selectedKey) || null,
    [groups, selectedKey]
  );

  const charts = useMemo(() => {
    if (!selectedGroup) return null;
    const c = selectedGroup.campaigns;
    return {
      sai: buildScatter3DOption({
        campaigns: c,
        metricKey: 'sai',
        metricLabel: 'SAI',
      }),
      mai: buildScatter3DOption({
        campaigns: c,
        metricKey: 'mai_misc',
        metricLabel: 'MAI_misc',
      }),
      fProp: buildSignedScatter3DOption({
        campaigns: c,
        s0Key: 'f_prop_s0',
        s1Key: 'f_prop_s1',
        metricLabel: 'F_prop',
      }),
      fMisc: buildSignedScatter3DOption({
        campaigns: c,
        s0Key: 'f_misc_s0',
        s1Key: 'f_misc_s1',
        metricLabel: 'F_misc',
      }),
    };
  }, [selectedGroup]);

  return (
    <div className="sai-heatmap-container">
      <div className="sai-heatmap-header">
        <h4 className="sai-heatmap-title">
          <span>📊</span> Historic SAI Heatmaps
        </h4>
        <button
          className="sai-heatmap-refresh"
          onClick={fetchData}
          disabled={isLoading}
          title="Reload from database"
        >
          {isLoading ? '⏳ Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {error && <div className="sai-heatmap-error">⚠️ {error}</div>}

      {!error && !isLoading && groups.length === 0 && (
        <div className="sai-heatmap-empty">
          No SAI campaigns saved yet. Run a SAI campaign with exactly{' '}
          <strong>1 layer × 1 position × 1 bit</strong> to populate the heatmap.
        </div>
      )}

      {groups.length > 0 && (
        <>
          <div className="sai-heatmap-combos">
            {groups.map((g) => {
              const key = groupKey(g);
              const isActive = key === selectedKey;
              return (
                <button
                  key={key}
                  className={`sai-combo-card ${
                    isActive ? 'sai-combo-card--active' : ''
                  }`}
                  onClick={() => setSelectedKey(key)}
                >
                  <span className="sai-combo-name">
                    {g.layer} / {g.target_type}
                  </span>
                  <span className="sai-combo-count">
                    {g.campaigns.length}{' '}
                    {g.campaigns.length === 1 ? 'campaign' : 'campaigns'}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedGroup && charts && (
            <div className="sai-heatmap-charts">
              <div className="sai-heatmap-card">
                <h5 className="sai-heatmap-card-title">
                  SAI — Stuck-at Asymmetry Index
                </h5>
                <ReactECharts
                  echarts={echarts}
                  option={charts.sai}
                  style={{ height: 460 }}
                  notMerge={true}
                />
              </div>
              <div className="sai-heatmap-card">
                <h5 className="sai-heatmap-card-title">
                  MAI — Misclassification Asymmetry Index
                </h5>
                <ReactECharts
                  echarts={echarts}
                  option={charts.mai}
                  style={{ height: 460 }}
                  notMerge={true}
                />
              </div>
              <div className="sai-heatmap-card">
                <h5 className="sai-heatmap-card-title">
                  F_prop — Propagation factor (s@1 ↑ / s@0 ↓)
                </h5>
                <ReactECharts
                  echarts={echarts}
                  option={charts.fProp}
                  style={{ height: 460 }}
                  notMerge={true}
                />
              </div>
              <div className="sai-heatmap-card">
                <h5 className="sai-heatmap-card-title">
                  F_misc — Misclassification factor (s@1 ↑ / s@0 ↓)
                </h5>
                <ReactECharts
                  echarts={echarts}
                  option={charts.fMisc}
                  style={{ height: 460 }}
                  notMerge={true}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SAIHeatmap3D;
