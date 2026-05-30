import './FaultInjectionVisualization.css';

const FaultInjectionVisualization = () => {
  return (
    <svg viewBox="0 0 320 320" className="fault-injection-visualization">
      <defs>
        <linearGradient id="neuronGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4299e1" />
          <stop offset="100%" stopColor="#3182ce" />
        </linearGradient>
        <linearGradient id="errorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff6b6b" />
          <stop offset="100%" stopColor="#ff3838" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Input Layer */}
      <g className="input-layer">
        <circle cx="40" cy="60" r="6" fill="url(#neuronGradient)" className="neuron" />
        <circle cx="40" cy="140" r="6" fill="url(#neuronGradient)" className="neuron" />
        <circle cx="40" cy="220" r="6" fill="url(#neuronGradient)" className="neuron" />
      </g>

      {/* Hidden Layer 1 */}
      <g className="hidden-layer-1">
        <circle cx="120" cy="80" r="6" fill="url(#neuronGradient)" className="neuron" />
        <circle cx="120" cy="140" r="6" fill="url(#neuronGradient)" className="neuron" />
        <circle cx="120" cy="200" r="6" fill="url(#neuronGradient)" className="neuron" />
      </g>

      {/* Hidden Layer 2 */}
      <g className="hidden-layer-2">
        <circle cx="200" cy="100" r="6" fill="url(#neuronGradient)" className="neuron" />
        <circle cx="200" cy="160" r="6" fill="url(#neuronGradient)" className="neuron" />
        <circle cx="200" cy="220" r="6" fill="url(#neuronGradient)" className="neuron" />
      </g>

      {/* Output Layer */}
      <g className="output-layer">
        <circle cx="280" cy="80" r="6" fill="url(#neuronGradient)" className="neuron" />
        <circle cx="280" cy="160" r="6" fill="url(#neuronGradient)" className="neuron" />
        <circle cx="280" cy="240" r="6" fill="url(#neuronGradient)" className="neuron" />
      </g>

      {/* Connections - Input to Hidden 1 */}
      <g className="connections" opacity="0.5" stroke="#4299e1" strokeWidth="1">
        <line x1="40" y1="60" x2="120" y2="80" />
        <line x1="40" y1="60" x2="120" y2="140" />
        <line x1="40" y1="60" x2="120" y2="200" />
        <line x1="40" y1="140" x2="120" y2="80" />
        <line x1="40" y1="140" x2="120" y2="140" />
        <line x1="40" y1="140" x2="120" y2="200" />
        <line x1="40" y1="220" x2="120" y2="80" />
        <line x1="40" y1="220" x2="120" y2="140" />
        <line x1="40" y1="220" x2="120" y2="200" />
      </g>

      {/* Connections - Hidden 1 to Hidden 2 */}
      <g className="connections" opacity="0.5" stroke="#4299e1" strokeWidth="1">
        <line x1="120" y1="80" x2="200" y2="100" />
        <line x1="120" y1="80" x2="200" y2="160" />
        <line x1="120" y1="80" x2="200" y2="220" />
        <line x1="120" y1="140" x2="200" y2="100" />
        <line x1="120" y1="140" x2="200" y2="160" />
        <line x1="120" y1="140" x2="200" y2="220" />
        <line x1="120" y1="200" x2="200" y2="100" />
        <line x1="120" y1="200" x2="200" y2="160" />
        <line x1="120" y1="200" x2="200" y2="220" />
      </g>

      {/* Connections - Hidden 2 to Output */}
      <g className="connections" opacity="0.5" stroke="#4299e1" strokeWidth="1">
        <line x1="200" y1="100" x2="280" y2="80" />
        <line x1="200" y1="100" x2="280" y2="160" />
        <line x1="200" y1="100" x2="280" y2="240" />
        <line x1="200" y1="160" x2="280" y2="80" />
        <line x1="200" y1="160" x2="280" y2="160" />
        <line x1="200" y1="160" x2="280" y2="240" />
        <line x1="200" y1="220" x2="280" y2="80" />
        <line x1="200" y1="220" x2="280" y2="160" />
        <line x1="200" y1="220" x2="280" y2="240" />
      </g>

      {/* Fault Injection Points - Pulsos de error */}
      <g className="fault-pulses">
        {/* Error 1 */}
        <circle cx="40" cy="140" r="7" fill="url(#errorGradient)" opacity="0" className="error-pulse-1" filter="url(#glow)" />

        {/* Error 2 */}
        <circle cx="120" cy="140" r="7" fill="url(#errorGradient)" opacity="0" className="error-pulse-2" filter="url(#glow)" />

        {/* Error 3 */}
        <circle cx="200" cy="160" r="7" fill="url(#errorGradient)" opacity="0" className="error-pulse-3" filter="url(#glow)" />

        {/* Error 4 */}
        <circle cx="280" cy="160" r="7" fill="url(#errorGradient)" opacity="0" className="error-pulse-4" filter="url(#glow)" />
      </g>

      {/* Propagation Waves */}
      <g className="propagation-waves">
        <circle cx="120" cy="140" r="25" fill="none" stroke="#ff6b6b" strokeWidth="1.5" opacity="0" className="wave-1" />
        <circle cx="120" cy="140" r="25" fill="none" stroke="#ff3838" strokeWidth="1" opacity="0" className="wave-2" />
        <circle cx="200" cy="160" r="25" fill="none" stroke="#ff6b6b" strokeWidth="1.5" opacity="0" className="wave-3" />
        <circle cx="200" cy="160" r="25" fill="none" stroke="#ff3838" strokeWidth="1" opacity="0" className="wave-4" />
      </g>

      {/* Labels */}
      <text x="40" y="270" textAnchor="middle" className="layer-label">Input</text>
      <text x="120" y="270" textAnchor="middle" className="layer-label">Hidden</text>
      <text x="200" y="270" textAnchor="middle" className="layer-label">Hidden</text>
      <text x="280" y="270" textAnchor="middle" className="layer-label">Output</text>
    </svg>
  );
};

export default FaultInjectionVisualization;
