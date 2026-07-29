import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '../lib/createQueryClient';
import Login from '../pages/Login';
import { apiService } from '../services/apiService';
import { PageUrl } from '../lib/appUrl';

const rootEl = document.getElementById('root');
if (rootEl) {
  if (apiService.getCurrentUser()) {
    window.location.replace(PageUrl.index);
  } else {
    createRoot(rootEl).render(
      <QueryClientProvider client={createQueryClient()}>
        <Login onLogin={() => { window.location.href = PageUrl.index; }} />
      </QueryClientProvider>
    );
  }
}
