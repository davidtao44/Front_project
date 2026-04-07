import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { buildUrl } from '../config/api';
import { UploadCloud, File, X, CheckCircle, AlertCircle } from 'lucide-react';
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
      alert('Please upload only model files (.h5 or .keras)');
    }
  };

  const uploadFiles = async (files) => {
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
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
        throw new Error(errorData.detail || 'Error uploading the file');
        }

        const result = await response.json();
        
        setUploadedFiles(prev => [...prev, {
          ...result.model_info,
          originalFile: file
        }]);
        
        setUploadProgress(((i + 1) / files.length) * 100);
      }
      
      alert('Models uploaded successfully');
    } catch (error) {
      console.error('Error uploading files:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="model-upload-container">
      <div 
        className={`upload-dropzone ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          id="file-upload" 
          multiple 
          onChange={handleChange}
          accept=".h5,.keras"
          className="file-input"
        />
        <label htmlFor="file-upload" className="upload-label">
          <UploadCloud size={48} className="upload-icon" />
          <p className="upload-text">Drag your models here or click to select</p>
          <span className="upload-hint">Supports .h5 and .keras files</span>
        </label>
      </div>

      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p>Uploading models... {Math.round(uploadProgress)}%</p>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="uploaded-files-list">
          <h4>Uploaded Models</h4>
          <ul>
            {uploadedFiles.map((file, index) => (
              <li key={index} className="file-item">
                <File size={20} className="file-icon" />
                <span className="file-name">{file.originalFile?.name || file.name}</span>
                <button 
                  onClick={() => removeFile(index)}
                  className="remove-file-btn"
                  title="Remove"
                >
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ModelUpload;