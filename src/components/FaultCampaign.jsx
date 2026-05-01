import { useState, useEffect } from 'react';
import { faultCampaignService } from '../services/api';
import WeightFaultConfig from './WeightFaultConfig';
import FaultMetricsComparison from './FaultMetricsComparison';
import SAIResults from './SAIResults';
import './FaultCampaign.css';

const FaultCampaign = () => {
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [campaignType, setCampaignType] = useState('activation'); // 'activation' | 'weight' | 'sai'
  const [saiGranularity, setSaiGranularity] = useState('global'); // 'global' | 'per_layer'
  const [numSamples, setNumSamples] = useState(100);
  const [imageDir, setImageDir] = useState('/home/davidgonzalez/Documentos/project/Back_project/images/mnist');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  
  // Configuración de fallos en activaciones
  const [activationFaultConfig, setActivationFaultConfig] = useState({
    enabled: true,
    layers: {
      'conv2d': {
        enabled: true,
        num_faults: 10,
        fault_type: 'bit_flip',
        positions: 'random',
        bit_positions: [0, 1, 2, 3]
      }
    }
  });
  
  // Configuración de fallos en pesos
  const [weightFaultConfig, setWeightFaultConfig] = useState({ enabled: false, layers: {} });

  useEffect(() => {
    loadAvailableModels();
  }, []);

  const loadAvailableModels = async () => {
    try {
      setIsLoading(true);
      const response = await faultCampaignService.getAvailableModels();
      setAvailableModels(response.models || []);
    } catch (error) {
      setError('Error loading available models');
      console.error('Error loading models:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWeightFaultConfigChange = (config) => {
    setWeightFaultConfig(config);
  };

  const runCampaign = async () => {
    console.log('🎯 Función runCampaign ejecutada');
    
    if (!selectedModel) {
      setError('Please select a model');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setResults(null);

      let response;
      
      if (campaignType === 'activation') {
        response = await faultCampaignService.runActivationFaultCampaign({
          model_path: selectedModel.path,
          num_samples: numSamples,
          fault_config: activationFaultConfig,
          image_dir: imageDir
        });
      } else if (campaignType === 'sai') {
        // SAI reuses the weight fault configuration shape; service forces stuck_at_0/1
        const baseConfig = {
          enabled: weightFaultConfig.enabled,
          layers: weightFaultConfig.layers
        };
        response = await faultCampaignService.runSAI({
          model_path: selectedModel.path,
          num_samples: numSamples,
          base_config: baseConfig,
          granularity: saiGranularity,
          image_dir: imageDir
        });
      } else {
        // Preparar configuración de fallos en pesos para la API
        const weightConfigForAPI = {
          enabled: weightFaultConfig.enabled,
          layers: weightFaultConfig.layers
        };

        response = await faultCampaignService.runWeightFaultCampaign({
          model_path: selectedModel.path,
          num_samples: numSamples,
          weight_fault_config: weightConfigForAPI,
          image_dir: imageDir
        });
      }

      setResults(response.results);
      console.log('Campaign completed successfully');
      console.log('Results structure:', JSON.stringify(response.results, null, 2));
      console.log('Setting results state with:', response.results);
      
      // DEBUG ESPECÍFICO PARA GOLDEN_RESULTS
      console.log('🔍 DEBUG GOLDEN_RESULTS:');
      console.log('golden_results exists?', !!response.results.golden_results);
      console.log('golden_results:', response.results.golden_results);
      console.log('golden_results.metrics exists?', !!response.results.golden_results?.metrics);
      console.log('golden_results.metrics:', response.results.golden_results?.metrics);
      if (response.results.golden_results?.metrics) {
        console.log('accuracy value:', response.results.golden_results.metrics.accuracy);
        console.log('accuracy type:', typeof response.results.golden_results.metrics.accuracy);
      }
      
    } catch (error) {
      setError(`Error ejecutando campaña: ${error.message}`);
      console.error('Campaign error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPercent = (val) =>
    val !== undefined && val !== null ? (val * 100).toFixed(2) + '%' : 'N/A';

  const renderConfusionMatrix = (matrix) => {
    if (!matrix || !matrix.length) return null;
    const size = matrix.length;
    return (
      <div className="confusion-matrix-wrapper">
        <table className="confusion-matrix">
          <thead>
            <tr>
              <th className="cm-corner">A\P</th>
              {matrix[0].map((_, ci) => <th key={ci} className="cm-header">{ci}</th>)}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, ri) => (
              <tr key={ri}>
                <td className="cm-row-header">{ri}</td>
                {row.map((cell, ci) => (
                  <td key={ci} className={`cm-cell${ri === ci ? ' cm-diagonal' : cell > 0 ? ' cm-error' : ''}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="cm-legend">Rows: Actual classes | Columns: Predicted classes</p>
      </div>
    );
  };

  const formatMetrics = (metrics) => {
    if (!metrics) return <p className="no-data">No data available</p>;
    return (
      <div className="metrics-container">
        <div className="metrics-group">
          <h5 className="metrics-group-title">Performance Metrics</h5>
          <div className="metric-row">
            <span className="metric-label">Accuracy</span>
            <span className="metric-value metric-good">{formatPercent(metrics.accuracy)}</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Precision</span>
            <span className="metric-value metric-good">{formatPercent(metrics.precision)}</span>
          </div>
        </div>
        {(metrics.macro_avg_precision !== undefined || metrics.macro_avg_recall !== undefined) && (
          <div className="metrics-group">
            <h5 className="metrics-group-title">Macro Average</h5>
            {metrics.macro_avg_precision !== undefined && (
              <div className="metric-row">
                <span className="metric-label">Avg Precision</span>
                <span className="metric-value">{formatPercent(metrics.macro_avg_precision)}</span>
              </div>
            )}
            {metrics.macro_avg_recall !== undefined && (
              <div className="metric-row">
                <span className="metric-label">Avg Recall</span>
                <span className="metric-value">{formatPercent(metrics.macro_avg_recall)}</span>
              </div>
            )}
          </div>
        )}
        <div className="metrics-group">
          <h5 className="metrics-group-title">Predictions</h5>
          <div className="metric-row">
            <span className="metric-label">Correct</span>
            <span className="metric-value">{metrics.correct_predictions ?? 'N/A'}</span>
          </div>
          {metrics.total_predictions !== undefined && (
            <div className="metric-row">
              <span className="metric-label">Total</span>
              <span className="metric-value">{metrics.total_predictions}</span>
            </div>
          )}
        </div>
        {metrics.confusion_matrix && (
          <div className="metrics-group">
            <h5 className="metrics-group-title">Confusion Matrix</h5>
            {renderConfusionMatrix(metrics.confusion_matrix)}
          </div>
        )}
      </div>
    );
  };



  return (
    <div className="fault-campaign-container">
      <div className="campaign-header">
        <h2 className="campaign-title">
          <span className="title-icon">🎯</span>
          Fault Injection Campaign
        </h2>
        <p className="campaign-subtitle">
          Run automated fault campaigns to compare metrics between golden model and model with injected faults
        </p>
      </div>

      <div className="campaign-config">
        {/* Model Selection */}
        <div className="config-section">
          <h3 className="section-title">Model Configuration</h3>
          <div className="model-selector">
            <label htmlFor="model-select">Model:</label>
            <select
              id="model-select"
              value={selectedModel?.name || ''}
              onChange={(e) => {
                const model = availableModels.find(m => m.name === e.target.value);
                setSelectedModel(model);
              }}
              disabled={isLoading}
            >
              <option value="">Select a model</option>
              {availableModels.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Campaign Configuration */}
        <div className="config-section">
          <h3 className="section-title">Campaign Configuration</h3>
          
          <div className="campaign-type-selector">
            <label>Campaign Type:</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  value="activation"
                  checked={campaignType === 'activation'}
                  onChange={(e) => setCampaignType(e.target.value)}
                />
                <span>Activation Faults</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  value="weight"
                  checked={campaignType === 'weight'}
                  onChange={(e) => setCampaignType(e.target.value)}
                />
                <span>Weight Faults</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  value="sai"
                  checked={campaignType === 'sai'}
                  onChange={(e) => setCampaignType(e.target.value)}
                />
                <span>SAI Injection</span>
              </label>
            </div>
          </div>

          {campaignType === 'sai' && (
            <div className="input-group">
              <label htmlFor="sai-granularity">SAI Granularity:</label>
              <select
                id="sai-granularity"
                value={saiGranularity}
                onChange={(e) => setSaiGranularity(e.target.value)}
              >
                <option value="global">Global (single paired sweep)</option>
                <option value="per_layer">Per-layer (paired sweep per layer)</option>
              </select>
            </div>
          )}

          <div className="input-group">
            <label htmlFor="num-samples">Number of Samples:</label>
            <input
              id="num-samples"
              type="number"
              min="1"
              max="1000"
              value={numSamples}
              onChange={(e) => setNumSamples(parseInt(e.target.value))}
            />
          </div>


        </div>

        {/* Weight / SAI Fault Configuration (SAI reuses the weight config UI) */}
        {(campaignType === 'weight' || campaignType === 'sai') && (
          <div className="config-section">
            <WeightFaultConfig
              selectedModel={selectedModel}
              onConfigChange={handleWeightFaultConfigChange}
              initialConfig={weightFaultConfig}
            />
            {campaignType === 'sai' && (
              <p className="sai-hint">
                <strong>Note:</strong> for SAI campaigns the <code>fault_type</code>
                of each layer is overridden — both <code>stuck_at_0</code> and
                <code>stuck_at_1</code> are evaluated on the same positions.
              </p>
            )}
          </div>
        )}

        {/* Run Button */}
        <div className="config-section">
          <button
            className="run-campaign-button"
            onClick={runCampaign}
            disabled={!selectedModel || isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Running Campaign...
              </>
            ) : (
              <>
                <span className="button-icon">🚀</span>
                Run Fault Campaign
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
        </div>
      )}



      {/* Results */}
      {results && (
        <div className="results-container">
          <h3 className="results-title">Campaign Results</h3>

          {/* Campaign Information */}
          <div className="result-card result-card--info">
            <h4 className="result-card-title">
              <span className="card-icon">ℹ️</span> Campaign Information
            </h4>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Session ID</span>
                <span className="info-value info-mono">{results.campaign_info?.session_id ?? '—'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Model</span>
                <span className="info-value">{results.campaign_info?.model_path?.split('/').pop() ?? '—'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Execution Time</span>
                <span className="info-value">{results.campaign_info?.execution_time_seconds?.toFixed(2) ?? '—'} s</span>
              </div>
            </div>
          </div>

          {/* SAI campaign — render dedicated component instead of golden/fault columns */}
          {results.sai_global ? (
            <SAIResults saiResults={results} />
          ) : (
            <>
              {/* Metrics side by side */}
              <div className="metrics-columns">
                <div className="result-card result-card--golden">
                  <h4 className="result-card-title">
                    <span className="card-icon">✅</span> Golden Metrics <span className="card-badge">No Faults</span>
                  </h4>
                  {formatMetrics(results.golden_results?.metrics)}
                </div>

                <div className="result-card result-card--fault">
                  <h4 className="result-card-title">
                    <span className="card-icon">⚡</span> Metrics with Faults
                  </h4>
                  {formatMetrics(results.fault_results?.metrics)}
                </div>
              </div>

              {/* Analytical Metrics — FP, FM */}
              <FaultMetricsComparison campaignResults={results} numSamples={numSamples} />
            </>
          )}

          {/* Comparison */}
          {!results.sai_global && results.comparison && (
            <div className="result-card result-card--comparison">
              <h4 className="result-card-title">
                <span className="card-icon">🔄</span> Prediction Comparison
              </h4>
              <div className="comparison-grid">
                <div className="comparison-stat comparison-stat--ok">
                  <span className="stat-number">{results.comparison.samples_with_same_predictions}</span>
                  <span className="stat-label">Same Predictions</span>
                </div>
                <div className="comparison-stat comparison-stat--diff">
                  <span className="stat-number">{results.comparison.samples_with_different_predictions}</span>
                  <span className="stat-label">Different Predictions</span>
                </div>
                <div className="comparison-stat comparison-stat--pct">
                  <span className="stat-number">{results.comparison.percentage_different?.toFixed(2)}%</span>
                  <span className="stat-label">Difference Rate</span>
                </div>
              </div>
            </div>
          )}

          {/* Degradation Analysis */}
          {!results.sai_global && results.golden_results?.metrics && results.fault_results?.metrics && (() => {
            const g = results.golden_results.metrics;
            const f = results.fault_results.metrics;
            const items = [
              { label: 'Accuracy',  golden: g.accuracy,  fault: f.accuracy,  pct: true },
              { label: 'Precision', golden: g.precision, fault: f.precision, pct: true },
              ...(g.macro_avg_precision !== undefined ? [{ label: 'Macro Avg Precision', golden: g.macro_avg_precision, fault: f.macro_avg_precision, pct: true }] : []),
              ...(g.macro_avg_recall !== undefined ? [{ label: 'Macro Avg Recall', golden: g.macro_avg_recall, fault: f.macro_avg_recall, pct: true }] : []),
              { label: 'Correct Predictions', golden: g.correct_predictions, fault: f.correct_predictions, pct: false },
            ];
            return (
              <div className="result-card result-card--degradation">
                <h4 className="result-card-title">
                  <span className="card-icon">📉</span> Degradation Analysis
                </h4>
                <div className="degradation-table-wrapper">
                  <table className="degradation-table">
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th>Golden</th>
                        <th>With Faults</th>
                        <th>Degradation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(({ label, golden, fault, pct }) => {
                        const diff = golden !== undefined && fault !== undefined ? golden - fault : null;
                        const isNeg = diff !== null && diff > 0;
                        return (
                          <tr key={label}>
                            <td className="deg-label">{label}</td>
                            <td className="deg-golden">{pct ? formatPercent(golden) : (golden ?? 'N/A')}</td>
                            <td className="deg-fault">{pct ? formatPercent(fault) : (fault ?? 'N/A')}</td>
                            <td className={`deg-delta ${isNeg ? 'deg-delta--bad' : 'deg-delta--ok'}`}>
                              {diff !== null ? (pct ? (diff * 100).toFixed(2) + '%' : diff.toFixed(2)) : 'N/A'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default FaultCampaign;