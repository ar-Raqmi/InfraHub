import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Project, ProjectStatus, User, Role, formatCurrency, formatDate, BulletinItem, getStatusColor } from '../types';
import { supabaseService } from '../services/supabaseService';
import { Bell, TrendingUp, Clock, AlertCircle, CheckCircle, Plus, Printer, ArrowRight, Activity, Zap, FileClock, Banknote, ClipboardCheck, Megaphone, Trash2, PlusCircle, X, Filter, User as UserIcon, Calendar, HelpCircle, AlertTriangle, ChevronLeft, ChevronRight, BarChart3, PieChart } from 'lucide-react';

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
  
  const [tablePage, setTablePage] = useState(1);
  const itemsPerPage = 5;

  const isManagement = user.role === Role.ADMIN || user.role === Role.JURUTERA;

  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bulls, users] = await Promise.all([
          supabaseService.getBulletins(),
          supabaseService.getUsers()
        ]);
        setBulletins(bulls);
        setAllUsers(users);
        if (isManagement) {
          setAllPjas(users.filter(u => u.role === Role.PJA));
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      }
    };
    fetchData();
  }, [isManagement]);

  useEffect(() => {
    setTablePage(1);
  }, [pjaFilter]);

  const displayProjects = useMemo(() => {
    if (user.role === Role.PJA) {
      return projects.filter(p => p.pjaId === user.id);
    }
    if (pjaFilter !== 'ALL') {
      return projects.filter(p => p.pjaId === Number(pjaFilter));
    }
    return projects;
  }, [projects, user, pjaFilter]);

  const notificationCount = useMemo(() => {
    const now = new Date();
    
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

      if (now >= p1Date && !ignoredIds.includes(`p1-${p.id}`)) count++;
      if (now >= tamat && !ignoredIds.includes(`deadline-${p.id}`)) count++;
      if (now >= p2Date && !ignoredIds.includes(`p2-${p.id}`)) count++;
      if (now >= p3Date && !ignoredIds.includes(`p3-${p.id}`)) count++;
    });

    return count;
  }, [projects, user, projects.length]);

  const phase1 = displayProjects.filter(p => p.status === ProjectStatus.MENUNGGU_LANTIKAN);
  const phase2 = displayProjects.filter(p => p.status === ProjectStatus.DALAM_PROSES);
  const phase2b = displayProjects.filter(p => p.status === ProjectStatus.PEMERIKSAAN_TAPAK);
  const phase3 = displayProjects.filter(p => p.status === ProjectStatus.TUNTUTAN_BAYARAN);
  const phase4 = displayProjects.filter(p => p.status === ProjectStatus.SIAP);

  const ongoingProjects = useMemo(() => {
    return [...displayProjects]
      .filter(p => p.status !== ProjectStatus.SIAP)
      .sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.tarikhBuka).getTime();
        const timeB = new Date(b.updatedAt || b.tarikhBuka).getTime();
        return timeB - timeA;
      });
  }, [displayProjects]);

  const paginatedProjects = useMemo(() => {
    const startIndex = (tablePage - 1) * itemsPerPage;
    return ongoingProjects.slice(startIndex, startIndex + itemsPerPage);
  }, [ongoingProjects, tablePage]);

  const totalPages = Math.ceil(ongoingProjects.length / itemsPerPage);

  const handleAddBulletin = async () => {
    if (!newBulletinContent.trim()) return;
    const author = `${user.fullName.split(' ')[0]} (${user.role === Role.ADMIN ? 'PT' : 'JR'})`;
    try {
      const newItem = await supabaseService.addBulletin(newBulletinContent, author);
      setBulletins([newItem, ...bulletins].slice(0, 3));
      setNewBulletinContent('');
      setIsAddingBulletin(false);
    } catch (err) {
      console.error('Failed to add bulletin:', err);
    }
  };

  const confirmDeleteBulletin = async () => {
    if (!bulletinToDelete) return;
    try {
      await supabaseService.deleteBulletin(bulletinToDelete.id);
      setBulletins(prev => prev.filter(b => b.id !== bulletinToDelete.id));
      setBulletinToDelete(null);
    } catch (err) {
      console.error('Failed to delete bulletin:', err);
    }
  };

  return (
    <div className="w-full space-y-8 pb-20">
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="animate-fade-in-up">
          <h1 className="text-3xl md:text-4xl tracking-tight text-slate-900 dark:text-white font-manrope font-extrabold mb-2">
            Selamat Datang, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">{user.username.charAt(0).toUpperCase() + user.username.slice(1)}</span> ✨
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
        
        <div className="flex items-center gap-4 animate-fade-in-up delay-100">
          {isManagement && (
            <div className="relative group z-20">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Filter className="w-4 h-4 text-slate-400" />
              </div>
              <select 
                value={pjaFilter}
                onChange={(e) => setPjaFilter(e.target.value)}
                className="pl-10 pr-10 py-3 rounded-2xl border-0 glass-effect shadow-lg shadow-slate-200/50 dark:shadow-black/20 focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-slate-700 dark:text-white appearance-none cursor-pointer min-w-[200px] transition-all hover:shadow-xl"
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
            className="p-3 rounded-2xl glass-effect shadow-lg shadow-slate-200/50 dark:shadow-black/20 hover:shadow-xl transition-all duration-300 relative group transform hover:scale-105 active:scale-95"
            title="Inbox / Notifikasi"
          >
            <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:text-emerald-600 transition-colors" />
            {notificationCount > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full animate-pulse shadow-md border-2 border-white dark:border-slate-900">
                {notificationCount}
              </div>
            )}
          </button>
          
          <div onClick={onProfileClick} className="flex items-center space-x-3 glass-effect px-4 py-2 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-black/20 hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer active:scale-95">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0 overflow-hidden ring-2 ring-white dark:ring-slate-800">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                user.username.substring(0,2).toUpperCase()
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{user.fullName}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-wider uppercase">{user.role}</p>
            </div>
          </div>
        </div>
      </div>

      <section className="animate-fade-in-up delay-150 mb-8">
         <div className="flex items-center justify-between mb-4">
           <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
             <Megaphone className="w-5 h-5 text-orange-500" /> Buletin
           </h2>
           {isManagement && (
             <button 
               onClick={() => setIsAddingBulletin(!isAddingBulletin)}
               className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
               title="Tambah Info"
             >
               {isAddingBulletin ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
             </button>
           )}
         </div>

         {isAddingBulletin && (
            <div className="animate-slide-down mb-6">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-[2rem] border border-emerald-100 dark:border-emerald-900/30 shadow-xl shadow-emerald-500/10">
                 <textarea 
                   value={newBulletinContent}
                   onChange={(e) => setNewBulletinContent(e.target.value)}
                   className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white mb-3 placeholder-slate-400"
                   placeholder="Tulis maklumat..."
                   rows={3}
                   autoFocus
                 />
                 <button 
                   onClick={handleAddBulletin}
                   className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition-all active:scale-95"
                 >
                   Siarkan
                 </button>
              </div>
            </div>
          )}

         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {bulletins.length > 0 ? bulletins.slice(0, 3).map((item, idx) => (
             <div key={item.id} className="group bg-white dark:bg-slate-800 p-5 rounded-[2rem] shadow-lg shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-slate-700/50 transition-all hover:-translate-y-1 hover:shadow-xl relative overflow-hidden h-full flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-bl-[3rem] -mr-4 -mt-4 transition-all group-hover:scale-110"></div>
                
                <div>
                    <div className="flex items-center justify-between mb-3 relative z-10">
                       <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-lg">
                         {formatDate(item.date)}
                       </span>
                       {isManagement && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setBulletinToDelete(item); }}
                            className="text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                       )}
                    </div>
                    
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed mb-4 line-clamp-3 relative z-10">
                      {item.content}
                    </p>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-700/50 relative z-10 mt-auto">
                   <div className="flex items-center gap-2">
                      {(() => {
                        const bulletinUser = allUsers.find(u => {
                          const displayName = `${u.fullName.split(' ')[0]} (${u.role === Role.ADMIN ? 'PT' : 'JR'})`;
                          return displayName === item.author;
                        });
                        return (
                          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[8px] font-black text-slate-500 overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700">
                            {bulletinUser?.avatarUrl ? (
                              <img src={bulletinUser.avatarUrl} alt={item.author} className="w-full h-full object-cover" />
                            ) : (
                              item.author.charAt(0)
                            )}
                          </div>
                        );
                      })()}
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{item.author}</span>
                   </div>
                   <button 
                    onClick={() => setSelectedBulletin(item)}
                    className="text-[10px] font-bold text-emerald-600 hover:underline"
                  >
                    Baca
                  </button>
                </div>
             </div>
           )) : (
             <div className="col-span-3 p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-700">
               <p className="text-slate-400 text-sm italic">Tiada maklumat terkini.</p>
             </div>
           )}
         </div>
      </section>

      <section className="animate-fade-in-up delay-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-500" /> Status Projek
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 dark:shadow-black/30 hover:shadow-2xl transition-all duration-300 group transform hover:-translate-y-1 relative overflow-hidden border border-slate-100 dark:border-slate-700/50">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <FileClock className="w-24 h-24 text-slate-500" />
            </div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-slate-600 group-hover:text-white transition-colors duration-300">
              <FileClock className="w-7 h-7" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Fasa 1</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mb-1">{phase1.length}</p>
            <p className="text-xs text-slate-400 font-medium">Menunggu Lantikan</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 dark:shadow-black/30 hover:shadow-2xl transition-all duration-300 group transform hover:-translate-y-1 relative overflow-hidden border border-slate-100 dark:border-slate-700/50">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <Clock className="w-24 h-24 text-blue-500" />
            </div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
              <Clock className="w-7 h-7" />
            </div>
            <p className="text-sm text-blue-500/80 font-bold uppercase tracking-wider mb-1">Fasa 2</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mb-1">{phase2.length}</p>
            <p className="text-xs text-slate-400 font-medium">Dalam Proses</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 dark:shadow-black/30 hover:shadow-2xl transition-all duration-300 group transform hover:-translate-y-1 relative overflow-hidden border border-slate-100 dark:border-slate-700/50">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <ClipboardCheck className="w-24 h-24 text-indigo-500" />
            </div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-300">
              <ClipboardCheck className="w-7 h-7" />
            </div>
            <p className="text-sm text-indigo-500/80 font-bold uppercase tracking-wider mb-1">Fasa 2b</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mb-1">{phase2b.length}</p>
            <p className="text-xs text-slate-400 font-medium">Pemeriksaan Tapak</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 dark:shadow-black/30 hover:shadow-2xl transition-all duration-300 group transform hover:-translate-y-1 relative overflow-hidden border border-slate-100 dark:border-slate-700/50">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <Banknote className="w-24 h-24 text-orange-500" />
            </div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-orange-50 dark:bg-orange-900/20 text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
              <Banknote className="w-7 h-7" />
            </div>
            <p className="text-sm text-orange-500/80 font-bold uppercase tracking-wider mb-1">Fasa 3</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mb-1">{phase3.length}</p>
            <p className="text-xs text-slate-400 font-medium">Tuntutan Bayaran</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 dark:shadow-black/30 hover:shadow-2xl transition-all duration-300 group transform hover:-translate-y-1 relative overflow-hidden border border-slate-100 dark:border-slate-700/50">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <CheckCircle className="w-24 h-24 text-emerald-500" />
            </div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
              <CheckCircle className="w-7 h-7" />
            </div>
            <p className="text-sm text-emerald-500/80 font-bold uppercase tracking-wider mb-1">Fasa 4</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mb-1">{phase4.length}</p>
            <p className="text-xs text-slate-400 font-medium">Siap Sepenuhnya</p>
          </div>
        </div>
      </section>

      <div className="space-y-8">
        
        <div className="space-y-6 animate-fade-in-up delay-300">
           <div className="flex items-center justify-between">
             <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
               <BarChart3 className="w-5 h-5 text-emerald-500" /> Projek Terkini
             </h2>
             <button 
               onClick={() => onNavigate('projects')} 
               className="text-emerald-600 hover:text-emerald-700 font-bold text-sm flex items-center gap-2 group bg-white dark:bg-white/5 px-4 py-2 rounded-xl transition-all hover:shadow-lg border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900"
             >
                Lihat Semua <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
             </button>
           </div>

           <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-black/20 overflow-hidden border border-slate-100 dark:border-slate-700/50">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                 <thead className="bg-slate-50/80 dark:bg-slate-900/50">
                    <tr>
                       <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Projek</th>
                       <th className="px-6 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Kontraktor</th>
                       <th className="px-6 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                       <th className="px-8 py-6 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Kos (RM)</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedProjects.length > 0 ? paginatedProjects.map((project) => (
                      <tr 
                        key={project.id} 
                        onClick={() => onProjectClick(project)}
                        className="hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-all duration-300 cursor-pointer group"
                      >
                        <td className="px-8 py-5">
                           <div className="flex items-start gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg text-white shrink-0 mt-1 transition-transform group-hover:scale-110 ${project.status === ProjectStatus.SIAP ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 'bg-gradient-to-br from-blue-400 to-indigo-500'}`}>
                                 <Zap className="w-5 h-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                 <p className="font-bold text-slate-900 dark:text-white break-words leading-tight whitespace-normal group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{project.namaProjek}</p>
                                 <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400">{project.noFail}</span>
                                    {isManagement && pjaFilter === 'ALL' && (
                                      <span className="text-[10px] font-black text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">PJA: {allUsers.find(u => u.id === project.pjaId)?.username.toUpperCase()}</span>
                                    )}
                                 </div>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-5">
                           <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                             {project.namaSyarikat || <span className="text-slate-400 italic font-normal">Belum dilantik</span>}
                           </p>
                        </td>
                        <td className="px-6 py-5">
                           <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wide ${getStatusColor(project.status)}`}>
                              {project.status.replace(/_/g, ' ')}
                           </span>
                        </td>
                        <td className="px-8 py-5 text-right font-bold text-slate-900 dark:text-white font-mono tracking-tight">
                           {formatCurrency(project.kosProjek)}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="px-8 py-20 text-center">
                          <div className="flex flex-col items-center gap-4">
                             <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                               <Activity className="w-8 h-8 text-slate-300" />
                             </div>
                             <p className="text-slate-400 font-medium">Tiada projek berjalan untuk dipaparkan.</p>
                             <button onClick={onNewProject} className="text-emerald-600 font-bold text-sm hover:underline">Tambah Projek Baru</button>
                          </div>
                        </td>
                      </tr>
                    )}
                 </tbody>
              </table>
            </div>
            
            {ongoingProjects.length > itemsPerPage && (
              <div className="px-8 py-5 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                 <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span className="text-emerald-600 dark:text-emerald-400">{Math.min(ongoingProjects.length, (tablePage - 1) * itemsPerPage + 1)}</span> - <span className="text-emerald-600 dark:text-emerald-400">{Math.min(ongoingProjects.length, tablePage * itemsPerPage)}</span> dari <span className="text-slate-800 dark:text-white">{ongoingProjects.length}</span>
                 </div>
                 
                 <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setTablePage(prev => Math.max(1, prev - 1)); }}
                      disabled={tablePage === 1}
                      className={`p-2.5 rounded-xl border transition-all ${tablePage === 1 ? 'bg-slate-100 dark:bg-slate-800 text-slate-300 border-slate-100 dark:border-slate-700 cursor-not-allowed' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-emerald-500 hover:text-emerald-600 hover:shadow-md active:scale-95'}`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <div className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-xs font-black text-slate-700 dark:text-white shadow-sm">
                      {tablePage} / {totalPages}
                    </div>

                    <button 
                      onClick={(e) => { e.stopPropagation(); setTablePage(prev => Math.min(totalPages, prev + 1)); }}
                      disabled={tablePage === totalPages}
                      className={`p-2.5 rounded-xl border transition-all ${tablePage === totalPages ? 'bg-slate-100 dark:bg-slate-800 text-slate-300 border-slate-100 dark:border-slate-700 cursor-not-allowed' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-emerald-500 hover:text-emerald-600 hover:shadow-md active:scale-95'}`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                 </div>
              </div>
            )}
          </div>
        </div>



      </div>

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
                      {(() => {
                        const bulletinUser = allUsers.find(u => {
                          const displayName = `${u.fullName.split(' ')[0]} (${u.role === Role.ADMIN ? 'PT' : 'JR'})`;
                          return displayName === selectedBulletin.author;
                        });
                        return (
                          <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[8px] font-black text-slate-500 overflow-hidden ring-1 ring-slate-300 dark:ring-slate-600">
                            {bulletinUser?.avatarUrl ? (
                              <img src={bulletinUser.avatarUrl} alt={selectedBulletin.author} className="w-full h-full object-cover" />
                            ) : (
                              <UserIcon className="w-3 h-3" />
                            )}
                          </div>
                        );
                      })()}
                      {selectedBulletin.author}
                    </div>
                 </div>

                 <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-medium text-lg">
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

    </div>
  );
};

export default Dashboard;