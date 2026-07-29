import React, { useMemo } from 'react';
import { useSelectedYear } from '../lib/useSelectedYear';
import { mountPage } from '../lib/mountPage';
import AppShell from '../components/AppShell';
import ImageReportGenerator from '../pages/ImageReportGenerator';
import { useProjects } from '../hooks/useProjects';
import { apiService } from '../services/apiService';

const ReportPage: React.FC = () => {
  const [selectedYear, setSelectedYear] = useSelectedYear();
  const { projects } = useProjects();
  const user = apiService.getCurrentUser()!;

  const filteredProjects = useMemo(() => projects.filter(p => {
    if (!p.tarikhBuka) return false;
    return new Date(p.tarikhBuka).getFullYear() === selectedYear;
  }), [projects, selectedYear]);

  return (
    <AppShell currentPage="report" selectedYear={selectedYear} onYearChange={setSelectedYear}>
      <ImageReportGenerator projects={filteredProjects} user={user} />
    </AppShell>
  );
};

mountPage(ReportPage);
