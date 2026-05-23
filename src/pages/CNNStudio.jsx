import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { trainingService } from '../services/api';
import Header from '../components/Header';
import './CNNStudio.css';

const CNNStudio = () => {
  const navigate = useNavigate();

  // Catálogos cargados del backend
  const [datasets, setDatasets] = useState([]);
  const [layerTypes, setLayerTypes] = useState([]);
  const [templates, setTemplates] = useState([]);

  // Selección actual
  const [selectedDataset, setSelectedDataset] = useState('');
  const [modelName, setModelName] = useState('mi_cnn');
  const [layers, setLayers] = useState([]);
  const [newLayerType, setNewLayerType] = useState('Conv2D');

  // Hiperparámetros
  const [epochs, setEpochs] = useState(5);
  const [batchSize, setBatchSize] = useState(64);
  const [optimizer, setOptimizer] = useState('adam');
  const [learningRate, setLearningRate] = useState(0.001);
  const [validationSplit, setValidationSplit] = useState(0.1);

  // Estado del entrenamiento
  const [jobId, setJobId] = useState(null);
  const [trainStatus, setTrainStatus] = useState(null);
  const [trainResult, setTrainResult] = useState(null);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  const datasetMeta = datasets.find((d) => d.name === selectedDataset);

  // ── Carga inicial de catálogos ──────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [ds, lt, tpl] = await Promise.all([
          trainingService.getDatasets(),
          trainingService.getLayerTypes(),
          trainingService.getTemplates(),
        ]);
        setDatasets(ds.datasets || []);
        setLayerTypes(lt.layer_types || []);
        setTemplates(tpl.templates || []);
      } catch (e) {
        setError(`No se pudieron cargar los catálogos: ${e.message}`);
      }
    })();
  }, []);

  // ── Polling del estado de entrenamiento ─────────────────────────────────────
  useEffect(() => {
    if (!jobId) return undefined;
    pollRef.current = setInterval(async () => {
      try {
        const status = await trainingService.getTrainingStatus(jobId);
        setTrainStatus(status);
        if (status.status === 'done') {
          clearInterval(pollRef.current);
          const result = await trainingService.getTrainingResult(jobId);
          setTrainResult(result);
        } else if (status.status === 'error') {
          clearInterval(pollRef.current);
          setError(status.error || 'Error durante el entrenamiento');
        }
      } catch (e) {
        clearInterval(pollRef.current);
        setError(e.message);
      }
    }, 2000);
    return () => clearInterval(pollRef.current);
  }, [jobId]);

  const layerRegistry = (type) => layerTypes.find((l) => l.type === type);

  const defaultParams = (type) => {
    const reg = layerRegistry(type);
    if (!reg) return {};
    return Object.fromEntries(
      Object.entries(reg.params).map(([name, def]) => [name, def.default])
    );
  };

  // ── Plantillas y edición de capas ───────────────────────────────────────────
  const loadTemplate = async (templateName) => {
    if (!templateName || !selectedDataset) return;
    try {
      const spec = await trainingService.getTemplate(templateName, selectedDataset);
      setLayers(spec.layers);
      setModelName(spec.name);
      setError(null);
    } catch (e) {
      setError(`No se pudo cargar la plantilla: ${e.message}`);
    }
  };

  const addLayer = () => {
    setLayers([...layers, { type: newLayerType, params: defaultParams(newLayerType) }]);
  };

  const removeLayer = (index) => {
    setLayers(layers.filter((_, i) => i !== index));
  };

  const moveLayer = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= layers.length) return;
    const updated = [...layers];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    setLayers(updated);
  };

  const updateParam = (index, param, value) => {
    const updated = [...layers];
    updated[index] = {
      ...updated[index],
      params: { ...updated[index].params, [param]: value },
    };
    setLayers(updated);
  };

  // ── Entrenamiento ───────────────────────────────────────────────────────────
  const startTraining = async () => {
    if (!datasetMeta || layers.length === 0) {
      setError('Selecciona un dataset y define al menos una capa');
      return;
    }
    setError(null);
    setTrainResult(null);
    setTrainStatus(null);
    try {
      const request = {
        model_spec: {
          name: modelName,
          input_shape: datasetMeta.input_shape,
          layers,
        },
        dataset: selectedDataset,
        epochs: Number(epochs),
        batch_size: Number(batchSize),
        optimizer,
        learning_rate: Number(learningRate),
        validation_split: Number(validationSplit),
      };
      const { job_id } = await trainingService.startTraining(request);
      setJobId(job_id);
    } catch (e) {
      setError(e.message);
    }
  };

  const isTraining =
    trainStatus && trainStatus.status !== 'done' && trainStatus.status !== 'error';

  return (
    <div className="cnn-studio">
      <Header />
      <div className="studio-content">
        <div className="studio-header">
          <h1>CNN Studio — Construcción y Entrenamiento</h1>
          <p>
            Diseña una arquitectura CNN, entrénala con un dataset de Keras y úsala
            luego en el inyector de fallos.
          </p>
        </div>

        {error && <div className="studio-error">{error}</div>}

        {/* 1. Dataset */}
        <section className="studio-card">
          <h2>1 · Dataset</h2>
          <select
            value={selectedDataset}
            onChange={(e) => {
              setSelectedDataset(e.target.value);
              setLayers([]);
            }}
          >
            <option value="">Selecciona un dataset...</option>
            {datasets.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name} — {d.input_shape.join('×')} · {d.num_classes} clases
              </option>
            ))}
          </select>
          {datasetMeta && (
            <p className="studio-hint">
              {datasetMeta.description}. Primera descarga ≈{' '}
              {datasetMeta.approx_download_mb} MB (luego queda cacheado).
            </p>
          )}
        </section>

        {/* 2. Arquitectura */}
        <section className="studio-card">
          <h2>2 · Arquitectura</h2>
          {!selectedDataset && (
            <p className="studio-hint">Selecciona primero un dataset.</p>
          )}
          {selectedDataset && (
            <>
              <div className="template-row">
                <label>Partir de una plantilla:</label>
                <select
                  defaultValue=""
                  onChange={(e) => loadTemplate(e.target.value)}
                >
                  <option value="">— ninguna —</option>
                  {templates.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name} ({t.description})
                    </option>
                  ))}
                </select>
              </div>

              <div className="model-name-row">
                <label>Nombre del modelo:</label>
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                />
              </div>

              <div className="layers-editor">
                {layers.length === 0 && (
                  <p className="studio-hint">
                    Sin capas. Carga una plantilla o añade capas manualmente.
                  </p>
                )}
                {layers.map((layer, index) => {
                  const reg = layerRegistry(layer.type);
                  return (
                    <div key={index} className="layer-row">
                      <div className="layer-row-head">
                        <span className="layer-index">{index + 1}</span>
                        <span className="layer-type">{layer.type}</span>
                        <div className="layer-actions">
                          <button onClick={() => moveLayer(index, -1)} title="Subir">
                            ↑
                          </button>
                          <button onClick={() => moveLayer(index, 1)} title="Bajar">
                            ↓
                          </button>
                          <button
                            onClick={() => removeLayer(index)}
                            title="Eliminar"
                            className="layer-remove"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      {reg && Object.keys(reg.params).length > 0 && (
                        <div className="layer-params">
                          {Object.entries(reg.params).map(([pname, pdef]) => {
                            const value =
                              layer.params[pname] !== undefined
                                ? layer.params[pname]
                                : pdef.default;
                            if (pdef.type === 'enum') {
                              return (
                                <label key={pname}>
                                  {pname}
                                  <select
                                    value={value}
                                    onChange={(e) =>
                                      updateParam(index, pname, e.target.value)
                                    }
                                  >
                                    {pdef.options.map((opt) => (
                                      <option key={opt} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              );
                            }
                            return (
                              <label key={pname}>
                                {pname}
                                <input
                                  type="number"
                                  step={pdef.type === 'float' ? '0.01' : '1'}
                                  value={value}
                                  onChange={(e) =>
                                    updateParam(
                                      index,
                                      pname,
                                      pdef.type === 'float'
                                        ? parseFloat(e.target.value)
                                        : parseInt(e.target.value, 10)
                                    )
                                  }
                                />
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="add-layer-row">
                <select
                  value={newLayerType}
                  onChange={(e) => setNewLayerType(e.target.value)}
                >
                  {layerTypes.map((lt) => (
                    <option key={lt.type} value={lt.type}>
                      {lt.type}
                    </option>
                  ))}
                </select>
                <button onClick={addLayer}>+ Añadir capa</button>
              </div>
            </>
          )}
        </section>

        {/* 3. Entrenamiento */}
        <section className="studio-card">
          <h2>3 · Entrenamiento</h2>
          <div className="hparams-grid">
            <label>
              Épocas
              <input
                type="number"
                min="1"
                value={epochs}
                onChange={(e) => setEpochs(e.target.value)}
              />
            </label>
            <label>
              Batch size
              <input
                type="number"
                min="1"
                value={batchSize}
                onChange={(e) => setBatchSize(e.target.value)}
              />
            </label>
            <label>
              Optimizador
              <select
                value={optimizer}
                onChange={(e) => setOptimizer(e.target.value)}
              >
                <option value="adam">adam</option>
                <option value="sgd">sgd</option>
                <option value="rmsprop">rmsprop</option>
              </select>
            </label>
            <label>
              Learning rate
              <input
                type="number"
                step="0.0001"
                value={learningRate}
                onChange={(e) => setLearningRate(e.target.value)}
              />
            </label>
            <label>
              Validation split
              <input
                type="number"
                step="0.05"
                min="0"
                max="0.9"
                value={validationSplit}
                onChange={(e) => setValidationSplit(e.target.value)}
              />
            </label>
          </div>

          <button
            className="train-button"
            onClick={startTraining}
            disabled={isTraining || !selectedDataset || layers.length === 0}
          >
            {isTraining ? 'Entrenando...' : 'Iniciar entrenamiento'}
          </button>

          {trainStatus && (
            <div className="train-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${trainStatus.progress}%` }}
                />
              </div>
              <p>
                {trainStatus.phase} ({trainStatus.progress}%)
              </p>
              {trainStatus.history && trainStatus.history.length > 0 && (
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Época</th>
                      <th>loss</th>
                      <th>accuracy</th>
                      <th>val_loss</th>
                      <th>val_accuracy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainStatus.history.map((h) => (
                      <tr key={h.epoch}>
                        <td>{h.epoch}</td>
                        <td>{h.loss.toFixed(4)}</td>
                        <td>{h.accuracy.toFixed(4)}</td>
                        <td>{h.val_loss.toFixed(4)}</td>
                        <td>{h.val_accuracy.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {trainResult && (
            <div className="train-result">
              <h3>✅ Entrenamiento completado</h3>
              <p>
                Accuracy en test: <strong>{trainResult.test_accuracy.toFixed(4)}</strong>{' '}
                · Parámetros: {trainResult.parameters.toLocaleString()}
              </p>
              <p className="studio-hint">
                Modelo guardado: <code>{trainResult.model_path}</code>. Ya está
                disponible en el inyector de fallos.
              </p>
              <button onClick={() => navigate('/fault-injector')}>
                Ir al inyector de fallos
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default CNNStudio;
