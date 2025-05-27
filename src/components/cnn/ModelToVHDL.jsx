import { useState } from "react";
import { cnnService } from "../../services/api";
import styles from "./ModelToVHDL.module.css";

const ModelToVHDL = ({ selectedModel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [bitsValue, setBitsValue] = useState(8); // Valor predeterminado de 8 bits

  const handleExportWeights = async () => {
    if (!selectedModel) {
      setError("Por favor, seleccione un modelo primero");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await cnnService.exportModelWeights(selectedModel.path, bitsValue);
      setResult(response);
    } catch (err) {
      setError(err.message || "Error al exportar los pesos del modelo");
    } finally {
      setLoading(false);
    }
  };

  const handleViewFile = async (filePath) => {
    setLoading(true);
    setError(null);
    setSelectedFile(filePath);

    try {
      const fullPath = `${result.output_dir}/${filePath}`;
      const response = await cnnService.downloadFile(fullPath);
      setFileContent(response.content);
    } catch (err) {
      setError(err.message || "Error al descargar el archivo");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFile = async (filePath) => {
    try {
      const fullPath = `${result.output_dir}/${filePath}`;
      const response = await cnnService.downloadFile(fullPath);
      
      // Crear un blob con el contenido
      const blob = new Blob([response.content], { type: "text/plain" });
      
      // Crear un enlace de descarga
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filePath;
      document.body.appendChild(a);
      a.click();
      
      // Limpiar
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message || "Error al descargar el archivo");
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Exportar Modelo a VHDL</h2>
      
      {selectedModel ? (
        <div className={styles.modelInfo}>
          <p>Modelo seleccionado: <strong>{selectedModel.filename}</strong></p>
          
          <div className={styles.formGroup}>
            <label htmlFor="bits-input" className={styles.label}>Cantidad de bits para conversión binaria:</label>
            <input
              type="number"
              id="bits-input"
              className={styles.numberInput}
              value={bitsValue}
              onChange={(e) => setBitsValue(Math.max(1, parseInt(e.target.value) || 8))}
              min="1"
              max="32"
            />
          </div>
          
          <button 
            className={styles.exportButton} 
            onClick={handleExportWeights}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className={styles.spinner}></span>
                Procesando...
              </>
            ) : (
              "Extraer Pesos y Sesgos para VHDL"
            )}
          </button>
        </div>
      ) : (
        <div className={styles.noModelMessage}>
          <p>Por favor, seleccione un modelo en la pestaña "Seleccionar Arquitectura"</p>
        </div>
      )}

      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      {result && (
        <div className={styles.resultContainer}>
          <h3 className={styles.subtitle}>Archivos Generados</h3>
          <div className={styles.filesGrid}>
            {result.files.map((file, index) => (
              <div key={index} className={styles.fileCard}>
                <div className={styles.fileName}>{file}</div>
                <div className={styles.fileActions}>
                  <button 
                    className={styles.viewButton}
                    onClick={() => handleViewFile(file)}
                  >
                    Ver
                  </button>
                  <button 
                    className={styles.downloadButton}
                    onClick={() => handleDownloadFile(file)}
                  >
                    Descargar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {selectedFile && (
            <div className={styles.filePreview}>
              <h3 className={styles.subtitle}>Vista previa: {selectedFile}</h3>
              <div className={styles.codePreview}>
                <pre>{fileContent}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ModelToVHDL;