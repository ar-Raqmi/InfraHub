import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

// 1. Create the QueryClient with "Low Internet" settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Show cached data INSTANTLY (0ms delay)
      // But immediately mark it as "stale" so we fetch a fresh copy in the background
      staleTime: 0,
      
      // Keep unused data in memory/storage for 24 hours
      // This means if they open the app tomorrow, it still loads instantly
      gcTime: 1000 * 60 * 60 * 24, 
      
      // Retry failed requests 3 times before showing an error (good for spotty connection)
      retry: 3,
      
      // If the window loses focus and comes back, check for updates
      refetchOnWindowFocus: true, 
      refetchOnReconnect: true,
    },
  },
});

// 2. Setup Local Storage Persistence
export const persister = createSyncStoragePersister({
  storage: window.localStorage,
  // We can add a key prefix to avoid collisions
  key: 'INFRAHUB_OFFLINE_CACHE',
});
