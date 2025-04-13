import React from 'react';
import { Box } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const TrafficCongestionChart: React.FC = () => {
  // Mock data - typically this would come from an API call
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  
  // Generate mock congestion data
  const generateCongestionData = () => {
    // Simulate typical traffic patterns: morning and evening peaks
    return hours.map((_, index) => {
      if (index >= 7 && index <= 9) {
        // Morning rush hour (7-9am)
        return 60 + Math.floor(Math.random() * 25);
      } else if (index >= 16 && index <= 18) {
        // Evening rush hour (4-6pm)
        return 65 + Math.floor(Math.random() * 25); 
      } else if (index >= 11 && index <= 13) {
        // Lunch time (11am-1pm)
        return 40 + Math.floor(Math.random() * 15);
      } else if (index >= 22 || index <= 5) {
        // Night time (10pm-5am)
        return 5 + Math.floor(Math.random() * 15);
      } else {
        // Regular daytime
        return 25 + Math.floor(Math.random() * 20);
      }
    });
  };

  // Chart data
  const data = {
    labels: hours,
    datasets: [
      {
        label: 'Traffic Congestion Level (%)',
        data: generateCongestionData(),
        backgroundColor: (context: any) => {
          const value = context.dataset.data[context.dataIndex];
          // Color coding based on congestion levels
          if (value > 75) return 'rgba(255, 99, 132, 0.7)'; // High congestion (red)
          if (value > 50) return 'rgba(255, 159, 64, 0.7)'; // Moderate congestion (orange)
          if (value > 25) return 'rgba(255, 205, 86, 0.7)'; // Low congestion (yellow)
          return 'rgba(75, 192, 192, 0.7)'; // No congestion (green)
        },
        borderColor: 'rgba(53, 162, 235, 0.5)',
        borderWidth: 1,
      }
    ]
  };

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              const value = context.parsed.y;
              label += `${value}%`;
              
              // Add description based on congestion level
              if (value > 75) label += " (Heavy Traffic)";
              else if (value > 50) label += " (Moderate Traffic)";
              else if (value > 25) label += " (Light Traffic)";
              else label += " (Free Flow)";
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Congestion Level (%)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Hour of Day'
        }
      }
    }
  };

  return (
    <Box sx={{ height: 350 }}>
      <Bar data={data} options={options} />
    </Box>
  );
};

export default TrafficCongestionChart;