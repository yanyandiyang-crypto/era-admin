import api from "./api";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { AuditLog, AuditLogFilters } from "@/types/audit.types";

const buildQueryString = (filters?: AuditLogFilters) => {
  if (!filters) return "";

  const params = new URLSearchParams();

  if (filters.page) params.append("page", String(filters.page));
  if (filters.limit) params.append("limit", String(filters.limit));
  if (filters.userId) params.append("userId", filters.userId);
  if (filters.action) params.append("action", filters.action);
  if (filters.resourceType) params.append("resourceType", filters.resourceType);
  if (filters.resourceId) params.append("resourceId", filters.resourceId);
  if (filters.fromDate) params.append("fromDate", filters.fromDate);
  if (filters.toDate) params.append("toDate", filters.toDate);

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};

export const auditService = {
  getLogs: async (
    filters?: AuditLogFilters
  ): Promise<ApiResponse<PaginatedResponse<AuditLog>>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<AuditLog>>>(
      `/audit${buildQueryString(filters)}`
    );
    return response.data;
  },

  getLogById: async (id: string): Promise<ApiResponse<AuditLog>> => {
    const response = await api.get<ApiResponse<AuditLog>>(`/audit/${id}`);
    return response.data;
  },
};




