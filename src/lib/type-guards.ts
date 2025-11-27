/**
 * Type guards for runtime type checking and API response validation
 */

// Type guards for basic types
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

// Type guards for API responses
export function isValidIncidentStatus(status: unknown): status is string {
  const validStatuses = [
    'PENDING_VERIFICATION',
    'VERIFIED',
    'REPORTED',
    'ACKNOWLEDGED',
    'DISPATCHED',
    'IN_PROGRESS',
    'RESPONDING',
    'ARRIVED',
    'PENDING_RESOLVE',
    'RESOLVED',
    'CLOSED',
    'CANCELLED',
    'SPAM'
  ];
  return isString(status) && validStatuses.includes(status);
}

export function isValidIncidentPriority(priority: unknown): priority is string {
  const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  return isString(priority) && validPriorities.includes(priority);
}

export function isValidIncidentType(type: unknown): type is string {
  const validTypes = ['FIRE', 'MEDICAL', 'ACCIDENT', 'CRIME', 'FLOOD', 'NATURAL_DISASTER', 'OTHER'];
  return isString(type) && validTypes.includes(type);
}

export function isValidPersonnelStatus(status: unknown): status is string {
  const validStatuses = [
    'ON_DUTY',
    'ON_BREAK',
    'OFF_DUTY',
    'RESPONDING',
    'ON_SCENE',
    'AVAILABLE',
    'INACTIVE',
    'SUSPENDED'
  ];
  return isString(status) && validStatuses.includes(status);
}

export function isValidDutyStatus(status: unknown): status is string {
  const validStatuses = ['AVAILABLE', 'RESPONDING', 'ON_SCENE', 'UNAVAILABLE'];
  return isString(status) && validStatuses.includes(status);
}

// Type guards for data structures
export function isValidIncident(incident: unknown): incident is {
  incidentId: string;
  title: string;
  status: string;
  type: string;
  priority: string;
  latitude: number;
  longitude: number;
} {
  if (!isObject(incident)) return false;
  
  return (
    isString(incident.incidentId) &&
    isString(incident.title) &&
    isValidIncidentStatus(incident.status) &&
    isValidIncidentType(incident.type) &&
    isValidIncidentPriority(incident.priority) &&
    isNumber(incident.latitude) &&
    isNumber(incident.longitude)
  );
}

export function isValidPersonnel(personnel: unknown): personnel is {
  personnelId: string;
  firstName: string;
  lastName: string;
  status: string;
  role: string;
} {
  if (!isObject(personnel)) return false;
  
  return (
    isString(personnel.personnelId) &&
    isString(personnel.firstName) &&
    isString(personnel.lastName) &&
    isValidPersonnelStatus(personnel.status) &&
    isString(personnel.role)
  );
}

export function isValidBarangay(barangay: unknown): barangay is {
  id?: string;
  barangayId?: string;
  name: string;
  latitude?: number;
  longitude?: number;
} {
  if (!isObject(barangay)) return false;
  
  return (
    isString(barangay.name) &&
    (barangay.latitude === undefined || isNumber(barangay.latitude)) &&
    (barangay.longitude === undefined || isNumber(barangay.longitude)) &&
    (barangay.id === undefined || isString(barangay.id)) &&
    (barangay.barangayId === undefined || isString(barangay.barangayId))
  );
}

export function isValidApiResponse<T>(response: unknown): response is {
  success: boolean;
  data: T;
  message?: string;
} {
  if (!isObject(response)) return false;
  
  return (
    isBoolean(response.success) &&
    'data' in response
  );
}

export function isValidPaginatedResponse<T>(response: unknown): response is {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} {
  if (!isObject(response)) return false;
  
  return (
    isArray(response.data) &&
    isNumber(response.total) &&
    isNumber(response.page) &&
    isNumber(response.limit) &&
    isNumber(response.totalPages)
  );
}

export function isValidLocation(location: unknown): location is {
  latitude: number;
  longitude: number;
  timestamp?: string;
} {
  if (!isObject(location)) return false;
  
  return (
    isNumber(location.latitude) &&
    isNumber(location.longitude) &&
    (location.timestamp === undefined || isString(location.timestamp))
  );
}

export function isValidNotification(notification: unknown): notification is {
  id: string;
  type: string;
  title: string;
  message: string;
} {
  if (!isObject(notification)) return false;
  
  return (
    isString(notification.id) &&
    isString(notification.type) &&
    isString(notification.title) &&
    isString(notification.message)
  );
}

// Type guard for socket events
export function isValidSocketEventData(data: unknown): data is Record<string, unknown> {
  return isObject(data) && Object.keys(data).length > 0;
}

// Type guard for form validation errors
export function isValidValidationError(error: unknown): error is {
  field: string;
  message: string;
} {
  if (!isObject(error)) return false;
  
  return (
    isString(error.field) &&
    isString(error.message)
  );
}

// Type guard for API error responses
export function isValidApiError(error: unknown): error is {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
} {
  if (!isObject(error)) return false;
  
  return isString(error.message);
}

// Generic type guard wrapper
export function createTypeGuard<T>(guard: (value: unknown) => value is T) {
  return (value: unknown): value is T => {
    if (!guard(value)) {
      console.warn('Type validation failed:', { value, expected: guard.name });
      return false;
    }
    return true;
  };
}

// Array type guard
export function isValidArrayOf<T>(
  items: unknown,
  guard: (item: unknown) => item is T
): items is T[] {
  if (!isArray(items)) return false;
  
  return items.every(item => guard(item));
}

// Optional type guard
export function isOptional<T>(
  value: unknown,
  guard: (value: unknown) => value is T
): value is T | undefined {
  return value === undefined || guard(value);
}