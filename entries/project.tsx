import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '../lib/createQueryClient';
import { RequireAuth } from '../lib/RequireAuth';
import { useSelectedYear } from '../lib/useSelectedYear';
import { PageUrl, getQueryNumber } from '../lib/appUrl';
import AppShell from '../components/AppShell';
import ProjectDetail from '../pages/ProjectDetail';
import Toast from '../components/Toast';
import { useProjects } from '../hooks/useProjects';
import { apiService } from '../services/apiService';
import { Project } from '../types';

const ProjectPage: React.FC = () => {
  const id = getQueryNumber('id') ?? 0;
  const [selectedYear] = useSelectedYear();
  const { projects } = useProjects();
  const user = apiService.getCurrentUser()!;

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => setToast({ message, type });

  // Seed from the (partial) list project if loaded; ProjectDetail fetches the full
  // record itself via getProjectById and shows its loading overlay until synced.
  const project = id > 0 ? (projects.find(p => p.id === id) ?? ({ id } as Project)) : undefined;

  return (
    <AppShell currentPage="projects" selectedYear={selectedYear} showYearSelector={false}>
      <div className="bg-white/95 border border-white/10 shadow-xl rounded-3xl p-4 md:p-6">
        <ProjectDetail
          key={id || 'new'}
          project={project}
          projects={projects}
          currentUserRole={user.role}
          selectedYear={selectedYear}
          onShowToast={showToast}
          onClose={() => { window.location.href = PageUrl.projects(selectedYear); }}
          onSave={(saved?: Project) => {
            if (saved && id === 0) {
              window.location.replace(PageUrl.project(saved.id, selectedYear));
            } else {
              showToast('Projek berjaya disimpan!', 'success');
            }
          }}
          onSwitchProject={(p: Project) => { window.location.href = PageUrl.project(p.id, selectedYear); }}
        />
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AppShell>
  );
};

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <QueryClientProvider client={createQueryClient()}>
      <RequireAuth>
        <ProjectPage />
      </RequireAuth>
    </QueryClientProvider>
  );
}
