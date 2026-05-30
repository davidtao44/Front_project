import { useState, useRef, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Header from "./components/Header";

import ModelUpload from "./components/ModelUpload";
import FaultInjectorCard from "./components/FaultInjectorCard";
import VHDLToolsCard from "./components/VHDLToolsCard";
import CNNStudioCard from "./components/CNNStudioCard";
import StatsCarousel from "./components/StatsCarousel";
import FaultInjector from './pages/FaultInjector';
import VHDLTools from './pages/VHDLTools';
import SAIHistory from './pages/SAIHistory';
import CNNStudio from './pages/CNNStudio';
import "./App.css";
import "./pages/HomePage.css";

import { UploadCloud, Cpu } from "lucide-react";

const HomePage = () => {
  const [selectedModel, setSelectedModel] = useState(null);
  const navigate = useNavigate();
  const dashboardRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.1 });

    if (dashboardRef.current) {
      observer.observe(dashboardRef.current);
    }

    return () => {
      if (dashboardRef.current) {
        observer.unobserve(dashboardRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const toolCards = document.querySelectorAll('.tools-grid > div');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    toolCards.forEach(card => {
      observer.observe(card);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleSelectModel = (model) => {
    setSelectedModel(model);
    console.log("Model selected:", model);
  };

  const handleFaultInjectorClick = () => {
    navigate('/fault-injector');
  };

  const handleVHDLToolsClick = () => {
    navigate('/vhdl-tools');
  };

  const handleCNNStudioClick = () => {
    navigate('/cnn-studio');
  };

  return (
    <div className="home-container">
      <Header />

      {/* HERO SECTION - Improved */}
      <section className="hero-section">
        <div className="hero-content">
          <div>
            <h1 className="hero-title">
              HURA
              <span>framework</span>
            </h1>
            <p className="hero-subtitle">
              Comprehensive platform for fault injection, reliability assessment
              and automatic VHDL code generation for LeNet-5 CNNs.
            </p>
          </div>

          <div className="hero-stats">
            <StatsCarousel />
          </div>
        </div>
      </section>

      {/* DASHBOARD GRID - Two Column Layout */}
      <section className="dashboard-section" ref={dashboardRef}>
        <div className="dashboard-grid">

          {/* Left Column: Model Management */}
          <div className="models-column">
            <div className="section-header">
              <h3>
                <UploadCloud size={28} />
                Model Manager
              </h3>
              <p className="section-desc">
                Upload pre-trained CNN models to begin your analysis. Supported formats: .h5 and .keras
              </p>
            </div>
            <ModelUpload />
          </div>

          {/* Right Column: Analysis Tools */}
          <div className="tools-column">
            <div className="section-header">
              <h3>
                <Cpu size={28} />
                Analysis Tools
              </h3>
              <p className="section-desc">
                Choose a tool to evaluate robustness, inject faults, or generate hardware implementations.
              </p>
            </div>

            <div className="tools-grid">
              <div onClick={handleFaultInjectorClick} style={{ cursor: 'pointer' }}>
                <FaultInjectorCard />
              </div>
              <div onClick={handleVHDLToolsClick} style={{ cursor: 'pointer' }}>
                <VHDLToolsCard />
              </div>
              <div onClick={handleCNNStudioClick} style={{ cursor: 'pointer' }}>
                <CNNStudioCard />
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
             <Route path="/sai-history" element={<SAIHistory />} />
             <Route path="/cnn-studio" element={<CNNStudio />} />
           </Routes>
        </Router>
      </ProtectedRoute>
    </AuthProvider>
  );
};

export default App;
