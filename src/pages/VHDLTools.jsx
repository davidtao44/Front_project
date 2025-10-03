import { useState } from 'react';
import Header from '../components/Header';
import ModelSelector from '../components/cnn/ModelSelector';
import ImageToVHDL from '../components/cnn/ImageToVHDL';
import ModelToVHDL from '../components/cnn/ModelToVHDL';
import HardwareFaultInjection from '../components/HardwareFaultInjection';
import './VHDLTools.css';

const VHDLTools = () => {
  const [selectedModel, setSelectedModel] = useState(null);
  const [activeTab, setActiveTab] = useState('select');

  const handleSelectModel = (model) => {
    setSelectedModel(model);
  };

  return (
    <div className="vhdl-tools-page">
      <Header />
      
      <div className="vhdl-tools-container">
        <div className="page-header">
          <h1 className="page-title">
            <span className="title-icon">🔧</span>
            VHDL Tools
          </h1>
          <p className="page-subtitle">
            Conjunto de herramientas para la conversión y extracción de datos de redes neuronales a formato VHDL
          </p>
        </div>
        
        <div className="tools-content">
          <div className="tools-tabs">
            <div className="tab-buttons">
              <button 
                className={`tab-button ${activeTab === 'select' ? 'active' : ''}`}
                onClick={() => setActiveTab('select')}
              >
                <span className="tab-icon">🎛️</span>
                Seleccionar Arquitectura
              </button>
              <button 
                className={`tab-button ${activeTab === 'image' ? 'active' : ''}`}
                onClick={() => setActiveTab('image')}
              >
                <span className="tab-icon">🖼️</span>
                Imagen a VHDL
              </button>
              <button 
                className={`tab-button ${activeTab === 'vhdl' ? 'active' : ''}`}
                onClick={() => setActiveTab('vhdl')}
              >
                <span className="tab-icon">⚖️</span>
                Modelo a VHDL
              </button>
              <button 
                className={`tab-button ${activeTab === 'hardware-fault' ? 'active' : ''}`}
                onClick={() => setActiveTab('hardware-fault')}
              >
                <span className="tab-icon">🔥</span>
                Hardware Fault Injection
              </button>
            </div>
            
            <div className="tab-content">
              {activeTab === 'select' && (
                <div className="tab-panel">
                  <h3 className="panel-title">Seleccionar Modelo CNN</h3>
                  <p className="panel-description">
                    Selecciona un modelo de red neuronal convolucional para trabajar con las herramientas VHDL.
                  </p>
                  <ModelSelector 
                    selectedModel={selectedModel} 
                    onSelectModel={handleSelectModel} 
                  />
                </div>
              )}
              
              {activeTab === 'image' && (
                <div className="tab-panel">
                  <h3 className="panel-title">Conversión de Imagen a VHDL</h3>
                  <p className="panel-description">
                    Convierte imágenes de entrada en código VHDL para procesamiento en hardware.
                  </p>
                  <ImageToVHDL selectedModel={selectedModel} />
                </div>
              )}
              
              {activeTab === 'vhdl' && (
                <div className="tab-panel">
                  <h3 className="panel-title">Extracción de Pesos y Bias</h3>
                  <p className="panel-description">
                    Extrae los pesos y bias del modelo seleccionado y genera código VHDL correspondiente.
                  </p>
                  <ModelToVHDL selectedModel={selectedModel} />
                </div>
              )}
              
              {activeTab === 'hardware-fault' && (
                <div className="tab-panel">
                  <h3 className="panel-title">Inyección de Fallos en Hardware</h3>
                  <p className="panel-description">
                    Inyecta fallos en archivos VHDL de la primera capa convolucional (FMAP_1 a FMAP_6 y BIAS_VAL_1 a BIAS_VAL_6) y ejecuta simulaciones en Vivado.
                  </p>
                  <HardwareFaultInjection />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VHDLTools;