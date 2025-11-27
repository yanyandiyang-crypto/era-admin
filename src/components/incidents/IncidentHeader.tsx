import { RefreshCw, Activity, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ViewToggle, type ViewMode } from "./ViewToggle";
import { useState, useEffect } from "react";

interface IncidentHeaderProps {
  isLoading: boolean;
  onRefresh: () => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
}

export function IncidentHeader({
  isLoading,
  onRefresh,
  viewMode,
  onViewModeChange,
}: IncidentHeaderProps) {
  // Live time state
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative mb-6 rounded-2xl border border-blue-200/20 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-6 sm:p-8 shadow-xl overflow-hidden">
      {/* Decorative overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.1),_transparent_50%),_radial-gradient(circle_at_bottom,_rgba(99,102,241,0.15),_transparent_50%)]" />
      <div className="pointer-events-none absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full -mt-28 -mr-28" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -mb-24 -ml-24" />

      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
            <Activity className="h-8 w-8 text-blue-100" />
          </div>
          <div>
            <p className="text-blue-100/80 text-xs font-semibold uppercase tracking-[0.2em] mb-1">
              Command Center
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Incident Management
            </h1>
            <p className="text-sm text-blue-100/90 font-medium">
              Coordinate responses and monitor live field operations
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-blue-50">
            <Clock className="h-4 w-4 text-blue-100" />
            <div className="text-left">
              <span className="text-xs uppercase tracking-wide text-blue-100/70">
                Live Time
              </span>
              <p className="text-sm font-semibold font-mono">
                {currentTime.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true,
                })}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              onClick={onRefresh}
              variant="secondary"
              size="sm"
              disabled={isLoading}
              className="bg-white text-blue-700 hover:bg-blue-50 border border-white/60 shadow-lg hover:shadow-xl transition-all"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            {viewMode !== undefined && onViewModeChange && (
              <div className="bg-white/10 rounded-xl border border-white/10 p-1">
                <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
