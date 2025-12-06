import { format } from "date-fns";
import { useState, useEffect } from "react";
import { X, AlertCircle, MapPin, Clock, User, Users, Phone, Info, CheckCircle, FileText, HelpCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { incidentService } from "@/services/incident.service";
import type { Incident, IncidentResolution } from "@/types/incident.types";

interface ReportsIncidentModalProps {
  selectedIncident: Incident | null;
  setShowIncidentModal: (show: boolean) => void;
  navigate: (path: string) => void;
  showIncidentModal: boolean;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "CRITICAL": return "text-red-600 bg-red-100";
    case "HIGH": return "text-orange-600 bg-orange-100";
    case "MEDIUM": return "text-yellow-600 bg-yellow-100";
    case "LOW": return "text-green-600 bg-green-100";
    default: return "text-gray-600 bg-gray-100";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "RESOLVED": return "text-green-600 bg-green-100";
    case "RESPONDING": return "text-blue-600 bg-blue-100";
    case "IN_PROGRESS": return "text-orange-600 bg-orange-100";
    case "ARRIVED": return "text-purple-600 bg-purple-100";
    case "VERIFIED": return "text-indigo-600 bg-indigo-100";
    case "PENDING_VERIFICATION": return "text-yellow-600 bg-yellow-100";
    case "SPAM": case "CANCELLED": return "text-red-600 bg-red-100";
    default: return "text-gray-600 bg-gray-100";
  }
};

// Function to parse resolution data from update message
const parseResolutionUpdate = (message: string) => {
  const lines = message.split('\n');
  const resolution: any = {};
  
  lines.forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex !== -1) {
      const key = line.substring(0, colonIndex).trim().toLowerCase();
      const value = line.substring(colonIndex + 1).trim();
      resolution[key] = value;
    }
  });
  
  return resolution;
};

// Function to check if update contains resolution data
const isResolutionUpdate = (message: string) => {
  return message.includes('WHAT:') && message.includes('WHEN:') && message.includes('WHERE:');
};

