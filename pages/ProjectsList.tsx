
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Project, ProjectStatus, formatCurrency, getStatusColor, formatDate, User, BP_OPTIONS, ZON_OPTIONS } from '../types';
import { mockService } from '../services/mockService';
import { Search, Plus, List, Grid, Filter, Download, Trash2, AlertTriangle, X, ChevronDown, Check, SlidersHorizontal, ArrowUpRight, RotateCcw, Settings2, Eye, EyeOff, Layout } from 'lucide-react';

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

// Circular Progress Component
const CircularProgress = ({ value, size = 36, strokeWidth = 3 }: { value: number, size?: number, strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  
  // Requirement: Progress ring should be green
  const colorClass = "text-emerald-500";
  const strokeClass = "stroke-emerald-500";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-slate-200 dark:stroke-slate-700 fill-none"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={`${strokeClass} fill-none transition-all duration-1000 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className={`absolute text-[9px] font-bold ${colorClass}`}>{Math.round(value)}%</span>
    </div>
  );
};

const ProjectsList: React.FC<ProjectsListProps> = ({ projects, onAddProject, onEditProject, onDeleteProject }) => {
  const [users, setUsers] = useState<User[]>([]);
  
  // View & Data States
  const [viewMode, setViewMode] = useState<'list' | 'group'>('list');
  const [expandedCompanies, setExpandedCompanies] = useState<Record<string, boolean>>({});
  
  // Filter States
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'ALL'>('ALL');
  const [filterPja, setFilterPja] = useState<string>('ALL');
  const [filterZon, setFilterZon] = useState<string>('ALL');
  const [filterBp, setFilterBp] = useState<string>('ALL');
  
  // UI States
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleteCountdown, setDeleteCountdown] = useState(0);

  // Column Definitions
  const columnDefs = [
    // Asas
    { id: 'noFail', label: 'No. Fail', group: 'Asas', default: true },
    { id: 'namaProjek', label: 'Nama Projek', group: 'Asas', default: true },
    { id: 'pjaId', label: 'PJA', group: 'Asas', default: true },
    { id: 'noAduan', label: 'Aduan', group: 'Asas', default: true },
    { id: 'lokasi', label: 'Lokasi', group: 'Asas', default: false },
    { id: 'bp', label: 'BP', group: 'Asas', default: false },
    { id: 'zon', label: 'Zon', group: 'Asas', default: false },
    { id: 'tarikhBuka', label: 'Tarikh Buka', group: 'Asas', default: false },

    // Kontrak
    { id: 'namaSyarikat', label: 'Nama Syarikat', group: 'Kontrak', default: true },
    { id: 'noVote', label: 'No. Vot', group: 'Kontrak', default: false },
    { id: 'noSebutharga', label: 'No. Sebutharga', group: 'Kontrak', default: false },
    { id: 'noInden', label: 'No. Inden', group: 'Kontrak', default: false },
    { id: 'noBpp', label: 'No. BPP', group: 'Kontrak', default: false },
    { id: 'tempohKontrak', label: 'Tempoh', group: 'Kontrak', default: false },

    // Status
    { id: 'status', label: 'Status & Progress', group: 'Status', default: true },

    // Kewangan
    { id: 'kosProjek', label: 'Kos Projek', group: 'Kewangan', default: false },
    { id: 'kosSebenar', label: 'Kos Sebenar', group: 'Kewangan', default: false },
    { id: 'wangTahanan', label: 'Wang Tahanan', group: 'Kewangan', default: false },
    { id: 'ladAmount', label: 'LAD (RM)', group: 'Kewangan', default: false },
    { id: 'ladDays', label: 'Hari LAD', group: 'Kewangan', default: false },

    // Tarikh
    { id: 'tarikhLantikan', label: 'T. Lantikan', group: 'Tarikh', default: false },
    { id: 'tarikhCetakanBpp', label: 'T. BPP', group: 'Tarikh', default: false },
    { id: 'tarikhMulaKontrak', label: 'Mula Kontrak', group: 'Tarikh', default: false },
    { id: 'tarikhTamatKontrak', label: 'Tamat Kontrak', group: 'Tarikh', default: false },
    { id: 'tarikhSerahTapak', label: 'Serah Tapak', group: 'Tarikh', default: false },
    { id: 'tarikhMulaKerja', label: 'Mula Kerja', group: 'Tarikh', default: false },
    { id: 'tarikhSiapSebenar', label: 'Siap Sebenar', group: 'Tarikh', default: false },
    
    // Penutup / Lain-lain
    { id: 'tarikhTuntutanBayaran', label: 'T. Tuntutan', group: 'Penutup', default: false },
    { id: 'tarikhHantarKewangan', label: 'Hantar Kewangan', group: 'Penutup', default: false },
    { id: 'tarikhPadanan', label: 'Padanan', group: 'Penutup', default: false },
    { id: 'iso', label: 'ISO', group: 'Penutup', default: false },
  ];

  const getInitialColumns = () => {
    const initial: Record<string, boolean> = {};
    columnDefs.forEach(col => {
      initial[col.id] = col.default;
    });
    return initial;
  };

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(getInitialColumns);

  // Column Actions
  const handleSelectAllColumns = () => {
      const all: Record<string, boolean> = {};
      columnDefs.forEach(c => all[c.id] = true);
      setVisibleColumns(all);
  };

  const handleDeselectAllColumns = () => {
      const none: Record<string, boolean> = {};
      columnDefs.forEach(c => none[c.id] = false);
      setVisibleColumns(none);
  };

  const handleResetColumns = () => {
      setVisibleColumns(getInitialColumns());
  };

  useEffect(() => {
    setUsers(mockService.getUsers());
  }, []);

  // Delete Logic
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

  const handleDeleteClick = (project: Project) => setProjectToDelete(project);
  const confirmDelete = () => { if (projectToDelete) { onDeleteProject(projectToDelete); setProjectToDelete(null); } };
  const cancelDelete = () => setProjectToDelete(null);

  // Grouping Logic
  const toggleCompany = (company: string) => {
    setExpandedCompanies(prev => ({ ...prev, [company]: !prev[company] }));
  };

  // Filter Logic
  const resetAllFilters = () => {
    setFilterStatus('ALL');
    setFilterPja('ALL');
    setFilterZon('ALL');
    setFilterBp('ALL');
    setSearchTerm('');
    handleResetColumns();
  };

  const activeFilterCount = [
    filterStatus !== 'ALL',
    filterPja !== 'ALL',
    filterZon !== 'ALL',
    filterBp !== 'ALL'
  ].filter(Boolean).length;

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = 
        p.noFail.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.namaProjek.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.namaSyarikat || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;
      const matchesPja = filterPja === 'ALL' || p.pjaId === Number(filterPja);
      const matchesZon = filterZon === 'ALL' || p.zon === filterZon;
      const matchesBp = filterBp === 'ALL' || p.bp === filterBp;
      
      return matchesSearch && matchesStatus && matchesPja && matchesZon && matchesBp;
    });
  }, [projects, searchTerm, filterStatus, filterPja, filterZon, filterBp]);

  const groupedProjects = useMemo(() => {
    return filteredProjects.reduce<Record<string, CompanyGroupData>>((acc, project) => {
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
  }, [filteredProjects]);

  const exportToExcel = () => {
    // 1. Build Headers
    const activeCols = columnDefs.filter(c => visibleColumns[c.id]);
    const headers: string[] = [];
    
    activeCols.forEach(col => {
        if (col.id === 'status') {
            // Split "Status & Progress" into two columns for CSV
            headers.push('"Status"');
            headers.push('"Progress (%)"');
        } else {
            headers.push(`"${col.label}"`);
        }
    });

    // 2. Build Rows
    const rows = filteredProjects.map(p => {
        return activeCols.map(c => {
             if (c.id === 'status') {
                 // Handle combined column by returning two comma-separated CSV values
                 const statusText = p.status ? p.status.replace(/_/g, ' ') : '';
                 const progressText = p.peratusSiap !== undefined ? p.peratusSiap : 0;
                 return `"${statusText}","${progressText}"`;
             }

             // @ts-ignore
             let val = p[c.id];
             
             if (c.id === 'pjaId') {
                 const u = users.find(u => u.id === val);
                 val = u ? u.username : '';
             }
             
             if (val === undefined || val === null) return '""';
             
             if (typeof val === 'string') {
                 // Escape double quotes
                 return `"${val.replace(/"/g, '""')}"`;
             }
             return `"${val}"`;
        }).join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Senarai_Projek_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPjaName = (id: number) => {
      const u = users.find(user => user.id === id);
      return u ? u.username : '-';
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-20">
      
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Senarai Projek</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            <span className="font-bold text-emerald-600">{filteredProjects.length}</span> projek dijumpai
          </p>
        </div>
        <button 
          onClick={onAddProject}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40 hover:scale-105 transition-all duration-300 w-full md:w-auto justify-center"
        >
          <Plus className="h-5 w-5" />
          <span>Tambah Projek</span>
        </button>
      </div>

      {/* Advanced Filter Bar */}
      <div className="glass-effect p-5 rounded-3xl shadow-xl border border-white/20 dark:border-white/5 space-y-4 relative z-30">
          {/* Top Row: Search & View Toggle */}
          <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari No. Fail, Projek, Syarikat..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-transparent focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400 font-medium"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`px-3 md:px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        title="Pandangan Senarai"
                    >
                        <List className="w-4 h-4" /> <span className="hidden md:inline">Senarai</span>
                    </button>
                    <button 
                        onClick={() => setViewMode('group')}
                        className={`px-3 md:px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'group' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        title="Pandangan Kumpulan Syarikat"
                    >
                        <Grid className="w-4 h-4" /> <span className="hidden md:inline">Syarikat</span>
                    </button>
                  </div>

                  {/* Toggle Unified Filter Panel */}
                  <button 
                    onClick={() => setShowFilterPanel(!showFilterPanel)}
                    className={`h-full px-4 rounded-xl border flex items-center gap-2 text-sm font-bold transition-all relative ${showFilterPanel || activeFilterCount > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-200 ring-2 ring-emerald-500/20' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50'}`}
                  >
                      <Filter className="w-4 h-4" />
                      <span>Filter</span>
                      {activeFilterCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-600 text-white text-[10px] flex items-center justify-center rounded-full shadow-sm">
                              {activeFilterCount}
                          </span>
                      )}
                  </button>

                  <button 
                    onClick={exportToExcel}
                    className="h-full px-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 flex items-center gap-2 transition-colors"
                    title="Export CSV"
                  >
                      <Download className="w-4 h-4" />
                  </button>
              </div>
          </div>

          {/* Unified Filter Panel (Collapsible) */}
          {showFilterPanel && (
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 animate-slide-down">
                
                {/* Header with Reset All */}
                <div className="flex items-center justify-between mb-6">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Settings2 className="w-4 h-4 text-emerald-500" />
                        Tetapan Data & Paparan
                    </h4>
                    <button 
                        onClick={resetAllFilters}
                        className="text-[11px] font-bold flex items-center gap-1.5 text-slate-500 hover:text-red-500 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <RotateCcw className="w-3 h-3" /> Reset Semua
                    </button>
                </div>

                {/* Section 1: Data Filters */}
                <div className="mb-6">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Tapisan Data (Row Filters)</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Status Filter */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                            </div>
                            <select 
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as any)}
                                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 appearance-none focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-colors"
                            >
                                <option value="ALL">Semua Status</option>
                                <option value={ProjectStatus.MENUNGGU_LANTIKAN}>Menunggu Lantikan</option>
                                <option value={ProjectStatus.DALAM_PROSES}>Dalam Proses</option>
                                <option value={ProjectStatus.TUNTUTAN_BAYARAN}>Tuntutan Bayaran</option>
                                <option value={ProjectStatus.SIAP}>Siap</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>

                        {/* PJA Filter */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <Filter className="w-4 h-4 text-slate-400" />
                            </div>
                            <select 
                                value={filterPja}
                                onChange={(e) => setFilterPja(e.target.value)}
                                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 appearance-none focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-colors"
                            >
                                <option value="ALL">Semua PJA</option>
                                {users.filter(u => u.role === 'PJA').map(u => (
                                    <option key={u.id} value={u.id}>{u.username.toUpperCase()}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>

                        {/* Zon Filter */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <Filter className="w-4 h-4 text-slate-400" />
                            </div>
                            <select 
                                value={filterZon}
                                onChange={(e) => setFilterZon(e.target.value)}
                                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 appearance-none focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-colors"
                            >
                                <option value="ALL">Semua Zon</option>
                                {ZON_OPTIONS.map(z => <option key={z} value={z}>{z}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>

                        {/* BP Filter */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <Filter className="w-4 h-4 text-slate-400" />
                            </div>
                            <select 
                                value={filterBp}
                                onChange={(e) => setFilterBp(e.target.value)}
                                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 appearance-none focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-colors"
                            >
                                <option value="ALL">Semua BP</option>
                                {BP_OPTIONS.map(bp => <option key={bp} value={bp}>{bp}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 my-6"></div>

                {/* Section 2: Column Visibility */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Paparan Kolum (Column Visibility)</div>
                        <div className="flex gap-2">
                            <button onClick={handleSelectAllColumns} className="text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                <Eye className="w-3 h-3" /> Semua
                            </button>
                            <button onClick={handleDeselectAllColumns} className="text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                <EyeOff className="w-3 h-3" /> Kosong
                            </button>
                            <button onClick={handleResetColumns} className="text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                <Layout className="w-3 h-3" /> Asal
                            </button>
                        </div>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {columnDefs.map(col => (
                                <label key={col.id} className="flex items-center gap-2 cursor-pointer group p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors select-none">
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${visibleColumns[col.id] ? 'bg-emerald-500 border-emerald-500' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 group-hover:border-emerald-400'}`}>
                                        {visibleColumns[col.id] && <Check className="w-3 h-3 text-white stroke-[3]" />}
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        className="hidden" 
                                        checked={visibleColumns[col.id]} 
                                        onChange={() => setVisibleColumns(prev => ({ ...prev, [col.id]: !prev[col.id] }))}
                                    />
                                    <span className={`text-[11px] font-bold truncate ${visibleColumns[col.id] ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}`}>{col.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
          )}
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="glass-effect rounded-3xl shadow-xl border border-white/20 dark:border-white/5 overflow-hidden min-h-[400px]">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm sticky top-0 z-20 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            {columnDefs.filter(c => visibleColumns[c.id]).map(col => (
                                <th key={col.id} className="px-6 py-4 text-left text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                                    {col.label}
                                </th>
                            ))}
                            <th className="px-6 py-4 w-16"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredProjects.map((project) => (
                            <tr 
                                key={project.id} 
                                onClick={() => onEditProject(project)}
                                className="group hover:bg-slate-50/80 dark:hover:bg-white/5 transition-all duration-200 cursor-pointer"
                            >
                                {/* 1. No Fail */}
                                {visibleColumns.noFail && (
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-bold text-slate-900 dark:text-white text-sm">{project.noFail}</div>
                                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{formatDate(project.tarikhBuka)}</div>
                                    </td>
                                )}

                                {/* 2. Nama Projek */}
                                {visibleColumns.namaProjek && (
                                    <td className="px-6 py-4 min-w-[300px]">
                                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                                            {project.namaProjek}
                                        </div>
                                    </td>
                                )}

                                {/* 3. PJA */}
                                {visibleColumns.pjaId && (
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                                {getPjaName(project.pjaId).charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{getPjaName(project.pjaId).toUpperCase()}</span>
                                        </div>
                                    </td>
                                )}

                                {/* 4. Aduan */}
                                {visibleColumns.noAduan && (
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 max-h-[100px] overflow-y-auto custom-scrollbar">
                                            {project.noAduan ? (
                                                project.noAduan.split(/[,;\n]/).map((aduan, idx) => {
                                                    const cleanAduan = aduan.trim();
                                                    if (!cleanAduan) return null;
                                                    return (
                                                        <div key={idx} className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                                                            {cleanAduan}
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <span className="text-xs text-slate-400">-</span>
                                            )}
                                        </div>
                                    </td>
                                )}

                                {/* 5. Lokasi */}
                                {visibleColumns.lokasi && (
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 max-h-[150px] overflow-y-auto custom-scrollbar min-w-[200px]">
                                            {project.lokasi ? (
                                                project.lokasi.split('\n').map((loc, idx) => {
                                                    const cleanLoc = loc.trim();
                                                    if (!cleanLoc) return null;
                                                    return (
                                                        <div key={idx} className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight mb-1">
                                                            {cleanLoc}
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <span className="text-xs text-slate-400">-</span>
                                            )}
                                        </div>
                                    </td>
                                )}

                                {/* 6. BP */}
                                {visibleColumns.bp && <td className="px-6 py-4 text-xs text-slate-500">{project.bp}</td>}
                                {/* 7. Zon */}
                                {visibleColumns.zon && <td className="px-6 py-4 text-xs text-slate-500">{project.zon}</td>}
                                {/* 8. Tarikh Buka */}
                                {visibleColumns.tarikhBuka && <td className="px-6 py-4 text-xs text-slate-500">{formatDate(project.tarikhBuka)}</td>}

                                {/* 9. Nama Syarikat */}
                                {visibleColumns.namaSyarikat && (
                                    <td className="px-6 py-4 min-w-[200px]">
                                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
                                            {project.namaSyarikat || <span className="text-slate-400 italic font-normal">Belum Lantik</span>}
                                        </div>
                                    </td>
                                )}

                                {/* 10. No Vote */}
                                {visibleColumns.noVote && <td className="px-6 py-4 text-xs text-slate-500">{project.noVote}</td>}
                                {/* 11. No Sebutharga */}
                                {visibleColumns.noSebutharga && <td className="px-6 py-4 text-xs text-slate-500">{project.noSebutharga}</td>}
                                {/* 12. No Inden */}
                                {visibleColumns.noInden && <td className="px-6 py-4 text-xs text-slate-500">{project.noInden}</td>}
                                {/* 13. No BPP */}
                                {visibleColumns.noBpp && <td className="px-6 py-4 text-xs text-slate-500">{project.noBpp}</td>}
                                {/* 14. Tempoh Kontrak */}
                                {visibleColumns.tempohKontrak && <td className="px-6 py-4 text-xs text-slate-500">{project.tempohKontrak}</td>}

                                {/* 15. Status */}
                                {visibleColumns.status && (
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border shadow-sm ${getStatusColor(project.status)} ${project.status === ProjectStatus.DALAM_PROSES ? 'animate-pulse' : ''}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${project.status === ProjectStatus.DALAM_PROSES ? 'bg-blue-500' : project.status === ProjectStatus.SIAP ? 'bg-emerald-500' : 'bg-yellow-500'}`}></span>
                                                {project.status.replace(/_/g, ' ')}
                                            </span>
                                            <CircularProgress value={project.peratusSiap || 0} size={30} strokeWidth={3} />
                                        </div>
                                    </td>
                                )}

                                {/* 17. Kos Projek */}
                                {visibleColumns.kosProjek && <td className="px-6 py-4 text-right text-xs font-bold text-emerald-600">{formatCurrency(project.kosProjek)}</td>}
                                {/* 18. Kos Sebenar */}
                                {visibleColumns.kosSebenar && <td className="px-6 py-4 text-right text-xs font-bold text-slate-600">{formatCurrency(project.kosSebenar)}</td>}
                                {/* 19. Wang Tahanan */}
                                {visibleColumns.wangTahanan && <td className="px-6 py-4 text-right text-xs font-bold text-slate-600">{formatCurrency(project.wangTahanan)}</td>}
                                {/* 20. LAD Amount */}
                                {visibleColumns.ladAmount && <td className="px-6 py-4 text-right text-xs font-bold text-red-500">{formatCurrency(project.ladAmount)}</td>}
                                {/* 21. LAD Days */}
                                {visibleColumns.ladDays && <td className="px-6 py-4 text-center text-xs text-slate-500">{project.ladDays || 0}</td>}
                                
                                {/* 22. Tarikh Lantikan */}
                                {visibleColumns.tarikhLantikan && <td className="px-6 py-4 text-xs text-slate-500">{formatDate(project.tarikhLantikan)}</td>}
                                {/* 23. Tarikh BPP */}
                                {visibleColumns.tarikhCetakanBpp && <td className="px-6 py-4 text-xs text-slate-500">{formatDate(project.tarikhCetakanBpp)}</td>}
                                {/* 24. Tarikh Mula Kontrak */}
                                {visibleColumns.tarikhMulaKontrak && <td className="px-6 py-4 text-xs text-slate-500">{formatDate(project.tarikhMulaKontrak)}</td>}
                                {/* 25. Tarikh Tamat Kontrak */}
                                {visibleColumns.tarikhTamatKontrak && <td className="px-6 py-4 text-xs text-slate-500">{formatDate(project.tarikhTamatKontrak)}</td>}
                                {/* 26. Tarikh Serah Tapak */}
                                {visibleColumns.tarikhSerahTapak && <td className="px-6 py-4 text-xs text-slate-500">{formatDate(project.tarikhSerahTapak)}</td>}
                                {/* 27. Tarikh Mula Kerja */}
                                {visibleColumns.tarikhMulaKerja && <td className="px-6 py-4 text-xs text-slate-500">{formatDate(project.tarikhMulaKerja)}</td>}
                                {/* 28. Tarikh Siap Sebenar */}
                                {visibleColumns.tarikhSiapSebenar && <td className="px-6 py-4 text-xs text-slate-500">{formatDate(project.tarikhSiapSebenar)}</td>}
                                
                                {/* 29. Tarikh Tuntutan */}
                                {visibleColumns.tarikhTuntutanBayaran && <td className="px-6 py-4 text-xs text-slate-500">{formatDate(project.tarikhTuntutanBayaran)}</td>}
                                {/* 30. Tarikh Hantar Kewangan */}
                                {visibleColumns.tarikhHantarKewangan && <td className="px-6 py-4 text-xs text-slate-500">{formatDate(project.tarikhHantarKewangan)}</td>}
                                {/* 31. Tarikh Padanan */}
                                {visibleColumns.tarikhPadanan && <td className="px-6 py-4 text-xs text-slate-500">{formatDate(project.tarikhPadanan)}</td>}
                                {/* 32. ISO */}
                                {visibleColumns.iso && <td className="px-6 py-4 text-xs text-slate-500">{project.iso}</td>}

                                {/* Actions */}
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onEditProject(project); }}
                                            className="p-2 bg-white dark:bg-slate-700 rounded-lg text-emerald-600 hover:bg-emerald-50 shadow-sm border border-slate-100 dark:border-slate-600"
                                        >
                                            <ArrowUpRight className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDeleteClick(project); }}
                                            className="p-2 bg-white dark:bg-slate-700 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 shadow-sm border border-slate-100 dark:border-slate-600"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredProjects.length === 0 && (
                            <tr>
                                <td colSpan={Object.keys(visibleColumns).length + 2} className="px-6 py-12 text-center text-slate-400 italic">
                                    Tiada projek ditemui dengan kriteria ini.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* Group View */}
      {viewMode === 'group' && (
          <div className="space-y-6">
             {Object.keys(groupedProjects).length === 0 && (
                <div className="text-center text-slate-400 italic py-12 glass-effect rounded-3xl">Tiada data syarikat untuk dipaparkan.</div>
             )}
             {Object.entries(groupedProjects).map(([company, data]) => (
                <div key={company} className="glass-effect bg-white/50 dark:bg-slate-800/40 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 shadow-md">
                   <div 
                      className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors gap-4"
                      onClick={() => toggleCompany(company)}
                   >
                      <div className="flex items-center gap-4">
                         <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-600 dark:text-emerald-400 shadow-inner">
                            <List className="w-6 h-6" />
                         </div>
                         <div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">{company}</h3>
                            <p className="text-sm text-slate-500 font-medium">{data.count} Projek &bull; Total: {formatCurrency(data.totalCost)}</p>
                         </div>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedCompanies[company] ? 'rotate-180' : ''}`} />
                   </div>

                   {expandedCompanies[company] && (
                      <div className="border-t border-slate-200 dark:border-white/5 animate-slide-down bg-white/40 dark:bg-slate-900/40">
                         <table className="w-full text-sm">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 dark:bg-white/5">
                               <tr>
                                  <th className="px-6 py-3 text-left">Tajuk Projek</th>
                                  <th className="px-6 py-3 text-right">Kos Asal</th>
                                  <th className="px-6 py-3 text-right">Kos Sebenar</th>
                                  <th className="px-6 py-3 w-10"></th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                               {data.projects.map(p => (
                                  <tr key={p.id} className="hover:bg-white/60 dark:hover:bg-white/5 cursor-pointer" onClick={() => onEditProject(p)}>
                                     <td className="px-6 py-3">
                                        <div className="font-medium text-slate-700 dark:text-slate-300">{p.namaProjek}</div>
                                        <div className="text-xs text-slate-400 font-mono">{p.noFail}</div>
                                     </td>
                                     <td className="px-6 py-3 text-right font-medium">{formatCurrency(p.kosProjek)}</td>
                                     <td className="px-6 py-3 text-right font-medium">{formatCurrency(p.kosSebenar)}</td>
                                     <td className="px-6 py-3 text-right">
                                        <ArrowUpRight className="w-4 h-4 text-slate-400 ml-auto" />
                                     </td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   )}
                </div>
             ))}
          </div>
      )}

      {/* Delete Modal */}
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
                     <span className="font-bold text-slate-900 dark:text-white block mt-1 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 whitespace-normal break-words text-left max-w-full">
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
