import React from 'react';
import * as XLSX from 'xlsx';
import './ChannelMatrixViewer.css';

const ChannelMatrixViewer = ({ csvProcessingResults }) => {
  // More robust validations for the new structure
  if (!csvProcessingResults || typeof csvProcessingResults !== 'object') {
    return (
      <div className="matrix-viewer-empty">
        <p>No matrix data available</p>
      </div>
    );
  }

  // Access processed results
  const results = csvProcessingResults.results;
  if (!results || !Array.isArray(results) || results.length === 0) {
    return (
      <div className="matrix-viewer-empty">
        <p>No processed CSV files available</p>
      </div>
    );
  }

  // Function to format numbers with decimal comma
  const formatNumberWithComma = (value) => {
    if (typeof value === 'number') {
      return value.toFixed(6).replace('.', ',');
    }
    return value;
  };

  // Function to generate Excel file for a specific channel
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

  // Function to download all channels in a single Excel file
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
    XLSX.writeFile(wb, `${fileName}_all_channels.xlsx`);
  };

  return (
    <div className="matrix-viewer">
      <div className="excel-download-section">
        <h3>📊 Excel Data Download</h3>
        <p>Simulation data is ready for download in Excel format with decimal comma numbers.</p>
        
        {results.filter((csvResult) => {
          // Filter files containing "Conv1_TF" in the name
          const fileName = csvResult.file ? csvResult.file.split('/').pop().replace('.csv', '') : '';
          return !fileName.includes('Conv1_TF');
        }).map((csvResult, fileIndex) => {
          // Validate that csvResult exists and has the expected structure
          if (!csvResult || typeof csvResult !== 'object' || !csvResult.result || !csvResult.result.matrices) {
            return (
              <div key={fileIndex} className="file-section error">
                <p>❌ Error: Invalid data for file {fileIndex + 1}</p>
              </div>
            );
          }

          const matrices = csvResult.result.matrices;
          const fileName = csvResult.file ? csvResult.file.split('/').pop().replace('.csv', '') : `file_${fileIndex + 1}`;
          const channelCount = Object.keys(matrices).length;

          return (
            <div key={fileIndex} className="file-section">
              <div className="file-header">
                <h4>simulation_output_Conv1_Golden</h4>
                <p>Available channels: {channelCount}</p>
              </div>
              
              <div className="download-options">
                <div className="download-all">
                  <button 
                    className="download-btn primary"
                    onClick={() => downloadAllChannelsExcel(csvResult)}
                  >
                    📥 Download All Channels
                  </button>
                  <span className="download-description">
                    Download an Excel file with all organized channels
                  </span>
                </div>
                
                <div className="individual-channels">
                  <h5>Download individual channels:</h5>
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
                    <strong>Original file:</strong> simulation_output_Conv1_Golden
                  </div>
                  <div className="info-item">
                    <strong>Number of channels:</strong> {channelCount}
                  </div>
                  <div className="info-item">
                    <strong>Channels:</strong> {Object.keys(matrices).join(', ')}
                  </div>
                  {/* {csvResult.result.metadata && (
                    <div className="info-item">
                      <strong>Metadatos:</strong> Disponibles
                    </div>
                  )} */}
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