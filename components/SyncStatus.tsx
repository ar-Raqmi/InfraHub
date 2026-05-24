import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, ShieldCheck, Zap, Globe } from 'lucide-react';
import { useIsFetching } from '@tanstack/react-query';
import { api } from '../services/apiService';

export const SyncStatus: React.FC = () => {
  // Real count of active network requests from React Query
  const isFetchingCount = useIsFetching();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSynced, setShowSynced] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR' | 'CONNECTING'>('CONNECTING');

  // Monitor hardware connection strictly
  useEffect(() => {
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  // Monitor Supabase Realtime Channel
  useEffect(() => {
    const channel = api.channel('system-status')
      .subscribe((status) => {
        setRealtimeStatus(status as any);
      });
    
    return () => {
      api.removeChannel(channel);
    };
  }, []);

  // Show "Synced" briefly ONLY after a real fetch finishes
  useEffect(() => {
    if (isFetchingCount === 0 && isOnline) {
      setShowSynced(true);
      const timer = setTimeout(() => setShowSynced(false), 2500);
      return () => clearTimeout(timer);
    } else if (isFetchingCount > 0) {
      setShowSynced(false);
    }
  }, [isFetchingCount, isOnline]);

  const conn = (navigator as any).connection;
  const realSpeed = conn?.downlink;
  const realPing = conn?.rtt;

  const isRealtimeConnected = realtimeStatus === 'SUBSCRIBED';

  // If everything is idle, hide the UI to save resources
  if (isOnline && isFetchingCount === 0 && !showSynced && isRealtimeConnected) return null;

  return (
    <div className="fixed bottom-10 left-1/2 z-[10000] px-4 w-full max-w-md animate-slide-up-center">
       <div className={`
         relative overflow-hidden rounded-[2.5rem] p-6 shadow-2xl border-2 backdrop-blur-xl transition-all duration-300
         ${!isOnline || !isRealtimeConnected ? 'bg-red-600/95 border-red-400 shadow-red-500/20' : 
           isFetchingCount > 0 ? 'bg-white/95 border-blue-500 shadow-blue-500/20' : 
           'bg-blue-600/95 border-blue-400 shadow-blue-500/20'}
       `}>
          
          <div className="relative z-10 flex items-center gap-6">
             <div className={`
               w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0
               ${!isOnline || !isRealtimeConnected ? 'bg-white text-red-600' : 
                 isFetchingCount > 0 ? 'bg-blue-50 text-blue-600 animate-spin-slow border-2 border-blue-500' : 
                 'bg-white text-blue-600'}
             `}>
                {!isOnline ? (
                  <WifiOff className="w-8 h-8" />
                ) : !isRealtimeConnected ? (
                  <Globe className="w-8 h-8 animate-pulse" />
                ) : isFetchingCount > 0 ? (
                  <RefreshCw className="w-8 h-8" />
                ) : (
                  <ShieldCheck className="w-8 h-8" />
                )}
             </div>

             <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                   <h4 className={`text-base font-black uppercase tracking-tighter ${!isOnline || !isRealtimeConnected || !isFetchingCount && showSynced ? 'text-white' : 'text-slate-900'}`}>
                      {!isOnline ? 'Luar Talian' : !isRealtimeConnected ? 'Menyambung...' : isFetchingCount > 0 ? 'Menyelaraskan' : 'Terkini'}
                   </h4>
                   {isFetchingCount > 0 && (
                      <span className="bg-blue-100 text-blue-700 text-[9px] font-black px-2 py-0.5 rounded-full border border-blue-200 uppercase">
                         {isFetchingCount} Modul
                      </span>
                   )}
                </div>
                <p className={`text-xs font-bold leading-tight ${!isOnline || !isRealtimeConnected || !isFetchingCount && showSynced ? 'text-white/80' : 'text-slate-500'}`}>
                   {!isOnline ? 'Sambungan terputus. Guna data lokal.' : 
                    !isRealtimeConnected ? 'Membuka saluran data masa nyata...' :
                    isFetchingCount > 0 ? 'Mengambil data terbaru dari awan...' : 
                    'Pangkalan data tempatan telah dikemaskini.'}
                </p>
             </div>

             {isOnline && (realSpeed !== undefined || realPing !== undefined) && (
               <div className="flex flex-col items-end gap-1 shrink-0">
                  {realPing !== undefined && (
                    <div className={`flex items-center gap-1 font-mono font-black text-[9px]
                      ${isFetchingCount > 0 ? 'text-slate-400' : (isRealtimeConnected ? 'text-white/60' : 'text-white')}`}>
                       <Zap className="w-3 h-3" /> {realPing}ms
                    </div>
                  )}
                  {realSpeed !== undefined && (
                    <div className={`text-[11px] font-black tracking-tighter
                      ${isFetchingCount > 0 ? 'text-blue-600' : 'text-white'}`}>
                       {realSpeed} <span className="text-[8px] opacity-70">Mbps</span>
                    </div>
                  )}
               </div>
             )}
          </div>
       </div>
    </div>
  );
};
