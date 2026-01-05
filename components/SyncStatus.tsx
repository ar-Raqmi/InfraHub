import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useIsFetching } from '@tanstack/react-query';

export const SyncStatus: React.FC = () => {
  const isFetching = useIsFetching();
  const isOnline = navigator.onLine;

  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-500 text-white text-xs font-bold py-1 px-4 flex items-center justify-center gap-2 shadow-md">
        <WifiOff className="w-3 h-3" />
        <span>OFFLINE MODE - Data may be outdated</span>
      </div>
    );
  }

  if (isFetching > 0) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-yellow-400 text-yellow-900 text-xs font-bold py-1 px-4 flex items-center justify-center gap-2 shadow-md transition-all duration-500">
        <RefreshCw className="w-3 h-3 animate-spin" />
        <span>Syncing...</span>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none flex justify-center">
       <div className="bg-emerald-500/90 text-white text-[10px] font-bold py-0.5 px-3 rounded-b-lg shadow-sm backdrop-blur-sm opacity-0 animate-fade-out">
          Live
       </div>
    </div>
  );
};
