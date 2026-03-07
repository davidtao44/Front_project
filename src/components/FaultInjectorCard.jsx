import { useState } from 'react';
import { Zap, Target, Wrench, BarChart2, ArrowRight } from 'lucide-react';
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
          <Zap size={28} />
        </div>
        <h3 className="card-title">Reliability Assessment Module</h3>
      </div>
      
      <div className="card-content">
        <p className="card-description">
          Herramienta para inyección de fallos en redes neuronales convolucionales. 
          Ejecuta inferencias tanto en modelos golden como en modelos con fallos inyectados.
        </p>
        
        <div className="card-features">
          <div className="feature-item">
            <span className="feature-icon"><Target size={16} /></span>
            <span>Inferencias Golden</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon"><Wrench size={16} /></span>
            <span>Inyección de Fallos</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon"><BarChart2 size={16} /></span>
            <span>Análisis Comparativo</span>
          </div>
        </div>
      </div>
      
      <div className="card-footer">
        <div className="card-status">
          <span className="status-badge available">Disponible</span>
        </div>
        <div className="card-arrow">
          <ArrowRight size={20} />
        </div>
      </div>
    </div>
  );
};

export default FaultInjectorCard;