import { useState, useEffect } from 'react';
import './StatsCarousel.css';

const FaultInjectionAnimation = () => (
  <svg viewBox="0 0 280 280" className="stats-animation">
    <defs>
      <linearGradient id="faultGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ff6b6b" />
        <stop offset="100%" stopColor="#ff3838" />
      </linearGradient>
    </defs>

    {/* Red Neural - Capa 1 (entrada) */}
    <g className="network-layer layer-1">
      <circle cx="60" cy="60" r="6" fill="#3182ce" />
      <circle cx="60" cy="140" r="6" fill="#3182ce" />
      <circle cx="60" cy="220" r="6" fill="#3182ce" />
    </g>

    {/* Red Neural - Capa 2 (oculta) */}
    <g className="network-layer layer-2">
      <circle cx="140" cy="90" r="6" fill="#3182ce" />
      <circle cx="140" cy="140" r="6" fill="#3182ce" />
      <circle cx="140" cy="190" r="6" fill="#3182ce" />
    </g>

    {/* Red Neural - Capa 3 (salida) */}
    <g className="network-layer layer-3">
      <circle cx="220" cy="60" r="6" fill="#3182ce" />
      <circle cx="220" cy="140" r="6" fill="#3182ce" />
      <circle cx="220" cy="220" r="6" fill="#3182ce" />
    </g>

    {/* Conexiones - Capa 1 a 2 */}
    <g className="connections" opacity="0.5" stroke="#3182ce" strokeWidth="1.2">
      <line x1="60" y1="60" x2="140" y2="90" />
      <line x1="60" y1="60" x2="140" y2="140" />
      <line x1="60" y1="60" x2="140" y2="190" />
      <line x1="60" y1="140" x2="140" y2="90" />
      <line x1="60" y1="140" x2="140" y2="140" />
      <line x1="60" y1="140" x2="140" y2="190" />
      <line x1="60" y1="220" x2="140" y2="90" />
      <line x1="60" y1="220" x2="140" y2="140" />
      <line x1="60" y1="220" x2="140" y2="190" />
    </g>

    {/* Conexiones - Capa 2 a 3 */}
    <g className="connections" opacity="0.5" stroke="#3182ce" strokeWidth="1.2">
      <line x1="140" y1="90" x2="220" y2="60" />
      <line x1="140" y1="90" x2="220" y2="140" />
      <line x1="140" y1="90" x2="220" y2="220" />
      <line x1="140" y1="140" x2="220" y2="60" />
      <line x1="140" y1="140" x2="220" y2="140" />
      <line x1="140" y1="140" x2="220" y2="220" />
      <line x1="140" y1="190" x2="220" y2="60" />
      <line x1="140" y1="190" x2="220" y2="140" />
      <line x1="140" y1="190" x2="220" y2="220" />
    </g>

    {/* Pulsos de error inyectados */}
    <g className="injected-bits">
      {/* Error 1 - línea 1 */}
      <circle cx="60" cy="60" r="7" fill="url(#faultGradient)" opacity="0" className="error-pulse-1" />
      {/* Error 2 - línea 2 */}
      <circle cx="140" cy="140" r="7" fill="url(#faultGradient)" opacity="0" className="error-pulse-2" />
      {/* Error 3 - línea 3 */}
      <circle cx="220" cy="190" r="7" fill="url(#faultGradient)" opacity="0" className="error-pulse-3" />
    </g>

    {/* Propagación de fallos */}
    <g className="propagation">
      <circle cx="140" cy="140" r="30" fill="none" stroke="#ff6b6b" strokeWidth="2" opacity="0" className="ripple-1" />
      <circle cx="140" cy="140" r="30" fill="none" stroke="#ff3838" strokeWidth="1.5" opacity="0" className="ripple-2" />
    </g>
  </svg>
);

const AnalysisAnimation = () => (
  <svg viewBox="0 0 280 280" className="stats-animation">
    <defs>
      <linearGradient id="analysisGradient" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#4299e1" />
        <stop offset="100%" stopColor="#3182ce" />
      </linearGradient>
    </defs>

    {/* Gráfico de barras */}
    <g className="chart-bars">
      {/* Ejes */}
      <line x1="40" y1="220" x2="250" y2="220" stroke="#718096" strokeWidth="2.5" />
      <line x1="40" y1="40" x2="40" y2="220" stroke="#718096" strokeWidth="2.5" />

      {/* Barras animadas */}
      <rect x="70" y="160" width="28" height="60" fill="url(#analysisGradient)" className="bar-1" />
      <rect x="115" y="100" width="28" height="120" fill="url(#analysisGradient)" className="bar-2" />
      <rect x="160" y="70" width="28" height="150" fill="url(#analysisGradient)" className="bar-3" />
      <rect x="205" y="120" width="28" height="100" fill="url(#analysisGradient)" className="bar-4" />

      {/* Línea de tendencia */}
      <polyline points="84,160 129,100 174,70 219,120" fill="none" stroke="#ff8c42" strokeWidth="3" className="trend-line" />
      <circle cx="84" cy="160" r="5" fill="#ff8c42" />
      <circle cx="129" cy="100" r="5" fill="#ff8c42" />
      <circle cx="174" cy="70" r="5" fill="#ff8c42" />
      <circle cx="219" cy="120" r="5" fill="#ff8c42" />
    </g>
  </svg>
);

