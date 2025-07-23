import { useState } from "react";
import CNNConfigurator from "./components/cnn/CNNconfigurator";
import ModelSelector from "./components/cnn/ModelSelector";
import ImageToVHDL from "./components/cnn/ImageToVHDL";
import ModelToVHDL from "./components/cnn/ModelToVHDL"; // Importar el nuevo componente
import { useCNN } from "./hooks/useCNN";
import "./App.css";

const App = () => {
  const { createCNN, loading, error, result } = useCNN();
  const [selectedModel, setSelectedModel] = useState(null);
  const [activeTab, setActiveTab] = useState("create"); // "create", "select", "image" o "vhdl"

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
      <header className="app-header">
        <img 
          src="/Logo_de_la_UPTC.svg.png" 
          alt="Logo UPTC" 
          className="header-logo header-logo-left"
        />
        <h1 className="app-title">Generador de CNN</h1>
        <img 
          src="/logo_gira.png" 
          alt="Logo GIRA" 
          className="header-logo header-logo-right"
        />
      </header>
      
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
        <button 
          className={`tab-button ${activeTab === "vhdl" ? "active" : ""}`}
          onClick={() => setActiveTab("vhdl")}
        >
          Modelo a VHDL
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === "create" && (
          <CNNConfigurator onSubmit={handleSubmit} isLoading={loading} />
        )}
        
        {activeTab === "select" && (
          <ModelSelector onSelectModel={handleSelectModel} selectedModel={selectedModel} />
        )}
        
        {activeTab === "image" && (
          <ImageToVHDL />
        )}
        
        {activeTab === "vhdl" && (
          <ModelToVHDL selectedModel={selectedModel} />
        )}
      </div>
    </div>
  );
};

export default App;
