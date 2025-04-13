import React from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, LinearProgress } from '@mui/material';
import { Delete, LocationOn, Recycling, LocalShipping } from '@mui/icons-material';

const wasteCollectionData = [
  { district: 'Downtown', filled: 78, trucks: 3, nextCollection: '2h 15m' },
  { district: 'North District', filled: 65, trucks: 2, nextCollection: '5h 30m' },
  { district: 'West Hills', filled: 42, trucks: 2, nextCollection: '8h 45m' },
  { district: 'East Park', filled: 85, trucks: 3, nextCollection: '1h 10m' },
  { district: 'South Bay', filled: 72, trucks: 2, nextCollection: '3h 20m' },
  { district: 'Industrial Zone', filled: 58, trucks: 4, nextCollection: '6h 00m' },
];

const WastePage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Waste Management</Typography>
      <Typography variant="body1" paragraph>
        Monitor and optimize waste collection across the city.
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Delete fontSize="large" sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="h5">Collection Status</Typography>
            </Box>
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'flex-end' }}>
              <Typography variant="h3" sx={{ mr: 1 }}>85%</Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>on schedule</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              14 out of 16 collection routes on schedule today
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <LocalShipping fontSize="large" sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="h5">Fleet Status</Typography>
            </Box>
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'flex-end' }}>
              <Typography variant="h3" sx={{ mr: 1 }}>24</Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>vehicles active</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              24 active, 3 in maintenance, 1 reporting issues
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Recycling fontSize="large" sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="h5">Recycling Rate</Typography>
            </Box>
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'flex-end' }}>
              <Typography variant="h3" sx={{ mr: 1 }}>42%</Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>materials recycled</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Up 5% from last month, 12% from last year
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Typography variant="h5" gutterBottom>District Collection Status</Typography>
      <Grid container spacing={3}>
        {wasteCollectionData.map((district) => (
          <Grid item xs={12} md={6} key={district.district}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="h6">{district.district}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Next Collection: <strong>{district.nextCollection}</strong>
                  </Typography>
                </Box>
                
                <Box sx={{ my: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">Bin Fill Level</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {district.filled}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={district.filled} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: district.filled > 80 ? 'error.main' : 
                                        district.filled > 60 ? 'warning.main' : 'success.main'
                      }
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <LocalShipping fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    {district.trucks} {district.trucks === 1 ? 'truck' : 'trucks'} assigned
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default WastePage;