import React from 'react';
import { 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Chip, 
  Typography, 
  Box,
  Divider,
  Avatar
} from '@mui/material';
import {
  WarningAmber,
  Construction,
  LocalPolice,
  EventBusy,
  DirectionsCarFilledTwoTone
} from '@mui/icons-material';

const TrafficIncidentsList: React.FC = () => {
  // Mock data - this would normally come from an API
  const incidents = [
    {
      id: 1,
      type: 'accident',
      severity: 'minor',
      location: 'Main Street & Oak Avenue',
      status: 'ongoing',
      reportedAt: new Date(Date.now() - 45 * 60000).toISOString(), // 45 min ago
      description: 'Minor collision, right lane blocked'
    },
    {
      id: 2,
      type: 'construction',
      severity: 'moderate',
      location: 'Central Parkway',
      status: 'ongoing',
      reportedAt: new Date(Date.now() - 8 * 60 * 60000).toISOString(), // 8 hours ago
      description: 'Road work, two lanes closed'
    },
    {
      id: 3,
      type: 'accident',
      severity: 'minor',
      location: 'River Road & Market Street',
      status: 'resolving',
      reportedAt: new Date(Date.now() - 30 * 60000).toISOString(), // 30 min ago
      description: 'Fender bender, partially blocking traffic'
    },
    {
      id: 4,
      type: 'accident',
      severity: 'minor',
      location: 'Highland Avenue',
      status: 'cleared',
      reportedAt: new Date(Date.now() - 90 * 60000).toISOString(), // 90 min ago
      description: 'Vehicle collision cleared, residual delays'
    },
  ];

  // Function to get the appropriate icon for each incident type
  const getIncidentIcon = (type: string) => {
    switch(type) {
      case 'accident':
        return <DirectionsCarFilledTwoTone color="error" />;
      case 'construction':
        return <Construction color="warning" />;
      case 'police':
        return <LocalPolice color="info" />;
      case 'closure':
        return <EventBusy color="error" />;
      default:
        return <WarningAmber color="warning" />;
    }
  };

  // Function to get the severity color
  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'severe':
        return 'error';
      case 'moderate':
        return 'warning';
      case 'minor':
        return 'info';
      default:
        return 'default';
    }
  };

  // Function to get the status color
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ongoing':
        return 'error';
      case 'resolving':
        return 'warning';
      case 'cleared':
        return 'success';
      default:
        return 'default';
    }
  };

  // Function to format the reported time
  const formatReportedTime = (reportedAt: string) => {
    const reported = new Date(reportedAt);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - reported.getTime()) / (60 * 1000));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} min${diffMinutes !== 1 ? 's' : ''} ago`;
    } else {
      const diffHours = Math.floor(diffMinutes / 60);
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    }
  };

  return (
    <List sx={{ width: '100%' }}>
      {incidents.length === 0 ? (
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No active incidents to report
          </Typography>
        </Box>
      ) : (
        incidents.map((incident, index) => (
          <React.Fragment key={incident.id}>
            <ListItem alignItems="flex-start">
              <ListItemIcon>
                {getIncidentIcon(incident.type)}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2" component="span">
                      {incident.location}
                    </Typography>
                    <Chip 
                      label={incident.status} 
                      size="small" 
                      color={getStatusColor(incident.status) as any}
                      sx={{ fontSize: 10 }}
                    />
                  </Box>
                }
                secondary={
                  <React.Fragment>
                    <Typography variant="body2" component="span">
                      {incident.description}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                      <Chip 
                        label={`${incident.severity} ${incident.type}`} 
                        size="small" 
                        color={getSeverityColor(incident.severity) as any} 
                        variant="outlined"
                        sx={{ fontSize: 10 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {formatReportedTime(incident.reportedAt)}
                      </Typography>
                    </Box>
                  </React.Fragment>
                }
              />
            </ListItem>
            {index < incidents.length - 1 && <Divider variant="inset" component="li" />}
          </React.Fragment>
        ))
      )}
    </List>
  );
};

export default TrafficIncidentsList;