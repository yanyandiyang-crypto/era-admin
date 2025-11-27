import { useNavigate } from "react-router-dom";
import {
  CheckSquare,
  Square,
  MapPin,
  Phone,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Mail,
  UserCheck,
  UserX,
  AlertCircle,
  Activity,
  Navigation,
  TrendingUp
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Personnel, PersonnelRole, PersonnelStatus, DutyStatus } from "@/types/personnel.types";
import { getImageUrl } from "@/lib/constants";

interface PersonnelTableProps {
  personnel: Personnel[];
  isLoading: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onSort?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function PersonnelTable({
  personnel,
  isLoading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onSort,
  sortBy,
  sortOrder,
}: PersonnelTableProps) {
  const navigate = useNavigate();

  const getRoleColor = (role: PersonnelRole) => {
    const colors: Record<PersonnelRole, string> = {
      RESPONDER: "bg-orange-100 text-orange-700",
      MEDIC: "bg-blue-100 text-blue-700",
      FIREFIGHTER: "bg-red-100 text-red-700",
      POLICE: "bg-indigo-100 text-indigo-700",
      COORDINATOR: "bg-purple-100 text-purple-700",
    };
    return colors[role] || "bg-gray-100 text-gray-700";
  };

  const getRoleDisplayName = (role: PersonnelRole) => {
    const names: Record<PersonnelRole, string> = {
      RESPONDER: "Responder",
      MEDIC: "Medic",
      FIREFIGHTER: "Firefighter",
      POLICE: "Peace Officer",
      COORDINATOR: "Coordinator",
    };
    return names[role] || role;
  };



  const getDutyStatusBadge = (dutyStatus?: DutyStatus | string) => {
    if (!dutyStatus) return { color: "bg-gray-400", icon: "?" };

    // Extended badges to handle both DutyStatus and PersonnelStatus
    const badges: Record<string, { color: string; icon: string }> = {
      // DutyStatus values
      AVAILABLE: { color: "bg-blue-500", icon: "✓" }, // Blue for available
      RESPONDING: { color: "bg-orange-500", icon: "→" },
      ON_SCENE: { color: "bg-red-500", icon: "●" },
      UNAVAILABLE: { color: "bg-gray-400", icon: "✕" },

      // PersonnelStatus values (backend may return these)
      ON_DUTY: { color: "bg-green-500", icon: "✓" }, // Green for on duty
      ON_BREAK: { color: "bg-yellow-500", icon: "⏸" },
      OFF_DUTY: { color: "bg-gray-400", icon: "○" },
      INACTIVE: { color: "bg-gray-300", icon: "✕" },
      SUSPENDED: { color: "bg-red-300", icon: "!" },
    };
    return badges[dutyStatus] || { color: "bg-gray-400", icon: "?" };
  };

  const handleSort = (column: string) => {
    if (!onSort) return;
    const newOrder = (sortBy === column && sortOrder === 'asc') ? 'desc' : 'asc';
    onSort(column, newOrder);
  };

  const SortableHeader = ({ column, children, sortable = false }: { column: string; children: React.ReactNode; sortable?: boolean }) => {
    const isSorted = sortBy === column;
    const isAsc = sortOrder === 'asc';

    if (!sortable) {
      return (
        <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
          {children}
        </th>
      );
    }

    return (
      <th className="px-4 lg:px-6 py-3">
        <button
          onClick={() => handleSort(column)}
          className="flex items-center gap-2 hover:text-gray-900 transition-colors text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-full"
        >
          {children}
          {isSorted ? (
            isAsc ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
          ) : (
            <ArrowUpDown className="h-3 w-3 opacity-50" />
          )}
        </button>
      </th>
    );
  };

  const EnhancedStatusBadge = ({ status, type }: { status: PersonnelStatus | string; type: 'status' | 'duty' }) => {
    const isDutyStatus = type === 'duty';
    let color, displayText;

    if (isDutyStatus) {
      const badge = getDutyStatusBadge(status);
      color = badge.color;
      displayText = status?.replace('_', ' ') || 'N/A';
      return (
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${color}`} />
          <span className="text-sm font-medium text-gray-900">{displayText}</span>
        </div>
      );
    }

    // Enhanced status badge with icons
    const statusConfig: Record<string, { color: string; icon: any; display: string }> = {
      ON_DUTY: { color: "bg-green-100 text-green-800 border-green-200", icon: UserCheck, display: "On Duty" },
      ON_BREAK: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Activity, display: "On Break" },
      OFF_DUTY: { color: "bg-gray-100 text-gray-800 border-gray-200", icon: UserX, display: "Off Duty" },
      RESPONDING: { color: "bg-orange-100 text-orange-800 border-orange-200", icon: Navigation, display: "Responding" },
      ON_SCENE: { color: "bg-red-100 text-red-800 border-red-200", icon: AlertCircle, display: "On Scene" },
      AVAILABLE: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: UserCheck, display: "Available" },
      INACTIVE: { color: "bg-slate-100 text-slate-800 border-slate-200", icon: UserX, display: "Inactive" },
      SUSPENDED: { color: "bg-red-50 text-red-700 border-red-200", icon: AlertCircle, display: "Suspended" },
    };

    const config = statusConfig[status] || { color: "bg-gray-100 text-gray-800 border-gray-200", icon: AlertCircle, display: "Unknown" };
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-full border ${config.color}`}>
        <IconComponent className="h-3 w-3" />
        {config.display}
      </span>
    );
  };

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-4 lg:px-6 py-4"><div className="h-4 w-4 bg-gray-200 rounded mx-auto"></div></td>
      <td className="px-4 lg:px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
            <div className="h-3 w-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </td>
      <td className="px-4 lg:px-6 py-4"><div className="h-6 w-16 bg-gray-200 rounded-full"></div></td>
      <td className="px-4 lg:px-6 py-4">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
          <div className="h-3 w-28 bg-gray-200 rounded"></div>
        </div>
      </td>
      <td className="px-4 lg:px-6 py-4"><div className="h-6 w-20 bg-gray-200 rounded-full"></div></td>
      <td className="px-4 lg:px-6 py-4"><div className="h-6 w-16 bg-gray-200 rounded-full"></div></td>
      <td className="px-4 lg:px-6 py-4">
        <div className="space-y-2">
          <div className="h-3 w-24 bg-gray-200 rounded"></div>
          <div className="h-3 w-20 bg-gray-200 rounded"></div>
        </div>
      </td>
      <td className="px-4 lg:px-6 py-4">
        <div className="space-y-2">
          <div className="h-3 w-20 bg-gray-200 rounded"></div>
          <div className="h-3 w-16 bg-gray-200 rounded"></div>
        </div>
      </td>
    </tr>
  );

