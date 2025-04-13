import React, { useState, useEffect, useContext } from 'react';
import { 
  Box, Typography, Paper, Grid, Tabs, Tab, Button, 
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent,
  CircularProgress, Alert, Snackbar, Card, CardContent,
  CardActions, Chip, Divider, IconButton, Switch, FormControlLabel,
  List, ListItem, ListItemIcon, ListItemText, Badge
} from '@mui/material';
import { 
  Notifications, NotificationsActive, NotificationsOff, Refresh,
  Bookmark, BookmarkBorder, Warning, Info, Error as ErrorIcon,
  FilterList, Cloud, DirectionsCar, Nature, Security,
  NotificationImportant, AccessTime, Campaign
} from '@mui/icons-material';
import { LocationContext } from '../contexts/LocationContext';

// Types
interface AlertCategory {
  id: string;
  name: string;
  icon: string;
}

interface SeverityLevel {
  id: string;
  name: string;
  color: string;
}

interface CityAlert {
  id: string;
  title: string;
  description: string;
  category_id: string;
  severity_id: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
  affected_areas: string;
  source: string;
  action_required: string;
}

interface AlertsData {
  count: number;
  alerts: CityAlert[];
}

const SEVERITY_COLORS = {
  info: '#3498db',       // Blue
  advisory: '#f39c12',   // Yellow/Orange
  warning: '#e67e22',    // Orange
  emergency: '#e74c3c'   // Red
};

const CATEGORY_ICONS = {
  weather: <Cloud />,
  traffic: <DirectionsCar />,
  environment: <Nature />,
  safety: <Security />,
  infrastructure: <Campaign />,
  health: <Campaign />,
  events: <Campaign />
};

