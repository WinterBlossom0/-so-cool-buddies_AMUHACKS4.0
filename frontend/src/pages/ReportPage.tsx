import React from 'react';
import { Box, Container } from '@mui/material';
import ReportIncident from '../components/ReportIncident';

const ReportPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <ReportIncident />
      </Box>
    </Container>
  );
};

export default ReportPage; 