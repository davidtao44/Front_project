import { useState } from 'react';
import Header from '../components/Header';
import './FaultInjector.css';

const FaultInjector = () => {
  const [selectedModel, setSelectedModel] = useState(null);

  return (
    <div className="fault-injector-page">
      <Header />
      
      <div className="fault-injector-container">
        <div className="page-header">
          <h1 className="page-title">
            <span className="title-icon">⚡</span>
            FaultInjector
          </h1>
          <p className="page-subtitle">
            Herramienta para inyección de fallos en redes neuronales convolucionales
          </p>
        </div>
        
        <div className="content-placeholder">
          <div className="placeholder-card">
            <div className="placeholder-icon">🚧</div>
            <h3>Funcionalidad en Desarrollo</h3>
            <p>
              Esta sección estará disponible próximamente. Aquí podrás:
            </p>
            <ul className="feature-list">
              <li>Seleccionar modelos CNN pre-entrenados</li>
              <li>Configurar parámetros de inyección de fallos</li>
              <li>Ejecutar inferencias en modelos golden</li>
              <li>Comparar resultados con modelos con fallos inyectados</li>
              <li>Analizar el impacto de los fallos en el rendimiento</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaultInjector;