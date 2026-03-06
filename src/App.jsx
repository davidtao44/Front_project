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
import "./pages/HomePage.css"; // Importar estilos específicos

import { UploadCloud, Cpu } from "lucide-react";

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
    <div className="home-container">
      <Header />
      
      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            GIRA <br />
            <span>crosslayer-FI</span>
          </h1>
          <p className="hero-subtitle">
            Plataforma integral para la inyección de fallos, evaluación de confiabilidad 
            y generación automática de descripciones VHDL para CNN Lenet-5.
          </p>
          
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-value">CNN</span>
              <span className="stat-label">Arquitecturas</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">FI</span>
              <span className="stat-label">Fault Injection</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">VHDL</span>
              <span className="stat-label">Generación HW</span>
            </div>
          </div>
        </div>
      </section>

      {/* DASHBOARD GRID */}
      <section className="dashboard-section">
        <div className="dashboard-grid">
          
          {/* Columna Izquierda: Gestión de Modelos */}
          <div className="models-column">
            <div className="section-header">
              <h3>
                <UploadCloud size={24} />
                Trained Model Importer Module
              </h3>
              <p className="section-desc">Sube tus arquitecturas pre-entrenadas para comenzar el análisis.</p>
            </div>
            <ModelUpload />
          </div>

          {/* Columna Derecha: Herramientas Principales */}
          <div className="tools-column">
            <div className="section-header">
              <h3>
                <Cpu size={24} />
                Herramientas de Análisis
              </h3>
              <p className="section-desc">Selecciona una herramienta para evaluar la robustez o generar hardware.</p>
            </div>
            
            <div className="tools-grid">
              <div onClick={handleFaultInjectorClick}>
                <FaultInjectorCard />
              </div>
              <div onClick={handleVHDLToolsClick}>
                <VHDLToolsCard />
              </div>
            </div>

          </div>
        </div>
      </section>
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
