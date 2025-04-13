import api, { withLocation } from './api';
import { useLocation } from '../contexts/LocationContext';

interface SolarSystem {
  system_size_kw: number;
  panel_efficiency: number;
  daily_production_kwh: number;
  monthly_production_kwh: number;
  annual_production_kwh: number;
  co2_reduction_kg_year: number;
  cost_savings_monthly: number;
  cost_savings_annual: number;
  estimated_system_cost: number;
  estimated_payback_years: number;
  hourly_data: {
    timestamp: string;
    production_kwh: number;
  }[];
}

interface SolarEstimate {
  location: {
    lat: number;
    lon: number;
    city?: string;
    state?: string;
  };
  weather_conditions: string;
  daily_solar_radiation_kwh_m2: number;
  systems: SolarSystem[];
  data_source: string;
}

interface SolarHistory {
  system_size_kw: number;
  location: {
    lat: number;
    lon: number;
  };
  history: {
    date: string;
    production_kwh: number;
    self_consumed_kwh: number;
    grid_exported_kwh: number;
  }[];
  total_produced_kwh: number;
  total_self_consumed_kwh: number;
  total_grid_exported_kwh: number;
}

export const solarService = {
  /**
   * Get solar power generation estimate for a location
   * Uses OPENEI_SOLAR_API_KEY through the backend
   * Logs detailed information about the API call for debugging
   */
  getSolarEstimate: async (
    lat: number | null = null, 
    lon: number | null = null
  ): Promise<SolarEstimate> => {
    try {
      // Create location data object, only including properties with values
      const locationData: Record<string, number> = {};
      if (lat !== null) locationData.lat = lat;
      if (lon !== null) locationData.lon = lon;
      
      console.log(`Getting solar estimate for location:`, locationData);
      
      // Use the withLocation helper to add location parameters
      const params = withLocation({});
      const response = await api.get('/api/solar/estimate', { params });
      
      console.log('Solar estimate response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching solar estimate:', error);
      throw error;
    }
  },

  /**
   * Get historical solar production data
   * Improved error handling and logging
   */
  getSolarHistory: async (
    system_size: number = 5,
    lat: number | null = null, 
    lon: number | null = null
  ): Promise<SolarHistory> => {
    try {
      // Create location data object, only including properties with values
      const locationData: Record<string, number> = {};
      if (lat !== null) locationData.lat = lat;
      if (lon !== null) locationData.lon = lon;
      
      console.log(`Getting solar history for ${system_size}kW system at location:`, locationData);
      
      // Use the withLocation helper to add location parameters
      const params = withLocation({});
      const response = await api.get(`/api/solar/history/${system_size}`, { params });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching solar history:', error);
      throw error;
    }
  }
};

export default solarService;