export default function ReportsIncidentModal({
  selectedIncident,
  setShowIncidentModal,
  navigate,
  showIncidentModal,
}: ReportsIncidentModalProps) {
  const [resolution, setResolution] = useState<IncidentResolution | null>(null);
  const [detailedIncident, setDetailedIncident] = useState<Incident | null>(null);

  // Fetch detailed incident data when modal opens
  useEffect(() => {
    const fetchDetailedIncident = async () => {
      if (selectedIncident && showIncidentModal) {
        try {
          const response = await incidentService.getIncident(selectedIncident.incidentId);
          setDetailedIncident(response.data);
        } catch (error) {
          console.error('Failed to fetch detailed incident:', error);
          // Fallback to selectedIncident if detailed fetch fails
          setDetailedIncident(selectedIncident);
        }
      }
    };

    fetchDetailedIncident();
  }, [selectedIncident, showIncidentModal]);

  // Fetch resolution data
  useEffect(() => {
    const fetchResolution = async () => {
      if (detailedIncident || selectedIncident) {
        const currentIncident = detailedIncident || selectedIncident;
        if (currentIncident) {
          try {
            const response = await incidentService.getResolution(currentIncident.incidentId);
            if (response.success && response.data) {
              setResolution(response.data);
            }
          } catch (error) {
            // Resolution might not exist, that's okay
            setResolution(null);
          }
        }
      }
    };

    fetchResolution();
  }, [detailedIncident, selectedIncident]);

  // Use detailed incident data if available, otherwise use selectedIncident
  const incident = detailedIncident || selectedIncident;

  if (!selectedIncident || !showIncidentModal || !incident) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" style={{
      backdropFilter: 'blur(8px) saturate(180%)',
      WebkitBackdropFilter: 'blur(8px) saturate(180%)'
    }}>
      <div className="bg-gradient-to-br from-white via-white to-slate-50 rounded-2xl shadow-2xl border border-gray-200/50 max-w-5xl w-full max-h-[85vh] overflow-hidden hover:overflow-y-auto transition-all duration-500 ease-out transform scale-100 hover:scale-[1.02] animate-in fade-in-0 zoom-in-95 duration-300 scrollbar-hide" style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        {/* Scrollable content wrapper */}
        <div className="max-h-[75vh] overflow-y-auto scrollbar-hide" style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
        {/* Enhanced Header */}
        <div className="sticky top-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-b border-indigo-200/60 p-6 rounded-t-2xl shadow-sm backdrop-blur-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-3 h-3 rounded-full ${
                  incident.priority === 'CRITICAL' ? 'bg-red-500 animate-pulse' :
                  incident.priority === 'HIGH' ? 'bg-orange-500' :
                  incident.priority === 'MEDIUM' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}></div>
                <h2 className="text-2xl font-bold text-gray-900 truncate pr-4">{incident.title}</h2>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-sm font-medium text-indigo-700 bg-indigo-100 px-2 py-1 rounded-md">
                  #{incident.trackingNumber}
                </p>
                <div className="text-sm text-gray-500">
                  Reported: {format(new Date(incident.reportedAt), 'MMM dd, yyyy HH:mm')}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowIncidentModal(false)}
              className="p-2 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 hover:scale-110 ml-4 flex-shrink-0"
              aria-label="Close incident details"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 5W1H Modular Content */}
        <div className="p-6 space-y-6">
          {/* Status and Priority Header */}
          <div className="flex items-center gap-4 mb-6">
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(incident.status)}`}>
              {incident.status.replace(/_/g, ' ')}
            </span>
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getPriorityColor(incident.priority)}`}>
              {incident.priority}
            </span>
            <div className="text-sm text-gray-500">
              Reported: {format(new Date(incident.reportedAt), 'MMM dd, yyyy HH:mm')}
            </div>
          </div>

          {/* Enhanced 5W1H Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* WHAT - Incident Details */}
            <div className="group bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer ring-1 ring-blue-200/20 hover:ring-blue-300/40">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-200">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-blue-900 text-lg">WHAT (Incident Type & Description)</h3>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-700">Type:</span>
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">{incident.type}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Description:</span>
                  <p className="text-sm text-gray-600 mt-1">{incident.description}</p>
                </div>
              </div>
            </div>

            {/* WHERE - Location Details */}
            <div className="group bg-gradient-to-br from-green-50 to-emerald-100/50 rounded-xl p-5 border border-green-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer ring-1 ring-green-200/20 hover:ring-green-300/40">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors duration-200">
                  <MapPin className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-green-900 text-lg">WHERE (Location)</h3>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-700">Address:</span>
                  <p className="text-sm text-gray-600 mt-1">{incident.address}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Barangay:</span>
                  <span className="ml-2 text-sm text-gray-600">{incident.barangay?.name || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Coordinates:</span>
                  <span className="ml-2 text-xs font-mono text-gray-500">
                    {incident.latitude.toFixed(6)}, {incident.longitude.toFixed(6)}
                  </span>
                </div>
              </div>
            </div>

            {/* WHEN - Timeline */}
            <div className="group bg-gradient-to-br from-purple-50 to-violet-100/50 rounded-xl p-5 border border-purple-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer ring-1 ring-purple-200/20 hover:ring-purple-300/40">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors duration-200">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-purple-900 text-lg">WHEN (Timeline)</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Reported:</span>
                  <span className="text-gray-600">{format(new Date(incident.reportedAt), 'MMM dd, HH:mm')}</span>
                </div>
                {incident.acknowledgedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">Acknowledged:</span>
                    <span className="text-gray-600">{format(new Date(incident.acknowledgedAt), 'MMM dd, HH:mm')}</span>
                  </div>
                )}
                {incident.arrivedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">Arrived:</span>
                    <span className="text-gray-600">{format(new Date(incident.arrivedAt), 'MMM dd, HH:mm')}</span>
                  </div>
                )}
                {incident.resolvedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">Resolved:</span>
                    <span className="text-gray-600">{format(new Date(incident.resolvedAt), 'MMM dd, HH:mm')}</span>
                  </div>
                )}
                {incident.responseTime && (
                  <div className="flex justify-between font-medium">
                    <span className="text-purple-700">Response Time:</span>
                    <span className="text-purple-600">{incident.responseTime} minutes</span>
                  </div>
                )}
              </div>
            </div>

            {/* WHO - People Involved */}
            <div className="group bg-gradient-to-br from-orange-50 to-amber-100/50 rounded-xl p-5 border border-orange-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer ring-1 ring-orange-200/20 hover:ring-orange-300/40">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors duration-200">
                  <User className="h-5 w-5 text-orange-600" />
                </div>
                <h3 className="font-semibold text-orange-900 text-lg">WHO (People Involved)</h3>
              </div>
              <div className="space-y-3">
                {/* Reporter Information */}
                <div>
                  <span className="text-sm font-medium text-gray-700">Reported By:</span>
                  <div className="mt-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 border-2 border-blue-200">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{incident.reporterName || 'Anonymous'}</p>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">REPORTER</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Phone className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{incident.reporterPhone}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* WHY & HOW - Enhanced Resolution Details */}
          <div className="grid grid-cols-1 gap-6">
            <div className="group bg-gradient-to-br from-red-50 to-rose-100/50 rounded-xl p-5 border border-red-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer ring-1 ring-red-200/20 hover:ring-red-300/40">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors duration-200">
                  <Info className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="font-semibold text-red-900 text-lg">WHY & HOW (Resolution & Notes)</h3>
              </div>
              <div className="space-y-4">
                {/* Resolution Summary */}
                {incident.resolutionSummary && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Resolution Summary:</span>
                    <p className="text-sm text-gray-600 mt-1 p-3 bg-white rounded border">
                      {incident.resolutionSummary}
                    </p>
                  </div>
                )}

                {/* Resolution Notes */}
                {incident.resolutionNotes && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Resolution Notes:</span>
                    <p className="text-sm text-gray-600 mt-1 p-3 bg-white rounded border">
                      {incident.resolutionNotes}
                    </p>
                  </div>
                )}

                {/* General Notes */}
                {incident.notes && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Additional Notes:</span>
                    <p className="text-sm text-gray-600 mt-1 p-3 bg-white rounded border">
                      {incident.notes}
                    </p>
                  </div>
                )}

                {/* Personnel Resolution Report */}
                {resolution && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Personnel Resolution Report:</span>
                    <div className="mt-2 space-y-3">
                      <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        {/* Personnel Information */}
                        <div className="mb-4 pb-3 border-b border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 border-2 border-blue-200">
                              {resolution.submittedByPersonnel.photo ? (
                                <img
                                  src={resolution.submittedByPersonnel.photo}
                                  alt={`${resolution.submittedByPersonnel.firstName} ${resolution.submittedByPersonnel.lastName}`}
                                  className="h-8 w-8 rounded-full object-cover"
                                />
                              ) : (
                                <User className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 text-sm">
                                {resolution.submittedByPersonnel.firstName} {resolution.submittedByPersonnel.lastName}
                              </p>
                              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                                {resolution.submittedByPersonnel.role}
                              </p>
                            </div>
                            <div className="text-xs text-gray-400">
                              Submitted: {format(new Date(resolution.submittedAt), 'MMM dd, HH:mm')}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">What:</span>
                            <p className="text-gray-600 mt-1">{resolution.what}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">When:</span>
                            <p className="text-gray-600 mt-1">{resolution.when}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Where:</span>
                            <p className="text-gray-600 mt-1">{resolution.where}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Who:</span>
                            <p className="text-gray-600 mt-1">{resolution.who}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Why:</span>
                            <p className="text-gray-600 mt-1">{resolution.why}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">How:</span>
                            <p className="text-gray-600 mt-1">{resolution.how}</p>
                          </div>
                        </div>
                        {resolution.notes && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <span className="font-medium text-gray-700">Notes:</span>
                            <p className="text-gray-600 mt-1">{resolution.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Indicator */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  {incident.status === 'RESOLVED' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    Current Status: {incident.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Personnel & Admin Reports Section */}
        <div className="mt-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Personnel Involvement & Reports */}
            <div className="group bg-gradient-to-br from-blue-50 to-indigo-100/50 rounded-xl p-5 border border-blue-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer ring-1 ring-blue-200/20 hover:ring-blue-300/40">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-200">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-blue-900 text-lg">Personnel & Admin Reports</h3>
              </div>
              <div className="space-y-4">
                {/* Assigned Personnel */}
                {incident.assignedPersonnel && incident.assignedPersonnel.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Assigned Personnel:</span>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {incident.assignedPersonnel.map((person) => (
                        <div key={person.personnelId} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 border-2 border-blue-200">
                            <Users className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm">{person.name}</p>
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{person.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Responding Personnel */}
                {incident.responders && incident.responders.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Responding Personnel:</span>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {incident.responders.map((responder) => (
                        <div key={responder.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 border-2 border-green-200">
                            <Users className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm">
                              {responder.personnel.firstName} {responder.personnel.lastName}
                            </p>
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{responder.personnel.role}</p>
                            {responder.isPrimary && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                                Primary Responder
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Phone className="h-3 w-3" />
                            <span>{responder.personnel.phone}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verification Information */}
                {incident.verifiedAt && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Verification:</span>
                    <div className="mt-2 flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 border-2 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">Verified by Admin</p>
                        <p className="text-xs text-gray-500">
                          Verified on {format(new Date(incident.verifiedAt), "MMM dd, yyyy 'at' HH:mm")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Resolution Information */}
                {incident.resolvedAt && (incident as any).resolvedBy && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Resolution:</span>
                    <div className="mt-2 flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 border-2 border-purple-200">
                        <CheckCircle className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">
                          Resolved by {(incident as any).resolvedBy.firstName} {(incident as any).resolvedBy.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          Resolved on {format(new Date(incident.resolvedAt), "MMM dd, yyyy 'at' HH:mm")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Incident Updates - Admin/Personnel Reports */}
                {incident.updates && incident.updates.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Recent Updates:</span>
                    <div className="mt-2 space-y-3">
                      {incident.updates
                        .slice(-5) // Show last 5 updates
                        .map((update) => {
                          const isResolution = isResolutionUpdate(update.message);
                          const resolutionData = isResolution ? parseResolutionUpdate(update.message) : null;
                          
                          return (
                            <div key={update.id} className="p-4 bg-gradient-to-r from-white to-gray-50 rounded-lg border border-gray-200 hover:border-blue-400 transition-all duration-300 shadow-lg hover:shadow-xl">
                              {isResolution ? (
                                <div className="space-y-4">
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="p-1 bg-green-100 rounded-full">
                                      <CheckCircle className="h-5 w-5 text-green-600" />
                                    </div>
                                    <span className="text-base font-bold text-gray-900">
                                      Resolved by {update.authorRole}: {update.author}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                    <div className="bg-gray-50 p-3 rounded border hover:bg-blue-50 hover:border-blue-200 transition-colors cursor-pointer flex items-start gap-2">
                                      <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
                                      <div>
                                        <span className="font-semibold text-gray-800">What:</span>
                                        <p className="text-gray-700 mt-1">{resolutionData.what || 'N/A'}</p>
                                      </div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded border hover:bg-blue-50 hover:border-blue-200 transition-colors cursor-pointer flex items-start gap-2">
                                      <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
                                      <div>
                                        <span className="font-semibold text-gray-800">When:</span>
                                        <p className="text-gray-700 mt-1">{resolutionData.when || 'N/A'}</p>
                                      </div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded border hover:bg-blue-50 hover:border-blue-200 transition-colors cursor-pointer flex items-start gap-2">
                                      <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
                                      <div>
                                        <span className="font-semibold text-gray-800">Where:</span>
                                        <p className="text-gray-700 mt-1">{resolutionData.where || 'N/A'}</p>
                                      </div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded border hover:bg-blue-50 hover:border-blue-200 transition-colors cursor-pointer flex items-start gap-2">
                                      <User className="h-4 w-4 text-blue-600 mt-0.5" />
                                      <div>
                                        <span className="font-semibold text-gray-800">Who:</span>
                                        <p className="text-gray-700 mt-1">{resolutionData.who || 'N/A'}</p>
                                      </div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded border hover:bg-blue-50 hover:border-blue-200 transition-colors cursor-pointer flex items-start gap-2">
                                      <HelpCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                                      <div>
                                        <span className="font-semibold text-gray-800">Why:</span>
                                        <p className="text-gray-700 mt-1">{resolutionData.why || 'N/A'}</p>
                                      </div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded border hover:bg-blue-50 hover:border-blue-200 transition-colors cursor-pointer flex items-start gap-2">
                                      <Settings className="h-4 w-4 text-blue-600 mt-0.5" />
                                      <div>
                                        <span className="font-semibold text-gray-800">How:</span>
                                        <p className="text-gray-700 mt-1">{resolutionData.how || 'N/A'}</p>
                                      </div>
                                    </div>
                                  </div>
                                  {resolutionData.notes && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                      <span className="font-semibold text-gray-800">Notes:</span>
                                      <p className="text-gray-700 mt-1">{resolutionData.notes}</p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <>
                                  <p className="text-sm text-gray-900 mb-2">{update.message}</p>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                                        {update.authorRole}
                                      </span>
                                      <span className="text-xs text-gray-500">•</span>
                                      <span className="text-xs text-gray-700">{update.author}</span>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                      {format(new Date(update.createdAt), "MMM dd, HH:mm")}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Personnel Resolution Report */}
                {resolution && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Personnel Resolution Report:</span>
                    <div className="mt-2">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        {/* Personnel Information */}
                        <div className="mb-4 pb-3 border-b border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 border-2 border-blue-200">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 text-sm">
                                {resolution.submittedByPersonnel.firstName} {resolution.submittedByPersonnel.lastName}
                              </p>
                              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                                {resolution.submittedByPersonnel.role}
                              </p>
                            </div>
                            <div className="text-xs text-gray-400">
                              Submitted: {format(new Date(resolution.submittedAt), 'MMM dd, HH:mm')}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">What:</span>
                            <p className="text-gray-600 mt-1">{resolution.what}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">When:</span>
                            <p className="text-gray-600 mt-1">{resolution.when}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Where:</span>
                            <p className="text-gray-600 mt-1">{resolution.where}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Who:</span>
                            <p className="text-gray-600 mt-1">{resolution.who}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Why:</span>
                            <p className="text-gray-600 mt-1">{resolution.why}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">How:</span>
                            <p className="text-gray-600 mt-1">{resolution.how}</p>
                          </div>
                        </div>
                        {resolution.notes && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <span className="font-medium text-gray-700">Notes:</span>
                            <p className="text-gray-600 mt-1">{resolution.notes}</p>
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

        {/* Enhanced Footer Actions */}
        <div className="sticky bottom-0 bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50 border-t border-gray-200/60 p-6 rounded-b-2xl shadow-lg backdrop-blur-sm">
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
              <span className="text-gray-500">Last updated:</span>
              <span className="ml-1 text-gray-700">{format(new Date(incident.updatedAt), 'MMM dd, yyyy HH:mm')}</span>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowIncidentModal(false)}
                className="px-6 py-2.5 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  navigate(`/incidents/${incident.incidentId}`);
                  setShowIncidentModal(false);
                }}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 rounded-lg shadow-sm hover:shadow-md font-medium"
              >
                Manage Incident
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
