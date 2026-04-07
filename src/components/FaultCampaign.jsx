import { useState, useEffect } from 'react';
import { faultCampaignService } from '../services/api';
import WeightFaultConfig from './WeightFaultConfig';
import './FaultCampaign.css';

const FaultCampaign = () => {
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [campaignType, setCampaignType] = useState('activation'); // 'activation' or 'weight'
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

  const formatMetrics = (metrics) => {
    console.log('formatMetrics called with:', metrics);
    console.log('metrics type:', typeof metrics);
    console.log('metrics is null/undefined:', metrics == null);
    
    if (!metrics) {
      console.log('Metrics is falsy, returning N/A');
      return <div className="metrics-container">
        <div className="metric-item">
          <span className="metric-label">Status:</span>
          <span className="metric-value">N/A</span>
        </div>
      </div>;
    }
    
    return (
      <div className="metrics-container">
        <div className="metric-item">
          <span className="metric-label">Accuracy:</span>
          <span className="metric-value">
            {metrics.accuracy !== undefined ? (metrics.accuracy * 100).toFixed(2) + '%' : 'N/A'}
          </span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Precision:</span>
          <span className="metric-value">
            {metrics.precision !== undefined ? (metrics.precision * 100).toFixed(2) + '%' : 'N/A'}
          </span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Correct Predictions:</span>
          <span className="metric-value">{metrics.correct_predictions || 'N/A'}</span>
        </div>
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
            </div>
          </div>

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

        {/* Weight Fault Configuration */}
        {campaignType === 'weight' && (
          <div className="config-section">
            <WeightFaultConfig
              selectedModel={selectedModel}
              onConfigChange={handleWeightFaultConfigChange}
              initialConfig={weightFaultConfig}
            />
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
            {console.log('🔍 Rendering results with state:', results)}
            
            {/* SIMPLE TEST: Basic text rendering */}
            <div style={{
              backgroundColor: 'orange', 
              padding: '15px', 
              margin: '10px',
              border: '3px solid black',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              🚨 SIMPLE TEST: If you can see this orange box, rendering works! 🚨
            </div>
            
            <h3 className="results-title">Campaign Results</h3>
          
          {/* Campaign Information */}
          <div className="result-card">
            <h4>Campaign Information</h4>
            <div className="campaign-info">
              <div className="info-item">
                <span className="label">Session ID:</span>
                <span className="value">{results.campaign_info?.session_id}</span>
              </div>
              <div className="info-item">
                <span className="label">Model:</span>
                <span className="value">{results.campaign_info?.model_path?.split('/').pop()}</span>
              </div>

              <div className="info-item">
                <span className="label">Execution Time:</span>
                <span className="value">{results.campaign_info?.execution_time_seconds?.toFixed(2)}s</span>
              </div>
            </div>
          </div>

          {/* Golden Metrics */}
          <div className="result-card">
              <h4>Golden Metrics (No Faults)</h4>
              
              {/* DEBUG SIMPLE: Solo mostrar una métrica */}
              <div style={{backgroundColor: 'lightblue', padding: '15px', margin: '10px', fontSize: '16px', border: '2px solid blue'}}>
                <strong>🔍 DEBUG SIMPLE:</strong><br/>
                <div>¿Existe golden_results? {results.golden_results ? 'SÍ' : 'NO'}</div>
                <div>¿Existe metrics? {results.golden_results?.metrics ? 'SÍ' : 'NO'}</div>
                <div>Accuracy raw: {String(results.golden_results?.metrics?.accuracy)}</div>
                <div>Accuracy formatted: {results.golden_results?.metrics?.accuracy ? (results.golden_results.metrics.accuracy * 100).toFixed(2) + '%' : 'N/A'}</div>
              </div>
              
              {/* Metrics with formatMetrics */}
              <div style={{backgroundColor: 'lightgreen', padding: '15px', margin: '10px'}}>
                <strong>📊 Metrics with formatMetrics:</strong>
                {formatMetrics(results.golden_results?.metrics)}
              </div>
          </div>

          {/* Metrics with Faults */}
          <div className="result-card">
            <h4>Metrics with Faults</h4>
            {formatMetrics(results.fault_results?.metrics)}
          </div>

          {/* Comparison */}
          {results.comparison && (
            <div className="result-card">
              <h4>Results Comparison</h4>
              <div className="comparison-container">
                <div className="comparison-item">
                  <span className="label">Same Predictions:</span>
                  <span className="value">{results.comparison.samples_with_same_predictions}</span>
                </div>
                <div className="comparison-item">
                  <span className="label">Different Predictions:</span>
                  <span className="value">{results.comparison.samples_with_different_predictions}</span>
                </div>
                <div className="comparison-item">
                  <span className="label">Difference Percentage:</span>
                  <span className="value">{results.comparison.percentage_different?.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Metrics Degradation */}
          {results.golden_results?.metrics && results.fault_results?.metrics && (
            <div className="result-card">
              <h4>Metrics Degradation</h4>
              <div className="degradation-container">
                <div className="degradation-item">
                  <span className="label">Accuracy Loss:</span>
                  <span className="value degradation">
                    {((results.golden_results.metrics.accuracy - results.fault_results.metrics.accuracy) * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="degradation-item">
                  <span className="label">Precision Loss:</span>
                  <span className="value degradation">
                    {((results.golden_results.metrics.precision - results.fault_results.metrics.precision) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FaultCampaign;