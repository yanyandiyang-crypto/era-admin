import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Filter, Download, Eye, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { auditService } from "@/services/audit.service";
import type { AuditLog } from "@/types/audit.types";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const ACTION_STYLES: Record<
  string,
  { badge: string; text: string }
> = {
  CREATE: {
    badge: "border border-emerald-100 bg-emerald-50 text-emerald-700",
    text: "text-emerald-700",
  },
  UPDATE: {
    badge: "border border-blue-100 bg-blue-50 text-blue-700",
    text: "text-blue-700",
  },
  DELETE: {
    badge: "border border-rose-100 bg-rose-50 text-rose-700",
    text: "text-rose-700",
  },
  LOGIN: {
    badge: "border border-purple-100 bg-purple-50 text-purple-700",
    text: "text-purple-700",
  },
  LOGIN_FAILED: {
    badge: "border border-rose-200 bg-rose-50 text-rose-700",
    text: "text-rose-700",
  },
  INCIDENT_CREATED: {
    badge: "border border-indigo-100 bg-indigo-50 text-indigo-700",
    text: "text-indigo-700",
  },
  INCIDENT_UPDATED: {
    badge: "border border-sky-100 bg-sky-50 text-sky-700",
    text: "text-sky-700",
  },
  SYSTEM_ERROR: {
    badge: "border border-amber-200 bg-amber-50 text-amber-700",
    text: "text-amber-700",
  },
  default: {
    badge: "border border-gray-200 bg-gray-50 text-gray-700",
    text: "text-gray-700",
  },
};

const STATUS_STYLES: Record<
  "success" | "failed" | "info",
  string
> = {
  success: "text-emerald-600 bg-emerald-50 border border-emerald-200",
  failed: "text-rose-600 bg-rose-50 border border-rose-200",
  info: "text-sky-600 bg-sky-50 border border-sky-200",
};

