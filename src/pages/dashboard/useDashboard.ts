/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useSocket } from "@/hooks/useSocket";
import { dashboardService } from "@/services/dashboard.service";
import { incidentService } from "@/services/incident.service";
import type { DashboardOverview } from "@/types/dashboard.types";
import type { Incident } from "@/types/incident.types";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

export function useDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, accessToken } = useAuthStore();
  const { socket, isConnected } = useSocket();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [incidentTimes, setIncidentTimes] = useState<Record<string, string>>({});
  const [isSilentRefreshing, setIsSilentRefreshing] = useState(false);
  const [refreshRetryCount, setRefreshRetryCount] = useState(0);
  const alertAudioRef = useRef<HTMLAudioElement | null>(null);
  const refreshTimeoutRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [activeToasts, setActiveToasts] = useState<Record<string, string | number>>({});
  const [isBroadcastDialogOpen, setIsBroadcastDialogOpen] = useState(false);
  const [focusMode, setFocusMode] = useState<'overview' | 'incidents' | 'personnel' | null>(null);

  const syncRelative = useMemo(() => {
    if (!lastSyncedAt) return 'Syncing...';
    return formatDistanceToNow(lastSyncedAt, { addSuffix: true });
  }, [lastSyncedAt]);

  // Connection health check
  const checkConnectionHealth = useCallback(async (): Promise<boolean> => {
    try {
      // Simple health check - try to fetch a small endpoint
      const response = await fetch('/api/health', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      const isHealthy = response.ok;
      return isHealthy;
    } catch {
      return false;
    }
  }, []);

  // Exponential backoff calculation
  const getRetryDelay = useCallback((retryCount: number): number => {
    const baseDelay = 30000; // 30 seconds
    const maxDelay = 300000; // 5 minutes
    const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
    return delay + Math.random() * 5000; // Add jitter
  }, []);

  // Silent refresh with retry logic
  const silentRefresh = useCallback(async (force = false): Promise<void> => {
    // Prevent concurrent refreshes
    if (isSilentRefreshing && !force) return;

    // Check connection health first
    if (!force) {
      const isHealthy = await checkConnectionHealth();
      if (!isHealthy) {
        // console.warn('Connection unhealthy, skipping silent refresh');
        return;
      }
    }

    setIsSilentRefreshing(true);

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      // console.log('🔄 Silent refresh: Starting dashboard data fetch');

      // Fetch both dashboard data and recent incidents in parallel
      const [overviewResponse, incidentsResponse] = await Promise.allSettled([
        dashboardService.getOverview(),
        incidentService.getIncidents({
          page: 1,
          limit: 5,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        })
      ]);

      let hasUpdates = false;

      // Handle overview data
      if (overviewResponse.status === 'fulfilled') {
        const newOverview = overviewResponse.value.data;
        setOverview(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(newOverview)) {
            hasUpdates = true;
            return newOverview;
          }
          return prev;
        });
      } else {
        // console.warn('Silent refresh: Failed to fetch overview:', overviewResponse.reason);
      }

      // Handle incidents data
      if (incidentsResponse.status === 'fulfilled') {
        const newIncidents = incidentsResponse.value.data.data || [];
        setRecentIncidents(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(newIncidents)) {
            hasUpdates = true;
            return newIncidents;
          }
          return prev;
        });
      } else {
        // console.warn('Silent refresh: Failed to fetch incidents:', incidentsResponse.reason);
      }

      // Update sync timestamp
      const now = new Date();
      setLastSyncedAt(now);
      setRefreshRetryCount(0); // Reset retry count on success

      if (hasUpdates) {
        // console.log('✅ Silent refresh: Data updated successfully');
      } else {
        // console.log('ℹ️ Silent refresh: No data changes detected');
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // console.log('🔄 Silent refresh: Request cancelled');
        return;
      }

      // console.error('❌ Silent refresh: Failed:', error);
      setRefreshRetryCount(prev => prev + 1);

      // Schedule retry with exponential backoff
      const retryDelay = getRetryDelay(refreshRetryCount);
      // console.log(`⏰ Scheduling retry in ${retryDelay / 1000} seconds`);

      refreshTimeoutRef.current = setTimeout(() => {
        silentRefresh();
      }, retryDelay);

    } finally {
      setIsSilentRefreshing(false);
      abortControllerRef.current = null;
    }
  }, [isSilentRefreshing, checkConnectionHealth, getRetryDelay, refreshRetryCount]);

  useEffect(() => {
    alertAudioRef.current = new Audio('/notification.mp3');
    alertAudioRef.current.volume = 0.6;
    alertAudioRef.current.loop = true; // Enable infinite loop
    return () => {
      if (alertAudioRef.current) {
        alertAudioRef.current.pause();
        alertAudioRef.current = null;
      }
    };
  }, []);

  const stopAlertTone = useCallback(() => {
    if (alertAudioRef.current) {
      alertAudioRef.current.pause();
      alertAudioRef.current.currentTime = 0;
    }
    if ((window as any).alertTimeoutId) {
      clearTimeout((window as any).alertTimeoutId);
      (window as any).alertTimeoutId = undefined;
    }
  }, []);

  const playAlertTone = useCallback(() => {
    const audio = alertAudioRef.current;
    if (!audio || !audio.paused) return; // Only play if not already playing
    audio.currentTime = 0;
    audio.play().catch(() => undefined);
    // Stop after 30 seconds
    (window as any).alertTimeoutId = setTimeout(() => {
      stopAlertTone();
    }, 30000);
  }, [stopAlertTone]);

  // Initial load and auto-refresh setup
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      // Initial load (not silent)
      fetchDashboardData();
      fetchRecentIncidents();

      // Start silent refresh cycle
      const startSilentRefresh = () => {
        refreshTimeoutRef.current = setTimeout(() => {
          silentRefresh().finally(() => {
            // Schedule next refresh
            refreshTimeoutRef.current = setTimeout(startSilentRefresh, 30000);
          });
        }, 30000);
      };

      startSilentRefresh();

      return () => {
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    }
  }, [isAuthenticated, accessToken, silentRefresh]);

  // Live clock update
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(clockInterval);
  }, []);

  // Update incident live times
  useEffect(() => {
    const updateIncidentTimes = () => {
      const newTimes: Record<string, string> = {};
      recentIncidents.forEach(incident => {
        const id = incident.incidentId || (incident as { incidentId?: string }).incidentId;
        if (id) {
          newTimes[id] = formatDistanceToNow(new Date(incident.reportedAt), { addSuffix: true });
        }
      });
      setIncidentTimes(newTimes);
    };

    // Update immediately
    updateIncidentTimes();

    // Update every minute
    const interval = setInterval(updateIncidentTimes, 60000);

    return () => clearInterval(interval);
  }, [recentIncidents]);

  // WebSocket real-time updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleIncidentCreated = (incident: Incident) => {
      // console.log('🆕 Dashboard: New incident received', incident);

      // Priority-based handling
      const priorityConfig = getPriorityConfig(incident.priority, incident.type);

      // Play appropriate alert tone based on priority
      if (priorityConfig.playAlert) {
        playAlertTone();
      }

      // Add to recent incidents with priority consideration
      setRecentIncidents(prev => {
        let newList = [incident, ...prev];

        // For critical incidents, ensure they stay at the top
        if (incident.priority === 'CRITICAL') {
          newList = newList.slice(0, 5);
        } else {
          newList = newList.slice(0, 5);
        }

        return newList;
      });

      // Refresh dashboard data
      fetchDashboardData();

      // Priority-based toast notification
      const toastId = toast[priorityConfig.toastType](priorityConfig.message, {
        description: `${incident.title} - ${incident.address}`,
        duration: priorityConfig.duration,
        action: priorityConfig.showAction ? {
          label: 'View Details',
          onClick: () => navigate(`/incidents/${incident.incidentId}`),
        } : undefined,
      });
      setActiveToasts(prev => ({ ...prev, [incident.incidentId]: toastId }));
    };

    const handleIncidentUpdated = (incident: Incident) => {
      // console.log('📝 Dashboard: Incident updated', incident);

      // Update incident in recent incidents list
      setRecentIncidents(prev =>
        prev.map(i => i.incidentId === incident.incidentId ? incident : i)
      );

      // Refresh dashboard data for statistics
      fetchDashboardData();

      toast.info(`Incident ${incident.trackingNumber} updated`, {
        description: `Status: ${incident.status}`,
        duration: 3000
      });
    };

    const handleIncidentResolved = (data: any) => {
      // console.log('✅ Dashboard: Incident resolved', data);

      // Update incident in recent incidents list
      setRecentIncidents(prev =>
        prev.map(i => i.incidentId === data.incidentId
          ? { ...i, status: 'RESOLVED', resolvedAt: new Date().toISOString() }
          : i
        )
      );

      // Refresh dashboard data
      fetchDashboardData();

      toast.success(`Incident resolved`, {
        description: `${data.type} incident has been resolved`,
        duration: 3000
      });
    };

    const handleIncidentDeleted = (incidentId: string) => {
      // console.log('🗑️ Dashboard: Incident deleted', incidentId);

      // Remove from recent incidents
      setRecentIncidents(prev => prev.filter(i => i.incidentId !== incidentId));

      // Refresh dashboard data
      fetchDashboardData();
    };

    const handleIncidentMarkerClicked = (incidentId: string) => {
      // Dismiss the toast for this incident
      const toastId = activeToasts[incidentId];
      if (toastId) {
        toast.dismiss(toastId);
        setActiveToasts(prev => {
          const newToasts = { ...prev };
          delete newToasts[incidentId];
          return newToasts;
        });
      }
    };

    // Register event listeners
    socket.on('incident:created', handleIncidentCreated);
    socket.on('incident:updated', handleIncidentUpdated);
    socket.on('incident:resolved', handleIncidentResolved);
    socket.on('incident:deleted', handleIncidentDeleted);
    socket.on('incident:marker_clicked', handleIncidentMarkerClicked);

    return () => {
      socket.off('incident:created', handleIncidentCreated);
      socket.off('incident:updated', handleIncidentUpdated);
      socket.off('incident:resolved', handleIncidentResolved);
      socket.off('incident:deleted', handleIncidentDeleted);
      socket.off('incident:marker_clicked', handleIncidentMarkerClicked);
    };
  }, [socket, isConnected, activeToasts, navigate, playAlertTone]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await dashboardService.getOverview();
      setOverview(response.data);
      setLastSyncedAt(new Date());
      setRefreshRetryCount(0);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;

      const errorMsg = (err as any)?.response?.data?.error?.message || (err as any)?.response?.data?.message || "Failed to load dashboard";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentIncidents = async () => {
    try {
      const response = await incidentService.getIncidents({
        page: 1,
        limit: 5,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      setRecentIncidents(response.data.data || []);
      setLastSyncedAt(new Date());
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      // console.error("Failed to fetch recent incidents:", err);
    }
  };

  const isLiveSync = Boolean(socket && isConnected);

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      await Promise.all([fetchDashboardData(), fetchRecentIncidents()]);
      toast.success("Dashboard refreshed successfully");
    } catch {
      toast.error("Failed to refresh dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityConfig = (priority: string, incidentType: string) => {
    switch (priority) {
      case 'CRITICAL':
        return {
          playAlert: true,
          toastType: 'error' as const,
          message: `🚨 CRITICAL ${incidentType} incident reported`,
          duration: 30000,
          showAction: true,
        };
      case 'HIGH':
        return {
          playAlert: true,
          toastType: 'warning' as const,
          message: `⚠️ High priority ${incidentType} incident reported`,
          duration: 30000,
          showAction: true,
        };
      case 'MEDIUM':
        return {
          playAlert: false,
          toastType: 'info' as const,
          message: `📋 New ${incidentType} incident reported`,
          duration: 4000,
          showAction: false,
        };
      case 'LOW':
      default:
        return {
          playAlert: false,
          toastType: 'success' as const,
          message: `📝 New ${incidentType} incident reported`,
          duration: 3000,
          showAction: false,
        };
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
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
      SPAM: "bg-red-50 text-red-600",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: "text-gray-600",
      MEDIUM: "text-blue-600",
      HIGH: "text-orange-600",
      CRITICAL: "text-red-600 font-bold",
    };
    return colors[priority] || "text-gray-600";
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Computed values
  const criticalIncidents = Math.floor((overview?.incidents.active || 0) * 0.25);
  const quickFilters = [
    {
      label: "Last 24 Hours",
      description: "Fresh incidents reported",
      query: "?range=24h",
    },
    {
      label: "Critical Priority",
      description: "Needs immediate action",
      query: "?priority=CRITICAL",
    },
    {
      label: "Awaiting Dispatch",
      description: "Pending verification",
      query: "?status=PENDING_VERIFICATION",
    },
    {
      label: "En Route",
      description: "Responders on the move",
      query: "?status=RESPONDING",
    },
  ];

  const totalPersonnel = overview?.personnel.total || 0;
  const readinessMetrics = [
    {
      label: "Available",
      value: overview?.personnel.available || 0,
      color: "bg-emerald-500",
    },
    {
      label: "On Duty",
      value: overview?.personnel.onDuty || 0,
      color: "bg-blue-500",
    },
    {
      label: "Active Ops",
      value: overview?.personnel.active || 0,
      color: "bg-orange-500",
    },
  ].map((metric) => ({
    ...metric,
    percent: totalPersonnel
      ? Math.round((metric.value / totalPersonnel) * 100)
      : 0,
  }));

  const incidentTypeTotals = recentIncidents.reduce<Record<string, number>>((acc, incident) => {
    const type = incident.type || "OTHER";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const totalRecentIncidents = recentIncidents.length || 1;
  const incidentMix = Object.entries(incidentTypeTotals).map(([type, count]) => ({
    type,
    count,
    percent: Math.round((count / totalRecentIncidents) * 100),
  }));

  return {
    // State values
    overview,
    recentIncidents,
    isLoading,
    error,
    lastSyncedAt,
    currentTime,
    incidentTimes,
    isLiveSync,
    activeToasts,
    isBroadcastDialogOpen,
    focusMode,
    syncRelative,

    // Computed values
    criticalIncidents,
    quickFilters,
    readinessMetrics,
    incidentMix,
    totalPersonnel,

    // Actions
    handleRefresh,
    setIsBroadcastDialogOpen,
    setFocusMode,
    navigate,

    // Util functions
    getPriorityConfig,
    getStatusColor,
    getPriorityColor,
    getGreeting,

    // Components that might need access
    format,
    formatDistanceToNow,
  };
}
