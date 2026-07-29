import React, { useState } from 'react';
import { useSelectedYear } from '../lib/useSelectedYear';
import { mountPage } from '../lib/mountPage';
import AppShell from '../components/AppShell';
import Profile from '../pages/Profile';
import { apiService } from '../services/apiService';

const ProfilePage: React.FC = () => {
  const [selectedYear] = useSelectedYear();
  const [user, setUser] = useState(() => apiService.getCurrentUser()!);
  const refreshUser = () => setUser({ ...(apiService.getCurrentUser()!) });

  return (
    <AppShell currentPage="profile" selectedYear={selectedYear} showYearSelector={false}>
      <Profile user={user} onUserUpdate={refreshUser} />
    </AppShell>
  );
};

mountPage(ProfilePage);
