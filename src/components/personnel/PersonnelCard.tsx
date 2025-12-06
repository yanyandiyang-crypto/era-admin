import { useNavigate } from "react-router-dom";
import { MapPin, Phone, Clock, Mail, Activity, Bell, BellOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Personnel, PersonnelRole, PersonnelStatus, DutyStatus } from "@/types/personnel.types";
import { getImageUrl } from "@/lib/constants";

interface PersonnelCardProps {
  person: Personnel;
}

export function PersonnelCard({ person }: PersonnelCardProps) {
  const navigate = useNavigate();

  const getRoleColor = (role: PersonnelRole) => {
    const colors: Record<PersonnelRole, string> = {
      RESPONDER: "from-orange-500 to-orange-600",
      MEDIC: "from-blue-500 to-blue-600",
      FIREFIGHTER: "from-red-500 to-red-600",
      POLICE: "from-indigo-500 to-indigo-600",
      COORDINATOR: "from-purple-500 to-purple-600",
    };
    return colors[role] || "from-gray-500 to-gray-600";
  };

  const getRoleBadgeColor = (role: PersonnelRole) => {
    const colors: Record<PersonnelRole, string> = {
      RESPONDER: "bg-orange-100 text-orange-700 border-orange-200",
      MEDIC: "bg-blue-100 text-blue-700 border-blue-200",
      FIREFIGHTER: "bg-red-100 text-red-700 border-red-200",
      POLICE: "bg-indigo-100 text-indigo-700 border-indigo-200",
      COORDINATOR: "bg-purple-100 text-purple-700 border-purple-200",
    };
    return colors[role] || "bg-gray-100 text-gray-700 border-gray-200";
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

  const getStatusColor = (status: PersonnelStatus) => {
    const colors: Record<PersonnelStatus, string> = {
      ON_DUTY: "bg-green-100 text-green-800 border-green-200", // Primary active status
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

  const getDutyStatusColor = (dutyStatus?: DutyStatus | string) => {
    if (!dutyStatus) return "bg-gray-400";

    // Extended colors to handle both DutyStatus and PersonnelStatus
    const colors: Record<string, string> = {
      // DutyStatus values
      AVAILABLE: "bg-blue-500", // Blue for available duty
      RESPONDING: "bg-orange-500",
      ON_SCENE: "bg-red-500",
      UNAVAILABLE: "bg-gray-400",

      // PersonnelStatus values (backend may return these)
      ON_DUTY: "bg-green-500", // Green for on duty
      ON_BREAK: "bg-yellow-500",
      OFF_DUTY: "bg-gray-400",
      INACTIVE: "bg-gray-300",
      SUSPENDED: "bg-red-300",
    };
    return colors[dutyStatus] || "bg-gray-400";
  };

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-200/50 transition-all duration-300 overflow-hidden group cursor-pointer hover:-translate-y-1"
      onClick={() => navigate(`/personnel/${person.personnelId}`)}
    >
      {/* Header with Avatar */}
      <div className="relative">
        <div className={`h-24 bg-linear-to-r ${getRoleColor(person.role)} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
        </div>
        <div className="absolute -bottom-10 left-6">
          {person.profilePhoto && getImageUrl(person.profilePhoto) ? (
            <img
              src={getImageUrl(person.profilePhoto)!}
              alt={`${person.firstName} ${person.lastName}`}
              className="h-20 w-20 rounded-full object-cover border-4 border-white shadow-lg ring-2 ring-white/50"
            />
          ) : (
            <div className={`h-20 w-20 bg-linear-to-br ${getRoleColor(person.role)} rounded-full flex items-center justify-center text-white font-bold text-2xl border-4 border-white shadow-lg ring-2 ring-white/50`}>
              {person.firstName.charAt(0)}{person.lastName.charAt(0)}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="pt-12 px-6 pb-6">
        {/* Name and ID */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            {person.firstName} {person.lastName}
          </h3>
          <p className="text-sm text-gray-500">{person.employeeId}</p>
        </div>

        {/* Role and Status Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getRoleBadgeColor(person.role)}`}>
            {getRoleDisplayName(person.role)}
          </span>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(person.status)}`}>
            {person.status?.replace("_", " ") || "N/A"}
          </span>
          {/* Alert Status Badge */}
          <span className={`px-3 py-1 text-xs font-semibold rounded-full border flex items-center gap-1 ${
            person.alertsEnabled !== false 
              ? "bg-green-100 text-green-700 border-green-200" 
              : "bg-red-100 text-red-700 border-red-200"
          }`}>
            {person.alertsEnabled !== false ? (
              <>
                <Bell className="h-3 w-3" />
                Alerts On
              </>
            ) : (
              <>
                <BellOff className="h-3 w-3" />
                Alerts Off
              </>
            )}
          </span>
        </div>

        {/* Duty Status */}
        <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className={`h-3 w-3 rounded-full ${getDutyStatusColor(person.dutyStatus)} animate-pulse`} />
          <span className="text-sm font-medium text-gray-900">
            {person.dutyStatus?.replace("_", " ") || "N/A"}
          </span>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="h-4 w-4 text-gray-400" />
            <span>{person.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="truncate">{person.email}</span>
          </div>
        </div>

        {/* Location */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          {person.currentLatitude && person.currentLongitude ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <MapPin className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Location Tracked</span>
              </div>
              <div className="text-xs text-gray-500 ml-6">
                {person.currentLatitude.toFixed(4)}, {person.currentLongitude.toFixed(4)}
              </div>
              {person.lastLocationUpdate && (
                <div className="flex items-center gap-1 text-xs text-gray-500 ml-6">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(person.lastLocationUpdate), { addSuffix: true })}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MapPin className="h-4 w-4" />
              <span>No location data</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4 text-gray-400" />
            <span className="font-semibold text-gray-900">
              {person.totalIncidentsHandled || 0}
            </span>
            <span className="text-gray-500">incidents</span>
          </div>
          {person.averageResponseTime && (
            <div className="text-sm">
              <span className="font-semibold text-gray-900">
                {person.averageResponseTime.toFixed(1)}
              </span>
              <span className="text-gray-500"> min avg</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
