import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Header from "./components/Header";

import ModelUpload from "./components/ModelUpload";
import FaultInjectorCard from "./components/FaultInjectorCard";
import VHDLToolsCard from "./components/VHDLToolsCard";
import FaultInjector from './pages/FaultInjector';
import VHDLTools from './pages/VHDLTools';
import "./App.css";

const HomePage = () => {
  const [selectedModel, setSelectedModel] = useState(null);
  const navigate = useNavigate();

  const handleSelectModel = (model) => {
    setSelectedModel(model);
    console.log("Modelo seleccionado:", model);
  };

  const handleFaultInjectorClick = () => {
    navigate('/fault-injector');
  };

  const handleVHDLToolsClick = () => {
    navigate('/vhdl-tools');
  };

  return (
    <div className="app-container">
      <Header />
      
      {/* Model Upload Section */}
      <div className="model-upload-section">
        <div className="container">
          <h2 className="section-title">Subir Modelos CNN Pre-entrenados</h2>
          <ModelUpload />
        </div>
      </div>
      
      {/* Feature Cards Section */}
      <div className="feature-cards-section">
        <div className="container">
          <h2 className="section-title">Herramientas Disponibles</h2>
          <div className="cards-grid">
            <FaultInjectorCard onClick={handleFaultInjectorClick} />
            <VHDLToolsCard onClick={handleVHDLToolsClick} />
          </div>
        </div>
      </div>
      

    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <Router>
          <Routes>
             <Route path="/" element={<HomePage />} />
             <Route path="/fault-injector" element={<FaultInjector />} />
             <Route path="/vhdl-tools" element={<VHDLTools />} />
           </Routes>
        </Router>
      </ProtectedRoute>
    </AuthProvider>
  );
};

export default App;
