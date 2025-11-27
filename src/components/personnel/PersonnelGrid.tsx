import { RefreshCw } from "lucide-react";
import { PersonnelCard } from "./PersonnelCard";
import type { Personnel } from "@/types/personnel.types";

interface PersonnelGridProps {
  personnel: Personnel[];
  isLoading: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
}

export function PersonnelGrid({
  personnel,
  isLoading,
  selectedIds: _selectedIds,
  onToggleSelect: _onToggleSelect,
}: PersonnelGridProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="h-12 w-12 animate-spin text-blue-600" />
        <p className="text-gray-500 mt-4">Loading personnel...</p>
      </div>
    );
  }

  if (personnel.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No personnel found</h3>
        <p className="text-gray-500">Try adjusting your filters or search criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {personnel.map((person) => (
        <PersonnelCard
          key={person.personnelId}
          person={person}
        />
      ))}
    </div>
  );
}
