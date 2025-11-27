import { useNavigate } from "react-router-dom";
import { 
  CheckSquare, 
  Square, 
  RefreshCw, 
  Flame, 
  MapPin, 
  Calendar, 
  Clock,
  AlertCircle,
  Bell,
  Car
} from "lucide-react";
import type { Incident, IncidentStatus, IncidentPriority } from "@/types/incident.types";

interface IncidentTableProps {
  incidents: Incident[];
  isLoading: boolean;
  selectedIds: Set<string>;
  onToggleSelectAll: () => void;
  flashIds?: Set<string>;
}

export function IncidentTable({
  incidents,
  isLoading,
  selectedIds,
  onToggleSelectAll,
  flashIds,
}: IncidentTableProps) {
  const navigate = useNavigate();

  // Defensive: handle both 'id' and 'incidentId' from API
  const getId = (incident: Incident) => {
    return incident.incidentId || (incident as { id?: string }).id || '';
  };

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
      RESOLVED: "bg-blue-100 text-blue-800 border-blue-200",
      CLOSED: "bg-blue-100 text-blue-800 border-blue-200",
      CANCELLED: "bg-rose-100 text-rose-800 border-rose-200",
      SPAM: "bg-red-50 text-red-600 border-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority: IncidentPriority) => {
    const colors: Record<IncidentPriority, string> = {
      LOW: "bg-blue-100 text-blue-700",
      MEDIUM: "bg-blue-100 text-blue-700",
      HIGH: "bg-orange-100 text-orange-700",
      CRITICAL: "bg-red-100 text-red-700",
    };
    return colors[priority];
  };

  const getStatusIcon = (status: IncidentStatus) => {
    switch (status) {
      case "PENDING_VERIFICATION":
        return <AlertCircle className="h-3.5 w-3.5 mr-1" />;
      case "VERIFIED":
        return <Bell className="h-3.5 w-3.5 mr-1" />;
      case "RESPONDING":
        return <Car className="h-3.5 w-3.5 mr-1" />;
      case "ARRIVED":
        return <MapPin className="h-3.5 w-3.5 mr-1" />;
      case "RESOLVED":
        return <Bell className="h-3.5 w-3.5 mr-1" />;
      default:
        return <Clock className="h-3.5 w-3.5 mr-1" />;
    }
  };

  const getPriorityIcon = (priority: IncidentPriority) => {
    if (priority === "CRITICAL") {
      return <AlertCircle className="h-3.5 w-3.5 mr-1" />;
    } else if (priority === "HIGH") {
      return <AlertCircle className="h-3.5 w-3.5 mr-1" />;
    }
    return null;
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-blue-50 border-b border-blue-200">
            <tr>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={onToggleSelectAll}
                  className="hover:bg-blue-200 rounded p-1 transition-colors duration-200"
                >
                  {selectedIds.size === incidents.length && incidents.length > 0 ? (
                    <CheckSquare className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Square className="h-4 w-4 text-blue-400" />
                  )}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                Tracking #
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                Responders
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                Reported
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-200">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center">
                  <div className="flex justify-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                  <p className="text-blue-500 mt-2">Loading incidents...</p>
                </td>
              </tr>
            ) : incidents.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-blue-500">
                  No incidents found. Try adjusting your filters or create a new incident.
                </td>
              </tr>
              ) : (
              incidents.map((incident) => {
                  const id = getId(incident);
                  const isFlashingRow = !!id && !!flashIds?.has(id);
                  const ringClass = isFlashingRow ? 'ring-2 ring-red-300/60' : '';
                  const shouldPulse = isFlashingRow;
                  return (
                  <tr
                    key={id}
                    className={`hover:bg-linear-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-all duration-300 border-b border-gray-100 hover:border-blue-200 hover:shadow-sm ${shouldPulse ? 'animate-pulse bg-red-50/30' : ''}`}
                    onClick={() => id && navigate(`/incidents/${id}`)}
                  >
                  <td className={`px-6 py-5 ${ringClass} ${shouldPulse ? 'animate-pulse' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 bg-blue-500 rounded-full ${shouldPulse ? 'animate-pulse' : ''}`}></div>
                      <span className="text-sm font-mono font-bold text-blue-900 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                        {incident.trackingNumber}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-linear-to-br from-red-100 to-orange-100 rounded-lg flex items-center justify-center">
                        <Flame className="h-4 w-4 text-red-600" />
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{incident.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 max-w-sm">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-sm text-gray-800 leading-relaxed line-clamp-2">
                        {incident.description}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-5 max-w-xs">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="h-3 w-3 text-blue-600" />
                      </div>
                      <span className="text-sm text-gray-700 leading-relaxed">
                        {incident.address}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(incident.status)}
                      <span
                        className={`px-3 py-1.5 text-xs font-bold rounded-full border shadow-sm ${getStatusColor(
                          incident.status
                        )}`}
                      >
                        {incident.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      {getPriorityIcon(incident.priority)}
                      <span
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm ${getPriorityColor(
                          incident.priority
                        )}`}
                      >
                        {incident.priority}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const responderCount = incident.responders?.length || incident.assignedPersonnel?.length || 0;
                        if (responderCount > 0) {
                          return (
                            <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                <Bell className="h-3 w-3 text-white" />
                              </div>
                              <span className="text-sm font-bold text-blue-900">{responderCount}</span>
                              <span className="text-xs text-blue-600 font-medium">responding</span>
                            </div>
                          );
                        }
                        return (
                          <span className="text-xs text-gray-400 font-medium">No responders</span>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Calendar className="h-3 w-3 text-blue-500" />
                        <span className="font-medium">Nov 13, 2025</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3 text-blue-400" />
                        <span>13:19</span>
                      </div>
                    </div>
                  </td>
                </tr>
              );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
