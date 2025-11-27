/**
 * Enhanced loading state management utilities for better UX
 */

// Loading state types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Enhanced loading state interface
export interface LoadingStateInfo {
  state: LoadingState;
  message?: string;
  error?: string;
  progress?: number; // 0-100 for progress indicators
  retryCount?: number;
  lastUpdated?: Date;
}

// Create initial loading state
export function createLoadingState(initialState: LoadingState = 'idle'): LoadingStateInfo {
  return {
    state: initialState,
    retryCount: 0,
    lastUpdated: initialState === 'loading' ? new Date() : undefined,
  };
}

// Loading state transitions
export function startLoading(message?: string): LoadingStateInfo {
  return {
    state: 'loading',
    message: message || 'Loading...',
    retryCount: 0,
    lastUpdated: new Date(),
  };
}

export function loadingSuccess(message?: string): LoadingStateInfo {
  return {
    state: 'success',
    message: message || 'Loaded successfully',
    retryCount: 0,
    lastUpdated: new Date(),
  };
}

export function loadingError(error: string, retryCount = 0): LoadingStateInfo {
  return {
    state: 'error',
    error,
    retryCount,
    lastUpdated: new Date(),
  };
}

export function updateProgress(progress: number, message?: string): LoadingStateInfo {
  return {
    state: 'loading',
    message: message || `Loading... ${progress}%`,
    progress,
    lastUpdated: new Date(),
  };
}

// Hook for managing loading states
export interface UseLoadingStateOptions {
  autoReset?: boolean;
  maxRetries?: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

// Loading state hook result
export interface UseLoadingStateResult {
  loadingState: LoadingStateInfo;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  startLoading: (message?: string) => void;
  finishLoading: (message?: string) => void;
  failLoading: (error: string) => void;
  resetLoading: () => void;
  retry: () => void;
  updateProgress: (progress: number, message?: string) => void;
}

// Enhanced loading state hook (would be used in actual components)
export function createLoadingStateManager(
  initialState: LoadingState = 'idle',
  options: UseLoadingStateOptions = {}
) {
  const { autoReset = false, maxRetries = 3 } = options;
  
  let loadingState = createLoadingState(initialState);
  
  const setState = (newState: LoadingStateInfo) => {
    loadingState = newState;
  };

  const startLoadingLocal = (message?: string) => {
    setState(startLoading(message));
  };

  const finishLoading = (message?: string) => {
    setState(loadingSuccess(message));
    if (options.onSuccess) {
      options.onSuccess();
    }
    if (autoReset) {
      setTimeout(() => {
        setState(createLoadingState('idle'));
      }, 2000);
    }
  };

  const failLoading = (error: string) => {
    const retryCount = loadingState.retryCount || 0;
    if (retryCount >= maxRetries) {
      setState(loadingError(`Max retries exceeded: ${error}`, retryCount));
    } else {
      setState(loadingError(error, retryCount + 1));
    }
    if (options.onError) {
      options.onError(error);
    }
  };

  const resetLoading = () => {
    setState(createLoadingState('idle'));
  };

  const retry = () => {
    if (loadingState.state === 'error') {
      setState({
        ...loadingState,
        state: 'loading',
        retryCount: (loadingState.retryCount || 0) + 1,
        lastUpdated: new Date(),
      });
    }
  };

  const updateProgressLocal = (progress: number, message?: string) => {
    setState(updateProgress(progress, message));
  };

  const isLoading = loadingState.state === 'loading';
  const isError = loadingState.state === 'error';
  const isSuccess = loadingState.state === 'success';

  return {
    loadingState,
    isLoading,
    isError,
    isSuccess,
    startLoading: startLoadingLocal,
    finishLoading,
    failLoading,
    resetLoading,
    retry,
    updateProgress: updateProgressLocal,
  };
}

// Async operation wrapper with loading states
export async function withLoadingState<T>(
  operation: () => Promise<T>,
  loadingManager: ReturnType<typeof createLoadingStateManager>
): Promise<T> {
  loadingManager.startLoading();
  
  try {
    const result = await operation();
    loadingManager.finishLoading();
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    loadingManager.failLoading(errorMessage);
    throw error;
  }
}

// Debounced loading state for rapid operations
export function createDebouncedLoadingState(
  delay: number = 300,
  initialState: LoadingState = 'idle'
) {
  let timeoutId: number | null = null;
  let loadingState = createLoadingState(initialState);

  const debouncedStart = (message?: string) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      loadingState = startLoading(message);
    }, delay);
  };

  const immediateStart = (message?: string) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    loadingState = startLoading(message);
  };

  const finish = (message?: string) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    loadingState = loadingSuccess(message);
  };

  const fail = (error: string) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    loadingState = loadingError(error);
  };

  return {
    get loadingState() {
      return loadingState;
    },
    debouncedStart,
    immediateStart,
    finish,
    fail,
    cancel: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },
  };
}

// Batch loading state for multiple operations
export interface BatchLoadingState {
  total: number;
  completed: number;
  failed: number;
  loading: number;
  state: LoadingState;
  items: Map<string, LoadingStateInfo>;
}

export function createBatchLoadingState(itemIds: string[]): BatchLoadingState {
  const items = new Map<string, LoadingStateInfo>();
  
  itemIds.forEach(id => {
    items.set(id, createLoadingState('idle'));
  });

  return {
    total: itemIds.length,
    completed: 0,
    failed: 0,
    loading: 0,
    state: 'idle',
    items,
  };
}

export function updateBatchItem(
  batchState: BatchLoadingState,
  itemId: string,
  newState: LoadingStateInfo
): BatchLoadingState {
  const oldState = batchState.items.get(itemId);
  
  // Update counts
  if (oldState) {
    if (oldState.state === 'loading') batchState.loading--;
    if (oldState.state === 'success') batchState.completed--;
    if (oldState.state === 'error') batchState.failed--;
  }

  if (newState.state === 'loading') batchState.loading++;
  if (newState.state === 'success') batchState.completed++;
  if (newState.state === 'error') batchState.failed++;

  // Update overall state
  if (batchState.loading > 0) {
    batchState.state = 'loading';
  } else if (batchState.failed > 0) {
    batchState.state = 'error';
  } else {
    batchState.state = 'success';
  }

  batchState.items.set(itemId, newState);
  return batchState;
}

// Loading state components props
export interface LoadingIndicatorProps {
  loadingState: LoadingStateInfo;
  onRetry?: () => void;
  className?: string;
}

export interface BatchLoadingIndicatorProps {
  batchState: BatchLoadingState;
  onRetry?: (itemId: string) => void;
  className?: string;
}