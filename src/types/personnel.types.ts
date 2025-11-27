// Personnel Status - matches backend PersonnelStatus enum
// ON_DUTY is the primary active status (AVAILABLE is legacy/unused)
export type PersonnelStatus = "ON_DUTY" | "ON_BREAK" | "OFF_DUTY" | "RESPONDING" | "ON_SCENE" | "AVAILABLE" | "INACTIVE" | "SUSPENDED";

export type PersonnelRole =
  | "RESPONDER"
  | "MEDIC"
  | "FIREFIGHTER"
  | "POLICE"
  | "COORDINATOR";

export type DutyStatus = "AVAILABLE" | "RESPONDING" | "ON_SCENE" | "UNAVAILABLE";

export interface Personnel {
  id: File | null;
  personnelId: string;
  userId: string;
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: PersonnelRole;
  status: PersonnelStatus;
  dutyStatus: DutyStatus;
  isAvailable: boolean;

  // Location
  currentLatitude?: number;
  currentLongitude?: number;
  lastLocationUpdate?: string;
  locationAccuracy?: number;

  // Personal Info
  dateOfBirth?: string;
  bloodType?: string;
  address?: string;
  emergencyContact?: string;
  profilePhoto?: string;

  // Work Info
  barangayPostId?: string;
  specialties?: string[];
  certifications?: string[];
  currentDuty?: string;

  // Stats
  totalIncidentsHandled?: number;
  averageResponseTime?: number;
  performanceRating?: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastActiveAt?: string;

  // Relations
  barangayPost?: {
    barangayPostId: string;
    name: string;
    barangay: {
      name: string;
    };
  };
  assignmentHistory?: AssignmentHistory[];
}

export interface CreatePersonnelRequest {
  employeeId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: PersonnelRole;
  dateOfBirth?: string; // Send as ISO string, backend transforms to Date
  bloodType?: string;
  address?: string;
  emergencyContact?: string;
}

export interface UpdatePersonnelRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: PersonnelRole;
  status?: PersonnelStatus;
  dateOfBirth?: string; // Send as ISO string, backend transforms to Date
  bloodType?: string;
  address?: string;
  emergencyContact?: string;
  isAvailable?: boolean;
  currentDuty?: string;
}

export interface UpdateLocationRequest {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
}

export interface AssignmentHistory {
  id: string;
  incidentId: string;
  personnelId: string;
  assignedAt: string;
  respondedAt?: string;
  arrivedAt?: string;
  completedAt?: string;
  responseTime?: number;
  status: string;
  incident?: {
    trackingNumber: string;
    type: string;
    address: string;
  };
}

export interface PersonnelFilters {
  search?: string;
  role?: PersonnelRole[];
  status?: PersonnelStatus[];
  dutyStatus?: DutyStatus[];
  isAvailable?: boolean;
  barangayPostId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'lastName' | 'role' | 'totalIncidentsHandled';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedPersonnel {
  data: Personnel[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PersonnelStats {
  total: number;
  available: number;
  onDuty: number;
  offDuty: number;
  onBreak: number;
  inactive: number;
  byRole: Record<PersonnelRole, number>;
  averageResponseTime: number;
}

// Alert Broadcast System
export interface IncidentAlert {
  count: string[];
  totalAlerted: string[];
  alertId: string;
  incidentId: string;
  trackingNumber: string;
  type: string;
  priority: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  reportedAt: string;
  broadcastAt: string;
  alertedPersonnel: string[]; // personnel IDs who received the alert
  respondedPersonnel: string[]; // personnel IDs who responded
  status: 'ACTIVE' | 'RESPONDED' | 'CANCELLED';
}

export interface BroadcastAlertRequest {
  incidentId: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  targetRoles?: PersonnelRole[]; // Optional: alert specific roles only
  targetBarangays?: string[]; // Optional: alert specific barangays only
  radius?: number; // Optional: alert within radius (meters)
  latitude?: number;
  longitude?: number;
}

export interface AlertResponse {
  alertId: string;
  personnelId: string;
  response: 'ACCEPTED' | 'DECLINED' | 'ACKNOWLEDGED';
  responseTime: number; // milliseconds
  estimatedArrivalTime?: number; // minutes
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
  respondedAt: string;
}
