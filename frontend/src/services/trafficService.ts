import api, { withLocation } from './api';

interface Coordinates {
  lat: number;
  lon: number;
}

interface RoadCoordinates {
  start: Coordinates;
  end: Coordinates;
}

interface TrafficHistory {
  timestamp: string;
  congestion_score: number;
  congestion_level: {
    level: string;
    color: string;
  };
}

interface TrafficPrediction {
  timestamp: string;
  congestion_score: number;
  congestion_level: {
    level: string;
    color: string;
  };
}

interface Road {
  id: string;
  name: string;
  capacity: number;
  congestion_score: number;
  congestion_level: {
    level: string;
    color: string;
  };
  average_speed: number;
  travel_time_mins: number;
  coordinates: RoadCoordinates;
  history: TrafficHistory[];
  prediction: TrafficPrediction[];
}

interface Junction {
  id: string;
  name: string;
  type: string;
  coordinates: Coordinates;
  connected_roads: string[];
  congestion_score: number;
  congestion_level: {
    level: string;
    color: string;
  };
  average_wait_time_sec: number;
}

interface Incident {
  id: string;
  type: string;
  severity: string;
  road_id?: string;
  road_name: string;
  description: string;
  coordinates: Coordinates;
  start_time?: string;
  estimated_end_time?: string;
  delay_mins: number;
  status: string;
}

interface TrafficData {
  last_updated: string;
  roads: Road[];
  junctions: Junction[];
  incidents: Incident[];
  stats?: {
    average_congestion: number;
    high_congestion_areas: number;
    total_incidents: number;
    day_phase: string;
  };
  source?: string;
}

export const trafficService = {
  /**
   * Get current traffic data - properly integrates with TomTom API via backend
   */
  getTrafficData: async (
    lat: number | null = null, 
    lon: number | null = null,
    refresh: boolean = false
  ): Promise<TrafficData> => {
    try {
      // Use provided coordinates or null (backend will use defaults)
      const params: any = refresh ? { refresh: true } : {};
      
      // Use the withLocation helper to add location parameters
      const fullParams = withLocation(params);
      
      console.log(`Getting traffic data for location: ${lat}, ${lon} (refresh: ${refresh})`);
      const response = await api.get('/api/traffic/status', { params: fullParams });
      
      // Log if using TomTom API or fallback data
      if (response.data.source) {
        console.log(`Traffic data source: ${response.data.source}`);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching traffic data:', error);
      // Return empty data structure instead of throwing
      return {
        last_updated: new Date().toISOString(),
        roads: [],
        junctions: [],
        incidents: [],
        stats: {
          average_congestion: 0,
          high_congestion_areas: 0,
          total_incidents: 0,
          day_phase: 'unknown'
        },
        source: 'Error fetching data'
      };
    }
  },

  /**
   * Get traffic predictions for specific time
   */
  getTrafficPredictions: async (
    hours_ahead: number = 1,
    lat: number | null = null,
    lon: number | null = null
  ): Promise<any> => {
    try {
      // Use the withLocation helper and add hours_ahead parameter
      const params = withLocation({ hours_ahead });
      
      console.log(`Getting traffic prediction for ${hours_ahead} hours ahead at location: ${lat}, ${lon}`);
      const response = await api.get('/api/traffic/prediction', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching traffic predictions:', error);
      // Return empty predictions instead of throwing
      return {
        timestamp: new Date().toISOString(),
        hours_ahead: hours_ahead,
        predictions: []
      };
    }
  },

  /**
   * Get active traffic incidents - properly integrates with TomTom API via backend
   */
  getTrafficIncidents: async (
    lat: number | null = null,
    lon: number | null = null
  ): Promise<{incidents: Incident[]}> => {
    try {
      // Use the withLocation helper to add location parameters
      const params = withLocation({});
      
      console.log(`Getting traffic incidents for location: ${lat}, ${lon}`);
      const response = await api.get('/api/traffic/incidents', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching traffic incidents:', error);
      return { incidents: [] };
    }
  },

  /**
   * Get details for a specific road
   */
  getRoadDetails: async (roadId: string): Promise<Road | null> => {
    try {
      console.log(`Getting details for road: ${roadId}`);
      const response = await api.get(`/api/traffic/roads/${roadId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching details for road ${roadId}:`, error);
      return null;
    }
  },

  /**
   * Report new traffic incident
   */
  reportIncident: async (
    incidentData: {
      type: string;
      description: string;
      lat: number;
      lon: number;
      severity?: string;
    }
  ): Promise<Incident> => {
    try {
      console.log('Reporting traffic incident:', incidentData);
      const response = await api.post('/api/traffic/incidents/report', incidentData);
      return response.data;
    } catch (error) {
      console.error('Error reporting traffic incident:', error);
      throw new Error('Failed to report traffic incident');
    }
  }
};

export default trafficService;