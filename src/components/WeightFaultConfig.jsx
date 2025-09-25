import { useState, useEffect } from 'react';
import BitSelector from './BitSelector';
import KernelVisualizer from './KernelVisualizer';
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
          positions: [],
          bit_positions: [15] // Configuración global de bits para todas las posiciones
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

  // Función para manejar la selección visual de posiciones
  const handleVisualPositionToggle = (layerName, position, isSelected) => {
    const layerConfig = config.layers[layerName];
    if (!layerConfig) return;

    let newPositions;
    
    if (isSelected) {
      // Agregar nueva posición (sin configuración de bits individual)
      newPositions = [...layerConfig.positions, position];
    } else {
      // Remover posición
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

  // Función para obtener las posiciones seleccionadas para el visualizador
  const getSelectedPositions = (layerName) => {
    const layerConfig = config.layers[layerName];
    if (!layerConfig) return [];
    
    return layerConfig.positions || [];
  };

  // Función para actualizar la configuración global de bits
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

                {/* Configuración Global de Bits */}
                <div className="global-bit-config">
                  <h5>Configuración de Bits (Aplicada a todas las posiciones)</h5>
                  <div className="bit-selector-container">
                    <BitSelector
                      selectedBits={layerConfig.bit_positions || [15]}
                      onBitsChange={(bits) => updateGlobalBitPositions(layerName, bits)}
                    />
                  </div>
                  <div className="bit-config-info">
                    <p><strong>Bits seleccionados:</strong> {(layerConfig.bit_positions || [15]).join(', ')}</p>
                    <p><strong>Se aplicará a:</strong> {layerConfig.positions?.length || 0} posiciones</p>
                  </div>
                </div>

                {/* Selector Visual de Posiciones */}
                <div className="positions-section">
                  <h5>Seleccionar Posiciones del {layerConfig.target_type === 'kernel' ? 'Kernel' : 'Bias'}</h5>
                  <KernelVisualizer
                    shape={weightShape}
                    selectedPositions={getSelectedPositions(layerName)}
                    onPositionToggle={(position, isSelected) => 
                      handleVisualPositionToggle(layerName, position, isSelected)
                    }
                    disabled={false}
                  />
                </div>

                {/* Resumen de configuración */}
                {layerConfig.positions && layerConfig.positions.length > 0 && (
                  <div className="config-summary">
                    <h5>Resumen de Configuración</h5>
                    <div className="summary-content">
                      <p><strong>Posiciones seleccionadas:</strong> {layerConfig.positions.length}</p>
                      <p><strong>Bits afectados por posición:</strong> {(layerConfig.bit_positions || [15]).length}</p>
                      <p><strong>Total de fallos a inyectar:</strong> {layerConfig.positions.length * (layerConfig.bit_positions || [15]).length}</p>
                      
                      <div className="positions-list">
                        <h6>Posiciones:</h6>
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