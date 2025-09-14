import { useState } from 'react';
import './FaultInjectorCard.css';

const FaultInjectorCard = ({ onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`feature-card fault-injector-card ${isHovered ? 'hovered' : ''}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="card-header">
        <div className="card-icon fault-injector-icon">
          ⚡
        </div>
        <h3 className="card-title">FaultInjector</h3>
      </div>
      
      <div className="card-content">
        <p className="card-description">
          Herramienta para inyección de fallos en redes neuronales convolucionales. 
          Ejecuta inferencias tanto en modelos golden como en modelos con fallos inyectados.
        </p>
        
        <div className="card-features">
          <div className="feature-item">
            <span className="feature-icon">🎯</span>
            <span>Inferencias Golden</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔧</span>
            <span>Inyección de Fallos</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📊</span>
            <span>Análisis Comparativo</span>
          </div>
        </div>
      </div>
      
      <div className="card-footer">
        <div className="card-status">
          <span className="status-badge coming-soon">Próximamente</span>
        </div>
        <div className="card-arrow">
          →
        </div>
      </div>
    </div>
  );
};

export default FaultInjectorCard;