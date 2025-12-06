import { useState, useEffect, useRef, useCallback } from 'react';
import { Activity, AlertTriangle, CheckSquare, Clock, Users, Bell } from 'lucide-react';
import { incidentService } from "@/services/incident.service";
import type { IncidentStatistics } from "@/types/incident.types";
import { useSocket } from "@/hooks/useSocket";

interface IncidentStatsDashboardProps {
  refreshTrigger?: number;
}

export function IncidentStatsDashboard({ refreshTrigger = 0 }: IncidentStatsDashboardProps) {
  const [stats, setStats] = useState<IncidentStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { socket } = useSocket();
  const [error, setError] = useState<string | null>(null);
  const autoRefreshIntervalRef = useRef<number | null>(null);

  const fetchStats = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setIsLoading(true);
      }
      setError(null);
      const data = await incidentService.getIncidentStatistics();
      setStats(data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load incident statistics';
      setError(errorMessage);
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Setup auto-refresh interval (30 seconds)
    autoRefreshIntervalRef.current = setInterval(() => {
      fetchStats(true); // Silent refresh
    }, 30000);

    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
      }
    };
  }, [refreshTrigger, fetchStats]);

  // Listen for WebSocket events that should trigger stats refresh
  useEffect(() => {
    if (!socket) return;

    const handleIncidentCreated = () => {
      fetchStats(true);
    };

    const handleIncidentUpdated = () => {
      fetchStats(true);
    };

    const handleIncidentDeleted = () => {
      fetchStats(true);
    };

    const handleIncidentResolved = () => {
      fetchStats(true);
    };

    socket.on('incident:created', handleIncidentCreated);
    socket.on('incident:updated', handleIncidentUpdated);
    socket.on('incident:deleted', handleIncidentDeleted);
    socket.on('incident:resolved', handleIncidentResolved);

    return () => {
      socket.off('incident:created', handleIncidentCreated);
      socket.off('incident:updated', handleIncidentUpdated);
      socket.off('incident:deleted', handleIncidentDeleted);
      socket.off('incident:resolved', handleIncidentResolved);
    };
  }, [socket, fetchStats]);

  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-8 bg-gray-200 rounded w-24"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-lg border border-gray-200"></div>
          ))}
        </div>
      </div>
    );
  }

  // Even if there's an error, we'll show an empty dashboard with the title
  // rather than showing an error message to the user
  if (error) {
    // Error is logged for debugging but hidden from UI
  }

  // If no stats are available (either from error or missing data), show empty dashboard
  if (!stats && !isLoading) {
    return (
      <div className="w-full bg-linear-to-br from-white to-gray-50 rounded-xl border border-gray-200 shadow-sm p-6 relative overflow-hidden">
        {/* Enterprise background pattern */}
        <div className="absolute inset-0 z-0 opacity-[0.03] enterprise-pattern"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Incident Overview
            </h2>
          </div>

          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Activity className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">Statistics currently unavailable</p>
            <p className="text-sm text-gray-400">Check back later for incident statistics</p>
          </div>
        </div>
      </div>
    );
  }

  // At this point we know stats is not null because of our conditional checks above
  // Use non-null assertion since we've already checked for null
  
  // Prepare stat cards data
  const statCards = [
    {
      title: 'Active Incidents',
      value: stats?.activeIncidentsCount || 0,
      change: stats?.activeIncidentsPercentChange,
      icon: <Activity className="h-5 w-5 text-blue-500" />,
      color: 'bg-blue-50 border-blue-100',
      textColor: 'text-blue-600',
      inverted: false
    },
    {
      title: 'Critical Priority',
      value: stats?.criticalIncidentsCount || 0,
      change: stats?.criticalIncidentsPercentChange,
      icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
      color: 'bg-red-50 border-red-100',
      textColor: 'text-red-600',
      inverted: true
    },
    {
      title: 'Resolved Today',
      value: stats?.resolvedTodayCount || 0,
      change: undefined, // Not available in current API
      icon: <CheckSquare className="h-5 w-5 text-green-500" />,
      color: 'bg-green-50 border-green-100',
      textColor: 'text-green-600'
    },
    {
      title: 'Available',
      value: stats?.availablePersonnelCount || 0,
      change: undefined, // Not available in current API
      icon: <Clock className="h-5 w-5 text-orange-500" />,
      color: 'bg-orange-50 border-orange-100',
      textColor: 'text-orange-600'
    }
  ];

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200/60 shadow-lg overflow-hidden">
      {/* Main Content */}
      <div className="p-3 bg-linear-to-br from-gray-50/50 to-white">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* Main Stats Cards */}
          {statCards.map((card, index) => (
            <div 
              key={index} 
              className={`${card.color} rounded-lg border p-2 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] cursor-pointer group`}
            >
              <div className="flex items-start justify-between">
                <div className="p-1.5 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm border border-gray-100/50 group-hover:shadow-md transition-all">
                  {card.icon}
                </div>
                {card.change !== undefined && (
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full flex items-center shadow-sm ${
                      card.inverted 
                        ? card.change < 0 
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-red-100 text-red-700 border border-red-200'
                        : card.change > 0 
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                      {card.inverted ? (card.change < 0 ? '+' : '-') : (card.change > 0 ? '+' : '')}{Math.abs(card.change)}%
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-2">
                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{card.title}</h3>
                <p className={`text-xl font-bold mt-1 ${card.textColor} tracking-tight`}>{card.value}</p>
              </div>
            </div>
          ))}
          
          {/* Personnel Status Card */}
          <div className="bg-white rounded-lg border border-gray-200/60 p-2 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <div className="p-1 bg-blue-500/10 rounded-lg border border-blue-200/50">
                  <Users className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-900">Personnel Status</h3>
                  <p className="text-xs text-gray-500">Team deployment</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="bg-linear-to-br from-blue-50 to-blue-100/50 rounded-lg p-2 border border-blue-200/50 hover:border-blue-300/70 transition-all">
                <div className="flex items-center gap-1 mb-0.5">
                  <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                  <p className="text-xs font-semibold text-blue-700">Available</p>
                </div>
                <p className="text-base font-bold text-blue-800">{stats!.availablePersonnelCount || 0}</p>
              </div>
              <div className="bg-linear-to-br from-orange-50 to-orange-100/50 rounded-lg p-2 border border-orange-200/50 hover:border-orange-300/70 transition-all">
                <div className="flex items-center gap-1 mb-0.5">
                  <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                  <p className="text-xs font-semibold text-orange-700">Responding</p>
                </div>
                <p className="text-base font-bold text-orange-800">{stats!.respondingPersonnelCount || 0}</p>
              </div>
              <div className="bg-linear-to-br from-green-50 to-green-100/50 rounded-lg p-2 border border-green-200/50 hover:border-green-300/70 transition-all">
                <div className="flex items-center gap-1 mb-0.5">
                  <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                  <p className="text-xs font-semibold text-green-700">On Scene</p>
                </div>
                <p className="text-base font-bold text-green-800">{stats!.onScenePersonnelCount || 0}</p>
              </div>
              <div className="bg-linear-to-br from-gray-50 to-gray-100/50 rounded-lg p-2 border border-gray-200/50 hover:border-gray-300/70 transition-all">
                <div className="flex items-center gap-1 mb-0.5">
                  <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                  <p className="text-xs font-semibold text-gray-700">Off Duty</p>
                </div>
                <p className="text-base font-bold text-gray-800">{stats!.offDutyPersonnelCount || 0}</p>
              </div>
            </div>
          </div>

          {/* Incident Distribution Card */}
          <div className="bg-white rounded-lg border border-gray-200/60 p-2 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <div className="p-1 bg-purple-500/10 rounded-lg border border-purple-200/50">
                  <Bell className="h-3.5 w-3.5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-900">Incident Distribution</h3>
                  <p className="text-xs text-gray-500">Status breakdown</p>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <div className="w-14 text-xs font-semibold text-gray-600">Pending</div>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-linear-to-r from-red-500 to-red-600 rounded-full transition-all duration-500" style={{width: `${stats?.pendingVerificationPercent || 0}%`}}></div>
                </div>
                <div className="w-8 text-xs font-bold text-gray-700">{stats?.pendingVerificationPercent || 0}%</div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-14 text-xs font-semibold text-gray-600">Verified</div>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-linear-to-r from-gray-500 to-gray-600 rounded-full transition-all duration-500" style={{width: `${stats?.verifiedPercent || 0}%`}}></div>
                </div>
                <div className="w-8 text-xs font-bold text-gray-700">{stats?.verifiedPercent || 0}%</div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-14 text-xs font-semibold text-gray-600">Responding</div>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-linear-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-500" style={{width: `${stats?.respondingPercent || 0}%`}}></div>
                </div>
                <div className="w-8 text-xs font-bold text-gray-700">{stats?.respondingPercent || 0}%</div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-14 text-xs font-semibold text-gray-600">On Scene</div>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-linear-to-r from-green-500 to-green-600 rounded-full transition-all duration-500" style={{width: `${stats?.arrivedPercent || 0}%`}}></div>
                </div>
                <div className="w-8 text-xs font-bold text-gray-700">{stats?.arrivedPercent || 0}%</div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-14 text-xs font-semibold text-gray-600">Resolved</div>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-linear-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500" style={{width: `${stats?.resolvedPercent || 0}%`}}></div>
                </div>
                <div className="w-8 text-xs font-bold text-gray-700">{stats?.resolvedPercent || 0}%</div>
              </div>
              {/* Closed/Cancelled removed to strictly follow active workflow statuses */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
