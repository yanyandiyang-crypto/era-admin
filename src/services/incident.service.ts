import api from "./api";
import type {
  Incident,
  CreateIncidentRequest,
  UpdateIncidentRequest,
  IncidentFilters,
  PaginatedIncidents,
  IncidentStats,
  IncidentStatistics,
  IncidentResolution,
} from "@/types/incident.types";
import type { ApiResponse } from "@/types/api.types";

export const incidentService = {
  // Get all incidents with filters and pagination
  getIncidents: async (filters?: IncidentFilters): Promise<ApiResponse<PaginatedIncidents>> => {
    const params = new URLSearchParams();
    
    if (filters) {
      // Only add array parameters if they have items
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
      
      // Only add string parameters if they're not empty
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.search && filters.search.trim()) {
        params.append("search", filters.search.trim());
      }
      if (filters.sortBy) params.append("sortBy", filters.sortBy);
      if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());
      if (filters.hasPhotos !== undefined) {
        params.append("hasPhotos", filters.hasPhotos.toString());
      }
      if (filters.hasAssignedPersonnel !== undefined) {
        params.append("hasAssignedPersonnel", filters.hasAssignedPersonnel.toString());
      }
      if (filters.reporterPhone) params.append("reporterPhone", filters.reporterPhone);
    }

    const response = await api.get<ApiResponse<PaginatedIncidents>>(
      `/incidents?${params.toString()}`
    );
    return response.data;
  },

  // Get single incident by ID
  getIncident: async (id: string): Promise<ApiResponse<Incident>> => {
    const response = await api.get<ApiResponse<Incident>>(`/incidents/${id}`);
    return response.data;
  },

  // Create new incident
  createIncident: async (data: CreateIncidentRequest): Promise<ApiResponse<Incident>> => {
    const response = await api.post<ApiResponse<Incident>>("/incidents", data);
    return response.data;
  },

  // Update incident
  updateIncident: async (
    id: string,
    data: UpdateIncidentRequest
  ): Promise<ApiResponse<Incident>> => {
    const response = await api.put<ApiResponse<Incident>>(`/incidents/${id}`, data);
    return response.data;
  },

  // Delete incident
  deleteIncident: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/incidents/${id}`);
    return response.data;
  },

  // Get incident statistics
  getStats: async (filters?: IncidentFilters): Promise<ApiResponse<IncidentStats>> => {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.barangayId) params.append("barangayId", filters.barangayId.join(","));
    }

    const response = await api.get<ApiResponse<IncidentStats>>(
      `/incidents/stats?${params.toString()}`
    );
    return response.data;
  },

  // Assign personnel to incident
  assignPersonnel: async (
    id: string,
    personnelIds: string[]
  ): Promise<ApiResponse<Incident>> => {
    const response = await api.post<ApiResponse<Incident>>(
      `/incidents/${id}/assign`,
      { personnelIds }
    );
    return response.data;
  },

  // Add update/note to incident
  addUpdate: async (
    id: string,
    message: string,
    isInternal: boolean = false,
    photos?: string[]
  ): Promise<ApiResponse<Incident>> => {
    const response = await api.post<ApiResponse<Incident>>(
      `/incidents/${id}/updates`,
      { message, isInternal, photos }
    );
    return response.data;
  },

  // Upload photo to incident
  uploadPhoto: async (id: string, file: File, caption?: string): Promise<ApiResponse<{url: string}>> => {
    const formData = new FormData();
    formData.append("photo", file);
    if (caption) formData.append("caption", caption);

    const response = await api.post<ApiResponse<{url: string}>>(
      `/incidents/${id}/photos`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  // Export incidents to CSV
  exportToCSV: async (filters?: IncidentFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.status) params.append("status", filters.status.join(","));
      if (filters.priority) params.append("priority", filters.priority.join(","));
      if (filters.type) params.append("type", filters.type.join(","));
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
    }

    const response = await api.get(`/incidents/export/csv?${params.toString()}`, {
      responseType: "blob",
    });
    return response.data;
  },

  // Bulk operations
  bulkUpdateStatus: async (
    ids: string[],
    status: string
  ): Promise<ApiResponse<{updated: number}>> => {
    const response = await api.post<ApiResponse<{updated: number}>>(
      "/incidents/bulk/status",
      { ids, status }
    );
    return response.data;
  },

  bulkAssign: async (
    ids: string[],
    personnelIds: string[]
  ): Promise<ApiResponse<{updated: number}>> => {
    const response = await api.post<ApiResponse<{updated: number}>>(
      "/incidents/bulk/assign",
      { ids, personnelIds }
    );
    return response.data;
  },

  // Context-aware incident actions (using status endpoint)
  
  // Verify incident (PENDING_VERIFICATION -> VERIFIED)
  verifyIncident: async (
    id: string, 
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    notes?: string
  ): Promise<ApiResponse<Incident>> => {
    // Use the dedicated verify endpoint with priority and notes
    const response = await api.post<ApiResponse<Incident>>(
      `/incidents/${id}/verify`,
      { priority, notes }
    );
    return response.data;
  },

  // Mark as spam/invalid
  markAsSpam: async (id: string, reason: string): Promise<ApiResponse<Incident>> => {
    const response = await api.patch<ApiResponse<Incident>>(
      `/incidents/${id}/status`,
      { status: "SPAM", notes: reason }
    );
    return response.data;
  },

  // Invalidate incident (hide from UI)
  invalidateIncident: async (
    id: string,
    reason?: string
  ): Promise<ApiResponse<Incident>> => {
    const response = await api.patch<ApiResponse<Incident>>(
      `/incidents/${id}/status`,
      { status: "SPAM", notes: reason }
    );
    return response.data;
  },


  // Mark as resolved
  resolveIncident: async (
    id: string, 
    resolutionNotes: string
  ): Promise<ApiResponse<Incident>> => {
    const response = await api.patch<ApiResponse<Incident>>(
      `/incidents/${id}/status`,
      { status: "RESOLVED", notes: resolutionNotes }
    );
    return response.data;
  },

  // Reopen incident (RESOLVED -> REPORTED)
  reopenIncident: async (
    id: string, 
    reason: string
  ): Promise<ApiResponse<Incident>> => {
    const response = await api.patch<ApiResponse<Incident>>(
      `/incidents/${id}/status`,
      { status: "REPORTED", notes: reason }
    );
    return response.data;
  },




  // Update status directly
  updateStatus: async (
    id: string, 
    status: string,
    notes?: string,
    priority?: string
  ): Promise<ApiResponse<Incident>> => {
    const body: { status: string; notes?: string; priority?: string } = { status };
    if (notes) body.notes = notes;
    if (priority) body.priority = priority;
    
    const response = await api.patch<ApiResponse<Incident>>(
      `/incidents/${id}/status`,
      body
    );
    return response.data;
  },

  // Get bulk acknowledgments for multiple incidents
  getBulkAcknowledgments: async (incidentIds: string[]): Promise<ApiResponse<{
    id: string;
    acknowledgedCount?: number;
    acknowledgmentPercentage?: number;
    totalPersonnelNotified?: number;
  }[]>> => {
    const params = new URLSearchParams();
    params.append("incidentIds", incidentIds.join(","));
    const response = await api.get<ApiResponse<{
      id: string;
      acknowledgedCount?: number;
      acknowledgmentPercentage?: number;
      totalPersonnelNotified?: number;
    }[]>>(
      `/incidents/bulk/acknowledgments?${params.toString()}`
    );
    return response.data;
  },

  // Get incidents with acknowledgment data
  getIncidentsWithAcks: async (filters?: IncidentFilters): Promise<ApiResponse<PaginatedIncidents>> => {
    const incidentsResponse = await incidentService.getIncidents(filters);
    
    if (incidentsResponse.data && incidentsResponse.data.data.length > 0) {
      const incidentIds = incidentsResponse.data.data.map((inc: Incident) => inc.incidentId);
      
      try {
        const acksResponse = await incidentService.getBulkAcknowledgments(incidentIds);
        
        // console.log('Acknowledgments response:', acksResponse);
        
        if (acksResponse.data) {
          const ackMap = new Map(
            (acksResponse.data as {
              id: string;
              acknowledgedCount?: number;
              acknowledgmentPercentage?: number;
              totalPersonnelNotified?: number;
            }[]).map((ack) => [ack.id, ack])
          );
          
          // console.log('Acknowledgment map:', ackMap);
          
          incidentsResponse.data.data = incidentsResponse.data.data.map((incident: Incident) => {
            const ackData = ackMap.get(incident.incidentId) as {
              acknowledgedCount?: number;
              acknowledgmentPercentage?: number;
              totalPersonnelNotified?: number;
            } | undefined;
            // console.log(`Incident ${incident.incidentId} ack data:`, ackData);
            
            return {
              ...incident,
              acknowledgmentCount: ackData?.acknowledgedCount || 0,
              acknowledgmentPercentage: ackData?.acknowledgmentPercentage || 0,
              totalPersonnelNotified: ackData?.totalPersonnelNotified || 0,
            };
          });
        }
      } catch {
        // console.error("Failed to fetch acknowledgments:", error);
        // Continue without acknowledgment data
      }
    }
    
    return incidentsResponse;
  },
  
  // Get incident statistics for dashboard
  getIncidentStatistics: async (): Promise<IncidentStatistics> => {
    // Attempt to call the API endpoint first
    try {
      const response = await api.get<ApiResponse<IncidentStatistics>>('/incidents/statistics');
      return response.data.data;
    } catch {
      // If API endpoint doesn't exist, use mock data for development
      // console.warn('Statistics API not implemented yet, using mock data');
      
      // Return mock data that matches the expected structure
      return {
        totalIncidentsCount: 145,
        activeIncidentsCount: 24,
        resolvedIncidentsCount: 121,
        criticalIncidentsCount: 5,
        resolvedTodayCount: 12,
        
        totalPersonnelCount: 45,
        availablePersonnelCount: 18,
        respondingPersonnelCount: 8,
        onScenePersonnelCount: 14,
        offDutyPersonnelCount: 5,
        
        averageResponseTimeMinutes: 7.2,
        averageResolutionTimeMinutes: 42.5,
        
        pendingVerificationPercent: 15,
        verifiedPercent: 10,
        respondingPercent: 35,
        arrivedPercent: 40,
        resolvedPercent: 0,
        
        activeIncidentsPercentChange: 5,
        resolvedPercentChange: 12,
        criticalIncidentsPercentChange: -8,
        responseTimePercentChange: -12,
        
        lastUpdated: new Date().toISOString()
      };
    }
  },

  // Get incident resolution
  getResolution: async (incidentId: string): Promise<ApiResponse<IncidentResolution>> => {
    const response = await api.get(`/incidents/${incidentId}/resolution`);
    return response.data;
  },

  // Update incident resolution (Admin)
  updateResolution: async (
    incidentId: string,
    data: {
      what?: string;
      when?: string;
      where?: string;
      who?: string;
      why?: string;
      how?: string;
      outcome?: string;
      notes?: string;
      adminNotes?: string;
    }
  ): Promise<ApiResponse<IncidentResolution>> => {
    const response = await api.patch(`/incidents/${incidentId}/resolution`, data);
    return response.data;
  },

  // Confirm incident resolution (Admin)
  confirmResolution: async (
    incidentId: string,
    adminNotes?: string
  ): Promise<ApiResponse<IncidentResolution>> => {
    const response = await api.post(`/incidents/${incidentId}/confirm-resolution`, {
      adminNotes,
    });
    return response.data;
  },
};
