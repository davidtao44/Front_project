import { useState } from "react";
import { 
  UploadCloud, 
  Image as ImageIcon, 
  Terminal, 
  FileCode, 
  RotateCcw,
  Cpu,
  Download,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { cnnService } from "../../services/api";
import styles from "./ImageToVHDL.module.css";

const ImageToVHDL = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [outputFormat, setOutputFormat] = useState("hex");
  const [dimensions, setDimensions] = useState({ width: 32, height: 32 });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    setSelectedImage(file);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setError(null);
    setResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedImage) {
      setError("Please select an image first.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const reader = new FileReader();
      reader.readAsDataURL(selectedImage);
      reader.onload = async () => {
        try {
          const base64Image = reader.result;
          const response = await cnnService.convertImageToVHDL(base64Image, {
            outputFormat,
            width: dimensions.width,
            height: dimensions.height
          });
          setResult(response);
        } catch (err) {
          setError(err.message || "Error processing the image");
        } finally {
          setLoading(false);
        }
      };
      
      reader.onerror = () => {
        setError("Error reading the image file");
        setLoading(false);
      };
    } catch (err) {
      setError(err.message || "Error processing the image");
      setLoading(false);
    }
  };

  const downloadFile = (content, filename, contentType) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadVHDL = () => {
    if (!result || !result.vhdl_code) return;
    downloadFile(result.vhdl_code, "image_rom.vhd", "text/plain");
  };

  const handleDownloadMatrix = (format) => {
    if (!result) return;
    
    let content = "";
    let filename = "";
    
    if (format === "decimal") {
      content = result.decimal_matrix.map(row => row.join(",")).join("\n");
      filename = "decimal_matrix.csv";
    } else if (format === "hex") {
      content = result.hex_matrix.map(row => row.join(",")).join("\n");
      filename = "hex_matrix.csv";
    }
    
    downloadFile(content, filename, "text/csv");
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerIcon}>
          <Cpu size={24} />
        </div>
        <h2 className={styles.title}>Convert Image to VHDL</h2>
      </header>

      <p className={styles.description}>
        Transform images into VHDL-compatible hardware files (ROM) or data matrices for simulation.
      </p>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.uploadSection}>
          <div className={styles.fileInputWrapper}>
            <input
              type="file"
              id="image-input"
              accept="image/*"
              onChange={handleImageChange}
              className={styles.fileInput}
            />
            <label htmlFor="image-input" className={styles.dropzone}>
              <UploadCloud size={48} className={styles.uploadIcon} />
              <div className={styles.dropzoneText}>
                {selectedImage ? (
                  <span className={styles.fileName}>{selectedImage.name}</span>
                ) : (
                  <>
                    <span className={styles.mainText}>Select Image</span>
                    <span className={styles.subText}>Drag and drop or click to upload</span>
                  </>
                )}
              </div>
            </label>
          </div>
          
          {imagePreview && (
            <div className={styles.previewCard}>
              <div className={styles.previewHeader}>
                <ImageIcon size={18} />
                <span>Preview</span>
              </div>
              <div className={styles.imageContainer}>
                <img src={imagePreview} alt="Preview" className={styles.previewImage} />
              </div>
              <button type="button" onClick={handleReset} className={styles.resetButton}>
                <RotateCcw size={14} />
                Reset
              </button>
            </div>
          )}
        </div>
        
        <div className={styles.actionArea}>
          <button 
            type="submit" 
            className={styles.submitButton} 
            disabled={loading || !selectedImage}
          >
            {loading ? (
              <>
                <div className={styles.spinner}></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Terminal size={20} />
                <span>Generate VHDL Code</span>
              </>
            )}
          </button>
        </div>
      </form>
      
      {error && (
        <div className={styles.errorMessage}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}
      
      {result && (
        <div className={styles.resultContainer}>
          <div className={styles.resultHeader}>
            <CheckCircle2 size={24} className={styles.successIcon} />
            <h3 className={styles.subtitle}>Conversion Successful!</h3>
          </div>
          
          <p className={styles.resultHint}>Select the formats you want to download:</p>
          
          <div className={styles.downloadGrid}>
            <button onClick={handleDownloadVHDL} className={styles.downloadButton}>
              <div className={styles.downloadIconWrapper}>
                <FileCode size={24} />
              </div>
              <div className={styles.downloadText}>
                <span className={styles.downloadLabel}>VHDL Code</span>
                <span className={styles.downloadSublabel}>image_rom.vhd</span>
              </div>
              <Download size={20} className={styles.downloadArrow} />
            </button>
            
            <button onClick={() => handleDownloadMatrix("decimal")} className={styles.downloadButton}>
              <div className={styles.downloadIconWrapper}>
                <span className={styles.matrixType}>10</span>
              </div>
              <div className={styles.downloadText}>
                <span className={styles.downloadLabel}>Decimal Matrix</span>
                <span className={styles.downloadSublabel}>decimal_matrix.csv</span>
              </div>
              <Download size={20} className={styles.downloadArrow} />
            </button>
            
            <button onClick={() => handleDownloadMatrix("hex")} className={styles.downloadButton}>
              <div className={styles.downloadIconWrapper}>
                <span className={styles.matrixType}>16</span>
              </div>
              <div className={styles.downloadText}>
                <span className={styles.downloadLabel}>Hex Matrix</span>
                <span className={styles.downloadSublabel}>hex_matrix.csv</span>
              </div>
              <Download size={20} className={styles.downloadArrow} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageToVHDL;