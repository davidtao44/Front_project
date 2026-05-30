import './VHDLSynthesisVisualization.css';

const VHDLSynthesisVisualization = () => {
  return (
    <svg viewBox="0 0 360 360" className="vhdl-synthesis-visualization">
      <defs>
        <linearGradient id="blockGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3182ce" />
          <stop offset="100%" stopColor="#2c5aa0" />
        </linearGradient>
        <linearGradient id="dataFlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#48bb78" />
          <stop offset="100%" stopColor="#38a169" />
        </linearGradient>
        <filter id="synthGlow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Stage 1: Code Analysis */}
      <g className="stage-1">
        <rect x="30" y="20" width="60" height="50" rx="4" fill="url(#blockGradient)" className="logic-block" />
        <text x="60" y="50" textAnchor="middle" className="block-text">CODE</text>

        <circle cx="60" cy="85" r="5" fill="#48bb78" className="node" />
      </g>

      {/* Stage 2: RTL Synthesis */}
      <g className="stage-2">
        <rect x="150" y="20" width="60" height="50" rx="4" fill="url(#blockGradient)" className="logic-block" />
        <text x="180" y="50" textAnchor="middle" className="block-text">RTL</text>

        <circle cx="180" cy="85" r="5" fill="#48bb78" className="node" />
      </g>

      {/* Stage 3: Logic Optimization */}
      <g className="stage-3">
        <rect x="270" y="20" width="60" height="50" rx="4" fill="url(#blockGradient)" className="logic-block" />
        <text x="300" y="50" textAnchor="middle" className="block-text">OPT</text>

        <circle cx="300" cy="85" r="5" fill="#48bb78" className="node" />
      </g>

      {/* Stage 4: Place & Route */}
      <g className="stage-4">
        <rect x="30" y="140" width="60" height="50" rx="4" fill="url(#blockGradient)" className="logic-block" />
        <text x="60" y="170" textAnchor="middle" className="block-text">PLACE</text>

        <circle cx="60" cy="205" r="5" fill="#48bb78" className="node" />
      </g>

      {/* Stage 5: Timing Analysis */}
      <g className="stage-5">
        <rect x="150" y="140" width="60" height="50" rx="4" fill="url(#blockGradient)" className="logic-block" />
        <text x="180" y="170" textAnchor="middle" className="block-text">TIMING</text>

        <circle cx="180" cy="205" r="5" fill="#48bb78" className="node" />
      </g>

      {/* Stage 6: Bitstream Generation */}
      <g className="stage-6">
        <rect x="270" y="140" width="60" height="50" rx="4" fill="url(#blockGradient)" className="logic-block" />
        <text x="300" y="170" textAnchor="middle" className="block-text">BIT</text>

        <circle cx="300" cy="205" r="5" fill="#48bb78" className="node" />
      </g>

      {/* Data Flow Lines */}
      <g className="data-flow" opacity="0.6" stroke="#48bb78" strokeWidth="2">
        {/* Stage 1 to 2 */}
        <line x1="90" y1="45" x2="150" y2="45" className="flow-line" />
        {/* Stage 2 to 3 */}
        <line x1="210" y1="45" x2="270" y2="45" className="flow-line" />
        {/* Stage 3 to 4 */}
        <line x1="300" y1="90" x2="300" y2="110" className="flow-line" />
        <line x1="300" y1="110" x2="90" y2="110" className="flow-line" />
        <line x1="90" y1="110" x2="60" y2="140" className="flow-line" />
        {/* Stage 4 to 5 */}
        <line x1="90" y1="165" x2="150" y2="165" className="flow-line" />
        {/* Stage 5 to 6 */}
        <line x1="210" y1="165" x2="270" y2="165" className="flow-line" />
      </g>

      {/* Data Pulses */}
      <g className="data-pulses">
        <circle cx="120" cy="45" r="4" fill="#48bb78" className="pulse pulse-1" filter="url(#synthGlow)" />
        <circle cx="240" cy="45" r="4" fill="#48bb78" className="pulse pulse-2" filter="url(#synthGlow)" />
        <circle cx="180" cy="110" r="4" fill="#48bb78" className="pulse pulse-3" filter="url(#synthGlow)" />
        <circle cx="120" cy="165" r="4" fill="#48bb78" className="pulse pulse-4" filter="url(#synthGlow)" />
        <circle cx="240" cy="165" r="4" fill="#48bb78" className="pulse pulse-5" filter="url(#synthGlow)" />
      </g>

      {/* FPGA Representation */}
      <g className="fpga-grid">
        <rect x="30" y="260" width="300" height="80" rx="4" fill="none" stroke="#3182ce" strokeWidth="2" opacity="0.5" className="fpga-border" />

        {/* Grid of Logic Cells */}
        <g className="logic-cells">
          <rect x="40" y="270" width="12" height="12" fill="#48bb78" opacity="0.4" className="cell cell-1" />
          <rect x="60" y="270" width="12" height="12" fill="#48bb78" opacity="0.4" className="cell cell-2" />
          <rect x="80" y="270" width="12" height="12" fill="#48bb78" opacity="0.4" className="cell cell-3" />
          <rect x="100" y="270" width="12" height="12" fill="#48bb78" opacity="0.4" className="cell cell-4" />
          <rect x="120" y="270" width="12" height="12" fill="#48bb78" opacity="0.4" className="cell cell-5" />

          <rect x="40" y="295" width="12" height="12" fill="#48bb78" opacity="0.4" className="cell cell-6" />
          <rect x="60" y="295" width="12" height="12" fill="#48bb78" opacity="0.4" className="cell cell-7" />
          <rect x="80" y="295" width="12" height="12" fill="#48bb78" opacity="0.4" className="cell cell-8" />
          <rect x="100" y="295" width="12" height="12" fill="#48bb78" opacity="0.4" className="cell cell-9" />
          <rect x="120" y="295" width="12" height="12" fill="#48bb78" opacity="0.4" className="cell cell-10" />

          <rect x="40" y="320" width="12" height="12" fill="#48bb78" opacity="0.4" className="cell cell-11" />
          <rect x="60" y="320" width="12" height="12" fill="#48bb78" opacity="0.4" className="cell cell-12" />
          <rect x="80" y="320" width="12" height="12" fill="#48bb78" opacity="0.4" className="cell cell-13" />
          <rect x="100" y="320" width="12" height="12" fill="#48bb78" opacity="0.4" className="cell cell-14" />
          <rect x="120" y="320" width="12" height="12" fill="#48bb78" opacity="0.4" className="cell cell-15" />
        </g>

        {/* FPGA Label */}
        <text x="180" y="285" className="fpga-label">FPGA Layout</text>
      </g>

      {/* Synthesis Progress Bar */}
      <rect x="30" y="350" width="300" height="3" rx="2" fill="#e2e8f0" />
      <rect x="30" y="350" width="0" height="3" rx="2" fill="#48bb78" className="progress-bar" />
    </svg>
  );
};

export default VHDLSynthesisVisualization;
