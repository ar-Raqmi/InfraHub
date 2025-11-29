import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Project, ProjectStatus, formatCurrency, getStatusColor, formatDate } from '../types';
import { Search, Plus, List, Grid, Folder, ArrowRight, Building2, Download, ChevronDown, ChevronRight, Layout, Trash2, AlertTriangle, X } from 'lucide-react';

interface ProjectsListProps {
  projects: Project[];
  onAddProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
}

interface CompanyGroupData {
  projects: Project[];
  totalCost: number;
  totalActualCost: number;
  count: number;
}

const ProjectsList: React.FC<ProjectsListProps> = ({ projects, onAddProject, onEditProject, onDeleteProject }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'group'>('list');
  const [expandedCompanies, setExpandedCompanies] = useState<Record<string, boolean>>({});
  
  // Delete Modal State
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleteCountdown, setDeleteCountdown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (projectToDelete) {
      setDeleteCountdown(5);
      timer = setInterval(() => {
        setDeleteCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [projectToDelete]);

  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project);
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      onDeleteProject(projectToDelete);
      setProjectToDelete(null);
    }
  };

  const cancelDelete = () => {
    setProjectToDelete(null);
  };

  // Expanded Column Toggle State for Workflow Visibility
  const [showFilters, setShowFilters] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    // Phase 1: Asas
    noFail: true,
    namaProjek: true,
    noAduan: false,
    lokasi: false,
    bp: false,
    zon: false,
    aduan: false,
    tarikhBuka: false,

    // Phase 2: Lantikan
    syarikat: true, // namaSyarikat
    noVote: false,
    bulan: false,
    kosProjek: true,
    tarikhLantikan: false,
    tarikhCetakanBpp: false,
    tarikhMulaKontrak: false,
    tarikhTamatKontrak: false,
    tempohKontrak: false,
    tarikhSerahTapak: false,
    tarikhMulaKerja: false,
    
    // Phase 3: Pelaksanaan
    tarikhPemeriksaan: false,
    tarikhSiapSebenar: false,
    cpcDate: false, // Tarikh CPC
    lad: false, // ladAmount + ladDays

    // Phase 4: Penutup
    tarikhHantarKewangan: false,
    tarikhPadanan: false,
    kosSebenar: false, // kosProjekSebenar
    peratusSiap: false,
    prestasi: false,
    
    status: true,
  });

  // Groups for Dropdown UI
  const columnGroups = {
    'Fasa 1: Maklumat Asas': ['noFail', 'namaProjek', 'noAduan', 'lokasi', 'bp', 'zon', 'aduan', 'tarikhBuka'],
    'Fasa 2: Lantikan & Kontrak': ['syarikat', 'noVote', 'bulan', 'kosProjek', 'tarikhLantikan', 'tarikhCetakanBpp', 'tarikhMulaKontrak', 'tarikhTamatKontrak', 'tempohKontrak', 'tarikhSerahTapak', 'tarikhMulaKerja'],
    'Fasa 3: Pelaksanaan & CPC': ['tarikhPemeriksaan', 'tarikhSiapSebenar', 'cpcDate', 'lad'],
    'Fasa 4: Tuntutan & Penutup': ['tarikhHantarKewangan', 'tarikhPadanan', 'kosSebenar', 'peratusSiap', 'prestasi', 'status']
  };

  const toggleCompany = (company: string) => {
    setExpandedCompanies(prev => ({ ...prev, [company]: !prev[company] }));
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = 
      p.noFail.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.namaProjek.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.namaSyarikat || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Grouping Logic
  const groupedProjects = filteredProjects.reduce<Record<string, CompanyGroupData>>((acc, project) => {
    const company = project.namaSyarikat || 'Tiada Syarikat';
    if (!acc[company]) {
      acc[company] = { projects: [], totalCost: 0, totalActualCost: 0, count: 0 };
    }
    acc[company].projects.push(project);
    acc[company].totalCost += (project.kosProjek || 0);
    acc[company].totalActualCost += (project.kosSebenar || 0);
    acc[company].count += 1;
    return acc;
  }, {});

  // Excel Export
  const exportToExcel = () => {
    const headers = ['No. Fail', 'Nama Projek', 'Syarikat', 'Status', 'Kos Projek', 'Kos Sebenar', 'Tarikh Buka', 'Tarikh Siap'];
    // Simple CSV generation
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + filteredProjects.map(p => {
          return [
            p.noFail,
            `"${p.namaProjek.replace(/"/g, '""')}"`,
            `"${(p.namaSyarikat || '').replace(/"/g, '""')}"`,
            p.status,
            p.kosProjek || 0,
            p.kosSebenar || 0,
            formatDate(p.tarikhBuka),
            formatDate(p.tarikhSiapSebenar) || ''
          ].join(",");
      }).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "senarai_projek.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Senarai Projek</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Uruskan semua projek infrastruktur di sini</p>
        </div>
        <button 
          onClick={onAddProject}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:scale-105 transition-all duration-300 w-full md:w-auto justify-center"
        >
          <Plus className="h-5 w-5" />
          <span>Tambah Projek</span>
        </button>
      </div>

      {/* Controls Bar */}
      <div className="glass-effect p-4 rounded-3xl shadow-lg border border-white/20 dark:border-white/5 transition-all duration-300">
        <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
          
          {/* Search */}
          <div className="relative flex-1 w-full xl:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari No. Fail, Projek..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>

          <div className="flex flex-col md:flex-row flex-wrap gap-3 w-full xl:w-auto items-center justify-end">
            {/* View Toggle */}
            <div className="flex w-full md:w-auto bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl shrink-0">
              <button 
                onClick={() => setViewMode('list')}
                className={`flex-1 md:flex-none justify-center px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <List className="w-4 h-4" />
                <span className="md:hidden">List</span>
              </button>
              <button 
                onClick={() => setViewMode('group')}
                className={`flex-1 md:flex-none justify-center px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'group' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Grid className="w-4 h-4" />
                <span className="md:hidden">Group</span>
              </button>
            </div>

            {/* Filter */}
            <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full md:w-auto px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-0 text-slate-700 dark:text-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[140px]"
            >
                <option value="ALL">Semua Status</option>
                <option value={ProjectStatus.MENUNGGU_LANTIKAN}>Menunggu Lantikan</option>
                <option value={ProjectStatus.DALAM_PROSES}>Dalam Proses</option>
                <option value={ProjectStatus.TUNTUTAN_BAYARAN}>Tuntutan Bayaran</option>
                <option value={ProjectStatus.SIAP}>Siap</option>
            </select>

            {/* Column Toggle - Inline Panel Button */}
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`w-full md:w-auto px-4 py-3 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all border border-slate-200 dark:border-white/5 ${
                showFilters 
                ? 'bg-indigo-600 text-white shadow-indigo-500/20 shadow-lg' 
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Layout className="w-5 h-5" />
              <span>Paparan Lajur</span>
            </button>

            {/* Export */}
            <button 
              onClick={exportToExcel}
              className="w-full md:w-auto flex items-center justify-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors shadow-sm"
              title="Export Excel"
            >
              <Download className="w-5 h-5" />
              <span className="md:hidden font-bold">Export Excel</span>
            </button>
          </div>
        </div>

        {/* Expanded Filter Panel */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-white/5 animate-slide-down">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
               {Object.entries(columnGroups).map(([groupName, columns]) => (
                  <div key={groupName}>
                     <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        {groupName}
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full ml-auto">
                           {columns.filter(c => visibleColumns[c as keyof typeof visibleColumns]).length}/{columns.length}
                        </span>
                     </h4>
                     <div className="space-y-2.5">
                        {columns.map(col => (
                           <label key={col} className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-colors -ml-2">
                              <div className="relative flex items-center">
                                <input 
                                  type="checkbox" 
                                  checked={visibleColumns[col as keyof typeof visibleColumns]} 
                                  onChange={() => setVisibleColumns(prev => ({...prev, [col]: !prev[col as keyof typeof visibleColumns]}))}
                                  className="peer w-4 h-4 rounded border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-2 accent-indigo-600 cursor-pointer transition-all"
                                />
                              </div>
                              <span className={`text-sm font-medium transition-colors capitalize select-none ${visibleColumns[col as keyof typeof visibleColumns] ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'}`}>
                                 {col.replace(/([A-Z])/g, ' $1').trim().replace(/lad/i, 'LAD').replace(/cpc/i, 'CPC').replace(/bp/i, 'BP').replace(/iso/i, 'ISO')}
                              </span>
                           </label>
                        ))}
                     </div>
                  </div>
               ))}
            </div>
            
            <div className="mt-6 flex justify-end">
               <button onClick={() => setShowFilters(false)} className="text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white">
                  Tutup Panel
               </button>
            </div>
          </div>
        )}
      </div>

      {/* List Content */}
      <div className="glass-effect rounded-3xl shadow-xl border border-white/20 dark:border-white/5 overflow-hidden min-h-[400px]">
        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                  <tr>
                    {/* Phase 1 */}
                    {visibleColumns.noFail && <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Projek / No. Fail</th>}
                    {visibleColumns.noAduan && <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">No. Aduan</th>}
                    {visibleColumns.lokasi && <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Lokasi</th>}
                    {visibleColumns.bp && <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">BP</th>}
                    {visibleColumns.zon && <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Zon</th>}
                    {visibleColumns.aduan && <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Aduan</th>}
                    {visibleColumns.tarikhBuka && <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Tarikh Buka</th>}

                    {/* Phase 2 */}
                    {visibleColumns.syarikat && <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Syarikat</th>}
                    {visibleColumns.noVote && <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">No. Vote</th>}
                    {visibleColumns.bulan && <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Bulan</th>}
                    {visibleColumns.kosProjek && <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Kos Projek</th>}
                    {visibleColumns.tarikhLantikan && <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Tarikh Lantikan</th>}
                    {visibleColumns.tarikhCetakanBpp && <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Cetakan BPP</th>}
                    {visibleColumns.tarikhMulaKontrak && <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Mula Kontrak</th>}
                    {visibleColumns.tarikhTamatKontrak && <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Tamat Kontrak</th>}
                    {visibleColumns.tempohKontrak && <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Tempoh</th>}
                    {visibleColumns.tarikhSerahTapak && <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Serah Tapak</th>}
                    {visibleColumns.tarikhMulaKerja && <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Mula Kerja</th>}

                    {/* Phase 3 */}
                    {visibleColumns.tarikhPemeriksaan && <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Pemeriksaan</th>}
                    {visibleColumns.tarikhSiapSebenar && <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Siap Sebenar</th>}
                    {visibleColumns.cpcDate && <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Tarikh CPC</th>}
                    {visibleColumns.lad && <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">LAD (RM)</th>}

                    {/* Phase 4 */}
                    {visibleColumns.tarikhHantarKewangan && <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Hantar Kewangan</th>}
                    {visibleColumns.tarikhPadanan && <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Tarikh Padanan</th>}
                    {visibleColumns.kosSebenar && <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Kos Sebenar</th>}
                    {visibleColumns.peratusSiap && <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">% Siap</th>}
                    {visibleColumns.prestasi && <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Prestasi</th>}

                    {visibleColumns.status && <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Status</th>}
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap sticky right-0 bg-slate-50 dark:bg-slate-900 z-10">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProjects.map((project) => (
                    <tr key={project.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all duration-300 group">
                      {/* Phase 1 */}
                      {visibleColumns.noFail && (
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-4 min-w-[200px]">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center shadow-md text-slate-500 dark:text-slate-400 shrink-0">
                                    <Folder className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 transition-colors text-sm">{project.namaProjek}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{project.noFail}</p>
                                </div>
                            </div>
                        </td>
                      )}
                      {visibleColumns.noAduan && <td className="px-6 py-4 text-sm text-slate-500">{project.noAduan || '-'}</td>}
                      {visibleColumns.lokasi && <td className="px-6 py-4 text-sm text-slate-500 truncate max-w-[200px]">{project.lokasi || '-'}</td>}
                      {visibleColumns.bp && <td className="px-6 py-4 text-center text-sm text-slate-500">{project.bp || '-'}</td>}
                      {visibleColumns.zon && <td className="px-6 py-4 text-center text-sm text-slate-500">{project.zon || '-'}</td>}
                      {visibleColumns.aduan && <td className="px-6 py-4 text-sm text-slate-500 truncate max-w-[200px]">{project.aduan || '-'}</td>}
                      {visibleColumns.tarikhBuka && <td className="px-6 py-4 text-center text-sm text-slate-500 whitespace-nowrap">{formatDate(project.tarikhBuka)}</td>}

                      {/* Phase 2 */}
                      {visibleColumns.syarikat && (
                        <td className="px-6 py-4">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{project.namaSyarikat || '-'}</span>
                        </td>
                      )}
                      {visibleColumns.noVote && <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">{project.noVote || '-'}</td>}
                      {visibleColumns.bulan && <td className="px-6 py-4 text-center text-sm text-slate-500">{project.bulan || '-'}</td>}
                      {visibleColumns.kosProjek && (
                        <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            {formatCurrency(project.kosProjek)}
                        </td>
                      )}
                      {visibleColumns.tarikhLantikan && <td className="px-6 py-4 text-center text-sm text-slate-500 whitespace-nowrap">{formatDate(project.tarikhLantikan)}</td>}
                      {visibleColumns.tarikhCetakanBpp && <td className="px-6 py-4 text-center text-sm text-slate-500 whitespace-nowrap">{formatDate(project.tarikhCetakanBpp)}</td>}
                      {visibleColumns.tarikhMulaKontrak && <td className="px-6 py-4 text-center text-sm text-slate-500 whitespace-nowrap">{formatDate(project.tarikhMulaKontrak)}</td>}
                      {visibleColumns.tarikhTamatKontrak && <td className="px-6 py-4 text-center text-sm text-slate-500 whitespace-nowrap">{formatDate(project.tarikhTamatKontrak)}</td>}
                      {visibleColumns.tempohKontrak && <td className="px-6 py-4 text-center text-sm text-slate-500">{project.tempohKontrak || '-'}</td>}
                      {visibleColumns.tarikhSerahTapak && <td className="px-6 py-4 text-center text-sm text-slate-500 whitespace-nowrap">{formatDate(project.tarikhSerahTapak)}</td>}
                      {visibleColumns.tarikhMulaKerja && <td className="px-6 py-4 text-center text-sm text-slate-500 whitespace-nowrap">{formatDate(project.tarikhMulaKerja)}</td>}

                      {/* Phase 3 */}
                      {visibleColumns.tarikhPemeriksaan && <td className="px-6 py-4 text-center text-sm text-slate-500 whitespace-nowrap">{formatDate(project.tarikhPemeriksaan)}</td>}
                      {visibleColumns.tarikhSiapSebenar && <td className="px-6 py-4 text-center text-sm text-slate-500 whitespace-nowrap">{formatDate(project.tarikhSiapSebenar)}</td>}
                      {visibleColumns.cpcDate && <td className="px-6 py-4 text-center text-sm text-slate-500 whitespace-nowrap">{formatDate(project.cpcDate)}</td>}
                      {visibleColumns.lad && <td className="px-6 py-4 text-center text-sm text-red-500 font-medium whitespace-nowrap">{project.ladAmount ? formatCurrency(project.ladAmount) : '-'}</td>}

                      {/* Phase 4 */}
                      {visibleColumns.tarikhHantarKewangan && <td className="px-6 py-4 text-center text-sm text-slate-500 whitespace-nowrap">{formatDate(project.tarikhHantarKewangan)}</td>}
                      {visibleColumns.tarikhPadanan && <td className="px-6 py-4 text-center text-sm text-slate-500 whitespace-nowrap">{formatDate(project.tarikhPadanan)}</td>}
                      {visibleColumns.kosSebenar && (
                        <td className="px-6 py-4 text-right font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {formatCurrency(project.kosSebenar)}
                        </td>
                      )}
                      {visibleColumns.peratusSiap && <td className="px-6 py-4 text-center text-sm text-slate-500 whitespace-nowrap">{project.peratusSiap ? `${project.peratusSiap}%` : '-'}</td>}
                      {visibleColumns.prestasi && (
                         <td className="px-6 py-4 text-center text-sm">
                            {project.prestasi ? (
                               <span className={`px-2 py-0.5 rounded text-[10px] border ${
                                   project.prestasi === 'Cemerlang' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                                   project.prestasi === 'Baik' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                   'bg-gray-50 border-gray-200 text-gray-700'
                               }`}>
                                  {project.prestasi}
                               </span>
                            ) : '-'}
                         </td>
                      )}

                      {visibleColumns.status && (
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(project.status)} whitespace-nowrap`}>
                            {project.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4 text-right sticky right-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/80 transition-colors z-10 border-l border-slate-100 dark:border-slate-800">
                        <div className="flex justify-end gap-2">
                           <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteClick(project); }}
                              className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                              title="Padam Projek"
                           >
                              <Trash2 className="h-5 w-5" />
                           </button>
                           <button 
                              onClick={() => onEditProject(project)}
                              className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl"
                              title="Edit Projek"
                           >
                              <ArrowRight className="h-5 w-5" />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProjects.length === 0 && (
                    <tr>
                      <td colSpan={25} className="px-6 py-12 text-center text-slate-400 italic">
                        Tiada projek ditemui pada tahun ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
          </div>
        ) : (
          <div className="p-6 space-y-6">
             {Object.keys(groupedProjects).length === 0 && (
                <div className="text-center text-slate-400 italic py-12">Tiada data syarikat untuk dipaparkan.</div>
             )}
             {Object.entries(groupedProjects).map(([company, data]) => (
                <div key={company} className="glass-effect bg-white/50 dark:bg-slate-800/40 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 shadow-md">
                   {/* Company Header */}
                   <div 
                      className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors gap-4"
                      onClick={() => toggleCompany(company)}
                   >
                      <div className="flex items-center gap-4">
                         <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                            <Building2 className="w-6 h-6" />
                         </div>
                         <div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">{company}</h3>
                            <p className="text-sm text-slate-500">{data.count} Projek</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-8 w-full sm:w-auto justify-between sm:justify-end">
                         <div className="text-right">
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Jumlah Kontrak</p>
                            <p className="font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(data.totalCost)}</p>
                         </div>
                      </div>
                   </div>

                   {/* Expanded Table */}
                   {expandedCompanies[company] && (
                      <div className="border-t border-slate-200 dark:border-white/5 animate-slide-down overflow-x-auto">
                         <table className="w-full text-sm min-w-[500px]">
                            <thead className="bg-slate-50 dark:bg-black/20">
                               <tr>
                                  <th className="px-6 py-3 text-left text-xs text-slate-500">Tajuk Projek</th>
                                  <th className="px-6 py-3 text-right text-xs text-slate-500">Kos Asal</th>
                                  <th className="px-6 py-3 text-right text-xs text-slate-500">Kos Sebenar</th>
                                  <th className="px-6 py-3 text-right text-xs text-slate-500">Perbezaan</th>
                                  <th className="px-6 py-3 w-10"></th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                               {data.projects.map(p => (
                                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                                     <td className="px-6 py-3 text-slate-700 dark:text-slate-300">
                                        <div className="font-medium line-clamp-2">{p.namaProjek}</div>
                                        <div className="text-xs text-slate-400 font-mono">{p.noFail}</div>
                                     </td>
                                     <td className="px-6 py-3 text-right font-medium">{formatCurrency(p.kosProjek)}</td>
                                     <td className="px-6 py-3 text-right font-medium">{formatCurrency(p.kosSebenar)}</td>
                                     <td className={`px-6 py-3 text-right font-medium ${(p.kosSebenar || 0) > (p.kosProjek || 0) ? 'text-red-500' : 'text-emerald-500'}`}>
                                        {formatCurrency((p.kosSebenar || 0) - (p.kosProjek || 0))}
                                     </td>
                                     <td className="px-6 py-3 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(p); }} className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg group/del">
                                               <Trash2 className="w-4 h-4 text-slate-400 group-hover/del:text-red-500" />
                                            </button>
                                            <button onClick={() => onEditProject(p)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg">
                                               <ArrowRight className="w-4 h-4 text-slate-400" />
                                            </button>
                                        </div>
                                     </td>
                                  </tr>
                               ))}
                               <tr className="bg-slate-50 dark:bg-black/20 font-bold">
                                  <td className="px-6 py-4 text-right">JUMLAH BESAR</td>
                                  <td className="px-6 py-4 text-right">{formatCurrency(data.totalCost)}</td>
                                  <td className="px-6 py-4 text-right">{formatCurrency(data.totalActualCost)}</td>
                                  <td className="px-6 py-4 text-right">{formatCurrency(data.totalActualCost - data.totalCost)}</td>
                                  <td></td>
                               </tr>
                            </tbody>
                         </table>
                      </div>
                   )}
                </div>
             ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal Portal */}
      {projectToDelete && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={cancelDelete}>
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 transform scale-100 transition-all animate-slide-up relative" onClick={e => e.stopPropagation()}>
                <button onClick={cancelDelete} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                   <X className="w-5 h-5" />
                </button>
                <div className="flex flex-col items-center text-center pt-2">
                   <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6 text-red-500 animate-pulse-slow">
                      <div className="w-14 h-14 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 stroke-[1.5]" />
                      </div>
                   </div>
                   <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 font-jakarta">Padam Projek Ini?</h3>
                   <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm leading-relaxed px-4">
                     Adakah anda pasti mahu memadam projek <br/>
                     <span className="font-bold text-slate-900 dark:text-white block mt-1 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 truncate max-w-full">
                       {projectToDelete.namaProjek}
                     </span>
                     <span className="mt-2 block text-xs text-red-500 font-medium">Tindakan ini tidak boleh dikembalikan.</span>
                   </p>
                   
                   <div className="flex gap-3 w-full">
                      <button 
                        onClick={cancelDelete}
                        className="flex-1 py-3.5 px-4 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-600 transition-all border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md"
                      >
                        Batal
                      </button>
                      <button 
                        onClick={confirmDelete}
                        disabled={deleteCountdown > 0}
                        className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg ${
                          deleteCountdown > 0 
                            ? 'bg-slate-400 dark:bg-slate-600 cursor-not-allowed opacity-70 shadow-none' 
                            : 'bg-red-600 hover:bg-red-700 shadow-red-600/30 hover:shadow-red-600/50 hover:-translate-y-0.5'
                        }`}
                      >
                        {deleteCountdown > 0 ? (
                            <span className="font-mono">Tunggu ({deleteCountdown}s)</span>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4" />
                                <span>Pasti</span>
                            </>
                        )}
                      </button>
                   </div>
                </div>
            </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ProjectsList;