import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, ArrowRight, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Project, ProjectStatus, User, Role, BulletinItem } from '../types';
import { useBulletins } from '../hooks/useBulletins';
import { useUsers } from '../hooks/useUsers';
import { useContracts } from '../hooks/useContracts';
import { getQueryNumber } from '../lib/appUrl';
import { Button, Card, ContractChip, IconButton, SectionHeader } from '../components/ui';
import PipelineStrip, { PipelineHint } from '../components/dash/PipelineStrip';
import ActionList from '../components/dash/ActionList';
import NextUpCard, { nextItem } from '../components/dash/NextUpCard';
import ActiveProjectsTable from '../components/dash/ActiveProjectsTable';
import BulletinCard from '../components/dash/BulletinCard';
import BulletinComposer, { authorLabel } from '../components/dash/BulletinComposer';
import { BulletinDetail, BulletinDeleteDialog } from '../components/dash/BulletinDialogs';
import ProjectCard from '../components/dash/ProjectCard';
import MobilePager from '../components/dash/MobilePager';
import MobileBulletins from '../components/dash/MobileBulletins';
import EmptyProjects from '../components/dash/EmptyProjects';
import { useInView } from '../components/dash/useInView';
import { buildWorklist, medianPaperworkDays, paperworkWait, pendingNotice, statusCounts } from '../components/dash/worklist';

interface DashboardProps {
  projects: Project[];
  user: User;
  onProjectClick: (project: Project) => void;
  onNewProject: () => void;
  onNavigate: (page: string) => void;
  onProfileClick: () => void;
  onUpdateProject: (params: { id: number; updates: Partial<Project> }) => Promise<any>;
}

const ITEMS_PER_PAGE = 5;
const TZ = 'Asia/Kuala_Lumpur';

const greeting = () => {
  const h = Number(new Date().toLocaleString('en-GB', { hour: '2-digit', hour12: false, timeZone: TZ }));
  return h < 12 ? 'Selamat pagi' : h < 14 ? 'Selamat tengah hari' : h < 19 ? 'Selamat petang' : 'Selamat malam';
};

const todayLabel = () => new Date().toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ });

const matchesSearch = (p: Project, q: string) =>
  [p.namaProjek, p.noFail, p.noAduan, p.namaSyarikat].some(v => (v || '').toLowerCase().includes(q));

const byNewest = (a: Project, b: Project) => new Date(b.tarikhBuka).getTime() - new Date(a.tarikhBuka).getTime();

