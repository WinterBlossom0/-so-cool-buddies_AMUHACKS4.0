import api from './api';

interface WeatherLocation {
  name: string;
  lat: number;
  lon: number;
}

interface CurrentWeather {
  temp_c: number;
  feels_like_c: number;
  humidity: number;
  pressure: number;
  wind_kph: number;
  condition: string;
  description?: string;
  icon?: string;
  last_updated: string;
}

interface ForecastDay {
  date: string;
  max_temp_c: number;
  min_temp_c: number;
  condition: string;
  chance_of_rain: number;
}

interface WeatherResponse {
  location: WeatherLocation;
  current: CurrentWeather;
}

interface ForecastResponse {
  location: WeatherLocation;
  forecast: ForecastDay[];
}

export const weatherService = {
  /**
   * Get current weather data
   */
  getCurrentWeather: async (
    lat: number = 51.5074, 
    lon: number = -0.1278, 
    city: string = 'London'
  ): Promise<WeatherResponse> => {
    const { data } = await api.get('/api/weather/current', { 
      params: { lat, lon, city } 
    });
    return data;
  },

  /**
   * Get 5-day weather forecast
   */
  getWeatherForecast: async (
    lat: number = 51.5074, 
    lon: number = -0.1278, 
    city: string = 'London'
  ): Promise<ForecastResponse> => {
    const { data } = await api.get('/api/weather/forecast', { 
      params: { lat, lon, city } 
    });
    return data;
  }
};

export default weatherService;