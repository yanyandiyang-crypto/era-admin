import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogBody, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GitBranch } from "lucide-react";
import type { IncidentStatus } from "@/types/incident.types";

interface BulkStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirm: (status: IncidentStatus, notes?: string) => void;
}

const STATUS_OPTIONS = [
  { value: "PENDING_VERIFICATION", label: "Pending Verification", description: "Waiting for admin verification", color: "bg-red-50 text-red-700 border-red-100" },
  { value: "VERIFIED", label: "Verified", description: "Admin has verified this incident", color: "bg-gray-50 text-gray-700 border-gray-100" },
  { value: "REPORTED", label: "Reported", description: "Initial report received", color: "bg-blue-50 text-blue-700 border-blue-100" },
  { value: "ACKNOWLEDGED", label: "Acknowledged", description: "Personnel have acknowledged", color: "bg-violet-50 text-violet-700 border-violet-100" },
  { value: "DISPATCHED", label: "Dispatched", description: "Personnel have been dispatched", color: "bg-purple-50 text-purple-700 border-purple-100" },
  { value: "IN_PROGRESS", label: "In Progress", description: "Incident response in progress", color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
  { value: "RESPONDING", label: "Responding", description: "Personnel are en route to the incident", color: "bg-orange-50 text-orange-700 border-orange-100" },
  { value: "ARRIVED", label: "On Scene", description: "Personnel have arrived at the scene", color: "bg-green-50 text-green-700 border-green-100" },
  { value: "RESOLVED", label: "Resolved", description: "Incident has been resolved", color: "bg-blue-50 text-blue-700 border-blue-100" },
  { value: "CLOSED", label: "Closed", description: "Incident has been closed", color: "bg-blue-50 text-blue-700 border-blue-100" },
  { value: "CANCELLED", label: "Cancelled", description: "Incident has been cancelled", color: "bg-rose-50 text-rose-700 border-rose-100" },
  { value: "SPAM", label: "Spam", description: "Mark as spam or false report", color: "bg-red-50 text-red-700 border-red-200" },
];

export function BulkStatusDialog({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
}: BulkStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<IncidentStatus>("VERIFIED");
  const [notes, setNotes] = useState("");

  const handleConfirm = () => {
    onConfirm(selectedStatus, notes);
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-auto">
        <DialogHeader onClose={() => onOpenChange(false)}>
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-blue-500" />
            <DialogTitle>
              Change Status ({selectedCount} incident{selectedCount !== 1 ? "s" : ""})
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <DialogBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Status
              </label>
              <div className="space-y-2">
                {STATUS_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${selectedStatus === option.value ? `${option.color} border-l-4` : 'hover:bg-gray-50'}`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={option.value}
                      checked={selectedStatus === option.value}
                      onChange={(e) => setSelectedStatus(e.target.value as IncidentStatus)}
                      className="mt-1 accent-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        {option.label}
                        {selectedStatus === option.value && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this status change..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              />
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            className="bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-colors shadow-md"
          >
            Update {selectedCount} Incident{selectedCount !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
