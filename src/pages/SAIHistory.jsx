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
            Heat map of the history of saved UPS campaigns. Each cell represents an individual campaign (1 layer × 1 position × 1 bit), and the color indicates the severity of the failure. Campaigns with more than one failure are not stored and do not appear here.
          </p>
        </div>
        <SAIHeatmap refreshKey={0} />
      </main>
    </div>
  );
};

export default SAIHistory;
