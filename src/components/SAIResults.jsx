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

      {granularity === 'per_layer' && per_layer_sai.length > 0 && (
        <div className="result-card result-card--sai-layers">
          <h4 className="result-card-title">
            <span className="card-icon">📊</span> Per-layer SAI
          </h4>
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
            Bar centered at 0 — left (blue) = more sensitive to s@0, right (red) = more sensitive to s@1.
          </p>
        </div>
      )}
    </div>
  );
};

export default SAIResults;
