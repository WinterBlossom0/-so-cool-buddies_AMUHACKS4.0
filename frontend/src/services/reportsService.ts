import api from './api';

export interface ReportCategory {
  id: string;
  name: string;
  icon: string;
}

export interface ReportStatus {
  id: string;
  name: string;
  color: string;
}

export interface Report {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  category_id: string;
  status_id: string;
  location: {
    lat: number;
    lon: number;
    address: string;
  };
  user_id?: string;
  images?: string[];
  votes: number;
}

export interface ReportStats {
  total: number;
  resolved: number;
  pending: number;
  by_category: Record<string, number>;
}

export interface ReportsData {
  reports: Report[];
  categories: ReportCategory[];
  statuses: ReportStatus[];
  stats: ReportStats;
}

/**
 * Get all citizen reports
 */
export const getReports = async (): Promise<ReportsData> => {
  const response = await api.get('/api/reports');
  return response.data;
};

/**
 * Get a specific report by ID
 */
export const getReport = async (reportId: string): Promise<Report> => {
  const response = await api.get(`/api/reports/${reportId}`);
  return response.data;
};

/**
 * Create a new report
 */
export const createReport = async (reportData: Omit<Report, 'id' | 'created_at' | 'updated_at' | 'status_id' | 'votes'>): Promise<Report> => {
  const response = await api.post('/api/reports', reportData);
  return response.data;
};

/**
 * Update an existing report
 */
export const updateReport = async (reportId: string, reportData: Partial<Report>): Promise<Report> => {
  const response = await api.patch(`/api/reports/${reportId}`, reportData);
  return response.data;
};

/**
 * Delete a report
 */
export const deleteReport = async (reportId: string): Promise<void> => {
  await api.delete(`/api/reports/${reportId}`);
};

/**
 * Vote on a report
 */
export const voteReport = async (reportId: string): Promise<Report> => {
  const response = await api.post(`/api/reports/${reportId}/vote`);
  return response.data;
};

/**
 * Generate a PDF report of all citizen reports
 */
export const generatePdfReport = async (filters?: Record<string, any>): Promise<string> => {
  const response = await api.post('/api/reports/generate-pdf', filters, {
    responseType: 'blob'
  });
  
  // Create a URL for the blob
  const url = window.URL.createObjectURL(response.data);
  return url;
};

/**
 * Get reports statistics
 */
export const getReportsStats = async (): Promise<ReportStats> => {
  const response = await api.get('/api/reports/stats');
  return response.data;
};