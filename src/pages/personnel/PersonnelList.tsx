import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, RefreshCw, Users, Activity, Grid3x3, List } from "lucide-react";
import { personnelService } from "@/services/personnel.service";
import type { Personnel, PersonnelFilters, PersonnelStats } from "@/types/personnel.types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PersonnelFilters as FilterComponent } from "@/components/personnel/PersonnelFilters";
import { PersonnelTable } from "@/components/personnel/PersonnelTable";
import { PersonnelGrid } from "@/components/personnel/PersonnelGrid";

export default function PersonnelListPage() {
  const navigate = useNavigate();
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState<PersonnelStats | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Filters
  const [filters, setFilters] = useState<PersonnelFilters>({
    search: "",
    role: [],
    status: [],
    dutyStatus: [],
    sortBy: "lastName",
    sortOrder: "asc",
    page: 1,
    limit: 20,
  });

  useEffect(() => {
    fetchPersonnel();
    fetchStats();
  }, [filters.page, filters.sortBy, filters.sortOrder]);

  const fetchPersonnel = async () => {
    try {
      setIsLoading(true);
      const response = await personnelService.getPersonnel(filters);
      setPersonnel(response.data.data);
      setPagination({
        page: response.data.page,
        limit: response.data.limit,
        total: response.data.total,
        totalPages: response.data.totalPages,
      });
    } catch {
      toast.error("Failed to load personnel");
      // console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await personnelService.getStats();
      setStats(response.data);
    } catch {
      // console.error("Failed to load stats:", error);
    }
  };

  const applyFilters = () => {
    setFilters((prev) => ({ ...prev, page: 1 }));
    fetchPersonnel();
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      role: [],
      status: [],
      dutyStatus: [],
      sortBy: "lastName",
      sortOrder: "asc",
      page: 1,
      limit: 20,
    });
    setTimeout(fetchPersonnel, 100);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === personnel.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(personnel.map((p) => p.personnelId)));
    }
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

  return (
    <div className="px-4 lg:px-6 xl:px-8">
      <div className="space-y-6">
        {/* Modern Blue Header Board */}
      <div className="relative overflow-hidden bg-linear-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl shadow-2xl">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.1),_transparent_50%),_radial-gradient(circle_at_bottom,_rgba(99,102,241,0.1),_transparent_50%)]" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
        
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Personnel Management
            </h1>
            <p className="text-blue-100 mt-1 font-medium">
              {pagination.total} personnel members • Manage your emergency response team
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-md transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-white text-blue-600 shadow-lg'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                title="Grid View"
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 rounded-md transition-all duration-200 ${
                  viewMode === 'table'
                    ? 'bg-white text-blue-600 shadow-lg'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                title="Table View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            <Button
              onClick={() => fetchPersonnel()}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-white disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button 
              onClick={() => navigate("/personnel/new")} 
              size="sm"
              className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Personnel
            </Button>
          </div>
          </div>
        </div>
      </div>

      {/* Modern Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Available Personnel Card */}
          <div className="group relative bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 rounded-2xl shadow-sm border border-emerald-100/60 p-4 hover:shadow-md hover:scale-102 transition-all duration-200 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 flex items-center justify-between gap-3">
              <div className="flex-1">
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Available</p>
                <p className="text-2xl font-bold text-gray-900 mt-2 mb-0.5">
                  {stats.available}
                </p>
                <p className="text-xs text-emerald-600 font-medium">Ready for deployment</p>
              </div>
              <div className="h-12 w-12 grid place-items-center rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 shadow-sm group-hover:shadow-md transition-shadow duration-200">
                <Users className="h-6 w-6 text-emerald-600" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* On Duty Card */}
          <div className="group relative bg-gradient-to-br from-blue-50 via-white to-blue-50/50 rounded-2xl shadow-sm border border-blue-100/60 p-4 hover:shadow-md hover:scale-102 transition-all duration-200 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 flex items-center justify-between gap-3">
              <div className="flex-1">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">On Duty</p>
                <p className="text-2xl font-bold text-gray-900 mt-2 mb-0.5">
                  {stats.onDuty}
                </p>
                <p className="text-xs text-blue-600 font-medium">Currently active</p>
              </div>
              <div className="h-12 w-12 grid place-items-center rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 shadow-sm group-hover:shadow-md transition-shadow duration-200">
                <Activity className="h-6 w-6 text-blue-600" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* Off Duty Card */}
          <div className="group relative bg-gradient-to-br from-amber-50 via-white to-amber-50/50 rounded-2xl shadow-sm border border-amber-100/60 p-4 hover:shadow-md hover:scale-102 transition-all duration-200 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 flex items-center justify-between gap-3">
              <div className="flex-1">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Off Duty</p>
                <p className="text-2xl font-bold text-gray-900 mt-2 mb-0.5">
                  {stats.offDuty}
                </p>
                <p className="text-xs text-amber-600 font-medium">Resting period</p>
              </div>
              <div className="h-12 w-12 grid place-items-center rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 shadow-sm group-hover:shadow-md transition-shadow duration-200">
                <Users className="h-6 w-6 text-amber-600" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* Response Time Card */}
          <div className="group relative bg-gradient-to-br from-violet-50 via-white to-violet-50/50 rounded-2xl shadow-sm border border-violet-100/60 p-4 hover:shadow-md hover:scale-102 transition-all duration-200 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 flex items-center justify-between gap-3">
              <div className="flex-1">
                <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide">Response Time</p>
                <p className="text-2xl font-bold text-gray-900 mt-2 mb-0.5">
                  {stats.averageResponseTime != null 
                    ? stats.averageResponseTime.toFixed(1)
                    : "0.0"}
                  <span className="text-sm font-semibold text-gray-600 ml-1">min</span>
                </p>
                <p className="text-xs text-violet-600 font-medium">Average response</p>
              </div>
              <div className="h-12 w-12 grid place-items-center rounded-lg bg-gradient-to-br from-violet-100 to-violet-200 shadow-sm group-hover:shadow-md transition-shadow duration-200">
                <Activity className="h-6 w-6 text-violet-600" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Compact Search and Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/80 p-4 hover:shadow-xl transition-all duration-300">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Enhanced Search */}
          <div className="flex-1">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
              <input
                type="text"
                placeholder="Search personnel by name, ID, email, or phone..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                onKeyPress={(e) => e.key === "Enter" && applyFilters()}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all duration-200 text-sm placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Compact Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Filter Component */}
            <FilterComponent
              filters={filters}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters(!showFilters)}
              onFilterChange={setFilters}
              onApply={applyFilters}
              onClear={clearFilters}
            />
            
            <Button 
              onClick={applyFilters}
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 px-6 rounded-xl font-medium"
            >
              Apply
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedIds.size} personnel selected
              </span>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Personnel View - Table or Grid */}
      {viewMode === 'table' ? (
        <PersonnelTable
          personnel={personnel}
          isLoading={isLoading}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
        />
      ) : (
        <PersonnelGrid
          personnel={personnel}
          isLoading={isLoading}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
        />
      )}
      </div>
    </div>
  );
}
