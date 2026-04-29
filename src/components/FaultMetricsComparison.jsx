import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './FaultMetricsComparison.css';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const FaultMetricsComparison = ({ campaignResults, numSamples }) => {
  // Analizar SDC y Fault Masked desde predicciones
  const analyzeFaultTypes = () => {
    if (!campaignResults?.golden_results || !campaignResults?.fault_results) {
      return { sdc: 0, faultMasked: 0, total: 0 };
    }

    const goldenPredictions = campaignResults.golden_results.predictions || [];
    const faultPredictions = campaignResults.fault_results.predictions || [];
    let sdc = 0;
    let faultMasked = 0;
    const totalSamples = Math.min(goldenPredictions.length, faultPredictions.length);

    for (let i = 0; i < totalSamples; i++) {
      const faultPred = faultPredictions[i];
      if (faultPred !== null && faultPred !== undefined && faultPred >= 0 && faultPred <= 9) {
        if (goldenPredictions[i] === faultPred) faultMasked++;
        else sdc++;
      }
    }

    return { sdc, faultMasked, total: sdc + faultMasked };
  };

  const faultAnalysis = analyzeFaultTypes();

  // Métricas analíticas calculadas por el backend
  const comparison = campaignResults?.comparison ?? {};
  const propagationFactor = comparison.propagation_factor;
  const misclassificationFactor = comparison.misclassification_factor;
  const faultInduced = comparison.fault_induced_misclassifications;
  const nPropagados = comparison.samples_with_different_predictions;
  const nInjections = campaignResults?.golden_results?.metrics?.num_samples ?? comparison.samples_with_same_predictions + nPropagados;

  const fmtFactor = (val) =>
    val !== undefined && val !== null ? val.toFixed(4) : 'N/A';

  const factorColor = (val) => {
    if (val === undefined || val === null) return '#6c757d';
    if (val <= 0.25) return '#27ae60';
    if (val <= 0.60) return '#f39c12';
    return '#e74c3c';
  };

  const getPercentage = (value) =>
    faultAnalysis.total > 0 ? ((value / faultAnalysis.total) * 100).toFixed(2) : 0;

  // Datos para el gráfico de barras
  const chartLabels = ['SDC', 'Fault Masked'];
  const chartValues = [faultAnalysis.sdc, faultAnalysis.faultMasked];
  const chartColors = ['rgba(231, 76, 60, 0.8)', 'rgba(46, 204, 113, 0.8)'];
  const chartBorders = ['rgba(231, 76, 60, 1)', 'rgba(46, 204, 113, 1)'];

  if (propagationFactor !== undefined) {
    chartLabels.push('Propagation Factor (FP)');
    chartValues.push(parseFloat((propagationFactor * (faultAnalysis.total || 1)).toFixed(2)));
    chartColors.push('rgba(52, 152, 219, 0.8)');
    chartBorders.push('rgba(52, 152, 219, 1)');
  }

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Number of Faults',
        data: chartValues,
        backgroundColor: chartColors,
        borderColor: chartBorders,
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Resultados por Tipo',
        font: {
          size: 16,
          weight: 'bold',
        },
        color: '#2c3e50',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            const percentage = getPercentage(value);
            return `${context.label}: ${value} fallos (${percentage}%)`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Results Classification',
          font: {
            size: 14,
            weight: 'bold',
          },
          color: '#2c3e50',
        },
        ticks: {
          color: '#2c3e50',
          font: {
            size: 12,
          },
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Occurrences',
          font: {
            size: 14,
            weight: 'bold',
          },
          color: '#2c3e50',
        },
        ticks: {
          color: '#2c3e50',
          font: {
            size: 12,
          },
          stepSize: 1,
        },
      },
    },
  };

  if (!campaignResults) {
    return (
      <div className="fault-metrics-container">
        <div className="no-data-message">
          <h4>Fault Types Analysis</h4>
          <p>No campaign data available to analyze.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fault-metrics-container">
      <div className="fault-metrics-header">
        <h4>Fault Types Analysis</h4>
        <p>Classification of faults according to their impact on the system</p>
      </div>

      <div className="fault-metrics-content">
        {/* Metric cards */}
        <div className="metrics-cards">
          <div className="metric-card sdc">
            <div className="metric-icon">⚠️</div>
            <div className="metric-info">
              <h5>SDC (Silent Data Corruption)</h5>
              <div className="metric-value">{faultAnalysis.sdc}</div>
              <div className="metric-percentage">{getPercentage(faultAnalysis.sdc)}%</div>
              <p>Neural network results that differ from the expected result (golden output), without an evident error being detected during execution.</p>
            </div>
          </div>

          <div className="metric-card fault-masked">
            <div className="metric-icon">🛡️</div>
            <div className="metric-info">
              <h5>Fault Masked</h5>
              <div className="metric-value">{faultAnalysis.faultMasked}</div>
              <div className="metric-percentage">{getPercentage(faultAnalysis.faultMasked)}%</div>
              <p>Masked faults that do not affect the network result</p>
            </div>
          </div>

          {propagationFactor !== undefined && (
            <div className="metric-card fp">
              <div className="metric-icon">📡</div>
              <div className="metric-info">
                <h5>Propagation Factor (FP)</h5>
                <div className="metric-value" style={{ color: factorColor(propagationFactor) }}>
                  {fmtFactor(propagationFactor)}
                </div>
                <div className="metric-counts">
                  <span className="count-label">N<sub>propagados</sub></span>
                  <span className="count-value">{nPropagados ?? '—'}</span>
                  <span className="count-sep">/</span>
                  <span className="count-label">N<sub>inyecciones</sub></span>
                  <span className="count-value">{nInjections ?? '—'}</span>
                </div>
                <div className="factor-bar-wrap">
                  <div
                    className="factor-bar"
                    style={{ width: `${(propagationFactor * 100).toFixed(1)}%`, background: factorColor(propagationFactor) }}
                  />
                </div>
                <p>
                  Fraction of injections that changed the network output.
                  {propagationFactor <= 0.25 && ' Errors are mostly absorbed by the DNN.'}
                  {propagationFactor > 0.25 && propagationFactor <= 0.60 && ' Moderate error propagation.'}
                  {propagationFactor > 0.60 && ' High propagation — errors reach the output frequently.'}
                </p>
              </div>
            </div>
          )}

          {misclassificationFactor !== undefined && (
            <div className="metric-card fm">
              <div className="metric-icon">🎯</div>
              <div className="metric-info">
                <h5>Misclassification Factor (FM)</h5>
                <div className="metric-value" style={{ color: factorColor(misclassificationFactor) }}>
                  {fmtFactor(misclassificationFactor)}
                </div>
                <div className="metric-counts">
                  <span className="count-label">N<sub>misclassified</sub></span>
                  <span className="count-value">{faultInduced ?? '—'}</span>
                  <span className="count-sep">/</span>
                  <span className="count-label">N<sub>propagados</sub></span>
                  <span className="count-value">{nPropagados ?? '—'}</span>
                </div>
                <div className="factor-bar-wrap">
                  <div
                    className="factor-bar"
                    style={{ width: `${(misclassificationFactor * 100).toFixed(1)}%`, background: factorColor(misclassificationFactor) }}
                  />
                </div>
                <p>
                  Fraction of injections that caused an incorrect classification (SDC).
                  {misclassificationFactor === 0 && ' No classification errors introduced by faults.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bar chart */}
        <div className="chart-section">
          <div className="chart-container">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Statistical summary */}
        <div className="fault-summary">
          <div className="summary-header">
            <h5>Analysis Summary</h5>
          </div>
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-label">SDC Faults:</span>
              <span className="stat-value">{faultAnalysis.sdc}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">SDC Rate:</span>
              <span className="stat-value">{getPercentage(faultAnalysis.sdc)}%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Masking Rate:</span>
              <span className="stat-value">{getPercentage(faultAnalysis.faultMasked)}%</span>
            </div>
            {propagationFactor !== undefined && (
              <div className="stat-item stat-item--fp">
                <span className="stat-label">Propagation Factor (FP):</span>
                <span className="stat-value" style={{ color: factorColor(propagationFactor) }}>
                  {fmtFactor(propagationFactor)}
                </span>
              </div>
            )}
            {misclassificationFactor !== undefined && (
              <div className="stat-item stat-item--fm">
                <span className="stat-label">Misclassification Factor (FM):</span>
                <span className="stat-value" style={{ color: factorColor(misclassificationFactor) }}>
                  {fmtFactor(misclassificationFactor)}
                </span>
              </div>
            )}
            {faultInduced !== undefined && (
              <div className="stat-item">
                <span className="stat-label">Fault-Induced Errors:</span>
                <span className="stat-value">{faultInduced}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaultMetricsComparison;