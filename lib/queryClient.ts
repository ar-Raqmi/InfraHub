import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

// 1. Create the QueryClient with "Low Internet" settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 10 seconds
      // This ensures that when a user opens a page, it will almost always 
      // trigger a background sync if they haven't been there recently,
      // while preventing "hammering" the network during rapid navigation.
      staleTime: 1000 * 10, 
      
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
  key: 'ELECTRICHUB_OFFLINE_CACHE_V2',
});
