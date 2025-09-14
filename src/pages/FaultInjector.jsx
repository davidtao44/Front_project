import { useState } from 'react';
import Header from '../components/Header';
import ModelSelector from '../components/cnn/ModelSelector';
import { faultInjectorService } from '../services/api';
import './FaultInjector.css';

const FaultInjector = () => {
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

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

  return (
    <div className="fault-injector-page">
      <Header />
      
      <div className="fault-injector-container">
        <div className="page-header">
          <h1 className="page-title">
            <span className="title-icon">⚡</span>
            FaultInjector
          </h1>
          <p className="page-subtitle">
            Herramienta para inyección de fallos en redes neuronales convolucionales
          </p>
        </div>
        
        <div className="fault-injector-content">
          {/* Selección de Modelo */}
          <div className="section">
            <h2 className="section-title">Seleccionar Arquitectura</h2>
            <div className="section-content">
              <ModelSelector 
                selectedModel={selectedModel} 
                onSelectModel={handleSelectModel} 
              />
            </div>
          </div>

          {/* Carga de Imagen */}
          <div className="section">
            <h2 className="section-title">Subir Imagen para Inferencia</h2>
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
                    <h3>Vista previa:</h3>
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
                    Ejecutar Inferencia
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Resultados */}
          <div className="section">
            <h2 className="section-title">Resultados</h2>
            <div className="section-content">
              {error && (
                <div className="error-message">
                  <div className="error-icon">⚠️</div>
                  <p>{error}</p>
                </div>
              )}
              
              {results ? (
                <div className="results-container">
                  <div className="result-card">
                    <h3>Predicción</h3>
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
                    <h3>Información del Modelo</h3>
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
                      <h3>Todas las Probabilidades</h3>
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
                </div>
              ) : (
                <div className="results-placeholder">
                  <div className="placeholder-icon">📊</div>
                  <p>Los resultados de la inferencia aparecerán aquí</p>
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