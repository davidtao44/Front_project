import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import './SAIResults.css';

const fmt = (v, digits = 4) => {
  if (v === null || v === undefined || Number.isNaN(v) || !Number.isFinite(v)) return '—';
  return Number(v).toFixed(digits);
};

const fmtCount = (n, d) => {
  const nVal = n ?? 0;
  const dVal = d ?? 0;
  if (nVal === 0 && dVal === 0) return '—';
  return `${nVal} / ${dVal}`;
};

const saiColor = (sai) => {
  if (sai === null || sai === undefined) return '#888';
  if (Math.abs(sai) < 0.1) return '#2e7d32'; // green: symmetric
  if (sai > 0) return '#c62828'; // red: s@1 dominant
  return '#1565c0'; // blue: s@0 dominant
};

const SAIBipolarGauge = ({ sai, label = 'SAI' }) => {
  const value = sai === null || sai === undefined ? 0 : Math.max(-1, Math.min(1, sai));
  const pct = ((value + 1) / 2) * 100;
  const color = saiColor(sai);
  return (
    <div className="sai-gauge">
      <div className="sai-gauge-track">
        <div className="sai-gauge-tick sai-gauge-tick--zero" />
        <div
          className="sai-gauge-marker"
          style={{ left: `${pct}%`, background: color }}
        />
      </div>
      <div className="sai-gauge-labels">
        <span>−1 · s@0</span>
        <span>0</span>
        <span>+1 · s@1</span>
      </div>
      <div className="sai-gauge-value" style={{ color }}>
        {label} = {sai === null || sai === undefined ? 'N/A' : sai.toFixed(4)}
      </div>
    </div>
  );
};

