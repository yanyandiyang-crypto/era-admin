import { format } from "date-fns";
import { useState, useEffect } from "react";
import { X, AlertCircle, MapPin, Clock, User, Users, Phone, Info, CheckCircle } from "lucide-react";
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

export default function ReportsIncidentModal({
  selectedIncident,
  setShowIncidentModal,
  navigate,
  showIncidentModal,
}: ReportsIncidentModalProps) {
  const [resolution, setResolution] = useState<IncidentResolution | null>(null);

  useEffect(() => {
    const fetchResolution = async () => {
      if (selectedIncident) {
        try {
          const response = await incidentService.getResolution(selectedIncident.incidentId);
          if (response.success && response.data) {
            setResolution(response.data);
          }
        } catch (error) {
          // Resolution might not exist, that's okay
          setResolution(null);
        }
      }
    };

    fetchResolution();
  }, [selectedIncident]);

  if (!selectedIncident || !showIncidentModal) return null;

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
                  selectedIncident.priority === 'CRITICAL' ? 'bg-red-500 animate-pulse' :
                  selectedIncident.priority === 'HIGH' ? 'bg-orange-500' :
                  selectedIncident.priority === 'MEDIUM' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}></div>
                <h2 className="text-2xl font-bold text-gray-900 truncate pr-4">{selectedIncident.title}</h2>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-sm font-medium text-indigo-700 bg-indigo-100 px-2 py-1 rounded-md">
                  #{selectedIncident.trackingNumber}
                </p>
                <div className="text-sm text-gray-500">
                  Reported: {format(new Date(selectedIncident.reportedAt), 'MMM dd, yyyy HH:mm')}
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
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedIncident.status)}`}>
              {selectedIncident.status.replace(/_/g, ' ')}
            </span>
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getPriorityColor(selectedIncident.priority)}`}>
              {selectedIncident.priority}
            </span>
            <div className="text-sm text-gray-500">
              Reported: {format(new Date(selectedIncident.reportedAt), 'MMM dd, yyyy HH:mm')}
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
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">{selectedIncident.type}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Description:</span>
                  <p className="text-sm text-gray-600 mt-1">{selectedIncident.description}</p>
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
                  <p className="text-sm text-gray-600 mt-1">{selectedIncident.address}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Barangay:</span>
                  <span className="ml-2 text-sm text-gray-600">{selectedIncident.barangay?.name || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Coordinates:</span>
                  <span className="ml-2 text-xs font-mono text-gray-500">
                    {selectedIncident.latitude.toFixed(6)}, {selectedIncident.longitude.toFixed(6)}
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
                  <span className="text-gray-600">{format(new Date(selectedIncident.reportedAt), 'MMM dd, HH:mm')}</span>
                </div>
                {selectedIncident.acknowledgedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">Acknowledged:</span>
                    <span className="text-gray-600">{format(new Date(selectedIncident.acknowledgedAt), 'MMM dd, HH:mm')}</span>
                  </div>
                )}
                {selectedIncident.arrivedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">Arrived:</span>
                    <span className="text-gray-600">{format(new Date(selectedIncident.arrivedAt), 'MMM dd, HH:mm')}</span>
                  </div>
                )}
                {selectedIncident.resolvedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">Resolved:</span>
                    <span className="text-gray-600">{format(new Date(selectedIncident.resolvedAt), 'MMM dd, HH:mm')}</span>
                  </div>
                )}
                {selectedIncident.responseTime && (
                  <div className="flex justify-between font-medium">
                    <span className="text-purple-700">Response Time:</span>
                    <span className="text-purple-600">{selectedIncident.responseTime} minutes</span>
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
                {/* Reporter */}
                <div>
                  <span className="text-sm font-medium text-gray-700">Reporter:</span>
                  <div className="mt-1">
                    <p className="text-sm text-gray-600">{selectedIncident.reporterName || 'Anonymous'}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Phone className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{selectedIncident.reporterPhone}</span>
                    </div>
                  </div>
                </div>

                {/* Assigned Personnel */}
                {selectedIncident.assignedPersonnel && selectedIncident.assignedPersonnel.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Assigned Personnel:</span>
                    <div className="mt-1 space-y-1">
                      {selectedIncident.assignedPersonnel.map((person) => (
                        <div key={person.personnelId} className="flex items-center gap-2">
                          <Users className="h-3 w-3 text-gray-400" />
                          <span className="text-sm text-gray-600">{person.name} - {person.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                {selectedIncident.resolutionSummary && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Resolution Summary:</span>
                    <p className="text-sm text-gray-600 mt-1 p-3 bg-white rounded border">
                      {selectedIncident.resolutionSummary}
                    </p>
                  </div>
                )}

                {/* Resolution Notes */}
                {selectedIncident.resolutionNotes && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Resolution Notes:</span>
                    <p className="text-sm text-gray-600 mt-1 p-3 bg-white rounded border">
                      {selectedIncident.resolutionNotes}
                    </p>
                  </div>
                )}

                {/* General Notes */}
                {selectedIncident.notes && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Additional Notes:</span>
                    <p className="text-sm text-gray-600 mt-1 p-3 bg-white rounded border">
                      {selectedIncident.notes}
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
                  {selectedIncident.status === 'RESOLVED' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    Current Status: {selectedIncident.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Enhanced Footer Actions */}
        <div className="sticky bottom-0 bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50 border-t border-gray-200/60 p-6 rounded-b-2xl shadow-lg backdrop-blur-sm">
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
              <span className="text-gray-500">Last updated:</span>
              <span className="ml-1 text-gray-700">{format(new Date(selectedIncident.updatedAt), 'MMM dd, yyyy HH:mm')}</span>
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
                  navigate(`/incidents/${selectedIncident.incidentId}`);
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
