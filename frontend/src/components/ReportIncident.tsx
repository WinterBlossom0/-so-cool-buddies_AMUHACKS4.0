import React, { useState, useContext } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  FormHelperText
} from '@mui/material';
import { 
  Report as ReportIcon, 
  Send as SendIcon,
  LocationOn as LocationIcon,
  AddAPhoto as AddPhotoIcon
} from '@mui/icons-material';
import { LocationContext } from '../contexts/LocationContext';
import api from '../services/api';

// Incident categories
const INCIDENT_CATEGORIES = [
  { id: 'infrastructure', name: 'Infrastructure Damage' },
  { id: 'safety', name: 'Public Safety Concern' },
  { id: 'environment', name: 'Environmental Issue' },
  { id: 'traffic', name: 'Traffic Problem' },
  { id: 'noise', name: 'Noise Complaint' },
  { id: 'other', name: 'Other' }
];

const ReportIncident: React.FC = () => {
  const locationContext = useContext(LocationContext);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [useCurrentLocation, setUseCurrentLocation] = useState<boolean>(true);
  const [latitude, setLatitude] = useState<string>(locationContext?.location.lat.toString() || '');
  const [longitude, setLongitude] = useState<string>(locationContext?.location.lon.toString() || '');
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    description?: string;
    category?: string;
    location?: string;
  }>({});

  const handleLocationToggle = () => {
    setUseCurrentLocation(!useCurrentLocation);
    
    // Reset to current location from context when toggling back to current location
    if (!useCurrentLocation && locationContext) {
      setLatitude(locationContext.location.lat.toString());
      setLongitude(locationContext.location.lon.toString());
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      setImage(selectedFile);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const validateForm = (): boolean => {
    const errors: {
      title?: string;
      description?: string;
      category?: string;
      location?: string;
    } = {};
    
    if (!title.trim()) {
      errors.title = 'Please provide a title for your report';
    }
    
    if (!description.trim()) {
      errors.description = 'Please describe the incident';
    } else if (description.length < 20) {
      errors.description = 'Description should be at least 20 characters';
    }
    
    if (!category) {
      errors.category = 'Please select a category';
    }
    
    if (!useCurrentLocation) {
      if (!latitude || !longitude) {
        errors.location = 'Please provide location coordinates';
      } else {
        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);
        
        if (isNaN(lat) || lat < -90 || lat > 90) {
          errors.location = 'Latitude must be between -90 and 90';
        } else if (isNaN(lon) || lon < -180 || lon > 180) {
          errors.location = 'Longitude must be between -180 and 180';
        }
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      
      // Location data
      const locationData = {
        lat: useCurrentLocation ? locationContext?.location.lat : parseFloat(latitude),
        lon: useCurrentLocation ? locationContext?.location.lon : parseFloat(longitude)
      };
      formData.append('location', JSON.stringify(locationData));
      
      // Add image if provided
      if (image) {
        formData.append('image', image);
      }
      
      // In a real app, this would be a POST request
      // await api.post('/api/incidents/report', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess(true);
      resetForm();
    } catch (err) {
      console.error('Error submitting report:', err);
      setError('Failed to submit report. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('');
    setImage(null);
    setPreviewUrl(null);
    // Keep location as is
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
    setError(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ReportIcon color="primary" />
        Report an Incident
      </Typography>
      
      <Paper sx={{ p: 3, mt: 2 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Title"
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief title of the incident"
                error={!!formErrors.title}
                helperText={formErrors.title}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!formErrors.category}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  label="Category"
                  disabled={loading}
                >
                  {INCIDENT_CATEGORIES.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.category && (
                  <FormHelperText>{formErrors.category}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Button
                variant={useCurrentLocation ? "contained" : "outlined"}
                color="primary"
                startIcon={<LocationIcon />}
                onClick={handleLocationToggle}
                fullWidth
                sx={{ height: '56px' }}
                disabled={loading}
              >
                {useCurrentLocation ? "Using Current Location" : "Use Custom Location"}
              </Button>
            </Grid>
            
            {!useCurrentLocation && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Latitude"
                    fullWidth
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    type="number"
                    inputProps={{ step: "0.000001" }}
                    error={!!formErrors.location}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Longitude"
                    fullWidth
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    type="number"
                    inputProps={{ step: "0.000001" }}
                    error={!!formErrors.location}
                    helperText={formErrors.location}
                    disabled={loading}
                  />
                </Grid>
              </>
            )}
            
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe the incident in detail. Include any relevant information that might help city services respond effectively."
                error={!!formErrors.description}
                helperText={formErrors.description}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<AddPhotoIcon />}
                disabled={loading}
                sx={{ mb: 2 }}
              >
                Add Photo
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </Button>
              
              {previewUrl && (
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Image Preview:
                  </Typography>
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '200px',
                      borderRadius: '4px'
                    }} 
                  />
                </Box>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Report'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
      
      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          Report submitted successfully! City services have been notified.
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReportIncident; 