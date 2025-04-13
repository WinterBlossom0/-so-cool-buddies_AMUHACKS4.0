import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  Chip,
  CircularProgress,
  Alert,
  AlertTitle,
  Button,
  Tabs,
  Tab,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Divider,
  LinearProgress,
  Switch,
  FormControlLabel,
  List
} from '@mui/material';
import { 
  Sensors, 
  CheckCircle, 
  ErrorOutline, 
  WarningAmber, 
  Refresh, 
  Add, 
  Delete,
  FilterList,
  Search,
  Settings,
  MoreVert,
  Edit,
  Map,
  Battery20,
  Battery50,
  Battery80,
  BatteryFull,
  SignalCellular1Bar,
  SignalCellular3Bar,
  SignalCellular4Bar,
  InfoOutlined,
  History
} from '@mui/icons-material';

interface SensorType {
  type: string;
  count: number;
  active: number;
  warning: number;
  error: number;
  icon?: string;
}

interface SensorData {
  id: string;
  type: string;
  location: string;
  status: 'Active' | 'Warning' | 'Error' | 'Offline';
  lastReading: string;
  battery: number;
  signal: number;
  metrics?: {
    name: string;
    value: string | number;
    unit?: string;
  }[];
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface SensorsData {
  total: number;
  active: number;
  warning: number;
  error: number;
  offline: number;
  types: SensorType[];
  sensors: SensorData[];
  recentAlerts: {
    id: string;
    sensorId: string;
    message: string;
    timestamp: string;
    severity: 'low' | 'medium' | 'high';
  }[];
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Active':
      return <CheckCircle fontSize="small" sx={{ color: 'success.main' }} />;
    case 'Warning':
      return <WarningAmber fontSize="small" sx={{ color: 'warning.main' }} />;
    case 'Error':
      return <ErrorOutline fontSize="small" sx={{ color: 'error.main' }} />;
    case 'Offline':
      return <ErrorOutline fontSize="small" sx={{ color: 'text.disabled' }} />;
    default:
      return null;
  }
};

const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'primary' => {
  switch (status) {
    case 'Active':
      return 'success';
    case 'Warning':
      return 'warning';
    case 'Error':
      return 'error';
    default:
      return 'primary';
  }
};

const getBatteryIcon = (level: number) => {
  if (level >= 75) return <BatteryFull sx={{ color: 'success.main' }} />;
  if (level >= 50) return <Battery80 sx={{ color: 'success.main' }} />;
  if (level >= 25) return <Battery50 sx={{ color: 'warning.main' }} />;
  return <Battery20 sx={{ color: 'error.main' }} />;
};

const getSignalIcon = (level: number) => {
  if (level >= 75) return <SignalCellular4Bar sx={{ color: 'success.main' }} />;
  if (level >= 40) return <SignalCellular3Bar sx={{ color: 'warning.main' }} />;
  return <SignalCellular1Bar sx={{ color: 'error.main' }} />;
};

const SensorsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sensorsData, setSensorsData] = useState<SensorsData | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [detailDialog, setDetailDialog] = useState<boolean>(false);
  const [selectedSensor, setSelectedSensor] = useState<SensorData | null>(null);
  const [filterType, setFilterType] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showOnlyIssues, setShowOnlyIssues] = useState<boolean>(false);
  
  useEffect(() => {
    fetchSensorsData();
  }, []);

  const fetchSensorsData = async () => {
    try {
      setLoading(true);
      
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Mock data
      const mockSensorsData: SensorsData = {
        total: 356,
        active: 344,
        warning: 8,
        error: 4,
        offline: 0,
        types: [
          { type: 'Environmental', count: 156, active: 152, warning: 3, error: 1, icon: '🌿' },
          { type: 'Traffic', count: 89, active: 85, warning: 2, error: 2, icon: '🚗' },
          { type: 'Utility', count: 64, active: 62, warning: 1, error: 1, icon: '⚡' },
          { type: 'Security', count: 47, active: 45, warning: 2, error: 0, icon: '🔒' },
        ],
        sensors: [
          { 
            id: 'E-1052', 
            type: 'Environmental', 
            location: 'Central Park', 
            status: 'Active', 
            lastReading: '3 min ago',
            battery: 85,
            signal: 92,
            metrics: [
              { name: 'Temperature', value: 24.5, unit: '°C' },
              { name: 'Humidity', value: 45, unit: '%' },
              { name: 'Air Quality', value: 'Good' }
            ],
            coordinates: { lat: 40.7812, lng: -73.9665 }
          },
          { 
            id: 'T-8734', 
            type: 'Traffic', 
            location: 'Main St & 5th Ave', 
            status: 'Active', 
            lastReading: '1 min ago',
            battery: 72,
            signal: 88,
            metrics: [
              { name: 'Vehicle Count', value: 342, unit: 'vehicles/hour' },
              { name: 'Average Speed', value: 28, unit: 'km/h' },
              { name: 'Congestion', value: 'Moderate' }
            ],
            coordinates: { lat: 40.7580, lng: -73.9855 }
          },
          { 
            id: 'U-3421', 
            type: 'Utility', 
            location: 'Western District', 
            status: 'Warning', 
            lastReading: '5 min ago',
            battery: 35,
            signal: 75,
            metrics: [
              { name: 'Power Consumption', value: 2450, unit: 'kW' },
              { name: 'Water Flow', value: 125, unit: 'L/min' },
              { name: 'Pressure', value: 'Normal' }
            ],
            coordinates: { lat: 40.7420, lng: -74.0080 }
          },
          { 
            id: 'S-7823', 
            type: 'Security', 
            location: 'City Hall', 
            status: 'Active', 
            lastReading: '2 min ago',
            battery: 90,
            signal: 95,
            metrics: [
              { name: 'Motion Detected', value: 'No' },
              { name: 'Door Status', value: 'Closed' },
              { name: 'Last Event', value: '45 min ago' }
            ],
            coordinates: { lat: 40.7128, lng: -74.0060 }
          },
          { 
            id: 'E-2133', 
            type: 'Environmental', 
            location: 'Riverside', 
            status: 'Error', 
            lastReading: '35 min ago',
            battery: 12,
            signal: 32,
            metrics: [
              { name: 'Temperature', value: 'N/A' },
              { name: 'Humidity', value: 'N/A' },
              { name: 'Air Quality', value: 'N/A' }
            ],
            coordinates: { lat: 40.8023, lng: -73.9710 }
          },
          { 
            id: 'T-9012', 
            type: 'Traffic', 
            location: 'Highway 101', 
            status: 'Active', 
            lastReading: '1 min ago',
            battery: 65,
            signal: 87,
            metrics: [
              { name: 'Vehicle Count', value: 1240, unit: 'vehicles/hour' },
              { name: 'Average Speed', value: 65, unit: 'km/h' },
              { name: 'Congestion', value: 'Low' }
            ],
            coordinates: { lat: 40.7303, lng: -73.9950 }
          },
          { 
            id: 'U-5678', 
            type: 'Utility', 
            location: 'North District', 
            status: 'Active', 
            lastReading: '4 min ago',
            battery: 78,
            signal: 90,
            metrics: [
              { name: 'Power Consumption', value: 1850, unit: 'kW' },
              { name: 'Water Flow', value: 98, unit: 'L/min' },
              { name: 'Pressure', value: 'Normal' }
            ],
            coordinates: { lat: 40.7800, lng: -73.9800 }
          },
          { 
            id: 'S-4321', 
            type: 'Security', 
            location: 'Public Library', 
            status: 'Warning', 
            lastReading: '8 min ago',
            battery: 45,
            signal: 60,
            metrics: [
              { name: 'Motion Detected', value: 'Yes' },
              { name: 'Door Status', value: 'Open' },
              { name: 'Last Event', value: '8 min ago' }
            ],
            coordinates: { lat: 40.7530, lng: -73.9820 }
          }
        ],
        recentAlerts: [
          {
            id: 'A-1',
            sensorId: 'E-2133',
            message: 'Sensor battery critically low (12%)',
            timestamp: '35 min ago',
            severity: 'high'
          },
          {
            id: 'A-2',
            sensorId: 'U-3421',
            message: 'Battery level low (35%)',
            timestamp: '1 hour ago',
            severity: 'medium'
          },
          {
            id: 'A-3',
            sensorId: 'S-4321',
            message: 'Unusual activity detected at Public Library',
            timestamp: '8 min ago',
            severity: 'medium'
          },
          {
            id: 'A-4',
            sensorId: 'T-8734',
            message: 'Increased traffic congestion detected',
            timestamp: '30 min ago',
            severity: 'low'
          }
        ]
      };
      
      setSensorsData(mockSensorsData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching sensors data:', err);
      setError('Failed to load sensors data. Please try again later.');
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchSensorsData();
    setRefreshing(false);
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleOpenDetails = (sensor: SensorData) => {
    setSelectedSensor(sensor);
    setDetailDialog(true);
  };

  const handleCloseDetails = () => {
    setDetailDialog(false);
  };

  const handleFilterTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilterType(event.target.value);
  };

  const handleFilterStatusChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilterStatus(event.target.value);
  };

  const handleToggleIssues = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowOnlyIssues(event.target.checked);
  };

  const getFilteredSensors = () => {
    if (!sensorsData) return [];
    
    return sensorsData.sensors.filter(sensor => {
      // Filter by type
      if (filterType !== 'All' && sensor.type !== filterType) {
        return false;
      }
      
      // Filter by status
      if (filterStatus !== 'All' && sensor.status !== filterStatus) {
        return false;
      }
      
      // Filter issues only
      if (showOnlyIssues && sensor.status === 'Active') {
        return false;
      }
      
      return true;
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading sensors data...
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

  const filteredSensors = getFilteredSensors();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Sensors Management</Typography>
        <Button 
          startIcon={<Refresh />} 
          variant="outlined" 
          onClick={refreshData}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </Box>
      <Typography variant="body1" paragraph>
        Monitor and manage all IoT sensors deployed throughout the city.
      </Typography>

      {sensorsData && (
        <>
          {/* Sensor Overview */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Sensors fontSize="large" sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="h5">Sensor Overview</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h3">{sensorsData.total}</Typography>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CheckCircle fontSize="small" sx={{ mr: 1, color: 'success.main' }} />
                      <Typography variant="body2">Active: {sensorsData.active}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <WarningAmber fontSize="small" sx={{ mr: 1, color: 'warning.main' }} />
                      <Typography variant="body2">Warning: {sensorsData.warning}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ErrorOutline fontSize="small" sx={{ mr: 1, color: 'error.main' }} />
                      <Typography variant="body2">Error: {sensorsData.error}</Typography>
                    </Box>
                  </Box>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(sensorsData.active / sensorsData.total) * 100}
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    mt: 2
                  }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                  {Math.round((sensorsData.active / sensorsData.total) * 100)}% Operational
                </Typography>
              </Paper>
            </Grid>

            {sensorsData.types.map((type) => (
              <Grid item xs={12} sm={6} md={3} key={type.type}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" sx={{ flexGrow: 1 }}>{type.type}</Typography>
                      <Typography variant="body2" sx={{ fontSize: 24 }}>{type.icon}</Typography>
                    </Box>
                    <Typography variant="h4">{type.count}</Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip 
                        size="small" 
                        color="success" 
                        label={`${type.active} Active`} 
                        sx={{ mr: 1, mb: 1 }}
                      />
                      {type.warning > 0 && (
                        <Chip 
                          size="small" 
                          color="warning" 
                          label={`${type.warning} Warning`}
                          sx={{ mr: 1, mb: 1 }}
                        />
                      )}
                      {type.error > 0 && (
                        <Chip 
                          size="small" 
                          color="error" 
                          label={`${type.error} Error`}
                          sx={{ mb: 1 }}
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Tabs for Sensors & Alerts */}
          <Box sx={{ width: '100%', mb: 3 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeTab} onChange={handleTabChange} aria-label="sensors tabs">
                <Tab label="All Sensors" />
                <Tab label="Recent Alerts" />
                <Tab label="Battery Status" />
              </Tabs>
            </Box>
            
            {/* All Sensors Tab */}
            {activeTab === 0 && (
              <Box sx={{ mt: 3 }}>
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6" gutterBottom>Filter Sensors</Typography>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <TextField
                        select
                        fullWidth
                        label="Sensor Type"
                        value={filterType}
                        onChange={handleFilterTypeChange}
                        size="small"
                      >
                        <MenuItem value="All">All Types</MenuItem>
                        {sensorsData.types.map((type) => (
                          <MenuItem key={type.type} value={type.type}>
                            {type.type}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        select
                        fullWidth
                        label="Status"
                        value={filterStatus}
                        onChange={handleFilterStatusChange}
                        size="small"
                      >
                        <MenuItem value="All">All Statuses</MenuItem>
                        <MenuItem value="Active">Active</MenuItem>
                        <MenuItem value="Warning">Warning</MenuItem>
                        <MenuItem value="Error">Error</MenuItem>
                        <MenuItem value="Offline">Offline</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={showOnlyIssues} 
                            onChange={handleToggleIssues} 
                            color="warning" 
                          />
                        }
                        label="Show only issues"
                      />
                    </Grid>
                  </Grid>
                </Paper>
                
                <Typography variant="subtitle1" gutterBottom>
                  {filteredSensors.length} sensors found
                </Typography>
                
                <Paper>
                  <Box sx={{ overflowX: 'auto' }}>
                    <Box sx={{ minWidth: 650, p: 2 }}>
                      <Box sx={{ display: 'flex', fontWeight: 'bold', p: 1, borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                        <Box sx={{ flex: '1 1 10%' }}>ID</Box>
                        <Box sx={{ flex: '1 1 15%' }}>Type</Box>
                        <Box sx={{ flex: '1 1 20%' }}>Location</Box>
                        <Box sx={{ flex: '1 1 10%' }}>Status</Box>
                        <Box sx={{ flex: '1 1 15%' }}>Last Reading</Box>
                        <Box sx={{ flex: '1 1 15%' }}>Battery</Box>
                        <Box sx={{ flex: '1 1 15%' }}>Actions</Box>
                      </Box>
                      {filteredSensors.map((sensor) => (
                        <Box 
                          key={sensor.id} 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            p: 1, 
                            borderBottom: '1px solid rgba(0,0,0,0.06)',
                            '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
                          }}
                        >
                          <Box sx={{ flex: '1 1 10%' }}>{sensor.id}</Box>
                          <Box sx={{ flex: '1 1 15%' }}>{sensor.type}</Box>
                          <Box sx={{ flex: '1 1 20%' }}>{sensor.location}</Box>
                          <Box sx={{ flex: '1 1 10%', display: 'flex', alignItems: 'center' }}>
                            {getStatusIcon(sensor.status)}
                            <Typography sx={{ ml: 0.5 }}>{sensor.status}</Typography>
                          </Box>
                          <Box sx={{ flex: '1 1 15%' }}>{sensor.lastReading}</Box>
                          <Box sx={{ flex: '1 1 15%', display: 'flex', alignItems: 'center' }}>
                            {getBatteryIcon(sensor.battery)}
                            <Typography sx={{ ml: 0.5 }}>{sensor.battery}%</Typography>
                          </Box>
                          <Box sx={{ flex: '1 1 15%' }}>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              color={getStatusColor(sensor.status)}
                              onClick={() => handleOpenDetails(sensor)}
                            >
                              Details
                            </Button>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Paper>
              </Box>
            )}
            
            {/* Recent Alerts Tab */}
            {activeTab === 1 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>Recent Alerts</Typography>
                
                {sensorsData.recentAlerts.length > 0 ? (
                  <Paper>
                    <List>
                      {sensorsData.recentAlerts.map(alert => (
                        <Box key={alert.id}>
                          <Box sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {alert.severity === 'high' ? (
                                  <ErrorOutline color="error" sx={{ mr: 1 }} />
                                ) : alert.severity === 'medium' ? (
                                  <WarningAmber color="warning" sx={{ mr: 1 }} />
                                ) : (
                                  <InfoOutlined color="info" sx={{ mr: 1 }} />
                                )}
                                <Typography variant="subtitle1">Sensor {alert.sensorId}</Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                {alert.timestamp}
                              </Typography>
                            </Box>
                            <Typography variant="body1">{alert.message}</Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                              <Button size="small" color="primary">Acknowledge</Button>
                              <Button size="small" color="primary">
                                View Sensor
                              </Button>
                            </Box>
                          </Box>
                          <Divider />
                        </Box>
                      ))}
                    </List>
                  </Paper>
                ) : (
                  <Alert severity="info">
                    No recent alerts. All sensors are functioning properly.
                  </Alert>
                )}
              </Box>
            )}
            
            {/* Battery Status Tab */}
            {activeTab === 2 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>Battery Status</Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Battery Levels
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        {[
                          { level: 'Critical (<25%)', count: 1, color: 'error.main' },
                          { level: 'Low (25-50%)', count: 2, color: 'warning.main' },
                          { level: 'Medium (50-75%)', count: 3, color: 'info.main' },
                          { level: 'Good (>75%)', count: 2, color: 'success.main' }
                        ].map((item, index) => (
                          <Box key={index} sx={{ mb: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2">{item.level}</Typography>
                              <Typography variant="body2">{item.count} sensors</Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={(item.count / 8) * 100}
                              sx={{ 
                                height: 8, 
                                borderRadius: 4,
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: item.color
                                }
                              }}
                            />
                          </Box>
                        ))}
                      </Box>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Signal Strength
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        {[
                          { level: 'Weak (<40%)', count: 1, color: 'error.main' },
                          { level: 'Moderate (40-75%)', count: 2, color: 'warning.main' },
                          { level: 'Strong (>75%)', count: 5, color: 'success.main' }
                        ].map((item, index) => (
                          <Box key={index} sx={{ mb: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2">{item.level}</Typography>
                              <Typography variant="body2">{item.count} sensors</Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={(item.count / 8) * 100}
                              sx={{ 
                                height: 8, 
                                borderRadius: 4,
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: item.color
                                }
                              }}
                            />
                          </Box>
                        ))}
                      </Box>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Sensors Requiring Maintenance
                      </Typography>
                      
                      <Grid container spacing={2}>
                        {sensorsData.sensors
                          .filter(s => s.battery < 30 || s.signal < 40)
                          .map(sensor => (
                            <Grid item xs={12} sm={6} md={4} key={sensor.id}>
                              <Card variant="outlined">
                                <CardContent>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="subtitle1">{sensor.id}</Typography>
                                    <Typography 
                                      variant="caption" 
                                      sx={{ 
                                        color: 'white',
                                        bgcolor: getStatusColor(sensor.status) + '.main',
                                        px: 1,
                                        py: 0.5,
                                        borderRadius: 1
                                      }}
                                    >
                                      {sensor.status}
                                    </Typography>
                                  </Box>
                                  <Typography variant="body2" color="text.secondary">
                                    {sensor.location} • {sensor.type}
                                  </Typography>
                                  <Divider sx={{ my: 1 }} />
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="body2">Battery:</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      {getBatteryIcon(sensor.battery)}
                                      <Typography variant="body2" sx={{ ml: 0.5 }}>{sensor.battery}%</Typography>
                                    </Box>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2">Signal:</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      {getSignalIcon(sensor.signal)}
                                      <Typography variant="body2" sx={{ ml: 0.5 }}>{sensor.signal}%</Typography>
                                    </Box>
                                  </Box>
                                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button size="small" variant="outlined" color="primary">
                                      Schedule Maintenance
                                    </Button>
                                  </Box>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                      </Grid>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
          
          {/* Sensor Details Dialog */}
          <Dialog
            open={detailDialog}
            onClose={handleCloseDetails}
            maxWidth="md"
            fullWidth
          >
            {selectedSensor && (
              <>
                <DialogTitle>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">
                      Sensor Details: {selectedSensor.id}
                    </Typography>
                    <Box>
                      <Chip 
                        label={selectedSensor.status} 
                        color={getStatusColor(selectedSensor.status)}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Chip 
                        label={selectedSensor.type} 
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                  </Box>
                </DialogTitle>
                <DialogContent dividers>
                  <Grid container spacing={2}>
                    {/* Basic Information */}
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>Basic Information</Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">ID:</Typography>
                            <Typography variant="body2">{selectedSensor.id}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">Type:</Typography>
                            <Typography variant="body2">{selectedSensor.type}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">Location:</Typography>
                            <Typography variant="body2">{selectedSensor.location}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">Status:</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {getStatusIcon(selectedSensor.status)}
                              <Typography variant="body2" sx={{ ml: 0.5 }}>{selectedSensor.status}</Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Last Reading:</Typography>
                            <Typography variant="body2">{selectedSensor.lastReading}</Typography>
                          </Box>
                        </CardContent>
                      </Card>
                      
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>Technical Details</Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">Battery:</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {getBatteryIcon(selectedSensor.battery)}
                              <Typography variant="body2" sx={{ ml: 0.5 }}>{selectedSensor.battery}%</Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">Signal:</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {getSignalIcon(selectedSensor.signal)}
                              <Typography variant="body2" sx={{ ml: 0.5 }}>{selectedSensor.signal}%</Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">Coordinates:</Typography>
                            <Typography variant="body2">
                              {selectedSensor.coordinates?.lat}, {selectedSensor.coordinates?.lng}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    {/* Sensor Metrics */}
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>Latest Metrics</Typography>
                          {selectedSensor.metrics?.map((metric, index) => (
                            <Box 
                              key={index} 
                              sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                mb: index < (selectedSensor.metrics?.length || 0) - 1 ? 1 : 0 
                              }}
                            >
                              <Typography variant="body2" color="text.secondary">{metric.name}:</Typography>
                              <Typography variant="body2">
                                {metric.value} {metric.unit || ''}
                              </Typography>
                            </Box>
                          ))}
                        </CardContent>
                      </Card>
                      
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>Actions</Typography>
                          <Grid container spacing={1}>
                            <Grid item xs={6}>
                              <Button 
                                fullWidth
                                variant="outlined" 
                                color="primary" 
                                startIcon={<Refresh />}
                              >
                                Refresh Data
                              </Button>
                            </Grid>
                            <Grid item xs={6}>
                              <Button 
                                fullWidth
                                variant="outlined" 
                                color="warning" 
                                startIcon={<Settings />}
                              >
                                Configure
                              </Button>
                            </Grid>
                            <Grid item xs={6}>
                              <Button 
                                fullWidth
                                variant="outlined" 
                                color="info" 
                                startIcon={<Map />}
                              >
                                View on Map
                              </Button>
                            </Grid>
                            <Grid item xs={6}>
                              <Button 
                                fullWidth
                                variant="outlined" 
                                color="secondary" 
                                startIcon={<History />}
                              >
                                Historical Data
                              </Button>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleCloseDetails} color="primary">
                    Close
                  </Button>
                </DialogActions>
              </>
            )}
          </Dialog>
        </>
      )}
    </Box>
  );
};

export default SensorsPage;