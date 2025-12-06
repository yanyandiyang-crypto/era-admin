import { useState, useEffect, useRef, useCallback } from "react";
// Will be needed when statistics component is re-enabled
// import { useNavigate } from "react-router-dom";
import { incidentService } from "@/services/incident.service";
import type { Incident, IncidentFilters, IncidentStatus } from "@/types/incident.types";
import { useSocket } from "@/hooks/useSocket";
import { useIncidentAlert } from "@/hooks/useIncidentAlert";
// import { ConnectionStatus } from "@/components/ui/connection-status";
import { toast } from "sonner";
import { IncidentHeader } from "@/components/incidents/IncidentHeader";
import { IncidentSearchBar } from "@/components/incidents/IncidentSearchBar";
import { IncidentTable } from "@/components/incidents/IncidentTable";
import { IncidentGrid } from "@/components/incidents/IncidentGrid";
import type { ViewMode } from "@/components/incidents/ViewToggle";
import { IncidentStatsDashboard } from "@/components/incidents/IncidentStatsDashboard";

// Import the professional theme
import "@/styles/incident-theme.css";

const ACTIVE_INCIDENT_STATUSES: IncidentStatus[] = [
  "PENDING_VERIFICATION",
  "VERIFIED",
  "REPORTED",
  "ACKNOWLEDGED",
  "DISPATCHED",
  "IN_PROGRESS",
  "RESPONDING",
  "ARRIVED",
  "PENDING_RESOLVE",
];

// Priority configuration helper
const getPriorityConfig = (priority: string, type: string) => {
  switch (priority) {
    case 'CRITICAL':
      return {
        toastType: 'error' as const,
        message: `🚨 CRITICAL ${type} Incident`,
        duration: 10000,
        showAction: true,
        playAlert: true,
      };
    case 'HIGH':
      return {
        toastType: 'warning' as const,
        message: `⚠️ HIGH Priority ${type} Incident`,
        duration: 7000,
        showAction: true,
        playAlert: true,
      };
    case 'MEDIUM':
      return {
        toastType: 'info' as const,
        message: `ℹ️ ${type} Incident Reported`,
        duration: 5000,
        showAction: false,
        playAlert: false,
      };
    case 'LOW':
    default:
      return {
        toastType: 'success' as const,
        message: `✅ ${type} Incident Logged`,
        duration: 3000,
        showAction: false,
        playAlert: false,
      };
  }
};

