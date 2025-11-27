import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { barangayService } from "@/services/barangay.service";
import { toast } from "sonner";
import {
  MapPin,
  Phone,
  Plus,
  Edit,
  Trash2,
  Grid,
  List as ListIcon,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Barangay } from "@/types/barangay.types";

export default function BarangayList() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedContacts, setExpandedContacts] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    inactive: number;
    totalEmergencyContacts: number;
  } | null>(null);

  const fetchBarangays = useCallback(async () => {
    try {
      setIsLoading(true);
      const filters = {
        search: searchQuery || undefined,
        status: statusFilter === "ALL" ? undefined : [statusFilter],
        limit: 100,
      };
      const response = await barangayService.getBarangays(filters);
      setBarangays(response.data.data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to load barangays");
      // console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchBarangays();
    fetchStats();
  }, [statusFilter, fetchBarangays]);

  const fetchStats = async () => {
    try {
      const response = await barangayService.getStats();
      setStats(response.data);
    } catch {
      // console.error("Failed to load stats:", error);
    }
  };

  const filteredBarangays = barangays.filter((barangay) => {
    const matchesSearch = barangay.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || barangay.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Compute emergency contacts count: prefer stats from API, otherwise sum loaded barangays
  const emergencyContactsCount = stats?.totalEmergencyContacts ?? barangays.reduce((acc, b) => acc + (b.emergencyContacts?.length || 0), 0);

  const handleDelete = async (barangayId: string) => {
    const barangayName = barangays.find(b => b.id === barangayId)?.name || "this post";
    
    if (!confirm(`Are you sure you want to delete ${barangayName}? This action cannot be undone.`)) return;

    try {
      await barangayService.deleteBarangay(barangayId);
      toast.success("Barangay deleted successfully");
      fetchBarangays();
      fetchStats();
    } catch (error: unknown) {
      const err = error as { 
        response?: { 
          status?: number;
          data?: { 
            error?: { message?: string }; 
            message?: string 
          } 
        };
        message?: string;
      };
      const errorMessage = err.response?.data?.error?.message 
        || err.response?.data?.message 
        || err.message 
        || "Failed to delete barangay";
      
      // Show detailed error message
      if (err.response?.status === 400) {
        toast.error(`Cannot delete barangay: ${errorMessage}`, { duration: 5000 });
      } else if (err.response?.status === 404) {
        toast.error("Barangay not found");
      } else if (err.response?.status === 409) {
        toast.error("Cannot delete barangay with active incidents or related data", { duration: 5000 });
      } else {
        toast.error(errorMessage);
      }
      
      // console.error("Delete error:", err.response?.data || error);
    }
  };

  const handleSearch = () => {
    fetchBarangays();
  };

  const toggleExpandedContacts = (barangayId: string) => {
    setExpandedContacts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(barangayId)) {
        newSet.delete(barangayId);
      } else {
        newSet.add(barangayId);
      }
      return newSet;
    });
  };

  return (
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
              Post Management
            </h1>
            <p className="text-blue-100 mt-1 font-medium">
              {stats?.total || 0} posts • Manage emergency response posts and locations
            </p>
          </div>
          <Button
            onClick={() => navigate("/barangays/new")}
            className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Post
          </Button>
        </div>
        </div>
      </div>

      {/* Modern Compact Search and Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/80 p-4 hover:shadow-xl transition-all duration-300">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Enhanced Search */}
          <div className="flex-1">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
              <input
                type="text"
                placeholder="Search posts by name or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all duration-200 text-sm placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Compact Action Controls */}
          <div className="flex items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "INACTIVE")
              }
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 text-sm"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-2 rounded-md transition-all duration-200 ${
                  viewMode === "grid"
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Grid View"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-2 rounded-md transition-all duration-200 ${
                  viewMode === "list"
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="List View"
              >
                <ListIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Posts Card (compact) */}
        <div className="group relative bg-gradient-to-br from-blue-50 via-white to-blue-50/50 rounded-2xl shadow-sm border border-blue-100/60 p-4 hover:shadow-md hover:scale-102 transition-all duration-200 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Total Posts</p>
              <p className="text-2xl font-bold text-gray-900 mt-2 mb-0.5">
                {stats?.total || 0}
              </p>
              <p className="text-xs text-blue-600 font-medium">Registered response posts</p>
            </div>
            <div className="h-12 w-12 grid place-items-center rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 shadow-sm group-hover:shadow-md transition-shadow duration-200">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Active Posts Card (compact) */}
        <div className="group relative bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 rounded-2xl shadow-sm border border-emerald-100/60 p-4 hover:shadow-md hover:scale-102 transition-all duration-200 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Active</p>
              <p className="text-2xl font-bold text-gray-900 mt-2 mb-0.5">
                {stats?.active || 0}
              </p>
              <p className="text-xs text-emerald-600 font-medium">Operational posts</p>
            </div>
            <div className="h-12 w-12 grid place-items-center rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 shadow-sm group-hover:shadow-md transition-shadow duration-200">
              <MapPin className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Emergency Contacts Card (compact) */}
        <div className="group relative bg-gradient-to-br from-rose-50 via-white to-rose-50/50 rounded-2xl shadow-sm border border-rose-100/60 p-4 hover:shadow-md hover:scale-102 transition-all duration-200 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-rose-700 uppercase tracking-wide">Emergency Contacts</p>
              <p className="text-2xl font-bold text-gray-900 mt-2 mb-0.5">
                {emergencyContactsCount}
              </p>
              <p className="text-xs text-rose-600 font-medium">Total contact numbers</p>
            </div>
            <div className="h-12 w-12 grid place-items-center rounded-lg bg-gradient-to-br from-rose-100 to-rose-200 shadow-sm group-hover:shadow-md transition-shadow duration-200">
              <Phone className="h-6 w-6 text-rose-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-500 mt-4">Loading barangays...</p>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* Enhanced Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBarangays.map((barangay) => (
            <div
              key={barangay.id}
              className="group bg-white rounded-xl shadow-sm border border-gray-200/80 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-200/50 transition-all duration-300 hover:scale-[1.02] overflow-hidden"
            >
              {/* Status Indicator Stripe */}
              <div
                className={`h-1 w-full ${
                  barangay.status === "ACTIVE"
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                    : "bg-gradient-to-r from-gray-300 to-gray-400"
                }`}
              />

              <div className="p-6 space-y-5">
                {/* Enhanced Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg group-hover:from-blue-200 group-hover:to-blue-300 transition-colors duration-300">
                        <MapPin className="h-5 w-5 text-blue-600" />
                      </div>
                      <span
                        className={`px-2.5 py-1 text-xs font-bold rounded-full shadow-sm ${
                          barangay.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : "bg-gray-100 text-gray-700 border border-gray-200"
                        }`}
                      >
                        {barangay.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-900 transition-colors duration-200 line-clamp-1">
                      {barangay.name}
                    </h3>
                    <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-200 line-clamp-2">
                      {barangay.address}
                    </p>
                  </div>
                </div>

                {/* Enhanced Description */}
                {barangay.description && (
                  <div className="bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-lg p-3 border border-slate-100/80">
                    <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
                      {barangay.description}
                    </p>
                  </div>
                )}

                {/* Enhanced Emergency Contacts */}
                <div className="bg-gradient-to-br from-red-50 via-red-50/80 to-rose-50 border border-red-100 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-1.5 bg-red-100 rounded-full">
                      <Phone className="h-4 w-4 text-red-600" />
                    </div>
                    <span className="text-sm font-semibold text-red-700">Emergency Contacts</span>
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full">
                        {barangay.emergencyContacts?.length || 0}
                      </span>
                      {barangay.emergencyContacts && barangay.emergencyContacts.length > 2 && (
                        <button
                          onClick={() => toggleExpandedContacts(barangay.id)}
                          className="p-1 hover:bg-red-100 rounded-md transition-colors duration-200"
                          title={expandedContacts.has(barangay.id) ? "Collapse contacts" : "Expand contacts"}
                        >
                          {expandedContacts.has(barangay.id) ? (
                            <ChevronUp className="h-3 w-3 text-red-600" />
                          ) : (
                            <ChevronDown className="h-3 w-3 text-red-600" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className={`space-y-2 ${expandedContacts.has(barangay.id) ? '' : 'max-h-28'} overflow-hidden transition-all duration-300 ease-in-out`}>
                    {barangay.emergencyContacts && barangay.emergencyContacts.length > 0 ? (
                      <>
                        {/* Scrollable container when expanded */}
                        <div className={`${expandedContacts.has(barangay.id) ? 'max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-red-300 scrollbar-track-red-50' : ''} space-y-2`}>
                          {(expandedContacts.has(barangay.id) ? barangay.emergencyContacts : barangay.emergencyContacts.slice(0, 2)).map((contact) => (
                            <div key={contact.id} className="bg-white/60 border border-red-100 rounded-lg p-2 hover:bg-white/80 transition-colors duration-200">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-800 truncate">
                                  {contact.name}
                                </span>
                                <span className="font-mono font-bold text-gray-900 text-sm bg-gray-100 px-2 py-1 rounded-md ml-2">
                                  {contact.phone}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Toggle button when collapsed */}
                        {!expandedContacts.has(barangay.id) && barangay.emergencyContacts.length > 2 && (
                          <div className="text-center pt-1 border-t border-red-100/50">
                            <button
                              onClick={() => toggleExpandedContacts(barangay.id)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-full transition-colors duration-200"
                            >
                              <Plus className="h-3 w-3" />
                              {barangay.emergencyContacts.length - 2} more contacts
                              <ChevronDown className="h-3 w-3 ml-1" />
                            </button>
                          </div>
                        )}

                        {/* Collapse button when expanded */}
                        {expandedContacts.has(barangay.id) && barangay.emergencyContacts.length > 2 && (
                          <div className="text-center pt-2 border-t border-red-100/50">
                            <button
                              onClick={() => toggleExpandedContacts(barangay.id)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-full transition-colors duration-200"
                            >
                              <ChevronUp className="h-3 w-3" />
                              Show less
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-white/50 border border-red-100 rounded-lg p-3 text-center">
                        <p className="text-xs text-red-500 font-medium">No emergency contacts</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Location */}
                <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/30 rounded-lg p-3 border border-blue-100/50">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="p-1 bg-blue-100 rounded-full">
                      <MapPin className="h-3 w-3 text-blue-500" />
                    </div>
                    <span className="font-mono text-xs font-medium">
                      {barangay.latitude.toFixed(6)}, {barangay.longitude.toFixed(6)}
                    </span>
                  </div>
                </div>

                {/* Enhanced Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => navigate(`/barangays/${barangay.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <span>View Details</span>
                    <MapPin className="h-4 w-4" />
                  </button>
                  <div className="flex gap-1">
                    <button
                      onClick={() => navigate(`/barangays/${barangay.id}/edit`)}
                      className="p-2.5 bg-gradient-to-br from-gray-50 to-gray-100 text-gray-600 hover:text-blue-600 hover:from-blue-50 hover:to-blue-100 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                      title="Edit post"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(barangay.id)}
                      className="p-2.5 bg-gradient-to-br from-gray-50 to-gray-100 text-gray-600 hover:text-red-600 hover:from-red-50 hover:to-red-100 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                      title="Delete post"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Enhanced List View */
        <div className="bg-white rounded-xl shadow-lg border border-gray-100/80 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 border-b border-gray-100/80">
            <div className="px-6 py-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Emergency Response Posts ({filteredBarangays.length})
              </h3>
            </div>
          </div>

          <table className="min-w-full divide-y divide-gray-100/50">
            <thead className="bg-gradient-to-r from-slate-50 to-blue-50/20">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wide">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Post Details
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wide">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Emergency Contacts
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wide">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Operating Hours
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-blue-700 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {filteredBarangays.map((barangay) => (
                <tr key={barangay.id} className="group hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-transparent transition-colors duration-200">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        barangay.status === "ACTIVE"
                          ? "bg-emerald-100"
                          : "bg-gray-100"
                      }`}>
                        <MapPin className={`h-4 w-4 ${
                          barangay.status === "ACTIVE"
                            ? "text-emerald-600"
                            : "text-gray-600"
                        }`} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 group-hover:text-blue-900 transition-colors duration-200">
                          {barangay.name}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5 font-medium">
                          {barangay.address}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-sm">
                      {barangay.emergencyContacts && barangay.emergencyContacts.length > 0 ? (
                        <>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-gray-900">
                              {barangay.emergencyContacts.length} Contact{barangay.emergencyContacts.length !== 1 ? 's' : ''}
                            </span>
                            <div className="flex -space-x-1">
                              <div className="h-2 w-2 bg-red-400 rounded-full"></div>
                              <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                              <div className="h-2 w-2 bg-red-600 rounded-full"></div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            {barangay.emergencyContacts.slice(0, 1).map((contact) => (
                              <div key={contact.id} className="bg-red-50 border border-red-100 rounded-lg p-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-gray-800 truncate">
                                    {contact.name}
                                  </span>
                                  <span className="font-mono font-bold text-gray-900 text-xs bg-white px-2 py-1 rounded-md border border-red-200">
                                    {contact.phone}
                                  </span>
                                </div>
                              </div>
                            ))}
                            {barangay.emergencyContacts.length > 1 && (
                              <p className="text-xs text-red-600 font-medium">
                                +{barangay.emergencyContacts.length - 1} more contacts
                              </p>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-500 font-medium">No contacts</p>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-sm">
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <p className="text-gray-700 font-medium">
                          {barangay.operatingHours || "24/7 Available"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full shadow-sm ${
                        barangay.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : "bg-gray-100 text-gray-700 border border-gray-200"
                      }`}
                    >
                      <div className={`h-2 w-2 rounded-full ${
                        barangay.status === "ACTIVE"
                          ? "bg-emerald-500"
                          : "bg-gray-400"
                      }`}></div>
                      {barangay.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => navigate(`/barangays/${barangay.id}`)}
                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 transform hover:scale-105"
                        title="View Details"
                      >
                        <MapPin className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/barangays/${barangay.id}/edit`)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 transform hover:scale-105"
                        title="Edit Post"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(barangay.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-105"
                        title="Delete Post"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {filteredBarangays.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery ? "Try adjusting your search" : "Get started by adding a new emergency response post"}
          </p>
          {!searchQuery && (
            <Button onClick={() => navigate("/barangays/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Post
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
