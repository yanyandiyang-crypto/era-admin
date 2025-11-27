/**
 * Enhanced error handling utilities for the admin application
 */

// Standardized API error response structure
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
  status?: number;
  timestamp?: string;
}

// Type guard for API error responses
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof (error as ApiError).message === 'string'
  );
}

// Type guard for Axios error responses
export function isAxiosError(error: unknown): error is {
  response?: { data?: ApiError; status?: number };
  message?: string;
  code?: string;
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    (typeof (error as any).response === 'object' ||
      typeof (error as any).message === 'string')
  );
}

// Enhanced error handler that provides better error messages
export function handleApiError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error;
  }

  if (isAxiosError(error)) {
    const axiosError = error as any;
    
    if (axiosError.response?.data) {
      return {
        message: axiosError.response.data.message || axiosError.response.data.error || 'An error occurred',
        status: axiosError.response.status,
        details: axiosError.response.data.details,
      };
    }
    
    if (axiosError.code === 'ERR_NETWORK') {
      return {
        message: 'Network error - please check your connection',
        code: 'NETWORK_ERROR',
      };
    }
    
    if (axiosError.code === 'ECONNABORTED') {
      return {
        message: 'Request timed out - please try again',
        code: 'TIMEOUT_ERROR',
      };
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      details: { stack: error.stack },
    };
  }

  return {
    message: 'An unknown error occurred',
    details: { originalError: error },
  };
}

// Error boundary error type
export interface BoundaryError {
  error: Error;
  errorInfo: React.ErrorInfo;
  timestamp: number;
}

// Retry configuration
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

// Default retry configuration
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
};

// Exponential backoff with jitter
export function calculateRetryDelay(attempt: number, config: RetryConfig = DEFAULT_RETRY_CONFIG): number {
  const delay = Math.min(config.baseDelay * Math.pow(2, attempt), config.maxDelay);
  return delay + Math.random() * 1000; // Add jitter
}

// Retry wrapper for async operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === config.maxRetries) {
        throw lastError;
      }

      const delay = calculateRetryDelay(attempt, config);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Network status checker
export async function checkNetworkStatus(): Promise<boolean> {
  try {
    const response = await fetch('/api/health', {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Connection status hook helper
export function getConnectionStatusMessage(isConnected: boolean, lastError?: ApiError): string {
  if (isConnected) {
    return 'Connected';
  }

  if (lastError?.code === 'NETWORK_ERROR') {
    return 'Network disconnected';
  }

  if (lastError?.code === 'TIMEOUT_ERROR') {
    return 'Connection timeout';
  }

  return 'Connection lost';
}

// Validation error helper
export function createValidationError(field: string, message: string): ApiError {
  return {
    message: `${field}: ${message}`,
    code: 'VALIDATION_ERROR',
    details: { field, message },
  };
}

// User-friendly error messages for common scenarios
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error - please check your connection and try again',
  TIMEOUT_ERROR: 'Request timed out - the server is taking too long to respond',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  FORBIDDEN: 'You do not have permission to access this resource',
  NOT_FOUND: 'The requested resource was not found',
  CONFLICT: 'The operation could not be completed due to a conflict',
  SERVER_ERROR: 'Server error - please try again later',
  VALIDATION_ERROR: 'Please check your input and try again',
  UNKNOWN_ERROR: 'An unexpected error occurred',
} as const;

// Error categorization
export function categorizeError(error: ApiError): 'network' | 'validation' | 'authentication' | 'server' | 'unknown' {
  if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT_ERROR') {
    return 'network';
  }

  if (error.code === 'VALIDATION_ERROR' || error.status === 400) {
    return 'validation';
  }

  if (error.status === 401 || error.status === 403) {
    return 'authentication';
  }

  if (error.status && error.status >= 500) {
    return 'server';
  }

  return 'unknown';
}

// Safe error logging that doesn't expose sensitive information
export function logError(error: Error, context?: string): void {
  const errorInfo = {
    message: error.message,
    name: error.name,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  // In development, log to console
  if (import.meta.env.DEV) {
    console.error('Application Error:', errorInfo);
  }

  // In production, you might want to send to an error tracking service
  // Example: await errorTrackingService.report(errorInfo);
}