import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Checkbox,
  FormControlLabel,
  Button,
  Grid,
  Divider,
  TextField,
  Slider,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import { 
  LocationOn as LocationIcon,
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon 
} from '@mui/icons-material';

import {
  subscribeToAlerts,
  unsubscribeFromAlerts,
  getAlerts,
  AlertCategory,
  SeverityLevel,
  LocationData
} from '../../services/alertsService';

const AlertSubscriptions: React.FC = () => {
  // This would typically come from auth context in a real app
  const userId = "current-user-id";
  
  const [categories, setCategories] = useState<AlertCategory[]>([]);
  const [severityLevels, setSeverityLevels] = useState<SeverityLevel[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<string[]>([]);
  const [useLocation, setUseLocation] = useState<boolean>(false);
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [radius, setRadius] = useState<number>(5);
  const [loading, setLoading] = useState<boolean>(true);
  const [subscribing, setSubscribing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchAlertData();
  }, []);

  const fetchAlertData = async () => {
    try {
      setLoading(true);
      // We're just using this to get categories and severity levels
      const data = await getAlerts();
      setCategories(data.categories);
      setSeverityLevels(data.severity_levels);
      setLoading(false);
    } catch (err) {
      setError('Failed to load alert categories and severity levels.');
      setLoading(false);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleSeverityToggle = (severityId: string) => {
    setSelectedSeverity(prev => {
      if (prev.includes(severityId)) {
        return prev.filter(id => id !== severityId);
      } else {
        return [...prev, severityId];
      }
    });
  };

  const handleUseLocationToggle = () => {
    setUseLocation(!useLocation);
    if (!useLocation) {
      // Try to get user's current location when enabling location-based alerts
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLatitude(position.coords.latitude.toString());
            setLongitude(position.coords.longitude.toString());
          },
          () => {
            setError('Unable to get your current location. Please enter coordinates manually.');
          }
        );
      }
    }
  };

  const handleSubscribe = async () => {
    if (selectedCategories.length === 0 || selectedSeverity.length === 0) {
      setError('Please select at least one category and severity level.');
      return;
    }

    let lat: number | undefined = undefined;
    let lon: number | undefined = undefined;
    
    if (useLocation) {
      if (!latitude || !longitude) {
        setError('Please provide location coordinates for location-based alerts.');
        return;
      }
      
      lat = parseFloat(latitude);
      lon = parseFloat(longitude);
    }

    try {
      setSubscribing(true);
      await subscribeToAlerts(
        userId, 
        selectedCategories, 
        selectedSeverity, 
        useLocation,
        lat,
        lon,
        useLocation ? radius : undefined
      );
      setSuccess('Successfully subscribed to alerts!');
      setSubscribing(false);
    } catch (err) {
      setError('Failed to subscribe to alerts. Please try again.');
      setSubscribing(false);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      setSubscribing(true);
      await unsubscribeFromAlerts(userId, selectedCategories, selectedSeverity);
      setSuccess('Successfully unsubscribed from selected alert types.');
      setSubscribing(false);
      
      // Clear selections after unsubscribing
      if (selectedCategories.length === 0 && selectedSeverity.length === 0) {
        setSelectedCategories([]);
        setSelectedSeverity([]);
      }
    } catch (err) {
      setError('Failed to unsubscribe from alerts. Please try again.');
      setSubscribing(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(null);
    setError(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <NotificationsIcon />
        Alert Subscriptions
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Alert Categories</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {categories.map(category => (
                  <FormControlLabel
                    key={category.id}
                    control={
                      <Checkbox 
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => handleCategoryToggle(category.id)}
                      />
                    }
                    label={category.name}
                  />
                ))}
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Alert Severity Levels</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {severityLevels.map(severity => (
                  <FormControlLabel
                    key={severity.id}
                    control={
                      <Checkbox 
                        checked={selectedSeverity.includes(severity.id)}
                        onChange={() => handleSeverityToggle(severity.id)}
                        sx={{
                          color: severity.color,
                          '&.Mui-checked': {
                            color: severity.color,
                          },
                        }}
                      />
                    }
                    label={severity.name}
                  />
                ))}
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={useLocation}
                    onChange={handleUseLocationToggle}
                    icon={<LocationIcon />}
                    checkedIcon={<LocationIcon />}
                  />
                }
                label="Use location-based alerts"
              />
              
              {useLocation && (
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        label="Latitude"
                        fullWidth
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        type="number"
                        InputProps={{
                          inputProps: { 
                            step: "0.000001",
                            min: -90,
                            max: 90
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        label="Longitude"
                        fullWidth
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        type="number"
                        InputProps={{
                          inputProps: { 
                            step: "0.000001",
                            min: -180,
                            max: 180
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography gutterBottom>
                        Radius: {radius} km
                      </Typography>
                      <Slider
                        value={radius}
                        onChange={(_, newValue) => setRadius(newValue as number)}
                        min={1}
                        max={50}
                        step={1}
                        marks={[
                          { value: 1, label: '1km' },
                          { value: 25, label: '25km' },
                          { value: 50, label: '50km' },
                        ]}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  startIcon={<NotificationsIcon />}
                  onClick={handleSubscribe}
                  disabled={subscribing}
                >
                  {subscribing ? 'Subscribing...' : 'Subscribe to Alerts'}
                </Button>
                <Button 
                  variant="outlined" 
                  color="error"
                  startIcon={<NotificationsOffIcon />}
                  onClick={handleUnsubscribe}
                  disabled={subscribing}
                >
                  Unsubscribe
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      <Snackbar 
        open={!!success} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AlertSubscriptions; 