import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './button';
import { toast } from 'sonner';
import { handleApiError, logError } from '@/lib/error-handling';
import { useNavigate } from 'react-router-dom';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details
    const enhancedError = {
      ...error,
      componentStack: errorInfo.componentStack,
    };

    logError(enhancedError, 'React Error Boundary');

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Show user-friendly error toast
    toast.error('An unexpected error occurred', {
      description: 'The page has encountered an error. You can try refreshing or navigate back.',
      duration: 10000,
      action: {
        label: 'Report Issue',
        onClick: () => {
          // In a real app, this would send error details to your error tracking service
          console.log('Error reported:', { error, errorInfo });
        },
      },
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: undefined,
    });
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              
              <h1 className="mt-4 text-lg font-semibold text-gray-900">
                Something went wrong
              </h1>
              
              <p className="mt-2 text-sm text-gray-600">
                We're sorry, but something unexpected happened. Please try one of the options below.
              </p>

              {this.state.errorId && (
                <p className="mt-2 text-xs text-gray-500">
                  Error ID: {this.state.errorId}
                </p>
              )}

              <div className="mt-6 space-y-3">
                <Button
                  variant="outline"
                  onClick={this.handleRetry}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>

                <Button
                  variant="default"
                  onClick={this.handleRefresh}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Page
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => window.location.href = '/'}
                  className="w-full"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for handling async errors in functional components
export function useErrorHandler() {
  const navigate = useNavigate();

  const handleError = (error: unknown, context?: string) => {
    const apiError = handleApiError(error);
    
    logError(new Error(apiError.message), context);

    // Show appropriate error toast based on error type
    const errorType = apiError.status;
    
    if (errorType === 401) {
      toast.error('Authentication required', {
        description: 'Please log in again',
        duration: 5000,
      });
      navigate('/login');
    } else if (errorType === 403) {
      toast.error('Access denied', {
        description: 'You do not have permission to perform this action',
        duration: 5000,
      });
    } else if (errorType && errorType >= 500) {
      toast.error('Server error', {
        description: 'Please try again in a few minutes',
        duration: 8000,
      });
    } else {
      toast.error('Error', {
        description: apiError.message || 'An unexpected error occurred',
        duration: 5000,
      });
    }

    return apiError;
  };

  return { handleError };
}