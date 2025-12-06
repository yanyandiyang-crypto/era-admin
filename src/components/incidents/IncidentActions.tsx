import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, RotateCcw, Map, Monitor, AlertTriangle, ShieldX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ResolutionReview } from "./ResolutionReview";
import { useSocket } from "@/hooks/useSocket";
import type { Incident } from "@/types/incident.types";

// Spam/Invalid reason presets
const SPAM_REASONS = [
  { id: "duplicate", label: "Duplicate Report", icon: "📋", description: "This incident was already reported" },
  { id: "false_alarm", label: "False Alarm", icon: "🔔", description: "No actual emergency exists" },
  { id: "test_report", label: "Test Report", icon: "🧪", description: "Submitted for testing purposes" },
  { id: "spam", label: "Spam/Junk", icon: "🚫", description: "Irrelevant or promotional content" },
  { id: "wrong_location", label: "Wrong Location", icon: "📍", description: "Location is incorrect or outside service area" },
  { id: "other", label: "Other", icon: "📝", description: "Specify custom reason below" },
];

interface IncidentActionsProps {
  incident: Incident;
  onVerify?: (priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL", notes?: string) => Promise<void>;
  onMarkAsSpam?: (reason: string) => Promise<void>;
  onResolve?: (notes: string) => Promise<void>;
  onReopen?: (reason: string) => Promise<void>;
  compact?: boolean; // For map popup
}

export function IncidentActions({
  incident,
  onVerify,
  onMarkAsSpam,
  onResolve,
  onReopen,
  compact = false,
}: IncidentActionsProps) {
  const navigate = useNavigate();
  const { socket } = useSocket();

  const getId = (): string => {
    return incident.incidentId || (incident as { id?: string }).id || '';
  };

  const [showDialog, setShowDialog] = useState<
    | "verify"
    | "spam"
    | "resolve"
    | "reopen"
    | "review"
    | null
  >(null);
  const [dialogInput, setDialogInput] = useState("");
  const [selectedSpamReason, setSelectedSpamReason] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [isLoading, setIsLoading] = useState(false);

  const handleDialogSubmit = async () => {
    setIsLoading(true);
    try {
      switch (showDialog) {
        case "verify":
          await onVerify?.(selectedPriority, dialogInput || undefined);
          // Trigger personnel response update for verified incident
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('personnel:response', {
              detail: { incidentId: getId(), responderCount: 0 }
            }));
          }, 1000);
          // Trigger real-time status update for verification
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('incident:status-changed', {
              detail: { incidentId: getId(), type: 'verify', priority: selectedPriority }
            }));
            // Also trigger socket event for real-time updates
            if (typeof window !== 'undefined' && (window as any).socket) {
              (window as any).socket.emit('incident:status_updated', {
                incidentId: getId(),
                status: 'VERIFIED',
                priority: selectedPriority,
                updatedBy: 'admin'
              });
            }
          }, 500);
          break;
        case "spam": {
          // Build the full reason from preset + custom notes
          const selectedPreset = SPAM_REASONS.find(r => r.id === selectedSpamReason);
          let fullReason = "";
          
          if (selectedPreset) {
            fullReason = `${selectedPreset.label}`;
          }
          
          if (dialogInput.trim()) {
            fullReason += dialogInput.trim();
          } else if (!selectedPreset) {
            toast.error("Please select a reason or provide details", {
              description: "You must specify why this incident is being marked as spam/invalid"
            });
            return;
          } else {
            fullReason += selectedPreset.description;
          }
          
          await onMarkAsSpam?.(fullReason);
          // Trigger real-time status update for spam marking - removes from map and incident list
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('incident:status-changed', {
              detail: { incidentId: getId(), type: 'spam' }
            }));
            // Emit socket event for real-time removal across all clients
            if (typeof window !== 'undefined' && (window as any).socket) {
              (window as any).socket.emit('incident:invalidated', {
                incidentId: getId()
              });
              (window as any).socket.emit('incident:status_updated', {
                incidentId: getId(),
                status: 'SPAM',
                updatedBy: 'admin'
              });
            }
          }, 500);
          break;
        }
        case "resolve":
          await onResolve?.("");
          // Trigger flash animation for status change
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('incident:status-changed', {
              detail: { incidentId: getId(), type: 'resolve' }
            }));
          }, 500);
          // Trigger personnel response update
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('personnel:response', {
              detail: { incidentId: getId(), responderCount: 0 }
            }));
          }, 1000);
          break;
        case "reopen":
          if (!dialogInput.trim()) {
            toast.error("Please provide a reason for reopening", {
              description: "You must explain why this incident needs to be reopened"
            });
            return;
          }
          await onReopen?.(dialogInput);
          // Trigger real-time status update for reopening
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('incident:status-changed', {
              detail: { incidentId: getId(), type: 'reopen' }
            }));
            // Also trigger socket event for real-time updates
            if (socket) {
              socket.emit('incident:status_updated', {
                incidentId: getId(),
                status: 'VERIFIED',
                updatedBy: 'admin'
              });
            }
          }, 500);
          break;
      }
      setShowDialog(null);
      setDialogInput("");
      setSelectedSpamReason("");
      setSelectedPriority("MEDIUM");
    } catch {
      // Error handling is done by the calling components
    } finally {
      setIsLoading(false);
    }
  };

  const renderActions = () => {
    const status = incident.status;
    const buttonSize = compact ? "sm" : "default";

    switch (status) {
      case "PENDING_VERIFICATION":
        return (
          <div className="flex flex-col gap-2">
            {incident.isPublicReport && (
              <div className="px-3 py-1.5 bg-red-100 text-red-800 text-xs font-semibold rounded-full shadow-sm border border-red-200">
                🔴 Public Report - Unverified
              </div>
            )}
            <div className="flex gap-2">
              <Button
                size={buttonSize}
                className="bg-linear-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-sm hover:shadow-md transition-all duration-200 font-medium"
                onClick={() => setShowDialog("verify")}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Verify
              </Button>
              <Button
                size={buttonSize}
                className="bg-linear-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-sm hover:shadow-md transition-all duration-200 font-medium"
                onClick={() => setShowDialog("spam")}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Invalid
              </Button>
            </div>
          </div>
        );

      case "VERIFIED":
        return (
          <>
            <div className="px-3 py-1.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full shadow-sm border border-blue-200">
              🔵 Verified - Awaiting Personnel Response
            </div>
          </>
        );

      case "RESPONDING": {
        const responderCount = incident.responders?.length || 0;
        return (
          <>
            <div className="px-3 py-1.5 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full shadow-sm border border-orange-200">
              🟠 {responderCount} Personnel Responding
            </div>
            <div className="flex gap-2">
              <Button
                size={buttonSize}
                className="bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-sm hover:shadow-md transition-all duration-200 font-medium"
                onClick={() => navigate(`/map?incident=${getId()}`)}
              >
                <Map className="h-4 w-4 mr-2" />
                View on Map
              </Button>
              <Button
                size={buttonSize}
                className="bg-linear-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-sm hover:shadow-md transition-all duration-200 font-medium"
                onClick={() => navigate(`/incidents/${getId()}`)}
              >
                <Monitor className="h-4 w-4 mr-2" />
                Manage Incident
              </Button>
            </div>
          </>
        );
      }

      case "ARRIVED": {
        const arrivedCount = incident.responders?.filter(r => r.arrivedAt)?.length || 0;
        return (
          <>
            <div className="px-3 py-1.5 bg-green-100 text-green-800 text-xs font-semibold rounded-full shadow-sm border border-green-200">
              🟢 {arrivedCount} Personnel On Scene
            </div>
            <div className="flex gap-2">
              <Button
                size={buttonSize}
                className="bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-sm hover:shadow-md transition-all duration-200 font-medium"
                onClick={() => navigate(`/map?incident=${getId()}`)}
              >
                <Map className="h-4 w-4 mr-2" />
                View on Map
              </Button>
              <Button
                size={buttonSize}
                className="bg-linear-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-sm hover:shadow-md transition-all duration-200 font-medium"
                onClick={() => navigate(`/incidents/${getId()}`)}
              >
                <Monitor className="h-4 w-4 mr-2" />
                Manage Incident
              </Button>
            </div>
          </>
        );
      }

      case "PENDING_RESOLVE":
        return (
          <>
            <div className="px-3 py-1.5 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full shadow-sm border border-yellow-200">
              🟡 Resolution Submitted - Awaiting Review
            </div>
            <Button
              size={buttonSize}
              className="bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-sm hover:shadow-md transition-all duration-200 font-medium"
              onClick={() => setShowDialog("review")}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Review Resolution
            </Button>
          </>
        );

      case "RESOLVED":
        return (
          <>
            <Button
              size={buttonSize}
              variant="outline"
              className="border-gray-200 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
              onClick={() => setShowDialog("reopen")}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reopen
            </Button>
          </>
        );

      default:
        return null;
    }
  };

  const getDialogContent = () => {
    switch (showDialog) {
      case "verify":
        return {
          title: "Set Priority Level",
          description: "Please set the priority level for this incident before verification:",
          placeholder: "Add verification notes (optional)...",
          submitLabel: `Verify with ${selectedPriority.charAt(0).toUpperCase() + selectedPriority.slice(1).toLowerCase()} Priority`,
          submitClass: "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600",
          requiresPriority: true,
        };
      case "spam":
        return {
          title: "Mark as Spam/Invalid",
          description: "This will remove the incident from the map and stop all personnel notifications.",
          placeholder: "Add additional notes (optional)...",
          submitLabel: "Mark as Invalid",
          submitClass: "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600",
          requiresSpamReason: true,
        };
      case "resolve":
        return {
          title: "Mark as Resolved",
          description: "Are you sure you want to mark this incident as resolved? This will update the map and incident status.",
          placeholder: "Enter resolution notes (required)...",
          submitLabel: "Mark as Resolved",
          submitClass: "bg-linear-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600",
          isConfirmation: true,
        };
      case "reopen":
        return {
          title: "Reopen Incident",
          description: "Explain why this incident needs to be reopened.",
          placeholder: "Enter reason (required)...",
          submitLabel: "Reopen",
          submitClass: "bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600",
        };
      default:
        return null;
    }
  };

  const dialogContent = getDialogContent();

  return (
    <>
      <div className={`flex items-center gap-2 ${compact ? 'flex-wrap' : ''}`}>
        {renderActions()}
      </div>

      {showDialog && (
        <Dialog open={!!showDialog} onOpenChange={() => setShowDialog(null)}>
          {showDialog === "review" ? (
            <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
              {/* Modern Gradient Header */}
              <div className="relative overflow-hidden rounded-t-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 opacity-90"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10"></div>
                <div className="relative px-6 py-5 text-white">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                      <CheckCircle className="h-7 w-7 text-white drop-shadow-sm" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-white mb-1 drop-shadow-sm">Review Resolution Report</h2>
                      <p className="text-blue-100 text-sm font-medium">Review the personnel's 5W1H resolution report</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto py-6 px-1">
                <ResolutionReview
                  incidentId={incident.incidentId || ""}
                  onResolutionConfirmed={() => {
                    setShowDialog(null);
                    // Refresh the parent component if onRefresh is provided
                    if (typeof window !== 'undefined' && window.location) {
                      window.location.reload(); // Simple refresh for now
                    }
                  }}
                />
              </div>
            </DialogContent>
          ) : dialogContent ? (
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border-0 bg-white/95 backdrop-blur-xl scrollbar-hide">
              <style>{`
                .scrollbar-hide {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }
                .scrollbar-hide::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              {/* Modern Gradient Header */}
              <div className="relative overflow-hidden rounded-t-2xl">
                <div className={`absolute inset-0 opacity-90 ${
                  showDialog === "verify" ? "bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600" :
                  showDialog === "spam" ? "bg-gradient-to-br from-red-500 via-red-600 to-pink-600" :
                  showDialog === "resolve" ? "bg-gradient-to-br from-green-500 via-green-600 to-emerald-600" :
                  showDialog === "reopen" ? "bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600" :
                  "bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600"
                }`}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10"></div>
                <div className="relative px-6 py-5 text-white">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                      {showDialog === "verify" ? <CheckCircle className="h-7 w-7 text-white drop-shadow-sm" /> :
                       showDialog === "spam" ? <ShieldX className="h-7 w-7 text-white drop-shadow-sm" /> :
                       showDialog === "resolve" ? <CheckCircle className="h-7 w-7 text-white drop-shadow-sm" /> :
                       showDialog === "reopen" ? <RotateCcw className="h-7 w-7 text-white drop-shadow-sm" /> :
                       <CheckCircle className="h-7 w-7 text-white drop-shadow-sm" />}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-white mb-1 drop-shadow-sm">{dialogContent.title}</h2>
                      <p className={`text-sm font-medium ${
                        showDialog === "verify" ? "text-blue-100" :
                        showDialog === "spam" ? "text-red-100" :
                        showDialog === "resolve" ? "text-green-100" :
                        showDialog === "reopen" ? "text-blue-100" :
                        "text-blue-100"
                      }`}>{dialogContent.description}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-6 space-y-6">
              {dialogContent.requiresPriority && (
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Select Priority Level
                  </label>
                  <p className="text-sm font-medium text-gray-800 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    "{incident.title}"
                  </p>
                  <div className="space-y-2">
                    <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-md ${
                      selectedPriority === "LOW" ? "bg-gray-100 text-gray-800 border-gray-400 shadow-lg" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/30"
                    }`}>
                      <input
                        className="sr-only"
                        type="radio"
                        value="LOW"
                        name="priority"
                        checked={selectedPriority === "LOW"}
                        onChange={() => setSelectedPriority("LOW")}
                      />
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all duration-300 ${
                        selectedPriority === "LOW" ? "bg-gray-500 text-white shadow-lg scale-110" : "bg-gray-100 text-gray-600"
                      }`}>
                        🟢
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-gray-900">Low Priority</div>
                        <div className="text-xs text-gray-500">Non-urgent, routine response</div>
                      </div>
                      {selectedPriority === "LOW" && (
                        <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in-50">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </label>
                    <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-md ${
                      selectedPriority === "MEDIUM" ? "bg-blue-100 text-blue-800 border-blue-400 shadow-lg" : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/30"
                    }`}>
                      <input
                        className="sr-only"
                        type="radio"
                        value="MEDIUM"
                        name="priority"
                        checked={selectedPriority === "MEDIUM"}
                        onChange={() => setSelectedPriority("MEDIUM")}
                      />
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all duration-300 ${
                        selectedPriority === "MEDIUM" ? "bg-blue-500 text-white shadow-lg scale-110" : "bg-gray-100 text-gray-600"
                      }`}>
                        🟡
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-gray-900">Medium Priority</div>
                        <div className="text-xs text-gray-500">Standard response time</div>
                      </div>
                      {selectedPriority === "MEDIUM" && (
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in-50">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </label>
                    <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-md ${
                      selectedPriority === "HIGH" ? "bg-orange-100 text-orange-800 border-orange-400 shadow-lg" : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/30"
                    }`}>
                      <input
                        className="sr-only"
                        type="radio"
                        value="HIGH"
                        name="priority"
                        checked={selectedPriority === "HIGH"}
                        onChange={() => setSelectedPriority("HIGH")}
                      />
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all duration-300 ${
                        selectedPriority === "HIGH" ? "bg-orange-500 text-white shadow-lg scale-110" : "bg-gray-100 text-gray-600"
                      }`}>
                        🟠
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-gray-900">High Priority</div>
                        <div className="text-xs text-gray-500">Urgent response required</div>
                      </div>
                      {selectedPriority === "HIGH" && (
                        <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in-50">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </label>
                    <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-md ${
                      selectedPriority === "CRITICAL" ? "bg-red-100 text-red-800 border-red-400 shadow-lg" : "border-gray-200 hover:border-red-300 hover:bg-red-50/30"
                    }`}>
                      <input
                        className="sr-only"
                        type="radio"
                        value="CRITICAL"
                        name="priority"
                        checked={selectedPriority === "CRITICAL"}
                        onChange={() => setSelectedPriority("CRITICAL")}
                      />
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all duration-300 ${
                        selectedPriority === "CRITICAL" ? "bg-red-500 text-white shadow-lg scale-110" : "bg-gray-100 text-gray-600"
                      }`}>
                        🔴
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-gray-900">Critical Priority</div>
                        <div className="text-xs text-gray-500">Emergency - immediate response</div>
                      </div>
                      {selectedPriority === "CRITICAL" && (
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in-50">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              )}

              {/* Spam/Invalid Reason Selector */}
              {dialogContent.requiresSpamReason && (
                <div className="space-y-6">
                  {/* Enhanced Warning Banner */}
                  <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl shadow-sm">
                    <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <ShieldX className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-red-900">This action cannot be undone</h4>
                      <p className="text-xs text-red-700 mt-1 leading-relaxed">
                        The incident will be removed from the map and all active views. Personnel will not be notified about this incident.
                      </p>
                    </div>
                  </div>

                  {/* Modern Incident Info Card */}
                  <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-4 border border-slate-200/60 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Incident Details</p>
                        <p className="text-slate-900 font-semibold text-sm truncate">{incident.title}</p>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Reason Selection */}
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      Select a reason for invalidation
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {SPAM_REASONS.map((reason, index) => (
                        <label
                          key={reason.id}
                          className={`group relative overflow-hidden rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-md ${
                            selectedSpamReason === reason.id
                              ? "bg-gradient-to-r from-red-50 to-red-100 border-red-400 shadow-lg shadow-red-100"
                              : "border-gray-200 hover:border-red-300 hover:bg-red-50/30"
                          }`}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <input
                            type="radio"
                            name="spamReason"
                            value={reason.id}
                            checked={selectedSpamReason === reason.id}
                            onChange={() => setSelectedSpamReason(reason.id)}
                            className="sr-only"
                          />
                          <div className="flex items-center gap-3 p-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all duration-300 ${
                              selectedSpamReason === reason.id
                                ? "bg-red-500 text-white shadow-lg scale-110"
                                : "bg-gray-100 text-gray-600 group-hover:bg-red-100 group-hover:text-red-600"
                            }`}>
                              {reason.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-bold transition-colors ${
                                selectedSpamReason === reason.id ? "text-red-900" : "text-gray-900"
                              }`}>
                                {reason.label}
                              </div>
                              <div className={`text-xs mt-1 transition-colors ${
                                selectedSpamReason === reason.id ? "text-red-700" : "text-gray-500"
                              }`}>
                                {reason.description}
                              </div>
                            </div>
                            {selectedSpamReason === reason.id && (
                              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in-50">
                                <CheckCircle className="h-4 w-4 text-white" />
                              </div>
                            )}
                          </div>
                          {/* Subtle gradient overlay for selected state */}
                          {selectedSpamReason === reason.id && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-50/20 to-red-100/30 pointer-events-none"></div>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Enhanced Notes Section */}
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      Additional Notes
                      <span className="text-xs font-normal text-gray-500">
                        {selectedSpamReason === "other" ? "(required)" : "(optional)"}
                      </span>
                    </label>
                    <div className="relative">
                      <Textarea
                        value={dialogInput}
                        onChange={(e) => setDialogInput(e.target.value.slice(0, 500))}
                        placeholder="Provide additional context about why this incident is being marked as invalid..."
                        className="w-full min-h-[100px] max-h-[200px] overflow-y-auto resize-none border-gray-200 focus:border-red-400 focus:ring-red-400/20 bg-gray-50/50 rounded-xl transition-all duration-200 placeholder:text-gray-400 scrollbar-hide"
                      />
                      <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                        {dialogInput.length}/500
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modern Footer */}
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-slate-50 border-t border-gray-200 rounded-b-2xl">
              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDialog(null);
                    setDialogInput("");
                    setSelectedSpamReason("");
                  }}
                  disabled={isLoading}
                  className="px-6 py-2.5 border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 rounded-xl font-medium"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDialogSubmit}
                  disabled={isLoading || (dialogContent.requiresSpamReason && !selectedSpamReason)}
                  className={`px-6 py-2.5 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed ${dialogContent.submitClass} ${dialogContent.submitClass.includes('red') ? 'shadow-red-200 hover:shadow-red-300' : dialogContent.submitClass.includes('blue') ? 'shadow-blue-200 hover:shadow-blue-300' : 'shadow-green-200 hover:shadow-green-300'}`}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </div>
                  ) : (
                    dialogContent.submitLabel
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
          ) : null}
        </Dialog>
      )}
    </>
  );
}
