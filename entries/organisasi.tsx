import React from 'react';
import { mountPage } from '../lib/mountPage';
import AppShell from '../components/AppShell';
import OrganisasiPage from '../pages/organisasi/OrganisasiPage';

const Page: React.FC = () => (
  <AppShell currentPage="organisasi">
    <OrganisasiPage />
  </AppShell>
);

mountPage(Page);
