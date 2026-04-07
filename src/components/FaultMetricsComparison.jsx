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
  // Función para analizar y clasificar los fallos
  const analyzeFaultTypes = () => {
    if (!campaignResults?.golden_results || !campaignResults?.fault_results) {
      return {
        sdc: 0,
        faultMasked: 0,
        total: 0
      };
    }

    const goldenPredictions = campaignResults.golden_results.predictions || [];
    const faultPredictions = campaignResults.fault_results.predictions || [];
    
    let sdc = 0;           // Silent Data Corruption
    let faultMasked = 0;   // Fault Masked (predicciones iguales)
    
    const totalSamples = Math.min(goldenPredictions.length, faultPredictions.length);
    
    for (let i = 0; i < totalSamples; i++) {
      const goldenPred = goldenPredictions[i];
      const faultPred = faultPredictions[i];
      
      // Solo procesar predicciones válidas (ignorar crashes marcados como -1)
      if (faultPred !== null && faultPred !== undefined && faultPred >= 0 && faultPred <= 9) {
        // Verificar si el fallo fue enmascarado (predicciones iguales)
        if (goldenPred === faultPred) {
          faultMasked++;
        }
        // Verificar SDC (predicciones diferentes)
        else if (goldenPred !== faultPred) {
          sdc++;
        }
      }
    }
    
    return {
      sdc,
      faultMasked,
      total: sdc + faultMasked
    };
  };

  const faultAnalysis = analyzeFaultTypes();
  
  // Calcular porcentajes
  const getPercentage = (value) => {
    return faultAnalysis.total > 0 ? ((value / faultAnalysis.total) * 100).toFixed(2) : 0;
  };

  // Datos para el gráfico de barras
  const chartData = {
    labels: ['SDC', 'Fault Masked'],
    datasets: [
      {
        label: 'Number of Faults',
        data: [faultAnalysis.sdc, faultAnalysis.faultMasked],
        backgroundColor: [
          'rgba(231, 76, 60, 0.8)',   // Rojo para SDC
          'rgba(46, 204, 113, 0.8)',  // Verde para Fault Masked
        ],
        borderColor: [
          'rgba(231, 76, 60, 1)',
          'rgba(46, 204, 113, 1)',
        ],
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaultMetricsComparison;