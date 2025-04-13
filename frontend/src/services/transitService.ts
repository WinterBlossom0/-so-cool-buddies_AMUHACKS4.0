import api from './api';

export interface TransitRoute {
  id: string;
  name: string;
  short_name: string;
  type: string;
  type_id: number;
  color: string;
  text_color: string;
  description: string;
  url: string;
  stops: TransitStop[];
}

export interface TransitStop {
  id: string;
  name: string;
  location: {
    lat: number;
    lon: number;
  };
  next_arrivals: TransitArrival[];
  accessible: boolean;
  has_shelter: boolean;
}

export interface TransitArrival {
  scheduled: string;
  estimated: string;
  delay: number;
}

export interface TransitData {
  count: number;
  routes: TransitRoute[];
  generated: string;
}

/**
 * Fetch transit routes for a specified location
 */
export const getTransitRoutes = async (
  lat: number = 51.5074,
  lon: number = -0.1278,
  refresh: boolean = false
): Promise<TransitData> => {
  const response = await api.get('/api/transit/routes', {
    params: { lat, lon, refresh }
  });
  return response.data;
};

/**
 * Get detailed information about a specific transit route
 */
export const getRouteDetails = async (routeId: string): Promise<TransitRoute> => {
  const response = await api.get(`/api/transit/routes/${routeId}`);
  return response.data;
};