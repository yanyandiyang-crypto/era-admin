/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "./api";
import type {
  Personnel,
  PersonnelFilters,
  PaginatedPersonnel,
  PersonnelStats,
  UpdateLocationRequest,
  BroadcastAlertRequest,
  IncidentAlert,
  AlertResponse,
  CreatePersonnelRequest,
  UpdatePersonnelRequest,
} from "@/types/personnel.types";
import type { ApiResponse } from "@/types/api.types";

export const personnelService = {
  // Get all personnel with filters
  getPersonnel: async (filters?: PersonnelFilters): Promise<ApiResponse<PaginatedPersonnel>> => {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.search && filters.search.trim()) {
        params.append("search", filters.search.trim());
      }
      if (filters.role && filters.role.length > 0) {
        params.append("role", filters.role.join(","));
      }
      if (filters.status && filters.status.length > 0) {
        params.append("status", filters.status.join(","));
      }
      if (filters.dutyStatus && filters.dutyStatus.length > 0) {
        params.append("dutyStatus", filters.dutyStatus.join(","));
      }
      if (filters.isAvailable !== undefined) {
        params.append("isAvailable", filters.isAvailable.toString());
      }
      if (filters.barangayPostId) {
        params.append("barangayPostId", filters.barangayPostId);
      }
      if (filters.sortBy) params.append("sortBy", filters.sortBy);
      if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());
    }

    const response = await api.get<ApiResponse<PaginatedPersonnel>>(
      `/personnel?${params.toString()}`
    );
    return response.data;
  },

  // Get single personnel by ID
  getPersonnelById: async (id: string): Promise<ApiResponse<Personnel>> => {
    const response = await api.get<ApiResponse<Personnel>>(`/personnel/${id}`);
    return response.data;
  },

  // Create new personnel
  createPersonnel: async (data: CreatePersonnelRequest): Promise<ApiResponse<Personnel>> => {
    const response = await api.post<ApiResponse<Personnel>>("/personnel", data);
    return response.data;
  },

  // Update personnel
  updatePersonnel: async (
    id: string,
    data: UpdatePersonnelRequest
  ): Promise<ApiResponse<Personnel>> => {
    const response = await api.put<ApiResponse<Personnel>>(`/personnel/${id}`, data);
    return response.data;
  },

  // Delete personnel
  deletePersonnel: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/personnel/${id}`);
    return response.data;
  },

  // Update personnel location
  updateLocation: async (
    id: string,
    data: UpdateLocationRequest
  ): Promise<ApiResponse<Personnel>> => {
    const response = await api.post<ApiResponse<Personnel>>(
      `/personnel/${id}/location`,
      data
    );
    return response.data;
  },

  // Get personnel statistics
  getStats: async (): Promise<ApiResponse<PersonnelStats>> => {
    const response = await api.get<ApiResponse<PersonnelStats>>("/personnel/stats");
    return response.data;
  },

  // Get available personnel (for quick access)
  getAvailablePersonnel: async (): Promise<ApiResponse<Personnel[]>> => {
    const response = await api.get<ApiResponse<Personnel[]>>("/personnel/available");
    return response.data;
  },

  // === ALERT BROADCAST SYSTEM ===

  // Broadcast incident alert to personnel
  broadcastIncidentAlert: async (
    data: BroadcastAlertRequest
  ): Promise<ApiResponse<IncidentAlert>> => {
    const response = await api.post<ApiResponse<IncidentAlert>>(
      "/personnel/alerts/broadcast",
      data
    );
    return response.data;
  },

  // Get alert by ID
  getAlert: async (alertId: string): Promise<ApiResponse<IncidentAlert>> => {
    const response = await api.get<ApiResponse<IncidentAlert>>(
      `/personnel/alerts/${alertId}`
    );
    return response.data;
  },

  // Get all alerts for an incident
  getIncidentAlerts: async (incidentId: string): Promise<ApiResponse<IncidentAlert[]>> => {
    const response = await api.get<ApiResponse<IncidentAlert[]>>(
      `/personnel/alerts/incident/${incidentId}`
    );
    return response.data;
  },

  // Get personnel responses to an alert
  getAlertResponses: async (alertId: string): Promise<ApiResponse<AlertResponse[]>> => {
    const response = await api.get<ApiResponse<AlertResponse[]>>(
      `/personnel/alerts/${alertId}/responses`
    );
    return response.data;
  },

  // Cancel an alert
  cancelAlert: async (alertId: string): Promise<ApiResponse<IncidentAlert>> => {
    const response = await api.post<ApiResponse<IncidentAlert>>(
      `/personnel/alerts/${alertId}/cancel`
    );
    return response.data;
  },

  // Get nearby personnel (within radius)
  getNearbyPersonnel: async (
    latitude: number,
    longitude: number,
    radiusMeters: number = 5000,
    includeOffDuty: boolean = true // Include OFF_DUTY personnel for emergency alerts
  ): Promise<ApiResponse<Personnel[]>> => {
    const response = await api.get<ApiResponse<Personnel[]>>(
      `/personnel/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radiusMeters}&includeOffDuty=${includeOffDuty}`
    );
    return response.data;
  },

  // Update personnel duty status
  updateDutyStatus: async (
    id: string,
    dutyStatus: string
  ): Promise<ApiResponse<Personnel>> => {
    const response = await api.patch<ApiResponse<Personnel>>(
      `/personnel/${id}/duty-status`,
      { dutyStatus }
    );
    return response.data;
  },

  // Get personnel assignment history
  getAssignmentHistory: async (id: string): Promise<ApiResponse<any[]>> => {
    const response = await api.get<ApiResponse<any[]>>(
      `/personnel/${id}/assignment-history`
    );
    return response.data;
  },

  // Reset personnel password (admin only)
  resetPassword: async (
    id: string,
    newPassword: string
  ): Promise<ApiResponse<{message: string}>> => {
    const response = await api.post<ApiResponse<{message: string}>>(
      `/personnel/${id}/reset-password`,
      { newPassword }
    );
    return response.data;
  },

  // Bulk update personnel status
  bulkUpdateStatus: async (
    personnelIds: string[],
    status: string
  ): Promise<ApiResponse<{updated: number}>> => {
    const response = await api.post<ApiResponse<{updated: number}>>(
      "/personnel/bulk/status",
      { personnelIds, status }
    );
    return response.data;
  },

  // Upload personnel photo
  uploadPhoto: async (
    id: string,
    formData: FormData
  ): Promise<ApiResponse<{url: string}>> => {
    const response = await api.post<ApiResponse<{url: string}>>(
      `/personnel/${id}/photo`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Get personnel location history
  getLocationHistory: async (
    id: string,
    limit?: number
  ): Promise<ApiResponse<any[]>> => {
    const params = limit ? `?limit=${limit}` : '';
    const response = await api.get<ApiResponse<any[]>>(
      `/personnel/${id}/location-history${params}`
    );
    return response.data;
  },
};
