import { useState } from "react";
import CNNConfigurator from "./components/cnn/CNNconfigurator";
import ModelSelector from "./components/cnn/ModelSelector";
import ImageToVHDL from "./components/cnn/ImageToVHDL";
import { useCNN } from "./hooks/useCNN";
import "./App.css";

const App = () => {
  const { createCNN, loading, error, result } = useCNN();
  const [selectedModel, setSelectedModel] = useState(null);
  const [activeTab, setActiveTab] = useState("create"); // "create", "select" o "image"

  const handleSubmit = async (config) => {
    try {
      await createCNN(config);
      console.log("Modelo creado:", result);
      // Switch to select tab after creating a model
      setActiveTab("select");
    } catch (err) {
      // El error ya está manejado en el hook
    }
  };

  const handleSelectModel = (model) => {
    setSelectedModel(model);
    console.log("Modelo seleccionado:", model);
  };

  return (
    <div className="app-container">
      <h1 className="app-title" style={{ textAlign: 'center' }}>Generador de CNN</h1>
      
      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}
      
      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === "create" ? "active" : ""}`}
          onClick={() => setActiveTab("create")}
        >
          Crear Modelo
        </button>
        <button 
          className={`tab-button ${activeTab === "select" ? "active" : ""}`}
          onClick={() => setActiveTab("select")}
        >
          Seleccionar Arquitectura
        </button>
        <button 
          className={`tab-button ${activeTab === "image" ? "active" : ""}`}
          onClick={() => setActiveTab("image")}
        >
          Imagen a VHDL
        </button>
      </div>
      
      {activeTab === "create" && (
        <CNNConfigurator onSubmit={handleSubmit} isLoading={loading} />
      )}
      
      {activeTab === "select" && (
        <ModelSelector onSelectModel={handleSelectModel} />
      )}
      
      {activeTab === "image" && (
        <ImageToVHDL />
      )}
      
      {selectedModel && activeTab === "select" && (
        <div className="selected-model-info">
          <h3>Modelo Seleccionado para Entrenamiento</h3>
          <p>{selectedModel.filename}</p>
          <button className="train-button">
            Entrenar Modelo
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
