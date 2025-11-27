import api from "./api";
import type { ApiResponse } from "@/types/api.types";
import type { IncidentFilters } from "@/types/incident.types";

export interface GenerateReportRequest {
  type: 'INCIDENT_SUMMARY' | 'PERSONNEL_REPORT' | 'BARANGAY_REPORT' | 'STATISTICS_REPORT' | 'ACTIVITY_REPORT';
  title?: string;
  fromDate?: string;
  toDate?: string;
  incidentId?: string;
  personnelId?: string;
  barangayId?: string;
  includePhotos?: boolean;
  includeTimeline?: boolean;
  includeStatistics?: boolean;
}

export interface EmailReportRequest {
  email: string;
  reportType: string;
  filters: IncidentFilters;
  fromDate: string;
  toDate: string;
}

export const reportsService = {
  // Generate PDF report
  generatePDFReport: async (request: GenerateReportRequest): Promise<Blob> => {
    const response = await api.post('/reports/generate', request, {
      responseType: 'blob',
      headers: {
        'Accept': 'application/pdf'
      }
    });
    return response.data;
  },

  // Generate incident summary report
  generateIncidentSummary: async (fromDate?: string, toDate?: string, includeStatistics: boolean = true): Promise<Blob> => {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    if (includeStatistics) params.append('includeStatistics', 'true');

    const response = await api.get(`/reports/incidents/summary?${params.toString()}`, {
      responseType: 'blob',
      headers: {
        'Accept': 'application/pdf'
      }
    });
    return response.data;
  },

  // Generate personnel report
  generatePersonnelReport: async (): Promise<Blob> => {
    const response = await api.get('/reports/personnel', {
      responseType: 'blob',
      headers: {
        'Accept': 'application/pdf'
      }
    });
    return response.data;
  },

  // Generate barangay report
  generateBarangayReport: async (): Promise<Blob> => {
    const response = await api.get('/reports/barangays', {
      responseType: 'blob',
      headers: {
        'Accept': 'application/pdf'
      }
    });
    return response.data;
  },

  // Generate statistics report
  generateStatisticsReport: async (fromDate?: string, toDate?: string): Promise<Blob> => {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);

    const response = await api.get(`/reports/statistics?${params.toString()}`, {
      responseType: 'blob',
      headers: {
        'Accept': 'application/pdf'
      }
    });
    return response.data;
  },

  // Generate activity report
  generateActivityReport: async (fromDate?: string, toDate?: string): Promise<Blob> => {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);

    const response = await api.get(`/reports/activity?${params.toString()}`, {
      responseType: 'blob',
      headers: {
        'Accept': 'application/pdf'
      }
    });
    return response.data;
  },

  // Export incidents to Excel using the new Excel endpoint
  exportIncidentsToExcel: async (fromDate?: string, toDate?: string, includeStatistics: boolean = true, filters?: IncidentFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    if (includeStatistics) params.append('includeStatistics', 'true');

    // Include all filters like the CSV export does
    if (filters) {
      if (filters.status && filters.status.length > 0) {
        params.append("status", filters.status.join(","));
      }
      if (filters.priority && filters.priority.length > 0) {
        params.append("priority", filters.priority.join(","));
      }
      if (filters.type && filters.type.length > 0) {
        params.append("type", filters.type.join(","));
      }
      if (filters.barangayId && filters.barangayId.length > 0) {
        params.append("barangayId", filters.barangayId.join(","));
      }
      if (filters.search && filters.search.trim()) {
        params.append("search", filters.search.trim());
      }
      if (filters.hasPhotos) params.append("hasPhotos", "true");
      if (filters.hasAssignedPersonnel) params.append("hasAssignedPersonnel", "true");
      if (filters.sortBy) params.append("sortBy", filters.sortBy);
      if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
    }

    const response = await api.get(`/reports/excel/incidents/summary?${params.toString()}`, {
      responseType: 'blob',
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });
    return response.data;
  },

  // Export incidents to CSV (fallback using incident service)
  exportIncidentsToCSV: async (filters?: IncidentFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.status && filters.status.length > 0) {
        params.append("status", filters.status.join(","));
      }
      if (filters.priority && filters.priority.length > 0) {
        params.append("priority", filters.priority.join(","));
      }
      if (filters.type && filters.type.length > 0) {
        params.append("type", filters.type.join(","));
      }
      if (filters.barangayId && filters.barangayId.length > 0) {
        params.append("barangayId", filters.barangayId.join(","));
      }
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.search && filters.search.trim()) {
        params.append("search", filters.search.trim());
      }
    }

    const response = await api.get(`/incidents/export/csv?${params.toString()}`, {
      responseType: "blob",
    });
    return response.data;
  },

  // Email report
  emailReport: async (request: EmailReportRequest): Promise<ApiResponse<{ message: string }>> => {
    const emailData = {
      email: request.email,
      reportType: request.reportType,
      fromDate: request.fromDate,
      toDate: request.toDate
    };
    
    const response = await api.post<ApiResponse<{ message: string }>>('/reports/email', emailData);
    return response.data;
  },

  // Download file helper
  downloadFile: (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Generate filename helper
  generateFilename: (type: string, format: 'pdf' | 'csv' | 'xlsx', fromDate?: string, toDate?: string): string => {
    const dateStr = fromDate && toDate ? `${fromDate}-to-${toDate}` : new Date().toISOString().split('T')[0];
    return `${type.toLowerCase().replace(/_/g, '-')}-${dateStr}.${format}`;
  }
};
