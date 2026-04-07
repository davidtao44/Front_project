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
        //console.log('✅ Golden simulation completed:', data);
        setResults(data);
      } else {
        throw new Error(data.detail || 'Error in golden simulation');
      }
    } catch (error) {
      console.error('❌ Error in golden simulation:', error);
      setError(error.message || 'Error executing golden simulation');
    } finally {
      setIsLoading(false);
    }
  };

  const renderSimulationResults = () => {
    if (!results) return null;

    const { modification_results, simulation_results, csv_processing_results } = results;

    return (
      <div className="results-container">
        <h3><Zap size={20} style={{display: 'inline-block', marginRight: '8px'}}/> Golden Simulation Results</h3>
        
        {/* Modification results */}
        {modification_results && (
          <div className="result-section">
            <h4><Wrench size={18} style={{display: 'inline-block', marginRight: '8px'}}/> Golden Values Injection</h4>
            <div className={`status-badge ${modification_results.status}`}>
              {modification_results.status === 'success' ? <CheckCircle size={16} style={{display: 'inline-block', marginRight: '4px'}}/> : <XCircle size={16} style={{display: 'inline-block', marginRight: '4px'}}/>} {modification_results.message}
            </div>
            
            {modification_results.values_injected && (
              <div className="values-injected">
                <p><strong>Injected filters:</strong> {modification_results.values_injected.filters.join(', ')}</p>
                <p><strong>Injected bias:</strong> {modification_results.values_injected.bias.join(', ')}</p>
              </div>
            )}
          </div>
        )}

        {/* Simulation results */}
        {simulation_results && (
          <div className="result-section">
            <h4><Zap size={18} style={{display: 'inline-block', marginRight: '8px'}}/> VHDL Simulation</h4>
            <div className={`status-badge ${simulation_results.status}`}>
              {simulation_results.status === 'success' ? <CheckCircle size={16} style={{display: 'inline-block', marginRight: '4px'}}/> : <XCircle size={16} style={{display: 'inline-block', marginRight: '4px'}}/>} {simulation_results.message}
            </div>
            
            {simulation_results.steps_completed && (
              <div className="steps-completed">
                <p><strong>Completed steps:</strong> {simulation_results.steps_completed.join(' → ')}</p>
              </div>
            )}

            {simulation_results.output && (
              <div className="simulation-output">
                <h5>Simulation output:</h5>
                <pre className="output-text">{simulation_results.output}</pre>
              </div>
            )}

            {simulation_results.errors && (
              <div className="simulation-errors">
                <h5>Errors:</h5>
                <pre className="error-text">{simulation_results.errors}</pre>
              </div>
            )}
          </div>
        )}

        {/* CSV processing results */}
        {csv_processing_results && (
          <div className="result-section">
            <h4><FileText size={18} style={{display: 'inline-block', marginRight: '8px'}}/> CSV Files Processing</h4>
            <div className={`status-badge ${csv_processing_results.status}`}>
              {csv_processing_results.status === 'success' ? <CheckCircle size={16} style={{display: 'inline-block', marginRight: '4px'}}/> : 
               csv_processing_results.status === 'warning' ? <AlertTriangle size={16} style={{display: 'inline-block', marginRight: '4px'}}/> : <XCircle size={16} style={{display: 'inline-block', marginRight: '4px'}}/>} 
              {csv_processing_results.message || `${csv_processing_results.processed_files || 0} files processed`}
            </div>

            {csv_processing_results.results && csv_processing_results.results.length > 0 && (
              <div className="csv-results">
                <ChannelMatrixViewer csvProcessingResults={csv_processing_results} />
              </div>
            )}
          </div>
        )}

        {/* Additional information */}
        {/* <div className="result-section">
          <h4>📁 File Information</h4>
          <div className="file-info">
            <p><strong>VHDL File:</strong> {results.vhdl_file}</p>
            <p><strong>Backup file:</strong> {results.backup_file}</p>
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
        Run the simulation with the original (golden) VHDL hardware values to establish a baseline reference. 
        This simulation uses the default filter and bias values without any modification.
      </p>

      <div className="info-box">
        <h4><FileText size={18} style={{display: 'inline-block', marginRight: '8px'}}/> Golden Simulation Information</h4>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-icon"><Target size={16} /></span>
            <strong>Purpose:</strong>
            <p>Establish baseline reference values for comparison with fault simulations</p>
          </div>
          <div className="info-item">
            <span className="info-icon"><Wrench size={16} /></span>
            <strong>Values used:</strong>
            <p>FMAP_1 to FMAP_6 filters and original BIAS_VAL_1 to BIAS_VAL_6 values</p>
          </div>
          <div className="info-item">
            <span className="info-icon"><Zap size={16} /></span>
            <strong>Process:</strong>
            <p>compile.sh → elaborate.sh → simulate.sh → CSV processing</p>
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
              Running Simulation...
            </>
          ) : (
            <>
              <span className="button-icon"><Play size={18} /></span>
              Run Golden Simulation
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