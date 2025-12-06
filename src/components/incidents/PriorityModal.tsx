import { useState } from "react";
import { AlertTriangle, X, CheckCircle } from "lucide-react";

interface PriorityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (priority: string) => void;
  incidentTitle?: string;
}

export const PriorityModal = ({ isOpen, onClose, onConfirm, incidentTitle }: PriorityModalProps) => {
  const [selectedPriority, setSelectedPriority] = useState<string>("MEDIUM");

  const priorities = [
    { value: "LOW", label: "Low Priority", description: "Non-urgent, routine response", color: "bg-gray-100 text-gray-800 border-gray-400", icon: "🟢" },
    { value: "MEDIUM", label: "Medium Priority", description: "Standard response time", color: "bg-blue-100 text-blue-800 border-blue-400", icon: "🟡" },
    { value: "HIGH", label: "High Priority", description: "Urgent response required", color: "bg-orange-100 text-orange-800 border-orange-400", icon: "🟠" },
    { value: "CRITICAL", label: "Critical Priority", description: "Emergency - immediate response", color: "bg-red-100 text-red-800 border-red-400", icon: "🔴" },
  ];

  const handleConfirm = () => {
    onConfirm(selectedPriority);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
      <div className="max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border-0 bg-white/95 backdrop-blur-xl scrollbar-hide rounded-2xl">
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
                <AlertTriangle className="h-7 w-7 text-white drop-shadow-sm" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-1 drop-shadow-sm">Set Priority Level</h2>
                <p className="text-blue-100 text-sm font-medium">Please set the priority level for this incident before verification</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                aria-label="Close priority selection modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Modern Incident Info Card */}
          {incidentTitle && (
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-4 border border-slate-200/60 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Incident Details</p>
                  <p className="text-slate-900 font-semibold text-sm truncate">"{incidentTitle}"</p>
                </div>
              </div>
            </div>
          )}

          {/* Priority Selection */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Select Priority Level
            </label>
            <div className="space-y-2">
              {priorities.map((priority) => (
                <label
                  key={priority.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-md ${
                    selectedPriority === priority.value
                      ? `${priority.color} shadow-lg`
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="priority"
                    value={priority.value}
                    checked={selectedPriority === priority.value}
                    onChange={() => setSelectedPriority(priority.value)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all duration-300 ${
                    selectedPriority === priority.value
                      ? priority.value === "LOW" ? "bg-gray-500 text-white shadow-lg scale-110" :
                        priority.value === "MEDIUM" ? "bg-blue-500 text-white shadow-lg scale-110" :
                        priority.value === "HIGH" ? "bg-orange-500 text-white shadow-lg scale-110" :
                        "bg-red-500 text-white shadow-lg scale-110"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {priority.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-gray-900">{priority.label}</div>
                    <div className="text-xs text-gray-500">{priority.description}</div>
                  </div>
                  {selectedPriority === priority.value && (
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in-50 ${
                      priority.value === "LOW" ? "bg-gray-500" :
                      priority.value === "MEDIUM" ? "bg-blue-500" :
                      priority.value === "HIGH" ? "bg-orange-500" :
                      "bg-red-500"
                    }`}>
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Modern Footer */}
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-slate-50 border-t border-gray-200 rounded-b-2xl">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 rounded-xl font-medium text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transition-all duration-300 rounded-xl font-bold"
            >
              Verify with {selectedPriority.charAt(0).toUpperCase() + selectedPriority.slice(1).toLowerCase()} Priority
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
