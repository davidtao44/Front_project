import { useState } from 'react';
import Header from '../components/Header';
import ModelSelector from '../components/cnn/ModelSelector';
import FaultInjectionConfig from '../components/FaultInjectionConfig';
import WeightFaultConfig from '../components/WeightFaultConfig';
import { faultInjectorService } from '../services/api';
import { API_BASE_URL } from '../config/api';
import './FaultInjector.css';

const FaultInjector = () => {
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('inference');
  const [faultConfig, setFaultConfig] = useState({ enabled: false, layers: {} });
  const [weightFaultConfig, setWeightFaultConfig] = useState({ enabled: false, layers: {} });
  const [faultResults, setFaultResults] = useState(null);

  const handleSelectModel = (model) => {
    setSelectedModel(model);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInference = async () => {
    if (!selectedModel || !selectedImage) {
      setError('Por favor selecciona un modelo y una imagen');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setResults(null);
    
    try {
      const response = await faultInjectorService.performInference(
        selectedImage,
        selectedModel.path
      );
      
      setResults(response);
    } catch (error) {
      console.error('Error en la inferencia:', error);
      setError(error.message || 'Error al realizar la inferencia');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFaultConfigChange = (config) => {
    setFaultConfig(config);
  };

  const handleWeightFaultConfigChange = (config) => {
    setWeightFaultConfig(config);
  };

  const handleFaultInjectionInference = async () => {
    if (!selectedModel || !selectedImage) {
      setError('Por favor selecciona un modelo y una imagen');
      return;
    }

    // Verificar que al menos una configuración de fallos esté habilitada
    const hasActivationFaults = faultConfig?.enabled && Object.keys(faultConfig.layers).length > 0;
    const hasWeightFaults = weightFaultConfig?.enabled && Object.keys(weightFaultConfig.layers).length > 0;
    
    if (!hasActivationFaults && !hasWeightFaults) {
      setError('Por favor configura al menos un tipo de inyección de fallos antes de ejecutar');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setFaultResults(null);
    
    try {
      // Combinar configuraciones de fallos
      const combinedConfig = {
        activation_faults: faultConfig,
        weight_faults: weightFaultConfig
      };

      const response = await faultInjectorService.performInference(
        selectedImage,
        selectedModel.path,
        combinedConfig
      );
      
      // Verificar si hay errores de overflow/underflow
      if (!response.success && response.error_type === 'numerical_overflow_underflow') {
        // Mostrar información detallada del error
        const errorDetails = response.error_details;
        const errorMessage = `
🔥 Error Numérico Detectado - Overflow/Underflow

📊 Detalles del Error:
• Overflow detectado: ${errorDetails.error_details.overflow_detected ? 'Sí' : 'No'}
• Underflow detectado: ${errorDetails.error_details.underflow_detected ? 'Sí' : 'No'}  
• NaN detectado: ${errorDetails.error_details.nan_detected ? 'Sí' : 'No'}
• Valores overflow: ${errorDetails.error_details.overflow_count}
• Valores underflow: ${errorDetails.error_details.underflow_count}
• Valores NaN: ${errorDetails.error_details.nan_count}

⚡ Causa: ${errorDetails.error_details.description}

🎯 Predicción Intentada:
• Clase predicha: ${errorDetails.attempted_prediction.predicted_class}
• Confianza: ${errorDetails.attempted_prediction.confidence}
• Probabilidades con errores: ${errorDetails.attempted_prediction.probabilities_with_errors}

💡 Los fallos inyectados han causado valores numéricos fuera del rango IEEE 754, 
   lo que impide la serialización JSON de los resultados.
        `.trim();
        
        setError(errorMessage);
        // Aún así, guardar la respuesta para mostrar información disponible
        setFaultResults(response);
      } else {
        setFaultResults(response);
      }
    } catch (error) {
      console.error('Error en la inferencia con fallos:', error);
      setError(error.message || 'Error al realizar la inferencia con fallos');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fault-injector-page">
      <Header />
      
      <div className="fault-injector-container">
        <div className="page-header">
          <h1 className="page-title">
            <span className="title-icon">⚡</span>
            Fault Injector
          </h1>
          <p className="page-subtitle">
            Herramienta para inyección de fallos en redes neuronales convolucionales
          </p>
        </div>
        
        <div className="fault-injector-content">
          <div className="fault-injector-tabs">
            <div className="tab-buttons">
              <button 
                className={`tab-button ${activeTab === 'inference' ? 'active' : ''}`}
                onClick={() => setActiveTab('inference')}
              >
                <span className="tab-icon">🚀</span>
                Inferencia Golden
              </button>
              <button 
                className={`tab-button ${activeTab === 'fault-injection' ? 'active' : ''}`}
                onClick={() => setActiveTab('fault-injection')}
              >
                <span className="tab-icon">⚡</span>
                Inyección de Fallos
              </button>
              <button 
                className={`tab-button ${activeTab === 'analysis' ? 'active' : ''}`}
                onClick={() => setActiveTab('analysis')}
              >
                <span className="tab-icon">📊</span>
                Análisis de Resultados
              </button>
              <button 
                className={`tab-button ${activeTab === 'comparison' ? 'active' : ''}`}
                onClick={() => setActiveTab('comparison')}
              >
                <span className="tab-icon">⚖️</span>
                Comparación
              </button>
            </div>
            
            <div className="tab-content">
              {activeTab === 'inference' && (
                <div className="tab-panel">
                  <h3 className="panel-title">Inferencia Golden</h3>
                  <p className="panel-description">
                    Realiza inferencias de referencia sin inyección de fallos para establecer resultados base.
                  </p>
                  
                  {/* Selección de Modelo */}
                  <div className="section">
                    <h4 className="section-title">Seleccionar Arquitectura</h4>
                    <div className="section-content">
                      <ModelSelector 
                        selectedModel={selectedModel} 
                        onSelectModel={handleSelectModel} 
                      />
                    </div>
                  </div>

                  {/* Carga de Imagen */}
                  <div className="section">
                    <h4 className="section-title">Subir Imagen para Inferencia</h4>
                    <div className="section-content">
                      <div className="image-upload-container">
                        <div className="upload-area">
                          <input
                            type="file"
                            id="image-upload"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="file-input"
                          />
                          <label htmlFor="image-upload" className="upload-label">
                            <div className="upload-icon">📁</div>
                            <div className="upload-text">
                              {selectedImage ? selectedImage.name : 'Seleccionar imagen'}
                            </div>
                            <div className="upload-hint">
                              Formatos soportados: JPG, PNG, BMP
                            </div>
                          </label>
                        </div>
                        
                        {imagePreview && (
                          <div className="image-preview">
                            <h5>Vista previa:</h5>
                            <img src={imagePreview} alt="Preview" className="preview-image" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Botón de Inferencia */}
                  <div className="section">
                    <div className="section-content">
                      <button 
                        className="inference-button"
                        onClick={handleInference}
                        disabled={!selectedModel || !selectedImage || isLoading}
                      >
                        {isLoading ? (
                          <>
                            <span className="loading-spinner"></span>
                            Procesando...
                          </>
                        ) : (
                          <>
                            <span className="button-icon">🚀</span>
                            Ejecutar Inferencia Golden
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Resultados */}
                  <div className="section">
                    <h4 className="section-title">Resultados Golden</h4>
                    <div className="section-content">
                      {error && (
                        <div className="error-message">
                          <div className="error-icon">⚠️</div>
                          <p style={{
                            color: error.includes('🔥 Error Numérico Detectado') ? '#ffffff' : undefined,
                            textShadow: error.includes('🔥 Error Numérico Detectado') ? '1px 1px 2px rgba(0, 0, 0, 0.5)' : undefined,
                            whiteSpace: 'pre-line'
                          }}>{error}</p>
                        </div>
                      )}
                      
                      {results ? (
                        <div className="results-container">
                          <div className="result-card">
                            <h5>Predicción</h5>
                            <div className="prediction-result">
                              <div className="predicted-class">
                                <span className="label">Clase predicha:</span>
                                <span className="value">{results.predicted_class}</span>
                              </div>
                              <div className="confidence">
                                <span className="label">Confianza:</span>
                                <span className="value">{(results.confidence * 100).toFixed(2)}%</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="result-card">
                            <h5>Información del Modelo</h5>
                            <div className="model-info">
                              <div className="info-item">
                                <span className="label">Modelo usado:</span>
                                <span className="value">{results.model_used}</span>
                              </div>
                              <div className="info-item">
                                <span className="label">Forma de imagen:</span>
                                <span className="value">{results.image_shape?.join(' × ')}</span>
                              </div>
                            </div>
                          </div>
                          
                          {results.all_probabilities && (
                            <div className="result-card">
                              <h5>Todas las Probabilidades</h5>
                              <div className="probabilities-list">
                                {results.all_probabilities.map((prob, index) => (
                                  <div key={index} className="probability-item">
                                    <span className="class-index">Clase {index}:</span>
                                    <div className="probability-bar">
                                      <div 
                                        className="probability-fill" 
                                        style={{ width: `${prob * 100}%` }}
                                      ></div>
                                      <span className="probability-value">{(prob * 100).toFixed(2)}%</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {results.layer_outputs && (
                            <div className="result-card">
                              <h5>Salidas de Capas</h5>
                              <div className="layer-outputs-container">
                                {Object.entries(results.layer_outputs).map(([layerName, shape]) => (
                                  <div key={layerName} className="layer-output-item">
                                    <div className="layer-header">
                                      <span className="layer-name">{layerName}</span>
                                      <span className="layer-shape">Forma: {Array.isArray(shape) ? shape.join(' × ') : shape}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {results.excel_files && results.excel_files.length > 0 && (
                            <div className="result-card">
                              <h5>Archivos Excel de Capas</h5>
                              <div className="excel-files-container">
                                {results.excel_files.map((filePath, index) => (
                                  <div key={index} className="excel-file-item">
                                    <span className="file-name">{filePath.split('/').pop()}</span>
                                    <button 
                                      className="download-button"
                                      onClick={() => window.open(`${API_BASE_URL}/download_file/?file_path=${encodeURIComponent(filePath)}&t=${results.session_id}`, '_blank')}
                                    >
                                      📥 Descargar
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {results.image_files && results.image_files.length > 0 && (
                            <div className="result-card">
                              <h5>Imágenes de Mapas de Características</h5>
                              <div className="image-files-container">
                                {results.image_files.map((imagePath, index) => (
                                  <div key={index} className="image-file-item">
                                    <div className="image-preview-small">
                                      <img 
                                        src={`${API_BASE_URL}/download_file/?file_path=${encodeURIComponent(imagePath)}&t=${results.session_id}`}
                                        alt={`Mapa de características ${index + 1}`}
                                        className="feature-map-image"
                                      />
                                    </div>
                                    <div className="image-info">
                                      <span className="image-name">{imagePath.split('/').pop()}</span>
                                      <button 
                                        className="download-button"
                                        onClick={() => window.open(`${API_BASE_URL}/download_file/?file_path=${encodeURIComponent(imagePath)}&t=${results.session_id}`, '_blank')}
                                      >
                                        📥 Descargar
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="results-placeholder">
                          <div className="placeholder-icon">📊</div>
                          <p>Los resultados de la inferencia golden aparecerán aquí</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'fault-injection' && (
                <div className="tab-panel">
                  <h3 className="panel-title">Inyección de Fallos</h3>
                  <p className="panel-description">
                    Configura y ejecuta inyección de fallos en diferentes capas de la red neuronal.
                  </p>
                  
                  {/* Selección de Modelo */}
                  <div className="section">
                    <h4 className="section-title">Seleccionar Arquitectura</h4>
                    <div className="section-content">
                      <ModelSelector 
                        selectedModel={selectedModel} 
                        onSelectModel={handleSelectModel} 
                      />
                    </div>
                  </div>

                  {/* Carga de Imagen */}
                  <div className="section">
                    <h4 className="section-title">Subir Imagen para Inferencia</h4>
                    <div className="section-content">
                      <div className="image-upload-container">
                        <div className="upload-area">
                          <input
                            type="file"
                            id="fault-image-upload"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="file-input"
                          />
                          <label htmlFor="fault-image-upload" className="upload-label">
                            <div className="upload-icon">📁</div>
                            <div className="upload-text">
                              {selectedImage ? selectedImage.name : 'Seleccionar imagen'}
                            </div>
                            <div className="upload-hint">
                              Formatos soportados: JPG, PNG, BMP
                            </div>
                          </label>
                        </div>
                        
                        {imagePreview && (
                          <div className="image-preview">
                            <h5>Vista previa:</h5>
                            <img src={imagePreview} alt="Preview" className="preview-image" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Configuración de Inyección de Fallos en Activaciones */}
                  <div className="section">
                    <h4 className="section-title">Configuración de Inyección de Fallos en Activaciones</h4>
                    <div className="section-content">
                      <FaultInjectionConfig
                        selectedModel={selectedModel}
                        onConfigChange={handleFaultConfigChange}
                        initialConfig={faultConfig}
                      />
                    </div>
                  </div>

                  {/* Configuración de Inyección de Fallos en Pesos */}
                  <div className="section">
                    <div className="section-content">
                      <WeightFaultConfig
                        selectedModel={selectedModel}
                        onConfigChange={handleWeightFaultConfigChange}
                        initialConfig={weightFaultConfig}
                      />
                    </div>
                  </div>

                  {/* Botón de Inferencia con Fallos */}
                  <div className="section">
                    <div className="section-content">
                      <button
                        className="inference-button fault-injection-button"
                        onClick={handleFaultInjectionInference}
                        disabled={(() => {
                          const hasModel = !!selectedModel;
                          const hasImage = !!selectedImage;
                          const hasActivationFaults = !!faultConfig?.enabled;
                          const hasWeightFaults = !!weightFaultConfig?.enabled;
                          const hasFaults = hasActivationFaults || hasWeightFaults;
                          const isDisabled = !hasModel || !hasImage || !hasFaults || isLoading;
                          
                          console.log('Button state:', {
                            hasModel,
                            hasImage,
                            hasActivationFaults,
                            hasWeightFaults,
                            hasFaults,
                            isLoading,
                            isDisabled
                          });
                          
                          return isDisabled;
                        })()}
                      >
                        {isLoading ? (
                          <>
                            <span className="loading-spinner"></span>
                            Procesando...
                          </>
                        ) : (
                          <>
                            <span className="button-icon">⚡</span>
                            Ejecutar Inferencia con Fallos
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Resultados de Inyección de Fallos */}
                  <div className="section">
                    <h4 className="section-title">Resultados con Inyección de Fallos</h4>
                    <div className="section-content">
                      {error && (
                        <div className="error-message">
                          <div className="error-icon">⚠️</div>
                          <p style={{
                            color: error.includes('🔥 Error Numérico Detectado') ? 'rgb(255,255,255)' : undefined,
                            textShadow: error.includes('🔥 Error Numérico Detectado') ? '1px 1px 2px rgba(0, 0, 0, 0.5)' : undefined,
                            whiteSpace: 'pre-line'
                          }}>{error}</p>
                        </div>
                      )}
                      
                      {faultResults ? (
                        <div className="results-container">
                          {/* Mostrar información de error si existe */}
                          {!faultResults.success && faultResults.error_type === 'numerical_overflow_underflow' && (
                            <div className="result-card error-card">
                              <h5>🔥 Error Numérico Detectado</h5>
                              <div className="error-details">
                                <div className="error-summary">
                                  <p><strong>Tipo:</strong> Overflow/Underflow IEEE 754</p>
                                  <p><strong>Causa:</strong> Los fallos inyectados han producido valores numéricos extremos</p>
                                </div>
                                
                                <div className="error-metrics">
                                  <div className="metric-item">
                                    <span className="metric-label">Overflow:</span>
                                    <span className="metric-value">
                                      {faultResults.error_details?.error_details?.overflow_detected ? 
                                        `Sí (${faultResults.error_details.error_details.overflow_count} valores)` : 'No'}
                                    </span>
                                  </div>
                                  <div className="metric-item">
                                    <span className="metric-label">Underflow:</span>
                                    <span className="metric-value">
                                      {faultResults.error_details?.error_details?.underflow_detected ? 
                                        `Sí (${faultResults.error_details.error_details.underflow_count} valores)` : 'No'}
                                    </span>
                                  </div>
                                  <div className="metric-item">
                                    <span className="metric-label">NaN:</span>
                                    <span className="metric-value">
                                      {faultResults.error_details?.error_details?.nan_detected ? 
                                        `Sí (${faultResults.error_details.error_details.nan_count} valores)` : 'No'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="result-card">
                            <h5>{faultResults.success ? 'Predicción con Fallos' : 'Predicción Intentada (con errores)'}</h5>
                            <div className="prediction-result">
                              <div className="predicted-class">
                                <span className="label">Clase predicha:</span>
                                <span className="value">
                                  {faultResults.predicted_class !== undefined ? faultResults.predicted_class : 'Error'}
                                </span>
                              </div>
                              <div className="confidence">
                                <span className="label">Confianza:</span>
                                <span className="value">
                                  {faultResults.confidence !== undefined ? 
                                    `${(faultResults.confidence * 100).toFixed(2)}%` : 'Error'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {faultResults.fault_injection && (
                            <div className="result-card">
                              <h5>Información de Inyección de Fallos</h5>
                              <div className="fault-info">
                                <div className="info-item">
                                  <span className="label">Fallos aplicados:</span>
                                  <span className="value">{faultResults.fault_injection.total_faults || 0}</span>
                                </div>
                                <div className="info-item">
                                  <span className="label">Fallos en activaciones:</span>
                                  <span className="value">{faultResults.fault_injection.activation_faults?.total_faults || 0}</span>
                                </div>
                                <div className="info-item">
                                  <span className="label">Fallos en pesos:</span>
                                  <span className="value">{faultResults.fault_injection.weight_faults?.total_faults || 0}</span>
                                </div>
                                <div className="info-item">
                                  <span className="label">Capas afectadas (activaciones):</span>
                                  <span className="value">
                                    {Object.keys(faultResults.fault_injection.activation_faults?.faults_by_layer || {}).length}
                                  </span>
                                </div>
                                <div className="info-item">
                                  <span className="label">Capas afectadas (pesos):</span>
                                  <span className="value">
                                    {Object.keys(faultResults.fault_injection.weight_faults?.faults_by_layer || {}).length}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {faultResults.all_probabilities && (
                            <div className="result-card">
                              <h5>Probabilidades con Fallos</h5>
                              <div className="probabilities-list">
                                {faultResults.all_probabilities.map((prob, index) => (
                                  <div key={index} className="probability-item">
                                    <span className="class-index">Clase {index}:</span>
                                    <div className="probability-bar">
                                      <div 
                                        className="probability-fill" 
                                        style={{ width: `${prob * 100}%` }}
                                      ></div>
                                      <span className="probability-value">{(prob * 100).toFixed(2)}%</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="results-placeholder">
                          <div className="placeholder-icon">⚡</div>
                          <p>Los resultados de la inferencia con fallos aparecerán aquí</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'analysis' && (
                <div className="tab-panel">
                  <h3 className="panel-title">Análisis de Resultados</h3>
                  <p className="panel-description">
                    Analiza el impacto de los fallos inyectados en el rendimiento del modelo.
                  </p>
                  <div className="coming-soon">
                    <div className="coming-soon-icon">🚧</div>
                    <h4>Próximamente</h4>
                    <p>Esta funcionalidad estará disponible en una próxima actualización.</p>
                  </div>
                </div>
              )}
              
              {activeTab === 'comparison' && (
                <div className="tab-panel">
                  <h3 className="panel-title">Comparación de Resultados</h3>
                  <p className="panel-description">
                    Compara los resultados entre inferencias golden y con fallos inyectados.
                  </p>
                  <div className="coming-soon">
                    <div className="coming-soon-icon">🚧</div>
                    <h4>Próximamente</h4>
                    <p>Esta funcionalidad estará disponible en una próxima actualización.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaultInjector;