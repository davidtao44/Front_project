import { useState, useEffect } from 'react';
import BitSelector from './BitSelector';
import KernelVisualizer from './KernelVisualizer';
import './WeightFaultConfig.css';

const WeightFaultConfig = ({ selectedModel, onConfigChange, initialConfig = null, isSAI = false }) => {
  const [config, setConfig] = useState(initialConfig || {
    enabled: false,
    layers: {}
  });
  const [availableLayers, setAvailableLayers] = useState([]);
  const [selectedLayer, setSelectedLayer] = useState('');
  const [layerWeights, setLayerWeights] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const weightTypes = [
    { value: 'kernel', label: 'Kernel/Weights', description: 'Main layer weights' },
    { value: 'bias', label: 'Bias', description: 'Bias terms' }
  ];

  // Available fault types for weights
  const faultTypes = [
    //{ value: 'bitflip', label: 'Bitflip', description: 'Inverts the bit value (0→1, 1→0)' },
    { value: 'stuck_at_0', label: 'Stuck-at-0', description: 'Forces the bit to 0' },
    { value: 'stuck_at_1', label: 'Stuck-at-1', description: 'Forces the bit to 1' }
  ];

  // Typical layers of LeNet-5
  const defaultLayers = [
    { name: 'conv2d_1', type: 'Conv2D', weights: { kernel: [5, 5, 1, 6], bias: [6] } },
    { name: 'conv2d_3', type: 'Conv2D', weights: { kernel: [5, 5, 6, 16], bias: [16] } },
    { name: 'dense_6', type: 'Dense', weights: { kernel: [400, 120], bias: [120] } },
    { name: 'dense_7', type: 'Dense', weights: { kernel: [120, 84], bias: [84] } },
    { name: 'dense_8', type: 'Dense', weights: { kernel: [84, 10], bias: [10] } }
  ];

  useEffect(() => {
    setAvailableLayers(defaultLayers);
  }, []);



  const handleConfigToggle = () => {
    const newConfig = {
      ...config,
      enabled: !config.enabled
    };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handleLayerSelect = (layerName) => {
    setSelectedLayer(layerName);
    const layer = availableLayers.find(l => l.name === layerName);
    setLayerWeights(layer?.weights || null);
  };

  const addLayerConfig = () => {
    if (!selectedLayer) return;
    
    const newConfig = {
      ...config,
      layers: {
        ...config.layers,
        [selectedLayer]: {
          target_type: 'kernel',
          fault_type: 'stuck_at_0', // Default fault type
          positions: [],
          bit_positions: [15] // Global bit configuration for all positions
        }
      }
    };
    setConfig(newConfig);
    onConfigChange(newConfig);
    
    setSelectedLayer('');
    setLayerWeights(null);
  };

  const removeLayerConfig = (layerName) => {
    const newLayers = { ...config.layers };
    delete newLayers[layerName];
    const newConfig = {
      ...config,
      layers: newLayers
    };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const updateLayerTargetType = (layerName, targetType) => {
    const newConfig = {
      ...config,
      layers: {
        ...config.layers,
        [layerName]: {
          ...config.layers[layerName],
          target_type: targetType,
          positions: [] // Reset positions when changing target type
        }
      }
    };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

    // Function to handle fault type changes
    const updateLayerFaultType = (layerName, faultType) => {
    const newConfig = {
      ...config,
      layers: {
        ...config.layers,
        [layerName]: {
          ...config.layers[layerName],
          fault_type: faultType
        }
      }
    };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

    // Function to handle visual position selection
    const handleVisualPositionToggle = (layerName, position, isSelected) => {
    const layerConfig = config.layers[layerName];
    if (!layerConfig) return;

    let newPositions;
    
    if (isSelected) {
      // Add new position (without individual bit configuration)
      newPositions = [...layerConfig.positions, position];
    } else {
      // Remove position
      newPositions = layerConfig.positions.filter(pos => 
        JSON.stringify(pos) !== JSON.stringify(position)
      );
    }

    const newConfig = {
      ...config,
      layers: {
        ...config.layers,
        [layerName]: {
          ...layerConfig,
          positions: newPositions
        }
      }
    };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

    // Function to get selected positions for the visualizer
    const getSelectedPositions = (layerName) => {
    const layerConfig = config.layers[layerName];
    if (!layerConfig) return [];
    
    return layerConfig.positions || [];
  };

    // Function to update global bit configuration
    const updateGlobalBitPositions = (layerName, bitPositions) => {
    const newConfig = {
      ...config,
      layers: {
        ...config.layers,
        [layerName]: {
          ...config.layers[layerName],
          bit_positions: bitPositions
        }
      }
    };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const getWeightShape = (layerName, targetType) => {
    const layer = availableLayers.find(l => l.name === layerName);
    return layer?.weights[targetType] || [];
  };

  const isValidPosition = (position, shape) => {
    if (position.length !== shape.length) return false;
    return position.every((pos, index) => pos >= 0 && pos < shape[index]);
  };

  return (
    <div className="weight-fault-config">
      <div className="config-header">
        <h3>Weight Fault Injection Configuration</h3>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={handleConfigToggle}
          />
          <span className="slider"></span>
        </label>
      </div>

      {config.enabled && (
        <div className="config-content">
          {/* Layer selection */}
          <div className="layer-selection">
            <h4>Select Layer</h4>
            <div className="layer-selector">
              <select
                value={selectedLayer}
                onChange={(e) => handleLayerSelect(e.target.value)}
              >
                <option value="">Select a layer...</option>
                {availableLayers.map(layer => (
                  <option 
                    key={layer.name} 
                    value={layer.name}
                    disabled={config.layers[layer.name]}
                  >
                    {layer.name} ({layer.type})
                  </option>
                ))}
              </select>
              <button
                onClick={addLayerConfig}
                disabled={!selectedLayer || config.layers[selectedLayer]}
                className="add-layer-btn"
              >
                Add Layer
              </button>
            </div>
          </div>

          {/* Layer configurations */}
          {Object.entries(config.layers).map(([layerName, layerConfig]) => {
            const layer = availableLayers.find(l => l.name === layerName);
            const weightShape = getWeightShape(layerName, layerConfig.target_type);

            return (
              <div key={layerName} className="layer-config">
                <div className="layer-config-header">
                  <h4>{layerName}</h4>
                  <button
                    onClick={() => removeLayerConfig(layerName)}
                    className="remove-layer-btn"
                  >
                    ✕
                  </button>
                </div>

                {/* Weight type */}
                <div className="option-group">
                  <label>Weight Type:</label>
                  <select
                    value={layerConfig.target_type}
                    onChange={(e) => updateLayerTargetType(layerName, e.target.value)}
                  >
                    {weightTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fault type — oculto en campañas SAI: el servicio fuerza
                    stuck_at_0 y stuck_at_1 sobre las mismas posiciones, así
                    que elegirlo aquí no tiene efecto. */}
                {!isSAI && (
                  <div className="option-group">
                    <label>Fault Type:</label>
                    <select
                      value={layerConfig.fault_type}
                      onChange={(e) => updateLayerFaultType(layerName, e.target.value)}
                    >
                      {faultTypes.map(type => (
                        <option key={type.value} value={type.value} title={type.description}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    <small className="fault-type-description">
                      {faultTypes.find(t => t.value === (layerConfig.fault_type ))?.description}
                    </small>
                  </div>
                )}

                {/* Weight information */}
                <div className="weight-info">
                  <p><strong>Dimensions:</strong> [{weightShape.join(', ')}]</p>
                  <p><strong>Total elements:</strong> {weightShape.reduce((a, b) => a * b, 1)}</p>
                </div>

                {/* Global Bit Configuration */}
                <div className="global-bit-config">
                  <h5>Bit Configuration (Applied to all positions)</h5>
                  <div className="bit-selector-container">
                    <BitSelector
                      selectedBits={layerConfig.bit_positions || [15]}
                      onBitsChange={(bits) => updateGlobalBitPositions(layerName, bits)}
                    />
                  </div>
                  <div className="bit-config-info">
                    <p><strong>Selected bits:</strong> {(layerConfig.bit_positions || [15]).join(', ')}</p>
                    <p><strong>Will apply to:</strong> {layerConfig.positions?.length || 0} positions</p>
                  </div>
                </div>

                {/* Visual Position Selector */}
                <div className="positions-section">
                  <h5>Select {layerConfig.target_type === 'kernel' ? 'Kernel' : 'Bias'} Positions</h5>
                  <KernelVisualizer
                    shape={weightShape}
                    selectedPositions={getSelectedPositions(layerName)}
                    onPositionToggle={(position, isSelected) => 
                      handleVisualPositionToggle(layerName, position, isSelected)
                    }
                    disabled={false}
                  />
                </div>

                {/* Configuration summary */}
                {layerConfig.positions && layerConfig.positions.length > 0 && (
                  <div className="config-summary">
                    <h5>Configuration Summary</h5>
                    <div className="summary-content">
                      <p><strong>Selected positions:</strong> {layerConfig.positions.length}</p>
                      <p><strong>Affected bits per position:</strong> {(layerConfig.bit_positions || [15]).length}</p>
                      <p><strong>Total faults to inject:</strong> {layerConfig.positions.length * (layerConfig.bit_positions || [15]).length}</p>
                      
                      <div className="positions-list">
                        <h6>Positions:</h6>
                        <div className="positions-grid">
                          {layerConfig.positions.map((position, index) => (
                            <span key={index} className="position-tag">
                              [{position.join(', ')}]
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty state */}
          {Object.keys(config.layers).length === 0 && (
            <div className="empty-state">
              <p>No layers configured. Select a layer to start.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WeightFaultConfig;