  const MobileCard = ({ person }: { person: Personnel }) => {
    return (
      <div
        className="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => navigate(`/personnel/${person.personnelId}`)}
      >
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0">
            {person.profilePhoto && getImageUrl(person.profilePhoto) ? (
              <img
                src={getImageUrl(person.profilePhoto)!}
                alt={`${person.firstName} ${person.lastName}`}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                {person.firstName.charAt(0)}{person.lastName.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {person.firstName} {person.lastName}
              </h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(person.role)}`}>
                {getRoleDisplayName(person.role)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-2">{person.employeeId}</p>
            <div className="flex items-center gap-1 mb-2">
              <Phone className="h-3 w-3 text-gray-400" />
              <span className="text-sm text-gray-600">{person.phone}</span>
            </div>
          </div>
          <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onToggleSelect(person.personnelId)}
              className="hover:bg-gray-200 rounded p-1 transition-colors"
            >
              {selectedIds.has(person.personnelId) ? (
                <CheckSquare className="h-5 w-5 text-blue-600" />
              ) : (
                <Square className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="flex items-center gap-1 mb-1">
              <span className="text-xs text-gray-500">Status:</span>
            </div>
            <EnhancedStatusBadge status={person.status} type="status" />
          </div>
          <div>
            <div className="flex items-center gap-1 mb-1">
              <span className="text-xs text-gray-500">Duty:</span>
            </div>
            <EnhancedStatusBadge status={person.dutyStatus} type="duty" />
          </div>
          <div className="col-span-2">
            <div className="flex items-center gap-1 mb-1">
              <MapPin className="h-3 w-3 text-blue-500" />
              <span className="text-xs text-gray-500">Location:</span>
            </div>
            {person.currentLatitude && person.currentLongitude ? (
              <div className="text-xs text-gray-600">
                <div>{person.currentLatitude.toFixed(4)}, {person.currentLongitude.toFixed(4)}</div>
                {person.lastLocationUpdate && (
                  <div className="text-gray-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(person.lastLocationUpdate), { addSuffix: true })}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-xs text-gray-400">No location</span>
            )}
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Incidents:</div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-sm font-medium">{person.totalIncidentsHandled || 0}</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Avg Response:</div>
            <span className="text-sm text-gray-600">
              {person.averageResponseTime ? `${person.averageResponseTime.toFixed(1)} min` : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full" role="table" aria-label="Personnel list">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <SortableHeader column="checkbox">
                <button
                  onClick={onToggleSelectAll}
                  className="hover:bg-gray-200 rounded p-1 transition-colors"
                  aria-label={selectedIds.size === personnel.length && personnel.length > 0 ? "Deselect all" : "Select all"}
                >
                  {selectedIds.size === personnel.length && personnel.length > 0 ? (
                    <CheckSquare className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Square className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </SortableHeader>
              <SortableHeader column="firstName" sortable={!!onSort}>
                Personnel
              </SortableHeader>
              <SortableHeader column="role" sortable={!!onSort}>
                Role
              </SortableHeader>
              <SortableHeader column="contact">
                Contact
              </SortableHeader>
              <SortableHeader column="status" sortable={!!onSort}>
                Status
              </SortableHeader>
              <SortableHeader column="dutyStatus" sortable={!!onSort}>
                Duty
              </SortableHeader>
              <SortableHeader column="location">
                Location
              </SortableHeader>
              <SortableHeader column="stats" sortable={!!onSort}>
                Stats
              </SortableHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              Array.from({ length: 5 }, (_, i) => <SkeletonRow key={i} />)
            ) : personnel.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <UserX className="h-12 w-12 text-gray-400" />
                    <div>
                      <p className="text-gray-900 font-medium mb-1">No personnel found</p>
                      <p className="text-gray-500 text-sm">Try adjusting your filters or search terms.</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              personnel.map((person) => (
                <tr
                  key={person.personnelId}
                  className="hover:bg-gray-50 cursor-pointer transition-all duration-150 group"
                  onClick={() => navigate(`/personnel/${person.personnelId}`)}
                  role="row"
                >
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onToggleSelect(person.personnelId)}
                      className="hover:bg-gray-200 rounded p-1 transition-colors"
                      aria-label={`Select ${person.firstName} ${person.lastName}`}
                    >
                      {selectedIds.has(person.personnelId) ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {person.profilePhoto && getImageUrl(person.profilePhoto) ? (
                        <img
                          src={getImageUrl(person.profilePhoto)!}
                          alt={`${person.firstName} ${person.lastName}`}
                          className="h-10 w-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-gray-300 transition-all"
                        />
                      ) : (
                        <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold ring-2 ring-transparent group-hover:ring-gray-300 transition-all">
                          {person.firstName.charAt(0)}{person.lastName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          {person.firstName} {person.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{person.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getRoleColor(person.role)}`}>
                      {getRoleDisplayName(person.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        <span>{person.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-500 truncate max-w-32">{person.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <EnhancedStatusBadge status={person.status} type="status" />
                  </td>
                  <td className="px-6 py-4">
                    <EnhancedStatusBadge status={person.dutyStatus} type="duty" />
                  </td>
                  <td className="px-6 py-4">
                    {person.currentLatitude && person.currentLongitude ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600 group-hover:text-gray-900 transition-colors">
                          <MapPin className="h-3 w-3 text-blue-500 flex-shrink-0" />
                          <span className="font-mono">
                            {person.currentLatitude.toFixed(4)}, {person.currentLongitude.toFixed(4)}
                          </span>
                        </div>
                        {person.lastLocationUpdate && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            <span>{formatDistanceToNow(new Date(person.lastLocationUpdate), { addSuffix: true })}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" />
                        No location
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Activity className="h-3 w-3 text-blue-500 flex-shrink-0" />
                        <span className="font-medium text-gray-900">{person.totalIncidentsHandled || 0}</span>
                        <span>incidents</span>
                      </div>
                      {person.averageResponseTime && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span>Avg: {person.averageResponseTime.toFixed(1)} min</span>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden p-4">
        {isLoading ? (
          Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-4 mb-3 animate-pulse">
              <div className="flex items-start gap-3 mb-3">
                <div className="h-12 w-12 bg-gray-200 rounded-full flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                  <div className="h-3 w-20 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          ))
        ) : personnel.length === 0 ? (
          <div className="text-center py-12">
            <UserX className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-gray-900 font-medium mb-1">No personnel found</h3>
            <p className="text-gray-500 text-sm">Try adjusting your search filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Personnel ({personnel.length})</h3>
              <button
                onClick={onToggleSelectAll}
                className="hover:bg-gray-100 rounded px-2 py-1 transition-colors"
                aria-label={selectedIds.size === personnel.length && personnel.length > 0 ? "Deselect all" : "Select all"}
              >
                {selectedIds.size === personnel.length && personnel.length > 0 ? (
                  <CheckSquare className="h-4 w-4 text-blue-600" />
                ) : (
                  <Square className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {personnel.map((person) => (
              <MobileCard key={person.personnelId} person={person} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
