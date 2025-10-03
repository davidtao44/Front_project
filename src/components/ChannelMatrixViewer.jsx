import React from 'react';
import * as XLSX from 'xlsx';
import './ChannelMatrixViewer.css';

const ChannelMatrixViewer = ({ csvProcessingResults }) => {
  // Validaciones más robustas para la nueva estructura
  if (!csvProcessingResults || typeof csvProcessingResults !== 'object') {
    return (
      <div className="matrix-viewer-empty">
        <p>No hay datos de matrices disponibles</p>
      </div>
    );
  }

  // Acceder a los resultados procesados
  const results = csvProcessingResults.results;
  if (!results || !Array.isArray(results) || results.length === 0) {
    return (
      <div className="matrix-viewer-empty">
        <p>No hay archivos CSV procesados disponibles</p>
      </div>
    );
  }

  // Función para formatear números con coma decimal
  const formatNumberWithComma = (value) => {
    if (typeof value === 'number') {
      return value.toFixed(6).replace('.', ',');
    }
    return value;
  };

  // Función para generar archivo Excel de un canal específico
  const downloadChannelExcel = (csvResult, channelKey) => {
    const matrices = csvResult.result.matrices;
    const matrix = matrices[channelKey];
    const fileName = csvResult.file ? csvResult.file.split('/').pop().replace('.csv', '') : 'simulation_output';
    
    if (!matrix || !Array.isArray(matrix)) return;
    
    // Crear headers
    const headers = matrix[0] ? matrix[0].map((_, colIndex) => `Col_${colIndex}`) : [];
    
    // Formatear datos con coma decimal
    const formattedData = matrix.map(row => 
      row.map(value => formatNumberWithComma(value))
    );
    
    // Crear worksheet
    const wsData = [headers, ...formattedData];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Crear workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, channelKey);
    
    // Descargar archivo
    XLSX.writeFile(wb, `${fileName}_${channelKey}.xlsx`);
  };

  // Función para descargar todos los canales en un solo archivo Excel
  const downloadAllChannelsExcel = (csvResult) => {
    const matrices = csvResult.result.matrices;
    const fileName = csvResult.file ? csvResult.file.split('/').pop().replace('.csv', '') : 'simulation_output';
    
    // Crear workbook
    const wb = XLSX.utils.book_new();
    
    Object.keys(matrices).forEach(channelKey => {
      const matrix = matrices[channelKey];
      if (!matrix || !Array.isArray(matrix)) return;
      
      // Crear headers
      const headers = matrix[0] ? matrix[0].map((_, colIndex) => `Col_${colIndex}`) : [];
      
      // Formatear datos con coma decimal
      const formattedData = matrix.map(row => 
        row.map(value => formatNumberWithComma(value))
      );
      
      // Crear worksheet para este canal
      const wsData = [headers, ...formattedData];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Agregar worksheet al workbook
      XLSX.utils.book_append_sheet(wb, ws, channelKey);
    });

    // Descargar archivo
    XLSX.writeFile(wb, `${fileName}_todos_los_canales.xlsx`);
  };

  return (
    <div className="matrix-viewer">
      <div className="excel-download-section">
        <h3>📊 Descarga de Datos Excel</h3>
        <p>Los datos de simulación están listos para descargar en formato Excel con números formateados con coma decimal.</p>
        
        {results.filter((csvResult) => {
          // Filtrar archivos que contengan "Conv1_TF" en el nombre
          const fileName = csvResult.file ? csvResult.file.split('/').pop().replace('.csv', '') : '';
          return !fileName.includes('Conv1_TF');
        }).map((csvResult, fileIndex) => {
          // Validar que csvResult existe y tiene la estructura esperada
          if (!csvResult || typeof csvResult !== 'object' || !csvResult.result || !csvResult.result.matrices) {
            return (
              <div key={fileIndex} className="file-section error">
                <p>❌ Error: Datos inválidos para el archivo {fileIndex + 1}</p>
              </div>
            );
          }

          const matrices = csvResult.result.matrices;
          const fileName = csvResult.file ? csvResult.file.split('/').pop().replace('.csv', '') : `archivo_${fileIndex + 1}`;
          const channelCount = Object.keys(matrices).length;

          return (
            <div key={fileIndex} className="file-section">
              <div className="file-header">
                <h4>simulation_output_Conv1_Golden</h4>
                <p>Canales disponibles: {channelCount}</p>
              </div>
              
              <div className="download-options">
                <div className="download-all">
                  <button 
                    className="download-btn primary"
                    onClick={() => downloadAllChannelsExcel(csvResult)}
                  >
                    📥 Descargar Todos los Canales
                  </button>
                  <span className="download-description">
                    Descarga un archivo Excel con todos los canales organizados
                  </span>
                </div>
                
                <div className="individual-channels">
                  <h5>Descargar canales individuales:</h5>
                  <div className="channel-buttons">
                    {Object.keys(matrices).map((channelKey) => (
                      <button
                        key={channelKey}
                        className="download-btn secondary"
                        onClick={() => downloadChannelExcel(csvResult, channelKey)}
                      >
                        📄 {channelKey}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="file-info">
                <div className="info-grid">
                  <div className="info-item">
                    <strong>Archivo original:</strong> simulation_output_Conv1_Golden
                  </div>
                  <div className="info-item">
                    <strong>Número de canales:</strong> {channelCount}
                  </div>
                  <div className="info-item">
                    <strong>Canales:</strong> {Object.keys(matrices).join(', ')}
                  </div>
                  {csvResult.result.metadata && (
                    <div className="info-item">
                      <strong>Metadatos:</strong> Disponibles
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChannelMatrixViewer;