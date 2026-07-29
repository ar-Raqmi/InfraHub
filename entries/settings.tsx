import React from 'react';
import { useSelectedYear } from '../lib/useSelectedYear';
import { mountPage } from '../lib/mountPage';
import AppShell from '../components/AppShell';
import AdminSettings from '../pages/AdminSettings';
import { apiService } from '../services/apiService';

const SettingsPage: React.FC = () => {
  const [selectedYear, setSelectedYear] = useSelectedYear();
  const user = apiService.getCurrentUser()!;

  return (
    <AppShell currentPage="settings" selectedYear={selectedYear} onYearChange={setSelectedYear}>
      <AdminSettings user={user} selectedYear={selectedYear} />
    </AppShell>
  );
};

mountPage(SettingsPage);
