import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Card, 
  CardContent, 
  Stack,
  Grid,
  CircularProgress,
  Alert,
  AlertTitle,
  Tabs,
  Tab,
  Divider,
  LinearProgress
} from '@mui/material';
import { 
  WbSunny, 
  Air, 
  Opacity, 
  Thermostat, 
  Cloud, 
  Thunderstorm, 
  Grain, 
  AcUnit,
  Visibility,
  Explore,
  LocationOn,
  AccessTime
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { Theme } from '@mui/material/styles';

// Create a styled component for layout
const Item = styled(Paper)(({ theme }: { theme: Theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(2),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

// Define interfaces for weather data
interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  pressure: number;
  visibility: number;
  uvIndex: number;
  sunrise: string;
  sunset: string;
}

interface HourlyForecast {
  time: string;
  temperature: number;
  condition: string;
  icon: string;
  precipProbability: number;
  windSpeed: number;
}

interface DailyForecast {
  date: string;
  day: string;
  maxTemp: number;
  minTemp: number;
  condition: string;
  icon: string;
  sunrise: string;
  sunset: string;
  precipProbability: number;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
}

interface WeatherStation {
  id: string;
  name: string;
  location: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  lastUpdated: string;
}

interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  stations: WeatherStation[];
}

const WeatherPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        // In a real app, this would call your backend API
        // For now, we'll simulate with mock data
        
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        // Mock data
        const mockWeatherData: WeatherData = {
          current: {
            temperature: 24,
            feelsLike: 26,
            condition: 'Sunny',
            icon: 'clear',
            humidity: 45,
            windSpeed: 8,
            windDirection: 'NE',
            pressure: 1012,
            visibility: 10,
            uvIndex: 6,
            sunrise: '06:15 AM',
            sunset: '8:23 PM',
          },
          hourly: Array(24).fill(null).map((_, i) => {
            const hour = new Date();
            hour.setHours(hour.getHours() + i);
            const temp = 20 + Math.sin(i / 4) * 5 + Math.random() * 2;
            const conditions = ['Clear', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Clear', 'Clear'];
            const icons = ['clear', 'partly-cloudy', 'cloudy', 'rain', 'clear', 'clear'];
            const conditionIndex = Math.floor(Math.random() * conditions.length);
            
            return {
              time: hour.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
              temperature: Math.round(temp * 10) / 10,
              condition: conditions[conditionIndex],
              icon: icons[conditionIndex],
              precipProbability: Math.round(Math.random() * 30),
              windSpeed: 5 + Math.random() * 10,
            };
          }),
          daily: Array(7).fill(null).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const minTemp = 15 + Math.random() * 5;
            const maxTemp = minTemp + 5 + Math.random() * 8;
            const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Sunny', 'Clear'];
            const icons = ['clear', 'partly-cloudy', 'cloudy', 'rain', 'clear', 'clear'];
            const conditionIndex = Math.floor(Math.random() * conditions.length);
            
            return {
              date: date.toLocaleDateString(),
              day: date.toLocaleDateString('en-US', {weekday: 'short'}),
              maxTemp: Math.round(maxTemp * 10) / 10,
              minTemp: Math.round(minTemp * 10) / 10,
              condition: conditions[conditionIndex],
              icon: icons[conditionIndex],
              sunrise: '06:15 AM',
              sunset: '8:20 PM',
              precipProbability: Math.round(Math.random() * 40),
              humidity: 40 + Math.round(Math.random() * 40),
              windSpeed: 5 + Math.random() * 10,
              uvIndex: 1 + Math.floor(Math.random() * 10),
            };
          }),
          stations: [
            {
              id: 'station-1',
              name: 'Downtown',
              location: 'City Center',
              temperature: 24.5,
              humidity: 48,
              windSpeed: 7.2,
              lastUpdated: '5 minutes ago'
            },
            {
              id: 'station-2',
              name: 'North Hills',
              location: 'North District',
              temperature: 22.8,
              humidity: 52,
              windSpeed: 9.5,
              lastUpdated: '8 minutes ago'
            },
            {
              id: 'station-3',
              name: 'Riverside',
              location: 'East District',
              temperature: 23.7,
              humidity: 57,
              windSpeed: 5.8,
              lastUpdated: '3 minutes ago'
            },
            {
              id: 'station-4',
              name: 'West Park',
              location: 'West District',
              temperature: 23.1,
              humidity: 49,
              windSpeed: 6.7,
              lastUpdated: '7 minutes ago'
            },
          ]
        };
        
        setWeatherData(mockWeatherData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching weather data:', err);
        setError('Failed to load weather data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchWeatherData();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getWeatherIcon = (condition: string) => {
    switch(condition.toLowerCase()) {
      case 'rain':
      case 'light rain':
      case 'showers':
        return <Grain sx={{ fontSize: 40, color: '#4dabf5' }} />;
      case 'cloudy':
      case 'clouds':
      case 'partly cloudy':
      case 'overcast':
        return <Cloud sx={{ fontSize: 40, color: '#90a4ae' }} />;
      case 'thunderstorm':
      case 'thunder':
        return <Thunderstorm sx={{ fontSize: 40, color: '#f57c00' }} />;
      case 'snow':
      case 'snowy':
        return <AcUnit sx={{ fontSize: 40, color: '#b3e5fc' }} />;
      case 'sunny':
      case 'clear':
      default:
        return <WbSunny sx={{ fontSize: 40, color: '#ffb74d' }} />;
    }
  };

  const getUvIndexLevel = (index: number) => {
    if (index >= 11) return { label: 'Extreme', color: '#d32f2f' };
    if (index >= 8) return { label: 'Very High', color: '#f57c00' };
    if (index >= 6) return { label: 'High', color: '#ffa000' };
    if (index >= 3) return { label: 'Moderate', color: '#fdd835' };
    return { label: 'Low', color: '#7cb342' };
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading weather data...
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
      <Typography variant="h4" gutterBottom>Weather Monitoring</Typography>
      <Typography variant="body1" paragraph>
        Real-time weather data and forecasts across the city.
      </Typography>

      {weatherData && (
        <>
          {/* Current Weather Display */}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mb: 3 }}>
            <Box sx={{ width: { xs: '100%', md: '50%' } }}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {getWeatherIcon(weatherData.current.condition)}
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="h2">{weatherData.current.temperature}°C</Typography>
                    <Typography variant="h6">{weatherData.current.condition}</Typography>
                  </Box>
                </Box>
                <Typography variant="body1">
                  Today, {new Date().toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Feels like {weatherData.current.feelsLike}°C
                </Typography>
                
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Explore sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        Wind
                      </Typography>
                    </Box>
                    <Typography variant="body1">
                      {weatherData.current.windSpeed} km/h {weatherData.current.windDirection}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Opacity sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        Humidity
                      </Typography>
                    </Box>
                    <Typography variant="body1">
                      {weatherData.current.humidity}%
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Visibility sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        Visibility
                      </Typography>
                    </Box>
                    <Typography variant="body1">
                      {weatherData.current.visibility} km
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <WbSunny sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        UV Index
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ color: getUvIndexLevel(weatherData.current.uvIndex).color }}>
                      {weatherData.current.uvIndex} ({getUvIndexLevel(weatherData.current.uvIndex).label})
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Box>

            <Box sx={{ width: { xs: '100%', md: '50%' } }}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>Today's Highlights</Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={6}>
                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">Sunrise</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <WbSunny sx={{ color: 'warning.main', mr: 1 }} />
                          <Typography variant="h6">{weatherData.current.sunrise}</Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={6}>
                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">Sunset</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <WbSunny sx={{ color: 'error.main', mr: 1 }} />
                          <Typography variant="h6">{weatherData.current.sunset}</Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">Pressure</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <Box sx={{ mr: 1 }}>💨</Box>
                          <Typography variant="h6">{weatherData.current.pressure} hPa</Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">Rain Chance</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <Box sx={{ mr: 1 }}>🌧️</Box>
                          <Typography variant="h6">{weatherData.hourly[0].precipProbability}%</Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          </Stack>
          
          {/* Forecast Tabs */}
          <Box sx={{ width: '100%', mb: 3 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeTab} onChange={handleTabChange} aria-label="forecast tabs">
                <Tab label="Hourly Forecast" />
                <Tab label="7-Day Forecast" />
                <Tab label="Weather Stations" />
              </Tabs>
            </Box>
            
            {/* Hourly Forecast Tab */}
            {activeTab === 0 && (
              <Paper sx={{ p: 2, mt: 2 }}>
                <Typography variant="h6" gutterBottom>Hourly Forecast</Typography>
                <Box sx={{ overflowX: 'auto' }}>
                  <Stack direction="row" spacing={2} sx={{ minWidth: 800 }}>
                    {weatherData.hourly.map((hour, index) => (
                      <Card key={index} sx={{ minWidth: 110, maxWidth: 120 }}>
                        <CardContent sx={{ textAlign: 'center', py: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {hour.time}
                          </Typography>
                          {getWeatherIcon(hour.condition)}
                          <Typography variant="h6">{hour.temperature}°C</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                            <Opacity sx={{ fontSize: 14, color: 'info.main', mr: 0.5 }} />
                            <Typography variant="caption">{hour.precipProbability}%</Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                </Box>
              </Paper>
            )}
            
            {/* 7-Day Forecast Tab */}
            {activeTab === 1 && (
              <Paper sx={{ p: 2, mt: 2 }}>
                <Typography variant="h6" gutterBottom>7-Day Forecast</Typography>
                <Grid container spacing={2}>
                  {weatherData.daily.map((day, index) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle1">{day.day}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {day.date}
                            </Typography>
                          </Box>
                          <Divider sx={{ my: 1 }} />
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 2 }}>
                            {getWeatherIcon(day.condition)}
                            <Box sx={{ ml: 2 }}>
                              <Typography variant="h6">{day.maxTemp}°C</Typography>
                              <Typography variant="body2" color="text.secondary">{day.minTemp}°C</Typography>
                            </Box>
                          </Box>
                          <Typography variant="body2" align="center" sx={{ mb: 2 }}>{day.condition}</Typography>
                          <Grid container spacing={1}>
                            <Grid item xs={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Opacity sx={{ fontSize: 14, color: 'info.main', mr: 0.5 }} />
                                <Typography variant="caption">{day.precipProbability}% rain</Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Air sx={{ fontSize: 14, color: 'text.secondary', mr: 0.5 }} />
                                <Typography variant="caption">{Math.round(day.windSpeed)} km/h</Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <WbSunny sx={{ fontSize: 14, color: 'warning.main', mr: 0.5 }} />
                                <Typography variant="caption">UV: {day.uvIndex}</Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Opacity sx={{ fontSize: 14, color: 'primary.main', mr: 0.5 }} />
                                <Typography variant="caption">{day.humidity}% humidity</Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            )}
            
            {/* Weather Stations Tab */}
            {activeTab === 2 && (
              <Paper sx={{ p: 2, mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Weather Stations</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                    Data collected from {weatherData.stations.length} stations across the city
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  {weatherData.stations.map((station) => (
                    <Grid item xs={12} sm={6} md={4} key={station.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <LocationOn color="primary" />
                            <Typography variant="subtitle1" sx={{ ml: 1 }}>{station.name}</Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {station.location}
                          </Typography>
                          <Divider sx={{ my: 1 }} />
                          <Box sx={{ my: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2">Temperature</Typography>
                              <Typography variant="body2">{station.temperature}°C</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2">Humidity</Typography>
                              <Typography variant="body2">{station.humidity}%</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2">Wind</Typography>
                              <Typography variant="body2">{station.windSpeed} km/h</Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, justifyContent: 'flex-end' }}>
                            <AccessTime sx={{ fontSize: 14, color: 'text.secondary', mr: 0.5 }} />
                            <Typography variant="caption" color="text.secondary">
                              Updated {station.lastUpdated}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default WeatherPage;