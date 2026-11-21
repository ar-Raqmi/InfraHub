import React from 'react';
import { mountPage } from '../lib/mountPage';
import AppShell from '../components/AppShell';
import KontrakPage from '../pages/kontrak/KontrakPage';

const Page: React.FC = () => (
  <AppShell currentPage="kontrak">
    <KontrakPage />
  </AppShell>
);

mountPage(Page);
