import { useState } from 'react';
import { Cpu, Image, Scale, Hash, LayoutGrid, ArrowRight } from 'lucide-react';
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
          <Cpu size={28} />
        </div>
        <h3 className="card-title">Hardware Interoperability Tool</h3>
      </div>
      
      <div className="card-content">
        <p className="card-description">
          Toolset for converting and extracting neural network data
          to VHDL format for hardware implementation.
        </p>
        
        <div className="card-features">
          <div className="feature-item">
            <span className="feature-icon"><Image size={16} /></span>
            <span>Imagen a VHDL</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon"><Scale size={16} /></span>
            <span>Weight Extraction</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon"><Hash size={16} /></span>
            <span>Bias Extraction</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon"><LayoutGrid size={16} /></span>
            <span>Model Selection</span>
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

export default VHDLToolsCard;