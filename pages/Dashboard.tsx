
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Project, ProjectStatus, User, Role, formatCurrency, formatDate, BulletinItem, getStatusColor } from '../types';
import { mockService } from '../services/mockService';
import { Bell, TrendingUp, Clock, AlertCircle, CheckCircle, Plus, Printer, ArrowRight, Activity, Zap, FileClock, Banknote, ClipboardCheck, Megaphone, Trash2, PlusCircle, X, Filter, User as UserIcon, Calendar, HelpCircle, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

interface DashboardProps {
  projects: Project[];
  user: User;
  onProjectClick: (project: Project) => void;
  onNewProject: () => void;
  onNavigate: (page: string) => void;
  onProfileClick: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ projects, user, onProjectClick, onNewProject, onNavigate, onProfileClick }) => {
  const [bulletins, setBulletins] = useState<BulletinItem[]>([]);
  const [isAddingBulletin, setIsAddingBulletin] = useState(false);
  const [newBulletinContent, setNewBulletinContent] = useState('');
  const [selectedBulletin, setSelectedBulletin] = useState<BulletinItem | null>(null);
  const [bulletinToDelete, setBulletinToDelete] = useState<BulletinItem | null>(null);
  const [pjaFilter, setPjaFilter] = useState<string>('ALL');
  const [allPjas, setAllPjas] = useState<User[]>([]);
  
  // Table Pagination State
  const [tablePage, setTablePage] = useState(1);
  const itemsPerPage = 5;

  const isManagement = user.role === Role.ADMIN || user.role === Role.JURUTERA;

  useEffect(() => {
    setBulletins(mockService.getBulletins());
    if (isManagement) {
      setAllPjas(mockService.getUsers().filter(u => u.role === Role.PJA));
    }
  }, [isManagement]);

  // Reset page when filter changes
  useEffect(() => {
    setTablePage(1);
  }, [pjaFilter]);

  // Role-Based Project Filtering Logic
  const displayProjects = useMemo(() => {
    if (user.role === Role.PJA) {
      return projects.filter(p => p.pjaId === user.id);
    }
    if (pjaFilter !== 'ALL') {
      return projects.filter(p => p.pjaId === Number(pjaFilter));
    }
    return projects;
  }, [projects, user, pjaFilter]);

  // Notification Count Logic (Respecting Read/Deleted status)
  const notificationCount = useMemo(() => {
    const now = new Date();
    
    // Load state from localStorage
    const read = JSON.parse(localStorage.getItem('infrahub_read_notifications') || '[]');
    const deleted = JSON.parse(localStorage.getItem('infrahub_deleted_notifications') || '[]');
    const ignoredIds = [...read, ...deleted];

    const relevantProjects = (user.role === Role.ADMIN || user.role === Role.JURUTERA) 
      ? projects 
      : projects.filter(p => p.pjaId === user.id);

    let count = 0;

    relevantProjects.forEach(p => {
      if (p.status !== ProjectStatus.DALAM_PROSES || !p.tarikhTamatKontrak) return;
      
      const tamat = new Date(p.tarikhTamatKontrak);
      const p1Date = new Date(tamat); p1Date.setDate(tamat.getDate() - 7);
      const p2Date = new Date(tamat); p2Date.setDate(tamat.getDate() + 7);
      const p3Date = new Date(tamat); p3Date.setDate(tamat.getDate() + 14);

      // Rule 1: Peringatan 1 (7 days before)
      if (now >= p1Date && !ignoredIds.includes(`p1-${p.id}`)) count++;
      
      // Rule 2: Deadline
      if (now >= tamat && !ignoredIds.includes(`deadline-${p.id}`)) count++;

      // Rule 3: Peringatan 2 (7 days after)
      if (now >= p2Date && !ignoredIds.includes(`p2-${p.id}`)) count++;

      // Rule 4: Peringatan 3 (14 days after)
      if (now >= p3Date && !ignoredIds.includes(`p3-${p.id}`)) count++;
    });

    return count;
  }, [projects, user, projects.length]); // Use length as a simple dependency for updates

  // Metrics based on filtered data
  const phase1 = displayProjects.filter(p => p.status === ProjectStatus.MENUNGGU_LANTIKAN);
  const phase2 = displayProjects.filter(p => p.status === ProjectStatus.DALAM_PROSES);
  const phase2b = displayProjects.filter(p => p.status === ProjectStatus.PEMERIKSAAN_TAPAK);
  const phase3 = displayProjects.filter(p => p.status === ProjectStatus.TUNTUTAN_BAYARAN);
  const phase4 = displayProjects.filter(p => p.status === ProjectStatus.SIAP);

  // Ongoing Projects (Sorted by Recent Activity)
  const ongoingProjects = useMemo(() => {
    return [...displayProjects]
      .filter(p => p.status !== ProjectStatus.SIAP)
      .sort((a, b) => {
        // Prioritize updatedAt, fallback to tarikhBuka
        const timeA = new Date(a.updatedAt || a.tarikhBuka).getTime();
        const timeB = new Date(b.updatedAt || b.tarikhBuka).getTime();
        return timeB - timeA;
      });
  }, [displayProjects]);

  // Paginated Projects for Table
  const paginatedProjects = useMemo(() => {
    const startIndex = (tablePage - 1) * itemsPerPage;
    return ongoingProjects.slice(startIndex, startIndex + itemsPerPage);
  }, [ongoingProjects, tablePage]);

  const totalPages = Math.ceil(ongoingProjects.length / itemsPerPage);

  const handleAddBulletin = async () => {
    if (!newBulletinContent.trim()) return;
    const author = `${user.fullName.split(' ')[0]} (${user.role === Role.ADMIN ? 'PT' : 'JR'})`;
    const newItem = await mockService.addBulletin(newBulletinContent, author);
    
    // Auto delete the fourth one locally to maintain a max of 3
    setBulletins([newItem, ...bulletins].slice(0, 3));
    
    setNewBulletinContent('');
    setIsAddingBulletin(false);
  };

  const confirmDeleteBulletin = async () => {
    if (!bulletinToDelete) return;
    await mockService.deleteBulletin(bulletinToDelete.id);
    setBulletins(prev => prev.filter(b => b.id !== bulletinToDelete.id));
    setBulletinToDelete(null);
  };

  return (
    <div className="w-full space-y-8 pb-10">
      
      {/* Header & Role-Based Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-4xl tracking-tight gradient-text font-manrope font-bold mb-2">
            Selamat Datang, {user.username.charAt(0).toUpperCase() + user.username.slice(1)} ✨
          </h1>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium">
              {user.role === Role.PJA 
                ? 'Paparan projek peribadi anda' 
                : pjaFilter === 'ALL' ? 'Paparan keseluruhan jabatan' : `Paparan projek seliaan PJA ${allPjas.find(p => p.id === Number(pjaFilter))?.username.toUpperCase()}`}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {isManagement && (
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Filter className="w-4 h-4 text-slate-400" />
              </div>
              <select 
                value={pjaFilter}
                onChange={(e) => setPjaFilter(e.target.value)}
                className="pl-10 pr-10 py-3 rounded-2xl border-0 glass-effect shadow-lg focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-slate-700 dark:text-white appearance-none cursor-pointer min-w-[200px]"
              >
                <option value="ALL">Semua Pegawai (PJA)</option>
                {allPjas.map(p => (
                  <option key={p.id} value={p.id}>PJA: {p.username.toUpperCase()}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>
            </div>
          )}
          
          <button 
            onClick={() => onNavigate('inbox')}
            className="p-3 rounded-2xl glass-effect shadow-lg hover:shadow-xl transition-all duration-300 relative group transform hover:scale-105"
            title="Inbox / Notifikasi"
          >
            <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:text-emerald-600 transition-colors" />
            {notificationCount > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full animate-pulse shadow-md border-2 border-white dark:border-slate-900">
                {notificationCount}
              </div>
            )}
          </button>
          
          <div onClick={onProfileClick} className="flex items-center space-x-3 glass-effect px-4 py-2 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0 overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                user.username.substring(0,2).toUpperCase()
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">{user.fullName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium capitalize">{user.role.toLowerCase()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Maklumat Terkini (Bulletin Board) */}
      <section className="animate-fade-in-up">
        <div className="flex items-center justify-between mb-4 px-2">
           <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
             <Megaphone className="w-5 h-5 text-orange-500" /> Maklumat Terkini
           </h2>
           {isManagement && (
             <button 
               onClick={() => setIsAddingBulletin(!isAddingBulletin)}
               className="text-xs font-bold flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-xl transition-all"
             >
               {isAddingBulletin ? <X className="w-3.5 h-3.5" /> : <PlusCircle className="w-3.5 h-3.5" />}
               {isAddingBulletin ? 'Batal' : 'Tambah Info'}
             </button>
           )}
        </div>

        {isAddingBulletin && (
          <div className="mb-6 animate-slide-down">
            <div className="glass-effect p-4 rounded-3xl border border-emerald-200 dark:border-emerald-800 shadow-xl">
               <textarea 
                 value={newBulletinContent}
                 onChange={(e) => setNewBulletinContent(e.target.value)}
                 className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white mb-3"
                 placeholder="Tulis maklumat atau peringatan baru di sini..."
                 rows={3}
                 autoFocus
               />
               <div className="flex justify-end">
                 <button 
                   onClick={handleAddBulletin}
                   className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-emerald-700 transition-all active:scale-95"
                 >
                   Siarkan Maklumat
                 </button>
               </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {bulletins.length > 0 ? bulletins.slice(0, 3).map(item => (
             <div key={item.id} className="relative group glass-effect p-5 rounded-3xl border border-white/20 dark:border-white/5 shadow-lg overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-1">
                <div className="absolute top-0 right-0 p-3 flex gap-1 z-50">
                  {isManagement && (
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBulletinToDelete(item);
                      }} 
                      className="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(item.date)}</span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed mb-4 line-clamp-3">
                  {item.content}
                </p>
                <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                   <span className="text-[10px] font-bold text-slate-400 italic">Oleh: {item.author}</span>
                   <button 
                    onClick={() => setSelectedBulletin(item)}
                    className="text-[10px] font-bold text-emerald-600 hover:underline active:scale-95 transition-transform"
                  >
                    Baca Lanjut
                  </button>
                </div>
             </div>
           )) : (
             <div className="col-span-full py-10 text-center glass-effect rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
               <p className="text-slate-400 text-sm italic">Tiada maklumat terkini buat masa ini.</p>
             </div>
           )}
        </div>
      </section>

      {/* Bulletin Detail Modal */}
      {selectedBulletin && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in" onClick={() => setSelectedBulletin(null)}>
          <div 
            className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 transform scale-100 transition-all animate-slide-up relative" 
            onClick={e => e.stopPropagation()}
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                   <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-orange-600">
                      <Megaphone className="w-6 h-6" />
                   </div>
                   <h3 className="font-bold text-slate-900 dark:text-white text-xl">Butiran Maklumat</h3>
                </div>
                <button onClick={() => setSelectedBulletin(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                 <div className="flex flex-wrap gap-4 text-xs font-bold">
                    <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-700">
                      <Calendar className="w-3.5 h-3.5" /> {formatDate(selectedBulletin.date)}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-700">
                      <UserIcon className="w-3.5 h-3.5" /> {selectedBulletin.author}
                    </div>
                 </div>

                 <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-medium">
                       {selectedBulletin.content}
                    </p>
                 </div>

                 <button 
                  onClick={() => setSelectedBulletin(null)}
                  className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold transition-all hover:bg-emerald-600 dark:hover:bg-emerald-50 shadow-xl"
                 >
                   Tutup Paparan
                 </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Bulletin Delete Confirmation Modal */}
      {bulletinToDelete && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setBulletinToDelete(null)}>
            <div 
              className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-8 border border-slate-200 dark:border-slate-700 transform scale-100 transition-all animate-slide-up relative" 
              onClick={e => e.stopPropagation()}
            >
                <div className="flex flex-col items-center text-center">
                   <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6 text-red-500 animate-pulse-slow">
                      <div className="w-14 h-14 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 stroke-[1.5]" />
                      </div>
                   </div>

                   <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 font-manrope">
                     Padam Maklumat?
                   </h3>
                   
                   <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm leading-relaxed px-4">
                     Adakah anda pasti mahu memadam maklumat ini secara kekal daripada dashboard?
                   </p>
                   
                   <div className="flex gap-3 w-full">
                      <button 
                        onClick={() => setBulletinToDelete(null)}
                        className="flex-1 py-3.5 px-4 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-600 transition-all border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md"
                      >
                        Batal
                      </button>
                      <button 
                        onClick={confirmDeleteBulletin}
                        className="flex-1 py-3.5 px-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg bg-red-600 hover:bg-red-700 shadow-red-600/30 active:scale-95"
                      >
                         <Trash2 className="w-4 h-4" />
                         Ya, Padam
                      </button>
                   </div>
                </div>
            </div>
        </div>,
        document.body
      )}

      {/* KPI Cards */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">Status Kerja Semasa</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
          {/* Phase 1: Menunggu Lantikan */}
          <div className="glass-effect rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 group transform hover:-translate-y-2 border border-white/20 dark:border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-500/10 to-gray-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-300 bg-gradient-to-br from-slate-500 to-slate-600 shadow-lg text-white">
              <FileClock className="w-6 h-6" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Menunggu Lantikan</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{phase1.length}</p>
            <p className="text-xs text-slate-400 font-medium">Fasa 1</p>
          </div>

          {/* Phase 2: Dalam Proses */}
          <div className="glass-effect rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 group transform hover:-translate-y-2 border border-white/20 dark:border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-300 bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg text-white">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Dalam Proses</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{phase2.length}</p>
            <p className="text-xs text-blue-500 font-medium">Fasa 2</p>
          </div>

          {/* Phase 2b: Pemeriksaan Tapak */}
          <div className="glass-effect rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 group transform hover:-translate-y-2 border border-white/20 dark:border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-300 bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg text-white">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Pemeriksaan Tapak</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{phase2b.length}</p>
            <p className="text-xs text-indigo-500 font-medium">Fasa 2b</p>
          </div>

          {/* Phase 3: Tuntutan Bayaran */}
          <div className="glass-effect rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 group transform hover:-translate-y-2 border border-white/20 dark:border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-300 bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg text-white">
              <Banknote className="w-6 h-6" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Tuntutan Bayaran</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{phase3.length}</p>
            <p className="text-xs text-orange-500 font-medium">Fasa 3</p>
          </div>

          {/* Phase 4: Siap */}
          <div className="glass-effect rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 group transform hover:-translate-y-2 border border-white/20 dark:border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-300 bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg text-white">
              <CheckCircle className="w-6 h-6" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Siap</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{phase4.length}</p>
            <p className="text-xs text-emerald-500 font-medium">Fasa 4</p>
          </div>
        </div>
      </section>

      {/* Recent Projects Table */}
      <section className="animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
           <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">Projek Sedang Berjalan</h2>
           <button 
             onClick={() => onNavigate('projects')} 
             className="text-emerald-600 hover:text-emerald-700 font-bold text-sm flex items-center gap-2 group bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl transition-all"
           >
              Lihat semua <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
           </button>
        </div>

        <div className="glass-effect rounded-3xl shadow-xl border border-white/20 dark:border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
               <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                  <tr>
                     <th className="px-6 md:px-8 py-5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Projek / No. Fail</th>
                     <th className="px-6 py-5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kontraktor</th>
                     <th className="px-6 py-5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                     <th className="px-6 py-5 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kos (RM)</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedProjects.length > 0 ? paginatedProjects.map((project) => (
                    <tr 
                      key={project.id} 
                      onClick={() => onProjectClick(project)}
                      className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all duration-300 cursor-pointer"
                    >
                      <td className="px-6 md:px-8 py-5">
                         <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg text-white shrink-0 mt-1 ${project.status === ProjectStatus.SIAP ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'}`}>
                               <Zap className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                               <p className="font-bold text-slate-900 dark:text-white break-words leading-tight whitespace-normal">{project.namaProjek}</p>
                               <div className="flex items-center gap-2 mt-1">
                                  <p className="text-sm text-slate-500 dark:text-slate-400 shrink-0">{project.noFail}</p>
                                  {isManagement && pjaFilter === 'ALL' && (
                                    <span className="text-[10px] font-black text-slate-400 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded shrink-0">PJA: {mockService.getUsers().find(u => u.id === project.pjaId)?.username.toUpperCase()}</span>
                                  )}
                               </div>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-medium text-slate-700 dark:text-slate-300">
                         {project.namaSyarikat || 'Belum dilantik'}
                      </td>
                      <td className="px-6 py-5">
                         <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(project.status)}`}>
                            {project.status.replace(/_/g, ' ')}
                         </span>
                      </td>
                      <td className="px-6 py-5 text-right font-bold text-slate-900 dark:text-white">
                         {formatCurrency(project.kosProjek)}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                           <Activity className="w-12 h-12 text-slate-200" />
                           <p className="text-slate-400 italic text-sm">Tiada projek berjalan untuk dipaparkan dalam kriteria ini.</p>
                        </div>
                      </td>
                    </tr>
                  )}
               </tbody>
            </table>
          </div>
          
          {/* Pagination Bar */}
          {ongoingProjects.length > itemsPerPage && (
            <div className="px-6 md:px-8 py-4 bg-slate-50/30 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
               <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Menunjukkan <span className="text-emerald-600 dark:text-emerald-400">{Math.min(ongoingProjects.length, (tablePage - 1) * itemsPerPage + 1)}</span> hingga <span className="text-emerald-600 dark:text-emerald-400">{Math.min(ongoingProjects.length, tablePage * itemsPerPage)}</span> daripada <span className="text-emerald-600 dark:text-emerald-400">{ongoingProjects.length}</span> projek
               </div>
               
               <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setTablePage(prev => Math.max(1, prev - 1)); }}
                    disabled={tablePage === 1}
                    className={`p-2 rounded-xl border transition-all ${tablePage === 1 ? 'bg-slate-100 dark:bg-slate-800 text-slate-300 border-slate-100 dark:border-slate-700 cursor-not-allowed' : 'bg-white dark:bg-slate-800 text-emerald-600 border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:shadow-md active:scale-95'}`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <div className="px-4 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-700 dark:text-white">
                    Muka {tablePage} dari {totalPages}
                  </div>

                  <button 
                    onClick={(e) => { e.stopPropagation(); setTablePage(prev => Math.min(totalPages, prev + 1)); }}
                    disabled={tablePage === totalPages}
                    className={`p-2 rounded-xl border transition-all ${tablePage === totalPages ? 'bg-slate-100 dark:bg-slate-800 text-slate-300 border-slate-100 dark:border-slate-700 cursor-not-allowed' : 'bg-white dark:bg-slate-800 text-emerald-600 border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:shadow-md active:scale-95'}`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
               </div>
            </div>
          )}
        </div>
      </section>

    </div>
  );
};

export default Dashboard;
