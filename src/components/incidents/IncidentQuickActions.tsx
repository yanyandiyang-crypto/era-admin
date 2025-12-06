import type { Incident } from "@/types/incident.types";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  CheckCircle, 
  RotateCcw,
  Users,
  Clock,
  Activity,
  XCircle
} from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// Spam/Invalid reason presets
const SPAM_REASONS = [
  { id: "duplicate", label: "Duplicate Report", icon: "📋", description: "This incident was already reported" },
  { id: "false_alarm", label: "False Alarm", icon: "🔔", description: "No actual emergency exists" },
  { id: "test_report", label: "Test Report", icon: "🧪", description: "Submitted for testing purposes" },
  { id: "spam", label: "Spam/Junk", icon: "🚫", description: "Irrelevant or promotional content" },
  { id: "wrong_location", label: "Wrong Location", icon: "📍", description: "Location is incorrect or outside service area" },
  { id: "other", label: "Other", icon: "📝", description: "Specify custom reason below" },
];

interface IncidentQuickActionsProps {
  incident: Incident;
  onVerify: (priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL", notes?: string) => void;
  onMarkAsSpam: (reason: string) => void;
  onResolve: (notes: string) => void;
  onReopen: (reason: string) => void;
}

export function IncidentQuickActions({ 
  incident,
  onVerify,
  onMarkAsSpam,
  onResolve,
  onReopen 
}: IncidentQuickActionsProps) {
  
  const [isSpamModalOpen, setIsSpamModalOpen] = useState(false);
  const [selectedSpamReason, setSelectedSpamReason] = useState<string>("");
  const [spamNotes, setSpamNotes] = useState("");
  const [isMarkingAsSpam, setIsMarkingAsSpam] = useState(false);

  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [verifyNotes, setVerifyNotes] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolveData, setResolveData] = useState({
    what: '',
    when: '',
    where: '',
    who: '',
    why: '',
    how: 'OTHER' as const,
    notes: '',
  });
  const [isResolving, setIsResolving] = useState(false);

  const handleMarkAsSpam = async () => {
    if (!selectedSpamReason) {
      toast.error("Please select a reason for marking as spam");
      return;
    }

    setIsMarkingAsSpam(true);
    try {
      // Build the full reason from preset + custom notes
      const selectedPreset = SPAM_REASONS.find(r => r.id === selectedSpamReason);
      let fullReason = "";
      
      if (selectedPreset) {
        fullReason = `${selectedPreset.label}`;
        if (spamNotes.trim()) {
          fullReason += ` - ${spamNotes.trim()}`;
        }
      } else if (spamNotes.trim()) {
        fullReason = spamNotes.trim();
      } else {
        fullReason = 'No reason provided';
      }

      await onMarkAsSpam(fullReason);
      setIsSpamModalOpen(false);
      setSelectedSpamReason("");
      setSpamNotes("");
    } catch (error) {
      toast.error("Failed to mark incident as spam");
    } finally {
      setIsMarkingAsSpam(false);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      await onVerify(selectedPriority, verifyNotes || undefined);
      setIsVerifyModalOpen(false);
      setSelectedPriority("MEDIUM");
      setVerifyNotes("");
    } catch (error) {
      toast.error("Failed to verify incident");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResolve = async () => {
    if (!resolveData.what || !resolveData.when || !resolveData.where || !resolveData.who || !resolveData.why) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsResolving(true);
    try {
      // For now, just send the notes. Later we can modify backend to accept 5W1H
      const resolutionNotes = `WHAT: ${resolveData.what}\nWHEN: ${resolveData.when}\nWHERE: ${resolveData.where}\nWHO: ${resolveData.who}\nWHY: ${resolveData.why}\nHOW: ${resolveData.how}\nNOTES: ${resolveData.notes}`;
      await onResolve(resolutionNotes);
      setIsResolveModalOpen(false);
      setResolveData({
        what: '',
        when: '',
        where: '',
        who: '',
        why: '',
        how: 'OTHER',
        notes: '',
      });
    } catch (error) {
      toast.error("Failed to resolve incident");
    } finally {
      setIsResolving(false);
    }
  };

  const closeSpamModal = () => {
    setIsSpamModalOpen(false);
    setSelectedSpamReason("");
    setSpamNotes("");
  };

  const closeVerifyModal = () => {
    setIsVerifyModalOpen(false);
    setSelectedPriority("MEDIUM");
    setVerifyNotes("");
  };

  const closeResolveModal = () => {
    setIsResolveModalOpen(false);
    setResolveData({
      what: '',
      when: '',
      where: '',
      who: '',
      why: '',
      how: 'OTHER',
      notes: '',
    });
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden sticky top-6">
      <div className="bg-gradient-to-r from-blue-800 to-blue-700 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm shadow-inner border border-white/10">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">Quick Actions</h3>
            <p className="text-xs text-blue-200 font-medium">Manage incident response</p>
          </div>
        </div>
      </div>
      
      <div className="p-5 space-y-6">
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Primary Actions</h4>
          <div className="space-y-2.5">
            {incident.status === "PENDING_VERIFICATION" && (
              <>
                <Button
                  className="w-full justify-start bg-linear-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-sm hover:shadow-md transition-all duration-200 font-medium"
                  onClick={() => setIsVerifyModalOpen(true)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verify Incident
                </Button>
              </>
            )}

            {/* Show Mark as Spam for all active incidents except RESOLVED */}
            {incident.status !== "RESOLVED" && incident.status !== "SPAM" && incident.status !== "CLOSED" && incident.status !== "CANCELLED" && (
              <Button
                className="w-full justify-start bg-linear-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-sm hover:shadow-md transition-all duration-200 font-medium"
                onClick={() => setIsSpamModalOpen(true)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Mark as Invalid
              </Button>
            )}

            {/* Show Resolve button for incidents that can be resolved */}
            {["VERIFIED", "REPORTED", "ACKNOWLEDGED", "DISPATCHED", "RESPONDING", "ARRIVED", "IN_PROGRESS", "PENDING_RESOLVE"].includes(incident.status) && (
              <Button
                className="w-full justify-start bg-linear-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-sm hover:shadow-md transition-all duration-200 font-medium"
                onClick={() => setIsResolveModalOpen(true)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Resolve Incident
              </Button>
            )}

            {incident.status === "RESOLVED" && (
              <Button
                variant="outline"
                className="w-full justify-start text-slate-600 hover:text-blue-600 hover:bg-blue-50 border-slate-200 hover:border-blue-300 transition-all duration-200 font-medium"
                onClick={() => onReopen("Reopened by command center")}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reopen Incident
              </Button>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Incident Timeline</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm group">
              <div className="flex items-center gap-2 text-slate-500 group-hover:text-blue-600 transition-colors">
                <Clock className="h-3.5 w-3.5" />
                <span>Reported</span>
              </div>
              <span className="font-mono font-semibold text-slate-700">
                {new Date(incident.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm group">
              <div className="flex items-center gap-2 text-slate-500 group-hover:text-blue-600 transition-colors">
                <Activity className="h-3.5 w-3.5" />
                <span>Status</span>
              </div>
              <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs border border-blue-100">
                {incident.status}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm group">
              <div className="flex items-center gap-2 text-slate-500 group-hover:text-blue-600 transition-colors">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Priority</span>
              </div>
              <span className={`font-bold text-xs px-2 py-0.5 rounded border ${
                incident.priority === 'CRITICAL' ? 'text-red-700 bg-red-50 border-red-100' :
                incident.priority === 'HIGH' ? 'text-orange-700 bg-orange-50 border-orange-100' :
                'text-blue-700 bg-blue-50 border-blue-100'
              }`}>
                {incident.priority}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Spam/Invalid Modal */}
      <Dialog open={isSpamModalOpen} onOpenChange={setIsSpamModalOpen}>
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
            <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-red-600 to-pink-600 opacity-90"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10"></div>
            <div className="relative px-6 py-5 text-white">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                  <AlertTriangle className="h-7 w-7 text-white drop-shadow-sm" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white mb-1 drop-shadow-sm">Mark as Spam/Invalid</h2>
                  <p className="text-red-100 text-sm font-medium">Remove this incident from active tracking</p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 space-y-6">
            {/* Enhanced Warning Banner */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-red-50 via-red-50 to-orange-50 border border-red-200/60 shadow-sm">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-100/30 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative flex items-start gap-4 p-5">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <XCircle className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-bold text-red-900 mb-2">Irreversible Action</h4>
                  <p className="text-sm text-red-700 leading-relaxed">
                    This incident will be permanently marked as spam and removed from all active lists and maps. Personnel will not be notified.
                  </p>
                </div>
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
            <div>
              <label className="text-sm font-bold text-gray-800 mb-4 block flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Select Reason for Invalidation
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
                  value={spamNotes}
                  onChange={(e) => setSpamNotes(e.target.value.slice(0, 500))}
                  placeholder="Provide additional context about why this incident is being marked as invalid..."
                  className="w-full min-h-[100px] max-h-[200px] overflow-y-auto resize-none border-gray-200 focus:border-red-400 focus:ring-red-400/20 bg-gray-50/50 rounded-xl transition-all duration-200 placeholder:text-gray-400 scrollbar-hide"
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                  {spamNotes.length}/500
                </div>
              </div>
            </div>
          </div>

          {/* Modern Footer */}
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-slate-50 border-t border-gray-200 rounded-b-2xl">
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={closeSpamModal}
                disabled={isMarkingAsSpam}
                className="px-6 py-2.5 border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 rounded-xl font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={handleMarkAsSpam}
                disabled={isMarkingAsSpam || !selectedSpamReason || (selectedSpamReason === "other" && !spamNotes.trim())}
                className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-300 transition-all duration-300 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMarkingAsSpam ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : (
                  "Mark as Invalid"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Verification Modal with Priority Selection */}
      <Dialog open={isVerifyModalOpen} onOpenChange={setIsVerifyModalOpen}>
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
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 opacity-90"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10"></div>
            <div className="relative px-6 py-5 text-white">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                  <CheckCircle className="h-7 w-7 text-white drop-shadow-sm" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white mb-1 drop-shadow-sm">Set Priority Level</h2>
                  <p className="text-blue-100 text-sm font-medium">Please set the priority level for this incident before verification</p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 space-y-6">
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

            {/* Priority Selection */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Select Priority Level
              </label>
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
                    <div className="text-xs text-gray-500">Immediate response required</div>
                  </div>
                  {selectedPriority === "CRITICAL" && (
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in-50">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Optional Notes */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Verification Notes (Optional)
              </label>
              <Textarea
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                placeholder="Add any verification notes..."
                className="w-full min-h-[80px] max-h-[120px] overflow-y-auto resize-none border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 bg-gray-50/50 rounded-xl transition-all duration-200 scrollbar-hide"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={closeVerifyModal}
                className="flex-1 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={handleVerify}
                disabled={isVerifying}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-sm hover:shadow-md transition-all duration-200 font-medium"
              >
                {isVerifying ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Verifying...
                  </div>
                ) : (
                  `Verify with ${selectedPriority.charAt(0).toUpperCase() + selectedPriority.slice(1).toLowerCase()} Priority`
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Resolve Modal with 5W1H */}
      <Dialog open={isResolveModalOpen} onOpenChange={setIsResolveModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border-0 bg-white/95 backdrop-blur-xl scrollbar-hide">
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
            <div className="absolute inset-0 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 opacity-90"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10"></div>
            <div className="relative px-6 py-5 text-white">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                  <CheckCircle className="h-7 w-7 text-white drop-shadow-sm" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white mb-1 drop-shadow-sm">Resolve Incident</h2>
                  <p className="text-green-100 text-sm font-medium">Complete resolution using 5W1H methodology</p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 space-y-6">
            {/* Modern Incident Info Card */}
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-4 border border-slate-200/60 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Resolution Details</p>
                  <p className="text-slate-900 font-semibold text-sm truncate">{incident.title}</p>
                </div>
              </div>
            </div>

            {/* Enhanced 5W1H Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* What */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  What Happened?
                  <span className="text-red-500 text-xs">*</span>
                </label>
                <Textarea
                  value={resolveData.what}
                  onChange={(e) => setResolveData(prev => ({ ...prev, what: e.target.value }))}
                  placeholder="Describe the incident in detail..."
                  className="w-full min-h-[80px] max-h-[120px] overflow-y-auto resize-none border-gray-200 focus:border-green-400 focus:ring-green-400/20 bg-gray-50/50 rounded-xl transition-all duration-200 scrollbar-hide"
                />
              </div>

              {/* When */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  When Did It Happen?
                  <span className="text-red-500 text-xs">*</span>
                </label>
                <Textarea
                  value={resolveData.when}
                  onChange={(e) => setResolveData(prev => ({ ...prev, when: e.target.value }))}
                  placeholder="Date and time details..."
                  className="w-full min-h-[80px] max-h-[120px] overflow-y-auto resize-none border-gray-200 focus:border-green-400 focus:ring-green-400/20 bg-gray-50/50 rounded-xl transition-all duration-200 scrollbar-hide"
                />
              </div>

              {/* Where */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Where Did It Happen?
                  <span className="text-red-500 text-xs">*</span>
                </label>
                <Textarea
                  value={resolveData.where}
                  onChange={(e) => setResolveData(prev => ({ ...prev, where: e.target.value }))}
                  placeholder="Location and address details..."
                  className="w-full min-h-[80px] max-h-[120px] overflow-y-auto resize-none border-gray-200 focus:border-green-400 focus:ring-green-400/20 bg-gray-50/50 rounded-xl transition-all duration-200 scrollbar-hide"
                />
              </div>

              {/* Who */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Who Was Involved?
                  <span className="text-red-500 text-xs">*</span>
                </label>
                <Textarea
                  value={resolveData.who}
                  onChange={(e) => setResolveData(prev => ({ ...prev, who: e.target.value }))}
                  placeholder="People, witnesses, victims involved..."
                  className="w-full min-h-[80px] max-h-[120px] overflow-y-auto resize-none border-gray-200 focus:border-green-400 focus:ring-green-400/20 bg-gray-50/50 rounded-xl transition-all duration-200 scrollbar-hide"
                />
              </div>

              {/* Why */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Why Did It Happen?
                  <span className="text-red-500 text-xs">*</span>
                </label>
                <Textarea
                  value={resolveData.why}
                  onChange={(e) => setResolveData(prev => ({ ...prev, why: e.target.value }))}
                  placeholder="Cause or reason for the incident..."
                  className="w-full min-h-[80px] max-h-[120px] overflow-y-auto resize-none border-gray-200 focus:border-green-400 focus:ring-green-400/20 bg-gray-50/50 rounded-xl transition-all duration-200 scrollbar-hide"
                />
              </div>

              {/* How */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  How Was It Resolved?
                </label>
                <select
                  value={resolveData.how}
                  onChange={(e) => setResolveData(prev => ({ ...prev, how: e.target.value as any }))}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:border-green-400 focus:ring-green-400/20 bg-gray-50/50 transition-all duration-200"
                >
                  <option value="BROUGHT_TO_POLICE_STATION">🚔 Brought to Police Station</option>
                  <option value="BROUGHT_TO_HOSPITAL">🏥 Brought to Hospital</option>
                  <option value="RESPONDED_BY_FIREFIGHTER">🔥 Responded by Firefighter</option>
                  <option value="BROUGHT_TO_BARANGAY">🏛️ Brought to Barangay</option>
                  <option value="RESPONDED_BY_POLICE">👮 Responded by Police</option>
                  <option value="COMMON_RESOLVED">✅ Common Resolution</option>
                  <option value="OTHER">📝 Other</option>
                </select>
              </div>
            </div>

            {/* Enhanced Notes Section */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Additional Resolution Notes
              </label>
              <div className="relative">
                <Textarea
                  value={resolveData.notes}
                  onChange={(e) => setResolveData(prev => ({ ...prev, notes: e.target.value.slice(0, 1000) }))}
                  placeholder="Any additional details about the resolution process..."
                  className="w-full min-h-[100px] max-h-[200px] overflow-y-auto resize-none border-gray-200 focus:border-green-400 focus:ring-green-400/20 bg-gray-50/50 rounded-xl transition-all duration-200 placeholder:text-gray-400 scrollbar-hide"
                />
                <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                  <span>Optional resolution notes</span>
                  <span>{resolveData.notes.length}/1000</span>
                </div>
                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                  {resolveData.notes.length}/1000
                </div>
              </div>
            </div>
          </div>

          {/* Modern Footer */}
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-slate-50 border-t border-gray-200 rounded-b-2xl">
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={closeResolveModal}
                disabled={isResolving}
                className="px-6 py-2.5 border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 rounded-xl font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={handleResolve}
                disabled={isResolving || !resolveData.what || !resolveData.when || !resolveData.where || !resolveData.who || !resolveData.why}
                className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg shadow-green-200 hover:shadow-xl hover:shadow-green-300 transition-all duration-300 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResolving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Resolving...
                  </div>
                ) : (
                  "Resolve Incident"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
