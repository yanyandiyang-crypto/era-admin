import { Search, Filter, ChevronUp, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { IncidentFilters, IncidentStatus, IncidentType, IncidentPriority } from "@/types/incident.types";

type ArrayFilterKey = keyof Pick<IncidentFilters, 'status' | 'priority' | 'type' | 'barangayId'>;
type BooleanFilterKey = keyof Pick<IncidentFilters, 'hasPhotos' | 'hasAssignedPersonnel'>;

interface ReportsFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: (show: boolean) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  filters: IncidentFilters;
  clearFilters: () => void;
  toggleArrayFilter: (key: ArrayFilterKey, value: string) => void;
  removeArrayFilterValue: (key: ArrayFilterKey, value: string) => void;
  toggleBooleanFilter: (key: BooleanFilterKey) => void;
  updateFilter: (key: keyof IncidentFilters, value: IncidentFilters[keyof IncidentFilters]) => void;
}

const INCIDENT_STATUSES: IncidentStatus[] = [
  "PENDING_VERIFICATION",
  "VERIFIED",
  "REPORTED",
  "ACKNOWLEDGED",
  "DISPATCHED",
  "IN_PROGRESS",
  "RESPONDING",
  "ARRIVED",
  "PENDING_RESOLVE",
  "RESOLVED",
  "CLOSED"
];

const INCIDENT_PRIORITIES: IncidentPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const INCIDENT_TYPES: IncidentType[] = ["FIRE", "MEDICAL", "ACCIDENT", "CRIME", "FLOOD", "NATURAL_DISASTER", "OTHER"];

const STATUS_LABELS: Record<string, { label: string; description: string }> = {
  PENDING_VERIFICATION: { label: "Pending Verification", description: "Awaiting validation" },
  VERIFIED: { label: "Verified", description: "Confirmed by command center" },
  REPORTED: { label: "Reported", description: "Initial intake logged" },
  ACKNOWLEDGED: { label: "Acknowledged", description: "Command acknowledged the case" },
  DISPATCHED: { label: "Dispatched", description: "Team dispatched to location" },
  IN_PROGRESS: { label: "In Progress", description: "Legacy responding state" },
  RESPONDING: { label: "Responding", description: "Team en route" },
  ARRIVED: { label: "Arrived", description: "Team on scene" },
  PENDING_RESOLVE: { label: "Pending Resolution", description: "Awaiting admin confirmation" },
  RESOLVED: { label: "Resolved", description: "Marked as resolved" },
  CLOSED: { label: "Closed", description: "Fully closed and documented" },
  CANCELLED: { label: "Cancelled", description: "Cancelled by admin" },
  SPAM: { label: "Spam", description: "Flagged as invalid" }
};

const PRIORITY_LABELS: Record<string, { label: string; description: string }> = {
  LOW: { label: "Low", description: "Monitor as needed" },
  MEDIUM: { label: "Medium", description: "Requires timely follow-up" },
  HIGH: { label: "High", description: "Time-sensitive response" },
  CRITICAL: { label: "Critical", description: "All hands on deck" }
};

const TYPE_LABELS: Record<string, { label: string; description: string }> = {
  FIRE: { label: "Fire", description: "Structural or wild fire" },
  MEDICAL: { label: "Medical", description: "Medical emergency" },
  ACCIDENT: { label: "Accident", description: "Vehicular / on-site accidents" },
  CRIME: { label: "Crime", description: "Law enforcement support" },
  FLOOD: { label: "Flood", description: "Water-related incident" },
  NATURAL_DISASTER: { label: "Natural Disaster", description: "Typhoon, quake, etc." },
  OTHER: { label: "Other", description: "Miscellaneous incidents" }
};

const QUICK_FILTERS: { key: BooleanFilterKey; label: string; description: string }[] = [
  { key: "hasPhotos", label: "With Photos", description: "Incidents with visual evidence" },
  { key: "hasAssignedPersonnel", label: "Assigned Teams", description: "Incidents with responders" }
];

const SORT_OPTIONS = [
  { value: "createdAt", label: "Created date", description: "Newest reports first" },
  { value: "updatedAt", label: "Updated date", description: "Recently touched" },
  { value: "priority", label: "Priority", description: "Criticality driven" },
  { value: "responseTime", label: "Response time", description: "Best response speed" },
  { value: "status", label: "Status", description: "Workflow stage" }
];

const SORT_ORDER_OPTIONS = [
  { value: "desc", label: "Descending", description: "Newest / highest first" },
  { value: "asc", label: "Ascending", description: "Oldest / lowest first" }
];

export default function ReportsFilters({
  searchQuery,
  setSearchQuery,
  showAdvancedFilters,
  setShowAdvancedFilters,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  filters,
  clearFilters,
  toggleArrayFilter,
  removeArrayFilterValue,
  toggleBooleanFilter,
  updateFilter,
}: ReportsFiltersProps) {
  const activeFilterCount =
    (filters.status?.length ?? 0) +
    (filters.priority?.length ?? 0) +
    (filters.type?.length ?? 0) +
    (filters.barangayId?.length ?? 0) +
    (filters.hasPhotos ? 1 : 0) +
    (filters.hasAssignedPersonnel ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50/30 to-blue-50/50 rounded-2xl shadow-lg border border-white/40 backdrop-blur-xl p-4">
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.05),_transparent_50%)]" />
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full -mr-12 -mt-12" />
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-emerald-400/10 to-teal-400/10 rounded-full -ml-8 -mb-8" />

      <div className="relative space-y-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
            <label className="text-sm font-semibold text-slate-800 tracking-tight">
              Search Incidents
            </label>
            <div className="flex-1 h-px bg-gradient-to-r from-blue-200 via-blue-100 to-transparent ml-2"></div>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative bg-white/60 backdrop-blur-lg border border-white/50 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 group-hover:text-blue-600 transition-colors duration-200" />
                <input
                  type="text"
                  placeholder="Search incidents by title, description, location, reporter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-transparent text-slate-800 placeholder-slate-400 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-400/50 transition-all duration-300"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-50/30 to-purple-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
              hasActiveFilters ? 'bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse' : 'bg-slate-300'
            }`}></div>
            <div className="flex items-center gap-1.5">
              <Filter className={`h-3.5 w-3.5 transition-colors duration-300 ${
                hasActiveFilters ? 'text-blue-600' : 'text-slate-400'
              }`} />
              {hasActiveFilters ? (
                <div className="flex items-center gap-1">
                  <span className="text-slate-800 font-semibold text-xs">{activeFilterCount}</span>
                  <span className="text-slate-600 font-medium text-xs">filters</span>
                  <div className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded border border-blue-200">
                    ACTIVE
                  </div>
                </div>
              ) : (
                <span className="text-slate-500 font-medium text-xs">No filters</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="relative group flex items-center gap-1.5 rounded-full px-4 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 overflow-hidden text-xs"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative font-semibold">Filter</span>
              <div className="relative">
                {showAdvancedFilters ? (
                  <ChevronUp className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110" />
                )}
              </div>
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-[10px] text-slate-500 hover:text-red-600 font-medium rounded-full px-3 py-1 border border-slate-200 hover:border-red-200 bg-white/40 hover:bg-red-50/40 backdrop-blur-sm transition-all duration-300 hover:scale-105"
              >
                <X className="h-2.5 w-2.5 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {hasActiveFilters && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 flex flex-wrap gap-2">
            {filters.status?.map((status: string) => (
              <button
                key={`status-chip-${status}`}
                onClick={() => removeArrayFilterValue("status", status)}
                className="group inline-flex items-center gap-2 rounded-full bg-white/80 text-sm font-medium text-gray-700 border border-blue-200 px-3 py-1.5 transition hover:border-blue-500 hover:text-blue-600"
              >
                <span className="text-xs uppercase text-gray-400">Status</span>
                {STATUS_LABELS[status].label}
                <X className="h-3 w-3 opacity-60 group-hover:opacity-100" />
              </button>
            ))}
            {filters.priority?.map((priority: string) => (
              <button
                key={`priority-chip-${priority}`}
                onClick={() => removeArrayFilterValue("priority", priority)}
                className="group inline-flex items-center gap-2 rounded-full bg-white/80 text-sm font-medium text-gray-700 border border-orange-200 px-3 py-1.5 transition hover:border-orange-400 hover:text-orange-600"
              >
                <span className="text-xs uppercase text-gray-400">Priority</span>
                {PRIORITY_LABELS[priority].label}
                <X className="h-3 w-3 opacity-60 group-hover:opacity-100" />
              </button>
            ))}
            {filters.type?.map((type: string) => (
              <button
                key={`type-chip-${type}`}
                onClick={() => removeArrayFilterValue("type", type)}
                className="group inline-flex items-center gap-2 rounded-full bg-white/80 text-sm font-medium text-gray-700 border border-purple-200 px-3 py-1.5 transition hover:border-purple-400 hover:text-purple-600"
              >
                <span className="text-xs uppercase text-gray-400">Type</span>
                {TYPE_LABELS[type].label}
                <X className="h-3 w-3 opacity-60 group-hover:opacity-100" />
              </button>
            ))}
            {filters.hasPhotos && (
              <button
                onClick={() => toggleBooleanFilter("hasPhotos")}
                className="group inline-flex items-center gap-2 rounded-full bg-white/90 text-sm font-medium text-gray-700 border border-emerald-200 px-3 py-1.5 transition hover:border-emerald-400 hover:text-emerald-600"
              >
                <span className="text-xs uppercase text-gray-400">Quick</span>
                With photos
                <X className="h-3 w-3 opacity-60 group-hover:opacity-100" />
              </button>
            )}
            {filters.hasAssignedPersonnel && (
              <button
                onClick={() => toggleBooleanFilter("hasAssignedPersonnel")}
                className="group inline-flex items-center gap-2 rounded-full bg-white/90 text-sm font-medium text-gray-700 border border-sky-200 px-3 py-1.5 transition hover:border-sky-400 hover:text-sky-600"
              >
                <span className="text-xs uppercase text-gray-400">Quick</span>
                Assigned teams
                <X className="h-3 w-3 opacity-60 group-hover:opacity-100" />
              </button>
            )}
          </div>
        )}

        {showAdvancedFilters && (
          <div className="border-t border-gray-100 pt-4">
            {/* Date Range - Top Row */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide">When</p>
                  <h3 className="text-sm font-semibold text-gray-900">Date Range</h3>
                </div>
                <div className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                  {(() => {
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    const diffTime = Math.abs(end.getTime() - start.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                    return diffDays === 1 ? '1d' : `${diffDays}d`;
                  })()}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-medium text-gray-700">From:</label>
                    <input
                      id="start-date-input"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-center w-4 h-4">
                    <div className="w-2.5 h-px bg-gray-400" />
                    <div className="w-0 h-0 border-l-[1.5px] border-l-transparent border-r-[1.5px] border-r-transparent border-b-[2px] border-b-gray-400 rotate-90 -ml-0.5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-medium text-gray-700">To:</label>
                    <input
                      id="end-date-input"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Incident Types Module */}
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide">Type</p>
                    <h4 className="text-sm font-semibold text-gray-900">Incident Types</h4>
                  </div>
                  <div className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    {filters.type?.length ?? 0}/{INCIDENT_TYPES.length}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {INCIDENT_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => toggleArrayFilter("type", type)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        filters.type?.includes(type)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {TYPE_LABELS[type].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Module */}
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs font-semibold text-green-500 uppercase tracking-wide">State</p>
                    <h4 className="text-sm font-semibold text-gray-900">Status</h4>
                  </div>
                  <div className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                    {filters.status?.length ?? 0}/{INCIDENT_STATUSES.length}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {INCIDENT_STATUSES.map((status) => (
                    <button
                      key={status}
                      onClick={() => toggleArrayFilter("status", status)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        filters.status?.includes(status)
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority Module */}
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs font-semibold text-red-500 uppercase tracking-wide">Level</p>
                    <h4 className="text-sm font-semibold text-gray-900">Priority</h4>
                  </div>
                  <div className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                    {filters.priority?.length ?? 0}/{INCIDENT_PRIORITIES.length}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {INCIDENT_PRIORITIES.map((priority) => (
                    <button
                      key={priority}
                      onClick={() => toggleArrayFilter("priority", priority)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        filters.priority?.includes(priority)
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {PRIORITY_LABELS[priority].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Signals Module */}
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs font-semibold text-purple-500 uppercase tracking-wide">Quick</p>
                    <h4 className="text-sm font-semibold text-gray-900">Signals</h4>
                  </div>
                  <div className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                    {QUICK_FILTERS.filter(({ key }) => filters[key]).length}/{QUICK_FILTERS.length}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {QUICK_FILTERS.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => toggleBooleanFilter(key)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        filters[key]
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Module */}
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">Order</p>
                    <h4 className="text-sm font-semibold text-gray-900">Sort By</h4>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateFilter("sortBy", option.value)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        filters.sortBy === option.value
                          ? 'bg-indigo-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Direction Module */}
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs font-semibold text-teal-500 uppercase tracking-wide">Dir</p>
                    <h4 className="text-sm font-semibold text-gray-900">Direction</h4>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {SORT_ORDER_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateFilter("sortOrder", option.value)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        filters.sortOrder === option.value
                          ? 'bg-teal-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
