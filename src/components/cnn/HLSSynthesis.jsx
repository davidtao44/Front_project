import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config/api';
import styles from './HLSSynthesis.module.css';

const TOTAL_BITS_OPTIONS = [8, 16, 32];
const BACKEND_OPTIONS = ['Vivado', 'Vitis', 'VivadoAccelerator'];
const REUSE_OPTIONS = [1, 2, 4, 8, 16];
const IO_TYPE_OPTIONS = ['io_parallel', 'io_stream'];
const STRATEGY_OPTIONS = ['Latency', 'Resource'];

const BOARD_PRESETS = [
  { label: 'Pynq-Z2',      family: 'Zynq-7000',        part: 'xc7z020clg400-1'      },
  { label: 'Arty A7-100T', family: 'Artix-7',          part: 'xc7a100tcsg324-1'     },
  { label: 'ZCU102',       family: 'Zynq UltraScale+', part: 'xczu9eg-ffvb1156-2-e' },
  { label: 'Ultra96-V2',   family: 'Zynq UltraScale+', part: 'xczu3eg-sbva484-1-e'  },
  { label: 'KV260',        family: 'Zynq UltraScale+', part: 'xck26-sfvc784-2LV-c'  },
  { label: 'Custom',       family: null,                part: ''                     },
];

const DEFAULT_BOARD = BOARD_PRESETS[0]; // Pynq-Z2

// Boards pequeñas (Zynq-7020, Artix-7) no pueden con io_parallel + reuse=1.
// Forzamos defaults conservadores para que Vitis HLS no explote al sintetizar.
const SMALL_BOARD_FAMILIES = ['Zynq-7000', 'Artix-7'];
const isSmallBoard = (board) => SMALL_BOARD_FAMILIES.includes(board?.family);

const apFixedLabel = (total, int) => `ap_fixed<${total},${int}>`;

