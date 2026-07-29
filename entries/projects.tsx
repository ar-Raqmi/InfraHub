import React, { useMemo } from 'react';
import { useSelectedYear } from '../lib/useSelectedYear';
import { mountPage } from '../lib/mountPage';
import { PageUrl } from '../lib/appUrl';
import AppShell from '../components/AppShell';
import ProjectsList from '../pages/ProjectsList';
import { useProjects } from '../hooks/useProjects';
import { apiService } from '../services/apiService';

const ProjectsPage: React.FC = () => {
  const [selectedYear, setSelectedYear] = useSelectedYear();
  const { projects, deleteProject } = useProjects();
  const user = apiService.getCurrentUser()!;

  const filteredProjects = useMemo(() => projects.filter(p => {
    if (!p.tarikhBuka) return false;
    return new Date(p.tarikhBuka).getFullYear() === selectedYear;
  }), [projects, selectedYear]);

  return (
    <AppShell currentPage="projects" selectedYear={selectedYear} onYearChange={setSelectedYear}>
      <ProjectsList
        projects={filteredProjects}
        selectedYear={selectedYear}
        user={user}
        onAddProject={() => { window.location.href = PageUrl.project(0, selectedYear); }}
        onEditProject={(p) => { window.location.href = PageUrl.project(p.id, selectedYear); }}
        onDeleteProject={(p) => { deleteProject(p.id); }}
      />
    </AppShell>
  );
};

mountPage(ProjectsPage);
