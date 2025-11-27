import { AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { useState } from "react";

export interface Alert {
  id: string;
  type: "critical" | "warning" | "info";
  title: string;
  message: string;
  timestamp: string;
  actionUrl?: string;
}

interface AlertPanelProps {
  alerts: Alert[];
  onDismiss: (id: string) => void;
}

export function AlertPanel({ alerts, onDismiss }: AlertPanelProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);

  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "critical":
        return <AlertCircle className="h-5 w-5" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5" />;
      case "info":
        return <Info className="h-5 w-5" />;
    }
  };

  const getAlertStyles = (type: Alert["type"]) => {
    switch (type) {
      case "critical":
        return "bg-red-50 border-red-200 text-red-900";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-900";
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-900";
    }
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Active Alerts ({alerts.length})
        </h3>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Sound: {soundEnabled ? "On" : "Off"}
        </button>
      </div>

      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`border rounded-lg p-4 ${getAlertStyles(alert.type)} relative animate-in fade-in slide-in-from-top-5 duration-300`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getAlertIcon(alert.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm">{alert.title}</h4>
              <p className="text-sm mt-1">{alert.message}</p>
              <p className="text-xs mt-2 opacity-75">{alert.timestamp}</p>
              {alert.actionUrl && (
                <button className="text-sm font-medium mt-2 hover:underline" title={`View details for ${alert.title}`}>
                  View Details →
                </button>
              )}
            </div>
            <button
              onClick={() => onDismiss(alert.id)}
              className="flex-shrink-0 hover:bg-black/5 rounded p-1 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
