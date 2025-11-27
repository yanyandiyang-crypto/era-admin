import { useEffect, useState } from 'react';
import { Wifi, Activity, Clock } from 'lucide-react';

interface RealTimeIndicatorProps {
  isConnected: boolean;
  lastUpdate?: Date;
  pingTime?: number; // in milliseconds
}

export function RealTimeIndicator({ isConnected, lastUpdate, pingTime }: RealTimeIndicatorProps) {
  const [showPulse, setShowPulse] = useState(false);

  useEffect(() => {
    if (lastUpdate) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdate]);

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
      isConnected
        ? 'bg-green-100 text-green-700 border border-green-200'
        : 'bg-red-100 text-red-700 border border-red-200'
    } ${showPulse ? 'animate-pulse scale-105' : ''}`}>
      <div className="flex items-center gap-1">
        {isConnected ? (
          <Wifi className="h-3 w-3" />
        ) : (
          <Activity className="h-3 w-3" />
        )}
        <span>
          {isConnected ? 'Live Updates' : 'Polling Mode'}
        </span>
        {pingTime !== undefined && isConnected && (
          <span className="flex items-center gap-1 ml-2 text-xs">
            <Clock className="h-2.5 w-2.5" />
            {pingTime}ms
          </span>
        )}
      </div>
      {lastUpdate && isConnected && (
        <div className={`h-2 w-2 rounded-full ${showPulse ? 'bg-green-400 animate-ping' : 'bg-green-500'}`} />
      )}
    </div>
  );
}
