import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from '@mui/material';
import { 
  Warning as WarningIcon, 
  Info as InfoIcon, 
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

import { 
  getAlerts, 
  CityAlert, 
  AlertCategory, 
  SeverityLevel 
} from '../../services/alertsService';

const AlertsList: React.FC = () => {
  const [alerts, setAlerts] = useState<CityAlert[]>([]);
  const [categories, setCategories] = useState<AlertCategory[]>([]);
  const [severityLevels, setSeverityLevels] = useState<SeverityLevel[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<string[]>([]);
  const [onlyActive, setOnlyActive] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<CityAlert | null>(null);

  useEffect(() => {
    fetchAlerts();
  }, [selectedCategories, selectedSeverity, onlyActive]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await getAlerts(selectedCategories, selectedSeverity, onlyActive);
      setAlerts(data.alerts);
      setCategories(data.categories);
      setSeverityLevels(data.severity_levels);
      setLoading(false);
    } catch (err) {
      setError('Failed to load alerts. Please try again later.');
      setLoading(false);
    }
  };

  const handleCategoryChange = (event: SelectChangeEvent<string[]>) => {
    setSelectedCategories(event.target.value as string[]);
  };

  const handleSeverityChange = (event: SelectChangeEvent<string[]>) => {
    setSelectedSeverity(event.target.value as string[]);
  };

  const handleActiveToggle = () => {
    setOnlyActive(!onlyActive);
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  const getSeverityInfo = (severityId: string) => {
    const severity = severityLevels.find(sev => sev.id === severityId);
    return severity ? { name: severity.name, color: severity.color } : { name: 'Unknown', color: '#999' };
  };

  const handleAlertClick = (alert: CityAlert) => {
    setSelectedAlert(alert);
  };

  const handleCloseDialog = () => {
    setSelectedAlert(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>City Alerts</Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Filter by Category</InputLabel>
            <Select
              multiple
              value={selectedCategories}
              onChange={handleCategoryChange}
              label="Filter by Category"
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={getCategoryName(value)} />
                  ))}
                </Box>
              )}
            >
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Filter by Severity</InputLabel>
            <Select
              multiple
              value={selectedSeverity}
              onChange={handleSeverityChange}
              label="Filter by Severity"
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip 
                      key={value} 
                      label={getSeverityInfo(value).name}
                      sx={{ bgcolor: getSeverityInfo(value).color, color: '#fff' }}
                    />
                  ))}
                </Box>
              )}
            >
              {severityLevels.map((severity) => (
                <MenuItem key={severity.id} value={severity.id}>
                  {severity.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControlLabel
            control={<Switch checked={onlyActive} onChange={handleActiveToggle} />}
            label="Show only active alerts"
          />
        </Grid>
      </Grid>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {alerts.length === 0 ? (
            <Grid item xs={12}>
              <Typography variant="body1" color="textSecondary" align="center">
                No alerts found matching your criteria.
              </Typography>
            </Grid>
          ) : (
            alerts.map((alert) => (
              <Grid item xs={12} sm={6} md={4} key={alert.id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    borderLeft: `4px solid ${getSeverityInfo(alert.severity_id).color}`,
                    '&:hover': {
                      boxShadow: 4
                    }
                  }}
                  onClick={() => handleAlertClick(alert)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Chip 
                        label={getCategoryName(alert.category_id)} 
                        size="small" 
                      />
                      <Chip 
                        label={getSeverityInfo(alert.severity_id).name}
                        size="small"
                        sx={{ 
                          bgcolor: getSeverityInfo(alert.severity_id).color,
                          color: '#fff'
                        }}
                        icon={<WarningIcon />}
                      />
                    </Box>
                    
                    <Typography variant="h6" component="div" gutterBottom>
                      {alert.title}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {alert.description.length > 120 
                        ? `${alert.description.substring(0, 120)}...` 
                        : alert.description
                      }
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationIcon fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="body2" color="text.secondary">
                          {alert.location.address}
                        </Typography>
                      </Box>
                      
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(alert.created_at), 'MMM dd, yyyy')}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}
      
      {/* Alert Detail Dialog */}
      <Dialog open={!!selectedAlert} onClose={handleCloseDialog} maxWidth="md">
        {selectedAlert && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              {selectedAlert.title}
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Chip 
                  label={getCategoryName(selectedAlert.category_id)} 
                  size="small" 
                />
                <Chip 
                  label={getSeverityInfo(selectedAlert.severity_id).name}
                  size="small"
                  sx={{ 
                    bgcolor: getSeverityInfo(selectedAlert.severity_id).color,
                    color: '#fff'
                  }}
                />
                {!selectedAlert.is_active && (
                  <Chip label="Inactive" size="small" color="default" />
                )}
              </Box>
            </DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ whiteSpace: 'pre-line' }}>
                {selectedAlert.description}
              </DialogContentText>
              
              <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationIcon fontSize="small" />
                <Typography variant="body2">
                  {selectedAlert.location.address}
                </Typography>
              </Box>
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Created:</Typography>
                  <Typography variant="body2">
                    {format(new Date(selectedAlert.created_at), 'MMMM dd, yyyy hh:mm a')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Expires:</Typography>
                  <Typography variant="body2">
                    {format(new Date(selectedAlert.expires_at), 'MMMM dd, yyyy hh:mm a')}
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AlertsList; 