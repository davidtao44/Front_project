import { useState, useEffect } from "react";
import styles from "./CNNconfigurator.module.css";

const CNNConfigurator = ({ onSubmit, isLoading }) => {
  const [inputShape, setInputShape] = useState([32, 32, 1]);
  const [convLayers, setConvLayers] = useState([]);
  const [denseLayers, setDenseLayers] = useState([]);
  const [outputUnits, setOutputUnits] = useState(10);
  const [outputActivation, setOutputActivation] = useState("softmax");
  const [modelName, setModelName] = useState("");
  const [validationError, setValidationError] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const [convParams, setConvParams] = useState({ filters: 6, kernel_size: 3, pooling: "max" });
  const [denseParams, setDenseParams] = useState({ units: 120, activation: "relu" });

  const addConvLayer = () => {
    setConvLayers([...convLayers, convParams]);
    setConvParams({ filters: 6, kernel_size: 3, pooling: "max" });
  };

  const addDenseLayer = () => {
    setDenseLayers([...denseLayers, denseParams]);
    setDenseParams({ units: 120, activation: "relu" });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation checks
    if (!modelName.trim()) {
      setValidationError("Debe proporcionar un nombre para la arquitectura.");
      return;
    }
    
    if (convLayers.length === 0) {
      setValidationError("Debe agregar al menos una capa convolucional con pooling.");
      return;
    }
    
    if (denseLayers.length === 0) {
      setValidationError("Debe agregar al menos una capa densa.");
      return;
    }
    
    // Clear any previous validation error
    setValidationError("");
    
    const config = {
      input_shape: inputShape,
      conv_layers: convLayers,
      dense_layers: denseLayers,
      output_units: outputUnits,
      output_activation: outputActivation,
      model_name: modelName.trim()  // Include the model name in the config
    };
    
    onSubmit(config);
  };

  return (
    <div className={styles.formContainer}>
      {/* Success Popup */}
      {showSuccessPopup && (
        <div className={styles.popup}>
          <div className={styles.popupContent}>
            <span className={styles.popupIcon}>✅</span>
            <span className={styles.popupMessage}>¡Modelo creado exitosamente!</span>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2 className={styles.title}>Configurar CNN</h2>

        {/* Display validation error if present */}
        {validationError && (
          <div className={styles.errorMessage}>
            {validationError}
          </div>
        )}

        {/* Grid 2x2 para las secciones principales */}
        <div className={styles.sectionsGrid}>
          {/* Sección 1: Nombre de la Arquitectura */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Nombre de la Arquitectura</h3>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nombre:</label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="Ingrese un nombre para su arquitectura"
                className={styles.input}
              />
              <p className={styles.helperText}>
                El archivo se guardará como: architecture_DD_MM_YYYY_{modelName}
              </p>
            </div>
          </div>

          {/* Sección 2: Capa Convolucional */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Añadir Capa Convolucional</h3>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Filtros:</label>
              <input 
                type="number" 
                value={convParams.filters} 
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                  setConvParams({ ...convParams, filters: isNaN(value) ? 0 : value });
                }} 
                className={styles.input} 
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Tamaño del Kernel:</label>
              <input 
                type="number" 
                value={convParams.kernel_size} 
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                  setConvParams({ ...convParams, kernel_size: isNaN(value) ? 0 : value });
                }} 
                className={styles.input} 
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Pooling:</label>
              <select 
                value={convParams.pooling} 
                onChange={(e) => setConvParams({ ...convParams, pooling: e.target.value })} 
                className={styles.select}
              >
                <option value="max">Max</option>
                <option value="average">Average</option>
              </select>
            </div>

            <button 
              type="button" 
              onClick={addConvLayer} 
              className={styles.buttonConv}
            >
              Agregar Capa Convolucional
            </button>
          </div>

          {/* Sección 3: Capa Densa */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Añadir Capa Densa</h3>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Unidades:</label>
              <input 
                type="number" 
                value={denseParams.units} 
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                  setDenseParams({ ...denseParams, units: isNaN(value) ? 0 : value });
                }} 
                className={styles.input} 
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Activación:</label>
              <select 
                value={denseParams.activation} 
                onChange={(e) => setDenseParams({ ...denseParams, activation: e.target.value })} 
                className={styles.select}
              >
                <option value="relu">ReLU</option>
                <option value="sigmoid">Sigmoid</option>
                <option value="tanh">Tanh</option>
                <option value="softmax">Softmax</option>
              </select>
            </div>

            <button 
              type="button"
              onClick={addDenseLayer} 
              className={styles.buttonDense}
            >
              Agregar Capa Densa
            </button>
          </div>

          {/* Sección 4: Configuración de Salida */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Configuración de Salida</h3>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Output Units:</label>
              <input 
                type="number" 
                value={outputUnits} 
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                  setOutputUnits(isNaN(value) ? 0 : value);
                }} 
                className={styles.input} 
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Output Activation:</label>
              <select 
                value={outputActivation} 
                onChange={(e) => setOutputActivation(e.target.value)} 
                className={styles.select}
              >
                <option value="softmax">Softmax</option>
                <option value="sigmoid">Sigmoid</option>
              </select>
            </div>
          </div>
        </div>

        {/* Botón de envío fuera del grid */}
        <button 
          type="submit" 
          className={styles.submitButton}
        >
          Enviar Configuración
        </button>

        {/* Vista previa */}
        <div className={styles.preview}>
          <h3 className={styles.previewTitle}>Arquitectura de la Red</h3>
          
          {(convLayers.length > 0 || denseLayers.length > 0) ? (
            <div className={styles.architectureContainer}>
              {/* Input Layer */}
              <div className={styles.layerBox}>
                <div className={styles.inputLayer}>
                  <span>Input</span>
                  <div className={styles.inputShape}>{inputShape.join(' × ')}</div>
                </div>
              </div>
              
              {/* Convolutional Layers */}
              {convLayers.map((layer, index) => (
                <div key={`conv-${index}`} className={styles.layerBox}>
                  <div className={styles.arrow}>→</div>
                  <div className={styles.convLayer}>
                    <span>Conv2D</span>
                    <div className={styles.filterGrid}>
                      {Array(Math.min(6, layer.filters)).fill().map((_, i) => (
                        <div key={i} className={styles.filter}></div>
                      ))}
                      {layer.filters > 6 && <div className={styles.moreDots}>...</div>}
                    </div>
                    <div className={styles.layerDetails}>
                      {layer.filters} filters, {layer.kernel_size}×{layer.kernel_size}
                    </div>
                  </div>
                  <div className={styles.arrow}>→</div>
                  <div className={styles.poolingLayer}>
                    <span>{layer.pooling === 'max' ? 'MaxPool' : 'AvgPool'}</span>
                    <div className={styles.poolBox}></div>
                  </div>
                </div>
              ))}
              
              {/* Flatten Layer (always present) */}
              {(convLayers.length > 0 || denseLayers.length > 0) && (
                <div className={styles.layerBox}>
                  <div className={styles.arrow}>→</div>
                  <div className={styles.flattenLayer}>
                    <span>Flatten</span>
                    <div className={styles.flattenIcon}>⟹</div>
                  </div>
                </div>
              )}
              
              {/* Dense Layers */}
              {denseLayers.map((layer, index) => (
                <div key={`dense-${index}`} className={styles.layerBox}>
                  <div className={styles.arrow}>→</div>
                  <div className={styles.denseLayer}>
                    <span>Dense</span>
                    <div className={styles.neuronGroup}>
                      {Array(Math.min(8, layer.units)).fill().map((_, i) => (
                        <div key={i} className={styles.neuron}></div>
                      ))}
                      {layer.units > 8 && <div className={styles.moreDots}>...</div>}
                    </div>
                    <div className={styles.layerDetails}>
                      {layer.units} units, {layer.activation}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Output Layer */}
              {(convLayers.length > 0 && denseLayers.length > 0) && (
                <div className={styles.layerBox}>
                  <div className={styles.arrow}>→</div>
                  <div className={styles.outputLayer}>
                    <span>Output</span>
                    <div className={styles.neuronGroup}>
                      {Array(Math.min(8, outputUnits)).fill().map((_, i) => (
                        <div key={i} className={styles.neuron}></div>
                      ))}
                      {outputUnits > 8 && <div className={styles.moreDots}>...</div>}
                    </div>
                    <div className={styles.layerDetails}>
                      {outputUnits} units, {outputActivation}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className={styles.emptyMessage}>Agregue capas para visualizar la arquitectura</p>
          )}
        </div>
      </form>
    </div>
  );
};

export default CNNConfigurator;
