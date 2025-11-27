import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GitBranch, X } from "lucide-react";
import { BulkStatusDialog } from "./BulkStatusDialog";
import type { IncidentStatus } from "@/types/incident.types";

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onChangeStatus: (status: IncidentStatus, notes?: string) => Promise<void>;
}

export function BulkActionBar({
  selectedCount,
  onClearSelection,
  onChangeStatus,
}: BulkActionBarProps) {
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="bg-linear-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5 shadow-md animate-in slide-in-from-top-2 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 z-0 opacity-[0.03] enterprise-pattern"></div>
        
        <div className="flex items-center justify-between flex-wrap gap-3 relative z-10">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 p-2 rounded-full border border-blue-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <span className="text-sm font-semibold text-blue-900">
              {selectedCount} incident{selectedCount !== 1 ? "s" : ""} selected
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowStatusDialog(true)}
              className="border-blue-200 bg-white hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors shadow-sm"
            >
              <GitBranch className="h-4 w-4 mr-2" />
              Change Status
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClearSelection}
              className="border-red-100 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors shadow-sm"
            >
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <BulkStatusDialog
        open={showStatusDialog}
        onOpenChange={setShowStatusDialog}
        selectedCount={selectedCount}
        onConfirm={onChangeStatus}
      />
    </>
  );
}
