import { useState } from 'react';
import { Layers, Database, Cpu, LineChart, ArrowRight } from 'lucide-react';
import './FaultInjectorCard.css';

const CNNStudioCard = ({ onClick }) => {
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
          <Layers size={28} />
        </div>
        <h3 className="card-title">CNN Builder &amp; Training Tool</h3>
      </div>

      <div className="card-content">
        <p className="card-description">
          Design CNN architectures and train them on built-in Keras datasets.
          Trained models become immediately available for fault injection.
        </p>

        <div className="card-features">
          <div className="feature-item">
            <span className="feature-icon"><Database size={16} /></span>
            <span>Keras Datasets</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon"><Cpu size={16} /></span>
            <span>GPU Training</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon"><LineChart size={16} /></span>
            <span>Live Metrics</span>
          </div>
        </div>
      </div>

      <div className="card-footer">
        <div className="card-status">
          <span className="status-badge available">Available</span>
        </div>
        <div className="card-arrow">
          <ArrowRight size={20} />
        </div>
      </div>
    </div>
  );
};

export default CNNStudioCard;
