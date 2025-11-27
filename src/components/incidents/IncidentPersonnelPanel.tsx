import type { Incident } from "@/types/incident.types";
import { Users } from "lucide-react";

interface IncidentPersonnelPanelProps {
  incident: Incident;
}

export function IncidentPersonnelPanel({ incident }: IncidentPersonnelPanelProps) {
  // Legacy support for assigned personnel if different from responders
  const personnel = (incident as any).assignedPersonnel || [];

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden h-full">
      <div className="relative overflow-hidden">
        <div className="bg-gradient-to-r from-blue-800 to-blue-700 px-4 py-3 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_50%),radial-gradient(circle_at_bottom,rgba(99,102,241,0.15),transparent_50%)]"></div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/10">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Assigned Personnel</h2>
              <p className="text-sm text-blue-300">Personnel assigned to this incident</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {personnel.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No personnel assigned</h3>
            <p className="text-slate-500 text-sm">Dispatch personnel to this incident to see them here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {personnel.map((person: any) => (
              <div key={person.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  {person.firstName?.[0]}{person.lastName?.[0]}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{person.firstName} {person.lastName}</p>
                  <p className="text-xs text-slate-500">{person.role}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
