import api from "./api";
import type {
  DashboardOverview,
  IncidentTrends,
  HeatMapData,
  TopBarangay,
  TopPersonnel,
  RecentActivity,
  PerformanceMetrics,
  TimeRangeQuery,
} from "@/types/dashboard.types";
import type { ApiResponse } from "@/types/api.types";

// Map frontend time ranges to backend period values
type FrontendTimeRange = '24h' | '7d' | '30d' | '90d' | '1yr';
type BackendPeriod = 'day' | 'week' | 'month' | 'year';

const mapTimeRangeToPeriod = (timeRange: FrontendTimeRange): BackendPeriod => {
  const mapping: Record<FrontendTimeRange, BackendPeriod> = {
    '24h': 'day',
    '7d': 'week',
    '30d': 'month',
    '90d': 'month', // 90 days maps to month
    '1yr': 'year',
  };
  return mapping[timeRange];
};

export const dashboardService = {
  /**
   * Get dashboard overview statistics
   */
  getOverview: async (): Promise<ApiResponse<DashboardOverview>> => {
    const response = await api.get<ApiResponse<DashboardOverview>>("/dashboard/overview");
    return response.data;
  },

  /**
   * Get incident trends with optional time range
   */
  getIncidentTrends: async (query?: { period?: FrontendTimeRange }): Promise<ApiResponse<IncidentTrends>> => {
    // Map frontend time range to backend period
    const backendQuery: TimeRangeQuery = query?.period 
      ? { period: mapTimeRangeToPeriod(query.period) }
      : {};
    
    const response = await api.get<ApiResponse<IncidentTrends>>("/dashboard/trends", {
      params: backendQuery,
    });
    return response.data;
  },

  /**
   * Get heat map data for incident locations
   */
  getHeatMap: async (): Promise<ApiResponse<HeatMapData>> => {
    const response = await api.get<ApiResponse<HeatMapData>>("/dashboard/heatmap");
    return response.data;
  },

  /**
   * Get top performing barangays by incident count
   */
  getTopBarangays: async (): Promise<ApiResponse<TopBarangay[]>> => {
    const response = await api.get<ApiResponse<TopBarangay[]>>("/dashboard/top-barangays");
    return response.data;
  },

  /**
   * Get top performing personnel by assignment count
   */
  getTopPersonnel: async (): Promise<ApiResponse<TopPersonnel[]>> => {
    const response = await api.get<ApiResponse<TopPersonnel[]>>("/dashboard/top-personnel");
    return response.data;
  },

  /**
   * Get recent activity feed
   */
  getRecentActivity: async (): Promise<ApiResponse<RecentActivity[]>> => {
    const response = await api.get<ApiResponse<RecentActivity[]>>("/dashboard/activity");
    return response.data;
  },

  /**
   * Get performance metrics
   */
  getPerformanceMetrics: async (): Promise<ApiResponse<PerformanceMetrics>> => {
    const response = await api.get<ApiResponse<PerformanceMetrics>>("/dashboard/metrics");
    return response.data;
  },
};
