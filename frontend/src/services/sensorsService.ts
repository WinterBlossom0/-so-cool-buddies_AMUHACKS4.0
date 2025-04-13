import api from './api';

interface Sensor {
  id: string;
  name: string;
  type: string;
  location: {
    lat: number;
    lon: number;
  };
  readings: Record<string, number | string>;
  lastUpdated: string;
}

interface SensorHistory {
  timestamp: string;
  [key: string]: any;
}

export const getSensors = async (lat?: string, lon?: string) => {
  const params = new URLSearchParams();
  if (lat) params.append('lat', lat);
  if (lon) params.append('lon', lon);
  
  const response = await api.get(`/api/sensors`, { params });
  return response.data;
};

export const getSensorById = async (id: string) => {
  const response = await api.get(`/api/sensors/${id}`);
  return response.data;
};

export const getSensorHistory = async (id: string, days?: number) => {
  const params = new URLSearchParams();
  if (days) params.append('days', days.toString());
  
  const response = await api.get(`/api/sensors/${id}/history`, { params });
  return response.data;
};

export const getSensorsByType = async (type: string) => {
  const response = await api.get(`/api/sensors/type/${type}`);
  return response.data;
};

const sensorsService = {
  getSensors,
  getSensorById,
  getSensorHistory,
  getSensorsByType
};

export default sensorsService;