const SAIResults = ({ saiResults }) => {
  if (!saiResults || !saiResults.sai_global) return null;
  const { sai_global, per_layer_sai = [], comparison_s0, comparison_s1, campaign_info } = saiResults;
  const granularity = campaign_info?.granularity || 'global';

  return (
    <div className="sai-results">
      <div className="result-card result-card--sai">
        <h4 className="result-card-title">
          SAI<sub>prop</sub> — Propagation asymmetry (Global)
        </h4>

        <SAIBipolarGauge sai={sai_global.sai} label="SAI_prop" />

        <p className="sai-interpretation">{sai_global.interpretation}</p>

        <div className="sai-grid">
          <div className="sai-cell">
            <span className="sai-cell-label">F<sub>prop</sub> s@0</span>
            <span className="sai-cell-value" style={{ color: '#1565c0' }}>{fmt(sai_global.f_prop_s0)}</span>
            <span className="sai-cell-sub">{fmtCount(sai_global.n_prop_s0, sai_global.n_inj_s0)}</span>
          </div>
          <div className="sai-cell">
            <span className="sai-cell-label">F<sub>prop</sub> s@1</span>
            <span className="sai-cell-value" style={{ color: '#c62828' }}>{fmt(sai_global.f_prop_s1)}</span>
            <span className="sai-cell-sub">{fmtCount(sai_global.n_prop_s1, sai_global.n_inj_s1)}</span>
          </div>
        </div>
      </div>

      <div className="result-card result-card--sai">
        <h4 className="result-card-title">
          MAI<sub>misc</sub> — Misclassification asymmetry (Global)
        </h4>

        <SAIBipolarGauge sai={sai_global.mai_misc} label="MAI_misc" />

        <p className="sai-interpretation">
          {sai_global.interpretation_misc || 'misclassification rate, conditional on propagation'}
        </p>

        <div className="sai-grid">
          <div className="sai-cell">
            <span className="sai-cell-label">F<sub>misc</sub> s@0</span>
            <span className="sai-cell-value" style={{ color: '#1565c0' }}>{fmt(sai_global.f_misc_s0)}</span>
            <span className="sai-cell-sub">{fmtCount(sai_global.n_misc_s0, sai_global.n_prop_s0)}</span>
          </div>
          <div className="sai-cell">
            <span className="sai-cell-label">F<sub>misc</sub> s@1</span>
            <span className="sai-cell-value" style={{ color: '#c62828' }}>{fmt(sai_global.f_misc_s1)}</span>
            <span className="sai-cell-sub">{fmtCount(sai_global.n_misc_s1, sai_global.n_prop_s1)}</span>
          </div>
        </div>

        <p className="sai-legend">
          F<sub>misc</sub> = n<sub>misc</sub> / n<sub>prop</sub> — fracción de fallos que <em>propagaron</em> y además convirtieron una predicción correcta en incorrecta. Indefinido si no hubo propagación.
        </p>

        {(comparison_s0 || comparison_s1) && (
          <div className="sai-misclass">
            <div className="sai-misclass-row">
              <span>Misclassification factor s@0 (raw)</span>
              <span>{fmt(comparison_s0?.misclassification_factor)}</span>
            </div>
            <div className="sai-misclass-row">
              <span>Misclassification factor s@1 (raw)</span>
              <span>{fmt(comparison_s1?.misclassification_factor)}</span>
            </div>
          </div>
        )}
      </div>

      {granularity === 'per_layer' && per_layer_sai.length > 0 && (() => {
        const layerNames = per_layer_sai.map((e) => e.layer);

        const fPropOption = {
          tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params) =>
              `<strong>${params[0].axisValue}</strong><br/>` +
              params.map((p) => `${p.marker} ${p.seriesName}: ${Number(p.value).toFixed(4)}`).join('<br/>'),
          },
          legend: { data: ['F_prop s@0', 'F_prop s@1'], textStyle: { color: '#57606a', fontSize: 11 } },
          grid: { left: 8, right: 16, top: 36, bottom: 8, containLabel: true },
          xAxis: {
            type: 'category',
            data: layerNames,
            axisLabel: { rotate: 18, color: '#57606a', fontSize: 10 },
            axisLine: { lineStyle: { color: '#ccc' } },
          },
          yAxis: {
            type: 'value',
            min: 0,
            max: 1,
            name: 'F_prop',
            nameTextStyle: { color: '#57606a', fontSize: 10 },
            axisLabel: { formatter: (v) => v.toFixed(2), color: '#57606a', fontSize: 10 },
            splitLine: { lineStyle: { color: '#eee' } },
          },
          series: [
            {
              name: 'F_prop s@0',
              type: 'bar',
              barGap: '8%',
              data: per_layer_sai.map((e) => e.summary.f_prop_s0 ?? 0),
              itemStyle: { color: '#1565c0', borderRadius: [3, 3, 0, 0] },
              label: { show: per_layer_sai.length <= 6, position: 'top', color: '#1565c0', fontSize: 9, formatter: (p) => Number(p.value).toFixed(2) },
            },
            {
              name: 'F_prop s@1',
              type: 'bar',
              data: per_layer_sai.map((e) => e.summary.f_prop_s1 ?? 0),
              itemStyle: { color: '#c62828', borderRadius: [3, 3, 0, 0] },
              label: { show: per_layer_sai.length <= 6, position: 'top', color: '#c62828', fontSize: 9, formatter: (p) => Number(p.value).toFixed(2) },
            },
          ],
        };

        const saiBarOption = {
          tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params) =>
              `<strong>${params[0].axisValue}</strong><br/>` +
              params.map((p) => `${p.marker} ${p.seriesName}: ${p.value !== null ? Number(p.value).toFixed(4) : 'N/A'}`).join('<br/>'),
          },
          legend: { data: ['SAI_prop', 'MAI_misc'], textStyle: { color: '#57606a', fontSize: 11 } },
          grid: { left: 8, right: 16, top: 36, bottom: 8, containLabel: true },
          xAxis: {
            type: 'category',
            data: layerNames,
            axisLabel: { rotate: 18, color: '#57606a', fontSize: 10 },
            axisLine: { lineStyle: { color: '#ccc' } },
          },
          yAxis: {
            type: 'value',
            min: -1,
            max: 1,
            name: 'SAI',
            nameTextStyle: { color: '#57606a', fontSize: 10 },
            axisLabel: { formatter: (v) => v.toFixed(1), color: '#57606a', fontSize: 10 },
            splitLine: { lineStyle: { color: '#eee' } },
          },
          series: [
            {
              name: 'SAI_prop',
              type: 'bar',
              barGap: '8%',
              markLine: {
                silent: true,
                symbol: 'none',
                data: [{ yAxis: 0, lineStyle: { color: '#888', width: 1.5, type: 'solid' } }],
                label: { show: false },
              },
              data: per_layer_sai.map((e) => {
                const v = e.summary.sai;
                const color = v === null ? '#888' : v > 0.1 ? '#c62828' : v < -0.1 ? '#1565c0' : '#2e7d32';
                return { value: v ?? null, itemStyle: { color, borderRadius: (v === null || v >= 0) ? [3, 3, 0, 0] : [0, 0, 3, 3] } };
              }),
              label: { show: per_layer_sai.length <= 6, position: 'inside', color: '#fff', fontSize: 9, formatter: (p) => p.value !== null ? Number(p.value).toFixed(2) : 'N/A', textShadowColor: '#000', textShadowBlur: 2 },
            },
            {
              name: 'MAI_misc',
              type: 'bar',
              data: per_layer_sai.map((e) => {
                const v = e.summary.mai_misc;
                const color = v === null ? '#aaa' : v > 0.1 ? '#ef9a9a' : v < -0.1 ? '#90caf9' : '#a5d6a7';
                return { value: v ?? null, itemStyle: { color, borderRadius: v !== null && v >= 0 ? [3, 3, 0, 0] : [0, 0, 3, 3] } };
              }),
              label: { show: per_layer_sai.length <= 6, position: 'inside', color: '#333', fontSize: 9, formatter: (p) => p.value !== null ? Number(p.value).toFixed(2) : 'N/A' },
            },
          ],
        };

        return (
          <div className="result-card result-card--sai-layers">
            <h4 className="result-card-title">
              <span className="card-icon">📊</span> Per-layer SAI
            </h4>

            <div className="sai-layer-charts">
              <div className="sai-layer-chart-card">
                <p className="sai-layer-chart-label">
                  F<sub>prop</sub> por capa — fracción de inyecciones que propagaron a la salida
                </p>
                <ReactECharts
                  echarts={echarts}
                  option={fPropOption}
                  style={{ height: 240 }}
                  notMerge={true}
                />
              </div>
              <div className="sai-layer-chart-card">
                <p className="sai-layer-chart-label">
                  SAI<sub>prop</sub> y MAI<sub>misc</sub> por capa
                  &nbsp;<span className="sai-layer-chart-hint">(azul = s@0 dominante · rojo = s@1 dominante · verde = simétrico)</span>
                </p>
                <ReactECharts
                  echarts={echarts}
                  option={saiBarOption}
                  style={{ height: 240 }}
                  notMerge={true}
                />
              </div>
            </div>

          <div className="sai-table-wrapper">
            <table className="sai-table">
              <thead>
                <tr>
                  <th>Layer</th>
                  <th>F<sub>prop</sub> s@0</th>
                  <th>F<sub>prop</sub> s@1</th>
                  <th>SAI<sub>prop</sub></th>
                  <th>F<sub>misc</sub> s@0</th>
                  <th>F<sub>misc</sub> s@1</th>
                  <th>SAI<sub>misc</sub></th>
                  <th>SAI<sub>prop</sub> distribution</th>
                </tr>
              </thead>
              <tbody>
                {per_layer_sai.map(({ layer, summary }) => {
                  const sai = summary.sai;
                  const MaiMisc = summary.mai_misc;
                  const color = saiColor(sai);
                  const colorMisc = saiColor(MaiMisc);
                  const pct = sai === null || sai === undefined ? 50 : ((Math.max(-1, Math.min(1, sai)) + 1) / 2) * 100;
                  return (
                    <tr key={layer}>
                      <td className="sai-layer-name">{layer}</td>
                      <td>{fmt(summary.f_prop_s0)}</td>
                      <td>{fmt(summary.f_prop_s1)}</td>
                      <td style={{ color, fontWeight: 600 }}>
                        {sai === null || sai === undefined ? 'N/A' : sai.toFixed(4)}
                      </td>
                      <td>{fmt(summary.f_misc_s0)}</td>
                      <td>{fmt(summary.f_misc_s1)}</td>
                      <td style={{ color: colorMisc, fontWeight: 600 }}>
                        {MaiMisc === null || MaiMisc === undefined ? 'N/A' : MaiMisc.toFixed(4)}
                      </td>
                      <td>
                        <div className="sai-row-bar">
                          <div className="sai-row-bar-zero" />
                          <div
                            className="sai-row-bar-marker"
                            style={{ left: `${pct}%`, background: color }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="sai-legend">
            Bar centered at 0 — blue = more sensitive to s@0, red = more sensitive to s@1, green = symmetric.
          </p>
        </div>
        );
      })()}
    </div>
  );
};

export default SAIResults;
