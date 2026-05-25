import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { faultCampaignService } from '../services/api';
import {
  exportSAIReportPdf,
  exportSingleChartPdf,
  buildSAISummary,
} from '../utils/saiReportPdf';
import './SAIHeatmap.css';

const groupKey = (g) => `${g.layer}::${g.target_type}`;
const ALL_MODELS = '__all__';
const BIT_LABELS = Array.from({ length: 32 }, (_, i) => String(i));

// Metadatos por gráfica: título en pantalla y leyenda ASCII para el PDF.
const CHART_DEFS = {
  sai: {
    title: 'SAI — Stuck-at Asymmetry Index',
    caption: 'SAI - Stuck-at Asymmetry Index',
  },
  mai: {
    title: 'MAI — Misclassification Asymmetry Index',
    caption: 'MAI - Misclassification Asymmetry Index',
  },
  fProp: {
    title: 'F_prop — Propagation factor',
    caption: 'F_prop - Propagation factor',
  },
  fMisc: {
    title: 'F_misc — Misclassification factor',
    caption: 'F_misc - Misclassification factor',
  },
};

// Escalas de color: divergente para métricas con signo (SAI/MAI ∈ [-1,1]),
// secuencial frío→cálido para factores sin signo (F_prop/F_misc ∈ [0,1]).
const DIVERGING = ['#2166ac', '#67a9cf', '#cfcfcf', '#ef8a62', '#b2182b'];
const SEQUENTIAL = ['#0b3a5c', '#2166ac', '#74add1', '#fdae61', '#f46d43', '#b2182b'];

const isNum = (v) => v !== null && v !== undefined && !Number.isNaN(v);

// Criticality of a campaign = greatest magnitude among all its metrics.
// Used to order the Y-axis positions and for the threshold filter.
const critScore = (c) => {
  let m = 0;
  for (const v of [c.sai, c.mai_misc, c.f_prop_s0, c.f_prop_s1, c.f_misc_s0, c.f_misc_s1]) {
    if (isNum(v)) m = Math.max(m, Math.abs(v));
  }
  return m;
};

// Misclassification factor of a campaign = the greatest between s@0 and s@1.
// This is the metric used to sort the Top-N table.
const miscScore = (c) => {
  let m = -1;
  for (const v of [c.f_misc_s0, c.f_misc_s1]) {
    if (isNum(v)) m = Math.max(m, v);
  }
  return m; // -1 si la campaña no tiene F_misc definido
};

const fmt2 = (v) => (isNum(v) ? Number(v).toFixed(2) : '—');
const fmt4 = (v) => (isNum(v) ? Number(v).toFixed(4) : '—');

