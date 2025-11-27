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
import { Search, User, CheckSquare, Square } from "lucide-react";

interface Personnel {
  personnelId: string;
  name: string;
  role: string;
  status: string;
  available: boolean;
}

interface BulkAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirm: (personnelIds: string[]) => void;
}

// Mock personnel data - in real app, fetch from API
const MOCK_PERSONNEL: Personnel[] = [
  { personnelId: "1", name: "John Smith", role: "Firefighter", status: "On Duty", available: true },
  { personnelId: "2", name: "Sarah Johnson", role: "Paramedic", status: "On Duty", available: true },
  { personnelId: "3", name: "Mike Davis", role: "Police Officer", status: "On Duty", available: true },
  { personnelId: "4", name: "Emma Wilson", role: "EMT", status: "On Duty", available: true },
  { personnelId: "5", name: "Robert Brown", role: "Fire Chief", status: "Available", available: true },
  { personnelId: "6", name: "Lisa Anderson", role: "Paramedic", status: "On Call", available: false },
];

export function BulkAssignDialog({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
}: BulkAssignDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPersonnel, setSelectedPersonnel] = useState<Set<string>>(new Set());

  const filteredPersonnel = MOCK_PERSONNEL.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const togglePersonnel = (id: string) => {
    const newSet = new Set(selectedPersonnel);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedPersonnel(newSet);
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectedPersonnel));
    setSelectedPersonnel(new Set());
    setSearchTerm("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader onClose={() => onOpenChange(false)}>
          <DialogTitle>Assign Personnel ({selectedCount} incidents)</DialogTitle>
        </DialogHeader>
        
        <DialogBody>
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Personnel List */}
            <div className="max-h-96 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
              {filteredPersonnel.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No personnel found</p>
              ) : (
                filteredPersonnel.map((person) => (
                  <label
                    key={person.personnelId}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      person.available
                        ? "hover:bg-gray-50"
                        : "opacity-50 cursor-not-allowed bg-gray-50"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => person.available && togglePersonnel(person.personnelId)}
                      disabled={!person.available}
                      className="flex-shrink-0"
                    >
                      {selectedPersonnel.has(person.personnelId) ? (
                        <CheckSquare className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                    
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">{person.name}</div>
                        <div className="text-sm text-gray-500">{person.role}</div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          person.available
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {person.status}
                      </span>
                    </div>
                  </label>
                ))
              )}
            </div>

            {selectedPersonnel.size > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                  <strong>{selectedPersonnel.size}</strong> personnel selected to be assigned to{" "}
                  <strong>{selectedCount}</strong> incident{selectedCount !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={selectedPersonnel.size === 0}>
            Assign {selectedPersonnel.size} Personnel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
