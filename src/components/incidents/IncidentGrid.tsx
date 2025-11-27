import { RefreshCw } from "lucide-react";
import { IncidentCard } from "./IncidentCard";
import type { Incident } from "@/types/incident.types";

interface IncidentGridProps {
  incidents: Incident[];
  isLoading: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onRefresh?: () => void;
  flashIds?: Set<string>;
}

export function IncidentGrid({
  incidents,
  isLoading,
  selectedIds,
  onToggleSelect,
  onRefresh,
  flashIds,
}: IncidentGridProps) {
  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-600" />
          <p className="text-gray-500 mt-4">Loading incidents...</p>
        </div>
      ) : incidents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-gray-500 text-center">
            No incidents found. Try adjusting your filters or create a new incident.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {incidents.map((incident) => (
            <IncidentCard
              key={incident.incidentId}
              incident={incident}
              isSelected={selectedIds.has(incident.incidentId)}
              onToggleSelect={onToggleSelect}
              onRefresh={onRefresh}
              isFlashing={Boolean(incident.incidentId && flashIds?.has(incident.incidentId))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