const Dashboard: React.FC<DashboardProps> = ({ projects, user, onProjectClick, onNewProject, onNavigate, onProfileClick, onUpdateProject }) => {
  const { bulletins, addBulletin, deleteBulletin, markAsRead, toggleReaction } = useBulletins();
  const { users: allUsers } = useUsers();
  const { contracts, activeContract } = useContracts();

  const [isAddingBulletin, setIsAddingBulletin] = useState(false);
  const [selectedBulletin, setSelectedBulletin] = useState<BulletinItem | null>(null);
  const [bulletinToDelete, setBulletinToDelete] = useState<BulletinItem | null>(null);
  const [pjaFilter, setPjaFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'ALL'>('ALL');
  const [tablePage, setTablePage] = useState(1);

  const isManagement = user.role === Role.ADMIN || user.role === Role.JURUTERA;
  const isPja = user.role === Role.PJA;
  const year = getQueryNumber('year') ?? new Date().getFullYear();
  const allPjas = useMemo(() => allUsers.filter(u => u.role === Role.PJA), [allUsers]);
  const contractsById = useMemo(() => new Map(contracts.map(c => [c.id, c])), [contracts]);

  useEffect(() => { setTablePage(1); }, [pjaFilter, searchQuery, statusFilter]);

  // A PJA only ever sees their own projects here; management can narrow to one PJA.
  const displayProjects = useMemo(() => {
    if (isPja) return projects.filter(p => p.pjaId === user.id);
    if (pjaFilter !== 'ALL') return projects.filter(p => p.pjaId === Number(pjaFilter));
    return projects;
  }, [projects, user, isPja, pjaFilter]);

  const counts = useMemo(() => statusCounts(displayProjects), [displayProjects]);
  const worklist = useMemo(() => buildWorklist(displayProjects, contracts), [displayProjects, contracts]);
  const medianDays = useMemo(() => medianPaperworkDays(projects), [projects]);
  const actionCount = worklist.reprice.length + worklist.notices.length + worklist.paperwork.length;
  const next = nextItem(worklist);

  const hints = useMemo(() => {
    const out: Partial<Record<ProjectStatus, PipelineHint>> = {};
    const add = (s: ProjectStatus, n: number, text: string) => { if (n > 0) out[s] = { text: `${n} ${text}`, tone: 'amber' }; };
    for (const s of [ProjectStatus.FASA_DRAF, ProjectStatus.MENUNGGU_LANTIKAN]) {
      add(s, worklist.reprice.filter(i => i.project.status === s).length, 'perlu harga semula');
    }
    const stage = (k: 'TUNTUTAN' | 'KEWANGAN') => displayProjects.filter(p => paperworkWait(p)?.stage === k).length;
    add(ProjectStatus.PEMERIKSAAN_TAPAK, stage('TUNTUTAN'), 'siap, belum dituntut');
    add(ProjectStatus.TUNTUTAN_BAYARAN, stage('KEWANGAN'), 'belum ke Kewangan');
    return out;
  }, [worklist, displayProjects]);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return displayProjects
      .filter(p => matchesSearch(p, q) && (statusFilter === 'ALL' ? p.status !== ProjectStatus.SIAP : p.status === statusFilter))
      .sort(byNewest);
  }, [displayProjects, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const pageRows = filteredProjects.slice((tablePage - 1) * ITEMS_PER_PAGE, tablePage * ITEMS_PER_PAGE);
  const pageFrom = Math.min(filteredProjects.length, (tablePage - 1) * ITEMS_PER_PAGE + 1);
  const pageTo = Math.min(filteredProjects.length, tablePage * ITEMS_PER_PAGE);
  const showPja = isManagement && pjaFilter === 'ALL';
  const pjaName = (p: Project) => allUsers.find(u => u.id === p.pjaId)?.username.toUpperCase();
  const bulletinAuthor = (item: BulletinItem) => allUsers.find(u => authorLabel(u) === item.author);
  const clearFilters = () => { setSearchQuery(''); setStatusFilter('ALL'); };

  const projectListRef = useRef<HTMLDivElement>(null);
  const isProjectListInView = useInView(projectListRef);

  const publishBulletin = async (html: string) => {
    try {
      await addBulletin({ content: html, author: authorLabel(user) });
      setIsAddingBulletin(false);
    } catch (err) {
      console.error('Failed to add bulletin:', err);
    }
  };

  const confirmDeleteBulletin = async () => {
    if (!bulletinToDelete) return;
    try {
      await deleteBulletin(bulletinToDelete.id);
      setBulletinToDelete(null);
    } catch (err) {
      console.error('Failed to delete bulletin:', err);
    }
  };

  const openBulletin = async (item: BulletinItem) => {
    setSelectedBulletin(item);
    if (item.readBy?.includes(user.id)) return;
    try {
      await markAsRead({ id: item.id, userId: user.id });
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const commitProgress = async (project: Project, raw: string) => {
    const progress = Math.min(100, Math.max(0, parseInt(raw) || 0));
    if (progress === project.peratusSiap) return;
    try {
      await onUpdateProject({ id: project.id, updates: { peratusSiap: progress } });
    } catch (error) {
      console.error('Failed to update progress', error);
    }
  };

  const scopeText = isPja
    ? 'Projek anda sahaja'
    : pjaFilter === 'ALL' ? 'Paparan keseluruhan jabatan' : `Projek seliaan PJA ${allPjas.find(p => p.id === Number(pjaFilter))?.username.toUpperCase()}`;
  const displayName = (user.username || 'Pengguna').toUpperCase();

  const pjaSelect = isManagement && (
    <label className="relative block md:w-64">
      <span className="sr-only">Tapis mengikut PJA</span>
      <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" aria-hidden />
      <select
        value={pjaFilter}
        onChange={(e) => setPjaFilter(e.target.value)}
        className="w-full min-h-11 pl-10 pr-4 bg-surface border border-line-strong rounded-ih-md text-base md:text-[15px] font-bold text-ink appearance-none cursor-pointer focus:outline-none focus:border-emerald"
      >
        <option value="ALL">Semua PJA</option>
        {allPjas.map(p => <option key={p.id} value={p.id}>PJA: {p.username.toUpperCase()}</option>)}
      </select>
    </label>
  );

  return (
    <div className="w-full space-y-6 md:space-y-8 pb-24 md:pb-20 animate-fade-in" data-testid="dashboard">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="ih-eyebrow text-emerald-deep flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-bright" aria-hidden />
            <span className="md:hidden">Hari ini</span><span className="hidden md:inline">Pusat kawalan</span> · Tahun {year}
          </p>
          <h1 className="md:hidden font-display text-display-l text-ink mt-1 [overflow-wrap:anywhere]">{greeting()}, {displayName}.</h1>
          <h1 className="hidden md:block font-display text-display-xl text-ink mt-1">{todayLabel()}</h1>
          <p className="text-muted mt-1">
            <span className="md:hidden">{todayLabel()} · </span>{scopeText} · <span className="ih-num">{displayProjects.length}</span> projek
            {actionCount > 0 && <> · <span className="font-bold text-amber ih-num">{actionCount}</span> perlu tindakan</>}
          </p>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {pjaSelect}
          <button type="button" onClick={onProfileClick} className="hidden md:flex items-center gap-2.5 min-h-11 pl-1.5 pr-3 bg-surface border border-line rounded-ih-md hover:border-ink">
            <span className="w-8 h-8 rounded-ih-sm bg-ink text-paper text-xs font-bold inline-flex items-center justify-center overflow-hidden">
              {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : (user.username || '??').substring(0, 2).toUpperCase()}
            </span>
            <span className="text-left leading-tight">
              <span className="block text-sm font-bold text-ink max-w-[160px] truncate">{user.fullName}</span>
              <span className="block text-xs text-muted">{user.role}</span>
            </span>
          </button>
          <Button variant="primary" icon={Plus} onClick={onNewProject} className="hidden md:inline-flex">Projek baharu</Button>
        </div>
      </header>

      {next && <div className="md:hidden"><NextUpCard item={next} onOpen={onProjectClick} /></div>}

      <section aria-labelledby="aliran-projek" className="space-y-3">
        <SectionHeader
          title="Aliran projek"
          description={`Tahun ${year} · tekan satu status untuk menapis senarai projek di bawah.`}
          actions={statusFilter !== 'ALL' && <Button variant="ghost" size="sm" onClick={() => setStatusFilter('ALL')}>Tunjuk semua projek aktif</Button>}
        />
        <PipelineStrip counts={counts} hints={hints} active={statusFilter} onToggle={(s) => setStatusFilter(statusFilter === s ? 'ALL' : s)} />
      </section>

      {isAddingBulletin && <BulletinComposer user={user} onCancel={() => setIsAddingBulletin(false)} onPublish={publishBulletin} />}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] items-start">
        <ActionList worklist={worklist} medianPaperworkDays={medianDays} onOpen={onProjectClick} pjaName={showPja ? pjaName : undefined} />

        <aside className="space-y-4 min-w-0">
          {activeContract && (
            <Card className="hidden md:block" data-testid="kontrak-aktif">
              <p className="ih-eyebrow text-muted mb-2">Sebutharga aktif</p>
              <ContractChip
                size="lg"
                code={activeContract.code}
                status={activeContract.status}
                book={activeContract.stats?.currentVersion ? `buku kadar v${activeContract.stats.currentVersion}` : undefined}
                meta={`Panel ${activeContract.stats?.panelSize ?? 0} syarikat · ${activeContract.stats?.projects ?? 0} projek`}
              />
            </Card>
          )}
          <section aria-labelledby="buletin" className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 id="buletin" className="font-display text-title text-ink">Buletin</h2>
              {isManagement && !isAddingBulletin && (
                <Button variant="outline" size="sm" icon={Plus} onClick={() => setIsAddingBulletin(true)}>Tambah buletin</Button>
              )}
            </div>
            {bulletins.length > 0 ? (
              <>
                <MobileBulletins bulletins={bulletins.slice(0, 3)} userId={user.id} isAdmin={isManagement} onRead={openBulletin} onDelete={setBulletinToDelete} />
                <div className="hidden md:flex flex-col gap-3">
                  {bulletins.slice(0, 3).map(item => (
                    <BulletinCard
                      key={item.id}
                      item={item}
                      author={bulletinAuthor(item)}
                      userId={user.id}
                      isAdmin={isManagement}
                      onRead={() => openBulletin(item)}
                      onDelete={() => setBulletinToDelete(item)}
                      onToggleReaction={(emoji) => toggleReaction({ id: item.id, userId: user.id, emoji })}
                    />
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted bg-paper border border-dashed border-line-strong rounded-ih-lg p-5 text-center">Tiada buletin terkini.</p>
            )}
          </section>
        </aside>
      </div>

      <section ref={projectListRef} aria-labelledby="projek-aktif" className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="projek-aktif" className="font-display text-title md:text-display-m font-bold text-ink">
              {statusFilter === 'ALL' ? 'Projek aktif' : `Projek: ${statusFilter.replace(/_/g, ' ')}`}
            </h2>
            <Button variant="ghost" size="sm" icon={ArrowRight} onClick={() => onNavigate('projects')} className="md:hidden">Semua</Button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="relative block w-full md:w-72">
              <span className="sr-only">Cari projek</span>
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" aria-hidden />
              <input
                type="search"
                placeholder="Cari No. Fail / Aduan / Tajuk / Syarikat"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-h-11 pl-11 pr-3 bg-surface border border-line-strong rounded-ih-md text-base md:text-[15px] text-ink placeholder:text-muted-faint focus:outline-none focus:border-emerald"
              />
            </label>
            {filteredProjects.length > ITEMS_PER_PAGE && (
              <div className="hidden md:flex items-center gap-1">
                <IconButton icon={ChevronLeft} label="Halaman sebelum" variant="outline" disabled={tablePage === 1} onClick={() => setTablePage(p => Math.max(1, p - 1))} />
                <span className="text-sm font-bold text-ink min-w-[88px] text-center ih-num">{pageFrom}–{pageTo} / {filteredProjects.length}</span>
                <IconButton icon={ChevronRight} label="Halaman seterusnya" variant="outline" disabled={tablePage === totalPages} onClick={() => setTablePage(p => Math.min(totalPages, p + 1))} />
              </div>
            )}
            <Button variant="outline" icon={ArrowRight} onClick={() => onNavigate('projects')} className="hidden md:inline-flex">Lihat semua</Button>
          </div>
        </div>

        <div className="md:hidden space-y-3">
          {pageRows.length > 0 ? pageRows.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              pjaName={showPja ? pjaName(project) : undefined}
              pendingNotice={pendingNotice(project)}
              contract={contractsById.get(project.contractId ?? '')}
              onOpen={() => onProjectClick(project)}
              onProgressCommit={(value) => commitProgress(project, value)}
            />
          )) : <EmptyProjects onClear={clearFilters} />}
          {filteredProjects.length > 0 && (
            <MobilePager
              page={tablePage}
              totalPages={totalPages}
              from={pageFrom}
              to={pageTo}
              total={filteredProjects.length}
              onPrev={() => setTablePage(p => Math.max(1, p - 1))}
              onNext={() => setTablePage(p => Math.min(totalPages, p + 1))}
            />
          )}
        </div>

        <div className="hidden md:block">
          <ActiveProjectsTable
            rows={pageRows}
            pjaName={showPja ? pjaName : undefined}
            empty={<EmptyProjects onClear={clearFilters} />}
            onOpen={onProjectClick}
            onProgressCommit={commitProgress}
          />
        </div>
      </section>

      {isProjectListInView && (
        <button
          type="button"
          onClick={onNewProject}
          className="md:hidden fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 h-14 px-5 flex items-center gap-2 rounded-full bg-emerald-bright text-ink font-bold border border-emerald active:bg-emerald"
        >
          <Plus className="w-5 h-5" aria-hidden />
          Tambah Projek
        </button>
      )}

      {selectedBulletin && (
        <BulletinDetail
          item={bulletins.find(b => b.id === selectedBulletin.id) ?? selectedBulletin}
          author={bulletinAuthor(selectedBulletin)}
          userId={user.id}
          onClose={() => setSelectedBulletin(null)}
          onToggleReaction={(emoji) => toggleReaction({ id: selectedBulletin.id, userId: user.id, emoji })}
        />
      )}
      {bulletinToDelete && <BulletinDeleteDialog onCancel={() => setBulletinToDelete(null)} onConfirm={confirmDeleteBulletin} />}
    </div>
  );
};

export default Dashboard;
