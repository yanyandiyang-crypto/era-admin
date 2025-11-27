import { Wifi, WifiOff } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';

export function ConnectionStatus() {
  const { isConnected } = useSocket();

  return (
    <div className="flex items-center gap-2">
      {isConnected ? (
        <>
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-green-600 hidden sm:inline">
            Live
          </span>
          <Wifi className="h-4 w-4 text-green-600" />
        </>
      ) : (
        <>
          <div className="h-2 w-2 bg-red-500 rounded-full" />
          <span className="text-xs font-medium text-red-600 hidden sm:inline">
            Offline
          </span>
          <WifiOff className="h-4 w-4 text-red-600" />
        </>
      )}
    </div>
  );
}
