// API Configuration
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('VITE_WS_URL:', import.meta.env.VITE_WS_URL);
export const API_URL = import.meta.env.VITE_API_URL || "http://ec2-44-222-69-93.compute-1.amazonaws.com:3000/api/v1";
export const WS_URL = import.meta.env.VITE_WS_URL || "ws://ec2-44-222-69-93.compute-1.amazonaws.com:3000";
export const BASE_URL = import.meta.env.VITE_BASE_URL || "http://ec2-44-222-69-93.compute-1.amazonaws.com:3000";

// Helper function to get full image URL
export const getImageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${BASE_URL}${path}`;
};

// Local Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  USER: "user",
} as const;

// Incident Status
export const INCIDENT_STATUS = {
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
  VERIFIED: "VERIFIED",
  REPORTED: "REPORTED",
  ACKNOWLEDGED: "ACKNOWLEDGED",
  DISPATCHED: "DISPATCHED",
  IN_PROGRESS: "IN_PROGRESS",
  RESPONDING: "RESPONDING",
  ARRIVED: "ARRIVED",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
  CANCELLED: "CANCELLED",
  SPAM: "SPAM",
} as const;

// Incident Priority
export const INCIDENT_PRIORITY = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
} as const;

// Incident Type
export const INCIDENT_TYPE = {
  FIRE: "FIRE",
  MEDICAL: "MEDICAL",
  ACCIDENT: "ACCIDENT",
  CRIME: "CRIME",
  DISASTER: "DISASTER",
  OTHER: "OTHER",
} as const;

// Personnel Status - matches backend PersonnelStatus enum
// ON_DUTY is the primary active status (AVAILABLE is legacy/unused)
export const PERSONNEL_STATUS = {
  ON_DUTY: "ON_DUTY",
  ON_BREAK: "ON_BREAK",
  OFF_DUTY: "OFF_DUTY",
  RESPONDING: "RESPONDING",
  ON_SCENE: "ON_SCENE",
  AVAILABLE: "AVAILABLE", // Legacy - not actively used
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED",
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: "ADMIN",
  DISPATCHER: "DISPATCHER",
  RESPONDER: "RESPONDER",
} as const;

// Status Colors (Tailwind)
export const STATUS_COLORS = {
  PENDING_VERIFICATION: "bg-red-100 text-red-800",
  VERIFIED: "bg-gray-100 text-gray-800",
  REPORTED: "bg-blue-100 text-blue-800",
  ACKNOWLEDGED: "bg-violet-100 text-violet-800",
  DISPATCHED: "bg-purple-100 text-purple-800",
  IN_PROGRESS: "bg-indigo-100 text-indigo-800",
  RESPONDING: "bg-orange-100 text-orange-800",
  ARRIVED: "bg-green-100 text-green-800",
  RESOLVED: "bg-blue-100 text-blue-800",
  CLOSED: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-rose-100 text-rose-800",
  SPAM: "bg-red-50 text-red-600", // Hidden from UI
} as const;

// Priority Colors (Tailwind)
export const PRIORITY_COLORS = {
  LOW: "bg-gray-100 text-gray-800",
  MEDIUM: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800",
  CRITICAL: "bg-red-100 text-red-800",
} as const;

// Incident Type Colors (Tailwind)
export const INCIDENT_TYPE_COLORS = {
  FIRE: "bg-red-50 text-red-600 border-red-200",
  MEDICAL: "bg-green-50 text-green-600 border-green-200",
  ACCIDENT: "bg-orange-50 text-orange-600 border-orange-200",
  CRIME: "bg-purple-50 text-purple-600 border-purple-200",
  FLOOD: "bg-blue-50 text-blue-600 border-blue-200",
  NATURAL_DISASTER: "bg-yellow-50 text-yellow-600 border-yellow-200",
  OTHER: "bg-gray-50 text-gray-600 border-gray-200",
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
