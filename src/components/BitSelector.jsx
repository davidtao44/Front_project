import { useState, useEffect } from 'react';
import './BitSelector.css';

const BitSelector = ({ selectedBits = [], onBitsChange, disabled = false }) => {
  const [bits, setBits] = useState(new Set(selectedBits));

  useEffect(() => {
    setBits(new Set(selectedBits));
  }, [selectedBits]);

  const handleBitToggle = (bitPosition) => {
    if (disabled) return;
    
    const newBits = new Set(bits);
    if (newBits.has(bitPosition)) {
      newBits.delete(bitPosition);
    } else {
      newBits.add(bitPosition);
    }
    
    setBits(newBits);
    onBitsChange(Array.from(newBits).sort((a, b) => a - b));
  };

  const handleSelectAll = () => {
    if (disabled) return;
    const allBits = Array.from({ length: 32 }, (_, i) => i);
    setBits(new Set(allBits));
    onBitsChange(allBits);
  };

  const handleSelectNone = () => {
    if (disabled) return;
    setBits(new Set());
    onBitsChange([]);
  };

  const handleSelectSignificant = () => {
    if (disabled) return;
    const significantBits = Array.from({ length: 11 }, (_, i) => i + 20); // bits 20-30
    setBits(new Set(significantBits));
    onBitsChange(significantBits);
  };

  const handleSelectLessSignificant = () => {
    if (disabled) return;
    const lessSignificantBits = Array.from({ length: 20 }, (_, i) => i); // bits 0-19
    setBits(new Set(lessSignificantBits));
    onBitsChange(lessSignificantBits);
  };

  const getBitSignificance = (bitPosition) => {
    if (bitPosition >= 23 && bitPosition <= 30) return 'exponent';
    if (bitPosition === 31) return 'sign';
    return 'mantissa';
  };

  const getBitLabel = (bitPosition) => {
    const significance = getBitSignificance(bitPosition);
    switch (significance) {
      case 'sign': return 'Signo';
      case 'exponent': return 'Exponente';
      case 'mantissa': return 'Mantisa';
      default: return '';
    }
  };

  return (
    <div className="bit-selector">
      <div className="bit-selector-header">
        <h6>Selección de Bits Específicos</h6>
        <div className="bit-selector-controls">
          <button 
            type="button" 
            className="btn-preset" 
            onClick={handleSelectSignificant}
            disabled={disabled}
          >
            Bits Significativos (20-30)
          </button>
          <button 
            type="button" 
            className="btn-preset" 
            onClick={handleSelectLessSignificant}
            disabled={disabled}
          >
            Bits Menos Significativos (0-19)
          </button>
          <button 
            type="button" 
            className="btn-preset" 
            onClick={handleSelectAll}
            disabled={disabled}
          >
            Todos
          </button>
          <button 
            type="button" 
            className="btn-preset" 
            onClick={handleSelectNone}
            disabled={disabled}
          >
            Ninguno
          </button>
        </div>
      </div>

      <div className="bit-selector-info">
        <p>Selecciona los bits específicos donde deseas inyectar fallos. Los bits están numerados del 0 al 31 (IEEE 754).</p>
        <div className="selected-count">
          Bits seleccionados: <span className="count">{bits.size}</span>
          {bits.size > 0 && (
            <span className="selected-list">
              [{Array.from(bits).sort((a, b) => a - b).join(', ')}]
            </span>
          )}
        </div>
      </div>

      <div className="bit-grid">
        <div className="bit-section sign-section">
          <div className="section-label">Signo</div>
          <div className="bit-row">
            {[31].map(bitPosition => (
              <button
                key={bitPosition}
                type="button"
                className={`bit-button ${bits.has(bitPosition) ? 'selected' : ''} ${getBitSignificance(bitPosition)}`}
                onClick={() => handleBitToggle(bitPosition)}
                disabled={disabled}
                title={`Bit ${bitPosition} - ${getBitLabel(bitPosition)}`}
              >
                {bitPosition}
              </button>
            ))}
          </div>
        </div>

        <div className="bit-section exponent-section">
          <div className="section-label">Exponente</div>
          <div className="bit-row">
            {Array.from({ length: 8 }, (_, i) => 30 - i).map(bitPosition => (
              <button
                key={bitPosition}
                type="button"
                className={`bit-button ${bits.has(bitPosition) ? 'selected' : ''} ${getBitSignificance(bitPosition)}`}
                onClick={() => handleBitToggle(bitPosition)}
                disabled={disabled}
                title={`Bit ${bitPosition} - ${getBitLabel(bitPosition)}`}
              >
                {bitPosition}
              </button>
            ))}
          </div>
        </div>

        <div className="bit-section mantissa-section">
          <div className="section-label">Mantisa</div>
          <div className="bit-rows">
            {/* Bits 22-15 */}
            <div className="bit-row">
              {Array.from({ length: 8 }, (_, i) => 22 - i).map(bitPosition => (
                <button
                  key={bitPosition}
                  type="button"
                  className={`bit-button ${bits.has(bitPosition) ? 'selected' : ''} ${getBitSignificance(bitPosition)}`}
                  onClick={() => handleBitToggle(bitPosition)}
                  disabled={disabled}
                  title={`Bit ${bitPosition} - ${getBitLabel(bitPosition)}`}
                >
                  {bitPosition}
                </button>
              ))}
            </div>
            {/* Bits 14-7 */}
            <div className="bit-row">
              {Array.from({ length: 8 }, (_, i) => 14 - i).map(bitPosition => (
                <button
                  key={bitPosition}
                  type="button"
                  className={`bit-button ${bits.has(bitPosition) ? 'selected' : ''} ${getBitSignificance(bitPosition)}`}
                  onClick={() => handleBitToggle(bitPosition)}
                  disabled={disabled}
                  title={`Bit ${bitPosition} - ${getBitLabel(bitPosition)}`}
                >
                  {bitPosition}
                </button>
              ))}
            </div>
            {/* Bits 6-0 */}
            <div className="bit-row">
              {Array.from({ length: 7 }, (_, i) => 6 - i).map(bitPosition => (
                <button
                  key={bitPosition}
                  type="button"
                  className={`bit-button ${bits.has(bitPosition) ? 'selected' : ''} ${getBitSignificance(bitPosition)}`}
                  onClick={() => handleBitToggle(bitPosition)}
                  disabled={disabled}
                  title={`Bit ${bitPosition} - ${getBitLabel(bitPosition)}`}
                >
                  {bitPosition}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bit-selector-legend">
        <div className="legend-item">
          <div className="legend-color sign"></div>
          <span>Bit de Signo (31)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color exponent"></div>
          <span>Bits de Exponente (30-23)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color mantissa"></div>
          <span>Bits de Mantisa (22-0)</span>
        </div>
      </div>
    </div>
  );
};

export default BitSelector;