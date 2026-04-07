import { useState } from "react";
import { 
  Cpu, 
  FileCode, 
  Terminal, 
  Settings, 
  AlertCircle, 
  CheckCircle2, 
  Download, 
  Eye,
  Layers,
  FileJson,
  Activity,
  ChevronRight
} from "lucide-react";
import { cnnService } from "../../services/api";
import styles from "./ModelToVHDL.module.css";

const ModelToVHDL = ({ selectedModel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [bitsValue, setBitsValue] = useState(8);

  const handleExportWeights = async () => {
    if (!selectedModel) {
      setError("Please select a model first");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await cnnService.exportModelWeights(selectedModel.path, bitsValue);
      setResult(response);
    } catch (err) {
      setError(err.message || "Error exporting model weights");
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
      setError(err.message || "Error downloading the file");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFile = async (filePath) => {
    try {
      const fullPath = `${result.output_dir}/${filePath}`;
      const response = await cnnService.downloadFile(fullPath);
      
      const blob = new Blob([response.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filePath;
      document.body.appendChild(a);
      a.click();
      
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message || "Error downloading the file");
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerIcon}>
          <Layers size={24} />
        </div>
        <h2 className={styles.title}>Export Model to VHDL</h2>
      </header>

      <p className={styles.description}>
        Extract trained parameters (weights and biases) from your model and generate the necessary VHDL files for hardware implementation.
      </p>
      
      {selectedModel ? (
        <div className={styles.configArea}>
            <div className={styles.modelStatus}>
            <div className={styles.statusLabel}>
              <Activity size={16} />
              <span>Active Model</span>
            </div>
            <div className={styles.modelDetail}>
              <FileJson size={18} />
              <span className={styles.modelName}>{selectedModel.filename}</span>
            </div>
          </div>
          
          <div className={styles.settingsGrid}>
            <div className={styles.settingsGroup}>
              <div className={styles.settingsHeader}>
                <Settings size={18} />
                <label htmlFor="bits-input" className={styles.label}>Bit Precision</label>
              </div>
              <div className={styles.inputWrapper}>
                <input
                  type="number"
                  id="bits-input"
                  className={styles.numberInput}
                  value={bitsValue}
                  onChange={(e) => setBitsValue(Math.max(1, parseInt(e.target.value) || 8))}
                  min="1"
                  max="32"
                />
                <span className={styles.inputBadge}>bits</span>
              </div>
              <p className={styles.inputHelp}>Define how many bits will be used to represent binary values.</p>
            </div>
          </div>
          
          <div className={styles.actionArea}>
            <button 
              className={styles.exportButton} 
              onClick={handleExportWeights}
              disabled={loading}
            >
            {loading ? (
              <>
                <div className={styles.spinner}></div>
                <span>Generating Files...</span>
              </>
            ) : (
              <>
                <Terminal size={18} />
                <span>Extract VHDL Parameters</span>
              </>
            )}
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.noModelCard}>
          <AlertCircle size={40} className={styles.warningIcon} />
          <h3>No model selected</h3>
          <p>Go to the <strong>"Select Architecture"</strong> tab to choose a model before exporting.</p>
        </div>
      )}

      {error && (
        <div className={styles.errorMessage}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className={styles.resultSection}>
          <div className={styles.sectionHeader}>
            <CheckCircle2 size={24} className={styles.successIcon} />
            <h3 className={styles.subtitle}>Files Generated Successfully</h3>
          </div>
          
          <div className={styles.filesGrid}>
            {result.files.map((file, index) => (
              <div key={index} className={styles.fileCard}>
                <div className={styles.fileCardTop}>
                  <div className={styles.fileIcon}>
                    <FileCode size={20} />
                  </div>
                  <span className={styles.fileNameText}>{file}</span>
                </div>
                <div className={styles.fileActions}>
                  <button 
                    className={styles.inlineButton}
                    onClick={() => handleViewFile(file)}
                    title="Preview"
                  >
                    <Eye size={16} />
                    <span>View</span>
                  </button>
                  <button 
                    className={styles.inlineButtonPrimary}
                    onClick={() => handleDownloadFile(file)}
                    title="Download"
                  >
                    <Download size={16} />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {selectedFile && (
            <div className={styles.previewContainer}>
              <div className={styles.previewHeader}>
                <div className={styles.previewTitle}>
                  <Terminal size={16} />
                  <span>Preview: {selectedFile}</span>
                </div>
                <button className={styles.closePreview} onClick={() => setSelectedFile(null)}>Esc</button>
              </div>
              <div className={styles.codeArea}>
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