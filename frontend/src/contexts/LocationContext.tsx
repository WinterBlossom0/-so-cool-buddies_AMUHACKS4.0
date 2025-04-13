import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

export interface LocationContextType {
  location: {
    lat: number;
    lon: number;
    city: string;
  };
  setLocation: (lat: number, lon: number, city: string) => void;
  forceLocationRequest: () => void;
  hasValidLocation: boolean;
}

interface LocationProviderProps {
  children: ReactNode;
}

// Default location that represents an unset state (zeros)
const defaultLocation = {
  lat: 0,
  lon: 0,
  city: '',
};

export const LocationContext = createContext<LocationContextType | null>(null);

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [location, setLocationState] = useState(defaultLocation);
  const [promptForLocation, setPromptForLocation] = useState(false);
  
  // Helper to check if location is valid
  const hasValidLocation = location.lat !== 0 && location.lon !== 0;

  useEffect(() => {
    // Load location from localStorage if available
    const savedLocation = localStorage.getItem('smartCity_userLocation');
    if (savedLocation) {
      try {
        const { center, cityName } = JSON.parse(savedLocation);
        if (center && Array.isArray(center) && center.length === 2) {
          setLocationState({
            lat: center[0],
            lon: center[1],
            city: cityName || 'Unknown Location'
          });
        }
      } catch (error) {
        console.error("Failed to parse saved location:", error);
        setPromptForLocation(true);
      }
    } else {
      // No saved location, should prompt
      setPromptForLocation(true);
    }
  }, []);

  const setLocation = (lat: number, lon: number, city: string) => {
    const newLocation = { lat, lon, city };
    setLocationState(newLocation);
    
    // Save to localStorage for persistence
    localStorage.setItem('smartCity_userLocation', JSON.stringify({
      center: [lat, lon],
      cityName: city
    }));
    
    // No longer need to prompt
    setPromptForLocation(false);
  };
  
  const forceLocationRequest = () => {
    // Clear existing location data
    localStorage.removeItem('smartCity_userLocation');
    setLocationState(defaultLocation);
    setPromptForLocation(true);
  };

  return (
    <LocationContext.Provider value={{ 
      location, 
      setLocation, 
      forceLocationRequest,
      hasValidLocation 
    }}>
      {children}
    </LocationContext.Provider>
  );
};