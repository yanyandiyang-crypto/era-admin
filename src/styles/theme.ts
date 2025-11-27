// Emergency Response Admin Theme
// Professional color palette for emergency services

export const theme = {
  // Primary Colors - Blue (Trust, Authority, Calm)
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main blue
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Emergency Colors - Red (Alert, Urgent, Critical)
  emergency: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Main red
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Success Colors - Green (Resolved, Safe, Active)
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  // Warning Colors - Amber (Caution, Attention)
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // Info Colors - Cyan (Information, Updates)
  info: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4',
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
  },

  // Neutral Colors - Gray (UI Elements)
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

// Status colors for incidents
export const statusColors = {
  PENDING_VERIFICATION: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
    badge: 'bg-red-500',
    hover: 'hover:bg-red-200',
  },
  VERIFIED: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-200',
    badge: 'bg-gray-500',
    hover: 'hover:bg-gray-200',
  },
  RESPONDING: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-200',
    badge: 'bg-orange-500',
    hover: 'hover:bg-orange-200',
  },
  ARRIVED: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
    badge: 'bg-green-500',
    hover: 'hover:bg-green-200',
  },
  RESOLVED: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200',
    badge: 'bg-blue-500',
    hover: 'hover:bg-blue-200',
  },
  SPAM: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
    badge: 'bg-red-500',
    hover: 'hover:bg-red-100',
  },
};

// Priority colors
export const priorityColors = {
  LOW: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300',
    badge: 'bg-gray-500',
    glow: 'shadow-gray-500/50',
  },
  MEDIUM: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-300',
    badge: 'bg-blue-500',
    glow: 'shadow-blue-500/50',
  },
  HIGH: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-300',
    badge: 'bg-orange-500',
    glow: 'shadow-orange-500/50',
  },
  CRITICAL: {
    bg: 'bg-red-500',
    text: 'text-white',
    border: 'border-red-600',
    badge: 'bg-red-600',
    glow: 'shadow-red-500/50',
    pulse: 'animate-pulse',
  },
};

// Card styles
export const cardStyles = {
  base: 'bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200',
  hover: 'hover:shadow-md hover:border-gray-300',
  active: 'ring-2 ring-blue-500 border-blue-500',
  emergency: 'border-red-300 bg-red-50',
};

// Button styles
export const buttonStyles = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md',
  emergency: 'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md animate-pulse',
  success: 'bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md',
  warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm hover:shadow-md',
  outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
  ghost: 'text-gray-700 hover:bg-gray-100',
};

// Gradients
export const gradients = {
  primary: 'bg-linear-to-r from-blue-600 to-blue-700',
  emergency: 'bg-linear-to-r from-red-600 to-red-700',
  success: 'bg-linear-to-r from-green-600 to-green-700',
  hero: 'bg-linear-to-br from-blue-600 via-blue-700 to-red-600',
  subtle: 'bg-linear-to-b from-white to-gray-50',
};

// Shadows
export const shadows = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  emergency: 'shadow-lg shadow-red-500/20',
  glow: 'shadow-lg shadow-blue-500/30',
};

// Animation durations
export const animations = {
  fast: 'duration-150',
  normal: 'duration-200',
  slow: 'duration-300',
  ping: 'animate-ping',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  spin: 'animate-spin',
};

// Border radius
export const borderRadius = {
  sm: 'rounded-md',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  xl: 'rounded-2xl',
  full: 'rounded-full',
};

// Spacing
export const spacing = {
  xs: 'p-2',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-12',
};
