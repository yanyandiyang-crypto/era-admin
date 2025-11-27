import type { Incident } from "@/types/incident.types";
import { Button } from "@/components/ui/button";
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle, 
  RotateCcw,
  Users,
  Clock,
  Activity
} from "lucide-react";

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
                  className="w-full justify-start bg-linear-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-sm" 
                  onClick={() => onVerify("HIGH")}
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Verify Incident
                </Button>
                <Button 
                  variant="destructive"
                  className="w-full justify-start bg-linear-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 shadow-sm"
                  onClick={() => onMarkAsSpam("Spam report")}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Mark as Spam
                </Button>
              </>
            )}

            {(incident.status === "VERIFIED" || incident.status === "RESPONDING" || incident.status === "ARRIVED") && (
              <Button 
                className="w-full justify-start bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-200"
                onClick={() => onResolve("Resolved by command center")}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Resolve Incident
              </Button>
            )}

            {incident.status === "RESOLVED" && (
              <Button 
                variant="outline" 
                className="w-full justify-start text-slate-600 hover:text-blue-600 hover:bg-blue-50 border-slate-200"
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
    </div>
  );
}
