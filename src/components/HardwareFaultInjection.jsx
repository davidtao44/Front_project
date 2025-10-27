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
      fault_type: 'stuck_at_0'
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
      fault_type: 'stuck_at_0'
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

  // Simple alert helper
  const showAlert = (message) => {
    // Prefer a lightweight inline alert; can be replaced by toast later
    alert(message);
  };

  // Validation helpers
  const validateFilterFault = (fault, index) => {
    const required = ['filter_name', 'row', 'col', 'bit_position', 'fault_type'];
    const fieldNames = {
      'filter_name': 'filtro',
      'row': 'fila',
      'col': 'columna',
      'bit_position': 'posición del bit',
      'fault_type': 'tipo de fallo'
    };
    
    for (const key of required) {
      const val = fault[key];
      if (val === undefined || val === null || val === '' || Number.isNaN(val)) {
        return `Fallo en Filtro #${index + 1}: el campo "${fieldNames[key]}" está vacío o inválido`;
      }
    }
    // Ranges
    if (fault.row < 0 || fault.row > 4) return `Fallo en Filtro #${index + 1}: "fila" debe estar entre 0 y 4`;
    if (fault.col < 0 || fault.col > 4) return `Fallo en Filtro #${index + 1}: "columna" debe estar entre 0 y 4`;
    if (fault.bit_position < 0 || fault.bit_position > 7) return `Fallo en Filtro #${index + 1}: "posición del bit" debe estar entre 0 (LSB) y 7 (MSB)`;
    return null;
  };

  const validateBiasFault = (fault, index) => {
    const required = ['bias_name', 'bit_position', 'fault_type'];
    const fieldNames = {
      'bias_name': 'sesgo',
      'bit_position': 'posición del bit',
      'fault_type': 'tipo de fallo'
    };
    
    for (const key of required) {
      const val = fault[key];
      if (val === undefined || val === null || val === '' || Number.isNaN(val)) {
        return `Fallo en Sesgo #${index + 1}: el campo "${fieldNames[key]}" está vacío o inválido`;
      }
    }
    if (fault.bit_position < 0 || fault.bit_position > 15) return `Fallo en Sesgo #${index + 1}: "posición del bit" debe estar entre 0 (LSB) y 15 (MSB)`;
    return null;
  };

  const validateFaults = () => {
    if (filterFaults.length === 0 && biasFaults.length === 0) {
      return 'Debe agregar al menos un fallo (filtro o sesgo)';
    }
    for (let i = 0; i < filterFaults.length; i++) {
      const err = validateFilterFault(filterFaults[i], i);
      if (err) return err;
    }
    for (let i = 0; i < biasFaults.length; i++) {
      const err = validateBiasFault(biasFaults[i], i);
      if (err) return err;
    }
    return null;
  };

  // Helper functions to convert bit positions from user input (0=LSB) to backend format
  const convertFilterBitPosition = (userBitPosition) => {
    // Para filtros de 8 bits: user input 0 (LSB) -> backend 7, user input 7 (MSB) -> backend 0
    return 7 - userBitPosition;
  };

  const convertBiasBitPosition = (userBitPosition) => {
    // Para bias de 16 bits: user input 0 (LSB) -> backend 15, user input 15 (MSB) -> backend 0
    return 15 - userBitPosition;
  };

  const convertFaultsForBackend = (filterFaults, biasFaults) => {
    // Convertir posiciones de bits en filterFaults
    const convertedFilterFaults = filterFaults.map(fault => ({
      ...fault,
      bit_position: convertFilterBitPosition(fault.bit_position)
    }));

    // Convertir posiciones de bits en biasFaults
    const convertedBiasFaults = biasFaults.map(fault => ({
      ...fault,
      bit_position: convertBiasBitPosition(fault.bit_position)
    }));

    return { convertedFilterFaults, convertedBiasFaults };
  };

  const handleInjectFaults = async () => {
    const validationError = validateFaults();
    if (validationError) {
      setError(validationError);
      showAlert(validationError);
      return;
    }

    if (filterFaults.length === 0 && biasFaults.length === 0) {
      setError('Debe agregar al menos un fallo (filtro o sesgo)');
      showAlert('Debe agregar al menos un fallo (filtro o sesgo)');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      console.log('🔍 DEBUG Frontend - Original filterFaults:', filterFaults);
      console.log('🔍 DEBUG Frontend - Original biasFaults:', biasFaults);
      
      // Convertir posiciones de bits antes de enviar al backend
      const { convertedFilterFaults, convertedBiasFaults } = convertFaultsForBackend(filterFaults, biasFaults);
      
      console.log('🔍 DEBUG Frontend - Converted filterFaults:', convertedFilterFaults);
      console.log('🔍 DEBUG Frontend - Converted biasFaults:', convertedBiasFaults);
      
      const formData = new FormData();
      
      // Enviar los fallos con posiciones de bits convertidas
      const filterFaultsJson = JSON.stringify(convertedFilterFaults);
      const biasFaultsJson = JSON.stringify(convertedBiasFaults);
      
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
      
      // Si la inyección fue exitosa y el archivo fue modificado, notificar al usuario
      if (data.file_modified && data.file_info) {
        console.log('✅ Archivo VHDL modificado exitosamente:', data.file_info.path);
        console.log('📅 Timestamp de modificación:', new Date(data.modification_timestamp));
        
        // Mostrar notificación al usuario sobre la modificación del archivo
        const notification = document.createElement('div');
        notification.className = 'file-update-notification';
        notification.innerHTML = `
          <div class="notification-content">
            <span class="notification-icon">✅</span>
            <span class="notification-text">Archivo VHDL actualizado exitosamente</span>
            <span class="notification-details">Modificado: ${new Date(data.modification_timestamp).toLocaleTimeString()}</span>
          </div>
        `;
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #4CAF50;
          color: white;
          padding: 15px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 1000;
          animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        // Remover la notificación después de 5 segundos
        setTimeout(() => {
          if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
              if (notification.parentNode) {
                document.body.removeChild(notification);
              }
            }, 300);
          }
        }, 5000);
      }
      
      setResults(data);
    } catch (error) {
      console.error('❌ ERROR Frontend:', error);
      setError(error.message || 'Error en la inyección de fallos');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshVhdlFile = async () => {
    try {
      setIsLoading(true);
      const filePath = useDefaultPath ? vhdlFilePath : (vhdlFile ? vhdlFile.name : '');
      
      if (!filePath) {
        setError('No hay archivo VHDL seleccionado para refrescar');
        return;
      }

      const response = await api.get(`/vhdl/file_status/?file_path=${encodeURIComponent(vhdlFilePath)}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        // Mostrar notificación de archivo refrescado
        const notification = document.createElement('div');
        notification.className = 'file-update-notification';
        notification.innerHTML = `
          <div class="notification-content">
            <span class="notification-icon">🔄</span>
            <span class="notification-text">Archivo VHDL refrescado</span>
            <span class="notification-details">Última modificación: ${new Date(data.file_info.last_modified_ms).toLocaleTimeString()}</span>
          </div>
        `;
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #2196F3;
          color: white;
          padding: 15px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 1000;
          animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
          if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
              if (notification.parentNode) {
                document.body.removeChild(notification);
              }
            }, 300);
          }
        }, 3000);
        
        console.log('✅ Archivo VHDL refrescado:', data.file_info);
      }
    } catch (error) {
      console.error('❌ ERROR refrescando archivo:', error);
      setError('Error al refrescar el archivo VHDL');
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
              <div className="file-actions">
                <button 
                  onClick={refreshVhdlFile} 
                  className="refresh-file-btn"
                  disabled={isLoading}
                >
                  <span className="btn-icon">🔄</span>
                  {isLoading ? 'Refrescando...' : 'Refrescar archivo'}
                </button>
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
                  <label>Posición del Bit (0=LSB, 7=MSB):</label>
                  <input
                    type="number"
                    min="0"
                    max="7"
                    value={fault.bit_position}
                    onChange={(e) => updateFilterFault(index, 'bit_position', e.target.value)}
                    title="0 = Bit menos significativo (LSB), 7 = Bit más significativo (MSB)"
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
                  <label>Posición del Bit (0=LSB, 15=MSB):</label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={fault.bit_position}
                    onChange={(e) => updateBiasFault(index, 'bit_position', e.target.value)}
                    title="0 = Bit menos significativo (LSB), 15 = Bit más significativo (MSB)"
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