const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<CityAlert[]>([]);
  const [categories, setCategories] = useState<AlertCategory[]>([]);
  const [severityLevels, setSeverityLevels] = useState<SeverityLevel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [showActiveOnly, setShowActiveOnly] = useState<boolean>(true);
  const [subscribedAlerts, setSubscribedAlerts] = useState<string[]>([]);
  const [openSubscriptionDialog, setOpenSubscriptionDialog] = useState<boolean>(false);
  const [subscriptionPreferences, setSubscriptionPreferences] = useState<{
    categories: string[],
    severities: string[],
    nearbyOnly: boolean
  }>({
    categories: [],
    severities: [],
    nearbyOnly: true
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  
  // Get user location
  const locationContext = useContext(LocationContext);
  const userLocation = locationContext?.location;

  // Fetch alerts data
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First, fetch categories and severity levels if not already loaded
      if (categories.length === 0) {
        const categoriesResponse = await fetch('/api/alerts/categories');
        if (!categoriesResponse.ok) throw new Error('Failed to fetch alert categories');
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData.categories);
      }
      
      if (severityLevels.length === 0) {
        const severityResponse = await fetch('/api/alerts/severity-levels');
        if (!severityResponse.ok) throw new Error('Failed to fetch severity levels');
        const severityData = await severityResponse.json();
        setSeverityLevels(severityData.severity_levels);
      }
      
      // Build query parameters
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category_id', selectedCategory);
      if (selectedSeverity !== 'all') params.append('severity_id', selectedSeverity);
      params.append('active_only', showActiveOnly.toString());
      
      // Fetch alerts with filters
      const alertsResponse = await fetch(`/api/alerts?${params.toString()}`);
      if (!alertsResponse.ok) throw new Error('Failed to fetch alerts');
      
      const alertsData: AlertsData = await alertsResponse.json();
      setAlerts(alertsData.alerts);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError('Failed to load alerts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Initial data load
  useEffect(() => {
    fetchAlerts();
    
    // Load subscribed alerts from local storage
    const savedSubscriptions = localStorage.getItem('smartCity_alertSubscriptions');
    if (savedSubscriptions) {
      try {
        setSubscribedAlerts(JSON.parse(savedSubscriptions));
      } catch (e) {
        console.error('Failed to parse saved alert subscriptions:', e);
      }
    }
    
    // Load subscription preferences from local storage
    const savedPreferences = localStorage.getItem('smartCity_alertPreferences');
    if (savedPreferences) {
      try {
        setSubscriptionPreferences(JSON.parse(savedPreferences));
      } catch (e) {
        console.error('Failed to parse saved alert preferences:', e);
      }
    }
  }, []);
  
  // Refetch when filters change
  useEffect(() => {
    fetchAlerts();
  }, [selectedCategory, selectedSeverity, showActiveOnly]);
  
  // Handle category filter change
  const handleCategoryChange = (event: SelectChangeEvent<string>) => {
    setSelectedCategory(event.target.value);
  };
  
  // Handle severity filter change
  const handleSeverityChange = (event: SelectChangeEvent<string>) => {
    setSelectedSeverity(event.target.value);
  };
  
  // Toggle active/all alerts
  const handleActiveToggle = () => {
    setShowActiveOnly(!showActiveOnly);
  };
  
  // Toggle alert subscription
  const handleToggleSubscription = (alertId: string) => {
    const newSubscriptions = subscribedAlerts.includes(alertId)
      ? subscribedAlerts.filter(id => id !== alertId)
      : [...subscribedAlerts, alertId];
    
    setSubscribedAlerts(newSubscriptions);
    localStorage.setItem('smartCity_alertSubscriptions', JSON.stringify(newSubscriptions));
    
    setSnackbar({
      open: true,
      message: subscribedAlerts.includes(alertId) 
        ? 'Alert subscription removed' 
        : 'Alert subscription added',
      severity: 'success'
    });
  };
  
  // Update subscription preferences
  const handleUpdatePreferences = () => {
    localStorage.setItem('smartCity_alertPreferences', JSON.stringify(subscriptionPreferences));
    setOpenSubscriptionDialog(false);
    
    setSnackbar({
      open: true,
      message: 'Alert preferences updated successfully',
      severity: 'success'
    });
  };
  
  // Toggle category subscription
  const handleToggleCategorySubscription = (categoryId: string) => {
    setSubscriptionPreferences(prev => {
      const newCategories = prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId];
      
      return {
        ...prev,
        categories: newCategories
      };
    });
  };
  
  // Toggle severity subscription
  const handleToggleSeveritySubscription = (severityId: string) => {
    setSubscriptionPreferences(prev => {
      const newSeverities = prev.severities.includes(severityId)
        ? prev.severities.filter(id => id !== severityId)
        : [...prev.severities, severityId];
      
      return {
        ...prev,
        severities: newSeverities
      };
    });
  };
  
  // Toggle nearby only setting
  const handleToggleNearbyOnly = () => {
    setSubscriptionPreferences(prev => ({
      ...prev,
      nearbyOnly: !prev.nearbyOnly
    }));
  };
  
  // Get severity color based on severity ID
  const getSeverityColor = (severityId: string): string => {
    return SEVERITY_COLORS[severityId as keyof typeof SEVERITY_COLORS] || '#999';
  };
  
  // Get category icon based on category ID
  const getCategoryIcon = (categoryId: string) => {
    return CATEGORY_ICONS[categoryId as keyof typeof CATEGORY_ICONS] || <Campaign />;
  };
  
  // Format date to readable string
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Calculate if an alert is expiring soon (within 6 hours)
  const isExpiringSoon = (expiresAt: string): boolean => {
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const hoursDiff = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursDiff > 0 && hoursDiff <= 6;
  };
  
  // Get severity icon based on severity ID
  const getSeverityIcon = (severityId: string) => {
    switch (severityId) {
      case 'emergency':
        return <ErrorIcon fontSize="small" />;
      case 'warning':
        return <Warning fontSize="small" />;
      default:
        return <Info fontSize="small" />;
    }
  };
  
  // Render alert cards
  const renderAlertCards = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (error) {
      return (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      );
    }
    
    if (alerts.length === 0) {
      return (
        <Alert severity="info" sx={{ my: 2 }}>
          No alerts match your current filters.
        </Alert>
      );
    }
    
    return (
      <Grid container spacing={2}>
        {alerts.map(alert => (
          <Grid item xs={12} key={alert.id}>
            <Card 
              sx={{ 
                borderLeft: `5px solid ${getSeverityColor(alert.severity_id)}`,
                opacity: alert.is_active ? 1 : 0.7 
              }}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Box display="flex" alignItems="center">
                    <Box mr={1}>
                      {getCategoryIcon(alert.category_id)}
                    </Box>
                    <Typography variant="h6" component="div">
                      {alert.title}
                    </Typography>
                  </Box>
                  
                  <Chip 
                    icon={getSeverityIcon(alert.severity_id)}
                    label={severityLevels.find(s => s.id === alert.severity_id)?.name || 'Unknown'}
                    size="small"
                    sx={{ 
                      bgcolor: `${getSeverityColor(alert.severity_id)}20`,
                      color: getSeverityColor(alert.severity_id),
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
                
                <Typography variant="body1" color="text.secondary" paragraph>
                  {alert.description}
                </Typography>
                
                {alert.action_required && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Action Required:</strong> {alert.action_required}
                    </Typography>
                  </Alert>
                )}
                
                <Box display="flex" flexWrap="wrap" gap={1} mt={2}>
                  <Chip 
                    size="small"
                    label={`Source: ${alert.source}`}
                    variant="outlined"
                  />
                  
                  <Chip 
                    size="small"
                    label={`Area: ${alert.affected_areas}`}
                    variant="outlined"
                  />
                  
                  <Chip 
                    size="small"
                    icon={<AccessTime fontSize="small" />}
                    label={isExpiringSoon(alert.expires_at) 
                      ? 'Expires soon!' 
                      : `Expires: ${formatDate(alert.expires_at)}`}
                    color={isExpiringSoon(alert.expires_at) ? 'warning' : 'default'}
                    variant="outlined"
                  />
                </Box>
              </CardContent>
              
              <CardActions sx={{ justifyContent: 'flex-end' }}>
                <Button 
                  size="small" 
                  startIcon={subscribedAlerts.includes(alert.id) ? <Bookmark /> : <BookmarkBorder />}
                  onClick={() => handleToggleSubscription(alert.id)}
                  color={subscribedAlerts.includes(alert.id) ? 'primary' : 'inherit'}
                >
                  {subscribedAlerts.includes(alert.id) ? 'Subscribed' : 'Subscribe'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };
  
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          City Alerts
        </Typography>
        
        <Box>
          <Badge 
            badgeContent={subscribedAlerts.length} 
            color="primary"
            sx={{ mr: 2 }}
          >
            <Button
              variant="outlined"
              startIcon={<NotificationsActive />}
              onClick={() => setOpenSubscriptionDialog(true)}
            >
              Manage Subscriptions
            </Button>
          </Badge>
          
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={fetchAlerts}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" flexWrap="wrap" alignItems="center" gap={2}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="category-filter-label">Category</InputLabel>
            <Select
              labelId="category-filter-label"
              value={selectedCategory}
              label="Category"
              onChange={handleCategoryChange}
            >
              <MenuItem value="all">All Categories</MenuItem>
              {categories.map(category => (
                <MenuItem value={category.id} key={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="severity-filter-label">Severity</InputLabel>
            <Select
              labelId="severity-filter-label"
              value={selectedSeverity}
              label="Severity"
              onChange={handleSeverityChange}
            >
              <MenuItem value="all">All Severities</MenuItem>
              {severityLevels.map(severity => (
                <MenuItem value={severity.id} key={severity.id}>
                  {severity.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControlLabel
            control={
              <Switch
                checked={showActiveOnly}
                onChange={handleActiveToggle}
                color="primary"
              />
            }
            label="Active Alerts Only"
          />
        </Box>
      </Paper>
      
      {renderAlertCards()}
      
      {/* Alert Subscription Dialog */}
      <Dialog
        open={openSubscriptionDialog}
        onClose={() => setOpenSubscriptionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <NotificationsActive sx={{ mr: 1 }} />
            Alert Subscription Preferences
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          <Typography variant="subtitle1" gutterBottom>
            Select categories to subscribe to:
          </Typography>
          
          <Grid container spacing={1} sx={{ mb: 3 }}>
            {categories.map(category => (
              <Grid item xs={6} key={category.id}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={subscriptionPreferences.categories.includes(category.id)}
                      onChange={() => handleToggleCategorySubscription(category.id)}
                      color="primary"
                    />
                  }
                  label={category.name}
                />
              </Grid>
            ))}
          </Grid>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Select severity levels to subscribe to:
          </Typography>
          
          <Grid container spacing={1} sx={{ mb: 3 }}>
            {severityLevels.map(severity => (
              <Grid item xs={6} key={severity.id}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={subscriptionPreferences.severities.includes(severity.id)}
                      onChange={() => handleToggleSeveritySubscription(severity.id)}
                      color="primary"
                    />
                  }
                  label={severity.name}
                />
              </Grid>
            ))}
          </Grid>
          
          <Divider sx={{ my: 2 }} />
          
          <FormControlLabel
            control={
              <Switch
                checked={subscriptionPreferences.nearbyOnly}
                onChange={handleToggleNearbyOnly}
                color="primary"
              />
            }
            label="Only notify me about alerts in my area"
          />
          
          {userLocation && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Your current location: {userLocation.city} ({userLocation.lat.toFixed(4)}, {userLocation.lon.toFixed(4)})
            </Typography>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setOpenSubscriptionDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleUpdatePreferences}
            variant="contained"
            color="primary"
            startIcon={<Notifications />}
          >
            Save Preferences
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AlertsPage; 