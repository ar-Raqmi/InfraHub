import React from 'react';
import { apiService } from '../services/apiService';
import { PageUrl } from './appUrl';

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = apiService.getCurrentUser();
  if (!user) {
    if (typeof window !== 'undefined') window.location.replace(PageUrl.login);
    return null;
  }
  return <>{children}</>;
};