// Builds the option for a 2D heatmap: X = bit (0-31), Y = kernel position,
// color = metric value. Positions are already sorted by criticality (most
// critical first); `inverse` renders them at the top.
const buildHeatmapOption = ({
  campaigns,
  metricKey,
  metricLabel,
  signed,
  orderedPositions,
  posIndex,
  showValues,
  threshold,
}) => {
  const data = [];
  for (const c of campaigns) {
    const v = c[metricKey];
    if (!isNum(v)) continue;
    if (critScore(c) < threshold) continue;
    const yIdx = posIndex.get(c.position_label);
    if (yIdx === undefined) continue;
    data.push({ value: [c.bit_position, yIdx, v], campaign: c });
  }

  const visibleRows = Math.min(orderedPositions.length, 24);

  return {
    tooltip: {
      position: 'top',
      formatter: (params) => {
        const c = params.data?.campaign;
        if (!c) return '';
        const v = c[metricKey];
        const date = c.timestamp ? new Date(c.timestamp).toLocaleString() : '—';
        return `
          <div style="font-family: monospace; font-size: 12px; line-height: 1.5;">
            <strong>${metricLabel} = ${fmt4(v)}</strong><br/>
            Position: ${c.position_label}<br/>
            Bit: ${c.bit_position}<br/>
            Campaign: ${c.campaign_id}<br/>
            Model: ${c.model_name || '—'}<br/>
            Date: ${date}
          </div>`;
      },
    },
    grid: { left: 8, right: 26, top: 14, bottom: 64, containLabel: true },
    xAxis: {
      type: 'category',
      data: BIT_LABELS,
      name: 'Bit',
      nameLocation: 'middle',
      nameGap: 26,
      nameTextStyle: { color: '#3d3d3d' },
      splitArea: { show: true },
      axisLine: { lineStyle: { color: '#999' } },
      axisLabel: { color: '#57606a', fontSize: 9, interval: 0 },
    },
    yAxis: {
      type: 'category',
      data: orderedPositions,
      name: 'Kernel Position',
      nameTextStyle: { color: '#3d3d3d' },
      inverse: true,
      splitArea: { show: true },
      axisLine: { lineStyle: { color: '#999' } },
      axisLabel: { color: '#57606a', fontSize: 9 },
    },
    visualMap: {
      min: signed ? -1 : 0,
      max: 1,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 6,
      itemWidth: 12,
      itemHeight: 110,
      precision: 2,
      textStyle: { color: '#57606a' },
      inRange: { color: signed ? DIVERGING : SEQUENTIAL },
    },
    dataZoom: [
      { type: 'inside', yAxisIndex: 0, startValue: 0, endValue: visibleRows - 1 },
      {
        type: 'slider',
        yAxisIndex: 0,
        startValue: 0,
        endValue: visibleRows - 1,
        width: 12,
        right: 4,
        fillerColor: 'rgba(33,150,243,0.25)',
        borderColor: 'rgba(0,0,0,0.15)',
        textStyle: { color: '#57606a' },
      },
    ],
    series: [
      {
        type: 'heatmap',
        data,
        label: {
          show: showValues,
          color: '#fff',
          fontSize: 8,
          textShadowColor: '#000',
          textShadowBlur: 3,
          formatter: (p) => fmt2(p.value[2]),
        },
        itemStyle: { borderColor: '#ffffff', borderWidth: 1 },
        emphasis: {
          itemStyle: { borderColor: '#1f2328', borderWidth: 1.5 },
        },
      },
    ],
  };
};

const FAULT_VIEWS = [
  { id: 's1', label: 's@1' },
  { id: 's0', label: 's@0' },
];

