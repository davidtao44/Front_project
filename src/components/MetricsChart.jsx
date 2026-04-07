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

  // Data for the bar chart
  const barChartData = {
    labels: ['Golden Network (No Faults)', 'Network with Injected Faults'],
    datasets: [
      {
        label: 'Accuracy',
        data: [metrics.goldenAccuracy, metrics.faultAccuracy],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: '#10b981',
        borderWidth: 2,
      },
      {
        label: 'Precision',
        data: [metrics.goldenPrecision, metrics.faultPrecision],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: '#3b82f6',
        borderWidth: 2,
      },
    ],
  };

  // Options for the bar chart
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
        text: 'Metrics Comparison: Accuracy and Precision',
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
          text: 'Network Type',
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
          text: 'Percentage (%)',
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
        <h4>Performance Metrics Comparison</h4>
        <p>Analysis of accuracy and precision between Golden network and network with injected faults</p>
      </div>
      
      <div className="single-chart-container">
        <div className="chart-section">
          <div className="chart-info">
            <div className="metric-summary">
              {goldenMetrics && faultMetrics && (
                <>
                  <span className="golden-accuracy">
                    Golden - Accuracy: {metrics.goldenAccuracy.toFixed(2)}% | Precision: {metrics.goldenPrecision.toFixed(2)}%
                  </span>
                  <span className="fault-accuracy">
                    With Faults - Accuracy: {metrics.faultAccuracy.toFixed(2)}% | Precision: {metrics.faultPrecision.toFixed(2)}%
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
            <span className="summary-label">Accuracy Difference:</span>
            <span className="summary-value">
              {(metrics.goldenAccuracy - metrics.faultAccuracy).toFixed(2)}%
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Precision Difference:</span>
            <span className="summary-value">
              {(metrics.goldenPrecision - metrics.faultPrecision).toFixed(2)}%
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Number of Samples:</span>
            <span className="summary-value">{numSamples}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricsChart;