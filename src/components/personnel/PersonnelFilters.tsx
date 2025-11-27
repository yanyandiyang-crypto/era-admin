import { Filter, X } from "lucide-react";
import type { PersonnelFilters as Filters, PersonnelRole, PersonnelStatus, DutyStatus } from "@/types/personnel.types";
import { Button } from "@/components/ui/button";

interface PersonnelFiltersProps {
  filters: Filters;
  showFilters: boolean;
  onToggleFilters: () => void;
  onFilterChange: (filters: Filters) => void;
  onApply: () => void;
  onClear: () => void;
}

export function PersonnelFilters({
  filters,
  showFilters,
  onToggleFilters,
  onFilterChange,
  onApply,
  onClear,
}: PersonnelFiltersProps) {
  const getRoleColor = (role: PersonnelRole) => {
    const colors: Record<PersonnelRole, string> = {
      RESPONDER: "bg-orange-100 text-orange-800 border-orange-200",
      MEDIC: "bg-blue-100 text-blue-800 border-blue-200",
      FIREFIGHTER: "bg-red-100 text-red-800 border-red-200",
      POLICE: "bg-indigo-100 text-indigo-800 border-indigo-200",
      COORDINATOR: "bg-purple-100 text-purple-800 border-purple-200",
    };
    return colors[role] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusColor = (status: PersonnelStatus) => {
    const colors: Record<PersonnelStatus, string> = {
      ON_DUTY: "bg-green-100 text-green-800 border-green-200",
      ON_BREAK: "bg-yellow-100 text-yellow-800 border-yellow-200",
      OFF_DUTY: "bg-gray-100 text-gray-800 border-gray-200",
      RESPONDING: "bg-orange-100 text-orange-800 border-orange-200",
      ON_SCENE: "bg-red-100 text-red-800 border-red-200",
      AVAILABLE: "bg-blue-100 text-blue-800 border-blue-200", // Legacy
      INACTIVE: "bg-slate-100 text-slate-800 border-slate-200",
      SUSPENDED: "bg-red-50 text-red-700 border-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getDutyStatusColor = (dutyStatus: DutyStatus) => {
    const colors: Record<DutyStatus, string> = {
      AVAILABLE: "bg-blue-100 text-blue-800 border-blue-200", // Blue to match duty status indicator
      RESPONDING: "bg-orange-100 text-orange-800 border-orange-200",
      ON_SCENE: "bg-red-100 text-red-800 border-red-200",
      UNAVAILABLE: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[dutyStatus] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const toggleArrayFilter = <T,>(field: keyof Filters, value: T) => {
    const current = (filters[field] as T[]) || [];
    const newValue = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFilterChange({ ...filters, [field]: newValue });
  };

  const activeFilterCount =
    (filters.role?.length || 0) +
    (filters.status?.length || 0) +
    (filters.dutyStatus?.length || 0) +
    (filters.isAvailable !== undefined ? 1 : 0);

  return (
    <>
      <Button
        onClick={onToggleFilters}
        variant="outline"
        className={`relative bg-white/80 backdrop-blur-sm border-gray-200/80 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 rounded-xl shadow-sm hover:shadow-md ${activeFilterCount > 0 ? 'ring-2 ring-blue-500/20' : ''
          }`}
      >
        <Filter className={`h-4 w-4 mr-2 transition-colors duration-200 ${activeFilterCount > 0 ? 'text-blue-600' : 'text-gray-600'
          }`} />
        <span className={`font-medium ${activeFilterCount > 0 ? 'text-blue-700' : 'text-gray-700'}`}>
          Filters
        </span>
        {activeFilterCount > 0 && (
          <span className="ml-2 px-2 py-0.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs rounded-full font-semibold shadow-sm">
            {activeFilterCount}
          </span>
        )}
      </Button>

      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <div className="flex flex-wrap gap-2">
              {(["RESPONDER", "MEDIC", "FIREFIGHTER", "POLICE", "COORDINATOR"] as PersonnelRole[]).map(
                (role) => (
                  <button
                    key={role}
                    onClick={() => toggleArrayFilter("role", role)}
                    className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors ${filters.role?.includes(role)
                      ? getRoleColor(role)
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    {role}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {(["ON_DUTY", "ON_BREAK", "OFF_DUTY", "RESPONDING", "ON_SCENE", "AVAILABLE", "INACTIVE", "SUSPENDED"] as PersonnelStatus[]).map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => toggleArrayFilter("status", status)}
                    className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors ${filters.status?.includes(status)
                      ? getStatusColor(status)
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    {status.replace("_", " ")}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Duty Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duty Status
            </label>
            <div className="flex flex-wrap gap-2">
              {(["AVAILABLE", "RESPONDING", "ON_SCENE", "UNAVAILABLE"] as DutyStatus[]).map(
                (dutyStatus) => (
                  <button
                    key={dutyStatus}
                    onClick={() => toggleArrayFilter("dutyStatus", dutyStatus)}
                    className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors ${filters.dutyStatus?.includes(dutyStatus)
                      ? getDutyStatusColor(dutyStatus)
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    {dutyStatus.replace("_", " ")}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Availability Toggle */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.isAvailable || false}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    isAvailable: e.target.checked ? true : undefined,
                  })
                }
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Show only available personnel
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-2">
            <Button onClick={onClear} variant="outline" size="sm">
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
            <Button onClick={onApply} size="sm">
              Apply Filters
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
