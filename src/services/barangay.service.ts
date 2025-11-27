import api from "./api";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { 
  Barangay, 
  CreateBarangayRequest, 
  UpdateBarangayRequest 
} from "@/types/barangay.types";

// Helper function to normalize barangay response
const normalizeBarangay = (barangay: Barangay): Barangay => {
  return {
    ...barangay,
    id: barangay.id || barangay.barangayId || barangay._id || '',
    emergencyContacts: barangay.emergencyContacts || [],
  };
};

export interface BarangayFilters {
  search?: string;
  status?: ("ACTIVE" | "INACTIVE")[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export const barangayService = {
  /**
   * Get all barangays with optional filters and pagination
   */
  getBarangays: async (filters?: BarangayFilters): Promise<ApiResponse<PaginatedResponse<Barangay>>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Barangay>>>("/barangays", {
      params: filters,
    });
    // Normalize the barangay data
    if (response.data.data && response.data.data.data) {
      response.data.data.data = response.data.data.data.map(normalizeBarangay);
    }
    return response.data;
  },

  /**
   * Get a single barangay by ID
   */
  getBarangayById: async (id: string): Promise<ApiResponse<Barangay>> => {
    const response = await api.get<ApiResponse<Barangay>>(`/barangays/${id}`);
    // Normalize the barangay data
    if (response.data.data) {
      response.data.data = normalizeBarangay(response.data.data);
    }
    return response.data;
  },

  /**
   * Create a new barangay
   */
  createBarangay: async (data: CreateBarangayRequest): Promise<ApiResponse<Barangay>> => {
    const response = await api.post<ApiResponse<Barangay>>("/barangays", data);
    // Normalize the barangay data
    if (response.data.data) {
      response.data.data = normalizeBarangay(response.data.data);
    }
    return response.data;
  },

  /**
   * Update an existing barangay
   */
  updateBarangay: async (id: string, data: UpdateBarangayRequest): Promise<ApiResponse<Barangay>> => {
    const response = await api.put<ApiResponse<Barangay>>(`/barangays/${id}`, data);
    // Normalize the barangay data
    if (response.data.data) {
      response.data.data = normalizeBarangay(response.data.data);
    }
    return response.data;
  },

  /**
   * Delete a barangay
   */
  deleteBarangay: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/barangays/${id}`);
    return response.data;
  },

  /**
   * Get barangay statistics
   */
  getStats: async (): Promise<ApiResponse<{
    total: number;
    active: number;
    inactive: number;
    totalEmergencyContacts: number;
  }>> => {
    const response = await api.get<ApiResponse<{
      total: number;
      active: number;
      inactive: number;
      totalEmergencyContacts: number;
    }>>("/barangays/stats");
    return response.data;
  },
};