const formatActionLabel = (action?: string) => {
  if (!action) return "Unknown";
  return action
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

const deriveStatusFromLog = (log: AuditLog): "success" | "failed" | "info" => {
  const action = log.action?.toUpperCase() || "";
  const details = log.details as Record<string, unknown> | null | undefined;

  if (details) {
    if (typeof details.status === "string") {
      const statusValue = (details.status as string).toLowerCase();
      if (statusValue.includes("fail")) return "failed";
      if (statusValue.includes("success")) return "success";
    }
    if (typeof details.result === "string") {
      const resultValue = (details.result as string).toLowerCase();
      if (resultValue.includes("fail")) return "failed";
      if (resultValue.includes("success")) return "success";
    }
    if (typeof details.success === "boolean") {
      return details.success ? "success" : "failed";
    }
  }

  if (action.includes("FAILED") || action.includes("ERROR")) {
    return "failed";
  }

  if (action.includes("LOGIN") && action.includes("FAIL")) {
    return "failed";
  }

  return "success";
};

const getUserDisplay = (log: AuditLog) => {
  if (log.user) {
    if (log.user.email) return log.user.email;
    const firstName = log.user.firstName || "";
    const lastName = log.user.lastName || "";
    return [firstName, lastName].filter(Boolean).join(" ") || "User";
  }
  return "System";
};

const defaultFilters = {
  user: "",
  action: "",
  resource: "",
  status: "",
  startDate: "",
  endDate: "",
};

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });

  const { page, limit, total, totalPages } = pagination;

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await auditService.getLogs({
        page,
        limit,
        action: filters.action || undefined,
        resourceType: filters.resource || undefined,
        fromDate: filters.startDate || undefined,
        toDate: filters.endDate || undefined,
      });

      const payload = response.data;
      setLogs(payload.data);
      setPagination({
        page: payload.pagination.page,
        limit: payload.pagination.limit,
        total: payload.pagination.total,
        totalPages: payload.pagination.totalPages,
      });
    } catch {
      // console.error("Failed to load audit logs", err);
      setError("Unable to load audit logs right now.");
      toast.error("Failed to load audit logs");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, filters.action, filters.resource, filters.startDate, filters.endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const haystack = JSON.stringify(log).toLowerCase();
      if (searchTerm && !haystack.includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (
        filters.user &&
        !getUserDisplay(log).toLowerCase().includes(filters.user.toLowerCase())
      ) {
        return false;
      }
      if (filters.status && deriveStatusFromLog(log) !== filters.status) {
        return false;
      }
      return true;
    });
  }, [logs, searchTerm, filters.user, filters.status]);

  const activeFilters =
    (filters.action ? 1 : 0) +
    (filters.resource ? 1 : 0) +
    (filters.status ? 1 : 0) +
    (filters.startDate ? 1 : 0) +
    (filters.endDate ? 1 : 0);
  const hasActiveFilters = activeFilters > 0;

  const pageStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const pageEnd = total === 0 ? 0 : Math.min(page * limit, total);

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (direction: "prev" | "next") => {
    setPagination((prev) => {
      const nextPage =
        direction === "next"
          ? Math.min(prev.page + 1, prev.totalPages)
          : Math.max(prev.page - 1, 1);
      return { ...prev, page: nextPage };
    });
  };

  const handleLimitChange = (value: number) => {
    setPagination((prev) => ({ ...prev, limit: value, page: 1 }));
  };


  const exportToCsv = () => {
    if (filteredLogs.length === 0) {
      toast.info("No logs to export yet.");
      return;
    }

    const headers = [
      "Timestamp",
      "User",
      "Action",
      "Resource",
      "Resource ID",
      "IP Address",
    ];

    const rows = filteredLogs.map((log) => [
      format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss"),
      getUserDisplay(log),
      formatActionLabel(log.action),
      log.resourceType ?? "—",
      log.resourceId ?? "—",
      log.ipAddress ?? "—",
    ]);

    const buildCsvRow = (cols: string[]) =>
      cols
        .map((col) => `"${String(col ?? "").replace(/"/g, '""')}"`)
        .join(",");

    const csvContent = [headers, ...rows].map(buildCsvRow).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Audit logs exported");
  };

  return (
    <div className="px-4 lg:px-6 xl:px-8">
      <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-linear-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl shadow-2xl">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.1),_transparent_50%),_radial-gradient(circle_at_bottom,_rgba(99,102,241,0.1),_transparent_50%)]" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />

        <div className="relative p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Audit Logs</h1>
              <p className="text-blue-100 mt-1 font-medium">
                Security-grade visibility in one glance
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Export Actions */}
              <Button
                onClick={exportToCsv}
                variant="outline"
                size="sm"
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search audit logs (⌘K)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <span className="text-[11px] font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-3 py-1">
                  {activeFilters} filters
                </span>
              )}
              <Button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 px-3 h-9 text-sm"
                variant="ghost"
              >
                <Filter className="h-4 w-4" />
                {showFilters ? "Hide" : "Filter"}
              </Button>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center justify-between text-[11px] text-gray-500">
              <div>Filters active.</div>
              <button
                onClick={resetFilters}
                className="text-blue-600 font-medium hover:text-blue-700"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action
              </label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange("action", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="LOGIN">Login</option>
                <option value="LOGIN_FAILED">Login Failed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resource
              </label>
              <select
                value={filters.resource}
                onChange={(e) => handleFilterChange("resource", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Resources</option>
                <option value="incident">Incidents</option>
                <option value="personnel">Personnel</option>
                <option value="barangay">Barangays</option>
                <option value="auth">Authentication</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Latest system activity</p>
            <p className="text-xs text-gray-500">
              Showing {pageStart}-{pageEnd} of {total} records
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={limit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange("prev")}
                disabled={page === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-semibold text-gray-600">
                Page {page} / {Math.max(totalPages, 1)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange("next")}
                disabled={page === totalPages || isLoading || totalPages === 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50 px-6 py-3 text-sm text-amber-700">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  User / IP
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Resource
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading
                ? Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={`skeleton-${idx}`} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-3 w-24 rounded bg-gray-200" />
                        <div className="mt-2 h-3 w-16 rounded bg-gray-100" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-3 w-28 rounded bg-gray-200" />
                        <div className="mt-2 h-3 w-20 rounded bg-gray-100" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-5 w-20 rounded-full bg-gray-200" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-3 w-24 rounded bg-gray-200" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-5 w-16 rounded-full bg-gray-200" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="h-5 w-12 rounded bg-gray-200 ml-auto" />
                      </td>
                    </tr>
                  ))
                : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No audit logs match your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const actionTheme =
                        ACTION_STYLES[log.action] ?? ACTION_STYLES.default;
                      const status = deriveStatusFromLog(log);
                      const statusTheme = STATUS_STYLES[status];
                      const resourceLabel = formatActionLabel(log.resourceType);
                      const resourceId = log.resourceId ?? "—";
                      const userEmail = getUserDisplay(log);

                      return (
                        <tr key={log.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {format(new Date(log.timestamp), "MMM dd, yyyy")}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                              {format(new Date(log.timestamp), "HH:mm:ss")}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {userEmail}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                              {log.ipAddress ?? "N/A"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${actionTheme.badge}`}
                            >
                              {formatActionLabel(log.action)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {resourceLabel || "Unknown"}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                              {resourceId}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center capitalize rounded-full px-3 py-1 text-xs font-semibold ${statusTheme}`}
                            >
                              {status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700"
                              onClick={() => setSelectedLog(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Audit Log
                </p>
                <h3 className="text-xl font-semibold text-gray-900">
                  {formatActionLabel(selectedLog.action)}
                </h3>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>

            <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-100 bg-gray-50/70 p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Timestamp</p>
                  <p className="text-sm font-mono text-gray-900 mt-1">
                    {format(new Date(selectedLog.timestamp), "PPpp")}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50/70 p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">User</p>
                  <p className="text-sm text-gray-900 mt-1">{getUserDisplay(selectedLog)}</p>
                  <p className="text-xs text-gray-500 font-mono">{selectedLog.ipAddress ?? "N/A"}</p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50/70 p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Resource</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {formatActionLabel(selectedLog.resourceType)}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">
                    {selectedLog.resourceId ?? "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50/70 p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Status</p>
                  <span
                    className={`inline-flex items-center capitalize rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[deriveStatusFromLog(selectedLog)]}`}
                  >
                    {deriveStatusFromLog(selectedLog)}
                  </span>
                </div>
              </div>

              {selectedLog.details && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    Details
                  </p>
                  <pre className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-800 overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.userAgent && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    User Agent
                  </p>
                  <p className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs text-gray-700 font-mono break-all">
                    {selectedLog.userAgent}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
