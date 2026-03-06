import { useState } from 'react';
import { 
  Zap, 
  Rocket, 
  RefreshCw, 
  Scale, 
  UploadCloud, 
  AlertTriangle 
} from 'lucide-react';
import Header from '../components/Header';
import ModelSelector from '../components/cnn/ModelSelector';
import WeightFaultConfig from '../components/WeightFaultConfig';
import MetricsChart from '../components/MetricsChart';
import FaultMetricsComparison from '../components/FaultMetricsComparison';
import { faultInjectorService, faultCampaignService } from '../services/api';
import { API_BASE_URL } from '../config/api';
import './FaultInjector.css';
import '../components/MetricsChart.css';

const FaultInjector = () => {
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('inference');
  const [weightFaultConfig, setWeightFaultConfig] = useState({ enabled: false, layers: {} });
  const [faultResults, setFaultResults] = useState(null);
  
  // Estados para campaña de fallos
  const [availableModels, setAvailableModels] = useState([]);
  const [campaignType, setCampaignType] = useState('weight');
  const [numSamples, setNumSamples] = useState(100);
  const [imageDir, setImageDir] = useState('/home/davidgonzalez/Documentos/project/Back_project/images/mnist');
  const [campaignResults, setCampaignResults] = useState(null);
  const [isCampaignLoading, setIsCampaignLoading] = useState(false);
  const [campaignError, setCampaignError] = useState(null);

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

  const handleWeightFaultConfigChange = (config) => {
    setWeightFaultConfig(config);
  };

  const handleFaultInjectionInference = async () => {
    if (!selectedModel || !selectedImage) {
      setError('Por favor selecciona un modelo y una imagen');
      return;
    }

    // Verificar que la configuración de fallos de pesos esté habilitada
    const hasWeightFaults = weightFaultConfig?.enabled && Object.keys(weightFaultConfig.layers).length > 0;
    
    if (!hasWeightFaults) {
      setError('Por favor configura la inyección de fallos de pesos antes de ejecutar');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setFaultResults(null);
    
    try {
      // Configuración de fallos de pesos
      const combinedConfig = {
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

  // Funciones para campaña de fallos
  const loadAvailableModels = async () => {
    try {
      const models = await faultCampaignService.getAvailableModels();
      setAvailableModels(models);
    } catch (error) {
      console.error('Error cargando modelos:', error);
      setCampaignError('Error al cargar los modelos disponibles');
    }
  };

  const runFaultCampaign = async () => {
    if (!selectedModel) {
      setCampaignError('Por favor selecciona un modelo');
      return;
    }

    // Si no hay configuración específica, usar configuración por defecto
    const configToUse = weightFaultConfig.enabled ? weightFaultConfig : {
      enabled: true,
      layers: {},
      faultType: 'stuck_at',
      faultValue: 0,
      faultProbability: 0.1
    };

    setIsCampaignLoading(true);
    setCampaignError(null);
    setCampaignResults(null);

    try {
      const response = await faultCampaignService.runWeightFaultCampaign({
        model_path: selectedModel.path,
        num_samples: numSamples,
        weight_fault_config: configToUse,
        image_dir: imageDir
      });
      setCampaignResults(response);
    } catch (error) {
      console.error('Error en la campaña de fallos:', error);
      setCampaignError(error.message || 'Error al ejecutar la campaña de fallos');
    } finally {
      setIsCampaignLoading(false);
    }
  };

  const formatMetrics = (metrics) => {
    if (!metrics) return 'N/A';
    return Object.entries(metrics)
      .map(([key, value]) => `${key}: ${typeof value === 'number' ? value.toFixed(4) : value}`)
      .join(', ');
  };

  const renderDetailedMetrics = (metrics, title) => {
    console.log(`🔍 DEBUG renderDetailedMetrics: Rendering metrics for ${title}:`, metrics); // Debug log
    console.log(`🔍 DEBUG renderDetailedMetrics: Type of metrics:`, typeof metrics); // Debug log
    console.log(`🔍 DEBUG renderDetailedMetrics: JSON.stringify metrics:`, JSON.stringify(metrics, null, 2)); // Debug log
    
    if (!metrics) {
      return (
        <div className="result-card">
          <h5>{title}</h5>
          <p>No hay métricas disponibles (metrics is null/undefined)</p>
        </div>
      );
    }

    // Si metrics es un objeto que contiene las métricas en una propiedad anidada
    let actualMetrics = metrics;
    if (metrics && typeof metrics === 'object') {
      // Buscar las métricas en diferentes posibles ubicaciones
      if (metrics.metrics && typeof metrics.metrics === 'object') {
        actualMetrics = metrics.metrics;
        console.log(`Using metrics.metrics:`, actualMetrics);
      } else if (metrics.evaluation_metrics && typeof metrics.evaluation_metrics === 'object') {
        actualMetrics = metrics.evaluation_metrics;
        console.log(`Using metrics.evaluation_metrics:`, actualMetrics);
      } else if (metrics.results && typeof metrics.results === 'object') {
        actualMetrics = metrics.results;
        console.log(`Using metrics.results:`, actualMetrics);
      } else {
        // Si no hay estructura anidada, usar el objeto directamente
        actualMetrics = metrics;
        console.log(`Using metrics directly:`, actualMetrics);
      }
    }

    console.log(`Final actualMetrics for ${title}:`, actualMetrics); // Debug log
    console.log(`actualMetrics keys:`, Object.keys(actualMetrics || {})); // Debug log

    // Verificar si actualMetrics es válido
    if (!actualMetrics || typeof actualMetrics !== 'object') {
      return (
        <div className="result-card">
          <h5>{title}</h5>
          <p>No hay métricas válidas disponibles (invalid structure)</p>
          <pre style={{fontSize: '10px', color: '#666'}}>
            Debug: {JSON.stringify(metrics, null, 2)}
          </pre>
        </div>
      );
    }

    const metricLabels = {
      accuracy: 'Exactitud (Accuracy)',
      precision: 'Precisión (Precision)',
      recall: 'Sensibilidad (Recall)',
      specificity: 'Especificidad',
      auc: 'AUC',
      loss: 'Pérdida',
      top_1_accuracy: 'Top-1 Accuracy',
      top_5_accuracy: 'Top-5 Accuracy',
      correct_predictions: 'Predicciones Correctas',
      macro_avg_precision: 'Precisión Macro Avg',
      macro_avg_recall: 'Recall Macro Avg'
    };

    // Extraer métricas de macro average del classification_report si existe
    let macroAvgMetrics = {};
    if (actualMetrics.classification_report && typeof actualMetrics.classification_report === 'object') {
      const classReport = actualMetrics.classification_report;
      if (classReport['macro avg']) {
        macroAvgMetrics = {
          macro_avg_precision: classReport['macro avg']['precision'],
          macro_avg_recall: classReport['macro avg']['recall']
        };
      }
    }

    // Definir el orden de prioridad para las métricas principales (sin F1-score)
    const priorityMetrics = ['accuracy', 'precision', 'recall'];
    const macroMetrics = ['macro_avg_precision', 'macro_avg_recall'];
    const countMetrics = ['correct_predictions'];
    
    // Filtrar y organizar métricas (excluyendo num_samples e incorrect_predictions)
    const allMetrics = Object.entries(actualMetrics).filter(([key, value]) => {
      return !['confusion_matrix', 'classification_report', 'num_samples', 'incorrect_predictions'].includes(key) && 
             typeof value !== 'object';
    });

    // Agregar métricas de macro average
    const allMetricsWithMacro = [...allMetrics, ...Object.entries(macroAvgMetrics)];

    console.log(`All metrics found for ${title}:`, allMetricsWithMacro); // Debug log

    // Si no hay métricas válidas, mostrar mensaje de debug
    if (allMetricsWithMacro.length === 0) {
      return (
        <div className="result-card">
          <h5>{title}</h5>
          <p>No se encontraron métricas válidas</p>
          <div style={{fontSize: '12px', color: '#666', marginTop: '10px'}}>
            <strong>Claves disponibles:</strong> {Object.keys(actualMetrics).join(', ')}
          </div>
          <pre style={{fontSize: '10px', color: '#666', marginTop: '10px'}}>
            {JSON.stringify(actualMetrics, null, 2)}
          </pre>
        </div>
      );
    }

    // Separar métricas por categorías
    const mainMetrics = allMetricsWithMacro.filter(([key]) => priorityMetrics.includes(key));
    const macroAvgMetrics_filtered = allMetricsWithMacro.filter(([key]) => macroMetrics.includes(key));
    const countingMetrics = allMetricsWithMacro.filter(([key]) => countMetrics.includes(key));
    const otherMetrics = allMetricsWithMacro.filter(([key]) => 
      !priorityMetrics.includes(key) && !macroMetrics.includes(key) && !countMetrics.includes(key)
    );

    console.log(`Main metrics for ${title}:`, mainMetrics); // Debug log
    console.log(`Macro avg metrics for ${title}:`, macroAvgMetrics_filtered); // Debug log
    console.log(`Counting metrics for ${title}:`, countingMetrics); // Debug log
    console.log(`Other metrics for ${title}:`, otherMetrics); // Debug log

    const formatValue = (key, value) => {
      if (typeof value === 'number') {
        if (key === 'loss') {
          return value.toFixed(6);
        } else if (['accuracy', 'precision', 'recall', 'specificity', 'auc', 'top_1_accuracy', 'top_5_accuracy', 'macro_avg_precision', 'macro_avg_recall'].includes(key)) {
          return (value * 100).toFixed(2) + '%';
        } else {
          return value.toString();
        }
      }
      return value?.toString() || 'N/A';
    };

    const renderMetricSection = (metricsArray, sectionTitle) => {
      if (metricsArray.length === 0) return null;
      
      return (
        <div className="metric-section">
          {sectionTitle && <h6 className="metric-section-title">{sectionTitle}</h6>}
          <div className="metrics-grid">
            {metricsArray.map(([key, value]) => (
              <div key={key} className="metric-item">
                <span className="metric-label">
                  {metricLabels[key] || key.charAt(0).toUpperCase() + key.slice(1)}:
                </span>
                <span className="metric-value">
                  {formatValue(key, value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div className="result-card">
        <h5>{title}</h5>
        
        {/* Métricas principales de rendimiento */}
        {renderMetricSection(mainMetrics, "Métricas de Rendimiento")}
        
        {/* Métricas de Macro Average */}
        {renderMetricSection(macroAvgMetrics_filtered, "Métricas Macro Average")}
        
        {/* Métricas de conteo */}
        {renderMetricSection(countingMetrics, "Estadísticas de Predicción")}
        
        {/* Otras métricas */}
        {renderMetricSection(otherMetrics, otherMetrics.length > 0 ? "Otras Métricas" : null)}
        
        {/* Mostrar matriz de confusión si existe */}
        {actualMetrics.confusion_matrix && Array.isArray(actualMetrics.confusion_matrix) && (
          <div className="confusion-matrix-section">
            <h6>Matriz de Confusión</h6>
            <div className="confusion-matrix-container">
              <div className="confusion-matrix-with-labels">
                {/* Encabezado con etiquetas de columnas */}
                <div className="confusion-matrix-header">
                  <div className="confusion-corner-cell"></div>
                  {actualMetrics.confusion_matrix[0] && Array.from({length: actualMetrics.confusion_matrix[0].length}, (_, j) => (
                    <div key={j} className="confusion-column-label">{j}</div>
                  ))}
                </div>
                
                {/* Filas de la matriz con etiquetas de fila */}
                {actualMetrics.confusion_matrix.map((row, i) => (
                  <div key={i} className="confusion-row-with-label">
                    <div className="confusion-row-label">{i}</div>
                    <div className="confusion-row">
                      {Array.isArray(row) && row.map((cell, j) => (
                        <span key={j} className="confusion-cell">{cell}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="confusion-matrix-info">
                <p>Filas: Clases reales | Columnas: Clases predichas</p>
                <p>Dimensión: {actualMetrics.confusion_matrix.length}x{actualMetrics.confusion_matrix[0]?.length || 0}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Mostrar reporte de clasificación si existe */}
        {actualMetrics.classification_report && typeof actualMetrics.classification_report === 'string' && (
          <div className="classification-report-section">
            <h6>Reporte de Clasificación</h6>
            <pre className="classification-report">
              {actualMetrics.classification_report}
            </pre>
          </div>
        )}
      </div>
    );
  };

  const calculateMetricComparison = (goldenMetrics, faultMetrics) => {
    if (!goldenMetrics || !faultMetrics) return null;

    const comparisons = {};
    // Exclude num_samples and incorrect_predictions from comparison
    const excludedKeys = ['num_samples', 'incorrect_predictions'];
    
    Object.keys(goldenMetrics).forEach(key => {
      if (!excludedKeys.includes(key) && typeof goldenMetrics[key] === 'number' && typeof faultMetrics[key] === 'number') {
        const degradation = goldenMetrics[key] - faultMetrics[key];
        const degradationPercent = (degradation / goldenMetrics[key]) * 100;
        comparisons[key] = {
          golden: goldenMetrics[key],
          fault: faultMetrics[key],
          degradation: degradation,
          degradationPercent: degradationPercent
        };
      }
    });
    return comparisons;
  };

  return (
    <div className="fault-injector-page">
      <Header />
      
      <div className="fault-injector-container">
        <div className="page-header">
          <div className="header-content">
            <div className="header-text">
              <h1 className="page-title">
                <span className="title-icon"><Zap size={32} /></span>
                Reliability Assessment Module
              </h1>
              <p className="page-subtitle">
                Herramienta para inyección de fallos en CNNs: LeNet-5
              </p>
              <div className="architecture-info">
                <span className="architecture-badge">🎯 Optimizado para LeNet-5</span>
                <p className="architecture-description">
                  Esta herramienta está específicamente diseñada y optimizada para trabajar con la arquitectura LeNet-5
                </p>
              </div>
            </div>
            <div className="header-image">
              <img 
                src="/LeNet-5.png" 
                alt="Arquitectura LeNet-5" 
                className="lenet-architecture-image"
              />
              <p className="image-caption">Arquitectura LeNet-5</p>
            </div>
          </div>
        </div>
        
        <div className="fault-injector-content">
          <div className="fault-injector-tabs">
            <div className="tab-buttons">
              <button 
                className={`tab-button ${activeTab === 'inference' ? 'active' : ''}`}
                onClick={() => setActiveTab('inference')}
              >
                <span className="tab-icon"><Rocket size={18} /></span>
                Inferencia Golden
              </button>
              <button 
                className={`tab-button ${activeTab === 'fault-injection' ? 'active' : ''}`}
                onClick={() => setActiveTab('fault-injection')}
              >
                <span className="tab-icon"><Zap size={18} /></span>
                Inyección de Fallos
              </button>
              <button 
                className={`tab-button ${activeTab === 'analysis' ? 'active' : ''}`}
                onClick={() => setActiveTab('analysis')}
              >
                <span className="tab-icon"><RefreshCw size={18} /></span>
                Campaña de fallos 
              </button>
              <button 
                className={`tab-button ${activeTab === 'comparison' ? 'active' : ''}`}
                onClick={() => setActiveTab('comparison')}
              >
                <span className="tab-icon"><Scale size={18} /></span>
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
                            <div className="upload-icon"><UploadCloud size={24} /></div>
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
                            <span className="button-icon"><Rocket size={18} /></span>
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
                          <div className="error-icon"><AlertTriangle size={24} /></div>
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
                              {/* <div className="info-item">
                                <span className="label">Forma de imagen:</span>
                                <span className="value">{results.image_shape?.join(' × ')}</span>
                              </div> */}
                            </div>
                          </div>
                          
                          {/* {results.all_probabilities && (
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
                          )} */}
                          
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
                          const hasWeightFaults = !!weightFaultConfig?.enabled;
                          const isDisabled = !hasModel || !hasImage || !hasWeightFaults || isLoading;
                          
                          console.log('Button state:', {
                            hasModel,
                            hasImage,
                            hasWeightFaults,
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
                                  <span className="label">Fallos en pesos:</span>
                                  <span className="value">{faultResults.fault_injection.weight_faults?.total_faults || 0}</span>
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
                          
                          {/* {faultResults.all_probabilities && (
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
                          )} */}
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
                  <h3 className="panel-title">Campaña de Inyección de Fallos</h3>
                  <p className="panel-description">
                    Ejecuta campañas de inyección de fallos para analizar el impacto en múltiples muestras.
                  </p>
                  
                  <div className="campaign-config">
                    <div className="config-section">
                      <h4>Configuración de Campaña</h4>
                      
                      {/* Selección de Modelo */}
                      <div className="input-group">
                        <label>Seleccionar Modelo:</label>
                        <ModelSelector 
                          selectedModel={selectedModel} 
                          onSelectModel={handleSelectModel} 
                        />
                      </div>
                      
                      <div className="input-group">
                        <label>Tipo de Campaña:</label>
                        <select 
                          value={campaignType} 
                          onChange={(e) => setCampaignType(e.target.value)}
                          className="campaign-select"
                        >
                          <option value="weight">Fallos de Pesos</option>
                        </select>
                      </div>
                      
                      <div className="input-group">
                        <label>Número de Muestras:</label>
                        <input
                          type="number"
                          value={numSamples}
                          onChange={(e) => setNumSamples(parseInt(e.target.value))}
                          min="1"
                          max="1000"
                          className="campaign-input"
                        />
                      </div>
                      
                      {/* Configuración específica según el tipo de campaña */}
                      {campaignType === 'weight' && (
                        <div className="fault-config-section">
                          <h5>Configuración de Fallos de Pesos</h5>
                          <WeightFaultConfig
                            selectedModel={selectedModel}
                            onConfigChange={setWeightFaultConfig}
                            initialConfig={weightFaultConfig}
                          />
                        </div>
                      )}

                      <button 
                        onClick={runFaultCampaign}
                        disabled={!selectedModel || isCampaignLoading}
                        className="run-campaign-btn"
                      >
                        {isCampaignLoading ? (
                          <>
                            <div className="loading-spinner"></div>
                            Ejecutando Campaña...
                          </>
                        ) : (
                          'Ejecutar Campaña'
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {campaignError && (
                    <div className="error-message">
                      <strong>Error:</strong> {campaignError}
                    </div>
                  )}
                  
                  {campaignResults && campaignResults.results && (
                    <div className="campaign-results">
                      <h4>Resultados de la Campaña</h4>
                      
                      {/* Información general de la campaña */}
                      <div className="campaign-info">
                        <div className="result-card">
                          <h5>Información de la Campaña</h5>
                          <div className="info-grid">
                            <div className="info-item">
                              <span className="info-label">Modelo:</span>
                              <span className="info-value">{campaignResults.results.campaign_info?.model_path || 'N/A'}</span>
                            </div>

                            <div className="info-item">
                              <span className="info-label">Tipo de campaña:</span>
                              <span className="info-value">Fallos de Pesos</span>
                            </div>
                            {campaignResults.results.campaign_info?.execution_time_seconds && (
                              <div className="info-item">
                                <span className="info-label">Duración:</span>
                                <span className="info-value">{campaignResults.results.campaign_info.execution_time_seconds.toFixed(2)}s</span>
                              </div>
                            )}
                            {campaignResults.results.campaign_info?.session_id && (
                              <div className="info-item">
                                <span className="info-label">ID de Sesión:</span>
                                <span className="info-value">{campaignResults.results.campaign_info.session_id}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Métricas detalladas */}
                      <div className="metrics-comparison">
                        <div className="metrics-row">
                          {(() => {
                            console.log(`🔍 DEBUG campaignResults.results:`, campaignResults.results);
                            console.log(`🔍 DEBUG golden_results:`, campaignResults.results.golden_results);
                            console.log(`🔍 DEBUG fault_results:`, campaignResults.results.fault_results);
                            console.log(`🔍 DEBUG golden_results?.metrics:`, campaignResults.results.golden_results?.metrics);
                            console.log(`🔍 DEBUG fault_results?.metrics:`, campaignResults.results.fault_results?.metrics);
                            return null;
                          })()}
                          {renderDetailedMetrics(campaignResults.results.golden_results?.metrics, "Métricas Golden (Sin Fallos)")}
                          {renderDetailedMetrics(campaignResults.results.fault_results?.metrics, "Métricas con Fallos")}
                        </div>
                      </div>
                      
                      {/* Análisis de comparación detallado */}
                      {(() => {
                        const comparisons = calculateMetricComparison(campaignResults.results.golden_results?.metrics, campaignResults.results.fault_results?.metrics);
                        if (!comparisons) return null;
                        
                        return (
                          <div className="detailed-comparison">
                            <h5>Análisis Detallado de Degradación</h5>
                            <div className="comparison-grid">
                              {Object.entries(comparisons).map(([metric, data]) => (
                                <div key={metric} className="comparison-item">
                                  <div className="comparison-header">
                                    <span className="metric-name">
                                      {metric === 'accuracy' ? 'Precisión (Accuracy)' : 
                                       metric === 'precision' ? 'Precisión (Precision)' :
                                       metric === 'recall' ? 'Sensibilidad (Recall)' :
                                       metric === 'f1_score' ? 'F1-Score' :
                                       metric === 'correct_predictions' ? 'Predicciones Correctas' :
                                       metric.charAt(0).toUpperCase() + metric.slice(1)}
                                    </span>
                                  </div>
                                  <div className="comparison-values">
                                    <div className="value-item golden">
                                      <span className="value-label">Golden:</span>
                                      <span className="value-number">
                                        {metric.includes('predictions') ? 
                                          data.golden : 
                                          (metric === 'loss' ? data.golden.toFixed(6) : (data.golden * 100).toFixed(2) + '%')
                                        }
                                      </span>
                                    </div>
                                    <div className="value-item fault">
                                      <span className="value-label">Con Fallos:</span>
                                      <span className="value-number">
                                        {metric.includes('predictions') ? 
                                          data.fault : 
                                          (metric === 'loss' ? data.fault.toFixed(6) : (data.fault * 100).toFixed(2) + '%')
                                        }
                                      </span>
                                    </div>
                                    <div className={`value-item degradation ${Math.abs(data.degradationPercent) > 10 ? 'high' : Math.abs(data.degradationPercent) > 5 ? 'medium' : 'low'}`}>
                                      <span className="value-label">Degradación:</span>
                                      <span className="value-number">
                                        {data.degradationPercent > 0 ? '+' : ''}{data.degradationPercent.toFixed(2)}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                      
                      {/* Gráficas de métricas */}
                      <MetricsChart 
                        goldenMetrics={campaignResults.results.golden_results?.metrics}
                        faultMetrics={campaignResults.results.fault_results?.metrics}
                        campaignResults={campaignResults.results}
                        numSamples={numSamples}
                      />
                      
                      {/* Información de comparación adicional */}
                      {/* {campaignResults.results.comparison && (
                        <div className="comparison-summary">
                          <h5>Resumen de Comparación</h5>
                          <div className="comparison-stats">
                            <div className="stat-item">
                              <span className="stat-label">Predicciones Iguales:</span>
                              <span className="stat-value">{campaignResults.results.comparison.same_predictions}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">Predicciones Diferentes:</span>
                              <span className="stat-value">{campaignResults.results.comparison.different_predictions}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">Porcentaje de Diferencia:</span>
                              <span className="stat-value">{campaignResults.results.comparison.percentage_different}%</span>
                            </div>
                          </div>
                        </div>
                      )} */}
                      
                      {/* Información del fallo inyectado */}
                      {campaignResults.results.campaign_info?.fault && (
                        <div className="fault-info">
                          <h5>Información del Fallo Inyectado</h5>
                          <div className="fault-details">
                            <div className="fault-item">
                              <span className="fault-label">Capa:</span>
                              <span className="fault-value">{campaignResults.results.campaign_info.fault.layer}</span>
                            </div>
                            <div className="fault-item">
                              <span className="fault-label">Tipo de Fallo:</span>
                              <span className="fault-value">{campaignResults.results.campaign_info.fault.type}</span>
                            </div>
                            <div className="fault-item">
                              <span className="fault-label">Posiciones Afectadas:</span>
                              <span className="fault-value">{campaignResults.results.campaign_info.fault.positions?.length || 0} posiciones</span>
                            </div>
                            <div className="fault-item">
                              <span className="fault-label">Bits Afectados:</span>
                              <span className="fault-value">{campaignResults.results.campaign_info.fault.bit_positions?.join(', ') || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'comparison' && (
                <div className="tab-panel">
                  <h3 className="panel-title">Comparación de Resultados</h3>
                  <p className="panel-description">
                    Compara los resultados entre inferencias golden y con fallos inyectados.
                  </p>
                  
                  {campaignResults ? (
                    <FaultMetricsComparison 
                      campaignResults={campaignResults.results}
                      numSamples={10}
                    />
                  ) : (
                    <div className="coming-soon">
                      <div className="coming-soon-icon">📊</div>
                      <h4>Datos de Comparación</h4>
                      <p>Ejecuta primero una campaña de inyección de fallos para ver la comparación de métricas entre inferencias golden y con fallos.</p>
                    </div>
                  )}
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