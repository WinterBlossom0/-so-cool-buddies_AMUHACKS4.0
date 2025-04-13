import api from './api';

export interface AlertCategory {
  id: string;
  name: string;
  icon: string;
}

export interface SeverityLevel {
  id: string;
  name: string;
  color: string;
}

export interface CityAlert {
  id: string;
  title: string;
  description: string;
  created_at: string;
  expires_at: string;
  category_id: string;
  severity_id: string;
  location: {
    lat: number;
    lon: number;
    radius: number;
    address: string;
  };
  is_active: boolean;
}

export interface AlertsData {
  alerts: CityAlert[];
  categories: AlertCategory[];
  severity_levels: SeverityLevel[];
}

export interface LocationData {
  latitude: number;
  longitude: number;
  radius: number;
}

/**
 * Get all city alerts
 */
export const getAlerts = async (
  categoryIds?: string[],
  severityIds?: string[],
  onlyActive?: boolean
): Promise<AlertsData> => {
  const params = new URLSearchParams();
  
  if (categoryIds && categoryIds.length > 0) {
    categoryIds.forEach(id => params.append('category_id', id));
  }
  
  if (severityIds && severityIds.length > 0) {
    severityIds.forEach(id => params.append('severity_id', id));
  }
  
  if (onlyActive !== undefined) {
    params.append('active', onlyActive.toString());
  }
  
  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await api.get(`/api/alerts${query}`);
  return response.data;
};

/**
 * Get a specific alert by ID
 */
export const getAlert = async (alertId: string): Promise<CityAlert> => {
  const response = await api.get(`/api/alerts/${alertId}`);
  return response.data;
};

/**
 * Get alerts for a specific location within a radius
 */
export const getAlertsNearby = async (
  lat: number,
  lon: number,
  radius: number = 5,
  categoryIds?: string[],
  severityIds?: string[]
): Promise<CityAlert[]> => {
  const params = new URLSearchParams();
  params.append('lat', lat.toString());
  params.append('lon', lon.toString());
  params.append('radius', radius.toString());
  
  if (categoryIds && categoryIds.length > 0) {
    categoryIds.forEach(id => params.append('category_id', id));
  }
  
  if (severityIds && severityIds.length > 0) {
    severityIds.forEach(id => params.append('severity_id', id));
  }
  
  const response = await api.get(`/api/alerts/nearby?${params.toString()}`);
  return response.data.alerts;
};

/**
 * Subscribe to alerts for specific categories and severity levels
 */
export const subscribeToAlerts = async (
  userId: string,
  categoryIds: string[],
  severityIds: string[],
  locationEnabled: boolean = false,
  lat?: number,
  lon?: number,
  radius?: number
): Promise<void> => {
  const data: any = {
    category_ids: categoryIds,
    severity_ids: severityIds,
    location_enabled: locationEnabled
  };
  
  if (locationEnabled && lat !== undefined && lon !== undefined) {
    data.location = {
      lat,
      lon,
      radius: radius || 5
    };
  }
  
  await api.post(`/api/alerts/subscribe/${userId}`, data);
};

/**
 * Unsubscribe from alerts
 */
export const unsubscribeFromAlerts = async (
  userId: string,
  categoryIds?: string[],
  severityIds?: string[]
): Promise<void> => {
  const data: any = {};
  
  if (categoryIds) data.category_ids = categoryIds;
  if (severityIds) data.severity_ids = severityIds;
  
  await api.post(`/api/alerts/unsubscribe/${userId}`, data);
}; 