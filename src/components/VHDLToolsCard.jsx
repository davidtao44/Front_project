import { useState } from 'react';
import './VHDLToolsCard.css';

const VHDLToolsCard = ({ onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`feature-card vhdl-tools-card ${isHovered ? 'hovered' : ''}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="card-header">
        <div className="card-icon vhdl-tools-icon">
          🔧
        </div>
        <h3 className="card-title">VHDL Tools</h3>
      </div>
      
      <div className="card-content">
        <p className="card-description">
          Conjunto de herramientas para la conversión y extracción de datos de redes neuronales 
          a formato VHDL para implementación en hardware.
        </p>
        
        <div className="card-features">
          <div className="feature-item">
            <span className="feature-icon">🖼️</span>
            <span>Imagen a VHDL</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">⚖️</span>
            <span>Extracción de Pesos</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📐</span>
            <span>Extracción de Bias</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🎛️</span>
            <span>Selección de Modelos</span>
          </div>
        </div>
      </div>
      
      <div className="card-footer">
        <div className="card-status">
          <span className="status-badge available">Disponible</span>
        </div>
        <div className="card-arrow">
          →
        </div>
      </div>
    </div>
  );
};

export default VHDLToolsCard;