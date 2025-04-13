import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, CircularProgress, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from 'recharts';

interface Road {
  id: number;
  name: string;
  congestion_score: number;
}

interface PredictionItem {
  road_id: number;
  road_name: string;
  congestion_score: number;
  timestamp: string;
}

interface Prediction {
  timestamp: string;
  hours_ahead: number;
  predictions: PredictionItem[];
}

interface TrafficPredictionChartProps {
  roads?: Road[];
  prediction?: Prediction;
}

interface TrafficPredictionData {
  time: string;
  actual: number | null;
  predicted: number;
  congestionIndex: number;
}

const TrafficPredictionChart: React.FC<TrafficPredictionChartProps> = ({ roads, prediction }) => {
  const [loading, setLoading] = useState(true);
  const [predictionData, setPredictionData] = useState<TrafficPredictionData[]>([]);
  const [timeRange, setTimeRange] = useState<string>('24h');

  // Generate mock prediction data
  const generateMockData = (range: string): TrafficPredictionData[] => {
    // If real data is provided through props, use that instead
    if (roads && prediction) {
      // Transform the provided data to match our chart format
      const currentTime = new Date();
      const predictionTime = new Date(prediction.timestamp);
      
      // Create a simplified dataset with current and predicted values
      return roads.map((road, index) => {
        const predictedItem = prediction.predictions.find(p => p.road_id === road.id);
        return {
          time: road.name,
          actual: road.congestion_score,
          predicted: predictedItem ? predictedItem.congestion_score : 0,
          congestionIndex: road.congestion_score / 100
        };
      });
    }

    // Otherwise use generated mock data
    const data: TrafficPredictionData[] = [];
    const now = new Date();
    let hours;
    
    switch(range) {
      case '6h':
        hours = 6;
        break;
      case '12h':
        hours = 12;
        break;
      case '7d':
        hours = 168; // 7 * 24
        break;
      case '24h':
      default:
        hours = 24;
        break;
    }
    
    // Create data points
    for (let i = 0; i <= hours; i++) {
      const time = new Date(now);
      time.setHours(now.getHours() - hours + i);
      
      // Simulate a traffic pattern with morning and evening peaks
      const hourOfDay = time.getHours();
      let baseValue;
      
      if (hourOfDay >= 7 && hourOfDay <= 9) {
        // Morning rush hour
        baseValue = 70 + Math.random() * 20;
      } else if (hourOfDay >= 16 && hourOfDay <= 18) {
        // Evening rush hour
        baseValue = 75 + Math.random() * 20;
      } else if (hourOfDay >= 10 && hourOfDay <= 15) {
        // Midday
        baseValue = 40 + Math.random() * 15;
      } else {
        // Night
        baseValue = 15 + Math.random() * 15;
      }
      
      // If weekend, reduce traffic
      if (time.getDay() === 0 || time.getDay() === 6) {
        baseValue *= 0.7;
      }
      
      const actual = i < hours * 0.8 ? baseValue : null; // No actual data for future times
      const randomVariation = Math.random() * 10 - 5;
      const predicted = baseValue + randomVariation;
      const congestionIndex = baseValue / 100; // Normalize to 0-1 range
      
      data.push({
        time: time.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        actual: actual,
        predicted: predicted,
        congestionIndex: parseFloat(congestionIndex.toFixed(2))
      });
    }
    
    return data;
  };

  useEffect(() => {
    // Simulate API call to fetch prediction data
    const fetchData = async () => {
      try {
        // In a real app, this would be a fetch call
        await new Promise(resolve => setTimeout(resolve, 1000));
        const mockData = generateMockData(timeRange);
        setPredictionData(mockData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching traffic prediction data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  const handleTimeRangeChange = (event: any) => {
    setTimeRange(event.target.value);
    setLoading(true);
  };

  return (
    <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2">
          Traffic Prediction Analysis
        </Typography>
        <FormControl size="small" sx={{ width: 120 }}>
          <InputLabel id="time-range-label">Time Range</InputLabel>
          <Select
            labelId="time-range-label"
            id="time-range-select"
            value={timeRange}
            label="Time Range"
            onChange={handleTimeRangeChange}
          >
            <MenuItem value="6h">Last 6h</MenuItem>
            <MenuItem value="12h">Last 12h</MenuItem>
            <MenuItem value="24h">Last 24h</MenuItem>
            <MenuItem value="7d">Last 7d</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={predictionData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip 
                formatter={(value: any, name: string) => {
                  if (name === 'congestionIndex') {
                    return [`${(value * 100).toFixed(0)}%`, 'Congestion Level'];
                  }
                  return [value, name === 'actual' ? 'Actual Traffic' : 'Predicted Traffic'];
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="congestionIndex" 
                fill="rgba(255, 99, 132, 0.2)" 
                stroke="rgba(255, 99, 132, 1)" 
                name="congestionIndex" 
              />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="#8884d8" 
                strokeWidth={2} 
                dot={{ r: 1 }} 
                name="actual" 
              />
              <Line 
                type="monotone" 
                dataKey="predicted" 
                stroke="#82ca9d" 
                strokeWidth={2} 
                strokeDasharray="5 5" 
                dot={{ r: 1 }} 
                name="predicted" 
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Box>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Chart shows actual traffic measurements and AI predictions for future congestion levels.
        The shaded area represents the overall congestion index (0-100%).
      </Typography>
    </Paper>
  );
};

export default TrafficPredictionChart;