const SAIHeatmap = ({ refreshKey }) => {
  const [groups, setGroups] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [selectedModel, setSelectedModel] = useState(ALL_MODELS);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  // Visualization controls.
  const [showValues, setShowValues] = useState(false);
  const [threshold, setThreshold] = useState(0);
  const [fpView, setFpView] = useState('s1'); // F_prop: s@1 / s@0
  const [fmView, setFmView] = useState('s1'); // F_misc: s@1 / s@0

  // Maximized chart on full screen (null | 'sai' | 'mai' | 'fProp' | 'fMisc').
  const [maximized, setMaximized] = useState(null);

  // Refs to each ECharts instance for capturing as PNG in PDF.
  const saiRef = useRef(null);
  const maiRef = useRef(null);
  const fPropRef = useRef(null);
  const fMiscRef = useRef(null);
  const maximizedRef = useRef(null);

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

  // Auto-refresh when tab becomes visible (e.g., after running a campaign
  // in the main tab and returning to this tab).
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

  const availableModels = useMemo(() => {
    const counts = new Map();
    for (const g of groups) {
      for (const c of g.campaigns) {
        const name = c.model_name || '—';
        counts.set(name, (counts.get(name) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [groups]);

  // If selected model disappears after refresh, revert to "All models".
  useEffect(() => {
    if (
      selectedModel !== ALL_MODELS &&
      !availableModels.some((m) => m.name === selectedModel)
    ) {
      setSelectedModel(ALL_MODELS);
    }
  }, [availableModels, selectedModel]);

  const filteredGroups = useMemo(() => {
    if (selectedModel === ALL_MODELS) return groups;
    return groups.map((g) => ({
      ...g,
      campaigns: g.campaigns.filter((c) => c.model_name === selectedModel),
    }));
  }, [groups, selectedModel]);

  const selectedGroup = useMemo(
    () => filteredGroups.find((g) => groupKey(g) === selectedKey) || null,
    [filteredGroups, selectedKey]
  );

  // Kernel positions sorted by criticality (most critical first).
  // Shared across 4 charts to keep Y-axis consistent.
  const { orderedPositions, posIndex } = useMemo(() => {
    if (!selectedGroup) return { orderedPositions: [], posIndex: new Map() };
    const best = new Map();
    for (const c of selectedGroup.campaigns) {
      const s = critScore(c);
      if (!best.has(c.position_label) || s > best.get(c.position_label)) {
        best.set(c.position_label, s);
      }
    }
    const ordered = Array.from(best.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label]) => label);
    const index = new Map(ordered.map((label, i) => [label, i]));
    return { orderedPositions: ordered, posIndex: index };
  }, [selectedGroup]);

  // Top-N campaigns with highest misclassification factor (table with exact
  // values). Campaigns without F_misc defined are excluded.
  const topCampaigns = useMemo(() => {
    if (!selectedGroup) return [];
    return [...selectedGroup.campaigns]
      .map((c) => ({ c, score: miscScore(c) }))
      .filter((e) => e.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [selectedGroup]);

  const charts = useMemo(() => {
    if (!selectedGroup) return null;
    const common = {
      campaigns: selectedGroup.campaigns,
      orderedPositions,
      posIndex,
      showValues,
      threshold,
    };
    return {
      sai: buildHeatmapOption({
        ...common,
        metricKey: 'sai',
        metricLabel: 'SAI',
        signed: true,
      }),
      mai: buildHeatmapOption({
        ...common,
        metricKey: 'mai_misc',
        metricLabel: 'MAI_misc',
        signed: true,
      }),
      fProp: buildHeatmapOption({
        ...common,
        metricKey: `f_prop_${fpView}`,
        metricLabel: `F_prop (${fpView === 's1' ? 's@1' : 's@0'})`,
        signed: false,
      }),
      fMisc: buildHeatmapOption({
        ...common,
        metricKey: `f_misc_${fmView}`,
        metricLabel: `F_misc (${fmView === 's1' ? 's@1' : 's@0'})`,
        signed: false,
      }),
    };
  }, [selectedGroup, orderedPositions, posIndex, showValues, threshold, fpView, fmView]);

  // Exports all 4 charts of the visible group to a landscape A4 PDF.
  const handleExportPdf = useCallback(() => {
    if (!selectedGroup) return;
    setIsExporting(true);
    setError(null);
    try {
      const grab = (ref) => {
        const inst = ref.current?.getEchartsInstance?.();
        return inst
          ? inst.getDataURL({
              type: 'png',
              pixelRatio: 2,
              backgroundColor: '#ffffff',
            })
          : null;
      };
      const campaigns = selectedGroup.campaigns;
      exportSAIReportPdf({
        images: {
          sai: grab(saiRef),
          mai: grab(maiRef),
          fProp: grab(fPropRef),
          fMisc: grab(fMiscRef),
        },
        summary: buildSAISummary(campaigns),
        meta: {
          layer: selectedGroup.layer,
          targetType: selectedGroup.target_type,
          model: selectedModel === ALL_MODELS ? 'All models' : selectedModel,
          campaignCount: campaigns.length,
          positionCount: new Set(campaigns.map((c) => c.position_label)).size,
          generatedAt: new Date(),
        },
      });
    } catch (e) {
      setError('Could not export PDF: ' + (e.message || e));
    } finally {
      setIsExporting(false);
    }
  }, [selectedGroup, selectedModel]);

  // Exports only the maximized chart to a full-page PDF.
  const handleExportSingle = useCallback(() => {
    if (!selectedGroup || !maximized) return;
    setIsExporting(true);
    setError(null);
    try {
      const inst = maximizedRef.current?.getEchartsInstance?.();
      const image = inst
        ? inst.getDataURL({
            type: 'png',
            pixelRatio: 2,
            backgroundColor: '#ffffff',
          })
        : null;
      const campaigns = selectedGroup.campaigns;
      exportSingleChartPdf({
        image,
        caption: CHART_DEFS[maximized].caption,
        meta: {
          layer: selectedGroup.layer,
          targetType: selectedGroup.target_type,
          model: selectedModel === ALL_MODELS ? 'All models' : selectedModel,
          campaignCount: campaigns.length,
          positionCount: new Set(campaigns.map((c) => c.position_label)).size,
          generatedAt: new Date(),
        },
      });
    } catch (e) {
      setError('Could not export PDF: ' + (e.message || e));
    } finally {
      setIsExporting(false);
    }
  }, [selectedGroup, maximized, selectedModel]);

  // Close maximized view with Escape key.
  useEffect(() => {
    if (!maximized) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setMaximized(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [maximized]);

  const renderFaultToggle = (current, setter) => (
    <span className="sai-fault-toggle">
      {FAULT_VIEWS.map((v) => (
        <button
          key={v.id}
          className={`sai-fault-toggle-btn ${
            current === v.id ? 'sai-fault-toggle-btn--active' : ''
          }`}
          onClick={() => setter(v.id)}
        >
          {v.label}
        </button>
      ))}
    </span>
  );

  return (
    <div className="sai-heatmap-container">
      <div className="sai-heatmap-header">
        <h4 className="sai-heatmap-title">
          <span>📊</span> Historic SAI Heatmaps
        </h4>
        <div className="sai-heatmap-controls">
          {availableModels.length > 0 && (
            <label className="sai-heatmap-model">
              <span className="sai-heatmap-model-label">Model:</span>
              <select
                className="sai-heatmap-model-select"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={isLoading}
              >
                <option value={ALL_MODELS}>
                  All models (
                  {availableModels.reduce((acc, m) => acc + m.count, 0)})
                </option>
                {availableModels.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} ({m.count})
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            className="sai-heatmap-refresh"
            onClick={fetchData}
            disabled={isLoading}
            title="Reload from database"
          >
            {isLoading ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
          <button
            className="sai-heatmap-export"
            onClick={handleExportPdf}
            disabled={isLoading || isExporting || !selectedGroup}
            title="Export PDF report of all 4 charts"
          >
            {isExporting ? '⏳ Exporting...' : '📄 Export PDF'}
          </button>
        </div>
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
            {filteredGroups.map((g) => {
              const key = groupKey(g);
              const isActive = key === selectedKey;
              const count = g.campaigns.length;
              return (
                <button
                  key={key}
                  className={`sai-combo-card ${
                    isActive ? 'sai-combo-card--active' : ''
                  } ${count === 0 ? 'sai-combo-card--empty' : ''}`}
                  onClick={() => setSelectedKey(key)}
                >
                  <span className="sai-combo-name">
                    {g.layer} / {g.target_type}
                  </span>
                  <span className="sai-combo-count">
                    {count} {count === 1 ? 'campaign' : 'campaigns'}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedGroup && charts && (
            <>
              {/* <div className="sai-heatmap-toolbar">
                <label className="sai-toolbar-item">
                  <input
                    type="checkbox"
                    checked={showValues}
                    onChange={(e) => setShowValues(e.target.checked)}
                  />
                  <span>Mostrar valores en celda</span>
                </label>
                <label className="sai-toolbar-item sai-toolbar-item--slider">
                  <span>
                    Umbral de criticidad:{' '}
                    <strong>{threshold.toFixed(2)}</strong>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                  />
                </label>
                <span className="sai-toolbar-hint">
                  El color marca el hotspot · pasa el cursor para el valor
                  exacto · usa la barra lateral para desplazarte por las
                  posiciones
                </span>
              </div> */}

              {topCampaigns.length > 0 && (
                <div className="sai-topn">
                  <h5 className="sai-topn-title">
                    🔥 Top {topCampaigns.length} campaigns with highest
                    misclassification factor
                  </h5>
                  <div className="sai-topn-wrapper">
                    <table className="sai-topn-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Position</th>
                          <th>Bit</th>
                          <th>SAI</th>
                          <th>MAI</th>
                          <th>F_prop s@0</th>
                          <th>F_prop s@1</th>
                          <th>F_misc s@0</th>
                          <th>F_misc s@1</th>
                          <th>F_misc max</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topCampaigns.map(({ c, score }, i) => (
                          <tr key={`${c.campaign_id}-${c.bit_position}`}>
                            <td>{i + 1}</td>
                            <td className="sai-topn-pos">{c.position_label}</td>
                            <td>{c.bit_position}</td>
                            <td>{fmt4(c.sai)}</td>
                            <td>{fmt4(c.mai_misc)}</td>
                            <td>{fmt4(c.f_prop_s0)}</td>
                            <td>{fmt4(c.f_prop_s1)}</td>
                            <td>{fmt4(c.f_misc_s0)}</td>
                            <td>{fmt4(c.f_misc_s1)}</td>
                            <td className="sai-topn-score">{score.toFixed(4)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="sai-heatmap-charts">
                <div className="sai-heatmap-card">
                  <h5 className="sai-heatmap-card-title">
                    SAI — Stuck-at Asymmetry Index
                  </h5>
                  <button
                    className="sai-heatmap-maximize"
                    onClick={() => setMaximized('sai')}
                    title="Maximize chart"
                  >
                    ⛶
                  </button>
                  <ReactECharts
                    ref={saiRef}
                    echarts={echarts}
                    option={charts.sai}
                    style={{ height: 440 }}
                    notMerge={true}
                  />
                </div>
                <div className="sai-heatmap-card">
                  <h5 className="sai-heatmap-card-title">
                    MAI — Misclassification Asymmetry Index
                  </h5>
                  <button
                    className="sai-heatmap-maximize"
                    onClick={() => setMaximized('mai')}
                    title="Maximize chart"
                  >
                    ⛶
                  </button>
                  <ReactECharts
                    ref={maiRef}
                    echarts={echarts}
                    option={charts.mai}
                    style={{ height: 440 }}
                    notMerge={true}
                  />
                </div>
                <div className="sai-heatmap-card">
                  <h5 className="sai-heatmap-card-title">
                    F_prop — Propagation factor
                    {renderFaultToggle(fpView, setFpView)}
                  </h5>
                  <button
                    className="sai-heatmap-maximize"
                    onClick={() => setMaximized('fProp')}
                    title="Maximize chart"
                  >
                    ⛶
                  </button>
                  <ReactECharts
                    ref={fPropRef}
                    echarts={echarts}
                    option={charts.fProp}
                    style={{ height: 440 }}
                    notMerge={true}
                  />
                </div>
                <div className="sai-heatmap-card">
                  <h5 className="sai-heatmap-card-title">
                    F_misc — Misclassification factor
                    {renderFaultToggle(fmView, setFmView)}
                  </h5>
                  <button
                    className="sai-heatmap-maximize"
                    onClick={() => setMaximized('fMisc')}
                    title="Maximize chart"
                  >
                    ⛶
                  </button>
                  <ReactECharts
                    ref={fMiscRef}
                    echarts={echarts}
                    option={charts.fMisc}
                    style={{ height: 440 }}
                    notMerge={true}
                  />
                </div>
              </div>

              <p className="sai-heatmap-legend">
                X-axis = bit position (0–31) · Y-axis = kernel position, ordered with the most critical at the top. SAI/MAI use a divergent scale (blue = dominant s@0, red = dominant s@1); F_prop/F_misc use a 0→1 scale (red = high factor). Each cell is an individual campaign.
              </p>
            </>
          )}
        </>
      )}

      {maximized && charts && (
        <div
          className="sai-modal-overlay"
          onClick={() => setMaximized(null)}
        >
          <div
            className="sai-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sai-modal-header">
              <h4 className="sai-modal-title">
                {CHART_DEFS[maximized].title}
                {maximized === 'fProp' && renderFaultToggle(fpView, setFpView)}
                {maximized === 'fMisc' && renderFaultToggle(fmView, setFmView)}
              </h4>
              <div className="sai-modal-actions">
                <button
                  className="sai-heatmap-export"
                  onClick={handleExportSingle}
                  disabled={isExporting}
                  title="Export this chart to PDF"
                >
                  {isExporting ? '⏳ Exporting...' : '📄 Export PDF'}
                </button>
                <button
                  className="sai-modal-close"
                  onClick={() => setMaximized(null)}
                  title="Close (Esc)"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="sai-modal-body">
              <ReactECharts
                ref={maximizedRef}
                echarts={echarts}
                option={charts[maximized]}
                style={{ height: '100%', width: '100%' }}
                notMerge={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SAIHeatmap;
