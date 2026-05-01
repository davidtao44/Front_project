import { useState, useEffect, useRef } from 'react';
import {
  Zap,
  Rocket,
  RefreshCw,
  Scale,
  UploadCloud,
  AlertTriangle,
  Database,
  Layers,
  Hash,
  Play
} from 'lucide-react';
import Header from '../components/Header';
import ModelSelector from '../components/cnn/ModelSelector';
import WeightFaultConfig from '../components/WeightFaultConfig';
import MetricsChart from '../components/MetricsChart';
import FaultMetricsComparison from '../components/FaultMetricsComparison';
import SAIResults from '../components/SAIResults';
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

  // States for fault campaign
  const [availableModels, setAvailableModels] = useState([]);
  const [campaignType, setCampaignType] = useState('weight');
  const [numSamples, setNumSamples] = useState(100);
  const [imageDir, setImageDir] = useState('/home/davidgonzalez/Documentos/project/Back_project/images/mnist');
  const [campaignResults, setCampaignResults] = useState(null);
  const [isCampaignLoading, setIsCampaignLoading] = useState(false);
  const [campaignError, setCampaignError] = useState(null);

  // Progress tracking
  const [campaignProgress, setCampaignProgress] = useState(0);
  const [campaignPhase, setCampaignPhase] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const progressTickRef = useRef(null);
  const elapsedTickRef = useRef(null);
  const startTimeRef = useRef(null);


  // Load models when component mounts
  useEffect(() => {
    loadAvailableModels();
  }, []);


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
      setError('Please select a model and an image');
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
      console.error('Inference error:', error);
      setError(error.message || 'Error performing inference');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWeightFaultConfigChange = (config) => {
    setWeightFaultConfig(config);
  };

  const handleFaultInjectionInference = async () => {
    if (!selectedModel || !selectedImage) {
      setError('Please select a model and an image');
      return;
    }

    // Verify that weight fault configuration is enabled
    const hasWeightFaults = weightFaultConfig?.enabled && Object.keys(weightFaultConfig.layers).length > 0;

    if (!hasWeightFaults) {
      setError('Please configure weight fault injection before running');
      return;
    }

    setIsLoading(true);
    setError(null);
    setFaultResults(null);

    try {
      // Weight faults configuration
      const combinedConfig = {
        weight_faults: weightFaultConfig
      };

      const response = await faultInjectorService.performInference(
        selectedImage,
        selectedModel.path,
        combinedConfig
      );

      // Verify if there are overflow/underflow errors
      if (!response.success && response.error_type === 'numerical_overflow_underflow') {
        // Show detailed error information
        const errorDetails = response.error_details;
        const errorMessage = `
🔥 Numerical Error Detected - Overflow/Underflow

📊 Error Details:
• Overflow detected: ${errorDetails.error_details.overflow_detected ? 'Yes' : 'No'}
• Underflow detected: ${errorDetails.error_details.underflow_detected ? 'Yes' : 'No'}  
• NaN detected: ${errorDetails.error_details.nan_detected ? 'Yes' : 'No'}
• Overflow values: ${errorDetails.error_details.overflow_count}
• Underflow values: ${errorDetails.error_details.underflow_count}
• NaN values: ${errorDetails.error_details.nan_count}

⚡ Cause: ${errorDetails.error_details.description}

🎯 Attempted Prediction:
• Predicted class: ${errorDetails.attempted_prediction.predicted_class}
• Confidence: ${errorDetails.attempted_prediction.confidence}
• Probabilities with errors: ${errorDetails.attempted_prediction.probabilities_with_errors}

💡 The injected faults have caused numerical values outside the IEEE 754 range, 
   which prevents JSON serialization of the results.
        `.trim();

        setError(errorMessage);
        // Still save the response to show available information
        setFaultResults(response);
      } else {
        setFaultResults(response);
      }
    } catch (error) {
      console.error('Error in inference with faults:', error);
      setError(error.message || 'Error performing inference with faults');
    } finally {
      setIsLoading(false);
    }
  };

  // Functions for fault campaign
  const loadAvailableModels = async () => {
    try {
      const models = await faultCampaignService.getAvailableModels();
      setAvailableModels(models);
    } catch (error) {
      console.error('Error loading models:', error);
      setCampaignError('Error loading available models');
    }
  };

  const runFaultCampaign = async () => {
    if (!selectedModel) {
      setCampaignError('Please select a model');
      return;
    }

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
    setCampaignProgress(0);
    setCampaignPhase('Iniciando campaña...');
    setElapsedTime(0);
    startTimeRef.current = Date.now();

    // Elapsed timer
    elapsedTickRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    try {
      const isSAI = campaignType === 'sai';

      // 1. Lanzar job y obtener job_id de inmediato
      const { job_id } = isSAI
        ? await faultCampaignService.startSAI({
            model_path: selectedModel.path,
            num_samples: numSamples,
            base_config: configToUse,
            granularity: 'global',
            image_dir: imageDir,
          })
        : await faultCampaignService.startWeightFaultCampaign({
            model_path: selectedModel.path,
            num_samples: numSamples,
            weight_fault_config: configToUse,
            image_dir: imageDir,
          });

      // 2. Polling de estado cada 2 segundos
      await new Promise((resolve, reject) => {
        progressTickRef.current = setInterval(async () => {
          try {
            const status = await faultCampaignService.getCampaignJobStatus(job_id);
            setCampaignProgress(status.progress);
            setCampaignPhase(status.phase);

            if (status.status === 'done') {
              clearInterval(progressTickRef.current);
              resolve(job_id);
            } else if (status.status === 'error') {
              clearInterval(progressTickRef.current);
              reject(new Error(status.error || 'Error en la campaña'));
            }
          } catch (pollError) {
            clearInterval(progressTickRef.current);
            reject(pollError);
          }
        }, 2000);
      });

      // 3. Obtener resultados finales
      const results = await faultCampaignService.getCampaignJobResults(job_id);
      clearInterval(elapsedTickRef.current);
      setCampaignResults(results);

    } catch (error) {
      console.error('Error in fault campaign:', error);
      clearInterval(elapsedTickRef.current);
      clearInterval(progressTickRef.current);
      setCampaignProgress(0);
      setCampaignPhase('');
      setCampaignError(error.message || 'Error ejecutando campaña de fallos');
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
          <p>No metrics available (metrics is null/undefined)</p>
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
          <p>No valid metrics available (invalid structure)</p>
          <pre style={{ fontSize: '10px', color: '#666' }}>
            Debug: {JSON.stringify(metrics, null, 2)}
          </pre>
        </div>
      );
    }

    const metricLabels = {
      accuracy: 'Accuracy',
      precision: 'Precision',
      recall: 'Recall',
      specificity: 'Specificity',
      auc: 'AUC',
      loss: 'Loss',
      top_1_accuracy: 'Top-1 Accuracy',
      top_5_accuracy: 'Top-5 Accuracy',
      correct_predictions: 'Correct Predictions',
      macro_avg_precision: 'Macro Avg Precision',
      macro_avg_recall: 'Macro Avg Recall'
    };

    // Extract macro average metrics from classification_report if it exists
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

    // Define priority order for main metrics (without F1-score)
    const priorityMetrics = ['accuracy', 'precision', 'recall'];
    const macroMetrics = ['macro_avg_precision', 'macro_avg_recall'];
    const countMetrics = ['correct_predictions'];

    // Filter and organize metrics (excluding num_samples and incorrect_predictions)
    const allMetrics = Object.entries(actualMetrics).filter(([key, value]) => {
      return !['confusion_matrix', 'classification_report', 'num_samples', 'incorrect_predictions'].includes(key) &&
        typeof value !== 'object';
    });

    // Add macro average metrics
    const allMetricsWithMacro = [...allMetrics, ...Object.entries(macroAvgMetrics)];

    console.log(`All metrics found for ${title}:`, allMetricsWithMacro); // Debug log

    // If there are no valid metrics, show debug message
    if (allMetricsWithMacro.length === 0) {
      return (
        <div className="result-card">
          <h5>{title}</h5>
          <p>No valid metrics found</p>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
            <strong>Claves disponibles:</strong> {Object.keys(actualMetrics).join(', ')}
          </div>
          <pre style={{ fontSize: '10px', color: '#666', marginTop: '10px' }}>
            {JSON.stringify(actualMetrics, null, 2)}
          </pre>
        </div>
      );
    }

    // Separate metrics by categories
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

        {/* Main performance metrics */}
        {renderMetricSection(mainMetrics, "Performance Metrics")}

        {/* Macro Average Metrics */}
        {renderMetricSection(macroAvgMetrics_filtered, "Macro Average Metrics")}

        {/* Counting metrics */}
        {renderMetricSection(countingMetrics, "Prediction Statistics")}

        {/* Other metrics */}
        {renderMetricSection(otherMetrics, otherMetrics.length > 0 ? "Other Metrics" : null)}

        {/* Show confusion matrix if it exists */}
        {actualMetrics.confusion_matrix && Array.isArray(actualMetrics.confusion_matrix) && (
          <div className="confusion-matrix-section">
            <h6>Confusion Matrix</h6>
            <div className="confusion-matrix-container">
              <div className="confusion-matrix-with-labels">
                {/* Encabezado con etiquetas de columnas */}
                <div className="confusion-matrix-header">
                  <div className="confusion-corner-cell"></div>
                  {actualMetrics.confusion_matrix[0] && Array.from({ length: actualMetrics.confusion_matrix[0].length }, (_, j) => (
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
                <p>Rows: Actual classes | Columns: Predicted classes</p>
                <p>Dimensions: {actualMetrics.confusion_matrix.length}x{actualMetrics.confusion_matrix[0]?.length || 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* Show classification report if it exists */}
        {actualMetrics.classification_report && typeof actualMetrics.classification_report === 'string' && (
          <div className="classification-report-section">
            <h6>Classification Report</h6>
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
                Tool for fault injection in CNNs: LeNet-5
              </p>
              <div className="architecture-info">
                <span className="architecture-badge">🎯 Optimized for LeNet-5</span>
                <p className="architecture-description">
                  This tool is specifically designed and optimized to work with the LeNet-5 architecture
                </p>
              </div>
            </div>
            <div className="header-image">
              <img
                src="/LeNet-5.png"
                alt="LeNet-5 Architecture"
                className="lenet-architecture-image"
              />
              <p className="image-caption">LeNet-5 Architecture</p>
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
                Golden Inference
              </button>
              <button
                className={`tab-button ${activeTab === 'fault-injection' ? 'active' : ''}`}
                onClick={() => setActiveTab('fault-injection')}
              >
                <span className="tab-icon"><Zap size={18} /></span>
                Fault Injection
              </button>
              <button
                className={`tab-button ${activeTab === 'analysis' ? 'active' : ''}`}
                onClick={() => setActiveTab('analysis')}
              >
                <span className="tab-icon"><RefreshCw size={18} /></span>
                Fault Campaign
              </button>
              <button
                className={`tab-button ${activeTab === 'comparison' ? 'active' : ''}`}
                onClick={() => setActiveTab('comparison')}
              >
                <span className="tab-icon"><Scale size={18} /></span>
                Comparison
              </button>
            </div>

            <div className="tab-content">
              {activeTab === 'inference' && (
                <div className="tab-panel">
                  <h3 className="panel-title">Golden Inference</h3>
                  <p className="panel-description">
                    Perform reference inferences without fault injection to establish baseline results.
                  </p>

                  {/* Model Selection */}
                  <div className="section">
                    <h4 className="section-title">Select Architecture</h4>
                    <div className="section-content">
                      <ModelSelector
                        selectedModel={selectedModel}
                        onSelectModel={handleSelectModel}
                      />
                    </div>
                  </div>

                  {/* Carga de Imagen */}
                  <div className="section">
                    <h4 className="section-title">Upload Image for Inference</h4>
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
                              {selectedImage ? selectedImage.name : 'Select image'}
                            </div>
                            <div className="upload-hint">
                              Supported formats: JPG, PNG, BMP
                            </div>
                          </label>
                        </div>

                        {imagePreview && (
                          <div className="image-preview">
                            <h5>Preview:</h5>
                            <img src={imagePreview} alt="Preview" className="preview-image" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Inference Button */}
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
                            Processing...
                          </>
                        ) : (
                          <>
                            <span className="button-icon"><Rocket size={18} /></span>
                            Run Golden Inference
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Results */}
                  <div className="section">
                    <h4 className="section-title">Golden Results</h4>
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
                            <h5>Prediction</h5>
                            <div className="prediction-result">
                              <div className="predicted-class">
                                <span className="label">Predicted class:</span>
                                <span className="value">{results.predicted_class}</span>
                              </div>
                              <div className="confidence">
                                <span className="label">Confidence:</span>
                                <span className="value">{(results.confidence * 100).toFixed(2)}%</span>
                              </div>
                            </div>
                          </div>

                          <div className="result-card">
                            <h5>Model Information</h5>
                            <div className="model-info">
                              <div className="info-item">
                                <span className="label">Model used:</span>
                                <span className="value">{results.model_used}</span>
                              </div>
                              {/* <div className="info-item">
                                <span className="label">Image shape:</span>
                                <span className="value">{results.image_shape?.join(' × ')}</span>
                              </div> */}
                            </div>
                          </div>

                          {/* {results.all_probabilities && (
                            <div className="result-card">
                              <h5>All Probabilities</h5>
                              <div className="probabilities-list">
                                {results.all_probabilities.map((prob, index) => (
                                  <div key={index} className="probability-item">
                                    <span className="class-index">Class {index}:</span>
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
                              <h5>Layer Outputs</h5>
                              <div className="layer-outputs-container">
                                {Object.entries(results.layer_outputs).map(([layerName, shape]) => (
                                  <div key={layerName} className="layer-output-item">
                                    <div className="layer-header">
                                      <span className="layer-name">{layerName}</span>
                                      <span className="layer-shape">Shape: {Array.isArray(shape) ? shape.join(' × ') : shape}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {results.excel_files && results.excel_files.length > 0 && (
                            <div className="result-card">
                              <h5>Layer Excel Files</h5>
                              <div className="excel-files-container">
                                {results.excel_files.map((filePath, index) => (
                                  <div key={index} className="excel-file-item">
                                    <span className="file-name">{filePath.split('/').pop()}</span>
                                    <button
                                      className="download-button"
                                      onClick={() => window.open(`${API_BASE_URL}/download_file/?file_path=${encodeURIComponent(filePath)}&t=${results.session_id}`, '_blank')}
                                    >
                                      📥 Download
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {results.image_files && results.image_files.length > 0 && (
                            <div className="result-card">
                              <h5>Feature Map Images</h5>
                              <div className="image-files-container">
                                {results.image_files.map((imagePath, index) => (
                                  <div key={index} className="image-file-item">
                                    <div className="image-preview-small">
                                      <img
                                        src={`${API_BASE_URL}/download_file/?file_path=${encodeURIComponent(imagePath)}&t=${results.session_id}`}
                                        alt={`Feature map ${index + 1}`}
                                        className="feature-map-image"
                                      />
                                    </div>
                                    <div className="image-info">
                                      <span className="image-name">{imagePath.split('/').pop()}</span>
                                      <button
                                        className="download-button"
                                        onClick={() => window.open(`${API_BASE_URL}/download_file/?file_path=${encodeURIComponent(imagePath)}&t=${results.session_id}`, '_blank')}
                                      >
                                        📥 Download
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
                          <p>Golden inference results will appear here</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'fault-injection' && (
                <div className="tab-panel">
                  <h3 className="panel-title">Fault Injection</h3>
                  <p className="panel-description">
                    Configure and execute fault injection in different layers of the neural network.
                  </p>

                  {/* Model Selection */}
                  <div className="section">
                    <h4 className="section-title">Select Architecture</h4>
                    <div className="section-content">
                      <ModelSelector
                        selectedModel={selectedModel}
                        onSelectModel={handleSelectModel}
                      />
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div className="section">
                    <h4 className="section-title">Upload Image for Inference</h4>
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
                              {selectedImage ? selectedImage.name : 'Select image'}
                            </div>
                            <div className="upload-hint">
                              Supported formats: JPG, PNG, BMP
                            </div>
                          </label>
                        </div>

                        {imagePreview && (
                          <div className="image-preview">
                            <h5>Preview:</h5>
                            <img src={imagePreview} alt="Preview" className="preview-image" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Weight Fault Injection Configuration */}
                  <div className="section">
                    <div className="section-content">
                      <WeightFaultConfig
                        selectedModel={selectedModel}
                        onConfigChange={handleWeightFaultConfigChange}
                        initialConfig={weightFaultConfig}
                      />
                    </div>
                  </div>

                  {/* Fault Injection Inference Button */}
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
                            Processing...
                          </>
                        ) : (
                          <>
                            <span className="button-icon">⚡</span>
                            Run Fault Injection Inference
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Fault Injection Results */}
                  <div className="section">
                    <h4 className="section-title">Fault Injection Results</h4>
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
                              <h5>🔥 Numerical Error Detected</h5>
                              <div className="error-details">
                                <div className="error-summary">
                                  <p><strong>Type:</strong> Overflow/Underflow IEEE 754</p>
                                  <p><strong>Cause:</strong> The injected faults have produced extreme numerical values</p>
                                </div>

                                <div className="error-metrics">
                                  <div className="metric-item">
                                    <span className="metric-label">Overflow:</span>
                                    <span className="metric-value">
                                      {faultResults.error_details?.error_details?.overflow_detected ?
                                        `Yes (${faultResults.error_details.error_details.overflow_count} values)` : 'No'}
                                    </span>
                                  </div>
                                  <div className="metric-item">
                                    <span className="metric-label">Underflow:</span>
                                    <span className="metric-value">
                                      {faultResults.error_details?.error_details?.underflow_detected ?
                                        `Yes (${faultResults.error_details.error_details.underflow_count} values)` : 'No'}
                                    </span>
                                  </div>
                                  <div className="metric-item">
                                    <span className="metric-label">NaN:</span>
                                    <span className="metric-value">
                                      {faultResults.error_details?.error_details?.nan_detected ?
                                        `Yes (${faultResults.error_details.error_details.nan_count} values)` : 'No'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="result-card">
                            <h5>{faultResults.success ? 'Prediction with Faults' : 'Attempted Prediction (with errors)'}</h5>
                            <div className="prediction-result">
                              <div className="predicted-class">
                                <span className="label">Predicted class:</span>
                                <span className="value">
                                  {faultResults.predicted_class !== undefined ? faultResults.predicted_class : 'Error'}
                                </span>
                              </div>
                              <div className="confidence">
                                <span className="label">Confidence:</span>
                                <span className="value">
                                  {faultResults.confidence !== undefined ?
                                    `${(faultResults.confidence * 100).toFixed(2)}%` : 'Error'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {faultResults.fault_injection && (
                            <div className="result-card">
                              <h5>Fault Injection Information</h5>
                              <div className="fault-info">
                                <div className="info-item">
                                  <span className="label">Applied faults:</span>
                                  <span className="value">{faultResults.fault_injection.total_faults || 0}</span>
                                </div>
                                <div className="info-item">
                                  <span className="label">Weight faults:</span>
                                  <span className="value">{faultResults.fault_injection.weight_faults?.total_faults || 0}</span>
                                </div>
                                <div className="info-item">
                                  <span className="label">Affected layers (weights):</span>
                                  <span className="value">
                                    {Object.keys(faultResults.fault_injection.weight_faults?.faults_by_layer || {}).length}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {faultResults.excel_files && faultResults.excel_files.length > 0 && (
                            <div className="result-card">
                              <h5>Layer Excel Files</h5>
                              <div className="excel-files-container">
                                {faultResults.excel_files.map((filePath, index) => (
                                  <div key={index} className="excel-file-item">
                                    <span className="file-name">{filePath.split('/').pop()}</span>
                                    <button
                                      className="download-button"
                                      onClick={() => window.open(`${API_BASE_URL}/download_file/?file_path=${encodeURIComponent(filePath)}&t=${faultResults.session_id}`, '_blank')}
                                    >
                                      📥 Download
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {faultResults.image_files && faultResults.image_files.length > 0 && (
                            <div className="result-card">
                              <h5>Feature Map Images</h5>
                              <div className="image-files-container">
                                {faultResults.image_files.map((imagePath, index) => (
                                  <div key={index} className="image-file-item">
                                    <div className="image-preview-small">
                                      <img
                                        src={`${API_BASE_URL}/download_file/?file_path=${encodeURIComponent(imagePath)}&t=${faultResults.session_id}`}
                                        alt={`Feature map ${index + 1}`}
                                        className="feature-map-image"
                                      />
                                    </div>
                                    <div className="image-info">
                                      <span className="image-name">{imagePath.split('/').pop()}</span>
                                      <button
                                        className="download-button"
                                        onClick={() => window.open(`${API_BASE_URL}/download_file/?file_path=${encodeURIComponent(imagePath)}&t=${faultResults.session_id}`, '_blank')}
                                      >
                                        📥 Download
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
                          <div className="placeholder-icon">⚡</div>
                          <p>Fault injection inference results will appear here</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'analysis' && (
                <div className="tab-panel">
                  <h3 className="panel-title">Fault Injection Campaign</h3>
                  <p className="panel-description">
                    Run fault injection campaigns to analyze the impact on multiple samples.
                  </p>

                  <div className="campaign-config">
                    <div className="config-section">
                      <h4>Campaign Configuration</h4>

                      {/* Model Selection */}
                      <div className="input-group">
                        <label>
                          <Database size={18} />
                          Select Model:
                        </label>
                        <div className="model-selector-wrapper">
                          <ModelSelector
                            selectedModel={selectedModel}
                            onSelectModel={handleSelectModel}
                            variant="compact"
                          />
                        </div>
                      </div>

                      <div className="input-group">
                        <label>
                          <Layers size={18} />
                          Campaign Type:
                        </label>
                        <select
                          value={campaignType}
                          onChange={(e) => setCampaignType(e.target.value)}
                          className="campaign-select"
                        >
                          <option value="weight">Weight Faults</option>
                          <option value="sai">SAI Injection</option>
                        </select>
                      </div>

                      <div className="input-group">
                        <label>
                          <Hash size={18} />
                          Batch size:
                        </label>
                        <input
                          type="number"
                          value={numSamples}
                          onChange={(e) => setNumSamples(parseInt(e.target.value))}
                          min="1"
                          max="1000"
                          className="campaign-input"
                        />
                      </div>
                      {campaignType === 'sai' && (
                        <div className="section">
                          <h5 className="section-title">SAI Injection Parameters</h5>
                          <WeightFaultConfig
                            selectedModel={selectedModel}
                            onConfigChange={handleWeightFaultConfigChange}
                            initialConfig={weightFaultConfig}
                          />
                          <p className="sai-hint">
                            <strong>Note:</strong> for SAI campaigns the <code>fault_type</code>
                            of each layer is overridden — both <code>stuck_at_0</code> and
                            <code>stuck_at_1</code> are evaluated on the same positions.
                          </p>
                        </div>
                      )}
                      {/* Specific configuration based on campaign type */}
                      {campaignType === 'weight' && (
                        <div className="section">
                          <h5 className="section-title">Weight Injection Parameters</h5>
                          <WeightFaultConfig
                            selectedModel={selectedModel}
                            onConfigChange={handleWeightFaultConfigChange}
                            initialConfig={weightFaultConfig}
                          />
                        </div>
                      )}
                      {isCampaignLoading && (
                        <div className="campaign-progress-wrapper">
                          <div className="campaign-progress-header">
                            <span className="campaign-progress-phase">{campaignPhase}</span>
                            <span className="campaign-progress-timer">
                              {String(Math.floor(elapsedTime / 60)).padStart(2, '0')}:{String(elapsedTime % 60).padStart(2, '0')}
                            </span>
                          </div>
                          <div className="campaign-progress-bar-track">
                            <div
                              className="campaign-progress-bar-fill"
                              style={{ width: `${campaignProgress}%` }}
                            />
                          </div>
                          <div className="campaign-progress-footer">
                            <span>{numSamples} muestras · {campaignType === 'sai' ? 'SAI Injection' : campaignType === 'weight' ? 'Weight Faults' : 'Activation Faults'}</span>
                            <span>{campaignProgress}%</span>
                          </div>
                        </div>
                      )}
                      {campaignProgress === 100 && !isCampaignLoading && (
                        <div className="campaign-progress-wrapper campaign-progress-done">
                          <div className="campaign-progress-header">
                            <span className="campaign-progress-phase">✅ {campaignPhase}</span>
                            <span className="campaign-progress-timer">
                              {String(Math.floor(elapsedTime / 60)).padStart(2, '0')}:{String(elapsedTime % 60).padStart(2, '0')}
                            </span>
                          </div>
                          <div className="campaign-progress-bar-track">
                            <div className="campaign-progress-bar-fill" style={{ width: '100%' }} />
                          </div>
                          <div className="campaign-progress-footer">
                            <span>{numSamples} muestras · {campaignType === 'sai' ? 'SAI Injection' : campaignType === 'weight' ? 'Weight Faults' : 'Activation Faults'}</span>
                            <span>100%</span>
                          </div>
                        </div>
                      )}

                      <button
                        className="campaign-button"
                        onClick={runFaultCampaign}
                        disabled={!selectedModel || isCampaignLoading}
                      >
                        {isCampaignLoading ? (
                          <>
                            <span className="loading-spinner"></span>
                            Ejecutando campaña...
                          </>
                        ) : (
                          <>
                            <span className="button-icon"><Play size={18} /></span>
                            Run Injection Campaign
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {campaignError && (
                    <div className="error-message">
                      <strong>Error:</strong> {campaignError}
                    </div>
                  )}

                  {campaignResults && campaignResults.results && campaignType === 'sai' && (
                    <div className="campaign-results">
                      <h4>Campaign Results</h4>
                      <div className="campaign-info">
                        <div className="result-card">
                          <h5>Campaign Information</h5>
                          <div className="info-grid">
                            <div className="info-item">
                              <span className="info-label">Model:</span>
                              <span className="info-value">{campaignResults.results.campaign_info?.model_path || 'N/A'}</span>
                            </div>
                            <div className="info-item">
                              <span className="info-label">Campaign type:</span>
                              <span className="info-value">SAI Injection</span>
                            </div>
                            {campaignResults.results.campaign_info?.granularity && (
                              <div className="info-item">
                                <span className="info-label">Granularity:</span>
                                <span className="info-value">{campaignResults.results.campaign_info.granularity}</span>
                              </div>
                            )}
                            {campaignResults.results.campaign_info?.execution_time_seconds && (
                              <div className="info-item">
                                <span className="info-label">Duration:</span>
                                <span className="info-value">{campaignResults.results.campaign_info.execution_time_seconds.toFixed(2)}s</span>
                              </div>
                            )}
                            {campaignResults.results.campaign_info?.session_id && (
                              <div className="info-item">
                                <span className="info-label">Session ID:</span>
                                <span className="info-value">{campaignResults.results.campaign_info.session_id}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <SAIResults saiResults={campaignResults.results} />
                    </div>
                  )}

                  {campaignResults && campaignResults.results && campaignType !== 'sai' && (
                    <div className="campaign-results">
                      <h4>Campaign Results</h4>

                      {/* General campaign information */}
                      <div className="campaign-info">
                        <div className="result-card">
                          <h5>Campaign Information</h5>
                          <div className="info-grid">
                            <div className="info-item">
                              <span className="info-label">Model:</span>
                              <span className="info-value">{campaignResults.results.campaign_info?.model_path || 'N/A'}</span>
                            </div>

                            <div className="info-item">
                              <span className="info-label">Campaign type:</span>
                              <span className="info-value">Weight Faults</span>
                            </div>
                            {campaignResults.results.campaign_info?.execution_time_seconds && (
                              <div className="info-item">
                                <span className="info-label">Duration:</span>
                                <span className="info-value">{campaignResults.results.campaign_info.execution_time_seconds.toFixed(2)}s</span>
                              </div>
                            )}
                            {campaignResults.results.campaign_info?.session_id && (
                              <div className="info-item">
                                <span className="info-label">Session ID:</span>
                                <span className="info-value">{campaignResults.results.campaign_info.session_id}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Detailed metrics */}
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
                          {renderDetailedMetrics(campaignResults.results.golden_results?.metrics, "Golden Metrics (No Faults)")}
                          {renderDetailedMetrics(campaignResults.results.fault_results?.metrics, "Metrics with Faults")}
                        </div>
                      </div>

                      {/* Detailed comparison analysis */}
                      {(() => {
                        const comparisons = calculateMetricComparison(campaignResults.results.golden_results?.metrics, campaignResults.results.fault_results?.metrics);
                        if (!comparisons) return null;

                        return (
                          <div className="detailed-comparison">
                            <h5>Detailed Degradation Analysis</h5>
                            <div className="comparison-grid">
                              {Object.entries(comparisons).map(([metric, data]) => (
                                <div key={metric} className="comparison-item">
                                  <div className="comparison-header">
                                    <span className="metric-name">
                                      {metric === 'accuracy' ? 'Accuracy' :
                                        metric === 'precision' ? 'Precision' :
                                          metric === 'recall' ? 'Recall' :
                                            metric === 'f1_score' ? 'F1-Score' :
                                              metric === 'correct_predictions' ? 'Correct Predictions' :
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
                                      <span className="value-label">With Faults:</span>
                                      <span className="value-number">
                                        {metric.includes('predictions') ?
                                          data.fault :
                                          (metric === 'loss' ? data.fault.toFixed(6) : (data.fault * 100).toFixed(2) + '%')
                                        }
                                      </span>
                                    </div>
                                    <div className={`value-item degradation ${Math.abs(data.degradationPercent) > 10 ? 'high' : Math.abs(data.degradationPercent) > 5 ? 'medium' : 'low'}`}>
                                      <span className="value-label">Degradation:</span>
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

                      {/* Metrics charts */}
                      <MetricsChart
                        goldenMetrics={campaignResults.results.golden_results?.metrics}
                        faultMetrics={campaignResults.results.fault_results?.metrics}
                        campaignResults={campaignResults.results}
                        numSamples={numSamples}
                      />

                      {/* Additional comparison information */}
                      {/* {campaignResults.results.comparison && (
                        <div className="comparison-summary">
                          <h5>Comparison Summary</h5>
                          <div className="comparison-stats">
                            <div className="stat-item">
                              <span className="stat-label">Same Predictions:</span>
                              <span className="stat-value">{campaignResults.results.comparison.same_predictions}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">Different Predictions:</span>
                              <span className="stat-value">{campaignResults.results.comparison.different_predictions}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">Difference Percentage:</span>
                              <span className="stat-value">{campaignResults.results.comparison.percentage_different}%</span>
                            </div>
                          </div>
                        </div>
                      )} */}

                      {/* Injected fault information */}
                      {campaignResults.results.campaign_info?.fault && (
                        <div className="fault-info">
                          <h5>Injected Fault Information</h5>
                          <div className="fault-details">
                            <div className="fault-item">
                              <span className="fault-label">Layer:</span>
                              <span className="fault-value">{campaignResults.results.campaign_info.fault.layer}</span>
                            </div>
                            <div className="fault-item">
                              <span className="fault-label">Fault Type:</span>
                              <span className="fault-value">{campaignResults.results.campaign_info.fault.type}</span>
                            </div>
                            <div className="fault-item">
                              <span className="fault-label">Affected Positions:</span>
                              <span className="fault-value">{campaignResults.results.campaign_info.fault.positions?.length || 0} positions</span>
                            </div>
                            <div className="fault-item">
                              <span className="fault-label">Affected Bits:</span>
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
                  <h3 className="panel-title">Results Comparison</h3>
                  <p className="panel-description">
                    Compare results between golden inferences and with injected faults.
                  </p>

                  {campaignResults ? (
                    <FaultMetricsComparison
                      campaignResults={campaignResults.results}
                      numSamples={10}
                    />
                  ) : (
                    <div className="coming-soon">
                      <div className="coming-soon-icon">📊</div>
                      <h4>Comparison Data</h4>
                      <p>Run a fault injection campaign first to see the metrics comparison between golden and fault inferences.</p>
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