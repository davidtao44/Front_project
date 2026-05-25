import { useState } from 'react';
import {
  Cpu,
  LayoutGrid,
  Image,
  Scale,
  Zap,
  Flame,
  Microchip
} from 'lucide-react';
import Header from '../components/Header';
import ModelSelector from '../components/cnn/ModelSelector';
import ImageToVHDL from '../components/cnn/ImageToVHDL';
import ModelToVHDL from '../components/cnn/ModelToVHDL';
import HLSSynthesis from '../components/cnn/HLSSynthesis';
import GoldenSimulationHardware from '../components/GoldenSimulationHardware';
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
          <div className="header-content">
            <div className="header-text">
              <h1 className="page-title">
                <span className="title-icon"><Cpu size={32} /></span>
                Hardware Interoperability Module
              </h1>
                <p className="page-subtitle">
                Set of tools for the conversion and data extraction DNNs to VHDL format
              </p>
              {/* <div className="architecture-info">
                  <span className="architecture-badge">🎯 Optimized for LeNet-5</span>
                  <p className="architecture-description">
                    These tools are specifically designed to work with the LeNet-5 architecture
                  </p>
              </div> */}
            </div>
            <div className="header-image">
                <img 
                  src="/LeNet-5.png" 
                  alt="LeNet-5 Architecture" 
                  className="lenet-architecture-image"
                />
                <p className="image-caption">DNN Architecture</p>
            </div>
          </div>
        </div>
        
        <div className="tools-content">
          <div className="tools-tabs">
            <div className="tab-buttons">
              <button 
                className={`tab-button ${activeTab === 'select' ? 'active' : ''}`}
                onClick={() => setActiveTab('select')}
              >
                <span className="tab-icon"><LayoutGrid size={18} /></span>
                Select Architecture
              </button>
              <button 
                className={`tab-button ${activeTab === 'image' ? 'active' : ''}`}
                onClick={() => setActiveTab('image')}
              >
                <span className="tab-icon"><Image size={18} /></span>
                Image to VHDL
              </button>
              <button
                className={`tab-button ${activeTab === 'vhdl' ? 'active' : ''}`}
                onClick={() => setActiveTab('vhdl')}
              >
                <span className="tab-icon"><Scale size={18} /></span>
                Model to VHDL
              </button>
              <button
                className={`tab-button ${activeTab === 'hls-synthesis' ? 'active' : ''}`}
                onClick={() => setActiveTab('hls-synthesis')}
              >
                <span className="tab-icon"><Microchip size={18} /></span>
                HLS Synthesis
              </button>
              <button
                className={`tab-button ${activeTab === 'golden-simulation' ? 'active' : ''}`}
                onClick={() => setActiveTab('golden-simulation')}
              >
                <span className="tab-icon"><Zap size={18} /></span>
                Golden Simulation Hardware
              </button>
              <button 
                className={`tab-button ${activeTab === 'hardware-fault' ? 'active' : ''}`}
                onClick={() => setActiveTab('hardware-fault')}
              >
                <span className="tab-icon"><Flame size={18} /></span>
                Hardware Fault Injection
              </button>
            </div>
            
            <div className="tab-content">
              {activeTab === 'select' && (
                <div className="tab-panel">
                  <h3 className="panel-title">Select CNN Model</h3>
                  <p className="panel-description">
                    Select a convolutional neural network model to work with VHDL tools.
                  </p>
                  <ModelSelector 
                    selectedModel={selectedModel} 
                    onSelectModel={handleSelectModel} 
                  />
                </div>
              )}
              
              {activeTab === 'image' && (
                <div className="tab-panel">
                  <h3 className="panel-title">Image to VHDL Conversion</h3>
                  <p className="panel-description">
                    Convert input images into VHDL code for hardware processing.
                  </p>
                  <ImageToVHDL selectedModel={selectedModel} />
                </div>
              )}
              
              {activeTab === 'vhdl' && (
                <div className="tab-panel">
                  <h3 className="panel-title">Weights and Bias Extraction</h3>
                  <p className="panel-description">
                    Extract the weights and bias from the selected model and generate corresponding VHDL code.
                  </p>
                  <ModelToVHDL selectedModel={selectedModel} />
                </div>
              )}
              
              {activeTab === 'hls-synthesis' && (
                <div className="tab-panel">
                  <h3 className="panel-title">HLS Hardware Synthesis</h3>
                  <p className="panel-description">
                    Convert a trained CNN model to a synthesizable HLS project for FPGA deployment.
                    Step 1 quantizes weights to fixed-point format (ap_fixed) so you can validate
                    precision loss before synthesis. Step 2 generates the HLS C++ project via hls4ml,
                    ready for Vivado HLS / Vitis HLS.
                  </p>
                  <HLSSynthesis selectedModel={selectedModel} />
                </div>
              )}

              {activeTab === 'golden-simulation' && (
                <div className="tab-panel">
                  <h3 className="panel-title">Golden Hardware Simulation</h3>
                  <p className="panel-description">
                    Run the simulation with the original (golden) FMAP and BIAS values to establish a baseline before fault injection.
                  </p>
                  <GoldenSimulationHardware />
                </div>
              )}
              
              {activeTab === 'hardware-fault' && (
                <div className="tab-panel">
                  <h3 className="panel-title">Hardware Fault Injection</h3>
                  <p className="panel-description">
                    Inject faults into VHDL files of the first convolutional layer (FMAP_1 to FMAP_6 and BIAS_VAL_1 to BIAS_VAL_6) and run simulations in Vivado.
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