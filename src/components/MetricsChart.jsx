import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import './MetricsChart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const MetricsChart = ({ goldenMetrics, faultMetrics, campaignResults, numSamples = 10 }) => {
  // Función para extraer métricas reales
  const extractMetrics = () => {
    console.log('🔍 DEBUG: goldenMetrics:', goldenMetrics);
    console.log('🔍 DEBUG: faultMetrics:', faultMetrics);
    
    // Extraer precisión y exactitud de las métricas
    const goldenAccuracy = goldenMetrics?.accuracy || 0;
    const goldenPrecision = goldenMetrics?.precision || 0;
    const faultAccuracy = faultMetrics?.accuracy || 0;
    const faultPrecision = faultMetrics?.precision || 0;
    
    return {
      goldenAccuracy: goldenAccuracy * 100, // Convertir a porcentaje
      goldenPrecision: goldenPrecision * 100,
      faultAccuracy: faultAccuracy * 100,
      faultPrecision: faultPrecision * 100
    };
  };

  const metrics = extractMetrics();

  // Datos para el diagrama de barras
  const barChartData = {
    labels: ['Red Golden (Sin Fallos)', 'Red con Fallos Inyectados'],
    datasets: [
      {
        label: 'Exactitud (Accuracy)',
        data: [metrics.goldenAccuracy, metrics.faultAccuracy],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: '#10b981',
        borderWidth: 2,
      },
      {
        label: 'Precisión (Precision)',
        data: [metrics.goldenPrecision, metrics.faultPrecision],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: '#3b82f6',
        borderWidth: 2,
      },
    ],
  };

  // Opciones para el diagrama de barras
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}%`;
          },
        },
      },
      title: {
        display: true,
        text: 'Comparación de Métricas: Precisión y Exactitud',
        font: {
          size: 16,
          weight: 'bold',
        },
        padding: 20,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Tipo de Red',
          font: {
            size: 14,
            weight: 'bold',
          },
        },
        grid: {
          display: false,
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Porcentaje (%)',
          font: {
            size: 14,
            weight: 'bold',
          },
        },
        min: 0,
        max: 100,
        ticks: {
          callback: function(value) {
            return `${value}%`;
          },
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  return (
    <div className="metrics-charts-container">
      <div className="charts-header">
        <h4>Comparación de Métricas de Rendimiento</h4>
        <p>Análisis de precisión y exactitud entre red Golden y red con fallos inyectados</p>
      </div>
      
      <div className="single-chart-container">
        <div className="chart-section">
          <div className="chart-info">
            {/* <div className="chart-description">
              <p>Este diagrama de barras compara las métricas de rendimiento entre ambas redes.</p>
              <p>Muestra la exactitud (accuracy) y precisión (precision) como porcentajes para facilitar la comparación.</p>
            </div> */}
            <div className="metric-summary">
              {goldenMetrics && faultMetrics && (
                <>
                  <span className="golden-accuracy">
                    Golden - Exactitud: {metrics.goldenAccuracy.toFixed(2)}% | Precisión: {metrics.goldenPrecision.toFixed(2)}%
                  </span>
                  <span className="fault-accuracy">
                    Con Fallos - Exactitud: {metrics.faultAccuracy.toFixed(2)}% | Precisión: {metrics.faultPrecision.toFixed(2)}%
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="chart-container">
            <Bar data={barChartData} options={options} />
          </div>
        </div>
      </div>

      {campaignResults && (
        <div className="chart-summary">
          <div className="summary-item">
            <span className="summary-label">Diferencia en Exactitud:</span>
            <span className="summary-value">
              {(metrics.goldenAccuracy - metrics.faultAccuracy).toFixed(2)}%
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Diferencia en Precisión:</span>
            <span className="summary-value">
              {(metrics.goldenPrecision - metrics.faultPrecision).toFixed(2)}%
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Número de Muestras:</span>
            <span className="summary-value">{numSamples}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricsChart;