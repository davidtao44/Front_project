import { useState } from "react";
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

    // Validar que sea una imagen
    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecciona un archivo de imagen válido.");
      return;
    }

    setSelectedImage(file);
    setError(null);

    // Crear una vista previa de la imagen
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDimensionChange = (e) => {
    const { name, value } = e.target;
    setDimensions(prev => ({
      ...prev,
      [name]: parseInt(value, 10) || 32
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedImage) {
      setError("Por favor, selecciona una imagen primero.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Convertir la imagen a base64
      const reader = new FileReader();
      reader.readAsDataURL(selectedImage);
      reader.onload = async () => {
        try {
          const base64Image = reader.result;
          
          // Llamar al servicio de API
          const response = await cnnService.convertImageToVHDL(base64Image, {
            outputFormat,
            width: dimensions.width,
            height: dimensions.height
          });
          
          setResult(response);
        } catch (err) {
          setError(err.message || "Error al procesar la imagen");
        } finally {
          setLoading(false);
        }
      };
      
      reader.onerror = () => {
        setError("Error al leer el archivo de imagen");
        setLoading(false);
      };
    } catch (err) {
      setError(err.message || "Error al procesar la imagen");
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
      <h2 className={styles.title}>Convertir Imagen a VHDL</h2>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="image-input" className={styles.label}>Seleccionar Imagen:</label>
          <div className={styles.fileInputWrapper}>
            <input
              type="file"
              id="image-input"
              accept="image/*"
              onChange={handleImageChange}
              className={styles.fileInput}
            />
            <span className={styles.fileInputLabel}>
              {selectedImage ? selectedImage.name : "Seleccionar archivo..."}
            </span>
          </div>
        </div>
        
       
        
        {imagePreview && (
          <div className={styles.imagePreview}>
            <h3 className={styles.subtitle}>Vista Previa:</h3>
            <div className={styles.imageContainer}>
              <img src={imagePreview} alt="Vista previa" />
            </div>
          </div>
        )}
        
        <button 
          type="submit" 
          className={styles.submitButton} 
          disabled={loading || !selectedImage}
        >
          {loading ? (
            <>
              <span className={styles.spinner}></span>
              <span>Procesando...</span>
            </>
          ) : (
            "Convertir Imagen"
          )}
        </button>
      </form>
      
      {error && <div className={styles.errorMessage}>{error}</div>}
      
      {result && (
        <div className={styles.resultContainer}>
          <h3 className={styles.subtitle}>Resultado:</h3>
          
          <div className={styles.downloadButtons}>
            <button onClick={handleDownloadVHDL} className={styles.downloadButton}>
              <span className={styles.downloadIcon}>⬇️</span>
              Descargar Código VHDL
            </button>
            
            <button onClick={() => handleDownloadMatrix("decimal")} className={styles.downloadButton}>
              <span className={styles.downloadIcon}>⬇️</span>
              Descargar Matriz Decimal
            </button>
            
            <button onClick={() => handleDownloadMatrix("hex")} className={styles.downloadButton}>
              <span className={styles.downloadIcon}>⬇️</span>
              Descargar Matriz Hexadecimal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageToVHDL;