import Header from '../components/Header';
import SAIHeatmap3D from '../components/SAIHeatmap3D';
import './SAIHistory.css';

const SAIHistory = () => {
  return (
    <div className="sai-history-page">
      <Header />
      <main className="sai-history-main">
        <div className="sai-history-intro">
          <h2 className="sai-history-page-title">
            <span>📊</span> SAI / MAI Historic Heatmaps
          </h2>
          <p className="sai-history-page-subtitle">
            Visualización 3D del histórico de campañas SAI guardadas. Cada barra es
            una campaña individual (1 capa × 1 posición × 1 bit). Las campañas con
            más de un fallo no se almacenan y no aparecen aquí.
          </p>
        </div>
        <SAIHeatmap3D refreshKey={0} />
      </main>
    </div>
  );
};

export default SAIHistory;
