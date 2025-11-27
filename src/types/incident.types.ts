export type IncidentStatus =
  | "PENDING_VERIFICATION"
  | "VERIFIED"         // Admin verified, personnel notified
  | "REPORTED"
  | "ACKNOWLEDGED"
  | "DISPATCHED"
  | "IN_PROGRESS"      // Legacy - use RESPONDING instead
  | "RESPONDING"       // Personnel en route
  | "ARRIVED"          // Personnel on scene
  | "PENDING_RESOLVE"  // Personnel submitted resolution, awaiting admin confirmation
  | "RESOLVED"         // Incident resolved
  | "CLOSED"
  | "CANCELLED"
  | "SPAM";            // Invalid report, hidden from UI

export type IncidentPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type IncidentType =
  | "FIRE"
  | "MEDICAL"
  | "ACCIDENT"
  | "CRIME"
  | "FLOOD"
  | "NATURAL_DISASTER"
  | "OTHER";

export interface Incident {
  validatedAt: string | null;
  incidentId: string;
  trackingNumber: string;
  title: string;
  description: string;
  type: IncidentType;
  priority: IncidentPriority;
  status: IncidentStatus;
  latitude: number;
  longitude: number;
  address: string;
  barangayId?: string;
  reporterPhone: string;
  reporterName?: string;
  reportedAt: string;
  acknowledgedAt?: string;
  dispatchedAt?: string;
  arrivedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  cancelledAt?: string;
  responseTime?: number; // in minutes
  resolutionTime?: number; // in minutes
  notes?: string;
  cancellationReason?: string;
  resolutionSummary?: string;
  // Public report fields
  isPublicReport?: boolean;
  publicSessionId?: string;
  verifiedAt?: string;
  verifiedById?: string;
  createdAt: string;
  updatedAt: string;
  barangay?: {
    barangayId: string;
    name: string;
  };
  assignedPersonnel?: Array<{
    personnelId: string;
    name: string;
    role: string;
    assignedAt: string;
    status?: string;
  }>;
  photos?: Array<{
    photoId: string;
    url: string;
    caption?: string;
    uploadedAt: string;
  }>;
  timeline?: IncidentTimelineEvent[];
  updates?: IncidentUpdate[];
  acknowledgmentCount?: number;
  acknowledgmentPercentage?: number;
  totalPersonnelNotified?: number;
  // NEW: Multi-personnel workflow fields
  primaryResponderId?: string;
  respondingAt?: string;
  resolutionNotes?: string;
  responders?: Array<{
    id: string;
    personnelId: string;
    incidentId: string;
    isPrimary: boolean;
    acceptedAt: string;
    arrivedAt?: string;
    leftAt?: string;
    personnel: {
      id: string;
      employeeId: string;
      firstName: string;
      lastName: string;
      role: string;
      phone: string;
    };
  }>;
}

export interface IncidentTimelineEvent {
  id: string;
  incidentId: string;
  type: 'STATUS_CHANGE' | 'ASSIGNED' | 'NOTE' | 'PHOTO' | 'UPDATE' | 'VALIDATION' | 'CANCELLATION';
  title: string;
  description: string;
  actor: string; // user who performed action
  actorRole?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface IncidentUpdate {
  id: string;
  incidentId: string;
  message: string;
  author: string;
  authorRole: string;
  photos?: string[];
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIncidentRequest {
  title: string;
  description: string;
  type: IncidentType;
  priority: IncidentPriority;
  latitude: number;
  longitude: number;
  address: string;
  barangayId?: string;
  reportedBy: string;
}

export interface UpdateIncidentRequest {
  title?: string;
  description?: string;
  type?: IncidentType;
  priority?: IncidentPriority;
  status?: IncidentStatus;
  latitude?: number;
  longitude?: number;
  address?: string;
  barangayId?: string;
}

export interface IncidentFilters {
  status?: IncidentStatus[];
  priority?: IncidentPriority[];
  type?: IncidentType[];
  barangayId?: string[];
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'responseTime' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  hasPhotos?: boolean;
  hasAssignedPersonnel?: boolean;
  reporterPhone?: string;
}

export interface PaginatedIncidents {
  data: Incident[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IncidentStats {
  total: number;
  byStatus: Record<IncidentStatus, number>;
  byPriority: Record<IncidentPriority, number>;
  byType: Record<IncidentType, number>;
  averageResponseTime: number;
  averageResolutionTime: number;
}

export interface IncidentStatistics {
  // Incident counts
  totalIncidentsCount: number;
  activeIncidentsCount: number;
  resolvedIncidentsCount: number;
  criticalIncidentsCount: number;
  resolvedTodayCount: number;
  
  // Personnel counts
  totalPersonnelCount: number;
  availablePersonnelCount: number;
  respondingPersonnelCount: number;
  onScenePersonnelCount: number;
  offDutyPersonnelCount: number;
  
  // Response metrics
  averageResponseTimeMinutes: number;
  averageResolutionTimeMinutes: number;
  
  // Distribution percentages
  pendingVerificationPercent: number;
  verifiedPercent: number;
  respondingPercent: number;
  arrivedPercent: number;
  resolvedPercent: number;
  
  // Trend metrics (percent change from previous period)
  activeIncidentsPercentChange: number;
  resolvedPercentChange: number;
  criticalIncidentsPercentChange: number;
  responseTimePercentChange: number;
  
  // Date information
  lastUpdated: string;
}

export type ResolutionOutcome =
  | "BROUGHT_TO_POLICE_STATION"
  | "BROUGHT_TO_HOSPITAL"
  | "RESPONDED_BY_FIREFIGHTER"
  | "BROUGHT_TO_BARANGAY"
  | "RESPONDED_BY_POLICE"
  | "COMMON_RESOLVED"
  | "OTHER";

export interface IncidentResolution {
  id: string;
  incidentId: string;
  what: string;
  when: string;
  where: string;
  who: string;
  why: string;
  how: string; // Temporarily change back to string
  notes?: string;
  submittedByPersonnelId: string;
  submittedByPersonnel: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    photo?: string;
  };
  submittedAt: string;
  confirmedByAdminId?: string;
  confirmedByAdmin?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  confirmedAt?: string;
  adminNotes?: string;
}
