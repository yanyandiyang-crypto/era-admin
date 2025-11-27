import React, { useMemo } from "react";
import {
  FileText,
  Clock,
  MapPin,
  User,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Eye,
  Users,
  AlertCircle,
  Zap,
  Flame,
  Activity,
  Heart,
  Car,
  Shield,
  CloudRain,
  Cloudy,
  HelpCircle,
  Timer,
  Navigation
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { format } from "date-fns";
import type { Incident, IncidentPriority, IncidentStatus, IncidentType } from "@/types/incident.types";

interface ReportsIncidentListProps {
  incidents: Incident[];
  isLoadingIncidents: boolean;
  setSelectedIncident: React.Dispatch<React.SetStateAction<Incident | null>>;
  setShowIncidentModal: (show: boolean) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}



export default function ReportsIncidentList({
  incidents,
  isLoadingIncidents,
  setSelectedIncident,
  setShowIncidentModal,
  sortBy,
  sortOrder,
}: ReportsIncidentListProps) {
  // Enhanced priority icons and colors
  const getPriorityBadge = (priority: IncidentPriority) => {
    const configs = {
      CRITICAL: { color: "bg-red-100 text-red-800 border-red-200", icon: Zap, label: "Critical" },
      HIGH: { color: "bg-orange-100 text-orange-800 border-orange-200", icon: AlertTriangle, label: "High" },
      MEDIUM: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: AlertCircle, label: "Medium" },
      LOW: { color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle, label: "Low" }
    };
    return configs[priority] || configs.LOW;
  };

  // Enhanced incident type icons
  const getIncidentTypeIcon = (type: IncidentType) => {
    const icons = {
      FIRE: Flame,
      MEDICAL: Heart,
      ACCIDENT: Car,
      CRIME: Shield,
      FLOOD: CloudRain,
      NATURAL_DISASTER: Cloudy,
      OTHER: HelpCircle
    };
    return icons[type] || HelpCircle;
  };

  // Enhanced status indicators
  const getStatusBadge = (status: IncidentStatus) => {
    const configs: Record<IncidentStatus, { color: string; icon: any; label: string }> = {
      PENDING_VERIFICATION: { color: "bg-yellow-100 text-yellow-800", icon: Clock, label: "Pending Verification" },
      VERIFIED: { color: "bg-blue-100 text-blue-800", icon: CheckCircle, label: "Verified" },
      REPORTED: { color: "bg-gray-100 text-gray-800", icon: FileText, label: "Reported" },
      ACKNOWLEDGED: { color: "bg-indigo-100 text-indigo-800", icon: UserCheck, label: "Acknowledged" },
      DISPATCHED: { color: "bg-purple-100 text-purple-800", icon: Users, label: "Dispatched" },
      IN_PROGRESS: { color: "bg-orange-100 text-orange-800", icon: Activity, label: "In Progress" },
      RESPONDING: { color: "bg-orange-100 text-orange-800", icon: Navigation, label: "Responding" },
      ARRIVED: { color: "bg-red-100 text-red-800", icon: MapPin, label: "On Scene" },
      PENDING_RESOLVE: { color: "bg-amber-100 text-amber-800", icon: Clock, label: "Pending Resolution" },
      RESOLVED: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Resolved" },
      CLOSED: { color: "bg-gray-100 text-gray-800", icon: XCircle, label: "Closed" },
      CANCELLED: { color: "bg-red-100 text-red-600", icon: XCircle, label: "Cancelled" },
      SPAM: { color: "bg-red-50 text-red-700", icon: AlertTriangle, label: "Spam" }
    };
    return configs[status] || { color: "bg-gray-100 text-gray-800", icon: HelpCircle, label: status.replace(/_/g, ' ') };
  };

  // Sorted incidents (no filtering since we removed search)
  const sortedIncidents = useMemo(() => {
    let sorted = [...incidents];

    // Sort incidents
    sorted.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy || 'createdAt') {
        case 'priority':
          const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
          aVal = priorityOrder[a.priority];
          bVal = priorityOrder[b.priority];
          break;
        case 'status':
          const statusOrder: Record<IncidentStatus, number> = {
            PENDING_VERIFICATION: 0, VERIFIED: 1, REPORTED: 2, ACKNOWLEDGED: 3,
            DISPATCHED: 4, IN_PROGRESS: 5, RESPONDING: 6, ARRIVED: 7, PENDING_RESOLVE: 8,
            RESOLVED: 9, CLOSED: 10, CANCELLED: 11, SPAM: 12
          };
          aVal = statusOrder[a.status];
          bVal = statusOrder[b.status];
          break;
        case 'responseTime':
          aVal = a.responseTime ?? 999;
          bVal = b.responseTime ?? 999;
          break;
        case 'reportedAt':
        default:
          aVal = new Date(a.reportedAt).getTime();
          bVal = new Date(b.reportedAt).getTime();
          break;
      }

      if ((sortOrder || 'desc') === 'asc') {
        return aVal - bVal;
      } else {
        return bVal - aVal;
      }
    });

    return sorted;
  }, [incidents, sortBy || 'createdAt', sortOrder || 'desc']);

  // Enhanced loading skeleton
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                <div className="h-6 bg-gray-200 rounded-full w-20"></div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="flex justify-between">
                <div className="h-3 bg-gray-200 rounded w-20"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="h-8 bg-gray-200 rounded w-full"></div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  // Incident card component
  const IncidentCard = ({ incident }: { incident: Incident }) => {
    const priorityConfig = getPriorityBadge(incident.priority);
    const statusConfig = getStatusBadge(incident.status);
    const TypeIcon = getIncidentTypeIcon(incident.type);
    const StatusIcon = statusConfig.icon;
    const PriorityIcon = priorityConfig.icon;

    const assignedPersonnelCount = incident.responders?.length || incident.assignedPersonnel?.length || 0;

    return (
      <Card className={`group relative overflow-hidden border-0 bg-gradient-to-br from-white/95 via-white/90 to-slate-50/95 backdrop-blur-xl shadow-xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 hover:scale-[1.025] ring-1 ring-white/20 hover:ring-blue-200/50 ${
        ['RESOLVED', 'CLOSED'].includes(incident.status)
          ? 'opacity-95 hover:opacity-100'
          : 'opacity-100'
      }`}>

        {/* Modern gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-slate-100/30 rounded-xl pointer-events-none" />

        {/* Status indicators with colored border elements - Enhanced visibility */}
        {/* Top border indicator */}
        <div className={`absolute top-0 left-0 right-0 h-2 z-10 ${
          incident.status === 'RESOLVED' ? 'bg-green-500' :
          incident.status === 'CLOSED' ? 'bg-gray-500' :
          incident.priority === 'CRITICAL' ? 'bg-red-500' :
          incident.priority === 'HIGH' ? 'bg-orange-500' :
          incident.status === 'VERIFIED' ? 'bg-blue-500' :
          incident.status === 'ACKNOWLEDGED' ? 'bg-indigo-500' :
          incident.status === 'DISPATCHED' ? 'bg-purple-500' :
          incident.status === 'RESPONDING' || incident.status === 'IN_PROGRESS' ? 'bg-orange-500' :
          incident.status === 'ARRIVED' ? 'bg-red-500' :
          incident.status === 'PENDING_RESOLVE' ? 'bg-amber-500' :
          incident.status === 'PENDING_VERIFICATION' ? 'bg-yellow-500' :
          incident.status === 'REPORTED' ? 'bg-gray-500' :
          incident.status === 'CANCELLED' || incident.status === 'SPAM' ? 'bg-red-500' :
          'bg-gray-400'
        }`} />

        {/* Left border indicator */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${
          incident.status === 'RESOLVED' ? 'bg-green-500' :
          incident.status === 'CLOSED' ? 'bg-gray-500' :
          incident.priority === 'CRITICAL' ? 'bg-red-500' :
          incident.priority === 'HIGH' ? 'bg-orange-500' :
          incident.status === 'VERIFIED' ? 'bg-blue-500' :
          incident.status === 'ACKNOWLEDGED' ? 'bg-indigo-500' :
          incident.status === 'DISPATCHED' ? 'bg-purple-500' :
          incident.status === 'RESPONDING' || incident.status === 'IN_PROGRESS' ? 'bg-orange-500' :
          incident.status === 'ARRIVED' ? 'bg-red-500' :
          incident.status === 'PENDING_RESOLVE' ? 'bg-amber-500' :
          incident.status === 'PENDING_VERIFICATION' ? 'bg-yellow-500' :
          incident.status === 'REPORTED' ? 'bg-gray-500' :
          incident.status === 'CANCELLED' || incident.status === 'SPAM' ? 'bg-red-500' :
          'bg-gray-400'
        }`} />

        {/* Right border indicator */}
        <div className={`absolute right-0 top-0 bottom-0 w-1 ${
          incident.status === 'RESOLVED' ? 'bg-green-500' :
          incident.status === 'CLOSED' ? 'bg-gray-500' :
          incident.priority === 'CRITICAL' ? 'bg-red-500' :
          incident.priority === 'HIGH' ? 'bg-orange-500' :
          incident.status === 'VERIFIED' ? 'bg-blue-500' :
          incident.status === 'ACKNOWLEDGED' ? 'bg-indigo-500' :
          incident.status === 'DISPATCHED' ? 'bg-purple-500' :
          incident.status === 'RESPONDING' || incident.status === 'IN_PROGRESS' ? 'bg-orange-500' :
          incident.status === 'ARRIVED' ? 'bg-red-500' :
          incident.status === 'PENDING_RESOLVE' ? 'bg-amber-500' :
          incident.status === 'PENDING_VERIFICATION' ? 'bg-yellow-500' :
          incident.status === 'REPORTED' ? 'bg-gray-500' :
          incident.status === 'CANCELLED' || incident.status === 'SPAM' ? 'bg-red-500' :
          'bg-gray-400'
        }`} />

        {/* Bottom border indicator */}
        <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-xl ${
          incident.status === 'RESOLVED' ? 'bg-green-500' :
          incident.status === 'CLOSED' ? 'bg-gray-500' :
          incident.priority === 'CRITICAL' ? 'bg-red-500' :
          incident.priority === 'HIGH' ? 'bg-orange-500' :
          incident.status === 'VERIFIED' ? 'bg-blue-500' :
          incident.status === 'ACKNOWLEDGED' ? 'bg-indigo-500' :
          incident.status === 'DISPATCHED' ? 'bg-purple-500' :
          incident.status === 'RESPONDING' || incident.status === 'IN_PROGRESS' ? 'bg-orange-500' :
          incident.status === 'ARRIVED' ? 'bg-red-500' :
          incident.status === 'PENDING_RESOLVE' ? 'bg-amber-500' :
          incident.status === 'PENDING_VERIFICATION' ? 'bg-yellow-500' :
          incident.status === 'REPORTED' ? 'bg-gray-500' :
          incident.status === 'CANCELLED' || incident.status === 'SPAM' ? 'bg-red-500' :
          'bg-gray-400'
        }`} />

        <CardHeader className="relative pb-5 z-20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              {/* Enhanced incident type icon with modern styling */}
              <div className={`flex-shrink-0 mt-1 p-1 rounded-xl transition-all duration-300 ${
                incident.type === 'FIRE' ? 'bg-gradient-to-br from-red-50 to-red-100 shadow-sm ring-1 ring-red-200/50' :
                incident.type === 'MEDICAL' ? 'bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm ring-1 ring-blue-200/50' :
                incident.type === 'ACCIDENT' ? 'bg-gradient-to-br from-yellow-50 to-amber-100 shadow-sm ring-1 ring-yellow-200/50' :
                incident.type === 'CRIME' ? 'bg-gradient-to-br from-purple-50 to-purple-100 shadow-sm ring-1 ring-purple-200/50' :
                'bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm ring-1 ring-gray-200/50'
              }`}>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                  incident.type === 'FIRE' ? 'bg-red-100' :
                  incident.type === 'MEDICAL' ? 'bg-blue-100' :
                  incident.type === 'ACCIDENT' ? 'bg-yellow-100' :
                  incident.type === 'CRIME' ? 'bg-purple-100' :
                  'bg-gray-100'
                }`}>
                  <TypeIcon className={`w-4 h-4 ${
                    incident.type === 'FIRE' ? 'text-red-600' :
                    incident.type === 'MEDICAL' ? 'text-blue-600' :
                    incident.type === 'ACCIDENT' ? 'text-yellow-600' :
                    incident.type === 'CRIME' ? 'text-purple-600' :
                    'text-gray-600'
                  }`} />
                </div>
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                {/* Modern title with gradient effect on hover */}
                <h4 className="font-bold text-slate-900 text-lg leading-tight group-hover:bg-gradient-to-r group-hover:from-blue-700 group-hover:to-indigo-700 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                  {incident.title}
                </h4>

                <div className="flex items-center gap-3">
                  {/* Sleek tracking number */}
                  <div className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-mono rounded-md border border-slate-200">
                    {incident.trackingNumber}
                  </div>

                  {/* Enhanced personnel badge */}
                  {assignedPersonnelCount > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200/60 shadow-sm">
                      <Users className="w-3 h-3" />
                      {assignedPersonnelCount}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modernized badges with improved styling */}
            <div className="flex flex-col gap-2.5 flex-shrink-0">
              <div className={`px-3 py-1.5 rounded-xl font-bold text-xs border-2 shadow-lg transition-all duration-300 ${
                priorityConfig.label === 'Critical' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-400 shadow-red-200 hover:shadow-red-300' :
                priorityConfig.label === 'High' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-400 shadow-orange-200 hover:shadow-orange-300' :
                priorityConfig.label === 'Medium' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-slate-800 border-yellow-400 shadow-yellow-200 hover:shadow-yellow-300' :
                'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-400 shadow-green-200 hover:shadow-green-300'
              }`}>
                <PriorityIcon className="w-3.5 h-3.5 inline mr-1.5" />
                {priorityConfig.label}
              </div>

              <div className={`px-3 py-1 rounded-lg font-semibold text-xs border border-opacity-60 ${
                statusConfig.color} shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105`}>
                <StatusIcon className="w-3 h-3 inline mr-1.5" />
                {statusConfig.label}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative pt-0 px-6 z-20">
          {/* Enhanced description with modern styling */}
          <div className="mb-5">
            <p className="text-sm text-slate-700 leading-relaxed line-clamp-2 group-hover:text-slate-800 transition-colors">
              {incident.description}
            </p>
          </div>

          {/* Modern incident details grid */}
          <div className="space-y-3 bg-gradient-to-br from-slate-50/50 to-gray-50/50 rounded-xl p-4 border border-slate-200/60 shadow-inner">
            <div className="grid grid-cols-1 gap-3">
              {/* Location with enhanced styling */}
              <div className="flex items-center gap-3 p-2 rounded-lg bg-gradient-to-r from-red-50 to-rose-50 border border-red-100/60">
                <div className="p-1.5 rounded-full bg-white shadow-sm border border-red-200/50">
                  <MapPin className="w-3.5 h-3.5 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-red-700 uppercase tracking-wide">Location</span>
                  <p className="text-sm text-slate-700 truncate font-medium">{incident.address}</p>
                </div>
              </div>

              {/* Reporter with enhanced styling */}
              <div className="flex items-center gap-3 p-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/60">
                <div className="p-1.5 rounded-full bg-white shadow-sm border border-blue-200/50">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">Reported By</span>
                  <p className="text-sm text-slate-700 font-medium">{incident.reporterName || 'Anonymous'}</p>
                </div>
              </div>
            </div>

            {/* Enhanced timestamp and response info */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Calendar className="w-3 h-3" />
                <div>
                  <span className="font-medium">{format(new Date(incident.reportedAt), 'MMM d, HH:mm')}</span>
                  <span className="text-slate-500 ml-1">reported</span>
                </div>
              </div>

              {incident.responseTime && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200 shadow-sm">
                  <Timer className="w-3 h-3" />
                  <span>{incident.responseTime}min</span>
                  <span className="text-emerald-600 ml-1">response</span>
                </div>
              )}
            </div>

            {/* Photos indicator with modern styling */}
            {incident.photos && incident.photos.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100/60 rounded-lg">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-600" />
                  <span className="text-xs font-semibold text-purple-700">{incident.photos.length}</span>
                  <span className="text-xs text-purple-600">photo{incident.photos.length > 1 ? 's' : ''}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="relative pt-6 px-6 pb-6 z-20">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIncident(incident);
              setShowIncidentModal(true);
            }}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 border-2 border-blue-500 hover:border-blue-600 text-white hover:text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] group"
          >
            <Eye className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
            <span className="font-medium">View Details</span>
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="space-y-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {isLoadingIncidents ? (
        <LoadingSkeleton />
      ) : sortedIncidents.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No incidents available
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            Incidents will appear here when reported.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active Incidents */}
          {(() => {
            const activeIncidents = sortedIncidents.filter((incident: Incident) =>
              !['RESOLVED', 'CLOSED'].includes(incident.status)
            );

            return activeIncidents.length > 0 && (
              <div className="space-y-6">
                <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-2xl shadow-xl p-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 via-red-600/20 to-pink-600/20 backdrop-blur-sm"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 animate-pulse"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center shadow-lg">
                          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                          <AlertTriangle className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white tracking-tight">
                          Active Incidents
                        </h3>
                        <p className="text-orange-100 font-medium">
                          {activeIncidents.length} incident{activeIncidents.length !== 1 ? 's' : ''} requiring immediate attention
                        </p>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center gap-2">
                      <div className="px-3 py-1 bg-red-500/20 text-white text-xs font-bold rounded-full border border-red-300/30 backdrop-blur-sm">
                        HIGH PRIORITY
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeIncidents.map((incident: Incident) => (
                    <IncidentCard key={incident.incidentId} incident={incident} />
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Resolved Incidents */}
          {(() => {
            const resolvedIncidents = sortedIncidents.filter((incident: Incident) =>
              ['RESOLVED', 'CLOSED'].includes(incident.status)
            );

            return resolvedIncidents.length > 0 && (
              <div className="space-y-6">
                <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 rounded-2xl shadow-xl p-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-green-600/20 to-teal-600/20 backdrop-blur-sm"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center shadow-lg">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center shadow-lg">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white tracking-tight">
                          Resolved Incidents
                        </h3>
                        <p className="text-emerald-100 font-medium">
                          {resolvedIncidents.length} incident{resolvedIncidents.length !== 1 ? 's' : ''} successfully handled
                        </p>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center gap-2">
                      <div className="px-3 py-1 bg-emerald-500/20 text-white text-xs font-bold rounded-full border border-emerald-300/30 backdrop-blur-sm">
                        ✓ SUCCESSFUL
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {resolvedIncidents.map((incident: Incident) => (
                    <IncidentCard key={incident.incidentId} incident={incident} />
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
