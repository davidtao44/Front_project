import { useState, useEffect } from 'react';
import BitSelector from './BitSelector';
import './WeightFaultConfig.css';

const WeightFaultConfig = ({ selectedModel, onConfigChange, initialConfig = null }) => {
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
    { value: 'kernel', label: 'Kernel/Weights', description: 'Pesos principales de la capa' },
    { value: 'bias', label: 'Bias', description: 'Términos de sesgo' }
  ];

  // Capas típicas de LeNet-5
  const defaultLayers = [
    { name: 'conv2d_1', type: 'Conv2D', weights: { kernel: [5, 5, 1, 6], bias: [6] } },
    { name: 'conv2d_2', type: 'Conv2D', weights: { kernel: [5, 5, 6, 16], bias: [16] } },
    { name: 'dense_1', type: 'Dense', weights: { kernel: [400, 120], bias: [120] } },
    { name: 'dense_2', type: 'Dense', weights: { kernel: [120, 84], bias: [84] } },
    { name: 'dense_3', type: 'Dense', weights: { kernel: [84, 10], bias: [10] } }
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
          positions: []
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

  const addPosition = (layerName) => {
    const layerConfig = config.layers[layerName];
    if (!layerConfig) return;

    const layer = availableLayers.find(l => l.name === layerName);
    const weightShape = layer?.weights[layerConfig.target_type];
    
    if (!weightShape) return;

    // Create default position (all zeros)
    const defaultPosition = new Array(weightShape.length).fill(0);

    const newConfig = {
      ...config,
      layers: {
        ...config.layers,
        [layerName]: {
          ...config.layers[layerName],
          positions: [
            ...config.layers[layerName].positions,
            {
              position: defaultPosition,
              bit_positions: [15] // Default bit position
            }
          ]
        }
      }
    };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const removePosition = (layerName, positionIndex) => {
    const newConfig = {
      ...config,
      layers: {
        ...config.layers,
        [layerName]: {
          ...config.layers[layerName],
          positions: config.layers[layerName].positions.filter((_, index) => index !== positionIndex)
        }
      }
    };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const updatePosition = (layerName, positionIndex, dimensionIndex, value) => {
    const newPositions = [...config.layers[layerName].positions];
    const newPosition = [...newPositions[positionIndex].position];
    newPosition[dimensionIndex] = parseInt(value) || 0;
    newPositions[positionIndex] = {
      ...newPositions[positionIndex],
      position: newPosition
    };

    const newConfig = {
      ...config,
      layers: {
        ...config.layers,
        [layerName]: {
          ...config.layers[layerName],
          positions: newPositions
        }
      }
    };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const updateBitPositions = (layerName, positionIndex, bitPositions) => {
    const newPositions = [...config.layers[layerName].positions];
    newPositions[positionIndex] = {
      ...newPositions[positionIndex],
      bit_positions: bitPositions
    };

    const newConfig = {
      ...config,
      layers: {
        ...config.layers,
        [layerName]: {
          ...config.layers[layerName],
          positions: newPositions
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
        <h3>Configuración de Inyección de Fallos en Pesos</h3>
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
          {/* Selección de capa */}
          <div className="layer-selection">
            <h4>Seleccionar Capa</h4>
            <div className="layer-selector">
              <select
                value={selectedLayer}
                onChange={(e) => handleLayerSelect(e.target.value)}
              >
                <option value="">Selecciona una capa...</option>
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
                Añadir Capa
              </button>
            </div>
          </div>

          {/* Configuraciones de capas */}
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

                {/* Tipo de peso */}
                <div className="option-group">
                  <label>Tipo de Peso:</label>
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

                {/* Información de pesos */}
                <div className="weight-info">
                  <p><strong>Dimensiones:</strong> [{weightShape.join(', ')}]</p>
                  <p><strong>Total elementos:</strong> {weightShape.reduce((a, b) => a * b, 1)}</p>
                </div>

                {/* Posiciones de fallos */}
                <div className="positions-section">
                  <div className="positions-header">
                    <h5>Posiciones de Fallos</h5>
                    <button
                      onClick={() => addPosition(layerName)}
                      className="add-position-btn"
                    >
                      + Añadir Posición
                    </button>
                  </div>

                  {layerConfig.positions.map((posConfig, posIndex) => {
                    const isValid = isValidPosition(posConfig.position, weightShape);
                    
                    return (
                      <div key={posIndex} className="position-config">
                        <div className="position-header">
                          <h6>Posición {posIndex + 1}</h6>
                          <button
                            onClick={() => removePosition(layerName, posIndex)}
                            className="remove-position-btn"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Dimensiones */}
                        <div className="dimensions-input">
                          {posConfig.position.map((dim, dimIndex) => (
                            <div key={dimIndex} className="dimension-input">
                              <label>Dim {dimIndex + 1}</label>
                              <input
                                type="number"
                                min="0"
                                max={weightShape[dimIndex] - 1}
                                value={dim}
                                onChange={(e) => updatePosition(layerName, posIndex, dimIndex, e.target.value)}
                                className={!isValid ? 'invalid' : ''}
                              />
                              <span className="max-value">max: {weightShape[dimIndex] - 1}</span>
                            </div>
                          ))}
                        </div>

                        {!isValid && (
                          <div className="error-message">
                            Posición inválida para las dimensiones [{weightShape.join(', ')}]
                          </div>
                        )}

                        {/* Selector de bits */}
                        <div className="bit-selector">
                          <label>Bits a afectar:</label>
                          <BitSelector
                            selectedBits={posConfig.bit_positions}
                            onBitsChange={(bits) => updateBitPositions(layerName, posIndex, bits)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Estado vacío */}
          {Object.keys(config.layers).length === 0 && (
            <div className="empty-state">
              <p>No hay capas configuradas. Selecciona una capa para comenzar.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WeightFaultConfig;