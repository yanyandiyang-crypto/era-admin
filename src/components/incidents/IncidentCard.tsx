import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Clock,
  User,
  Phone,
  AlertCircle,
  Users,
  Image as ImageIcon,
  Flame,
  Stethoscope,
  Car,
  Shield,
  Droplets,
  HelpCircle,
  Calendar,
} from "lucide-react";
import { useState, useEffect } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import type { Incident, IncidentStatus, IncidentPriority } from "@/types/incident.types";
import { IncidentActions } from "./IncidentActions";
import { AcknowledgmentBadge } from "./AcknowledgmentBadge";
import { incidentService } from "@/services/incident.service";

interface IncidentCardProps {
  incident: Incident;
  onRefresh?: () => void;
  isFlashing?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function IncidentCard({ incident, onRefresh, isFlashing }: IncidentCardProps) {
  const navigate = useNavigate();

  // Defensive: handle both 'id' and 'incidentId' from API
  const getId = (): string => {
    return incident.incidentId || (incident as { id?: string }).id || '';
  };

  const handleClick = () => {
    const id = getId();
    if (id) {
      navigate(`/incidents/${id}`);
    }
  };

  const getStatusIcon = (status: IncidentStatus) => {
    switch (status) {
      case "PENDING_VERIFICATION":
        return <AlertCircle className="h-3.5 w-3.5 mr-1" />;
      case "VERIFIED":
        return <AlertCircle className="h-3.5 w-3.5 mr-1" />;
      case "RESPONDING":
        return <Car className="h-3.5 w-3.5 mr-1" />;
      case "ARRIVED":
        return <MapPin className="h-3.5 w-3.5 mr-1" />;
      case "RESOLVED":
        return <AlertCircle className="h-3.5 w-3.5 mr-1" />;
      default:
        return <Clock className="h-3.5 w-3.5 mr-1" />;
    }
  };

  const getPriorityIcon = (priority: IncidentPriority) => {
    if (priority === "CRITICAL") {
      return <AlertCircle className="h-3.5 w-3.5 mr-0.5" />;
    } else if (priority === "HIGH") {
      return <AlertCircle className="h-3.5 w-3.5 mr-0.5" />;
    }
    return null;
  };
  
  const getIncidentTypeColor = (type: string) => {
    switch (type) {
      case "FIRE":
        return "bg-red-100 border-red-300";
      case "MEDICAL":
        return "bg-blue-100 border-blue-300";
      case "ACCIDENT":
        return "bg-orange-100 border-orange-300";
      case "CRIME":
        return "bg-indigo-100 border-indigo-300";
      case "FLOOD":
        return "bg-cyan-100 border-cyan-300";
      case "NATURAL_DISASTER":
        return "bg-rose-100 border-rose-300";
      default:
        return "bg-gray-100 border-gray-300";
    }
  };

  const getIncidentTypeIcon = (type: string) => {
    switch (type) {
      case "FIRE":
        return <Flame className="h-3.5 w-3.5 mr-1.5 text-red-500" />;
      case "MEDICAL":
        return <Stethoscope className="h-3.5 w-3.5 mr-1.5 text-blue-500" />;
      case "ACCIDENT":
        return <Car className="h-3.5 w-3.5 mr-1.5 text-orange-500" />;
      case "CRIME":
        return <Shield className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />;
      case "FLOOD":
        return <Droplets className="h-3.5 w-3.5 mr-1.5 text-blue-500" />;
      case "NATURAL_DISASTER":
        return <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-red-500" />;
      default:
        return <HelpCircle className="h-3.5 w-3.5 mr-1.5 text-gray-500" />;
    }
  };
  
  // Animation for newly created incidents
  const [isNew, setIsNew] = useState(false);
  // External flash flag for critical incidents
  const [externalFlash, setExternalFlash] = useState(false);
  // Status change flash animation
  const [statusChanged, setStatusChanged] = useState(false);
  // Live time display
  const [liveTime, setLiveTime] = useState<string>("");
  
  useEffect(() => {
    // Check if incident was reported in the last 5 minutes
    const reportTime = new Date(incident.reportedAt).getTime();
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000; // 5 minutes in milliseconds
    
    if (reportTime > fiveMinutesAgo) {
      setIsNew(true);
      
      // Remove the "new" status after a while
      const timer = setTimeout(() => {
        setIsNew(false);
      }, 10000); // 10 seconds
      
      return () => clearTimeout(timer);
    }
  }, [incident.reportedAt]);

  // Respond to external flash request (prop-driven)
  useEffect(() => {
    if (isFlashing) {
      setExternalFlash(true);
      const t = setTimeout(() => setExternalFlash(false), 12000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isFlashing]);

  // Update live time display
  useEffect(() => {
    const updateLiveTime = () => {
      setLiveTime(formatDistanceToNow(new Date(incident.reportedAt), { addSuffix: true }));
    };

    // Update immediately
    updateLiveTime();

    // Update every minute for relative time
    const interval = setInterval(updateLiveTime, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [incident.reportedAt]);

  // Listen for status change events
  useEffect(() => {
    const handleStatusChange = (event: CustomEvent) => {
      const { incidentId } = event.detail;
      if (getId() === incidentId) {
        setStatusChanged(true);
        setTimeout(() => setStatusChanged(false), 3000); // Flash for 3 seconds
      }
    };

    window.addEventListener('incident:status-changed', handleStatusChange as EventListener);

    return () => {
      window.removeEventListener('incident:status-changed', handleStatusChange as EventListener);
    };
  }, [incident.incidentId]);

  // Listen for real-time personnel response updates
  useEffect(() => {
    const handlePersonnelResponse = (event: CustomEvent) => {
      const { incidentId } = event.detail;
      if (getId() === incidentId) {
        // Trigger a refresh to get updated responder count
        onRefresh?.();
      }
    };

    window.addEventListener('personnel:response', handlePersonnelResponse as EventListener);

    return () => {
      window.removeEventListener('personnel:response', handlePersonnelResponse as EventListener);
    };
  }, [incident.incidentId, onRefresh]);

  // Determine visual classes: pulse if new OR externally flashed
  const shouldPulse = isNew || externalFlash;
  const ringClass = externalFlash || incident.priority === "CRITICAL" ? "ring-2 ring-red-300/60" : (isNew ? "ring-2 ring-blue-200/50" : "");

  return (
    <Card
      pulse={shouldPulse}
      pulseClass={ringClass}
      className={`bg-white border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 cursor-pointer backdrop-blur-sm overflow-hidden relative group ${incident.status !== "PENDING_VERIFICATION" && incident.priority === "CRITICAL" ? "border-l-4 border-l-red-500 shadow-red-500/20" : incident.status !== "PENDING_VERIFICATION" && incident.priority === "HIGH" ? "border-l-4 border-l-orange-500 shadow-orange-500/20" : incident.status !== "PENDING_VERIFICATION" && incident.priority === "MEDIUM" ? "border-l-4 border-l-blue-500 shadow-blue-500/20" : "hover:border-gray-300"}`}
      aria-live={externalFlash ? 'polite' : undefined}
    >
      {/* Compact Card Header */}
      <div className={`p-3 border-b relative overflow-hidden ${getIncidentTypeColor(incident.type)}`}>
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        <div className="flex items-start gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Compact Title & Tracking */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 bg-gray-900 text-gray-100 text-xs font-mono font-bold rounded-md border border-gray-800 shadow-sm">
                  {incident.trackingNumber}
                </span>
                {/* Only show priority if incident is verified (not PENDING_VERIFICATION) */}
                {incident.status !== "PENDING_VERIFICATION" && (
                  <span
                    className={`px-2 py-0.5 text-xs font-bold rounded-md border flex items-center gap-1 shadow-sm ${
                      incident.priority === "CRITICAL" 
                        ? "bg-red-600 text-white border-red-700" 
                        : incident.priority === "HIGH"
                        ? "bg-orange-500 text-white border-orange-600"
                        : incident.priority === "MEDIUM"
                        ? "bg-blue-500 text-white border-blue-600"
                        : "bg-gray-500 text-white border-gray-600"
                    }`}
                  >
                    {getPriorityIcon(incident.priority)}
                    {incident.priority}
                  </span>
                )}
              </div>
              <h3
                className="text-base font-bold text-gray-900 line-clamp-1 hover:text-blue-600 transition-colors cursor-pointer"
                onClick={handleClick}
              >
                {incident.title}
              </h3>
            </div>
          </div>

          {/* Compact Status Badge */}
          <div
            className={`px-2.5 py-1 text-xs font-bold rounded-full border whitespace-nowrap shadow-sm flex items-center shrink-0 bg-linear-to-r transform transition-all duration-500 ${
              statusChanged ? 'scale-110 ring-2 ring-blue-300 shadow-lg shadow-blue-500/50' : ''
            } ${
              incident.status === 'RESPONDING' ? 'from-orange-500 to-orange-600 text-white border-orange-600' :
              incident.status === 'ARRIVED' ? 'from-green-500 to-green-600 text-white border-green-600' :
              incident.status === 'IN_PROGRESS' ? 'from-purple-500 to-purple-600 text-white border-purple-600' :
              incident.status === 'RESOLVED' ? 'from-emerald-500 to-emerald-600 text-white border-emerald-600' :
              incident.status === 'PENDING_VERIFICATION' ? 'from-red-500 to-red-600 text-white border-red-600' :
              incident.status === 'PENDING_RESOLVE' ? 'from-yellow-400 to-yellow-500 text-black border-yellow-500' :
              'from-blue-500 to-blue-600 text-white border-blue-600'
            }`}
          >
            {getStatusIcon(incident.status)}
            {incident.status.replace(/_/g, ' ')}
          </div>
        </div>
      </div>

      {/* Compact Card Body */}
      <div
        className="p-3 space-y-2 bg-linear-to-br from-white to-gray-50/30"
        onClick={handleClick}
      >
        {/* Compact Type */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-linear-to-r from-gray-50 to-gray-100 text-gray-800 text-xs font-bold rounded-lg shadow-sm border border-gray-200 flex items-center">
            {getIncidentTypeIcon(incident.type)}
            {incident.type}
          </div>
        </div>

        {/* Compact Description */}
        <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
          {incident.description}
        </p>

        {/* Compact Info Grid */}
        <div className="grid grid-cols-1 gap-2">
          {/* Location */}
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <div className="p-1.5 rounded-full bg-blue-50 border border-blue-100">
              <MapPin className="h-3.5 w-3.5 text-blue-500" />
            </div>
            <span className="line-clamp-1 pt-0.5">{incident.address}</span>
          </div>

          {/* Reporter */}
          {incident.reporterName && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="p-1.5 rounded-full bg-gray-50 border border-gray-100">
                <User className="h-3.5 w-3.5 text-gray-500" />
              </div>
              <span className="truncate pt-0.5">{incident.reporterName}</span>
            </div>
          )}

          {/* Phone */}
          {incident.reporterPhone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="p-1.5 rounded-full bg-green-50 border border-green-100">
                <Phone className="h-3.5 w-3.5 text-green-500" />
              </div>
              <a 
                href={`tel:${incident.reporterPhone}`} 
                className="pt-0.5 hover:text-blue-600 hover:underline transition-colors" 
                onClick={(e) => e.stopPropagation()}
              >
                {incident.reporterPhone}
              </a>
            </div>
          )}
        </div>

        {/* Compact Metadata */}
        <div className="flex items-center justify-between pt-2 mt-1 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
              <Calendar className="h-3.5 w-3.5 text-blue-400" />
              <span>{format(new Date(incident.reportedAt), "MMM dd")}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
              <Clock className="h-3.5 w-3.5 text-indigo-400" />
              <span className="font-mono">{liveTime}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {(() => {
              const responderCount = incident.responders?.length || incident.assignedPersonnel?.length || 0;
              if (responderCount > 0) {
                return (
                  <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg text-blue-600 font-medium border border-blue-100">
                    <Users className="h-3.5 w-3.5" />
                    <span>{responderCount}</span>
                    <span className="text-xs text-blue-500">responding</span>
                  </div>
                );
              }
              return null;
            })()}
            {incident.photos && incident.photos.length > 0 && (
              <div className="flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-lg text-purple-600 font-medium border border-purple-100">
                <ImageIcon className="h-3.5 w-3.5" />
                <span>{incident.photos.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Compact Acknowledgment Badge */}
        {incident.totalPersonnelNotified !== undefined &&
         incident.totalPersonnelNotified > 0 &&
         incident.acknowledgmentCount !== undefined && (
          <div className="pt-2 mt-1 border-t border-gray-200">
            <AcknowledgmentBadge
              incidentId={getId()}
              acknowledgmentCount={incident.acknowledgmentCount || 0}
              totalPersonnelNotified={incident.totalPersonnelNotified || 0}
              acknowledgmentPercentage={incident.acknowledgmentPercentage || 0}
              size="sm"
            />
          </div>
        )}

        {/* Compact Action Buttons */}
        <div className="pt-2 mt-1 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
          <IncidentActions
            incident={incident}
            compact={true}
            onVerify={async (priority, notes) => {
              try {
                await incidentService.verifyIncident(getId(), priority, notes);
                toast.success("✅ Incident verified - All personnel notified");
                onRefresh?.();
              } catch (error: unknown) {
                const message = error instanceof Error ? error.message : "Failed to verify";
                toast.error(message);
              }
            }}
            onMarkAsSpam={async (reason) => {
              try {
                await incidentService.markAsSpam(getId(), reason);
                toast.success("❌ Marked as invalid");
                onRefresh?.();
              } catch (error: unknown) {
                const message = error instanceof Error ? error.message : "Failed to mark as invalid";
                toast.error(message);
              }
            }}
            onResolve={async (notes) => {
              try {
                await incidentService.resolveIncident(getId(), notes);
                toast.success("✅ Incident resolved and closed automatically");
                onRefresh?.();
              } catch (error: unknown) {
                const message = error instanceof Error ? error.message : "Failed to resolve";
                toast.error(message);
              }
            }}
            onReopen={async (reason) => {
              try {
                await incidentService.reopenIncident(getId(), reason);
                toast.success("🔄 Incident reopened");
                onRefresh?.();
              } catch (error: unknown) {
                const message = error instanceof Error ? error.message : "Failed to reopen";
                toast.error(message);
              }
            }}
          />
        </div>
      </div>
    </Card>
  );
}
