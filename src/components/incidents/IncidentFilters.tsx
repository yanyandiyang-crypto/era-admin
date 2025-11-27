import { Filter, X, CheckCircle, AlertTriangle, Info } from "lucide-react";
import type { IncidentFilters as Filters, IncidentStatus, IncidentPriority, IncidentType } from "@/types/incident.types";
import { Button } from "@/components/ui/button";

interface IncidentFiltersProps {
  filters: Filters;
  showFilters: boolean;
  onToggleFilters: () => void;
  onFilterChange: (filters: Filters) => void;
  onApply: () => void;
  onClear: () => void;
}

export function IncidentFilters({
  filters,
  showFilters,
  onToggleFilters,
  onFilterChange,
  onApply,
  onClear,
}: IncidentFiltersProps) {
  const getStatusColor = (status: IncidentStatus) => {
    const colors: Record<IncidentStatus, string> = {
      PENDING_VERIFICATION: "bg-red-100 text-red-800 border-red-200",
      VERIFIED: "bg-gray-100 text-gray-800 border-gray-200",
      REPORTED: "bg-blue-100 text-blue-800 border-blue-200",
      ACKNOWLEDGED: "bg-violet-100 text-violet-800 border-violet-200",
      DISPATCHED: "bg-purple-100 text-purple-800 border-purple-200",
      IN_PROGRESS: "bg-indigo-100 text-indigo-800 border-indigo-200",
      RESPONDING: "bg-orange-100 text-orange-800 border-orange-200",
      ARRIVED: "bg-green-100 text-green-800 border-green-200",
      PENDING_RESOLVE: "bg-yellow-100 text-yellow-800 border-yellow-200",
      RESOLVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
      CLOSED: "bg-blue-100 text-blue-800 border-blue-200",
      CANCELLED: "bg-rose-100 text-rose-800 border-rose-200",
      SPAM: "bg-red-50 text-red-600 border-red-200"
    };
    return colors[status];
  };
  
  // Status display names
  const getStatusDisplayName = (status: IncidentStatus): string => {
    const displayNames: Record<IncidentStatus, string> = {
      PENDING_VERIFICATION: "Pending Verification",
      VERIFIED: "Verified",
      REPORTED: "Reported",
      ACKNOWLEDGED: "Acknowledged",
      DISPATCHED: "Dispatched",
      IN_PROGRESS: "In Progress",
      RESPONDING: "Responding",
      ARRIVED: "On Scene",
      PENDING_RESOLVE: "Pending Resolution",
      RESOLVED: "Resolved",
      CLOSED: "Closed",
      CANCELLED: "Cancelled",
      SPAM: "Spam"
    };
    return displayNames[status];
  };

  const getPriorityColor = (priority: IncidentPriority) => {
    const colors: Record<IncidentPriority, string> = {
      LOW: "bg-gray-100 text-gray-700 border-gray-300",
      MEDIUM: "bg-blue-100 text-blue-700 border-blue-300",
      HIGH: "bg-orange-100 text-orange-700 border-orange-300",
      CRITICAL: "bg-red-100 text-red-700 border-red-300",
    };
    return colors[priority];
  };

  const toggleArrayFilter = <T,>(field: keyof Filters, value: T) => {
    const current = (filters[field] as T[]) || [];
    const newValue = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFilterChange({ ...filters, [field]: newValue });
  };

  const activeFilterCount = 
    (filters.status?.length || 0) + 
    (filters.priority?.length || 0) + 
    (filters.type?.length || 0);

  return (
    <>
      <Button 
        onClick={onToggleFilters} 
        variant="outline"
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 h-10 px-5"
      >
        <Filter className="h-4 w-4 mr-2" />
        Filters
        {activeFilterCount > 0 && (
          <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full shadow-sm flex items-center gap-1">
            {activeFilterCount}
            <CheckCircle className="h-3 w-3" />
          </span>
        )}
      </Button>

      {showFilters && (
        <div className="mt-4 p-5 bg-white rounded-xl border-2 border-gray-200/60 shadow-lg animate-in slide-in-from-top-1 duration-300">
          {/* Filter Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg border border-blue-200">
                <Filter className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Filter Options</h3>
                <p className="text-sm text-gray-500">
                  {activeFilterCount > 0 
                    ? `${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} applied` 
                    : 'No filters applied'
                  }
                </p>
              </div>
            </div>
            {activeFilterCount > 0 && (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium border border-green-200">
                <CheckCircle className="h-4 w-4" />
                Active
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <label className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Status
              </label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {([
                "PENDING_VERIFICATION",
                "VERIFIED",
                "ACKNOWLEDGED",
                "DISPATCHED",
                "IN_PROGRESS",
                "RESPONDING",
                "ARRIVED",
                "RESOLVED",
                "CLOSED",
                "CANCELLED",
                "SPAM",
              ] as IncidentStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => toggleArrayFilter("status", status)}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all hover:shadow-sm ${
                    filters.status?.includes(status)
                      ? `${getStatusColor(status)} shadow-sm scale-105`
                      : "border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  {getStatusDisplayName(status)}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-blue-500" />
              <label className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Priority
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as IncidentPriority[]).map(
                (priority) => (
                  <button
                    key={priority}
                    onClick={() => toggleArrayFilter("priority", priority)}
                    className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all hover:shadow-sm ${
                      filters.priority?.includes(priority)
                        ? `${getPriorityColor(priority)} shadow-sm scale-105`
                        : "border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                    }`}
                  >
                    {priority}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Type Filter */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-purple-500" />
              <label className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Type
              </label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {(["FIRE", "MEDICAL", "ACCIDENT", "CRIME", "FLOOD", "NATURAL_DISASTER", "OTHER"] as IncidentType[]).map(
                (type) => (
                  <button
                    key={type}
                    onClick={() => toggleArrayFilter("type", type)}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all hover:shadow-sm ${
                      filters.type?.includes(type)
                        ? "bg-blue-100 text-blue-800 border-blue-200 shadow-sm scale-105"
                        : "border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                    }`}
                  >
                    {type.replace('_', ' ')}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <Button 
              onClick={onClear} 
              variant="outline" 
              size="sm"
              className="border-gray-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-all rounded-lg px-4 py-2"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
            <Button 
              onClick={onApply} 
              size="sm"
              className="bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg rounded-lg px-6 py-2 font-semibold"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
