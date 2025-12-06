import { RefreshCw, Clock } from "lucide-react";
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
    <div className="relative overflow-hidden bg-linear-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl shadow-2xl">
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.1),_transparent_50%),_radial-gradient(circle_at_bottom,_rgba(99,102,241,0.1),_transparent_50%)]" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />

      <div className="relative p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Incident Management
            </h1>
            <p className="text-blue-100 mt-1 font-medium">
              Coordinate responses and monitor live field operations
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Live Time Display */}
            <div className="flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-blue-50">
              <Clock className="h-4 w-4 text-blue-100" />
              <div className="text-left">
                <span className="text-xs uppercase tracking-wide text-blue-100/70">
                  Live Time
                </span>
                <p className="text-sm font-semibold leading-tight font-mono">
                  {currentTime.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                  })}
                </p>
              </div>
            </div>
            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-white disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            {viewMode !== undefined && onViewModeChange && (
              <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-lg p-1">
                <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
