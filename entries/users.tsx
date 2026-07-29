import React, { useState } from 'react';
import { useSelectedYear } from '../lib/useSelectedYear';
import { mountPage } from '../lib/mountPage';
import AppShell from '../components/AppShell';
import Users from '../pages/Users';
import { apiService } from '../services/apiService';

const UsersPage: React.FC = () => {
  const [selectedYear] = useSelectedYear();
  const [user, setUser] = useState(() => apiService.getCurrentUser()!);
  const refreshUser = () => setUser({ ...(apiService.getCurrentUser()!) });

  return (
    <AppShell currentPage="users" selectedYear={selectedYear} showYearSelector={false}>
      <Users currentUser={user} onUserUpdate={refreshUser} />
    </AppShell>
  );
};

mountPage(UsersPage);
