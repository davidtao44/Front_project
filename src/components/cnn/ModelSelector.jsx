import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { API_BASE_URL } from "../../config/api";
import styles from "./ModelSelector.module.css";

const ModelSelector = ({ onSelectModel, selectedModel: externalSelectedModel, variant = "full" }) => {
  const { authenticatedFetch } = useAuth();
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [internalSelectedModel, setInternalSelectedModel] = useState(null);
  const [selectedForDeletion, setSelectedForDeletion] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState(null);

  // Sync internal state with external prop
  useEffect(() => {
    if (externalSelectedModel) {
      setInternalSelectedModel(externalSelectedModel);
    }
  }, [externalSelectedModel]);

  const currentSelectedModel = externalSelectedModel || internalSelectedModel;

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(`${API_BASE_URL}/list_models/`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setModels(data.models);
      setError(null);
      
      // Clear selected models if they no longer exist
      setSelectedForDeletion(prev => 
        prev.filter(path => data.models.some(model => model.path === path))
      );
      
      if (currentSelectedModel && !data.models.some(model => model.path === currentSelectedModel.path)) {
        setInternalSelectedModel(null);
      }
    } catch (err) {
      setError("Error loading models: " + err.message);
      console.error("Error fetching models:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectModel = (model) => {
    setInternalSelectedModel(model);
    if (onSelectModel) {
      onSelectModel(model);
    }
  };
  
  const toggleModelForDeletion = (model, event) => {
    event.stopPropagation();
    
    setSelectedForDeletion(prev => {
      if (prev.includes(model.path)) {
        return prev.filter(path => path !== model.path);
      } else {
        return [...prev, model.path];
      }
    });
  };
  
  const handleDeleteSelected = async () => {
    if (selectedForDeletion.length === 0) return;
    
    try {
      setIsDeleting(true);
      setDeleteMessage(null);
      
      const response = await authenticatedFetch(`${API_BASE_URL}/delete_models/`, {
        method: "POST",
        body: JSON.stringify(selectedForDeletion),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setDeleteMessage({
          type: "success",
          text: `${result.deleted_models.length} model(s) deleted successfully.`
        });
        
        // If the currently selected model was deleted, clear it
        if (currentSelectedModel && selectedForDeletion.includes(currentSelectedModel.path)) {
          setInternalSelectedModel(null);
          if (onSelectModel) {
            onSelectModel(null);
          }
        }
        
        // Clear selection and refresh the list
        setSelectedForDeletion([]);
        fetchModels();
      } else {
        setDeleteMessage({
          type: "error",
          text: "Some models could not be deleted."
        });
      }
    } catch (err) {
      setDeleteMessage({
        type: "error",
        text: "Error deleting models: " + err.message
      });
      console.error("Error deleting models:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && models.length === 0) {
    return <div className={styles.loading}>Loading models...</div>;
  }

  if (error && models.length === 0) {
    return <div className={styles.error}>{error}</div>;
  }

  if (models.length === 0) {
    return <div className={styles.empty}>No models available. Create one first.</div>;
  }

  if (variant === "compact") {
    return (
      <select
        className={styles.compactSelect}
        value={currentSelectedModel?.path || ""}
        onChange={(e) => {
          const selected = models.find(m => m.path === e.target.value);
          handleSelectModel(selected);
        }}
        disabled={loading}
      >
        <option value="" disabled>Select a model...</option>
        {models.map((model, index) => (
          <option key={index} value={model.path}>
            {model.filename}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Available Architectures</h2>
        <div className={styles.actionButtons}>
          <button 
            className={styles.refreshButton}
            onClick={fetchModels}
            disabled={loading}
            aria-label="Refresh models list"
          >
            <span className={styles.buttonText}>{loading ? "Loading..." : "Refresh"}</span>
            <span className={styles.buttonIcon}>↻</span>
          </button>
          
          <button 
            className={`${styles.deleteButton} ${selectedForDeletion.length === 0 ? styles.disabled : ''}`}
            onClick={handleDeleteSelected}
            disabled={selectedForDeletion.length === 0 || isDeleting}
            aria-label="Delete selected models"
          >
            <span className={styles.buttonText}>
              {isDeleting ? "Deleting..." : `Delete${selectedForDeletion.length > 0 ? ` (${selectedForDeletion.length})` : ''}`}
            </span>
            <span className={styles.buttonIcon}>🗑️</span>
          </button>
        </div>
      </div>
      
      {deleteMessage && (
        <div className={`${styles.message} ${styles[deleteMessage.type]}`}>
          {deleteMessage.text}
        </div>
      )}
      
      <div className={styles.modelGrid}>
        {models.map((model, index) => (
          <div 
            key={index} 
            className={`${styles.modelCard} ${currentSelectedModel?.path === model.path ? styles.selected : ''}`}
            onClick={() => handleSelectModel(model)}
          >
            <div className={styles.cardHeader}>
              <h3 className={styles.modelName}>{model.filename}</h3>
              <label className={styles.checkboxContainer}>
                <input
                  type="checkbox"
                  checked={selectedForDeletion.includes(model.path)}
                  onChange={(e) => toggleModelForDeletion(model, e)}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className={styles.checkmark}></span>
              </label>
            </div>
            
            <div className={styles.modelInfo}>
              <p>Created: {model.created_at}</p>
              <p>Size: {model.size_kb} KB</p>
            </div>
            <div className={styles.layersInfo}>
              <h4>Layers:</h4>
              <ul className={styles.layersList}>
                {model.layers ? (
                  model.layers.map((layer, idx) => (
                    <li key={idx} className={styles.layerItem}>
                      {layer.type}: {layer.name}
                      {layer.units && ` (${layer.units} units)`}
                      {layer.filters && ` (${layer.filters} filters)`}
                    </li>
                  ))
                ) : (
                  <li>Layer information not available</li>
                )}
              </ul>
            </div>
            <button 
              className={styles.selectButton}
              onClick={(e) => {
                e.stopPropagation();
                handleSelectModel(model);
              }}
            >
              {currentSelectedModel?.path === model.path ? "Selected" : "Select"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModelSelector;