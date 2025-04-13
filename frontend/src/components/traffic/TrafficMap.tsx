import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, CircularProgress, FormControl, InputLabel, MenuItem, Select, Chip } from '@mui/material';
import { TrafficOutlined, WarningAmber, Build, DirectionsCar } from '@mui/icons-material';

// Note: This is a simulated implementation that mimics how a real leaflet map would work
// In a production environment, you would use:
// import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
// import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';

interface TrafficIncident {
  id: string;
  type: 'ACCIDENT' | 'CONGESTION' | 'ROADWORK' | 'CLOSURE';
  location: {
    lat: number;
    lng: number;
  };
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  reportedAt: string;
  estimatedClearTime?: string;
}

interface TrafficCondition {
  id: string;
  location: {
    lat: number;
    lng: number;
  };
  speedKmh: number;
  congestionLevel: 'LOW' | 'MODERATE' | 'HEAVY' | 'SEVERE';
  roadName: string;
}

interface TrafficData {
  incidents: TrafficIncident[];
  conditions: TrafficCondition[];
}

// Mock data for the traffic visualization
const mockTrafficData: TrafficData = {
  incidents: [
    {
      id: 'INC-1',
      type: 'ACCIDENT',
      location: { lat: 40.7128, lng: -74.006 },
      severity: 'HIGH',
      description: 'Multi-vehicle collision',
      reportedAt: '2025-04-13T10:30:00',
      estimatedClearTime: '2025-04-13T12:45:00'
    },
    {
      id: 'INC-2',
      type: 'ROADWORK',
      location: { lat: 40.7328, lng: -73.986 },
      severity: 'MEDIUM',
      description: 'Lane closure for road repairs',
      reportedAt: '2025-04-12T08:15:00',
      estimatedClearTime: '2025-04-15T18:00:00'
    },
    {
      id: 'INC-3',
      type: 'CONGESTION',
      location: { lat: 40.7528, lng: -74.016 },
      severity: 'MEDIUM',
      description: 'Heavy traffic due to event',
      reportedAt: '2025-04-13T09:45:00'
    },
    {
      id: 'INC-4',
      type: 'CLOSURE',
      location: { lat: 40.7028, lng: -73.996 },
      severity: 'HIGH',
      description: 'Full road closure due to gas leak',
      reportedAt: '2025-04-13T11:20:00'
    }
  ],
  conditions: [
    {
      id: 'CON-1',
      location: { lat: 40.7128, lng: -74.006 },
      speedKmh: 10,
      congestionLevel: 'SEVERE',
      roadName: 'Broadway'
    },
    {
      id: 'CON-2',
      location: { lat: 40.7328, lng: -73.986 },
      speedKmh: 25,
      congestionLevel: 'HEAVY',
      roadName: '5th Avenue'
    },
    {
      id: 'CON-3',
      location: { lat: 40.7528, lng: -74.016 },
      speedKmh: 35,
      congestionLevel: 'MODERATE',
      roadName: 'West 42nd St'
    },
    {
      id: 'CON-4',
      location: { lat: 40.7028, lng: -73.996 },
      speedKmh: 50,
      congestionLevel: 'LOW',
      roadName: 'Canal St'
    }
  ]
};

const getIncidentIcon = (type: string) => {
  switch (type) {
    case 'ACCIDENT':
      return <WarningAmber sx={{ color: '#d32f2f' }} />;
    case 'CONGESTION':
      return <TrafficOutlined sx={{ color: '#ed6c02' }} />;
    case 'ROADWORK':
      return <Build sx={{ color: '#2196f3' }} />;
    case 'CLOSURE':
      return <DirectionsCar sx={{ color: '#9c27b0' }} />;
    default:
      return <WarningAmber />;
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'HIGH':
      return '#d32f2f';
    case 'MEDIUM':
      return '#ed6c02';
    case 'LOW':
      return '#2196f3';
    default:
      return '#757575';
  }
};

const getCongestionColor = (level: string) => {
  switch (level) {
    case 'SEVERE':
      return '#d32f2f';
    case 'HEAVY':
      return '#ed6c02';
    case 'MODERATE':
      return '#ffeb3b';
    case 'LOW':
      return '#4caf50';
    default:
      return '#757575';
  }
};

const MapElements = ({ data }: { data: TrafficData }) => {
  // This simulates the map elements that would be rendered on a real map
  return (
    <>
      {/* Incidents */}
      {data.incidents.map(incident => (
        <Box 
          key={incident.id}
          sx={{ 
            position: 'absolute', 
            // Fixed position calculations for more reliable display
            top: `${100 + Math.abs((40.77 - incident.location.lat) * 500)}px`,
            left: `${250 + Math.abs((incident.location.lng + 74.05) * 200)}px`,
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
          }}
        >
          <Box 
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Box 
              sx={{ 
                bgcolor: 'white', 
                borderRadius: '50%', 
                p: 0.5, 
                boxShadow: 2,
                border: `2px solid ${getSeverityColor(incident.severity)}` 
              }}
            >
              {getIncidentIcon(incident.type)}
            </Box>
            <Box
              sx={{
                bgcolor: 'rgba(255,255,255,0.9)',
                p: 0.5,
                borderRadius: 1,
                mt: 0.5,
                fontSize: '0.75rem',
                fontWeight: 'bold',
                boxShadow: 1,
                maxWidth: 120,
                textAlign: 'center',
                display: 'none',
                '.MuiBox-root:hover &': {
                  display: 'block'
                }
              }}
            >
              {incident.description}
            </Box>
          </Box>
        </Box>
      ))}

      {/* Traffic Conditions */}
      {data.conditions.map(condition => (
        <Box 
          key={condition.id}
          sx={{ 
            position: 'absolute', 
            // Fixed position calculations for more reliable display
            top: `${100 + Math.abs((40.77 - condition.location.lat) * 500)}px`,
            left: `${250 + Math.abs((condition.location.lng + 74.05) * 200)}px`,
            zIndex: 5,
          }}
        >
          <Box 
            sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              bgcolor: `${getCongestionColor(condition.congestionLevel)}40`,
              border: `2px solid ${getCongestionColor(condition.congestionLevel)}`,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              color: 'text.primary',
            }}
          >
            {condition.speedKmh} km/h
          </Box>
        </Box>
      ))}
    </>
  );
};

