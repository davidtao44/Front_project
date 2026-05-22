import Header from '../components/Header';
import SAIHeatmap from '../components/SAIHeatmap';
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
            Mapa de calor del histórico de campañas SAI guardadas. Cada celda es
            una campaña individual (1 capa × 1 posición × 1 bit) y el color marca
            la criticidad del fallo. Las campañas con más de un fallo no se
            almacenan y no aparecen aquí.
          </p>
        </div>
        <SAIHeatmap refreshKey={0} />
      </main>
    </div>
  );
};

export default SAIHistory;
