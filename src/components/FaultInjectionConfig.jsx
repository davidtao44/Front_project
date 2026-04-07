import { useState, useEffect } from 'react';
import { faultInjectorService } from '../services/api';
import BitSelector from './BitSelector';
import './FaultInjectionConfig.css';

const FaultInjectionConfig = ({ selectedModel, onConfigChange, initialConfig = null }) => {
  const [config, setConfig] = useState({
    enabled: false,
    layers: {}
  });
  const [availableLayers, setAvailableLayers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const faultTypes = [
    { value: 'bit_flip', label: 'Bit Flip', description: 'Invierte bits aleatoriamente' },
    { value: 'stuck_at_0', label: 'Stuck at 0', description: 'Fija bits a 0' },
    { value: 'stuck_at_1', label: 'Stuck at 1', description: 'Fija bits a 1' },
    { value: 'random_noise', label: 'Ruido Aleatorio', description: 'Añade ruido gaussiano' }
  ];

  useEffect(() => {
    if (selectedModel) {
      loadAvailableLayers();
    }
  }, [selectedModel]);

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  const loadAvailableLayers = async () => {
    try {
      setIsLoading(true);
      const response = await faultInjectorService.getAvailableLayers(selectedModel.path);
      setAvailableLayers(response.layers);
    } catch (error) {
      setError('Error loading available layers');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigToggle = () => {
    const newConfig = { ...config, enabled: !config.enabled };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handleLayerToggle = (layerName) => {
    const newLayers = { ...config.layers };
    
    if (newLayers[layerName]) {
      delete newLayers[layerName];
    } else {
      newLayers[layerName] = {
        fault_type: 'bit_flip',
        fault_rate: 0.01,
        parameters: {}
      };
    }
    
    const newConfig = { ...config, layers: newLayers };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handleLayerConfigChange = (layerName, field, value) => {
    const newLayers = { ...config.layers };
    newLayers[layerName] = {
      ...newLayers[layerName],
      [field]: value
    };
    
    const newConfig = { ...config, layers: newLayers };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handleParameterChange = (layerName, paramName, value) => {
    const newLayers = { ...config.layers };
    newLayers[layerName] = {
      ...newLayers[layerName],
      parameters: {
        ...newLayers[layerName].parameters,
        [paramName]: value
      }
    };
    
    const newConfig = { ...config, layers: newLayers };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handleBitPositionsChange = (layerName, bitPositions) => {
    const newLayers = { ...config.layers };
    newLayers[layerName] = {
      ...newLayers[layerName],
      bit_positions: bitPositions.length > 0 ? bitPositions : undefined
    };
    
    const newConfig = { ...config, layers: newLayers };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const validateConfiguration = async () => {
    if (!config.enabled || Object.keys(config.layers).length === 0) {
      return { valid: true };
    }

    try {
      setIsLoading(true);
      const response = await faultInjectorService.configureFaultInjection(config);
      return { valid: true, response };
    } catch (error) {
      return { valid: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedModel) {
    return (
      <div className="fault-config-placeholder">
        <div className="placeholder-icon">🎯</div>
        <p>Select a model to configure fault injection</p>
      </div>
    );
  }

  return (
    <div className="fault-injection-config">
      <div className="config-header">
        <div className="config-toggle">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={handleConfigToggle}
            />
            <span className="toggle-slider"></span>
          </label>
          <div className="toggle-label">
            <h4>Habilitar Inyección de Fallos</h4>
            <p>Enable fault injection during inference</p>
          </div>
        </div>
      </div>

      {config.enabled && (
        <div className="config-content">
          <div className="layers-section">
            <h5>Layer Configuration</h5>
            <p className="section-description">
              Select the layers where you want to inject faults and configure the parameters.
            </p>

            {isLoading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading available layers...</p>
              </div>
            ) : error ? (
              <div className="error-message">
                <div className="error-icon">⚠️</div>
                <p>{error}</p>
              </div>
            ) : (
              <div className="layers-list">
                {availableLayers.map((layer) => (
                  <div key={layer.name} className="layer-config-item">
                    <div className="layer-header">
                      <label className="layer-checkbox">
                        <input
                          type="checkbox"
                          checked={!!config.layers[layer.name]}
                          onChange={() => handleLayerToggle(layer.name)}
                        />
                        <div className="layer-info">
                          <span className="layer-name">{layer.name}</span>
                          <span className="layer-type">{layer.type}</span>
                          <span className="layer-description">{layer.description}</span>
                        </div>
                      </label>
                    </div>

                    {config.layers[layer.name] && (
                      <div className="layer-config-details">
                        <div className="config-row">
                          <div className="config-field">
                            <label>Tipo de Fallo:</label>
                            <select
                              value={config.layers[layer.name].fault_type}
                              onChange={(e) => handleLayerConfigChange(layer.name, 'fault_type', e.target.value)}
                            >
                              {faultTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                            <span className="field-description">
                              {faultTypes.find(t => t.value === config.layers[layer.name].fault_type)?.description}
                            </span>
                          </div>

                          <div className="config-field">
                            <label>Tasa de Fallos:</label>
                            <input
                              type="number"
                              min="0"
                              max="1"
                              step="0.001"
                              value={config.layers[layer.name].fault_rate}
                              onChange={(e) => handleLayerConfigChange(layer.name, 'fault_rate', parseFloat(e.target.value))}
                            />
                            <span className="field-description">
                              Fault probability (0.0 - 1.0)
                            </span>
                          </div>
                        </div>

                        {config.layers[layer.name].fault_type === 'random_noise' && (
                          <div className="config-row">
                            <div className="config-field">
                              <label>Desviación Estándar:</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={config.layers[layer.name].parameters?.std_dev || 0.1}
                                onChange={(e) => handleParameterChange(layer.name, 'std_dev', parseFloat(e.target.value))}
                              />
                              <span className="field-description">
                                Desviación estándar del ruido gaussiano
                              </span>
                            </div>
                          </div>
                        )}

                        {config.layers[layer.name].fault_type === 'bit_flip' && (
                          <BitSelector
                            selectedBits={config.layers[layer.name].bit_positions || []}
                            onBitsChange={(bitPositions) => handleBitPositionsChange(layer.name, bitPositions)}
                            disabled={false}
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="config-summary">
            <h5>Configuration Summary</h5>
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-label">Configured layers:</span>
                <span className="stat-value">{Object.keys(config.layers).length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Status:</span>
                <span className={`stat-value ${config.enabled ? 'enabled' : 'disabled'}`}>
                  {config.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            {Object.keys(config.layers).length > 0 && (
              <div className="layers-summary">
                {Object.entries(config.layers).map(([layerName, layerConfig]) => (
                  <div key={layerName} className="layer-summary">
                    <strong>{layerName}</strong>
                    <div className="layer-details">
                      <span>Type: {layerConfig.fault_type}</span>
                      <span>Probability: {(layerConfig.fault_rate * 100).toFixed(1)}%</span>
                      {layerConfig.fault_type === 'random_noise' && layerConfig.parameters?.std_dev && (
                        <span>Std Dev: {layerConfig.parameters.std_dev}</span>
                      )}
                      {layerConfig.fault_type === 'bit_flip' && layerConfig.bit_positions && layerConfig.bit_positions.length > 0 && (
                        <span>Specific bits: {layerConfig.bit_positions.sort((a, b) => a - b).join(', ')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FaultInjectionConfig;