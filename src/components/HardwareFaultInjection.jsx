import { useState, useEffect } from 'react';
import { api } from '../config/api';
import ChannelMatrixViewer from './ChannelMatrixViewer';
import './HardwareFaultInjection.css';

const HardwareFaultInjection = () => {
  const [vhdlFile, setVhdlFile] = useState(null);
  const [vhdlFilePath, setVhdlFilePath] = useState('/home/davidgonzalez/Documentos/David_2025/4_CONV1_SAB_STUCKAT_DEC_RAM_TB/CONV1_SAB_STUCKAT_DEC_RAM.srcs/sources_1/new/CONV1_SAB_STUCK_DECOS.vhd');
  const [useDefaultPath, setUseDefaultPath] = useState(true);
  const [supportedFaults, setSupportedFaults] = useState(null);
  const [vivadoStatus, setVivadoStatus] = useState(null);
  const [filterFaults, setFilterFaults] = useState([]);
  const [biasFaults, setBiasFaults] = useState([]);
  const [vivadoPath, setVivadoPath] = useState('vivado');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSupportedFaults();
    checkVivadoStatus();
  }, []);

  const loadSupportedFaults = async () => {
    try {
      const response = await api.get('/vhdl/supported_faults/');
      const data = await response.json();
      setSupportedFaults(data);
    } catch (error) {
      console.error('Error loading supported faults:', error);
      setError('Error cargando información de fallos soportados');
    }
  };

  const checkVivadoStatus = async () => {
    try {
      const response = await api.get(`/vhdl/validate_vivado/?vivado_path=${vivadoPath}`);
      const data = await response.json();
      setVivadoStatus(data);
    } catch (error) {
      console.error('Error checking Vivado status:', error);
      setVivadoStatus({ vivado_valid: false, message: 'Error verificando Vivado' });
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && (file.name.endsWith('.vhd') || file.name.endsWith('.vhdl'))) {
      setVhdlFile(file);
      setUseDefaultPath(false);
      setError(null);
    } else {
      setError('Por favor selecciona un archivo VHDL válido (.vhd o .vhdl)');
      setVhdlFile(null);
    }
  };

  const handleUseDefaultPath = (use) => {
    setUseDefaultPath(use);
    if (use) {
      setVhdlFile(null);
      setError(null);
    }
  };

  const handlePathChange = (event) => {
    setVhdlFilePath(event.target.value);
  };

  const addFilterFault = () => {
    setFilterFaults([...filterFaults, {
      filter_name: 'FMAP_1',
      row: 0,
      col: 0,
      bit_position: 0,
      fault_type: 'bitflip'
    }]);
  };

  const updateFilterFault = (index, field, value) => {
    const updated = [...filterFaults];
    updated[index][field] = parseInt(value) || value;
    setFilterFaults(updated);
  };

  const removeFilterFault = (index) => {
    setFilterFaults(filterFaults.filter((_, i) => i !== index));
  };

  const addBiasFault = () => {
    setBiasFaults([...biasFaults, {
      bias_name: 'BIAS_VAL_1',
      bit_position: 0,
      fault_type: 'bitflip'
    }]);
  };

  const updateBiasFault = (index, field, value) => {
    const updated = [...biasFaults];
    updated[index][field] = parseInt(value) || value;
    setBiasFaults(updated);
  };

  const removeBiasFault = (index) => {
    setBiasFaults(biasFaults.filter((_, i) => i !== index));
  };



  const handleInjectFaults = async () => {
    if (filterFaults.length === 0 && biasFaults.length === 0) {
      setError('Debe agregar al menos un fallo (filtro o sesgo)');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      console.log('🔍 DEBUG Frontend - filterFaults:', filterFaults);
      console.log('🔍 DEBUG Frontend - biasFaults:', biasFaults);
      
      const formData = new FormData();
      
      // Solo enviamos los parámetros necesarios para la lógica simplificada
      const filterFaultsJson = JSON.stringify(filterFaults);
      const biasFaultsJson = JSON.stringify(biasFaults);
      
      console.log('🔍 DEBUG Frontend - filterFaultsJson:', filterFaultsJson);
      console.log('🔍 DEBUG Frontend - biasFaultsJson:', biasFaultsJson);
      
      formData.append('filter_faults', filterFaultsJson);
      formData.append('bias_faults', biasFaultsJson);

      // Verificar que FormData tiene contenido
      console.log('🔍 DEBUG Frontend - FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}: ${value}`);
      }

      // No establecer Content-Type manualmente - el navegador lo hará automáticamente con el boundary correcto
      const response = await api.post('/vhdl/inject_faults/', formData);

      const data = await response.json();
      console.log('🔍 DEBUG Frontend - Respuesta completa del backend:', data);
      console.log('🔍 DEBUG Frontend - csv_processing_results:', data.csv_processing_results);
      
      if (data.csv_processing_results && data.csv_processing_results.results) {
        console.log('🔍 DEBUG Frontend - Número de archivos procesados:', data.csv_processing_results.results.length);
        data.csv_processing_results.results.forEach((result, index) => {
          console.log(`🔍 DEBUG Frontend - Archivo ${index + 1}:`, result);
          if (result.csv_data) {
            console.log(`🔍 DEBUG Frontend - Estructura csv_data del archivo ${index + 1}:`, Object.keys(result.csv_data));
            if (result.csv_data.channels) {
              console.log(`🔍 DEBUG Frontend - Canales disponibles:`, Object.keys(result.csv_data.channels));
            }
          }
        });
      }
      
      setResults(data);
    } catch (error) {
      console.error('❌ ERROR Frontend:', error);
      setError(error.message || 'Error en la inyección de fallos');
    } finally {
      setIsLoading(false);
    }
  };

  if (!supportedFaults) {
    return <div className="loading">Cargando información de fallos soportados...</div>;
  }

  return (
    <div className="hardware-fault-injection">
      <div className="section">
        <h3 className="section-title">
          <span className="section-icon">📁</span>
          Archivo VHDL
        </h3>
        
        <div className="file-selection-options">
          <div className="option-toggle">
            <label className="toggle-option">
              <input
                type="radio"
                name="file-option"
                checked={useDefaultPath}
                onChange={() => handleUseDefaultPath(true)}
              />
              <span>Usar ruta por defecto</span>
            </label>
            <label className="toggle-option">
              <input
                type="radio"
                name="file-option"
                checked={!useDefaultPath}
                onChange={() => handleUseDefaultPath(false)}
              />
              <span>Subir archivo</span>
            </label>
          </div>

          {useDefaultPath ? (
            <div className="default-path-section">
              <label>Ruta del archivo VHDL:</label>
              <input
                type="text"
                value={vhdlFilePath}
                onChange={handlePathChange}
                className="path-input"
                placeholder="Ingresa la ruta completa del archivo VHDL"
              />
              <div className="path-info">
                <small>📍 Ruta por defecto: CONV_LAYER_1.vhd (Primera capa convolucional)</small>
              </div>
            </div>
          ) : (
            <div className="file-upload">
              <input
                type="file"
                accept=".vhd,.vhdl"
                onChange={handleFileChange}
                className="file-input"
                id="vhdl-file"
              />
              <label htmlFor="vhdl-file" className="file-label">
                {vhdlFile ? vhdlFile.name : 'Seleccionar archivo VHDL'}
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="section">
        <h3 className="section-title">
          <span className="section-icon">🔧</span>
          Estado de Vivado
        </h3>
        <div className="vivado-status">
          <div className="vivado-path">
            <label>Ruta de Vivado:</label>
            <input
              type="text"
              value={vivadoPath}
              onChange={(e) => setVivadoPath(e.target.value)}
              className="vivado-path-input"
            />
            <button onClick={checkVivadoStatus} className="check-vivado-btn">
              Verificar
            </button>
          </div>
          {vivadoStatus && (
            <div className={`vivado-status-result ${vivadoStatus.vivado_valid ? 'available' : 'unavailable'}`}>
              <span className="status-icon">
                {vivadoStatus.vivado_valid ? '✅' : '❌'}
              </span>
              {vivadoStatus.message}
            </div>
          )}
        </div>
      </div>

      <div className="section">
        <h3 className="section-title">
          <span className="section-icon">🎯</span>
          Fallos en Filtros (FMAP)
        </h3>
        <div className="faults-container">
          {filterFaults.map((fault, index) => (
            <div key={index} className="fault-config">
              <div className="fault-header">
                <span>Fallo en Filtro #{index + 1}</span>
                <button onClick={() => removeFilterFault(index)} className="remove-fault-btn">
                  ❌
                </button>
              </div>
              <div className="fault-fields">
                <div className="field">
                  <label>Filtro:</label>
                  <select
                    value={fault.filter_name}
                    onChange={(e) => updateFilterFault(index, 'filter_name', e.target.value)}
                  >
                    {supportedFaults?.filter_targets?.map(filter => (
                      <option key={filter.name} value={filter.name}>
                        {filter.name} - {filter.description}
                      </option>
                    )) || []}
                  </select>
                </div>
                <div className="field">
                  <label>Fila (0-4):</label>
                  <input
                    type="number"
                    min="0"
                    max="4"
                    value={fault.row}
                    onChange={(e) => updateFilterFault(index, 'row', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Columna (0-4):</label>
                  <input
                    type="number"
                    min="0"
                    max="4"
                    value={fault.col}
                    onChange={(e) => updateFilterFault(index, 'col', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Posición del Bit (0-7):</label>
                  <input
                    type="number"
                    min="0"
                    max="7"
                    value={fault.bit_position}
                    onChange={(e) => updateFilterFault(index, 'bit_position', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Tipo de Fallo:</label>
                  <select
                    value={fault.fault_type}
                    onChange={(e) => updateFilterFault(index, 'fault_type', e.target.value)}
                  >
                    {supportedFaults?.fault_types?.map(type => (
                      <option key={type.name} value={type.name}>
                        {type.name} - {type.description}
                      </option>
                    )) || []}
                  </select>
                </div>
              </div>
            </div>
          ))}
          <button onClick={addFilterFault} className="add-fault-btn">
            ➕ Agregar Fallo en Filtro
          </button>
        </div>
      </div>

      <div className="section">
        <h3 className="section-title">
          <span className="section-icon">⚖️</span>
          Fallos en Sesgos (BIAS)
        </h3>
        <div className="faults-container">
          {biasFaults.map((fault, index) => (
            <div key={index} className="fault-config">
              <div className="fault-header">
                <span>Fallo en Sesgo #{index + 1}</span>
                <button onClick={() => removeBiasFault(index)} className="remove-fault-btn">
                  ❌
                </button>
              </div>
              <div className="fault-fields">
                <div className="field">
                  <label>Sesgo:</label>
                  <select
                    value={fault.bias_name}
                    onChange={(e) => updateBiasFault(index, 'bias_name', e.target.value)}
                  >
                    {supportedFaults?.bias_targets?.map(bias => (
                      <option key={bias.name} value={bias.name}>
                        {bias.name} - {bias.description}
                      </option>
                    )) || []}
                  </select>
                </div>
                <div className="field">
                  <label>Posición del Bit (0-15):</label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={fault.bit_position}
                    onChange={(e) => updateBiasFault(index, 'bit_position', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Tipo de Fallo:</label>
                  <select
                    value={fault.fault_type}
                    onChange={(e) => updateBiasFault(index, 'fault_type', e.target.value)}
                  >
                    {supportedFaults?.fault_types?.map(type => (
                      <option key={type.name} value={type.name}>
                        {type.name} - {type.description}
                      </option>
                    )) || []}
                  </select>
                </div>
              </div>
            </div>
          ))}
          <button onClick={addBiasFault} className="add-fault-btn">
            ➕ Agregar Fallo en Sesgo
          </button>
        </div>
      </div>



      <div className="section">
        <div className="action-buttons">
          <button
            onClick={handleInjectFaults}
            disabled={isLoading || (!vhdlFile && !useDefaultPath) || (filterFaults.length === 0 && biasFaults.length === 0)}
            className="inject-faults-btn"
          >
            {isLoading ? 'Procesando...' : 'Inyectar Fallos'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">❌</span>
          {error}
        </div>
      )}

      {results && (
        <div className="section">
          <h3 className="section-title">
            <span className="section-icon">📊</span>
            Resultados
          </h3>
          <div className="results-container">
            <div className={`result-status ${results.status === 'success' ? 'success' : 'error'}`}>
              <span className="status-icon">
                {results.status === 'success' ? '✅' : '❌'}
              </span>
              {results.message}
            </div>
            
            {results.result && (
              <div className="result-details">
                <h4>Detalles del Resultado:</h4>
                <pre className="result-json">
                  {JSON.stringify(results.result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {results && results.csv_processing_results && (
        <div className="section">
          <h3 className="section-title">
            <span className="section-icon">🔍</span>
            Visualización de Matrices de Salida
          </h3>
          <ChannelMatrixViewer csvProcessingResults={results.csv_processing_results} />
        </div>
      )}
    </div>
  );
};

export default HardwareFaultInjection;