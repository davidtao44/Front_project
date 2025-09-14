import { useState } from 'react';
import Header from '../components/Header';
import ModelSelector from '../components/cnn/ModelSelector';
import ImageToVHDL from '../components/cnn/ImageToVHDL';
import ModelToVHDL from '../components/cnn/ModelToVHDL';
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VHDLTools;