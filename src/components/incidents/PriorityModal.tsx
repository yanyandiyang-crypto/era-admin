import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface PriorityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (priority: string) => void;
  incidentTitle?: string;
}

export const PriorityModal = ({ isOpen, onClose, onConfirm, incidentTitle }: PriorityModalProps) => {
  const [selectedPriority, setSelectedPriority] = useState<string>("MEDIUM");

  const priorities = [
    { value: "LOW", label: "Low Priority", color: "bg-gray-100 text-gray-800 border-gray-300", icon: "🟢" },
    { value: "MEDIUM", label: "Medium Priority", color: "bg-blue-100 text-blue-800 border-blue-300", icon: "🟡" },
    { value: "HIGH", label: "High Priority", color: "bg-orange-100 text-orange-800 border-orange-300", icon: "🟠" },
    { value: "CRITICAL", label: "Critical Priority", color: "bg-red-100 text-red-800 border-red-300", icon: "🔴" },
  ];

  const handleConfirm = () => {
    onConfirm(selectedPriority);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900">Set Priority Level</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close priority selection modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            Please set the priority level for this incident before verification:
          </p>
          {incidentTitle && (
            <p className="text-sm font-medium text-gray-800 mb-4 p-2 bg-gray-50 rounded">
              "{incidentTitle}"
            </p>
          )}

          <div className="space-y-2">
            {priorities.map((priority) => (
              <label
                key={priority.value}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedPriority === priority.value
                    ? `${priority.color} border-current shadow-sm`
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  value={priority.value}
                  checked={selectedPriority === priority.value}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="sr-only"
                />
                <span className="text-lg">{priority.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{priority.label}</div>
                  {priority.value === "LOW" && (
                    <div className="text-xs text-gray-500">Non-urgent, routine response</div>
                  )}
                  {priority.value === "MEDIUM" && (
                    <div className="text-xs text-gray-500">Standard response time</div>
                  )}
                  {priority.value === "HIGH" && (
                    <div className="text-xs text-gray-500">Priority response required</div>
                  )}
                  {priority.value === "CRITICAL" && (
                    <div className="text-xs text-gray-500">Emergency - immediate response</div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Verify with {priorities.find(p => p.value === selectedPriority)?.label}
          </button>
        </div>
      </div>
    </div>
  );
};
