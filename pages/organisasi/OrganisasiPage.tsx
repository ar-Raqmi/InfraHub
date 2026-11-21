import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Lock } from 'lucide-react';
import { Button, EmptyState, SectionHeader, Tabs } from '../../components/ui';
import { useOrgConfig } from '../../hooks/useOrgConfig';
import { apiService } from '../../services/apiService';
import { PageUrl } from '../../lib/appUrl';
import { Role } from '../../types';
import { useOrgDocs } from '../../components/org/orgDocs';
import { CONFIG_KEYS } from '../../components/org/orgDefaults';
import ProfileSection from '../../components/org/ProfileSection';
import LogoSection from '../../components/org/LogoSection';
import TextsSection from '../../components/org/TextsSection';
import ListsSection from '../../components/org/ListsSection';
import PoliciesSection from '../../components/org/PoliciesSection';

const TABS = [
  { id: 'profil', label: 'Profil' },
  { id: 'logo', label: 'Logo' },
  { id: 'teks', label: 'Teks dokumen' },
  { id: 'senarai', label: 'Senarai' },
  { id: 'peraturan', label: 'Peraturan' },
];

const tabFromHash = () => {
  const id = window.location.hash.replace('#', '');
  return TABS.some((t) => t.id === id) ? id : 'profil';
};

/** Shown to anyone who is not an admin: the page names who can change these settings. */
const NoAccess: React.FC = () => (
  <EmptyState icon={Lock} title="Akses terhad" className="mt-10"
    body="Tetapan Organisasi hanya boleh dibuka oleh pentadbir (ADMIN), kerana ia mengubah teks dan kadar pada setiap dokumen rasmi."
    action={<Button variant="outline" onClick={() => window.location.assign(PageUrl.dashboard())}>Kembali ke Dashboard</Button>} />
);

const OrganisasiPage: React.FC = () => {
  const isAdmin = apiService.getCurrentUser()?.role === Role.ADMIN;
  const [tab, setTab] = useState(tabFromHash);
  const { docs, ready } = useOrgDocs();
  const { policies, setConfig, addPolicy, saveLookups } = useOrgConfig();
  const queryClient = useQueryClient();
  // Every save writes a change_log row on the server; refresh the per-section history after it.
  const logged = <T,>(p: Promise<T>) => p.then((r) => { void queryClient.invalidateQueries({ queryKey: ['changelog'] }); return r; });

  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // On a phone the tab track scrolls sideways: keep the chosen tab in view.
  useEffect(() => {
    document.querySelector('[role=tab][aria-selected=true]')?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  }, [tab]);

  if (!isAdmin) return <div data-testid="org-no-access"><NoAccess /></div>;

  const choose = (id: string) => {
    setTab(id);
    window.history.replaceState(null, '', `#${id}`);
  };
  const putConfig = (key: string, value: unknown) => logged(setConfig.mutateAsync({ key, value }));

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:pt-4" data-testid="org-page">
      <SectionHeader level="page" eyebrow="Tetapan" title="Tetapan Organisasi"
        description="Nama, logo, teks dokumen, senarai pilihan dan kadar yang dicetak oleh InfraHub. Setiap simpanan direkod dengan nama dan masa, jadi sistem ini boleh diserahkan kepada sesiapa atau dipakai oleh PBT lain." />
      <Tabs label="Bahagian tetapan" value={tab} onChange={choose} items={TABS} className="sticky top-14 md:top-0 z-10 bg-paper py-2" />
      {!ready ? <p className="text-muted">Memuat tetapan…</p> : (
        <>
          {tab === 'profil' && <ProfileSection profile={docs.profile} logoSrc={docs.logo?.src ?? null} onSave={(v) => putConfig(CONFIG_KEYS.profile, v)} />}
          {tab === 'logo' && <LogoSection profile={docs.profile} logo={docs.logo} onSave={(v) => putConfig(CONFIG_KEYS.logo, v)} />}
          {tab === 'teks' && <TextsSection org={docs} onSave={putConfig} />}
          {tab === 'senarai' && <ListsSection onSave={(list, values) => logged(saveLookups.mutateAsync({ list, values }))} />}
          {tab === 'peraturan' && <PoliciesSection org={docs} policies={policies} onAdd={(rule) => logged(addPolicy.mutateAsync(rule))} />}
        </>
      )}
    </div>
  );
};

export default OrganisasiPage;
