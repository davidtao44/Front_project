import { useState } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Header from "./components/Header";
import ModelSelector from "./components/cnn/ModelSelector";
import ImageToVHDL from "./components/cnn/ImageToVHDL";
import ModelToVHDL from "./components/cnn/ModelToVHDL";
import "./App.css";

const AppContent = () => {
  const [selectedModel, setSelectedModel] = useState(null);
  const [activeTab, setActiveTab] = useState("select");

  const handleSelectModel = (model) => {
    setSelectedModel(model);
    console.log("Modelo seleccionado:", model);
  };

  return (
    <div className="app-container">
      <Header />
      
      <div style={{ padding: '0 30px 30px 30px' }}>
        <div className="tabs">
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