const VHDLGenAnimation = () => {
  const lines = [
    "library IEEE;",
    "use IEEE.STD_LOGIC_1164.ALL;",
    "entity CNN is",
    "  port(...);",
    "begin",
    "  -- Synthesis",
    "end CNN;"
  ];

  return (
    <svg viewBox="0 0 320 320" className="stats-animation vhdl-code">
      <defs>
        <style>{`
          .code-text { font-family: 'Courier New', monospace; font-size: 11px; fill: #48bb78; font-weight: bold; }
          .cursor { animation: blink 1s infinite; }
        `}</style>
      </defs>

      {/* Fondo de código */}
      <rect x="8" y="15" width="304" height="290" fill="#1a202c" rx="6" />
      <rect x="8" y="15" width="304" height="25" fill="#2d3748" />

      {/* Líneas de código escribiéndose */}
      <g className="code-lines">
        <text x="20" y="45" className="code-text code-line-1">library IEEE;</text>
        <text x="20" y="62" className="code-text code-line-2">use IEEE.STD_LOGIC_1164.ALL;</text>
        <text x="20" y="79" className="code-text code-line-3">entity CNN is</text>
        <text x="20" y="96" className="code-text code-line-4">  port(clk, rst);</text>
        <text x="20" y="113" className="code-text code-line-5">begin</text>
        <text x="20" y="130" className="code-text code-line-6">  process(clk)</text>
        <text x="20" y="147" className="code-text code-line-7">  -- Neural Network</text>
        <text x="20" y="164" className="code-text code-line-8">end process;</text>
        <text x="20" y="181" className="code-text code-line-9">end CNN;</text>
      </g>

      {/* Cursor parpadeante */}
      <g className="code-cursor">
        <rect x="120" y="175" width="2" height="12" fill="#48bb78" className="cursor" />
      </g>

      {/* Línea de compilación en progreso */}
      <rect x="20" y="210" width="0" height="3" fill="#4299e1" className="compile-progress" />
      <text x="20" y="235" className="code-text" fontSize="9" fill="#718096">Compiling...</text>
    </svg>
  );
};

const StatsCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  const stats = [
    {
      title: 'Fault Injection',
      description: 'Real-time fault injection and error propagation',
      component: FaultInjectionAnimation,
      color: '#ff6b6b'
    },
    {
      title: 'Analysis',
      description: 'Sensitivity and robustness analysis metrics',
      component: AnalysisAnimation,
      color: '#4299e1'
    },
    {
      title: 'VHDL Gen',
      description: 'Automatic hardware code synthesis',
      component: VHDLGenAnimation,
      color: '#48bb78'
    }
  ];

  useEffect(() => {
    if (!autoPlay) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % stats.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoPlay, stats.length]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 5000);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + stats.length) % stats.length);
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 5000);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % stats.length);
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 5000);
  };

  const CurrentComponent = stats[currentIndex].component;
  const currentStat = stats[currentIndex];

  return (
    <div className="stats-carousel-container">
      <div className="carousel-content">
        <div className="animation-frame" style={{ borderColor: currentStat.color }}>
          <CurrentComponent />
        </div>

        <div className="carousel-info">
          <h3 className="carousel-title">{currentStat.title}</h3>
          <p className="carousel-description">{currentStat.description}</p>
        </div>
      </div>

      {/* Controles */}
      <div className="carousel-controls">
        <button className="carousel-btn prev-btn" onClick={goToPrev} aria-label="Anterior">
          ‹
        </button>

        <div className="carousel-indicators">
          {stats.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Ir a slide ${index + 1}`}
              style={{
                backgroundColor: index === currentIndex ? stats[index].color : 'transparent',
                borderColor: stats[index].color
              }}
            />
          ))}
        </div>

        <button className="carousel-btn next-btn" onClick={goToNext} aria-label="Siguiente">
          ›
        </button>
      </div>
    </div>
  );
};

export default StatsCarousel;
