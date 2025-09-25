import { useState } from 'react';
import './KernelVisualizer.css';

const KernelVisualizer = ({ 
  shape, 
  selectedPositions = [], 
  onPositionToggle, 
  maxSelections = null,
  disabled = false 
}) => {
  const [hoveredPosition, setHoveredPosition] = useState(null);
  const [currentChannel, setCurrentChannel] = useState(0);
  const [currentFilter, setCurrentFilter] = useState(0);

  const isPositionSelected = (position) => {
    return selectedPositions.some(selected => 
      JSON.stringify(selected) === JSON.stringify(position)
    );
  };

  const handlePositionClick = (position) => {
    if (disabled) return;
    
    const isSelected = isPositionSelected(position);
    
    if (isSelected) {
      onPositionToggle(position, false);
      return;
    }
    
    if (maxSelections && selectedPositions.length >= maxSelections) {
      return;
    }
    
    onPositionToggle(position, true);
  };

  const render2DView = () => {
    if (shape.length < 2) return null;
    
    const [height, width] = shape.slice(0, 2);
    const remainingDims = shape.slice(2);
    
    const maxChannels = remainingDims[0] || 1;
    const maxFilters = remainingDims[1] || 1;
    
    return (
      <div className="kernel-2d-view">
        {remainingDims.length > 0 && (
          <div className="dimension-controls">
            {remainingDims.length > 0 && (
              <div className="dimension-control">
                <label>Canal: </label>
                <select 
                  value={currentChannel} 
                  onChange={(e) => setCurrentChannel(parseInt(e.target.value))}
                >
                  {Array.from({length: maxChannels}, (_, i) => (
                    <option key={i} value={i}>Canal {i}</option>
                  ))}
                </select>
              </div>
            )}
            {remainingDims.length > 1 && (
              <div className="dimension-control">
                <label>Filtro: </label>
                <select 
                  value={currentFilter} 
                  onChange={(e) => setCurrentFilter(parseInt(e.target.value))}
                >
                  {Array.from({length: maxFilters}, (_, i) => (
                    <option key={i} value={i}>Filtro {i}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
        
        <div className="kernel-grid-container">
          <div className="kernel-grid" style={{
            gridTemplateColumns: `repeat(${width}, 1fr)`,
            gridTemplateRows: `repeat(${height}, 1fr)`
          }}>
            {Array.from({length: height}, (_, row) =>
              Array.from({length: width}, (_, col) => {
                const position = remainingDims.length === 0 
                  ? [row, col]
                  : remainingDims.length === 1
                  ? [row, col, currentChannel]
                  : [row, col, currentChannel, currentFilter];
                
                const isSelected = isPositionSelected(position);
                const isHovered = hoveredPosition && 
                  JSON.stringify(hoveredPosition) === JSON.stringify(position);
                
                return (
                  <div
                    key={`${row}-${col}`}
                    className={`kernel-cell ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''} ${disabled ? 'disabled' : ''}`}
                    onClick={() => handlePositionClick(position)}
                    onMouseEnter={() => setHoveredPosition(position)}
                    onMouseLeave={() => setHoveredPosition(null)}
                    title={`Posición: [${position.join(', ')}]`}
                  >
                    <span className="cell-coords">{row},{col}</span>
                    {isSelected && <span className="selection-indicator">✓</span>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  const render1DView = () => {
    if (shape.length !== 1) return null;
    
    const [length] = shape;
    const maxItemsPerRow = 10;
    const rows = Math.ceil(length / maxItemsPerRow);
    
    return (
      <div className="kernel-1d-view">
        <div className="vector-grid">
          {Array.from({length: rows}, (_, row) => (
            <div key={row} className="vector-row">
              {Array.from({length: Math.min(maxItemsPerRow, length - row * maxItemsPerRow)}, (_, col) => {
                const index = row * maxItemsPerRow + col;
                const position = [index];
                const isSelected = isPositionSelected(position);
                const isHovered = hoveredPosition && 
                  JSON.stringify(hoveredPosition) === JSON.stringify(position);
                
                return (
                  <div
                    key={index}
                    className={`vector-cell ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''} ${disabled ? 'disabled' : ''}`}
                    onClick={() => handlePositionClick(position)}
                    onMouseEnter={() => setHoveredPosition(position)}
                    onMouseLeave={() => setHoveredPosition(null)}
                    title={`Posición: [${index}]`}
                  >
                    <span className="cell-index">{index}</span>
                    {isSelected && <span className="selection-indicator">✓</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderVisualization = () => {
    if (!shape || shape.length === 0) {
      return <div className="no-shape">No hay forma definida</div>;
    }
    
    if (shape.length === 1) {
      return render1DView();
    }
    
    if (shape.length >= 2) {
      return render2DView();
    }
    
    return <div className="no-shape">Forma no soportada</div>;
  };

  return (
    <div className="kernel-visualizer">
      <div className="visualizer-header">
        <h4>Selector Visual de Posiciones</h4>
        <div className="shape-info">
          <span>Dimensiones: [{shape.join(' × ')}]</span>
          <span>Total elementos: {shape.reduce((a, b) => a * b, 1)}</span>
          <span>Seleccionadas: {selectedPositions.length}</span>
          {maxSelections && <span>Máximo: {maxSelections}</span>}
        </div>
      </div>
      
      <div className="visualizer-content">
        {renderVisualization()}
      </div>
      
      {selectedPositions.length > 0 && (
        <div className="selected-positions">
          <h5>Posiciones Seleccionadas:</h5>
          <div className="selected-list">
            {selectedPositions.map((position, index) => (
              <span key={index} className="selected-position">
                [{position.join(', ')}]
                <button 
                  className="remove-position"
                  onClick={() => onPositionToggle(position, false)}
                  disabled={disabled}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default KernelVisualizer;