import React, { useState, useContext, useEffect, useCallback } from 'react';
import { 
  Dialog, 
  CircularProgress,
  Typography,
  Box,
  Button,
  Alert
} from '@mui/material';
import { LocationContext } from '../contexts/LocationContext';
import { MyLocation, Warning } from '@mui/icons-material';

const LocationPrompt: React.FC = () => {
  const locationContext = useContext(LocationContext);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Check if we have a valid location
  const hasValidLocation = locationContext?.location && 
    locationContext.location.lat !== 0 && 
    locationContext.location.lon !== 0;
  
  // Dialog should be open if we don't have a valid location
  const [open, setOpen] = useState<boolean>(!hasValidLocation);

  // Define requestLocation function with useCallback to use it in dependencies
  const requestLocation = useCallback(() => {
    setLoading(true);
    setError(null);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          // Try to get city name using reverse geocoding
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
            );
            const data = await response.json();
            const locationName = data.display_name ? 
              data.display_name.split(',')[0] : 
              'Current Location';
            
            // Save to context
            if (locationContext?.setLocation) {
              locationContext.setLocation(lat, lon, locationName);
            }
            
            // Save to localStorage for persistence
            localStorage.setItem('smartCity_userLocation', JSON.stringify({
              center: [lat, lon],
              cityName: locationName
            }));
            
            setOpen(false);
          } catch (e) {
            console.error('Error getting location name:', e);
            
            // Still save the location even without a name
            if (locationContext?.setLocation) {
              locationContext.setLocation(lat, lon, 'Your Location');
            }
            
            localStorage.setItem('smartCity_userLocation', JSON.stringify({
              center: [lat, lon],
              cityName: 'Your Location'
            }));
            
            setOpen(false);
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setError('Location access is required to use SmartCityPulse services. Please enable location permissions and refresh the page.');
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setError('Geolocation is not supported by your browser. Please use a modern browser with location services to access SmartCityPulse.');
      setLoading(false);
    }
  }, [locationContext, setOpen]);

  useEffect(() => {
    // If we don't have a valid location, request it
    if (!hasValidLocation) {
      requestLocation();
    } else {
      setOpen(false);
    }
  }, [hasValidLocation, requestLocation]);

  return (
    <Dialog 
      open={open} 
      disableEscapeKeyDown
      disablePortal
      onClose={() => {}}
      hideBackdrop
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          boxShadow: 'none',
          background: 'transparent',
        },
        position: 'fixed',
        zIndex: 9999
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        p: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 2,
        boxShadow: 3
      }}>
        {loading ? (
          <>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h5" gutterBottom>
              Accessing Your Location
            </Typography>
            <Typography variant="body1">
              Please allow location access when prompted by your browser.
              <br /><br />
              <strong>Location access is required to use SmartCityPulse services.</strong>
            </Typography>
          </>
        ) : error ? (
          <>
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3, 
                width: '100%' 
              }}
              icon={<Warning fontSize="large" />}
            >
              <Typography variant="h6">Location Access Required</Typography>
              {error}
            </Alert>
            <Typography variant="h6" gutterBottom color="error">
              Location access is mandatory
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              SmartCityPulse cannot function without your location. 
              Please allow location access in your browser settings to continue.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<MyLocation />}
              onClick={requestLocation}
              sx={{ mt: 2 }}
              size="large"
            >
              Grant Location Access
            </Button>
            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
              This application cannot function without location access.
              All features require your precise location for personalized services.
            </Typography>
          </>
        ) : (
          <>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h5" gutterBottom>
              Initializing SmartCityPulse
            </Typography>
            <Typography variant="body1">
              Please wait while we set up your personalized experience...
            </Typography>
          </>
        )}
      </Box>
    </Dialog>
  );
};

export default LocationPrompt; 