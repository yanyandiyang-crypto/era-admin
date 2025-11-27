export interface DashboardOverview {
  incidents: {
    total: number;
    active: number;
    resolved: number;
    today: number;
  };
  personnel: {
    total: number;
    active: number;
    onDuty: number;
    available: number;
  };
  barangays: {
    total: number;
    active: number;
  };
  responseTime: {
    average: number;
    fastest: number;
    slowest: number;
  };
}

export interface IncidentTrends {
  daily: Array<{
    date: string;
    count: number;
    resolved: number;
  }>;
  byType: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  byPriority: Array<{
    priority: string;
    count: number;
    percentage: number;
  }>;
}

export interface HeatMapData {
  coordinates: Array<{
    latitude: number;
    longitude: number;
    weight: number;
  }>;
}

export interface TopBarangay {
  id: string;
  name: string;
  code: string;
  incidentCount: number;
}

export interface TopPersonnel {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  assignmentCount: number;
}

export interface RecentActivity {
  id: string;
  message: string;
  updateType: string;
  createdAt: string;
  incident: {
    id: string;
    incidentNumber: string;
    title: string;
    type: string;
    priority: string;
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface PerformanceMetrics {
  period: string;
  totalIncidents: number;
  resolvedIncidents: number;
  resolutionRate: number;
  averageResolutionMinutes: number;
  totalAssignments: number;
  averagePersonnelPerIncident: number;
}

export interface TimeRangeQuery {
  from?: string;
  to?: string;
  period?: 'day' | 'week' | 'month' | 'year';
}
