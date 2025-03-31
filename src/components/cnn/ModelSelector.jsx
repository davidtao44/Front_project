import { useState, useEffect } from "react";
import styles from "./ModelSelector.module.css";

const ModelSelector = ({ onSelectModel }) => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedForDeletion, setSelectedForDeletion] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState(null);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8000/list_models/");
      
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
      
      if (selectedModel && !data.models.some(model => model.path === selectedModel.path)) {
        setSelectedModel(null);
      }
    } catch (err) {
      setError("Error al cargar los modelos: " + err.message);
      console.error("Error fetching models:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectModel = (model) => {
    setSelectedModel(model);
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
      
      const response = await fetch("http://localhost:8000/delete_models/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(selectedForDeletion),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setDeleteMessage({
          type: "success",
          text: `${result.deleted_models.length} modelo(s) eliminado(s) exitosamente.`
        });
        
        // If the currently selected model was deleted, clear it
        if (selectedModel && selectedForDeletion.includes(selectedModel.path)) {
          setSelectedModel(null);
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
          text: "No se pudieron eliminar algunos modelos."
        });
      }
    } catch (err) {
      setDeleteMessage({
        type: "error",
        text: "Error al eliminar modelos: " + err.message
      });
      console.error("Error deleting models:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && models.length === 0) {
    return <div className={styles.loading}>Cargando modelos...</div>;
  }

  if (error && models.length === 0) {
    return <div className={styles.error}>{error}</div>;
  }

  if (models.length === 0) {
    return <div className={styles.empty}>No hay modelos disponibles. Crea uno primero.</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Arquitecturas Disponibles</h2>
        <div className={styles.actionButtons}>
          <button 
            className={styles.refreshButton}
            onClick={fetchModels}
            disabled={loading}
            aria-label="Actualizar lista de modelos"
          >
            <span className={styles.buttonText}>{loading ? "Cargando..." : "Actualizar"}</span>
            <span className={styles.buttonIcon}>↻</span>
          </button>
          
          <button 
            className={`${styles.deleteButton} ${selectedForDeletion.length === 0 ? styles.disabled : ''}`}
            onClick={handleDeleteSelected}
            disabled={selectedForDeletion.length === 0 || isDeleting}
            aria-label="Eliminar modelos seleccionados"
          >
            <span className={styles.buttonText}>
              {isDeleting ? "Eliminando..." : `Eliminar${selectedForDeletion.length > 0 ? ` (${selectedForDeletion.length})` : ''}`}
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
            className={`${styles.modelCard} ${selectedModel?.filename === model.filename ? styles.selected : ''}`}
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
              <p>Creado: {model.created_at}</p>
              <p>Tamaño: {model.size_kb} KB</p>
            </div>
            <div className={styles.layersInfo}>
              <h4>Capas:</h4>
              <ul className={styles.layersList}>
                {model.layers ? (
                  model.layers.map((layer, idx) => (
                    <li key={idx} className={styles.layerItem}>
                      {layer.type}: {layer.name}
                      {layer.units && ` (${layer.units} unidades)`}
                      {layer.filters && ` (${layer.filters} filtros)`}
                    </li>
                  ))
                ) : (
                  <li>Información de capas no disponible</li>
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
              {selectedModel?.filename === model.filename ? "Seleccionado" : "Seleccionar"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModelSelector;