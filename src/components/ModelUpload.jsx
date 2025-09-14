import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { buildUrl } from '../config/api';
import './ModelUpload.css';

const ModelUpload = () => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => 
      file.name.endsWith('.h5') || file.name.endsWith('.keras')
    );
    
    if (validFiles.length > 0) {
      uploadFiles(validFiles);
    } else {
      alert('Por favor, sube solo archivos de modelos (.h5 o .keras)');
    }
  };

  const uploadFiles = async (files) => {
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(buildUrl('/upload_model/'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Error al subir el archivo');
        }

        const result = await response.json();
        
        setUploadedFiles(prev => [...prev, {
          ...result.model_info,
          originalFile: file
        }]);
        
        setUploadProgress(((i + 1) / files.length) * 100);
      }
      
      alert('Modelos subidos exitosamente');
    } catch (error) {
      console.error('Error al subir archivos:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="model-upload-container">
      <h2>📁 Subir Modelos CNN Preentrenados</h2>
      
      <div 
        className={`upload-area ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          multiple
          accept=".h5,.keras"
          onChange={handleChange}
          style={{ display: 'none' }}
        />
        
        <div className="upload-content">
          <div className="upload-icon">🤖</div>
          <p className="upload-text">
            Arrastra y suelta tus modelos aquí o{' '}
            <label htmlFor="file-upload" className="upload-link">
              selecciona archivos
            </label>
          </p>
          <p className="upload-subtitle">
            Formatos soportados: .h5, .keras
          </p>
        </div>
      </div>

      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p>Subiendo modelos... {Math.round(uploadProgress)}%</p>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="uploaded-files">
          <h3>✅ Modelos subidos:</h3>
          <div className="file-list">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="file-item">
                <div className="file-info">
                  <span className="file-name">{file.name}</span>
                  <div className="file-details">
                    <span className="file-size">
                      {formatFileSize(file.originalFile?.size || 0)}
                    </span>
                    <span className="file-layers">
                      {file.layers} capas
                    </span>
                    <span className="file-params">
                      {file.parameters?.toLocaleString()} parámetros
                    </span>
                  </div>
                </div>
                <button 
                  className="remove-btn"
                  onClick={() => removeFile(index)}
                  title="Eliminar de la lista"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelUpload;