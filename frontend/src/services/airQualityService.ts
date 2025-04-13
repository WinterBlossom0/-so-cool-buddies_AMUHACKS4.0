import api from './api';

interface AirQualityLocation {
  lat: number;
  lon: number;
  name?: string;
}

interface Pollutants {
  pm25?: number;
  pm10?: number;
  o3?: number;
  no2?: number;
  so2?: number;
  co?: number;
}

interface AirQualityCurrent {
  aqi: number;
  level: string;
  color: string;
  pollutants: Pollutants;
  last_updated: string;
}

interface AirQualityHistoryItem {
  date: string;
  aqi: number;
}

interface AirQualityData {
  location: AirQualityLocation;
  current: AirQualityCurrent;
  history?: AirQualityHistoryItem[];
}

export const airQualityService = {
  /**
   * Get current air quality data for a location
   * @param lat Latitude of the location
   * @param lon Longitude of the location
   * @returns Air quality data for the specified location
   */
  getCurrentAirQuality: async (
    lat: number = 51.5074,
    lon: number = -0.1278
  ): Promise<AirQualityData> => {
    const { data } = await api.get('/api/air-quality/current', {
      params: { lat, lon }
    });
    return data;
  },

  /**
   * Get historical air quality data for a location
   * @param lat Latitude of the location
   * @param lon Longitude of the location
   * @returns Historical air quality data for the specified location
   */
  getAirQualityHistory: async (
    lat: number = 51.5074,
    lon: number = -0.1278
  ): Promise<AirQualityData> => {
    const { data } = await api.get('/api/air-quality/history', {
      params: { lat, lon }
    });
    return data;
  }
};

export default airQualityService;