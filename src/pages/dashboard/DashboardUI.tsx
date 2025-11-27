import { AlertCircle, Users, Activity, CheckCircle, ArrowRight, Clock, Flame, RefreshCcw, Eye, EyeOff } from "lucide-react";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { Button } from "@/components/ui/button";
import { BroadcastNotificationDialog } from "@/components/notifications/BroadcastNotificationDialog";
import { format, formatDistanceToNow } from "date-fns";
import type { DashboardOverview } from "@/types/dashboard.types";
import type { Incident } from "@/types/incident.types";

interface DashboardUIProps {
  // State values
  overview: DashboardOverview | null;
  recentIncidents: Incident[];
  isLoading: boolean;
  error: string | null;
  currentTime: Date;
  incidentTimes: Record<string, string>;
  isLiveSync: boolean;
  isBroadcastDialogOpen: boolean;
  focusMode: 'overview' | 'incidents' | 'personnel' | null;
  syncRelative: string;

  // Computed values
  criticalIncidents: number;
  quickFilters: Array<{
    label: string;
    description: string;
    query: string;
  }>;
  readinessMetrics: Array<{
    label: string;
    value: number;
    color: string;
    percent: number;
  }>;
  incidentMix: Array<{
    type: string;
    count: number;
    percent: number;
  }>;
  totalPersonnel: number;

  // Actions
  handleRefresh: () => void;
  setIsBroadcastDialogOpen: (open: boolean) => void;
  setFocusMode: (mode: 'overview' | 'incidents' | 'personnel' | null) => void;
  navigate: (path: string) => void;

  // Util functions
  getPriorityConfig: (priority: string, incidentType: string) => any;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  getGreeting: () => string;

  // Date functions
  format: typeof format;
  formatDistanceToNow: typeof formatDistanceToNow;
}

export function DashboardUI({
  overview,
  recentIncidents,
  isLoading,
  error,
  currentTime,
  incidentTimes,
  isLiveSync,
  isBroadcastDialogOpen,
  focusMode,
  syncRelative,
  criticalIncidents,
  quickFilters,
  readinessMetrics,
  incidentMix,
  totalPersonnel,
  handleRefresh,
  setIsBroadcastDialogOpen,
  setFocusMode,
  navigate,
  getStatusColor,
  getPriorityColor,
  getGreeting,
  format,
  formatDistanceToNow,
}: DashboardUIProps) {
  // Loading state
  if (isLoading && !overview) {
    return (
      <div className="space-y-6">
        <div className="h-40 bg-linear-to-r from-blue-600 to-blue-700 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <LoadingSkeleton variant="stat" count={4} />
        </div>
      </div>
    );
  }

  // Error state
  if (error && !overview) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Dashboard</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={handleRefresh}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section with Gradient */}
      <div className={`relative overflow-hidden bg-linear-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl shadow-2xl ${focusMode && focusMode !== 'overview' ? 'opacity-30 blur-sm' : ''}`}>
        {/* Decorative background patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -mr-48 -mt-48" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full -ml-48 -mb-48" />
        </div>

        <div className="relative p-6 md:p-8">
          {/* Top Right Controls */}
          <div className="absolute top-6 right-6 md:top-8 md:right-8 flex items-center gap-2">
            <div className="flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-blue-50">
              <Clock className="h-4 w-4 text-blue-100" />
              <div className="text-left">
                <span className="text-xs uppercase tracking-wide text-blue-100/70">
                  Live Time
                </span>
                <p className="text-sm font-semibold leading-tight font-mono">
                  {format(currentTime, 'hh:mm:ss a')}
                </p>
                <p className="text-[11px] text-blue-100/70 -mt-0.5">
                  {isLiveSync ? 'Live Sync Active' : `Synced ${syncRelative}`}
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsBroadcastDialogOpen(true)}
              className="relative h-9 px-3 bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
              title="Broadcast Notification"
            >
              <span className="sr-only">Broadcast Notification</span>
              📢
            </Button>
            <Button
              onClick={() => setFocusMode(focusMode ? null : 'overview')}
              className="relative h-9 px-3 bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
              title={focusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
            >
              {focusMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            {!isLiveSync && (
              <Button
                onClick={handleRefresh}
                disabled={isLoading}
                className="relative h-9 px-3 bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
                title="Refresh dashboard"
              >
                <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Greeting */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <span className="text-blue-100 text-sm font-medium">
                  {getGreeting()}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                IRA Dashboard
              </h1>
              <p className="text-blue-100">
                Incident Response Command Center
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Alert Banner */}
      {criticalIncidents > 0 && (
        <div className="bg-linear-to-r from-red-500 to-red-600 rounded-xl shadow-lg p-4 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <Flame className="h-6 w-6 text-white" />
            <div className="text-white">
              <p className="font-bold text-lg">{criticalIncidents} Critical Incidents</p>
              <p className="text-sm text-red-100">Require immediate attention</p>
            </div>
          </div>
          <Button
            onClick={() => navigate('/incidents?priority=CRITICAL')}
            className="bg-white text-red-600 hover:bg-red-50"
          >
            View Now
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Key Metrics */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${focusMode && focusMode !== 'overview' ? 'ring-4 ring-blue-500 ring-opacity-50 scale-105' : ''} transition-all duration-300`}>
        {/* Total Incidents */}
        <div className="group relative bg-gradient-to-br from-blue-50 via-blue-100/50 to-blue-200/30 rounded-xl shadow-md border border-blue-200/50 p-4 hover:shadow-lg hover:scale-102 transition-all duration-300 overflow-hidden cursor-pointer" onClick={() => navigate('/incidents')}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Total</span>
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <h3 className="text-4xl font-bold text-blue-900 mb-1">{overview?.incidents.total || 0}</h3>
            <p className="text-xs text-blue-700 font-medium">All Incidents</p>
            <div className="mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full inline-block">
              Last 24h: +{Math.floor((overview?.incidents.total || 0) * 0.1)} • Complexity: Low
            </div>
          </div>
        </div>

        {/* Resolved Incidents */}
        <div className="group relative bg-gradient-to-br from-green-50 via-green-100/50 to-green-200/30 rounded-xl shadow-md border border-green-200/50 p-4 hover:shadow-lg hover:scale-102 transition-all duration-300 overflow-hidden cursor-pointer" onClick={() => navigate('/incidents?status=RESOLVED')}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full -mr-16 -mt-16" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Resolved</span>
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <h3 className="text-4xl font-bold text-green-900 mb-1">{overview?.incidents.resolved || 0}</h3>
            <p className="text-xs text-green-700 font-medium">Completed</p>
            <div className="mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full inline-block">
              Success Rate: {overview?.incidents.total ? Math.round(((overview.incidents.resolved || 0) / overview.incidents.total) * 100) : 0}% • Trending ↑
            </div>
          </div>
        </div>

        {/* Available Personnel */}
        <div className="group relative bg-gradient-to-br from-purple-50 via-purple-100/50 to-purple-200/30 rounded-xl shadow-md border border-purple-200/50 p-4 hover:shadow-lg hover:scale-102 transition-all duration-300 overflow-hidden cursor-pointer" onClick={() => navigate('/personnel?status=AVAILABLE')}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -mr-16 -mt-16" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Available</span>
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <h3 className="text-4xl font-bold text-purple-900 mb-1">{overview?.personnel.available || 0}</h3>
            <p className="text-xs text-purple-700 font-medium">Personnel</p>
            <div className="mt-2 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full inline-block">
              Linked to {overview?.incidents.active || 0} active ops • Readiness: High
            </div>
          </div>
        </div>

        {/* Active Incidents */}
        <div className="group relative bg-gradient-to-br from-orange-50 via-orange-100/50 to-orange-200/30 rounded-xl shadow-md border border-orange-200/50 p-4 hover:shadow-lg hover:scale-102 transition-all duration-300 overflow-hidden cursor-pointer" onClick={() => navigate('/incidents?status=ACTIVE')}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Active</span>
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Activity className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <h3 className="text-4xl font-bold text-orange-900 mb-1">{overview?.incidents.active || 0}</h3>
            <p className="text-xs text-orange-700 font-medium">Attention</p>
          </div>
        </div>
      </div>

      {overview && (
        <div className={`grid grid-cols-1 xl:grid-cols-2 gap-6 ${focusMode === 'incidents' ? 'ring-4 ring-blue-500 ring-opacity-50 scale-105' : focusMode ? 'opacity-30 blur-sm' : ''} transition-all duration-300`}>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">Rapid Filters</p>
                <h3 className="text-lg font-bold text-gray-900">Jump back into the action</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/incidents')}
              >
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {quickFilters.map((filter) => (
                <button
                  key={filter.label}
                  onClick={() => navigate(`/incidents${filter.query}`)}
                  className="group text-left rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all p-4"
                >
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600">{filter.label}</p>
                  <p className="text-xs text-gray-500">{filter.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Responder Readiness</p>
                <h3 className="text-lg font-bold text-gray-900">Coverage snapshot</h3>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {totalPersonnel} total
              </span>
            </div>

            <div className="space-y-4">
              {readinessMetrics.map((metric) => (
                <div key={metric.label}>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span className="font-medium text-gray-900">{metric.label}</span>
                    <span className="font-semibold">
                      {metric.value}
                      <span className="text-gray-400 ml-1">({metric.percent}%)</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`${metric.color} h-full rounded-full`}
                      style={{ width: `${metric.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Analytics & Insights */}
      <div className="space-y-6">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex flex-col gap-4 p-6 border-b border-gray-100 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">Operational Analytics</p>
              <h3 className="text-xl font-bold text-gray-900 mt-1">Response Performance</h3>
              <p className="text-sm text-gray-500">
                Live resolution efficiency across the emergency network
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">
                {overview?.incidents.total
                  ? ((overview.incidents.resolved / overview.incidents.total) * 100).toFixed(1)
                  : "0.0"}
                %
              </p>
              <p className="text-xs font-medium text-gray-500">Resolution rate</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {[
              {
                label: "Avg Response",
                value: overview?.responseTime.average ?? 0,
                suffix: "min",
                accent: "text-blue-600",
              },
              {
                label: "Fastest Team",
                value: overview?.responseTime.fastest ?? 0,
                suffix: "min",
                accent: "text-green-600",
              },
              {
                label: "Slowest Case",
                value: overview?.responseTime.slowest ?? 0,
                suffix: "min",
                accent: "text-amber-600",
              },
            ].map((stat) => (
              <div key={stat.label} className="p-6">
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className={`text-2xl font-semibold ${stat.accent}`}>
                  {stat.value ?? "--"} <span className="text-base font-medium text-gray-500">{stat.suffix}</span>
                </p>
                <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600`}
                    style={{
                      width: `${Math.min(
                        stat.value && Number.isFinite(Number(stat.value))
                          ? (Number(stat.value) / Math.max(overview?.responseTime.slowest || 1, 1)) * 100
                          : 0,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 space-y-4">
            {[
              {
                label: "Active workload",
                value: overview?.incidents.active ?? 0,
                total: overview?.incidents.total ?? 0,
                color: "bg-orange-500",
              },
              {
                label: "Resolved cases",
                value: overview?.incidents.resolved ?? 0,
                total: overview?.incidents.total ?? 0,
                color: "bg-green-500",
              },
              {
                label: "Filed today",
                value: overview?.incidents.today ?? 0,
                total: overview?.incidents.total ?? 0,
                color: "bg-blue-500",
              },
            ].map((item) => {
              const percentage = item.total ? (item.value / item.total) * 100 : 0;
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span className="font-medium text-gray-900">{item.label}</span>
                    <span>
                      {item.value} / {item.total || 0}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`${item.color} h-full rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Live Timeline</p>
                <h3 className="text-lg font-bold text-gray-900">Incident stream</h3>
                <p className="text-sm text-gray-500">Tap an event to open the record</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/incidents')}
                className="text-blue-600 hover:text-blue-700"
              >
                View log
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            {recentIncidents.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-500">No recent incidents</div>
            ) : (
              <div className="relative pl-4">
                <span className="absolute left-1 top-0 bottom-0 w-0.5 bg-gray-200 rounded-full" />
                <div className="space-y-4">
                  {recentIncidents.map((incident) => (
                    <button
                      key={incident.incidentId || (incident as { id?: string }).id}
                      onClick={() =>
                        navigate(`/incidents/${incident.incidentId || (incident as { id?: string }).id}`)
                      }
                      className="w-full text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-blue-500 relative left-[-1.25rem]" />
                        <div className="flex-1 rounded-xl border border-gray-100 bg-gray-50/60 group-hover:border-blue-200 group-hover:bg-blue-50/60 transition-all p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-gray-900">{incident.title || incident.description}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(incident.status)}`}>
                              {incident.status}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                            <span className={getPriorityColor(incident.priority)}>
                              {incident.priority}
                            </span>
                            <span className="font-mono text-xs">{incidentTimes[incident.incidentId] || formatDistanceToNow(new Date(incident.reportedAt), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Incident Mix</p>
                <h3 className="text-lg font-bold text-gray-900">Recent categories</h3>
              </div>
              <span className="text-sm text-gray-500">{recentIncidents.length} tracked</span>
            </div>

            {incidentMix.length === 0 ? (
              <p className="text-sm text-gray-500">No recent incident data</p>
            ) : (
              <div className="space-y-3">
                {incidentMix.map((entry) => (
                  <div key={entry.type} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm font-medium text-gray-700 capitalize">
                        <span>{entry.type.toLowerCase()}</span>
                        <span>{entry.count} ({entry.percent}%)</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                          style={{ width: `${entry.percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <BroadcastNotificationDialog
        open={isBroadcastDialogOpen}
        onOpenChange={setIsBroadcastDialogOpen}
      />
    </div>
  );
}