const HLSSynthesis = ({ selectedModel }) => {
  const { authenticatedFetch } = useAuth();

  // ── Step 1: Quantize ──────────────────────────────────────────────────
  const [totalBits, setTotalBits] = useState(16);
  const [intBits, setIntBits] = useState(6);
  const [quantizing, setQuantizing] = useState(false);
  const [quantizeResult, setQuantizeResult] = useState(null);
  const [quantizeError, setQuantizeError] = useState(null);
  const [useQuantized, setUseQuantized] = useState(true);

  // ── Step 2: Convert ───────────────────────────────────────────────────
  const [backend, setBackend] = useState('Vitis');
  const [reuseFactorIdx, setReuseFactorIdx] = useState(2); // REUSE_OPTIONS[2] = 4
  const [clockPeriod, setClockPeriod] = useState(10);
  const [ioType, setIoType] = useState('io_stream');
  const [strategy, setStrategy] = useState('Resource');
  const [selectedBoard, setSelectedBoard] = useState(DEFAULT_BOARD);
  const [customPart, setCustomPart] = useState('');
  const [converting, setConverting] = useState(false);
  const [convertResult, setConvertResult] = useState(null);
  const [convertError, setConvertError] = useState(null);

  // Cuando el usuario cambia de placa, reaplicamos defaults sensatos.
  useEffect(() => {
    if (isSmallBoard(selectedBoard)) {
      setBackend('Vitis');
      setIoType('io_stream');
      setStrategy('Resource');
      setReuseFactorIdx(2); // 4
      setClockPeriod(10);
    } else if (selectedBoard.label !== 'Custom') {
      setBackend('Vitis');
      setIoType('io_parallel');
      setStrategy('Latency');
      setReuseFactorIdx(0); // 1
      setClockPeriod(5);
    }
  }, [selectedBoard]);

  // Si el usuario cambia el modelo seleccionado, descartamos los resultados
  // de pasos previos para evitar enviar el modelo equivocado al backend.
  useEffect(() => {
    setQuantizeResult(null);
    setQuantizeError(null);
    setConvertResult(null);
    setConvertError(null);
  }, [selectedModel?.filename]);

  const activePart = selectedBoard.label === 'Custom' ? customPart : selectedBoard.part;
  const partIsValid = activePart.trim().length > 0;

  const maxIntBits = totalBits - 1;
  const safeIntBits = Math.min(intBits, maxIntBits);
  const precision = apFixedLabel(totalBits, safeIntBits);

  // El nombre que se envía al backend (filename, no la ruta completa).
  const activeModelName =
    useQuantized && quantizeResult
      ? quantizeResult.quantized_model
      : selectedModel?.filename;

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleQuantize = async () => {
    if (!selectedModel) return;
    setQuantizing(true);
    setQuantizeError(null);
    setQuantizeResult(null);
    setConvertResult(null);

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/hls/quantize/`, {
        method: 'POST',
        body: JSON.stringify({
          model_name: selectedModel.filename,
          total_bits: totalBits,
          int_bits: safeIntBits,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || `Error ${response.status}`);
      setQuantizeResult(data);
    } catch (err) {
      setQuantizeError(err.message);
    } finally {
      setQuantizing(false);
    }
  };

  const handleConvert = async () => {
    if (!activeModelName) return;
    setConverting(true);
    setConvertError(null);
    setConvertResult(null);

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/hls/convert/`, {
        method: 'POST',
        body: JSON.stringify({
          model_name: activeModelName,
          backend,
          precision,
          reuse_factor: REUSE_OPTIONS[reuseFactorIdx],
          clock_period: clockPeriod,
          io_type: ioType,
          strategy,
          part: activePart,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || `Error ${response.status}`);
      setConvertResult(data);
    } catch (err) {
      setConvertError(err.message);
    } finally {
      setConverting(false);
    }
  };

  const handleDownload = async () => {
    if (!convertResult?.session_id) return;
    const token = localStorage.getItem('access_token');
    const url = `${API_BASE_URL}/hls/download/${convertResult.session_id}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return;
    const blob = await response.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `hls_project_${convertResult.session_id}.zip`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const step2Disabled = !selectedModel;

  return (
    <div className={styles.container}>

      {/* Active model indicator */}
      <div className={styles.modelRow}>
        {selectedModel ? (
          <>
            <div className={styles.modelInfoBlock}>
              <span className={styles.modelLabel}>Selected model:</span>
              <span className={styles.modelName}>{selectedModel.filename}</span>
            </div>
            <div className={styles.modelInfoBlock}>
              <span className={styles.modelLabel}>Will be sent as:</span>
              <span className={styles.modelName}>{activeModelName}</span>
              {useQuantized && quantizeResult
                ? <span className={styles.modelBadgeQuant}>quantized</span>
                : <span className={styles.modelBadgeOrig}>original</span>
              }
            </div>
          </>
        ) : (
          <span className={styles.noModel}>
            No model selected — go to "Select Architecture" first
          </span>
        )}
      </div>

      <div className={styles.stepsGrid}>

        {/* ── Step 1: PTQ Quantization ───────────────────────────────── */}
        <div className={`${styles.stepCard} ${!selectedModel ? styles.disabled : ''}`}>
          <div className={styles.stepHeader}>
            <span className={styles.stepBadge}>1</span>
            <h4 className={styles.stepTitle}>Fixed-Point Quantization</h4>
            <span className={styles.stepOptional}>recommended</span>
          </div>

          <div className={styles.stepBody}>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-main)', margin: 0 }}>
              Rounds weights to <strong>ap_fixed</strong> format before synthesis. Shows clipping
              percentage so you can tune precision without running Vivado first.
            </p>

            {/* Total bits */}
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Total bits</span>
              <div className={styles.bitButtons}>
                {TOTAL_BITS_OPTIONS.map(b => (
                  <button
                    key={b}
                    className={`${styles.bitBtn} ${totalBits === b ? styles.activeBit : ''}`}
                    onClick={() => {
                      setTotalBits(b);
                      if (intBits >= b) setIntBits(b - 1);
                    }}
                  >
                    {b}-bit
                  </button>
                ))}
              </div>
            </div>

            {/* Integer bits */}
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Integer bits</span>
              <div className={styles.sliderRow}>
                <input
                  type="range"
                  className={styles.slider}
                  min={1}
                  max={maxIntBits}
                  value={safeIntBits}
                  onChange={e => setIntBits(Number(e.target.value))}
                />
                <span className={styles.sliderValue}>{safeIntBits}</span>
              </div>
              <span className={styles.fieldHint}>
                Range: [{-(2 ** (safeIntBits - 1))}, {(2 ** (safeIntBits - 1)) - 1}] &nbsp;|&nbsp;
                Resolution: 2<sup>-{totalBits - safeIntBits}</sup>
              </span>
            </div>

            {/* Format preview */}
            <div className={styles.field}>
              <span className={styles.fieldLabel}>HLS format</span>
              <span className={styles.formatBadge}>{precision}</span>
            </div>

            <button
              className={styles.primaryBtn}
              onClick={handleQuantize}
              disabled={quantizing || !selectedModel}
            >
              {quantizing
                ? <><span className={styles.spinner} /> Quantizing…</>
                : 'Quantize Model'
              }
            </button>

            {/* Quantize result */}
            {quantizeResult && (
              <div className={`${styles.resultBox} ${styles.success}`}>
                <p className={styles.resultTitle}>✓ Quantization complete</p>
                <ul className={styles.statsList}>
                  <li className={styles.statItem}>
                    <span className={styles.statKey}>Format:</span>
                    <span className={styles.formatBadge}>{quantizeResult.format}</span>
                  </li>
                  <li className={styles.statItem}>
                    <span className={styles.statKey}>Total params:</span>
                    {quantizeResult.total_params.toLocaleString()}
                  </li>
                  <li className={styles.statItem}>
                    <span className={styles.statKey}>Clipped:</span>
                    {quantizeResult.total_clipped.toLocaleString()}
                    ({quantizeResult.clip_percentage}%)
                    {quantizeResult.clip_percentage > 5 && (
                      <span className={styles.warnClip}> — high clipping, consider increasing int_bits</span>
                    )}
                  </li>
                </ul>

                {/* Per-layer breakdown */}
                {quantizeResult.layer_stats?.length > 0 && (
                  <table className={styles.layerTable}>
                    <thead>
                      <tr>
                        <th>Layer</th>
                        <th>Type</th>
                        <th>Params</th>
                        <th>Clip %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quantizeResult.layer_stats.map(l => (
                        <tr key={l.layer}>
                          <td>{l.layer}</td>
                          <td>{l.type}</td>
                          <td>{l.params.toLocaleString()}</td>
                          <td className={l.clip_pct > 5 ? styles.clipHigh : ''}>
                            {l.clip_pct}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <label className={styles.checkRow} style={{ marginTop: '0.75rem' }}>
                  <input
                    type="checkbox"
                    checked={useQuantized}
                    onChange={e => setUseQuantized(e.target.checked)}
                  />
                  Use quantized model for HLS conversion
                </label>
              </div>
            )}

            {quantizeError && (
              <div className={`${styles.resultBox} ${styles.error}`}>
                <p className={styles.resultTitle}>✕ Error</p>
                <p style={{ fontSize: '0.82rem', margin: 0 }}>{quantizeError}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Step 2: HLS Conversion ─────────────────────────────────── */}
        <div className={`${styles.stepCard} ${step2Disabled ? styles.disabled : ''}`}>
          <div className={styles.stepHeader}>
            <span className={styles.stepBadge}>2</span>
            <h4 className={styles.stepTitle}>Generate HLS Project</h4>
          </div>

          <div className={styles.stepBody}>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-main)', margin: 0 }}>
              Converts the model to synthesizable C++ via <strong>hls4ml</strong>. Download the
              project and synthesize locally with Vivado HLS / Vitis HLS.
            </p>

            {/* Backend */}
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Backend</span>
              <select
                className={styles.select}
                value={backend}
                onChange={e => setBackend(e.target.value)}
              >
                {BACKEND_OPTIONS.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Target FPGA board */}
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Target FPGA board</span>
              <div className={styles.boardGrid}>
                {BOARD_PRESETS.map(board => (
                  <button
                    key={board.label}
                    className={`${styles.boardBtn} ${selectedBoard.label === board.label ? styles.boardBtnActive : ''}`}
                    onClick={() => setSelectedBoard(board)}
                    title={board.part || 'Enter custom part number'}
                  >
                    <span className={styles.boardName}>{board.label}</span>
                    {board.family && (
                      <span className={styles.boardFamily}>{board.family}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Part number display / input */}
              {selectedBoard.label === 'Custom' ? (
                <input
                  className={styles.input}
                  placeholder="e.g. xc7z020clg400-1"
                  value={customPart}
                  onChange={e => setCustomPart(e.target.value)}
                  style={{ marginTop: '0.5rem', fontFamily: 'monospace' }}
                />
              ) : (
                <div className={styles.partDisplay}>
                  <span className={styles.partIcon}>📦</span>
                  <span className={styles.formatBadge} style={{ fontSize: '0.78rem' }}>
                    {selectedBoard.part}
                  </span>
                </div>
              )}
              {selectedBoard.label === 'Custom' && !partIsValid && (
                <span className={styles.fieldHint} style={{ color: '#d97706' }}>
                  Enter a valid Xilinx part number
                </span>
              )}
            </div>

            {/* Precision — auto-syncs from step 1 */}
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Precision</span>
              <span className={styles.formatBadge}>{precision}</span>
              <span className={styles.fieldHint}>
                {quantizeResult
                  ? 'Synced from quantization step'
                  : 'Set in Step 1 (or uses default ap_fixed<16,6>)'}
              </span>
            </div>

            {/* IO Type */}
            <div className={styles.field}>
              <span className={styles.fieldLabel}>IO Type</span>
              <div className={styles.bitButtons}>
                {IO_TYPE_OPTIONS.map(t => (
                  <button
                    key={t}
                    className={`${styles.bitBtn} ${ioType === t ? styles.activeBit : ''}`}
                    onClick={() => setIoType(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <span className={styles.fieldHint}>
                io_stream serializes layers (less area, recommended for small FPGAs);
                io_parallel unrolls the entire network
              </span>
            </div>

            {/* Strategy */}
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Strategy</span>
              <div className={styles.bitButtons}>
                {STRATEGY_OPTIONS.map(s => (
                  <button
                    key={s}
                    className={`${styles.bitBtn} ${strategy === s ? styles.activeBit : ''}`}
                    onClick={() => setStrategy(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <span className={styles.fieldHint}>
                Resource reuses multipliers based on reuse_factor;
                Latency unrolls for maximum speed
              </span>
            </div>

            {/* Reuse factor */}
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Reuse factor</span>
              <div className={styles.bitButtons}>
                {REUSE_OPTIONS.map((r, i) => (
                  <button
                    key={r}
                    className={`${styles.bitBtn} ${reuseFactorIdx === i ? styles.activeBit : ''}`}
                    onClick={() => setReuseFactorIdx(i)}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <span className={styles.fieldHint}>
                1 = max parallelism · higher = fewer resources
              </span>
            </div>

            {/* Clock period */}
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Clock period (ns)</span>
              <div className={styles.sliderRow}>
                <input
                  type="range"
                  className={styles.slider}
                  min={2}
                  max={20}
                  step={1}
                  value={clockPeriod}
                  onChange={e => setClockPeriod(Number(e.target.value))}
                />
                <span className={styles.sliderValue}>{clockPeriod} ns</span>
              </div>
              <span className={styles.fieldHint}>{(1000 / clockPeriod).toFixed(0)} MHz target</span>
            </div>

            <button
              className={styles.primaryBtn}
              onClick={handleConvert}
              disabled={converting || !selectedModel || !partIsValid}
              title={!partIsValid ? 'Enter a valid FPGA part number first' : ''}
            >
              {converting
                ? <><span className={styles.spinner} /> Generating HLS…</>
                : 'Generate HLS Project'
              }
            </button>

            {/* Convert result */}
            {convertResult && (
              <div className={`${styles.resultBox} ${styles.success}`}>
                <p className={styles.resultTitle}>✓ HLS project ready</p>
                <ul className={styles.statsList}>
                  <li className={styles.statItem}>
                    <span className={styles.statKey}>Backend:</span>{convertResult.backend}
                  </li>
                  <li className={styles.statItem}>
                    <span className={styles.statKey}>Precision:</span>
                    <span className={styles.formatBadge}>{convertResult.precision}</span>
                  </li>
                  <li className={styles.statItem}>
                    <span className={styles.statKey}>Reuse factor:</span>{convertResult.reuse_factor}
                  </li>
                  <li className={styles.statItem}>
                    <span className={styles.statKey}>Clock:</span>{convertResult.clock_period_ns} ns
                  </li>
                  <li className={styles.statItem}>
                    <span className={styles.statKey}>Part:</span>
                    <span className={styles.sessionChip}>{convertResult.part}</span>
                  </li>
                  <li className={styles.statItem}>
                    <span className={styles.statKey}>Session:</span>
                    <span className={styles.sessionChip}>{convertResult.session_id}</span>
                  </li>
                </ul>
                <button
                  className={styles.downloadBtn}
                  style={{ marginTop: '0.75rem' }}
                  onClick={handleDownload}
                >
                  Download HLS Project (.zip)
                </button>
              </div>
            )}

            {convertError && (
              <div className={`${styles.resultBox} ${styles.error}`}>
                <p className={styles.resultTitle}>✕ Error</p>
                <p style={{ fontSize: '0.82rem', margin: 0 }}>{convertError}</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default HLSSynthesis;
