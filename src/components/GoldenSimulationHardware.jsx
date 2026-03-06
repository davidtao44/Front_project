import { useState } from 'react';
import { api } from '../config/api';
import { Zap, Play, CheckCircle, XCircle, AlertTriangle, FileText, Wrench, Target } from 'lucide-react';
import ChannelMatrixViewer from './ChannelMatrixViewer';
import './HardwareFaultInjection.css'; // Reutilizamos los estilos existentes

const GoldenSimulationHardware = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const runGoldenSimulation = async () => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      //console.log('🚀 Iniciando simulación golden...');
      
      const response = await api.post('/vhdl/golden_simulation/');
      const data = await response.json();

      if (response.ok) {
        //console.log('✅ Simulación golden completada:', data);
        setResults(data);
      } else {
        throw new Error(data.detail || 'Error en la simulación golden');
      }
    } catch (error) {
      console.error('❌ Error en simulación golden:', error);
      setError(error.message || 'Error ejecutando simulación golden');
    } finally {
      setIsLoading(false);
    }
  };

  const renderSimulationResults = () => {
    if (!results) return null;

    const { modification_results, simulation_results, csv_processing_results } = results;

    return (
      <div className="results-container">
        <h3><Zap size={20} style={{display: 'inline-block', marginRight: '8px'}}/> Resultados de Simulación Golden</h3>
        
        {/* Resultados de modificación */}
        {modification_results && (
          <div className="result-section">
            <h4><Wrench size={18} style={{display: 'inline-block', marginRight: '8px'}}/> Inyección de Valores Golden</h4>
            <div className={`status-badge ${modification_results.status}`}>
              {modification_results.status === 'success' ? <CheckCircle size={16} style={{display: 'inline-block', marginRight: '4px'}}/> : <XCircle size={16} style={{display: 'inline-block', marginRight: '4px'}}/>} {modification_results.message}
            </div>
            
            {modification_results.values_injected && (
              <div className="values-injected">
                <p><strong>Filtros inyectados:</strong> {modification_results.values_injected.filters.join(', ')}</p>
                <p><strong>Bias inyectados:</strong> {modification_results.values_injected.bias.join(', ')}</p>
              </div>
            )}
          </div>
        )}

        {/* Resultados de simulación */}
        {simulation_results && (
          <div className="result-section">
            <h4><Zap size={18} style={{display: 'inline-block', marginRight: '8px'}}/> Simulación VHDL</h4>
            <div className={`status-badge ${simulation_results.status}`}>
              {simulation_results.status === 'success' ? <CheckCircle size={16} style={{display: 'inline-block', marginRight: '4px'}}/> : <XCircle size={16} style={{display: 'inline-block', marginRight: '4px'}}/>} {simulation_results.message}
            </div>
            
            {simulation_results.steps_completed && (
              <div className="steps-completed">
                <p><strong>Pasos completados:</strong> {simulation_results.steps_completed.join(' → ')}</p>
              </div>
            )}

            {simulation_results.output && (
              <div className="simulation-output">
                <h5>Salida de simulación:</h5>
                <pre className="output-text">{simulation_results.output}</pre>
              </div>
            )}

            {simulation_results.errors && (
              <div className="simulation-errors">
                <h5>Errores:</h5>
                <pre className="error-text">{simulation_results.errors}</pre>
              </div>
            )}
          </div>
        )}

        {/* Resultados de procesamiento CSV */}
        {csv_processing_results && (
          <div className="result-section">
            <h4><FileText size={18} style={{display: 'inline-block', marginRight: '8px'}}/> Procesamiento de Archivos CSV</h4>
            <div className={`status-badge ${csv_processing_results.status}`}>
              {csv_processing_results.status === 'success' ? <CheckCircle size={16} style={{display: 'inline-block', marginRight: '4px'}}/> : 
               csv_processing_results.status === 'warning' ? <AlertTriangle size={16} style={{display: 'inline-block', marginRight: '4px'}}/> : <XCircle size={16} style={{display: 'inline-block', marginRight: '4px'}}/>} 
              {csv_processing_results.message || `${csv_processing_results.processed_files || 0} archivos procesados`}
            </div>

            {csv_processing_results.results && csv_processing_results.results.length > 0 && (
              <div className="csv-results">
                <ChannelMatrixViewer csvProcessingResults={csv_processing_results} />
              </div>
            )}
          </div>
        )}

        {/* Información adicional */}
        {/* <div className="result-section">
          <h4>📁 Información de Archivos</h4>
          <div className="file-info">
            <p><strong>Archivo VHDL:</strong> {results.vhdl_file}</p>
            <p><strong>Archivo de respaldo:</strong> {results.backup_file}</p>
          </div>
        </div> */}
      </div>
    );
  };

  return (
    <div className="hardware-fault-injection">
      <div className="section-header">
        <div className="header-icon"><Zap size={24} color="var(--color-primary)" /></div>
        <h2>Golden Simulation Hardware</h2>
      </div>
      
      <p className="description">
        Ejecuta la simulación con los valores originales (golden) del hardware VHDL para establecer una referencia base. 
        Esta simulación utiliza los valores por defecto de filtros y bias sin ninguna modificación.
      </p>

      <div className="info-box">
        <h4><FileText size={18} style={{display: 'inline-block', marginRight: '8px'}}/> Información de Simulación Golden</h4>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-icon"><Target size={16} /></span>
            <strong>Propósito:</strong>
            <p>Establecer valores de referencia base para comparación con simulaciones con fallos</p>
          </div>
          <div className="info-item">
            <span className="info-icon"><Wrench size={16} /></span>
            <strong>Valores utilizados:</strong>
            <p>Filtros FMAP_1 a FMAP_6 y valores BIAS_VAL_1 a BIAS_VAL_6 originales</p>
          </div>
          <div className="info-item">
            <span className="info-icon"><Zap size={16} /></span>
            <strong>Proceso:</strong>
            <p>compile.sh → elaborate.sh → simulate.sh → procesamiento CSV</p>
          </div>
        </div>
      </div>

      <div className="actions-section">
        <button 
          className="run-button"
          onClick={runGoldenSimulation}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Ejecutando Simulación...
            </>
          ) : (
            <>
              <span className="button-icon"><Play size={18} /></span>
              Ejecutar Simulación Golden
            </>
          )}
        </button>

        {error && (
          <div className="error-container">
            <div className="error-message">
              ❌ {error}
            </div>
          </div>
        )}
      </div>

      {renderSimulationResults()}
    </div>
  );
};

export default GoldenSimulationHardware;