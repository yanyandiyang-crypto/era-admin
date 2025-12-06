import type { Incident } from "@/types/incident.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Map as MapIcon, 
  AlertCircle, 
  Droplets, 
  Clock, 
  MapPin, 
  User, 
  Phone,
  Calendar,
  ShieldX,
  AlertTriangle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface IncidentDetailHeaderProps {
  incident: Incident;
  quickActions?: React.ReactNode;
}

export function IncidentDetailHeader({ incident, quickActions }: IncidentDetailHeaderProps) {
  const navigate = useNavigate();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL": return "bg-red-100 text-red-800 border-red-200";
      case "HIGH": return "bg-orange-100 text-orange-800 border-orange-200";
      case "MEDIUM": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "LOW": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation Bar */}
      <div className="bg-white rounded-3xl shadow-sm border border-blue-100 overflow-hidden">
        <div className="relative">
          <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 px-6 py-4 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_50%),radial-gradient(circle_at_bottom,rgba(99,102,241,0.15),transparent_50%)]"></div>
            
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate("/incidents")}
                  className="text-white hover:text-blue-100 hover:bg-white/20 transition-all duration-300 bg-white/10 backdrop-blur-sm border border-white/10"
                >
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  Incidents
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate("/map")} 
                  className="text-white hover:text-blue-100 hover:bg-white/20 transition-all duration-300 bg-white/10 backdrop-blur-sm border border-white/10"
                >
                  <MapIcon className="h-4 w-4 mr-1.5" />
                  Map View
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col gap-6">
            
            <div className="flex flex-col xl:flex-row gap-6">
              {/* Header Info */}
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="px-4 py-2.5 bg-blue-900 text-white text-sm font-mono font-bold rounded-xl shadow-sm flex items-center gap-2 ring-4 ring-blue-50">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    {incident.trackingNumber || "INC-####-###"}
                  </div>
                  <Badge variant="outline" className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 border-blue-200 uppercase tracking-wider">
                    {incident.status}
                  </Badge>
                  {/* Only show priority if incident is verified (not PENDING_VERIFICATION) */}
                  {incident.status !== "PENDING_VERIFICATION" && (
                    <Badge variant="outline" className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 ${getPriorityColor(incident.priority)}`}>
                      <AlertCircle className="h-3.5 w-3.5" />
                      {incident.priority}
                    </Badge>
                  )}
                  <Badge variant="outline" className="px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 bg-cyan-50 text-cyan-700 border-cyan-200">
                    <Droplets className="h-3.5 w-3.5" />
                    {incident.type}
                  </Badge>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-white rounded-2xl p-1 border border-blue-100 shadow-sm">
                  <div className="bg-white/50 rounded-xl p-4 backdrop-blur-sm">
                    <div className="flex items-start gap-5">
                      <div className="shrink-0">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white ring-4 ring-blue-100">
                          <Droplets className="h-7 w-7" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-blue-50 text-blue-600 border-blue-200">
                            {incident.type}
                          </span>
                          <span className="text-xs text-blue-500 font-medium flex items-center gap-1">
                            <div className="w-1 h-1 rounded-full bg-blue-400"></div>
                            Emergency Report
                          </span>
                        </div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 leading-tight mb-3">
                          {incident.title}
                        </h1>
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
                          <p className="text-slate-700 font-medium leading-relaxed text-base whitespace-pre-wrap">
                            {incident.description}
                          </p>
                        </div>

                        {/* Spam/Invalid Notice with Notes */}
                        {incident.status === "SPAM" && (
                          <div className="mt-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 border border-red-200 shadow-sm">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <ShieldX className="h-5 w-5 text-red-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-sm font-bold text-red-800">Marked as Spam/Invalid</h3>
                                  <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 text-xs">
                                    No Personnel Notified
                                  </Badge>
                                </div>
                                {incident.notes && (
                                  <div className="bg-white/60 rounded-lg p-3 border border-red-100">
                                    <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                                      <AlertTriangle className="h-3 w-3" />
                                      Reason
                                    </p>
                                    <p className="text-sm text-red-900 font-medium whitespace-pre-wrap">
                                      {incident.notes}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Slot */}
              {quickActions && (
                <div className="xl:w-80 w-full shrink-0">
                  {quickActions}
                </div>
              )}
            </div>

            {/* Location & Time Bar */}
            <div className="bg-gradient-to-r from-blue-800 to-blue-700 rounded-xl p-4 text-white shadow-lg shadow-blue-900/10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                      <Calendar className="h-4 w-4 text-blue-200" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-200 font-medium">Date</p>
                      <p className="text-sm font-semibold">{format(new Date(incident.createdAt), "EEEE, MMMM d, yyyy")}</p>
                    </div>
                  </div>
                  <div className="w-px h-8 bg-blue-600 hidden sm:block"></div>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                      <MapPin className="h-4 w-4 text-blue-200" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-200 font-medium">Location</p>
                      <p className="text-sm font-semibold">{incident.address}</p>
                    </div>
                  </div>
                </div>
                {incident.status === "SPAM" ? (
                  <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1.5 rounded-full border border-red-400/30 backdrop-blur-sm">
                    <ShieldX className="w-3.5 h-3.5 text-red-300" />
                    <span className="text-xs font-bold text-red-100 uppercase tracking-wide">Invalid/Spam</span>
                  </div>
                ) : incident.status === "RESOLVED" ? (
                  <div className="flex items-center gap-2 bg-blue-500/20 px-3 py-1.5 rounded-full border border-blue-400/30 backdrop-blur-sm">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-xs font-bold text-blue-100 uppercase tracking-wide">Resolved</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1.5 rounded-full border border-green-400/30 backdrop-blur-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs font-bold text-green-100 uppercase tracking-wide">Active Incident</span>
                  </div>
                )}
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/60 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="p-4 flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-white shadow-sm text-blue-600 ring-1 ring-blue-100">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-600/80 uppercase tracking-wide mb-1">Reported At</p>
                    <p className="text-base font-bold text-blue-900">{format(new Date(incident.createdAt), "MMM d, yyyy")}</p>
                    <p className="text-xs text-blue-600 font-medium">{format(new Date(incident.createdAt), "h:mm a")}</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-red-100/50 border-red-200/60 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="p-4 flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-white shadow-sm text-red-600 ring-1 ring-red-100">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-red-600/80 uppercase tracking-wide mb-1">Location</p>
                    <p className="text-sm font-bold text-slate-900 line-clamp-2 leading-tight">{incident.address}</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/60 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="p-4 flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-white shadow-sm text-green-600 ring-1 ring-green-100">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-green-600/80 uppercase tracking-wide mb-1">Reporter</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{incident.reporterName || "Anonymous"}</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/60 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="p-4 flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-white shadow-sm text-purple-600 ring-1 ring-purple-100">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-purple-600/80 uppercase tracking-wide mb-1">Contact</p>
                    <a href={`tel:${incident.reporterPhone}`} className="text-sm font-bold text-slate-900 hover:text-purple-600 transition-colors block truncate">
                      {incident.reporterPhone || "N/A"}
                    </a>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
