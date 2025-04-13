import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  LinearProgress,
  CircularProgress,
  Alert,
  AlertTitle,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import { 
  Air, 
  LocationOn, 
  AccessTime, 
  MasksOutlined, 
  DirectionsRun,
  ChildCare,
  ElderlyOutlined,
  Favorite,
  LocalHospital,
  History
} from '@mui/icons-material';

// Define interfaces for air quality data
interface PollutantData {
  pollutant: string;
  value: number;
  max: number;
  unit: string;
  status: string;
  description: string;
}

interface HistoricalData {
  date: string;
  value: number;
  status: string;
}

interface AirQualityStation {
  id: string;
  name: string;
  location: string;
  aqi: number;
  status: string;
  mainPollutant: string;
  lastUpdated: string;
}

interface AirQualityData {
  overallAqi: number;
  status: string;
  mainPollutant: string;
  pollutants: PollutantData[];
  stations: AirQualityStation[];
  historical: {
    daily: HistoricalData[];
    weekly: HistoricalData[];
  };
}

// Health advice by AQI status
const healthAdvice = {
  'Good': {
    general: 'Air quality is considered satisfactory, and air pollution poses little or no risk.',
    sensitive: 'It is a good day to be active outside.',
    icon: <Favorite color="success" />,
    color: 'success.main'
  },
  'Moderate': {
    general: 'Air quality is acceptable; however, there may be some health concern for a small number of people who are unusually sensitive to air pollution.',
    sensitive: 'Unusually sensitive people should consider reducing prolonged or intense outdoor activities.',
    icon: <DirectionsRun color="warning" />,
    color: 'warning.main'
  },
  'Unhealthy for Sensitive Groups': {
    general: 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.',
    sensitive: 'Active children and adults, and people with respiratory disease, such as asthma, should limit prolonged outdoor exertion.',
    icon: <MasksOutlined color="warning" />,
    color: '#ff9800'
  },
  'Unhealthy': {
    general: 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.',
    sensitive: 'Active children and adults, and people with respiratory disease, such as asthma, should avoid prolonged outdoor exertion; everyone else, especially children, should limit prolonged outdoor exertion.',
    icon: <MasksOutlined color="error" />,
    color: 'error.main'
  },
  'Very Unhealthy': {
    general: 'Health warnings of emergency conditions. The entire population is more likely to be affected.',
    sensitive: 'Active children and adults, and people with respiratory disease, such as asthma, should avoid all outdoor exertion; everyone else, especially children, should limit outdoor exertion.',
    icon: <LocalHospital color="error" />,
    color: '#d32f2f'
  },
  'Hazardous': {
    general: 'Health alert: everyone may experience more serious health effects.',
    sensitive: 'Everyone should avoid all outdoor exertion.',
    icon: <LocalHospital sx={{ color: '#7d0000' }} />,
    color: '#7d0000'
  }
};

// Helper function to get status color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'Good':
      return 'success.main';
    case 'Moderate':
      return 'warning.main';
    case 'Unhealthy for Sensitive Groups':
      return '#ff9800';
    case 'Unhealthy':
      return 'error.main';
    case 'Very Unhealthy':
      return '#d32f2f';
    case 'Hazardous':
      return '#7d0000';
    default:
      return 'info.main';
  }
};

const getAqiCategory = (aqi: number) => {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
};

const AirQualityPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [airQualityData, setAirQualityData] = useState<AirQualityData | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);

  useEffect(() => {
    const fetchAirQualityData = async () => {
      try {
        // In a real app, this would call your backend API
        // For now, we'll simulate with mock data
        
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        // Mock data
        const mockAirQualityData: AirQualityData = {
          overallAqi: 75,
          status: 'Moderate',
          mainPollutant: 'O₃',
          pollutants: [
            { pollutant: 'PM2.5', value: 15, max: 35, unit: 'μg/m³', status: 'Good', description: 'Fine particulate matter that can penetrate deep into the lungs and even enter the bloodstream.' },
            { pollutant: 'PM10', value: 25, max: 50, unit: 'μg/m³', status: 'Good', description: 'Inhalable particles that include dust, pollen, and mold spores.' },
            { pollutant: 'O₃ (Ozone)', value: 68, max: 100, unit: 'μg/m³', status: 'Moderate', description: 'Ground-level ozone created by chemical reactions between oxides of nitrogen and volatile organic compounds in sunlight.' },
            { pollutant: 'NO₂', value: 23, max: 200, unit: 'μg/m³', status: 'Good', description: 'Nitrogen dioxide primarily gets in the air from fuel combustion, especially in vehicles and power plants.' },
            { pollutant: 'SO₂', value: 5, max: 40, unit: 'μg/m³', status: 'Good', description: 'Sulfur dioxide is produced from burning fossil fuels and industrial processes.' },
            { pollutant: 'CO', value: 0.8, max: 10, unit: 'mg/m³', status: 'Good', description: 'Carbon monoxide is a harmful pollutant produced primarily from car exhausts.' }
          ],
          stations: [
            {
              id: 'station-1',
              name: 'Downtown',
              location: 'City Center',
              aqi: 75,
              status: 'Moderate',
              mainPollutant: 'O₃',
              lastUpdated: '5 minutes ago'
            },
            {
              id: 'station-2',
              name: 'North Hills',
              location: 'North District',
              aqi: 45,
              status: 'Good',
              mainPollutant: 'PM2.5',
              lastUpdated: '8 minutes ago'
            },
            {
              id: 'station-3',
              name: 'Riverside',
              location: 'East District',
              aqi: 85,
              status: 'Moderate',
              mainPollutant: 'O₃',
              lastUpdated: '3 minutes ago'
            },
            {
              id: 'station-4',
              name: 'West Park',
              location: 'West District',
              aqi: 52,
              status: 'Moderate',
              mainPollutant: 'PM10',
              lastUpdated: '7 minutes ago'
            },
            {
              id: 'station-5',
              name: 'South Valley',
              location: 'South District',
              aqi: 35,
              status: 'Good',
              mainPollutant: 'PM2.5',
              lastUpdated: '12 minutes ago'
            },
            {
              id: 'station-6',
              name: 'Industrial Zone',
              location: 'East Industrial Area',
              aqi: 110,
              status: 'Unhealthy for Sensitive Groups',
              mainPollutant: 'SO₂',
              lastUpdated: '6 minutes ago'
            }
          ],
          historical: {
            daily: [
              { date: '6AM', value: 45, status: 'Good' },
              { date: '9AM', value: 62, status: 'Moderate' },
              { date: '12PM', value: 78, status: 'Moderate' },
              { date: '3PM', value: 85, status: 'Moderate' },
              { date: '6PM', value: 70, status: 'Moderate' },
              { date: '9PM', value: 55, status: 'Moderate' },
              { date: 'Now', value: 75, status: 'Moderate' }
            ],
            weekly: [
              { date: 'Mon', value: 55, status: 'Moderate' },
              { date: 'Tue', value: 48, status: 'Good' },
              { date: 'Wed', value: 42, status: 'Good' },
              { date: 'Thu', value: 63, status: 'Moderate' },
              { date: 'Fri', value: 75, status: 'Moderate' },
              { date: 'Sat', value: 68, status: 'Moderate' },
              { date: 'Sun', value: 72, status: 'Moderate' }
            ]
          }
        };
        
        setAirQualityData(mockAirQualityData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching air quality data:', err);
        setError('Failed to load air quality data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchAirQualityData();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading air quality data...
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
      <Typography variant="h4" gutterBottom>Air Quality Monitoring</Typography>
      <Typography variant="body1" paragraph>
        Real-time air quality data from sensors across the city.
      </Typography>

      {airQualityData && (
        <>
          {/* Main AQI Display */}
          <Paper sx={{ p: 3, mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' } }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              mr: { xs: 0, sm: 5 },
              mb: { xs: 3, sm: 0 },
              p: 2,
              borderRadius: '50%',
              width: 120,
              height: 120,
              justifyContent: 'center',
              backgroundColor: `${getStatusColor(airQualityData.status)}20`
            }}>
              <Air sx={{ fontSize: 40, color: getStatusColor(airQualityData.status) }} />
              <Typography variant="h3" sx={{ mt: 1, color: getStatusColor(airQualityData.status) }}>
                {airQualityData.overallAqi}
              </Typography>
            </Box>
            <Box>
              <Typography variant="h5" sx={{ color: getStatusColor(airQualityData.status), fontWeight: 'bold' }}>
                {airQualityData.status}
              </Typography>
              <Typography variant="body1" sx={{ my: 1 }}>
                Current Air Quality Index (AQI) for the city center
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Main Pollutant: {airQualityData.mainPollutant}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Updated: {new Date().toLocaleTimeString()}
              </Typography>
            </Box>
          </Paper>

          {/* Health Advice */}
          <Typography variant="h5" gutterBottom>Health Recommendations</Typography>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
              {healthAdvice[airQualityData.status as keyof typeof healthAdvice].icon}
              <Typography variant="h6" sx={{ ml: 1 }}>
                Health Advice for {airQualityData.status} Air Quality
              </Typography>
            </Box>
            <Alert severity="info" icon={false} sx={{ mb: 2 }}>
              <AlertTitle>General Population</AlertTitle>
              {healthAdvice[airQualityData.status as keyof typeof healthAdvice].general}
            </Alert>

            <Alert severity="warning" icon={false}>
              <AlertTitle>Sensitive Groups</AlertTitle>
              {healthAdvice[airQualityData.status as keyof typeof healthAdvice].sensitive}
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">Sensitive groups include:</Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <ChildCare fontSize="large" color="primary" />
                      <Typography variant="caption" align="center" sx={{ mt: 0.5 }}>Children</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <ElderlyOutlined fontSize="large" color="primary" />
                      <Typography variant="caption" align="center" sx={{ mt: 0.5 }}>Elderly</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <LocalHospital fontSize="large" color="primary" />
                      <Typography variant="caption" align="center" sx={{ mt: 0.5 }}>Respiratory Conditions</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Favorite fontSize="large" color="primary" />
                      <Typography variant="caption" align="center" sx={{ mt: 0.5 }}>Heart Conditions</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Alert>
          </Paper>

          {/* Tabs for Pollutants and Stations */}
          <Box sx={{ width: '100%', mb: 3 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeTab} onChange={handleTabChange} aria-label="air quality tabs">
                <Tab label="Pollutants" />
                <Tab label="Monitoring Stations" />
                <Tab label="Historical Data" />
              </Tabs>
            </Box>
            
            {/* Pollutants Tab */}
            {activeTab === 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>Pollutant Levels</Typography>
                <Grid container spacing={3}>
                  {airQualityData.pollutants.map((item) => (
                    <Grid item xs={12} md={6} key={item.pollutant}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6">{item.pollutant}</Typography>
                            <Chip
                              label={item.status}
                              sx={{
                                bgcolor: `${getStatusColor(item.status)}20`,
                                color: getStatusColor(item.status),
                                fontWeight: 'bold'
                              }}
                            />
                          </Box>
                          <Typography variant="h5" sx={{ my: 1 }}>
                            {item.value} {item.unit}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" sx={{ flexGrow: 1 }}>0</Typography>
                            <Typography variant="body2">{item.max}</Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={(item.value / item.max) * 100}
                            sx={{ 
                              height: 8, 
                              borderRadius: 4,
                              backgroundColor: 'rgba(0,0,0,0.1)',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: getStatusColor(item.status)
                              }
                            }}
                          />
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Maximum acceptable: {item.max} {item.unit}
                          </Typography>
                          <Divider sx={{ my: 2 }} />
                          <Typography variant="body2" color="text.secondary">
                            {item.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
            
            {/* Monitoring Stations Tab */}
            {activeTab === 1 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>Air Quality Monitoring Stations</Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Data collected from {airQualityData.stations.length} monitoring stations distributed across the city.
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  {airQualityData.stations.map((station) => (
                    <Grid item xs={12} sm={6} md={4} key={station.id}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                            <LocationOn color="primary" />
                            <Box sx={{ ml: 1 }}>
                              <Typography variant="subtitle1">{station.name}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {station.location}
                              </Typography>
                            </Box>
                          </Box>
                          <Divider sx={{ my: 2 }} />
                          <Grid container spacing={1}>
                            <Grid item xs={4}>
                              <Box sx={{
                                p: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                bgcolor: `${getStatusColor(station.status)}20`,
                                borderRadius: 1
                              }}>
                                <Typography variant="h5" sx={{ color: getStatusColor(station.status) }}>{station.aqi}</Typography>
                                <Typography variant="body2">AQI</Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={8}>
                              <Box sx={{ ml: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: getStatusColor(station.status) }}>
                                  {station.status}
                                </Typography>
                                <Typography variant="body2">
                                  Main: {station.mainPollutant}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                  <AccessTime sx={{ fontSize: 14, color: 'text.secondary', mr: 0.5 }} />
                                  <Typography variant="caption" color="text.secondary">
                                    Updated {station.lastUpdated}
                                  </Typography>
                                </Box>
                              </Box>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
            
            {/* Historical Data Tab */}
            {activeTab === 2 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>Historical Air Quality</Typography>
                
                <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>Today's AQI Trend</Typography>
                <Card sx={{ mb: 4 }}>
                  <CardContent>
                    <Box sx={{ 
                      height: 200, 
                      display: 'flex', 
                      alignItems: 'flex-end',
                      justifyContent: 'space-between',
                      pb: 3
                    }}>
                      {airQualityData.historical.daily.map((item, index) => (
                        <Box 
                          key={index}
                          sx={{ 
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            width: `${100 / airQualityData.historical.daily.length}%`
                          }}
                        >
                          <Typography 
                            variant="body2" 
                            sx={{ mb: 1, color: getStatusColor(item.status) }}
                          >
                            {item.value}
                          </Typography>
                          <Box 
                            sx={{ 
                              width: '60%',
                              backgroundColor: getStatusColor(item.status),
                              height: `${(item.value / 150) * 100}%`,
                              minHeight: 20,
                              borderRadius: '4px 4px 0 0'
                            }}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                            {item.date}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ height: 12, width: 12, bgcolor: 'success.main', borderRadius: 6, mr: 1 }} />
                        <Typography variant="caption">0-50: Good</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ height: 12, width: 12, bgcolor: 'warning.main', borderRadius: 6, mr: 1 }} />
                        <Typography variant="caption">51-100: Moderate</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ height: 12, width: 12, bgcolor: '#ff9800', borderRadius: 6, mr: 1 }} />
                        <Typography variant="caption">101-150: Unhealthy for Sensitive Groups</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
                
                <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>This Week's AQI Trend</Typography>
                <Card>
                  <CardContent>
                    <Box sx={{ 
                      height: 200, 
                      display: 'flex', 
                      alignItems: 'flex-end',
                      justifyContent: 'space-between',
                      pb: 3
                    }}>
                      {airQualityData.historical.weekly.map((item, index) => (
                        <Box 
                          key={index}
                          sx={{ 
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            width: `${100 / airQualityData.historical.weekly.length}%`
                          }}
                        >
                          <Typography 
                            variant="body2" 
                            sx={{ mb: 1, color: getStatusColor(item.status) }}
                          >
                            {item.value}
                          </Typography>
                          <Box 
                            sx={{ 
                              width: '60%',
                              backgroundColor: getStatusColor(item.status),
                              height: `${(item.value / 150) * 100}%`,
                              minHeight: 20,
                              borderRadius: '4px 4px 0 0'
                            }}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                            {item.date}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default AirQualityPage;