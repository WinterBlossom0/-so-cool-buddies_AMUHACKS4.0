import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Layout components
import MainLayout from './layouts/MainLayout';

// Page components
import Dashboard from './pages/Dashboard';
import MapView from './pages/MapView';
import WeatherPage from './pages/WeatherPage';
import AirQualityPage from './pages/AirQualityPage';
import SensorsPage from './pages/SensorsPage';
import WastePage from './pages/WastePage';
import SolarPage from './pages/SolarPage';
import TrafficPage from './pages/TrafficPage';
import ChatbotPage from './pages/ChatbotPage';
import ReportPage from './pages/ReportPage';

// Location Context Provider
import { LocationProvider, LocationContext } from './contexts/LocationContext';

// Import LocationPrompt component - MANDATORY location access
import LocationPrompt from './components/LocationPrompt';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#4caf50',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocationProvider>
        <Router>
          {/* Always render LocationPrompt first - it blocks the app until location is provided */}
          <LocationPrompt />
          
          {/* Routes only render if location is provided (LocationPrompt controls this) */}
          <LocationContext.Consumer>
            {(locationContext) => {
              // Check if we have a valid location
              const hasValidLocation = locationContext?.hasValidLocation ?? false;
              
              // Don't render the app content if no location
              if (!hasValidLocation) {
                return <div style={{ height: '100vh' }} />;
              }
              
              // Only render the main UI if location is provided
              return (
                <div className="App">
                  <MainLayout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/weather" element={<WeatherPage />} />
                      <Route path="/traffic" element={<TrafficPage />} />
                      <Route path="/map" element={<MapView />} />
                      <Route path="/solar" element={<SolarPage />} />
                      <Route path="/waste" element={<WastePage />} />
                      <Route path="/air-quality" element={<AirQualityPage />} />
                      <Route path="/sensors" element={<SensorsPage />} />
                      <Route path="/chatbot" element={<ChatbotPage />} />
                      <Route path="/report" element={<ReportPage />} />
                      <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                  </MainLayout>
                </div>
              );
            }}
          </LocationContext.Consumer>
        </Router>
      </LocationProvider>
    </ThemeProvider>
  );
}

export default App;
