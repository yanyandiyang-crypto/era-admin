import { Search, Filter, Sparkles } from "lucide-react";
import { IncidentFilters as FilterComponent } from "@/components/incidents/IncidentFilters";
import type { IncidentFilters } from "@/types/incident.types";

interface IncidentSearchBarProps {
  filters: IncidentFilters;
  showFilters: boolean;
  onToggleFilters: () => void;
  onFilterChange: (filters: IncidentFilters) => void;
  onApply: () => void;
  onClear: () => void;
  onSearchKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function IncidentSearchBar({
  filters,
  showFilters,
  onToggleFilters,
  onFilterChange,
  onApply,
  onClear,
  onSearchKeyPress,
}: IncidentSearchBarProps) {
  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200/60 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-linear-to-r from-slate-50 to-gray-50 px-4 py-3 border-b border-gray-200/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 rounded-lg border border-blue-200">
            <Search className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Search & Filter</h3>
            <p className="text-xs text-gray-500">Find incidents quickly</p>
          </div>
        </div>
      </div>

      {/* Search Content */}
      <div className="p-5 bg-linear-to-br from-white to-gray-50/30">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Enhanced Search Input */}
          <div className="flex-1 relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
              <Search className="h-5 w-5 text-blue-500" />
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
              {filters.search && (
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  <Sparkles className="h-3 w-3" />
                  Active
                </div>
              )}
            </div>
            <input
              type="text"
              placeholder="Search by tracking number, description, location..."
              value={filters.search}
              onChange={(e) =>
                onFilterChange({ ...filters, search: e.target.value })
              }
              onKeyPress={onSearchKeyPress}
              className="w-full pl-12 pr-20 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-blue-50/30 transition-all shadow-sm hover:shadow-md"
            />
          </div>

          {/* Enhanced Filter Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleFilters}
              className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md ${
                showFilters 
                  ? 'bg-linear-to-r from-blue-600 to-blue-700 text-white border-2 border-blue-600 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg' 
                  : 'bg-linear-to-r from-blue-500 to-blue-600 text-white border-2 border-blue-500 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg'
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {showFilters && (
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              )}
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-blue-50/30 rounded-xl border border-blue-200/50">
            <FilterComponent
              filters={filters}
              showFilters={showFilters}
              onToggleFilters={onToggleFilters}
              onFilterChange={onFilterChange}
              onApply={onApply}
              onClear={onClear}
            />
          </div>
        )}
      </div>
    </div>
  );
}
