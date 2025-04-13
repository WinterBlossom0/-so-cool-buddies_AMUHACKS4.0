import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, Card, CardContent, 
  List, ListItem, ListItemText, ListItemIcon, Divider,
  Chip, CircularProgress, Button, Alert
} from '@mui/material';
import { 
  DirectionsBus, Train, Subway, DirectionsBoat,
  Timeline, AccessTime, Place, Refresh
} from '@mui/icons-material';
import { getTransitRoutes, TransitRoute, TransitStop } from '../services/transitService';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const TransitPage: React.FC = () => {
  const [routes, setRoutes] = useState<TransitRoute[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<TransitRoute | null>(null);
  const [center, setCenter] = useState<[number, number]>([51.5074, -0.1278]); // Default to London

  useEffect(() => {
    fetchTransitRoutes();
  }, []);

  const fetchTransitRoutes = async (refresh = false) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTransitRoutes(center[0], center[1], refresh);
      
      if (data && data.routes) {
        setRoutes(data.routes);
        
        // Set first route as selected by default
        if (data.routes.length > 0 && !selectedRoute) {
          setSelectedRoute(data.routes[0]);
        }
      } else {
        setError('Transit data structure is invalid');
      }
    } catch (err) {
      console.error('Failed to fetch transit routes:', err);
      setError('Failed to load transit data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getRouteIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    switch (true) {
      case lowerType.includes('subway') || lowerType.includes('metro'):
        return <Subway />;
      case lowerType.includes('rail'):
        return <Train />;
      case lowerType.includes('tram') || lowerType.includes('light rail'):
        return <DirectionsBus />;
      case lowerType.includes('ferry') || lowerType.includes('boat'):
        return <DirectionsBoat />;
      default:
        return <DirectionsBus />;
    }
  };

  const handleRouteSelect = (route: TransitRoute) => {
    setSelectedRoute(route);
    
    // If the route has stops, center map on the first stop
    if (route.stops && route.stops.length > 0) {
      const firstStop = route.stops[0];
      setCenter([firstStop.location.lat, firstStop.location.lon]);
    }
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Public Transit
        </Typography>
        <Button 
          startIcon={<Refresh />}
          variant="outlined"
          onClick={() => fetchTransitRoutes(true)}
          disabled={loading}
        >
          Refresh Data
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <DirectionsBus sx={{ mr: 1 }} /> Available Routes
              </Typography>
              
              {routes.length === 0 ? (
                <Typography>No transit routes available.</Typography>
              ) : (
                <List>
                  {routes.map((route) => (
                    <React.Fragment key={route.id}>
                      <ListItem 
                        button 
                        selected={selectedRoute?.id === route.id}
                        onClick={() => handleRouteSelect(route)}
                      >
                        <ListItemIcon>
                          {getRouteIcon(route.type)}
                        </ListItemIcon>
                        <ListItemText 
                          primary={route.name} 
                          secondary={route.type}
                          primaryTypographyProps={{
                            sx: {
                              color: `#${route.color || '000000'}`,
                              fontWeight: selectedRoute?.id === route.id ? 'bold' : 'normal'
                            }
                          }}
                        />
                        <Chip 
                          label={route.short_name} 
                          size="small"
                          sx={{ 
                            bgcolor: `#${route.color || '000000'}`, 
                            color: `#${route.text_color || 'FFFFFF'}` 
                          }}
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Place sx={{ mr: 1 }} /> Transit Map
              </Typography>
              
              <Box sx={{ height: 400, width: '100%', overflow: 'hidden', borderRadius: 1 }}>
                <MapContainer 
                  center={center} 
                  zoom={13} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  {selectedRoute?.stops && selectedRoute.stops.map((stop) => (
                    <Marker 
                      key={stop.id}
                      position={[stop.location.lat, stop.location.lon]}
                    >
                      <Popup>
                        <div>
                          <h3>{stop.name}</h3>
                          <p>Next arrivals:</p>
                          <ul>
                            {stop.next_arrivals && stop.next_arrivals.map((arrival, i) => (
                              <li key={i}>
                                {arrival.estimated} {arrival.delay !== 0 && 
                                  <span style={{color: arrival.delay > 0 ? 'red' : 'green'}}>
                                    ({arrival.delay > 0 ? '+' : ''}{arrival.delay} min)
                                  </span>
                                }
                              </li>
                            ))}
                          </ul>
                          <p>
                            {stop.accessible ? '♿ Accessible' : 'Not accessible'} | 
                            {stop.has_shelter ? ' 🏠 Has shelter' : ' No shelter'}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </Box>
            </Paper>
          </Grid>
          
          {selectedRoute && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <AccessTime sx={{ mr: 1 }} /> {selectedRoute.name} Schedule
                </Typography>
                
                <Grid container spacing={2}>
                  {selectedRoute.stops && selectedRoute.stops.map((stop) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={stop.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                            {stop.name}
                          </Typography>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="body2">Next arrivals:</Typography>
                          <List dense>
                            {stop.next_arrivals && stop.next_arrivals.map((arrival, idx) => (
                              <ListItem key={idx} dense>
                                <ListItemText
                                  primary={`${arrival.scheduled || arrival.estimated} ${arrival.delay !== 0 
                                    ? `(${arrival.delay > 0 ? '+' : ''}${arrival.delay} min)` 
                                    : '(On time)'}`}
                                  sx={{
                                    '& .MuiListItemText-primary': {
                                      color: arrival.delay > 0 
                                        ? 'error.main' 
                                        : arrival.delay < 0 
                                          ? 'success.main' 
                                          : 'text.primary'
                                    }
                                  }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default TransitPage;