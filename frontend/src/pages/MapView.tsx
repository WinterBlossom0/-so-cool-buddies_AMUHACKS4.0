import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Button, 
  ButtonGroup, 
  TextField,
  InputAdornment,
  IconButton,
  Alert,
  Snackbar
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Search, MyLocation, Refresh } from '@mui/icons-material';
import api from '../services/api';
import { useLocation } from '../contexts/LocationContext';  // Import the location context

// Fix for default marker icons in React Leaflet
// Using a different approach to fix the icon issue
const defaultIcon = L.icon({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = defaultIcon;

// Sample data for map markers - this would come from an API in a real implementation
const sensorLocations = [
  { id: 1, name: 'Air Quality Sensor 1', lat: 40.712, lng: -74.006, type: 'air', value: 42 },
  { id: 2, name: 'Traffic Sensor 1', lat: 40.714, lng: -74.012, type: 'traffic', value: 85 },
  { id: 3, name: 'Weather Station 1', lat: 40.710, lng: -74.001, type: 'weather', value: 72 },
  { id: 4, name: 'Waste Bin 1', lat: 40.718, lng: -74.008, type: 'waste', value: 65 },
  { id: 5, name: 'Solar Panel 1', lat: 40.715, lng: -73.998, type: 'solar', value: 92 },
];

const trafficIncidents = [
  { id: 1, name: 'Traffic Jam', lat: 40.713, lng: -74.004, severity: 'high' },
  { id: 2, name: 'Road Construction', lat: 40.717, lng: -74.010, severity: 'medium' },
];

// Component to handle map view changes
const MapUpdater = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  
  return null;
};

const MapView: React.FC = () => {
  const DEFAULT_LOCATION: [number, number] = [40.712, -74.006]; // Default to NYC
  const DEFAULT_ZOOM = 14;
  
  // Use the location context for shared location state
  const { location, setLocation } = useLocation();

  const [locationSearch, setLocationSearch] = useState<string>('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([location.lat, location.lon]);
  const [cityName, setCityName] = useState<string>(location.city || "New York");
  const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM);
  const [mapLayer, setMapLayer] = useState<'standard' | 'satellite' | 'traffic'>('standard');
  const [visibleLayers, setVisibleLayers] = useState({
    sensors: true,
    traffic: true,
    incidents: true
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showError, setShowError] = useState<boolean>(false);

  // Sync with location context when component mounts
  useEffect(() => {
    // Initialize from location context
    setMapCenter([location.lat, location.lon]);
    setCityName(location.city);
  }, [location]);

  // Get color for sensor markers based on type
  const getSensorColor = (type: string) => {
    switch(type) {
      case 'air': return '#00a2ff';
      case 'traffic': return '#ff6b6b';
      case 'weather': return '#83e85a';
      case 'waste': return '#9e42f5';
      case 'solar': return '#ffbb00';
      default: return '#888888';
    }
  };

  const toggleLayer = (layer: 'sensors' | 'traffic' | 'incidents') => {
    setVisibleLayers({
      ...visibleLayers,
      [layer]: !visibleLayers[layer]
    });
  };

  // Function to search for a location
  const searchLocation = async () => {
    if (!locationSearch.trim()) return;
    
    setIsLoading(true);
    try {
      // Using browser's built-in Geolocation API for demo purposes
      // In a real app, you'd call your backend API that integrates with a geocoding service
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationSearch)}`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const newCenter: [number, number] = [parseFloat(lat), parseFloat(lon)];
        const cityName = display_name.split(',')[0]; // Extract city name from full address
        
        // Update the map center
        setMapCenter(newCenter);
        setCityName(cityName); 
        
        // Update the shared location context
        setLocation(parseFloat(lat), parseFloat(lon), cityName);
        
        // Reset error state
        setErrorMessage("");
      } else {
        setErrorMessage("Location not found. Please try a different search.");
        setShowError(true);
      }
    } catch (error) {
      console.error('Error searching location:', error);
      setErrorMessage("Failed to search location. Please try again later.");
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to use current location
  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const newCenter: [number, number] = [latitude, longitude];
          
          // Update the map center
          setMapCenter(newCenter);
          
          // Try to get the location name from coordinates (reverse geocoding)
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            if (data && data.address) {
              const locationName = data.address.city || 
                                  data.address.town || 
                                  data.address.village || 
                                  "Your Location";
              setCityName(locationName);
              
              // Update the shared location context
              setLocation(latitude, longitude, locationName);
            }
          } catch (error) {
            console.error('Error reverse geocoding:', error);
            setCityName("Your Location");
            
            // Still update coordinates even if we can't get the name
            setLocation(latitude, longitude, "Your Location");
          }
          
          setIsLoading(false);
        },
        (error) => {
          console.error('Error getting current location:', error);
          setErrorMessage("Failed to get your current location. Please check your browser permissions.");
          setShowError(true);
          setIsLoading(false);
        }
      );
    } else {
      setErrorMessage("Geolocation is not supported by your browser.");
      setShowError(true);
    }
  };

  // Handle the form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchLocation();
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>City Map View</Typography>
      <Typography variant="body1" paragraph>
        Interactive map showing real-time data for {cityName}.
      </Typography>
      
      {/* Location search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <form onSubmit={handleSearchSubmit}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TextField
              fullWidth
              label="Search Location"
              variant="outlined"
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
              placeholder="Enter city name, address or location"
              disabled={isLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton 
                      edge="end" 
                      onClick={searchLocation}
                      disabled={isLoading || !locationSearch.trim()}
                    >
                      <Search />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              color="primary"
              startIcon={<MyLocation />}
              onClick={useCurrentLocation}
              disabled={isLoading}
              sx={{ ml: 2, whiteSpace: 'nowrap' }}
            >
              Use My Location
            </Button>
          </Box>
        </form>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Currently showing: <strong>{cityName}</strong>
            </Typography>
          </Box>
          
          <Box>
            <ButtonGroup variant="contained" size="small" sx={{ mr: 2 }}>
              <Button 
                onClick={() => setMapLayer('standard')}
                variant={mapLayer === 'standard' ? 'contained' : 'outlined'}
              >
                Standard
              </Button>
              <Button 
                onClick={() => setMapLayer('satellite')}
                variant={mapLayer === 'satellite' ? 'contained' : 'outlined'}
              >
                Satellite
              </Button>
              <Button 
                onClick={() => setMapLayer('traffic')}
                variant={mapLayer === 'traffic' ? 'contained' : 'outlined'}
              >
                Traffic
              </Button>
            </ButtonGroup>

            <ButtonGroup variant="contained" size="small">
              <Button 
                onClick={() => toggleLayer('sensors')}
                variant={visibleLayers.sensors ? 'contained' : 'outlined'}
              >
                Sensors
              </Button>
              <Button 
                onClick={() => toggleLayer('traffic')}
                variant={visibleLayers.traffic ? 'contained' : 'outlined'}
              >
                Traffic
              </Button>
              <Button 
                onClick={() => toggleLayer('incidents')}
                variant={visibleLayers.incidents ? 'contained' : 'outlined'}
              >
                Incidents
              </Button>
            </ButtonGroup>
          </Box>
        </Box>
      </Paper>
      
      <Paper 
        elevation={3} 
        sx={{ 
          height: '500px', 
          width: '100%',
          mb: 3,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {isLoading && (
          <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'rgba(255,255,255,0.7)', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <Typography variant="h6">Loading map...</Typography>
          </Box>
        )}
        
        <MapContainer 
          center={mapCenter} 
          zoom={zoom} 
          style={{ height: '100%', width: '100%' }}
        >
          <MapUpdater center={mapCenter} zoom={zoom} />
          
          {mapLayer === 'standard' && (
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
          )}
          {mapLayer === 'satellite' && (
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            />
          )}
          {mapLayer === 'traffic' && (
            <TileLayer
              url="https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.thunderforest.com/">Thunderforest</a>'
            />
          )}
          
          {/* User location marker */}
          <Marker position={mapCenter}>
            <Popup>
              <strong>{cityName}</strong><br/>
              Current view location
            </Popup>
          </Marker>
          
          {/* Sensor markers */}
          {visibleLayers.sensors && sensorLocations.map(sensor => (
            <CircleMarker
              key={sensor.id}
              center={[sensor.lat, sensor.lng]}
              radius={7}
              fillColor={getSensorColor(sensor.type)}
              fillOpacity={0.8}
              color="#fff"
              weight={1}
            >
              <Popup>
                <strong>{sensor.name}</strong><br/>
                Type: {sensor.type}<br/>
                Value: {sensor.value}
              </Popup>
            </CircleMarker>
          ))}
          
          {/* Traffic incident markers */}
          {visibleLayers.incidents && trafficIncidents.map(incident => (
            <Marker
              key={incident.id}
              position={[incident.lat, incident.lng]}
            >
              <Popup>
                <strong>{incident.name}</strong><br/>
                Severity: {incident.severity}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Traffic Hotspots</Typography>
              <Typography variant="body2">
                {trafficIncidents.length} active congestion points detected
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Environmental Sensors</Typography>
              <Typography variant="body2">
                All {sensorLocations.length} sensors operational and reporting data
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Public Transport</Typography>
              <Typography variant="body2">
                98% of public transport running on schedule
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Error message snackbar */}
      <Snackbar 
        open={showError} 
        autoHideDuration={6000} 
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowError(false)} 
          severity="error"
          sx={{ width: '100%' }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MapView;