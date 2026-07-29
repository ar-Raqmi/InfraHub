import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from './createQueryClient';
import { RequireAuth } from './RequireAuth';

export function mountPage(Page: React.FC) {
  const rootEl = document.getElementById('root');
  if (!rootEl) return;
  createRoot(rootEl).render(
    <QueryClientProvider client={createQueryClient()}>
      <RequireAuth>
        <Page />
      </RequireAuth>
    </QueryClientProvider>
  );
}
