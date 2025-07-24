import { useState } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Header from "./components/Header";
import CNNConfigurator from "./components/cnn/CNNconfigurator";
import ModelSelector from "./components/cnn/ModelSelector";
import ImageToVHDL from "./components/cnn/ImageToVHDL";
import ModelToVHDL from "./components/cnn/ModelToVHDL";
import { useCNN } from "./hooks/useCNN";
import "./App.css";

const AppContent = () => {
  const { createCNN, loading, error, result } = useCNN();
  const [selectedModel, setSelectedModel] = useState(null);
  const [activeTab, setActiveTab] = useState("create");

  const handleSubmit = async (config) => {
    try {
      await createCNN(config);
      console.log("Modelo creado:", result);
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
      <Header />
      
      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}
      
      <div style={{ padding: '0 30px 30px 30px' }}>
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
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AppContent />
      </ProtectedRoute>
    </AuthProvider>
  );
};

export default App;
