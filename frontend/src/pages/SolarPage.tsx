import React, { useState, useEffect, useContext } from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, CircularProgress, Alert } from '@mui/material';
import { SolarPower, BatteryChargingFull, ElectricBolt, LocationOn } from '@mui/icons-material';
import { LocationContext } from '../contexts/LocationContext';
import { solarService } from '../services/solarService';

interface SolarSystem {
  system_size_kw: number;
  panel_efficiency: number;
  daily_production_kwh: number;
  monthly_production_kwh: number;
  annual_production_kwh: number;
  co2_reduction_kg_year: number;
  cost_savings_monthly: number;
  cost_savings_annual: number;
  estimated_system_cost: number;
  estimated_payback_years: number;
  hourly_data?: {
    timestamp: string;
    production_kwh: number;
  }[];
}

const solarLocations = [
  { name: 'City Hall Roof', capacity: 75, currentOutput: 68, efficiency: 91, status: 'Optimal' },
  { name: 'Community Center', capacity: 50, currentOutput: 45, efficiency: 90, status: 'Optimal' },
  { name: 'Downtown Parking', capacity: 120, currentOutput: 105, efficiency: 88, status: 'Optimal' },
  { name: 'Western District Park', capacity: 80, currentOutput: 62, efficiency: 78, status: 'Maintenance Required' },
  { name: 'Public Library', capacity: 40, currentOutput: 35, efficiency: 88, status: 'Optimal' },
  { name: 'Water Treatment Plant', capacity: 90, currentOutput: 78, efficiency: 87, status: 'Optimal' },
];

const SolarPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [solarData, setSolarData] = useState<{systems: SolarSystem[], weather_conditions?: string, data_source?: string} | null>(null);
  const locationContext = useContext(LocationContext);
  const userLocation = locationContext?.location;

  // Calculate totals for the summary stats - fallback to mock data if API fails
  const totalCapacity = solarLocations.reduce((sum, location) => sum + location.capacity, 0);
  const totalOutput = solarLocations.reduce((sum, location) => sum + location.currentOutput, 0);
  const averageEfficiency = Math.round(
    solarLocations.reduce((sum, location) => sum + location.efficiency, 0) / solarLocations.length
  );

  useEffect(() => {
    const fetchSolarData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use user location if available, otherwise API will use defaults
        const lat = userLocation ? userLocation.lat : null;
        const lon = userLocation ? userLocation.lon : null;
        
        console.log('Fetching solar data with location:', lat, lon);
        const data = await solarService.getSolarEstimate(lat, lon);
        setSolarData(data);
        console.log('Solar data fetched successfully:', data);
      } catch (err) {
        console.error('Error fetching solar data:', err);
        setError('Unable to load solar data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSolarData();
  }, [userLocation]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Solar Energy Management</Typography>
      <Typography variant="body1" paragraph>
        Monitor and manage solar energy production and consumption across the city.
        {userLocation ? (
          <Typography component="span" color="primary.main">
            {` Using your location: ${userLocation.city || `${userLocation.lat.toFixed(4)}, ${userLocation.lon.toFixed(4)}`}`}
          </Typography>
        ) : (
          <Typography component="span" color="text.secondary">
            {' Enable location services for personalized solar estimates.'}
          </Typography>
        )}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SolarPower fontSize="large" sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="h5">Total Capacity</Typography>
            </Box>
            <Box sx={{ mt: 2 }}>
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                <>
                  <Typography variant="h3" sx={{ mb: 1 }}>
                    {solarData?.systems?.reduce((sum, system) => sum + system.system_size_kw, 0) || totalCapacity} kW
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Available across {solarData?.systems?.length || solarLocations.length} system sizes
                  </Typography>
                </>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ElectricBolt fontSize="large" sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="h5">Annual Production</Typography>
            </Box>
            <Box sx={{ mt: 2 }}>
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                <>
                  <Typography variant="h3" sx={{ mb: 1 }}>
                    {solarData?.systems 
                      ? Math.round(solarData.systems
                          .filter(system => system.system_size_kw === 5)[0]?.annual_production_kwh || 0)
                      : totalOutput} kWh
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Estimated for a 5kW system
                  </Typography>
                </>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <BatteryChargingFull fontSize="large" sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="h5">System Efficiency</Typography>
            </Box>
            <Box sx={{ mt: 2 }}>
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                <>
                  <Typography variant="h3" sx={{ mb: 1 }}>
                    {solarData?.systems 
                      ? Math.round(solarData.systems
                          .reduce((sum, system) => sum + system.panel_efficiency, 0) / solarData.systems.length)
                      : averageEfficiency}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average panel efficiency
                  </Typography>
                  {solarData?.data_source && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Source: {solarData.data_source}
                    </Typography>
                  )}
                </>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Typography variant="h5" gutterBottom>Solar System Options</Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : solarData?.systems ? (
        <Grid container spacing={3}>
          {solarData.systems.map((system) => (
            <Grid item xs={12} md={6} key={system.system_size_kw}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SolarPower sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">{system.system_size_kw} kW System</Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Daily Production</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{system.daily_production_kwh.toFixed(1)} kWh</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Annual Production</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{system.annual_production_kwh.toFixed(0)} kWh</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">CO2 Reduction</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{system.co2_reduction_kg_year.toFixed(0)} kg/year</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Panel Efficiency</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{system.panel_efficiency}%</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Monthly Savings</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>${system.cost_savings_monthly.toFixed(2)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Payback Period</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{system.estimated_payback_years.toFixed(1)} years</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={3}>
          {solarLocations.map((location) => (
            <Grid item xs={12} md={6} key={location.name}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="h6">{location.name}</Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Capacity</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{location.capacity} kW</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Current Output</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{location.currentOutput} kW</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Efficiency</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{location.efficiency}%</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Status</Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 'bold', 
                          color: location.status === 'Optimal' ? 'success.main' : 'warning.main' 
                        }}
                      >
                        {location.status}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default SolarPage;