const TrafficMap: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [trafficData, setTrafficData] = useState<TrafficData | null>(null);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    // Simulate API call to fetch traffic data
    const fetchData = async () => {
      try {
        // In a real app, this would be a fetch call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setTrafficData(mockTrafficData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching traffic data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFilterChange = (event: any) => {
    setFilter(event.target.value);
  };

  // Filter the incidents based on selected type
  const getFilteredData = () => {
    if (!trafficData) return null;
    
    if (filter === 'ALL') {
      return trafficData;
    }
    
    return {
      ...trafficData,
      incidents: trafficData.incidents.filter(incident => incident.type === filter)
    };
  };

  const filteredData = getFilteredData();

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Live Traffic Map</Typography>
        
        <FormControl size="small" sx={{ width: 150 }}>
          <InputLabel id="incident-filter-label">Filter</InputLabel>
          <Select
            labelId="incident-filter-label"
            id="incident-filter"
            value={filter}
            label="Filter"
            onChange={handleFilterChange}
          >
            <MenuItem value="ALL">All Incidents</MenuItem>
            <MenuItem value="ACCIDENT">Accidents</MenuItem>
            <MenuItem value="CONGESTION">Congestion</MenuItem>
            <MenuItem value="ROADWORK">Roadwork</MenuItem>
            <MenuItem value="CLOSURE">Closures</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      <Box sx={{ display: 'flex', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
            <WarningAmber fontSize="small" sx={{ color: '#d32f2f', mr: 0.5 }} />
            <Typography variant="caption">Accident</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
            <TrafficOutlined fontSize="small" sx={{ color: '#ed6c02', mr: 0.5 }} />
            <Typography variant="caption">Congestion</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
            <Build fontSize="small" sx={{ color: '#2196f3', mr: 0.5 }} />
            <Typography variant="caption">Roadwork</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DirectionsCar fontSize="small" sx={{ color: '#9c27b0', mr: 0.5 }} />
            <Typography variant="caption">Closure</Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Chip 
            size="small" 
            label="Light Traffic" 
            sx={{ bgcolor: '#4caf5040', mr: 0.5, height: 20 }}
          />
          <Chip 
            size="small" 
            label="Moderate" 
            sx={{ bgcolor: '#ffeb3b40', mr: 0.5, height: 20 }}
          />
          <Chip 
            size="small" 
            label="Heavy" 
            sx={{ bgcolor: '#ed6c0240', mr: 0.5, height: 20 }}
          />
          <Chip 
            size="small" 
            label="Severe" 
            sx={{ bgcolor: '#d32f2f40', height: 20 }}
          />
        </Box>
      </Box>
      
      <Box 
        sx={{
          position: 'relative',
          height: 500,
          width: '100%',
          overflow: 'hidden',
          borderRadius: 1,
          boxShadow: 1,
          '&:hover': {
            '& .controls': {
              opacity: 1,
            },
          },
        }}
      >
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            bgcolor: '#f5f5f5',
          }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* This simulates the actual map tile layer */}
            <Box
              sx={{
                height: '100%',
                width: '100%',
                backgroundImage: 'url(https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/-74.006,40.7128,12,0/1000x500?access_token=pk.placeholder)',
                backgroundSize: 'cover',
                position: 'relative',
              }}
            >
              {/* In a real implementation this would be the MapContainer, TileLayer, etc. */}
              {filteredData && <MapElements data={filteredData} />}
              
              <Box className="controls" sx={{ 
                position: 'absolute', 
                top: 10, 
                right: 10, 
                zIndex: 20,
                opacity: 0.6,
                transition: 'opacity 0.2s',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <Paper sx={{ 
                  width: 30, 
                  height: 60, 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'center', 
                  alignItems: 'center',
                  mb: 1,
                }}>
                  <Box sx={{ fontSize: '1.5rem', fontWeight: 'bold', cursor: 'pointer', height: '50%', display: 'flex', alignItems: 'center' }}>+</Box>
                  <Box sx={{ borderTop: '1px solid rgba(0,0,0,0.1)', width: '100%' }}></Box>
                  <Box sx={{ fontSize: '1.5rem', fontWeight: 'bold', cursor: 'pointer', height: '50%', display: 'flex', alignItems: 'center' }}>-</Box>
                </Paper>
                
                <Paper sx={{ 
                  width: 30, 
                  height: 30, 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  cursor: 'pointer',
                }}>
                  <Box sx={{ fontSize: '1rem' }}>⊕</Box>
                </Paper>
              </Box>
              
              <Box sx={{ 
                position: 'absolute',
                bottom: 10,
                left: 10,
                zIndex: 1,
                bgcolor: 'rgba(255,255,255,0.8)',
                px: 1, 
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.75rem',
                color: 'text.secondary'
              }}>
                Map data © OpenStreetMap contributors
              </Box>
            </Box>
          </>
        )}
      </Box>
      
      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Last updated: April 13, 2025, 12:30 PM
        </Typography>
        
        <Typography variant="caption" color="primary" sx={{ cursor: 'pointer' }}>
          Refresh data
        </Typography>
      </Box>
    </Box>
  );
};

export default TrafficMap;