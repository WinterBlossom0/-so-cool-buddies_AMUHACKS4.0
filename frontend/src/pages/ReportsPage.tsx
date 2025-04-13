import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, Tabs, Tab, Button, 
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, FormControl, InputLabel, Select, SelectChangeEvent,
  CircularProgress, Alert, Snackbar, Card, CardContent,
  CardActions, Chip, Divider, IconButton, LinearProgress
} from '@mui/material';
import { 
  PictureAsPdf, GetApp, DateRange, Add, FilterList,
  Refresh, BarChart, PieChart, CategoryOutlined,
  CheckCircleOutline, ErrorOutline, HourglassEmpty, 
  DeleteOutline, ThumbUp, Edit
} from '@mui/icons-material';
import { 
  getReports, generatePdfReport, createReport, voteReport,
  ReportsData, Report, ReportCategory, ReportStatus  
} from '../services/reportsService';
import { format } from 'date-fns';

const ReportsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openNewReportDialog, setOpenNewReportDialog] = useState(false);
  const [newReport, setNewReport] = useState({
    title: '',
    description: '',
    category_id: '',
    location: {
      lat: 51.5074,
      lon: -0.1278,
      address: 'London, UK'
    }
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [chartView, setChartView] = useState<'bar' | 'pie'>('bar');
  const [submittingReport, setSubmittingReport] = useState(false);

  const categoryLabels: Record<string, string> = {
    'traffic': 'Traffic',
    'environment': 'Environment',
    'safety': 'Safety',
    'infrastructure': 'Infrastructure',
    'noise': 'Noise',
    'waste': 'Waste',
    'other': 'Other'
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleNewReportChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      // Handle nested properties like location.address
      const [parent, child] = name.split('.');
      setNewReport(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as object,
          [child]: value
        }
      }));
    } else {
      setNewReport(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCategoryChange = (e: SelectChangeEvent<string>) => {
    const value = e.target.value as string;
    setNewReport(prev => ({
      ...prev,
      category_id: value
    }));
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getReports();
      if (data) {
        setReportsData(data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      setError('Failed to load reports data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleSubmitReport = async () => {
    try {
      setSubmittingReport(true);
      await createReport(newReport);
      await fetchReports();
      setOpenNewReportDialog(false);
      setNewReport({
        title: '',
        description: '',
        category_id: '',
        location: {
          lat: 51.5074,
          lon: -0.1278,
          address: 'London, UK'
        }
      });
      setSnackbar({
        open: true,
        message: 'Report submitted successfully!',
        severity: 'success'
      });
    } catch (err) {
      console.error('Failed to submit report:', err);
      setSnackbar({
        open: true,
        message: 'Failed to submit report. Please try again.',
        severity: 'error'
      });
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleVote = async (reportId: string) => {
    try {
      await voteReport(reportId);
      await fetchReports();
      setSnackbar({
        open: true,
        message: 'Vote recorded successfully!',
        severity: 'success'
      });
    } catch (err) {
      console.error('Failed to vote for report:', err);
      setSnackbar({
        open: true,
        message: 'Failed to vote. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleGeneratePdf = async () => {
    try {
      setPdfGenerating(true);
      const filters = selectedCategory !== 'all' ? { category: selectedCategory } : {};
      const pdfUrl = await generatePdfReport(filters);
      
      // Create a link element and trigger download
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `smart-city-reports-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSnackbar({
        open: true,
        message: 'PDF report generated successfully!',
        severity: 'success'
      });
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      setSnackbar({
        open: true,
        message: 'Failed to generate PDF. Please try again.',
        severity: 'error'
      });
    } finally {
      setPdfGenerating(false);
    }
  };

  const getStatusChip = (statusId: string) => {
    if (!reportsData?.statuses) return null;
    const status = reportsData.statuses.find(s => s.id === statusId);
    if (!status) return null;

    let icon;
    switch (status.name.toLowerCase()) {
      case 'resolved':
        icon = <CheckCircleOutline fontSize="small" />;
        break;
      case 'in progress':
        icon = <HourglassEmpty fontSize="small" />;
        break;
      default:
        icon = <ErrorOutline fontSize="small" />;
    }

    return (
      <Chip 
        icon={icon}
        label={status.name}
        size="small"
        sx={{ 
          bgcolor: `#${status.color}25`,
          color: `#${status.color}`,
          fontWeight: 'bold'
        }}
      />
    );
  };

  const getCategoryIcon = (categoryId: string) => {
    if (!reportsData?.categories) return 'Unknown';
    const category = reportsData.categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  const filterReports = (reports: Report[]) => {
    if (!reports) return [];
    if (selectedCategory === 'all') return reports;
    return reports.filter(report => report.category_id === selectedCategory);
  };

  const getCompletionPercentage = () => {
    if (!reportsData?.stats) return 0;
    const { resolved, total } = reportsData.stats;
    return total > 0 ? Math.round((resolved / total) * 100) : 0;
  };

  // Create chart data for visualization
  const renderChartData = () => {
    if (!reportsData?.stats?.by_category) {
      return <Typography variant="body2">No category data available</Typography>;
    }

    const { by_category } = reportsData.stats;
    const categories = Object.keys(by_category);
    
    if (chartView === 'bar') {
      return (
        <Box sx={{ height: '100%', display: 'flex', alignItems: 'flex-end' }}>
          {categories.map(category => (
            <Box 
              key={category}
              sx={{
                height: `${(by_category[category] / Math.max(...Object.values(by_category))) * 100}%`,
                width: `${80 / categories.length}%`,
                mx: 0.5,
                bgcolor: 'primary.main',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                alignItems: 'center',
                borderRadius: '4px 4px 0 0',
                position: 'relative',
                minHeight: '10px'
              }}
            >
              <Typography variant="caption" sx={{ position: 'absolute', bottom: -20, fontSize: '0.6rem' }}>
                {categoryLabels[category] || category}
              </Typography>
              <Typography variant="caption" sx={{ color: 'white', fontSize: '0.7rem' }}>
                {by_category[category]}
              </Typography>
            </Box>
          ))}
        </Box>
      );
    } else {
      // Simple pie chart representation
      const totalReports = Object.values(by_category).reduce((a, b) => a + b, 0);
      let accumulatedPercentage = 0;
      
      return (
        <Box sx={{ position: 'relative', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Box 
            sx={{ 
              width: 80, 
              height: 80, 
              borderRadius: '50%', 
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {categories.map(category => {
              const percentage = (by_category[category] / totalReports) * 100;
              const startAngle = (accumulatedPercentage / 100) * 360;
              accumulatedPercentage += percentage;
              const endAngle = (accumulatedPercentage / 100) * 360;
              
              return (
                <Box
                  key={category}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: `conic-gradient(
                      transparent ${startAngle}deg,
                      ${`hsl(${categories.indexOf(category) * (360 / categories.length)}, 70%, 50%)`} ${startAngle}deg,
                      ${`hsl(${categories.indexOf(category) * (360 / categories.length)}, 70%, 50%)`} ${endAngle}deg,
                      transparent ${endAngle}deg
                    )`
                  }}
                />
              );
            })}
          </Box>
          <Box sx={{ position: 'absolute', bottom: 0, width: '100%', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 0.5 }}>
            {categories.map((category, index) => (
              <Chip
                key={category}
                label={`${categoryLabels[category] || category}: ${by_category[category]}`}
                size="small"
                sx={{ 
                  bgcolor: `hsl(${index * (360 / categories.length)}, 70%, 50%)`,
                  color: 'white',
                  fontSize: '0.6rem',
                  height: 20
                }}
              />
            ))}
          </Box>
        </Box>
      );
    }
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Reports & Analytics
        </Typography>
        <Button 
          startIcon={<Refresh />}
          variant="outlined"
          onClick={fetchReports}
          disabled={loading}
        >
          Refresh Data
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading && !reportsData ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Citizen Reports
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 120, mr: 2 }}>
                  <InputLabel id="category-filter-label">Category</InputLabel>
                  <Select
                    labelId="category-filter-label"
                    id="category-filter"
                    value={selectedCategory}
                    label="Category"
                    onChange={(e) => setSelectedCategory(e.target.value as string)}
                    startAdornment={<FilterList sx={{ mr: 1, color: 'action.active' }} fontSize="small" />}
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    {reportsData?.categories?.map(category => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button 
                  startIcon={<PictureAsPdf />} 
                  variant="outlined" 
                  sx={{ mr: 2 }}
                  onClick={handleGeneratePdf}
                  disabled={pdfGenerating}
                >
                  {pdfGenerating ? 'Generating...' : 'Export PDF'}
                </Button>
                <Button 
                  startIcon={<Add />} 
                  variant="contained" 
                  color="primary"
                  onClick={() => setOpenNewReportDialog(true)}
                >
                  New Report
                </Button>
              </Box>
            </Box>

            {reportsData?.stats && (
              <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1">Report Status</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={getCompletionPercentage()} 
                        sx={{ flex: 1, mr: 2, height: 10, borderRadius: 5 }}
                      />
                      <Typography variant="body2">{getCompletionPercentage()}% Resolved</Typography>
                    </Box>
                    <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                      <Chip 
                        icon={<HourglassEmpty fontSize="small" />}
                        label={`${reportsData.stats.pending} Pending`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip 
                        icon={<CheckCircleOutline fontSize="small" />}
                        label={`${reportsData.stats.resolved} Resolved`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip 
                        icon={<CategoryOutlined fontSize="small" />}
                        label={`${reportsData.stats.total} Total`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                      <IconButton size="small" onClick={() => setChartView('bar')} color={chartView === 'bar' ? 'primary' : 'default'}>
                        <BarChart />
                      </IconButton>
                      <IconButton size="small" onClick={() => setChartView('pie')} color={chartView === 'pie' ? 'primary' : 'default'}>
                        <PieChart />
                      </IconButton>
                    </Box>
                    <Box sx={{ height: 100, borderRadius: 1, p: 1 }}>
                      {renderChartData()}
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            )}

            {reportsData && reportsData.reports && reportsData.reports.length > 0 ? (
              <Grid container spacing={2}>
                {filterReports(reportsData.reports).map((report) => (
                  <Grid item xs={12} sm={6} md={4} key={report.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {report.title}
                          </Typography>
                          {getStatusChip(report.status_id)}
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          {format(new Date(report.created_at), 'MMM d, yyyy')} - {getCategoryIcon(report.category_id)}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          {report.description.length > 100 
                            ? `${report.description.substring(0, 100)}...` 
                            : report.description}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Location: {report.location.address || 'Unknown location'}
                          </Typography>
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Button 
                          startIcon={<ThumbUp />} 
                          size="small"
                          onClick={() => handleVote(report.id)}
                        >
                          Support ({report.votes})
                        </Button>
                        <Button startIcon={<Edit />} size="small">
                          Edit
                        </Button>
                        <Button startIcon={<DeleteOutline />} size="small" color="error">
                          Delete
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1">No reports available.</Typography>
                <Button 
                  variant="outlined" 
                  startIcon={<Add />}
                  onClick={() => setOpenNewReportDialog(true)}
                  sx={{ mt: 2 }}
                >
                  Create First Report
                </Button>
              </Box>
            )}
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Analytics Dashboard
            </Typography>
            <Box sx={{ height: 400, bgcolor: 'action.hover', borderRadius: 1, p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Typography>Advanced analytics charts would be displayed here</Typography>
            </Box>
          </Paper>

          {/* New Report Dialog */}
          <Dialog 
            open={openNewReportDialog} 
            onClose={() => setOpenNewReportDialog(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Submit New Report</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                id="title"
                name="title"
                label="Report Title"
                type="text"
                fullWidth
                variant="outlined"
                value={newReport.title}
                onChange={handleNewReportChange}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                id="description"
                name="description"
                label="Description"
                multiline
                rows={4}
                fullWidth
                variant="outlined"
                value={newReport.description}
                onChange={handleNewReportChange}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  id="category"
                  name="category_id"
                  value={newReport.category_id}
                  label="Category"
                  onChange={handleCategoryChange}
                >
                  {reportsData?.categories?.map(category => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                margin="dense"
                id="location-address"
                name="location.address"
                label="Location"
                fullWidth
                variant="outlined"
                value={newReport.location.address}
                onChange={handleNewReportChange}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenNewReportDialog(false)}>Cancel</Button>
              <Button 
                onClick={handleSubmitReport}
                variant="contained"
                disabled={submittingReport || !newReport.title || !newReport.description || !newReport.category_id}
              >
                {submittingReport ? 'Submitting...' : 'Submit'}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
      
      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReportsPage;