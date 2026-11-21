import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Download, FileText, FileUp, Filter, Grid, List, Loader2, Plus, Recycle, RotateCcw, Search } from 'lucide-react';
import { Project, ProjectStatus, User, VoteDefinition, Role, getStatusLabel } from '../types';
import { apiService } from '../services/apiService';
import { useUsers } from '../hooks/useUsers';
import { useProjects } from '../hooks/useProjects';
import { useSettings } from '../hooks/useSettings';
import { useContracts } from '../hooks/useContracts';
import { hargaAkhir } from '../domain/money';
import ImportIndenModal from '../components/ImportIndenModal';
import { ProjectsListPDFExporter } from '../services/pdf';
import type { ReportTitleScope } from '../services/pdf/ProjectsListPDFExporter';
import BottomSheet from '../components/BottomSheet';
import { Button, Card, IconButton, Select } from '../components/ui';
import AddProjectFab from '../components/projects/AddProjectFab';
import CompanyCard, { CompanyGroupData } from '../components/projects/CompanyCard';
import CompanyGroupPanel from '../components/projects/CompanyGroupPanel';
import CapUsage, { useCapOverrides } from '../components/projects/CapUsage';
import FilterPanel, { DEFAULT_ROW_FILTERS, DATE_TYPES, RowFilters } from '../components/projects/FilterPanel';
import MobilePager from '../components/projects/MobilePager';
import MobileToolbar from '../components/projects/MobileToolbar';
import ProjectActionsSheet from '../components/projects/ProjectActionsSheet';
import ProjectCard from '../components/projects/ProjectCard';
import ProjectsTable, { ColumnDef } from '../components/projects/ProjectsTable';
import ReportScopeBar from '../components/projects/ReportScopeBar';
import VoteSummary from '../components/projects/VoteSummary';
import { DeleteProjectDialog, ExportReportDialog } from '../components/projects/ProjectDialogs';
import {
    CostMode, DEFAULT_SCOPE, NO_CONTRACT, ReportScope, allocationYear, capUsage, inScope, periodLabel, scopeLabel, voteSummary, voteTotals,
} from '../components/projects/reportScope';
import { repriceReason } from '../components/dash/worklist';

interface ProjectsListProps {
    projects: Project[];
    selectedYear: number;
    onAddProject: () => void;
    onEditProject: (project: Project) => void;
    onDeleteProject: (project: Project) => void;
    user: User;
}

const COLUMN_DEFS: ColumnDef[] = [
    { id: 'noFail', label: 'No. Fail', group: 'Asas', default: true },
    { id: 'namaProjek', label: 'Nama Projek', group: 'Asas', default: true },
    { id: 'pjaId', label: 'PJA', group: 'Asas', default: true },
    { id: 'noAduan', label: 'Aduan', group: 'Asas', default: true },
    { id: 'lokasi', label: 'Lokasi', group: 'Asas', default: false },
    { id: 'bp', label: 'BP', group: 'Asas', default: false },
    { id: 'zon', label: 'Zon', group: 'Asas', default: false },
    { id: 'mukim', label: 'Mukim', group: 'Asas', default: false },
    { id: 'tarikhBuka', label: 'Tarikh Buka', group: 'Asas', default: false },
    { id: 'namaSyarikat', label: 'Nama Syarikat', group: 'Kontrak', default: true },
    { id: 'kontrak', label: 'Sebutharga', group: 'Kontrak', default: true },
    { id: 'noVote', label: 'No. Vot', group: 'Kontrak', default: false },
    { id: 'noSebutharga', label: 'No. Sebutharga', group: 'Kontrak', default: false },
    { id: 'noInden', label: 'No. Inden', group: 'Kontrak', default: false },
    { id: 'noBpp', label: 'No. BPP', group: 'Kontrak', default: false },
    { id: 'tempohKontrak', label: 'Tempoh', group: 'Kontrak', default: false },
    { id: 'status', label: 'Status & Progress', group: 'Status', default: true },
    { id: 'prestasi', label: 'Prestasi', group: 'Status', default: false },
    { id: 'kosProjek', label: 'Harga Kontrak', group: 'Kewangan', default: false },
    { id: 'kosSebenar', label: 'Harga Akhir', group: 'Kewangan', default: false },
    { id: 'wangTahanan', label: 'Wang Tahanan', group: 'Kewangan', default: false },
    { id: 'ladAmount', label: 'LAD (RM)', group: 'Kewangan', default: false },
    { id: 'ladDays', label: 'Hari LAD', group: 'Kewangan', default: false },
    { id: 'locAmount', label: 'LOC (RM)', group: 'Kewangan', default: false },
    { id: 'locDays', label: 'Hari LOC', group: 'Kewangan', default: false },
    { id: 'tarikhLantikan', label: 'T. Lantikan', group: 'Tarikh', default: false },
    { id: 'tarikhCetakanBpp', label: 'T. BPP', group: 'Tarikh', default: false },
    { id: 'tarikhMulaKontrak', label: 'Mula Kontrak', group: 'Tarikh', default: false },
    { id: 'tarikhTamatKontrak', label: 'Tamat Kontrak', group: 'Tarikh', default: false },
    { id: 'tarikhSerahTapak', label: 'Serah Tapak', group: 'Tarikh', default: false },
    { id: 'tarikhMulaKerja', label: 'Mula Kerja', group: 'Tarikh', default: false },
    { id: 'tarikhSiapSebenar', label: 'Siap Sebenar', group: 'Tarikh', default: false },
    { id: 'tarikhTuntutanBayaran', label: 'T. Tuntutan', group: 'Penutup', default: false },
    { id: 'tarikhHantarKewangan', label: 'Hantar Kewangan', group: 'Penutup', default: false },
    { id: 'tarikhPadanan', label: 'Padanan', group: 'Penutup', default: false },
    { id: 'iso', label: 'ISO', group: 'Penutup', default: false },
];

const DEFAULT_COLUMNS = Object.fromEntries(COLUMN_DEFS.map(c => [c.id, c.default])) as Record<string, boolean>;
const ITEMS_PER_PAGE = 10;

const matchesRow = (p: Project, f: RowFilters, q: string) => {
    const dateVal = ((p[f.dateType as keyof Project] as string | undefined) || '').split('T')[0];
    return [p.noFail, p.namaProjek, p.noAduan, p.namaSyarikat].some(v => (v || '').toLowerCase().includes(q))
        && (f.status === 'ALL' || p.status === f.status)
        && (f.pja === 'ALL' || p.pjaId === Number(f.pja))
        && (f.zon === 'ALL' || (!!p.zon && p.zon.includes(f.zon)))
        && (f.bp === 'ALL' || p.bp === f.bp)
        && (f.mukim === 'ALL' || p.mukim === f.mukim)
        && (f.vote === 'ALL' || p.noVote === f.vote)
        && (!f.dateStart || (!!dateVal && dateVal >= f.dateStart))
        && (!f.dateEnd || (!!dateVal && dateVal <= f.dateEnd));
};

const isEmpty = (v: unknown) => v === undefined || v === null || v === '';
const byOpened = (a: Project, b: Project) => new Date(b.tarikhBuka || 0).getTime() - new Date(a.tarikhBuka || 0).getTime();

/** Same ordering rules as before the re-skin: empties last, natural No. Fail, newest first as tie-break. */
const compareBy = (key: string, dir: 'asc' | 'desc') => (a: Project, b: Project) => {
    const val = (p: Project) => (key === 'kosSebenar' ? hargaAkhir(p) : (p as any)[key]);
    const va = val(a), vb = val(b);
    if (isEmpty(va) || isEmpty(vb)) return isEmpty(va) && isEmpty(vb) ? byOpened(a, b) : isEmpty(va) ? 1 : -1;
    let c = 0;
    if (key === 'noFail') {
        c = String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: 'base' });
        if (c === 0) return byOpened(a, b);
    } else if (typeof va === 'string') c = va.localeCompare(vb);
    else if (typeof va === 'number') c = va - vb;
    return dir === 'asc' ? c : -c;
};

const slug = (s: string) => s.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 60);

const ProjectsList: React.FC<ProjectsListProps> = ({ projects, selectedYear, onAddProject, onEditProject, onDeleteProject, user }) => {
    const { users } = useUsers();
    const { projects: allProjects, updateProject } = useProjects();
    const { contracts } = useContracts();
    const { votes: votesList, companyOrder, manualFinancials: savedManual, companyDetails, updateSettings } = useSettings(selectedYear);

    const canQuickEdit = user.role === Role.ADMIN || user.role === Role.JURUTERA;
    const canImportInden = user.role === Role.ADMIN;
    const pjas = useMemo(() => users.filter(u => u.role === Role.PJA), [users]);
    const contractsById = useMemo(() => new Map(contracts.map(c => [c.id, c])), [contracts]);

    const [scope, setScope] = useState<ReportScope>(DEFAULT_SCOPE);
    const [rowFilters, setRowFilters] = useState<RowFilters>(DEFAULT_ROW_FILTERS);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'group'>('list');
    const [expandedCompanies, setExpandedCompanies] = useState<Record<string, boolean>>({});
    const [costViewMode, setCostViewMode] = useState<CostMode>('contract');
    const [showSiap, setShowSiap] = useState(true);
    const [showTuntutan, setShowTuntutan] = useState(true);
    const [manual, setManual] = useState(savedManual);
    const [isSavingFinancials, setIsSavingFinancials] = useState(false);
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
    const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(DEFAULT_COLUMNS);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [deleteCountdown, setDeleteCountdown] = useState(0);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportBilMesyuarat, setExportBilMesyuarat] = useState('');
    const [isImportIndenOpen, setIsImportIndenOpen] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageInput, setPageInput] = useState('1');
    const [sortKey, setSortKey] = useState('tarikhBuka');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    useEffect(() => { setManual(savedManual); }, [savedManual]);

    // Long press (500 ms) lets a user select text in a row without opening the project.
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const isLongPress = useRef(false);
    const rowMouse = {
        onMouseDown: () => { isLongPress.current = false; longPressTimer.current = setTimeout(() => { isLongPress.current = true; }, 500); },
        onMouseUp: () => clearTimeout(longPressTimer.current),
        onMouseLeave: () => clearTimeout(longPressTimer.current),
    };
    const openProject = (p: Project) => { if (!isLongPress.current) onEditProject(p); };

    // ---- report scope: the single source of every total on this page ----
    const scopeProjects = useMemo(() => allProjects.filter(p => inScope(p, scope, selectedYear)), [allProjects, scope, selectedYear]);
    const scopeText = scopeLabel(scope, selectedYear, contractsById);
    const allocYear = allocationYear(scope.period, selectedYear);
    const otherYear = allocYear !== null && allocYear !== selectedYear ? allocYear : null;
    const { data: otherSettings } = useQuery<any>({ queryKey: ['settings', otherYear], queryFn: () => apiService.getSettings(otherYear!), enabled: otherYear !== null });
    const scopeVotes: VoteDefinition[] | null = allocYear === null ? null : otherYear ? (otherSettings?.vote_numbers ?? []) : votesList;
    const summary = useMemo(() => voteSummary(scopeProjects, scopeVotes, costViewMode, hargaAkhir), [scopeProjects, scopeVotes, costViewMode]);
    const totals = voteTotals(summary);
    const hasUnbound = allProjects.some(p => !p.contractId);
    // A closed sebutharga with no projects can never change a total, so it is left out of the picker.
    const scopeContracts = contracts.filter(c => c.status !== 'DITUTUP' || (c.stats?.projects ?? 0) > 0 || scope.contractIds.includes(c.id));

    // ---- on-screen row filters: they narrow the list, never the totals ----
    const filteredProjects = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return scopeProjects.filter(p => matchesRow(p, rowFilters, q)).sort(compareBy(sortKey, sortDirection));
    }, [scopeProjects, rowFilters, searchTerm, sortKey, sortDirection]);

    const rowFilterParts = [
        searchTerm && `carian "${searchTerm}"`,
        rowFilters.status !== 'ALL' && `status ${getStatusLabel(rowFilters.status)}`,
        rowFilters.pja !== 'ALL' && `PJA ${pjas.find(u => u.id === Number(rowFilters.pja))?.username.toUpperCase() ?? ''}`,
        rowFilters.zon !== 'ALL' && `zon ${rowFilters.zon}`,
        rowFilters.bp !== 'ALL' && `BP ${rowFilters.bp}`,
        rowFilters.mukim !== 'ALL' && `mukim ${rowFilters.mukim}`,
        rowFilters.vote !== 'ALL' && `vot ${rowFilters.vote}`,
        (rowFilters.dateStart || rowFilters.dateEnd) && `${DATE_TYPES.find(([k]) => k === rowFilters.dateType)?.[1]} ${rowFilters.dateStart ?? '…'} – ${rowFilters.dateEnd ?? '…'}`,
        viewMode === 'group' && !showSiap && 'tanpa projek siap',
        viewMode === 'group' && !showTuntutan && 'tanpa tuntutan bayaran',
    ].filter(Boolean) as string[];
    const rowFilterText = rowFilterParts.length ? rowFilterParts.join(', ') : null;
    const scopeChanged = scope.contractIds.length > 0 || scope.period.kind !== 'YEAR';
    const activeFilterCount = rowFilterParts.filter(p => !p.startsWith('carian')).length + (scopeChanged ? 1 : 0);

    useEffect(() => { setCurrentPage(1); setPageInput('1'); }, [filteredProjects.length]);
    const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
    const pageRows = filteredProjects.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const goToPage = (page: number) => { const p = Math.max(1, Math.min(page, totalPages)); setCurrentPage(p); setPageInput(String(p)); };
    const commitPageInput = () => { const p = parseInt(pageInput); goToPage(isNaN(p) ? 1 : p); };

    const groupedProjects = useMemo(() => {
        const names = new Set(companyOrder);
        filteredProjects.forEach(p => { if (p.namaSyarikat) names.add(p.namaSyarikat); });
        const rank = (n: string) => { const i = companyOrder.indexOf(n); return i === -1 ? Number.MAX_SAFE_INTEGER : i; };
        return Array.from(names).sort((a, b) => rank(a) - rank(b) || a.localeCompare(b)).map(company => {
            const list = filteredProjects.filter(p => p.namaSyarikat === company
                && (showSiap || p.status !== ProjectStatus.SIAP) && (showTuntutan || p.status !== ProjectStatus.TUNTUTAN_BAYARAN));
            const group: CompanyGroupData = { company, projects: list, totalCost: 0, totalHargaAkhir: 0, count: list.length, projectsByVote: {} };
            for (const p of list) {
                const contractVal = p.kosProjek || 0, akhir = hargaAkhir(p), vote = p.noVote || 'TIADA VOT';
                group.totalCost += contractVal; group.totalHargaAkhir += akhir;
                group.projectsByVote[vote] ??= { projects: [], subtotalContract: 0, subtotalAkhir: 0 };
                group.projectsByVote[vote].projects.push(p);
                group.projectsByVote[vote].subtotalContract += contractVal;
                group.projectsByVote[vote].subtotalAkhir += akhir;
            }
            return group;
        });
    }, [filteredProjects, companyOrder, showSiap, showTuntutan]);

    // ---- company cap per contract (warn only) ----
    const capContractIds = useMemo(() => {
        const ids = scope.contractIds.length ? scope.contractIds : Array.from(new Set(scopeProjects.map(p => p.contractId || NO_CONTRACT)));
        return ids.filter(id => id !== NO_CONTRACT && contractsById.has(id)).sort();
    }, [scope.contractIds, scopeProjects, contractsById]);
    const capOverrides = useCapOverrides(capContractIds);
    const capContracts = capContractIds.map(id => contractsById.get(id)!).filter(Boolean);
    const capSlot = (company: string) => <CapUsage lines={capUsage(company, allProjects, capContracts, capOverrides)} />;

    const getPjaUser = (id: number) => users.find(u => u.id === id);
    const getVoteName = (code: string) => (scopeVotes ?? votesList).find((v: VoteDefinition) => v.code === code)?.name ?? code;
    const contractOf = (p: Project) => contractsById.get(p.contractId ?? '');
    const repriceOf = (p: Project) => (contracts.length ? repriceReason(p, contractsById) : null);

    useEffect(() => {
        if (!projectToDelete) return;
        setDeleteCountdown(5);
        const timer = setInterval(() => setDeleteCountdown(prev => { if (prev <= 1) { clearInterval(timer); return 0; } return prev - 1; }), 1000);
        return () => clearInterval(timer);
    }, [projectToDelete]);

    const resetAll = () => {
        setScope(DEFAULT_SCOPE); setRowFilters(DEFAULT_ROW_FILTERS); setSearchTerm('');
        setShowSiap(true); setShowTuntutan(true); setSortKey('tarikhBuka'); setSortDirection('desc'); setVisibleColumns(DEFAULT_COLUMNS);
    };

    const titleScope = (): ReportTitleScope => ({
        period: (scope.period.kind === 'YEAR' ? `TAHUN ${selectedYear}` : periodLabel(scope.period, selectedYear)).toUpperCase(),
        label: scopeText,
        rowFilters: rowFilterText,
        fileTag: slug(scopeText),
    });

    const saveManualFinancials = async () => {
        setIsSavingFinancials(true);
        try { await updateSettings({ manual_financials: manual }); } catch (err) { console.error('Failed to save financials:', err); } finally { setIsSavingFinancials(false); }
    };

    const runPdf = async (job: () => Promise<void>, fallback: string) => {
        setIsGeneratingPdf(true); setGenerationProgress(10);
        try { await job(); } catch (e) { console.error('PDF error', e); alert(fallback); } finally { setIsGeneratingPdf(false); setGenerationProgress(0); }
    };

    const exportRotasi = () => runPdf(
        () => ProjectsListPDFExporter.exportRotasi(titleScope(), companyOrder, scopeProjects, companyDetails, setGenerationProgress),
        'Gagal menjana PDF Rotasi.',
    );

    const exportSenarai = () => {
        if (!exportBilMesyuarat) { alert('Sila masukkan Bil. Mesyuarat.'); return; }
        return runPdf(async () => {
            await ProjectsListPDFExporter.exportSenarai(titleScope(), groupedProjects, exportBilMesyuarat, summary,
                allocYear === selectedYear ? manual : null, getPjaUser, getStatusLabel, getVoteName, setGenerationProgress);
            setIsExportModalOpen(false);
        }, 'Gagal menjana PDF.');
    };

    const exportCsv = () => {
        const cols = COLUMN_DEFS.filter(c => visibleColumns[c.id]);
        const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const headers = cols.flatMap(c => (c.id === 'status' ? ['Status', 'Progress (%)'] : [c.label])).map(q);
        const value = (p: Project, id: string) => {
            if (id === 'pjaId') return getPjaUser(p.pjaId)?.username ?? '';
            if (id === 'kosSebenar') return hargaAkhir(p);
            if (id === 'kontrak') return contractOf(p)?.code ?? '';
            return (p as any)[id];
        };
        const rows = filteredProjects.map(p => cols.map(c => (c.id === 'status'
            ? `${q(getStatusLabel(p.status))},${q(p.peratusSiap ?? 0)}` : q(value(p, c.id)))).join(','));
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(`data:text/csv;charset=utf-8,${headers.join(',')}\n${rows.join('\n')}`));
        link.setAttribute('download', `Senarai_Projek_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    const scopeBar = (idPrefix: string) => (
        <ReportScopeBar scope={scope} onChange={setScope} contracts={scopeContracts} hasUnbound={hasUnbound} year={selectedYear}
            label={scopeText} count={scopeProjects.length} idPrefix={idPrefix} />
    );

    const filterPanel = (idPrefix: string) => (
        <FilterPanel
            idPrefix={idPrefix} filters={rowFilters} onChange={setRowFilters} onReset={resetAll} pjas={pjas} votes={votesList} viewMode={viewMode}
            sortKey={sortKey} sortDirection={sortDirection} onSortKey={setSortKey} onSortDirection={setSortDirection}
            columns={COLUMN_DEFS} visibleColumns={visibleColumns} onVisibleColumns={setVisibleColumns} defaultColumns={DEFAULT_COLUMNS}
            costViewMode={costViewMode} onCostViewMode={setCostViewMode} showSiap={showSiap} onShowSiap={setShowSiap} showTuntutan={showTuntutan} onShowTuntutan={setShowTuntutan}
        />
    );

    const sortLabel = COLUMN_DEFS.find(c => c.id === sortKey)?.label;

    return (
        <div className="space-y-6 animate-fade-in pb-24 md:pb-40" data-testid="projects-page">
            <header className="hidden md:flex items-end justify-between gap-6">
                <div className="min-w-0">
                    <p className="ih-eyebrow text-emerald-deep">Projek</p>
                    <h1 className="font-display text-display-xl text-ink">Senarai projek</h1>
                    <p className="text-muted mt-1"><span className="font-bold text-ink ih-num" data-testid="projects-count">{filteredProjects.length}</span> projek dijumpai · {scopeText}</p>
                </div>
                <Button variant="primary" icon={Plus} onClick={onAddProject}>Tambah projek</Button>
            </header>

            <MobileToolbar
                viewMode={viewMode} onViewModeChange={setViewMode} searchTerm={searchTerm} onSearchChange={setSearchTerm}
                activeFilterCount={activeFilterCount} onOpenFilter={() => setIsFilterSheetOpen(true)} onOpenActions={() => setIsActionSheetOpen(true)}
            />

            <div className="md:hidden !mt-3 flex items-center justify-between gap-3 text-sm text-muted">
                <p><span className="font-bold text-ink ih-num">{filteredProjects.length}</span> projek · {scopeText}</p>
                {viewMode === 'list' && sortLabel && (
                    <span className="flex items-center gap-1 text-xs font-bold text-ink shrink-0">
                        {sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}{sortLabel}
                    </span>
                )}
            </div>

            <Card className="hidden md:block" padding="lg">
                <p className="ih-eyebrow text-kontrak mb-3">Skop laporan</p>
                {scopeBar('scope-desktop')}
            </Card>

            <Card className="hidden md:block relative z-30">
                <div className="flex flex-wrap items-center gap-2">
                    {viewMode === 'list' ? (
                        <label className="relative flex-1 min-w-[320px]">
                            <span className="sr-only">Cari projek</span>
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted pointer-events-none" aria-hidden />
                            <input type="search" placeholder="Cari No. Fail, Aduan, Projek, Syarikat" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                className="w-full min-h-11 pl-11 pr-3 bg-surface border border-line-strong rounded-ih-md text-[15px] text-ink placeholder:text-muted-faint focus:outline-none focus:border-emerald" />
                        </label>
                    ) : <div className="flex-1" />}
                    <div className="contents">
                        <div className="inline-flex p-0.5 bg-surface border border-line-strong rounded-ih-md" role="group" aria-label="Pandangan">
                            <button type="button" aria-pressed={viewMode === 'list'} onClick={() => setViewMode('list')} className={`min-h-10 px-3 rounded-ih-sm text-sm font-bold inline-flex items-center gap-2 ${viewMode === 'list' ? 'bg-ink text-paper' : 'text-ink'}`}><List className="w-4 h-4" /> Senarai</button>
                            <button type="button" aria-pressed={viewMode === 'group'} onClick={() => setViewMode('group')} className={`min-h-10 px-3 rounded-ih-sm text-sm font-bold inline-flex items-center gap-2 ${viewMode === 'group' ? 'bg-ink text-paper' : 'text-ink'}`}><Grid className="w-4 h-4" /> Syarikat</button>
                        </div>
                        {viewMode === 'list' && (
                            <div className="flex items-center gap-1">
                                <div className="w-48"><Select aria-label="Susun ikut" value={sortKey} onChange={e => setSortKey(e.target.value)} className="min-h-11">
                                    {COLUMN_DEFS.map(c => <option key={c.id} value={c.id}>Susun: {c.label}</option>)}
                                </Select></div>
                                <IconButton icon={sortDirection === 'asc' ? ArrowUp : ArrowDown} variant="outline" label={sortDirection === 'asc' ? 'Menaik' : 'Menurun'} onClick={() => setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'))} />
                            </div>
                        )}
                        <Button variant={showFilterPanel || activeFilterCount > 0 ? 'ink' : 'outline'} icon={Filter} onClick={() => setShowFilterPanel(v => !v)} aria-expanded={showFilterPanel}>
                            Tapis{activeFilterCount > 0 && <span className="ih-num"> ({activeFilterCount})</span>}
                        </Button>
                        {viewMode === 'group'
                            ? <Button variant="outline" icon={FileText} onClick={() => setIsExportModalOpen(true)}>Laporan PDF</Button>
                            : <Button variant="outline" icon={Download} onClick={exportCsv}>CSV</Button>}
                        <Button variant="outline" icon={isGeneratingPdf ? Loader2 : Recycle} onClick={exportRotasi} disabled={isGeneratingPdf}>Rotasi</Button>
                        {canImportInden && <Button variant="outline" icon={FileUp} onClick={() => setIsImportIndenOpen(true)}>Import No. Inden</Button>}
                    </div>
                </div>
                {showFilterPanel && <div className="pt-5 mt-5 border-t border-line animate-slide-up">{filterPanel('filter-desktop')}</div>}
            </Card>

            {viewMode === 'list' && (
                <div className="md:hidden !mt-3 space-y-3">
                    {pageRows.length > 0 ? pageRows.map(project => (
                        <ProjectCard key={project.id} project={project} pja={getPjaUser(project.pjaId)} contract={contractOf(project)} repriceReason={repriceOf(project)}
                            canDelete={user.role !== Role.PJA} onOpen={onEditProject} onDelete={setProjectToDelete} />
                    )) : <p className="py-12 text-center text-muted bg-surface rounded-ih-lg border border-line">Tiada projek dijumpai.</p>}
                    {filteredProjects.length > 0 && (
                        <MobilePager currentPage={currentPage} totalPages={totalPages} totalCount={filteredProjects.length} itemsPerPage={ITEMS_PER_PAGE} pageInput={pageInput}
                            onPageChange={goToPage} onPageInputChange={e => setPageInput(e.target.value)} onPageInputBlur={commitPageInput}
                            onPageInputKeyDown={e => { if (e.key === 'Enter') { commitPageInput(); e.currentTarget.blur(); } }} />
                    )}
                </div>
            )}

            {viewMode === 'list' && (
                <div className="hidden md:block space-y-3">
                    {filteredProjects.length > 0 && (
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 text-sm text-muted">
                                <span>Paparan <b className="text-ink ih-num">{Math.min(filteredProjects.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)}</b> hingga <b className="text-ink ih-num">{Math.min(filteredProjects.length, currentPage * ITEMS_PER_PAGE)}</b> daripada <b className="text-ink ih-num">{filteredProjects.length}</b> projek</span>
                                {(sortKey !== 'tarikhBuka' || sortDirection !== 'desc') && (
                                    <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => { setSortKey('tarikhBuka'); setSortDirection('desc'); }}>Reset susunan</Button>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <IconButton icon={ChevronLeft} variant="outline" label="Muka sebelumnya" disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)} />
                                <label className="flex items-center gap-2 text-sm text-muted">Muka
                                    <input type="number" aria-label="Muka" value={pageInput} onChange={e => setPageInput(e.target.value)} onBlur={commitPageInput}
                                        onKeyDown={e => { if (e.key === 'Enter') { commitPageInput(); e.currentTarget.blur(); } }}
                                        className="w-14 min-h-11 text-center bg-surface border border-line-strong rounded-ih-sm font-bold text-ink ih-num outline-none focus:border-emerald" />
                                    daripada {totalPages}</label>
                                <IconButton icon={ChevronRight} variant="outline" label="Muka seterusnya" disabled={currentPage === totalPages} onClick={() => goToPage(currentPage + 1)} />
                            </div>
                        </div>
                    )}
                    <ProjectsTable rows={pageRows} columns={COLUMN_DEFS} visible={visibleColumns} getPja={getPjaUser} contractOf={contractOf} repriceOf={repriceOf}
                        hargaAkhir={hargaAkhir} canDelete={user.role !== Role.PJA} onOpen={openProject} onDelete={setProjectToDelete} onRowMouse={rowMouse} />
                </div>
            )}

            {viewMode === 'group' && (
                <div className="!mt-0 md:!mt-6 space-y-3 md:space-y-4">
                    {groupedProjects.map((group, idx) => {
                        const common = {
                            index: idx, group, expanded: !!expandedCompanies[group.company],
                            onToggle: () => setExpandedCompanies(prev => ({ ...prev, [group.company]: !prev[group.company] })),
                            costViewMode, canQuickEdit, getPjaUser, getVoteName, getHargaAkhir: hargaAkhir, onOpenProject: onEditProject,
                            onUpdateProject: (id: number, updates: Partial<Project>) => updateProject({ id, updates }), capSlot: capSlot(group.company),
                        };
                        return (
                            <React.Fragment key={group.company}>
                                <CompanyGroupPanel {...common} />
                                <CompanyCard {...common} />
                            </React.Fragment>
                        );
                    })}
                    {groupedProjects.length === 0 && <p className="text-center text-muted italic py-12 bg-surface border border-line rounded-ih-lg">Tiada data syarikat untuk dipaparkan.</p>}
                    <VoteSummary
                        summary={summary} totals={totals} scopeLabel={scopeText}
                        costLabel={costViewMode === 'contract' ? 'harga kontrak' : 'harga akhir'}
                        allocationYear={allocYear} manualEditable={allocYear === selectedYear}
                        rowFilterNote={rowFilterText ? `Tapisan paparan (${rowFilterText}) hanya menapis senarai syarikat di atas; rumusan ini tidak berubah.` : null}
                        manual={manual} onManualChange={setManual} onSave={saveManualFinancials} saving={isSavingFinancials} getVoteName={getVoteName}
                    />
                </div>
            )}

            <BottomSheet
                open={isFilterSheetOpen}
                title="Skop laporan & tapisan"
                onClose={() => setIsFilterSheetOpen(false)}
                footer={
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-muted"><span className="font-bold text-ink ih-num">{filteredProjects.length}</span> projek dijumpai</p>
                        <Button variant="primary" onClick={() => setIsFilterSheetOpen(false)}>Tutup</Button>
                    </div>
                }
            >
                <div className="space-y-6">
                    <div className="pb-5 border-b border-line">
                        <p className="ih-eyebrow text-kontrak mb-3">Skop laporan</p>
                        {scopeBar('scope-sheet')}
                    </div>
                    {filterPanel('filter-sheet')}
                </div>
            </BottomSheet>

            <ProjectActionsSheet
                open={isActionSheetOpen} onClose={() => setIsActionSheetOpen(false)} isGroupView={viewMode === 'group'} isGeneratingPdf={isGeneratingPdf}
                canImportInden={canImportInden} onExportCsv={exportCsv} onOpenReport={() => setIsExportModalOpen(true)} onExportRotasi={exportRotasi}
                onOpenImportInden={() => setIsImportIndenOpen(true)}
            />

            <AddProjectFab onClick={onAddProject} />

            {isImportIndenOpen && canImportInden && <ImportIndenModal projects={projects} onClose={() => setIsImportIndenOpen(false)} />}

            {projectToDelete && (
                <DeleteProjectDialog noFail={projectToDelete.noFail} countdown={deleteCountdown} onCancel={() => setProjectToDelete(null)}
                    onConfirm={() => { onDeleteProject(projectToDelete); setProjectToDelete(null); }} />
            )}
            {isExportModalOpen && (
                <ExportReportDialog scopeLabel={rowFilterText ? `${scopeText} (tapisan paparan: ${rowFilterText})` : scopeText} bil={exportBilMesyuarat}
                    onBilChange={setExportBilMesyuarat} generating={isGeneratingPdf} progress={generationProgress}
                    onClose={() => setIsExportModalOpen(false)} onExport={exportSenarai} />
            )}
        </div>
    );
};

export default ProjectsList;
