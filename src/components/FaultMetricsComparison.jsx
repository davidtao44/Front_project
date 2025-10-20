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
        label: 'Número de Fallos',
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
          text: 'Clasificación de resultados',
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
          text: 'Número de Ocurrencias',
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
          <h4>Análisis de Tipos de Fallos</h4>
          <p>No hay datos de campaña disponibles para analizar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fault-metrics-container">
      <div className="fault-metrics-header">
        <h4>Análisis de Tipos de Fallos</h4>
        <p>Clasificación de fallos según su impacto en el sistema</p>
      </div>

      <div className="fault-metrics-content">
        {/* Tarjetas de métricas */}
        <div className="metrics-cards">
          <div className="metric-card sdc">
            <div className="metric-icon">⚠️</div>
            <div className="metric-info">
              <h5>SDC (Silent Data Corruption)</h5>
              <div className="metric-value">{faultAnalysis.sdc}</div>
              <div className="metric-percentage">{getPercentage(faultAnalysis.sdc)}%</div>
              <p>Resultados de la red neuronal que difieren del resultado esperado (golden output), sin que se detecte un error evidente durante la ejecución.</p>
            </div>
          </div>

          <div className="metric-card fault-masked">
            <div className="metric-icon">🛡️</div>
            <div className="metric-info">
              <h5>Fault Masked</h5>
              <div className="metric-value">{faultAnalysis.faultMasked}</div>
              <div className="metric-percentage">{getPercentage(faultAnalysis.faultMasked)}%</div>
              <p>Fallos enmascarados que no afectan el resultado de la red</p>
            </div>
          </div>
        </div>

        {/* Gráfico de barras */}
        <div className="chart-section">
          <div className="chart-container">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Resumen estadístico */}
        <div className="fault-summary">
          <div className="summary-header">
            <h5>Resumen del Análisis</h5>
          </div>
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-label">Total de Muestras Válidas:</span>
              <span className="stat-value">{faultAnalysis.total}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Fallos SDC:</span>
              <span className="stat-value">{faultAnalysis.sdc}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Tasa de SDC:</span>
              <span className="stat-value">{getPercentage(faultAnalysis.sdc)}%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Tasa de Enmascaramiento:</span>
              <span className="stat-value">{getPercentage(faultAnalysis.faultMasked)}%</span>
            </div>
          </div>
        </div>

        {/* Explicación de métricas */}
        {/* <div className="metrics-explanation">
          <h5>Explicación de Métricas</h5>
          <div className="explanation-grid">
            <div className="explanation-item">
              <strong>SDC (Silent Data Corruption):</strong>
              <p>Fallos que alteran los datos sin ser detectados por el sistema, produciendo resultados incorrectos de manera silenciosa.</p>
            </div>
            <div className="explanation-item">
              <strong>Fault Masked:</strong>
              <p>Fallos que son enmascarados por la redundancia natural del sistema y no afectan el resultado final.</p>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default FaultMetricsComparison;