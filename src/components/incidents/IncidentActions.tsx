import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, RotateCcw, Map, Monitor } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { ResolutionReview } from "./ResolutionReview";
import type { Incident } from "@/types/incident.types";

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
  const [selectedPriority, setSelectedPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [isLoading, setIsLoading] = useState(false);

  const handleDialogSubmit = async () => {
    setIsLoading(true);
    try {
      switch (showDialog) {
        case "verify":
          await onVerify?.(selectedPriority, dialogInput || undefined);
          break;
        case "spam":
          if (!dialogInput.trim()) {
            toast.error("Please provide a reason", {
              description: "You must enter a reason to mark this incident as invalid"
            });
            return;
          }
          await onMarkAsSpam?.(dialogInput);
          break;
        case "resolve":
          await onResolve?.("");
          // Trigger flash animation for status change
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('incident:status-changed', {
              detail: { incidentId: getId(), type: 'resolve' }
            }));
          }, 500);
          break;
        case "reopen":
          if (!dialogInput.trim()) {
            toast.error("Please provide a reason for reopening", {
              description: "You must explain why this incident needs to be reopened"
            });
            return;
          }
          await onReopen?.(dialogInput);
          break;
      }
      setShowDialog(null);
      setDialogInput("");
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
                className="bg-linear-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-sm"
                onClick={() => setShowDialog("verify")}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Verify
              </Button>
              <Button
                size={buttonSize}
                variant="destructive"
                className="bg-linear-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 shadow-sm"
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
                className="bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-sm"
                onClick={() => navigate(`/map?incident=${getId()}`)}
              >
                <Map className="h-4 w-4 mr-2" />
                View on Map
              </Button>
              <Button
                size={buttonSize}
                className="bg-linear-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-sm"
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
                className="bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-sm"
                onClick={() => navigate(`/map?incident=${getId()}`)}
              >
                <Map className="h-4 w-4 mr-2" />
                View on Map
              </Button>
              <Button
                size={buttonSize}
                className="bg-linear-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-sm"
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
              className="bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-sm"
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
              className="border-gray-200 hover:bg-gray-50 hover:text-gray-700 transition-all shadow-sm"
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
          submitClass: "bg-linear-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600",
          requiresPriority: true,
        };
      case "spam":
        return {
          title: "Mark as Spam/Invalid",
          description: "Explain why this report is invalid or spam.",
          placeholder: "Enter reason (required)...",
          submitLabel: "Mark as Spam",
          submitClass: "bg-linear-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600",
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
                <DialogHeader>
                  <div className="flex-shrink-0 border-b border-gray-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Review Resolution Report</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Review the personnel's 5W1H resolution report and confirm or reject the resolution.
                    </p>
                  </div>
                </div>
                </div>
              </DialogHeader>
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
            <DialogContent className="max-h-[80vh] overflow-auto">
              <DialogHeader>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{dialogContent.title}</h2>
                  <p className="text-sm text-gray-600 mt-1">{dialogContent.description}</p>
                  {dialogContent.requiresPriority && (
                    <p className="text-sm font-medium text-gray-800 mb-4 p-2 bg-gray-50 rounded">
                      "{incident.title}"
                    </p>
                  )}
                </div>
              </DialogHeader>

            <div className="py-4 space-y-4">
              {dialogContent.requiresPriority && (
                <div>
                  <div className="space-y-2">
                    <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all border-gray-200 hover:border-gray-300 hover:bg-gray-50 ${
                      selectedPriority === "LOW" ? "bg-gray-100 text-gray-800 border-gray-300 border-current shadow-sm" : ""
                    }`}>
                      <input
                        className="sr-only"
                        type="radio"
                        value="LOW"
                        name="priority"
                        checked={selectedPriority === "LOW"}
                        onChange={() => setSelectedPriority("LOW")}
                      />
                      <span className="text-lg">🟢</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">Low Priority</div>
                        <div className="text-xs text-gray-500">Non-urgent, routine response</div>
                      </div>
                    </label>
                    <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all border-gray-200 hover:border-gray-300 hover:bg-gray-50 ${
                      selectedPriority === "MEDIUM" ? "bg-blue-100 text-blue-800 border-blue-300 border-current shadow-sm" : ""
                    }`}>
                      <input
                        className="sr-only"
                        type="radio"
                        value="MEDIUM"
                        name="priority"
                        checked={selectedPriority === "MEDIUM"}
                        onChange={() => setSelectedPriority("MEDIUM")}
                      />
                      <span className="text-lg">🟡</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">Medium Priority</div>
                        <div className="text-xs text-gray-500">Standard response time</div>
                      </div>
                    </label>
                    <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all border-gray-200 hover:border-gray-300 hover:bg-gray-50 ${
                      selectedPriority === "HIGH" ? "bg-orange-100 text-orange-800 border-orange-300 border-current shadow-sm" : ""
                    }`}>
                      <input
                        className="sr-only"
                        type="radio"
                        value="HIGH"
                        name="priority"
                        checked={selectedPriority === "HIGH"}
                        onChange={() => setSelectedPriority("HIGH")}
                      />
                      <span className="text-lg">🟠</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">High Priority</div>
                        <div className="text-xs text-gray-500">Priority response required</div>
                      </div>
                    </label>
                    <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all border-gray-200 hover:border-gray-300 hover:bg-gray-50 ${
                      selectedPriority === "CRITICAL" ? "bg-red-100 text-red-800 border-red-300 border-current shadow-sm" : ""
                    }`}>
                      <input
                        className="sr-only"
                        type="radio"
                        value="CRITICAL"
                        name="priority"
                        checked={selectedPriority === "CRITICAL"}
                        onChange={() => setSelectedPriority("CRITICAL")}
                      />
                      <span className="text-lg">🔴</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">Critical Priority</div>
                        <div className="text-xs text-gray-500">Emergency - immediate response</div>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDialog(null);
                  setDialogInput("");
                }}
                disabled={isLoading}
                className="border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDialogSubmit}
                disabled={isLoading}
                className={`shadow-md transition-colors ${dialogContent.submitClass}`}
              >
                {isLoading ? "Processing..." : dialogContent.submitLabel}
              </Button>
            </DialogFooter>
          </DialogContent>
          ) : null}
        </Dialog>
      )}
    </>
  );
}
