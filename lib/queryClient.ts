import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

// 1. Create the QueryClient with "Low Internet" settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      // This prevents the "blinking" on slow connections because 
      // the app won't immediately try to refetch if it has data.
      staleTime: 1000 * 60 * 5, 
      
      // Keep unused data in memory/storage for 24 hours
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
