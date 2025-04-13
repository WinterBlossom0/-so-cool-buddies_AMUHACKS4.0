import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import { Traffic, Warning, DirectionsCar } from '@mui/icons-material';
import TrafficCongestionChart from '../components/traffic/TrafficCongestionChart';
import TrafficIncidentsList from '../components/traffic/TrafficIncidentsList';
import TrafficMap from '../components/traffic/TrafficMap';
import TrafficPredictionChart from '../components/traffic/TrafficPredictionChart';

const TrafficPage: React.FC = () => {
  // Mock data for TrafficPredictionChart
  const mockRoads = [
    { id: 1, name: 'Main Street', congestion_score: 75 },
    { id: 2, name: 'Oak Avenue', congestion_score: 62 },
    { id: 3, name: 'River Road', congestion_score: 40 },
    { id: 4, name: 'Central Parkway', congestion_score: 85 },
    { id: 5, name: 'Market Street', congestion_score: 55 }
  ];
  
  const mockPrediction = {
    timestamp: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours ahead
    hours_ahead: 2,
    predictions: [
      { road_id: 1, road_name: 'Main Street', congestion_score: 80, timestamp: new Date().toISOString() },
      { road_id: 2, road_name: 'Oak Avenue', congestion_score: 45, timestamp: new Date().toISOString() },
      { road_id: 3, road_name: 'River Road', congestion_score: 60, timestamp: new Date().toISOString() },
      { road_id: 4, road_name: 'Central Parkway', congestion_score: 70, timestamp: new Date().toISOString() },
      { road_id: 5, road_name: 'Market Street', congestion_score: 65, timestamp: new Date().toISOString() }
    ]
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Traffic Management</Typography>
      <Typography variant="body1" paragraph>
        Real-time traffic monitoring and management across the city.
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Traffic fontSize="large" sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="h5">Traffic Status</Typography>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="h3" sx={{ color: 'warning.main' }}>Moderate</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Current average travel time is 15% higher than normal
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Warning fontSize="large" sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="h5">Active Incidents</Typography>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="h3">4</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                3 minor accidents, 1 road construction
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <DirectionsCar fontSize="large" sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="h5">Vehicle Volume</Typography>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="h3">12,450</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Vehicles currently on main roads
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Traffic Map</Typography>
            <TrafficMap />
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Active Incidents</Typography>
            <TrafficIncidentsList />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Congestion by Hour</Typography>
            <TrafficCongestionChart />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Predicted Traffic for Today</Typography>
            <TrafficPredictionChart roads={mockRoads} prediction={mockPrediction} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TrafficPage;