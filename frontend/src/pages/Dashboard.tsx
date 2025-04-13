import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  LinearProgress, 
  Alert, 
  AlertTitle, 
  Divider, 
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress
} from '@mui/material';
import { 
  WbSunny, 
  AirOutlined, 
  DirectionsCar, 
  Sensors, 
  Delete, 
  SolarPower,
  DirectionsBus,
  Warning,
  NotificationsActive,
  ReportProblem
} from '@mui/icons-material';

interface CityData {
  weather: {
    temperature: number;
    condition: string;
    humidity: number;
    wind: number;
  };
  airQuality: {
    index: number;
    status: string;
    mainPollutant: string;
  };
  traffic: {
    averageDelay: number;
    congestionLevel: string;
    incidents: number;
  };
  sensors: {
    online: number;
    total: number;
    alerting: number;
  };
  waste: {
    binsNearCapacity: number;
    nextCollection: string;
    recyclingRate: number;
  };
  solar: {
    currentProduction: number;
    dailyForecast: number;
    savings: number;
  };
  transit: {
    onTimeRate: number;
    activeVehicles: number;
    ridership: number;
  };
  alerts: Array<{
    id: number;
    type: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
    timestamp: string;
  }>;
  reports: Array<{
    id: number;
    type: string;
    status: string;
    location: string;
    timestamp: string;
  }>;
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cityData, setCityData] = useState<CityData | null>(null);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // In a real app, this would be a single API call or multiple calls
        // For now, we'll simulate with mock data
        
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        const mockData: CityData = {
          weather: {
            temperature: 24,
            condition: 'Sunny',
            humidity: 45,
            wind: 8
          },
          airQuality: {
            index: 75,
            status: 'Good',
            mainPollutant: 'PM2.5'
          },
          traffic: {
            averageDelay: 15,
            congestionLevel: 'Moderate',
            incidents: 3
          },
          sensors: {
            online: 356,
            total: 382,
            alerting: 5
          },
          waste: {
            binsNearCapacity: 12,
            nextCollection: 'Tomorrow, 8AM',
            recyclingRate: 85
          },
          solar: {
            currentProduction: 45,
            dailyForecast: 52,
            savings: 1250
          },
          transit: {
            onTimeRate: 98,
            activeVehicles: 45,
            ridership: 12500
          },
          alerts: [
            {
              id: 1,
              type: 'Traffic',
              severity: 'medium',
              message: 'Construction on Main Street causing delays of approximately 15 minutes',
              timestamp: new Date(Date.now() - 1800000).toISOString() // 30 minutes ago
            },
            {
              id: 2,
              type: 'Weather',
              severity: 'low',
              message: 'Light rain expected this evening',
              timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
            },
            {
              id: 3,
              type: 'Infrastructure',
              severity: 'high',
              message: 'Power outage reported in downtown area, affecting 120 households',
              timestamp: new Date(Date.now() - 900000).toISOString() // 15 minutes ago
            }
          ],
          reports: [
            {
              id: 1,
              type: 'Pothole',
              status: 'Under Review',
              location: 'Main St & 5th Ave',
              timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
            },
            {
              id: 2,
              type: 'Graffiti',
              status: 'Assigned',
              location: 'Central Park West Entrance',
              timestamp: new Date(Date.now() - 172800000).toISOString() // 2 days ago
            },
            {
              id: 3,
              type: 'Street Light',
              status: 'Completed',
              location: 'Oak Avenue & River Rd',
              timestamp: new Date(Date.now() - 259200000).toISOString() // 3 days ago
            }
          ]
        };
        
        setCityData(mockData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  const getAirQualityColor = (index: number) => {
    if (index > 100) return 'error.main';
    if (index > 50) return 'warning.main';
    return 'success.main';
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'info';
    }
  };
  
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading city data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        <AlertTitle>Error</AlertTitle>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Smart City Dashboard
      </Typography>
      <Typography variant="body1" paragraph>
        Welcome to the Smart City management system. Monitor and manage city infrastructure and services from this central dashboard.
      </Typography>
      
      {cityData && (
        <>
          {/* Key Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={4} lg={3}>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 2, 
                  display: 'flex', 
                  flexDirection: 'column',
                  height: '100%',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 3
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" color="text.secondary">
                    Weather
                  </Typography>
                  <Box sx={{ color: 'primary.main' }}>
                    <WbSunny />
                  </Box>
                </Box>
                <Typography variant="h4" component="div">
                  {`${cityData.weather.temperature}°C`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {cityData.weather.condition}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" display="block">
                    Humidity: {cityData.weather.humidity}%
                  </Typography>
                  <Typography variant="caption" display="block">
                    Wind: {cityData.weather.wind} km/h
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={4} lg={3}>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 2, 
                  display: 'flex', 
                  flexDirection: 'column',
                  height: '100%',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 3
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" color="text.secondary">
                    Air Quality
                  </Typography>
                  <Box sx={{ color: getAirQualityColor(cityData.airQuality.index) }}>
                    <AirOutlined />
                  </Box>
                </Box>
                <Typography variant="h4" component="div">
                  {cityData.airQuality.index}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {cityData.airQuality.status}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" display="block">
                    Main pollutant: {cityData.airQuality.mainPollutant}
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={4} lg={3}>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 2, 
                  display: 'flex', 
                  flexDirection: 'column',
                  height: '100%',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 3
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" color="text.secondary">
                    Traffic
                  </Typography>
                  <Box sx={{ color: 'primary.main' }}>
                    <DirectionsCar />
                  </Box>
                </Box>
                <Typography variant="h4" component="div">
                  {`${cityData.traffic.averageDelay} min`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {cityData.traffic.congestionLevel} Congestion
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" display="block">
                    Active incidents: {cityData.traffic.incidents}
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={4} lg={3}>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 2, 
                  display: 'flex', 
                  flexDirection: 'column',
                  height: '100%',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 3
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" color="text.secondary">
                    Sensors
                  </Typography>
                  <Box sx={{ color: 'primary.main' }}>
                    <Sensors />
                  </Box>
                </Box>
                <Typography variant="h4" component="div">
                  {cityData.sensors.online}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sensors Online
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ flexGrow: 1 }}>
                      {cityData.sensors.online} of {cityData.sensors.total} operational
                    </Typography>
                    <Typography variant="caption">
                      {Math.round((cityData.sensors.online / cityData.sensors.total) * 100)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(cityData.sensors.online / cityData.sensors.total) * 100} 
                    sx={{ mt: 0.5 }}
                  />
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Sensors alerting: {cityData.sensors.alerting}
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={4} lg={3}>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 2, 
                  display: 'flex', 
                  flexDirection: 'column',
                  height: '100%',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 3
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" color="text.secondary">
                    Waste Collection
                  </Typography>
                  <Box sx={{ color: 'primary.main' }}>
                    <Delete />
                  </Box>
                </Box>
                <Typography variant="h4" component="div">
                  {`${cityData.waste.recyclingRate}%`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Recycling Rate
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" display="block">
                    Next collection: {cityData.waste.nextCollection}
                  </Typography>
                  <Typography variant="caption" display="block">
                    Bins near capacity: {cityData.waste.binsNearCapacity}
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={4} lg={3}>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 2, 
                  display: 'flex', 
                  flexDirection: 'column',
                  height: '100%',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 3
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" color="text.secondary">
                    Solar Production
                  </Typography>
                  <Box sx={{ color: 'primary.main' }}>
                    <SolarPower />
                  </Box>
                </Box>
                <Typography variant="h4" component="div">
                  {`${cityData.solar.currentProduction} kW`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Current Power Generation
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" display="block">
                    Today's forecast: {cityData.solar.dailyForecast} kWh
                  </Typography>
                  <Typography variant="caption" display="block">
                    Monthly savings: ${cityData.solar.savings}
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={4} lg={3}>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 2, 
                  display: 'flex', 
                  flexDirection: 'column',
                  height: '100%',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 3
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" color="text.secondary">
                    Public Transit
                  </Typography>
                  <Box sx={{ color: 'primary.main' }}>
                    <DirectionsBus />
                  </Box>
                </Box>
                <Typography variant="h4" component="div">
                  {`${cityData.transit.onTimeRate}%`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  On-Time Rate
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" display="block">
                    Active vehicles: {cityData.transit.activeVehicles}
                  </Typography>
                  <Typography variant="caption" display="block">
                    Daily ridership: {cityData.transit.ridership.toLocaleString()}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Alerts and Citizen Reports */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h5" gutterBottom>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NotificationsActive color="warning" />
                  Recent Alerts
                </Box>
              </Typography>
              <Paper elevation={2}>
                <List>
                  {cityData.alerts.length > 0 ? (
                    cityData.alerts.map((alert) => (
                      <React.Fragment key={alert.id}>
                        <ListItem alignItems="flex-start">
                          <ListItemIcon>
                            <Warning color={getSeverityColor(alert.severity) as any} />
                          </ListItemIcon>
                          <ListItemText 
                            primary={
                              <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="subtitle2">{alert.type}</Typography>
                                <Typography variant="caption">{formatTimeAgo(alert.timestamp)}</Typography>
                              </Box>
                            } 
                            secondary={alert.message}
                          />
                        </ListItem>
                        <Divider component="li" />
                      </React.Fragment>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText primary="No critical alerts at this time." />
                    </ListItem>
                  )}
                </List>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h5" gutterBottom>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ReportProblem color="info" />
                  Citizen Reports
                </Box>
              </Typography>
              <Paper elevation={2}>
                <List>
                  {cityData.reports.length > 0 ? (
                    cityData.reports.map((report) => (
                      <React.Fragment key={report.id}>
                        <ListItem alignItems="flex-start">
                          <ListItemText 
                            primary={
                              <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="subtitle2">{report.type}</Typography>
                                <Typography variant="caption">{report.status}</Typography>
                              </Box>
                            } 
                            secondary={
                              <>
                                <Typography variant="body2" component="span">
                                  {report.location}
                                </Typography>
                                <Typography variant="caption" component="span" sx={{ float: 'right' }}>
                                  {formatTimeAgo(report.timestamp)}
                                </Typography>
                              </>
                            }
                          />
                        </ListItem>
                        <Divider component="li" />
                      </React.Fragment>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText primary="No recent citizen reports." />
                    </ListItem>
                  )}
                </List>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default Dashboard;