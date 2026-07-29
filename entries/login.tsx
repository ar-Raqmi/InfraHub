import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '../lib/createQueryClient';
import Login from '../pages/Login';
import { apiService } from '../services/apiService';
import { PageUrl } from '../lib/appUrl';
import { navigate, navigateReplace } from '../lib/navigate';

const rootEl = document.getElementById('root');
if (rootEl) {
  if (apiService.getCurrentUser()) {
    navigateReplace(PageUrl.dashboard());
  } else {
    createRoot(rootEl).render(
      <QueryClientProvider client={createQueryClient()}>
        <Login onLogin={() => { navigate(PageUrl.dashboard()); }} />
      </QueryClientProvider>
    );
  }
}
