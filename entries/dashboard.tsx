import React, { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '../lib/createQueryClient';
import { RequireAuth } from '../lib/RequireAuth';
import { useSelectedYear } from '../lib/useSelectedYear';
import { PageUrl, pageHref } from '../lib/appUrl';
import AppShell from '../components/AppShell';
import Dashboard from '../pages/Dashboard';
import { useProjects } from '../hooks/useProjects';
import { apiService } from '../services/apiService';
import { Project } from '../types';

const DashboardPage: React.FC = () => {
  const [selectedYear, setSelectedYear] = useSelectedYear();
  const { projects, updateProjectAsync } = useProjects();
  const user = apiService.getCurrentUser()!;

  const filteredProjects = useMemo(() => projects.filter(p => {
    if (!p.tarikhBuka) return false;
    return new Date(p.tarikhBuka).getFullYear() === selectedYear;
  }), [projects, selectedYear]);

  return (
    <AppShell currentPage="dashboard" selectedYear={selectedYear} onYearChange={setSelectedYear}>
      <Dashboard
        projects={filteredProjects}
        user={user}
        onProjectClick={(p: Project) => { window.location.href = PageUrl.project(p.id, selectedYear); }}
        onNewProject={() => { window.location.href = PageUrl.project(0, selectedYear); }}
        onNavigate={(page: string) => { window.location.href = pageHref(page, selectedYear); }}
        onProfileClick={() => { window.location.href = PageUrl.profile; }}
        onUpdateProject={async (params) => updateProjectAsync(params)}
      />
    </AppShell>
  );
};

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <QueryClientProvider client={createQueryClient()}>
      <RequireAuth>
        <DashboardPage />
      </RequireAuth>
    </QueryClientProvider>
  );
}