export default function IncidentsListPage() {
  // Navigation will be added back when needed
  const { socket, isConnected } = useSocket();
  const incidentAlert = useIncidentAlert();
  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isSilentRefreshing, setIsSilentRefreshing] = useState(false);
  const [refreshRetryCount, setRefreshRetryCount] = useState(0);
  const [, setConnectionHealthy] = useState(true);
  const [, setLastSuccessfulSync] = useState<Date | null>(null);
  const refreshTimeoutRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Pagination (we only use the setter currently)
  const [, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Filters - Exclude RESOLVED and CLOSED by default
  const [filters, setFilters] = useState<IncidentFilters>({
    status: [], // Empty means show active only (will be handled by API)
    priority: [],
    type: [],
    search: "",
    sortBy: "createdAt",
    sortOrder: "desc",
    page: 1,
    limit: 20,
  });


  const [showResolved] = useState(false);

  // Memoized filter predicate aligned to new workflow
  const shouldIncidentBeDisplayed = useCallback((incident: Incident): boolean => {
    if (showResolved) return true;
    if (!ACTIVE_INCIDENT_STATUSES.includes(incident.status)) return false;
    if (filters.status && filters.status.length > 0 && !filters.status.includes(incident.status)) return false;
    if (filters.priority && filters.priority.length > 0 && !filters.priority.includes(incident.priority)) return false;
    if (filters.type && filters.type.length > 0 && !filters.type.includes(incident.type)) return false;
    return true;
  }, [showResolved, filters.status, filters.priority, filters.type]);

  // Connection health check
  const checkConnectionHealth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      const isHealthy = response.ok;
      setConnectionHealthy(isHealthy);
      return isHealthy;
    } catch {
      setConnectionHealthy(false);
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
    if (isSilentRefreshing && !force) return;

    if (!force) {
      const isHealthy = await checkConnectionHealth();
      if (!isHealthy) {
        // console.warn('Incidents: Connection unhealthy, skipping silent refresh');
        return;
      }
    }

    setIsSilentRefreshing(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      // console.log('🔄 Incidents silent refresh: Starting data fetch');

      const updatedFilters = { ...filters };
      if (!showResolved && (!filters.status || filters.status.length === 0)) {
        updatedFilters.status = ACTIVE_INCIDENT_STATUSES;
      }

      const response = await incidentService.getIncidentsWithAcks(updatedFilters);

      // Only update if data actually changed
      setIncidents(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(response.data.data)) {
          // console.log('✅ Incidents silent refresh: Data updated');
          return response.data.data;
        }
        // console.log('ℹ️ Incidents silent refresh: No data changes');
        return prev;
      });

      setPagination({
        page: response.data.page,
        limit: response.data.limit,
        total: response.data.total,
        totalPages: response.data.totalPages,
      });

      setRefreshTrigger(prev => prev + 1);
      setLastSuccessfulSync(new Date());
      setRefreshRetryCount(0);

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // console.log('🔄 Incidents silent refresh: Request cancelled');
        return;
      }

      // console.error('❌ Incidents silent refresh: Failed:', error);
      setRefreshRetryCount(prev => prev + 1);

      const retryDelay = getRetryDelay(refreshRetryCount);
      // console.log(`⏰ Incidents: Scheduling retry in ${retryDelay / 1000} seconds`);

      refreshTimeoutRef.current = setTimeout(() => {
        silentRefresh();
      }, retryDelay);

    } finally {
      setIsSilentRefreshing(false);
      abortControllerRef.current = null;
    }
  }, [isSilentRefreshing, checkConnectionHealth, getRetryDelay, refreshRetryCount, filters, showResolved]);

  // Manual fetch function for user-initiated refreshes
  const fetchIncidents = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const updatedFilters = { ...filters };
      if (!showResolved && (!filters.status || filters.status.length === 0)) {
        updatedFilters.status = ACTIVE_INCIDENT_STATUSES;
      }
      const response = await incidentService.getIncidentsWithAcks(updatedFilters);
      setIncidents(response.data.data);
      setPagination({
        page: response.data.page,
        limit: response.data.limit,
        total: response.data.total,
        totalPages: response.data.totalPages,
      });
      setRefreshTrigger(prev => prev + 1);
      setLastSuccessfulSync(new Date());
      setRefreshRetryCount(0);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;

      // console.error('Failed to fetch incidents:', error);
      if (!silent) toast.error('Failed to load incidents');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [filters, showResolved]);

  useEffect(() => {
    // Initial load (not silent)
    fetchIncidents();

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
  }, [fetchIncidents, silentRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Listen for real-time acknowledgment updates
  useEffect(() => {
    const handleAcknowledgment = (event: Event) => {
      const customEvent = event as CustomEvent;
      const data = customEvent.detail;

      // console.log('🔄 Real-time acknowledgment update:', data);

      // Update the incident in the list with new acknowledgment data
      setIncidents((prevIncidents) =>
        prevIncidents.map((incident) =>
          incident.incidentId === data.incidentId
            ? {
                ...incident,
                acknowledgmentCount: data.acknowledgedCount,
                acknowledgmentPercentage: data.acknowledgmentPercentage,
                totalPersonnelNotified: data.totalPersonnelNotified,
              }
            : incident
        )
      );
    };

    window.addEventListener('incident:acknowledged', handleAcknowledgment);
    return () => {
      window.removeEventListener('incident:acknowledged', handleAcknowledgment);
    };
  }, []);

  // Set up socket.io listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleIncidentCreated = (incident: Incident) => {
      // console.log('🆕 Incidents: New incident received', incident);

      // Priority-based handling
      const priorityConfig = getPriorityConfig(incident.priority, incident.type);

      // Only add the incident if it matches the current filters
      const shouldAddIncident = shouldIncidentBeDisplayed(incident);

      if (shouldAddIncident) {
        setIncidents((prev) => [incident, ...prev]);
        setPagination(prev => ({
          ...prev,
          total: prev.total + 1
        }));

        // Priority-based notification
        toast[priorityConfig.toastType](priorityConfig.message, {
          description: incident.title,
          duration: priorityConfig.duration,
          action: priorityConfig.showAction ? {
            label: 'View Incident',
            onClick: () => {
              const id = incident.incidentId;
              if (id) {
                // Scroll to the new incident
                setTimeout(() => {
                  const element = document.getElementById(`incident-${id}`);
                  element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
              }
            },
          } : undefined,
        });
      }

      // Update refresh trigger for statistics
      setRefreshTrigger(prev => prev + 1);
    };

    // Handle new incident with centralized alert
    const handleNewIncidentAlert = (incident: Incident) => {
      try {
        // Use centralized alert hook for sound + toast
        incidentAlert.handleNewIncident(incident);

        const id = incident.incidentId;
        if (id) {
          // Flash the incident card
          setFlashIds(prev => new Set(Array.from(prev).concat(id)));

          // Remove flash state after 12s
          setTimeout(() => {
            setFlashIds(prev => {
              const copy = new Set(prev);
              copy.delete(id);
              return copy;
            });
          }, 12000);

          // Scroll container to top so the new incident is visible
          setTimeout(() => {
            try {
              if (listContainerRef.current) {
                listContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            } catch {
              // ignore
            }
          }, 100);
        }
      } catch {
        // ignore
      }
    };

    const handleIncidentInvalidated = (data: { incidentId: string }) => {
      console.log('⛔ Real-time incident invalidated:', data);
      setIncidents((prev) => prev.filter(i => i.incidentId !== data.incidentId));
      setRefreshTrigger(prev => prev + 1);
    };

    const handleIncidentUpdated = (incident: Incident) => {
      console.log('📝 Real-time incident update:', incident);

      // Update the incident in the list
      setIncidents((prev) => {
        const incidentExists = prev.some(i => i.incidentId === incident.incidentId);
        const shouldDisplayIncident = shouldIncidentBeDisplayed(incident);

        // If the incident exists in our list but shouldn't anymore based on filters
        if (incidentExists && !shouldDisplayIncident) {
          return prev.filter(i => i.incidentId !== incident.incidentId);
        }

        // If the incident exists and should still be displayed, update it
        if (incidentExists && shouldDisplayIncident) {
          return prev.map(i => i.incidentId === incident.incidentId ? incident : i);
        }

        // If the incident doesn't exist but should be displayed, add it
        if (!incidentExists && shouldDisplayIncident) {
          return [incident, ...prev];
        }

        // Otherwise, don't change anything
        return prev;
      });

      // Update refresh trigger for statistics
      setRefreshTrigger(prev => prev + 1);
    };

    const handleIncidentDeleted = (incidentId: string) => {
      // console.log('🗑️ Real-time incident deletion:', incidentId);

      // Remove the incident from the list
      setIncidents((prev) => prev.filter(i => i.incidentId !== incidentId));
      setPagination(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1)
      }));

      // Update refresh trigger for statistics
      setRefreshTrigger(prev => prev + 1);
          };

    const handleIncidentStatusChanged = (data: { incidentId?: string; id?: string; status: string }) => {
      console.log('🔄 Real-time status change:', data);
      
      const incidentId = data.incidentId || data.id;
      if (!incidentId) return;

      // Update the incident status in the list
      setIncidents((prev) =>
        prev.map((incident) =>
          incident.incidentId === incidentId
            ? { ...incident, status: data.status as IncidentStatus }
            : incident
        )
      );

      // Update refresh trigger for statistics
      setRefreshTrigger(prev => prev + 1);
    };

    const handleIncidentResolved = (data: { incidentId: string }) => {
      // console.log('✅ Real-time incident resolved:', data);

      // If showResolved is false, we should remove this incident from the list
      if (!showResolved) {
        setIncidents((prev) => prev.filter(i => i.incidentId !== data.incidentId));
      } else {
        // Otherwise update it
        setIncidents((prev) =>
          prev.map(i => i.incidentId === data.incidentId
            ? { ...i, status: 'RESOLVED', resolvedAt: new Date().toISOString() }
            : i
          )
        );
      }

      // Update refresh trigger for statistics
      setRefreshTrigger(prev => prev + 1);
    };

    // Register socket event listeners
    socket.on('incident:created', handleIncidentCreated);
    socket.on('incident:created', handleNewIncidentAlert);
    socket.on('incident:updated', handleIncidentUpdated);
    socket.on('incident:deleted', handleIncidentDeleted);
    socket.on('incident:status', handleIncidentStatusChanged);
    socket.on('incident:status-changed', handleIncidentStatusChanged);  // Backend uses this event name
    socket.on('incident:resolved', handleIncidentResolved);
    socket.on('incident:invalidated', handleIncidentInvalidated);
    
    // Listen for real-time personnel response updates from socket
    socket.on('incident:assigned', (data) => {
      // Trigger personnel response update when incident is assigned
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('personnel:response', {
          detail: { incidentId: data.incidentId, responderCount: data.responderCount || 1 }
        }));
      }, 1000);
    });

    // Update connection status display
    if (isConnected) {
      toast.success('Real-time updates connected', {
        id: 'socket-connection',
        duration: 2000,
      });
    }

    return () => {
      socket.off('incident:created', handleIncidentCreated);
      socket.off('incident:created', handleNewIncidentAlert);
      socket.off('incident:updated', handleIncidentUpdated);
      socket.off('incident:deleted', handleIncidentDeleted);
      socket.off('incident:status', handleIncidentStatusChanged);
      socket.off('incident:resolved', handleIncidentResolved);
      socket.off('incident:invalidated', handleIncidentInvalidated);
      socket.off('incident:assigned', () => {});
    };
  }, [socket, isConnected, shouldIncidentBeDisplayed, showResolved, incidentAlert]);



  const applyFilters = () => {
    setFilters((prev) => ({ ...prev, page: 1 }));
    fetchIncidents();
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      priority: [],
      type: [],
      search: "",
      sortBy: "createdAt",
      sortOrder: "desc",
      page: 1,
      limit: 20,
    });
    setTimeout(fetchIncidents, 100);
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === incidents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(incidents.map(inc => inc.incidentId)));
    }
  };


  return (
    <div className="px-4 lg:px-6 xl:px-8">
      <div className="space-y-6">
        {/* Incident Header */}
        <IncidentHeader
          isLoading={isLoading}
          onRefresh={fetchIncidents}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Statistics Dashboard */}
        <IncidentStatsDashboard refreshTrigger={refreshTrigger} />

        {/* Search and Filters */}
        <IncidentSearchBar
          filters={filters}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          onFilterChange={setFilters}
          onApply={applyFilters}
          onClear={clearFilters}
          onSearchKeyPress={(e) => e.key === "Enter" && applyFilters()}
        />

        {/* Incidents Display */}
        <div ref={listContainerRef}>
          {viewMode === "list" ? (
            <IncidentTable
              incidents={incidents}
              isLoading={isLoading}
              selectedIds={selectedIds}
              onToggleSelectAll={toggleSelectAll}
              flashIds={flashIds}
            />
          ) : (
            <IncidentGrid
              incidents={incidents}
              isLoading={isLoading}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onRefresh={fetchIncidents}
              flashIds={flashIds}
            />
          )}
        </div>
      </div>
    </div>
  );
}
