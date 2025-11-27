import type { Incident } from "@/types/incident.types";
import { Activity, Clock } from "lucide-react";

interface IncidentUpdatesPanelProps {
  incident: Incident;
}

export function IncidentUpdatesPanel({ incident }: IncidentUpdatesPanelProps) {
  // Placeholder for updates/activity log
  // In a real app, this would come from incident.updates or a separate API call
  const updates = (incident as any).updates || [];

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden h-full">
      <div className="relative overflow-hidden">
        <div className="bg-gradient-to-r from-blue-800 to-blue-700 px-4 py-3 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_50%),radial-gradient(circle_at_bottom,rgba(99,102,241,0.15),transparent_50%)]"></div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/10">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Recent Activity</h2>
              <p className="text-sm text-blue-300">Incident timeline and system updates</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {updates.length === 0 ? (
          <div className="text-center py-12 bg-blue-50/50 rounded-xl border border-blue-100 dashed">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-blue-50">
              <Clock className="h-8 w-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No activity recorded</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">System updates and status changes will appear here automatically.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {updates.map((update: any, index: number) => (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-500 ring-4 ring-blue-100"></div>
                  {index !== updates.length - 1 && <div className="w-px h-full bg-blue-100 my-1"></div>}
                </div>
                <div className="pb-4">
                  <p className="text-sm text-slate-500 mb-1">{new Date(update.createdAt).toLocaleString()}</p>
                  <p className="text-slate-800 font-medium">{update.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
