import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Project, ProjectStatus, User, Role, formatCurrency, formatDate, BulletinItem } from '../types';
import { apiService } from '../services/apiService';
import { useBulletins } from '../hooks/useBulletins';
import { useUsers } from '../hooks/useUsers';
import { TrendingUp, AlertCircle, Plus, Printer, ArrowRight, Activity, Zap, Megaphone, Trash2, PlusCircle, X, Filter, User as UserIcon, Calendar, HelpCircle, AlertTriangle, ChevronLeft, ChevronRight, BarChart3, PieChart, Loader2, Search } from 'lucide-react';
import StatusTiles from '../components/dash/StatusTiles';
import ProjectCard from '../components/dash/ProjectCard';
import MobilePager from '../components/dash/MobilePager';
import MobileBulletins from '../components/dash/MobileBulletins';
import { StatusChip, NoticeChip } from '../components/dash/StatusChip';
import EmptyProjects from '../components/dash/EmptyProjects';
import { useInView } from '../components/dash/useInView';

const getPendingNotice = (project: Project): string | null => {
  if (project.status === ProjectStatus.SIAP || project.isTiadaNotisDiperlukan || !project.tarikhTamatKontrak) {
    return null;
  }

  let todayVal = 0;
  if (project.tarikhPemeriksaan) {
    const checkVal = new Date(project.tarikhPemeriksaan).getTime();
    if (!isNaN(checkVal)) {
      todayVal = checkVal;
    }
  }
  if (!todayVal) {
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' });
    todayVal = new Date(todayStr).getTime();
  }

  const tamatVal = new Date(project.tarikhTamatKontrak).getTime();
  if (isNaN(tamatVal)) return null;

  const oneDayMs = 24 * 60 * 60 * 1000;
  const p1Time = tamatVal - (7 * oneDayMs);
  const p2Time = tamatVal + (7 * oneDayMs);
  const p3Time = tamatVal + (14 * oneDayMs);

  // Check from highest severity to lowest
  if (todayVal >= p3Time) {
    if (project.notisPeringatan3Status === 'PENDING' || !project.notisPeringatan3Status) {
      return 'Notis Ketiga';
    }
  }
  if (todayVal >= p2Time) {
    if (project.notisPeringatan2Status === 'PENDING' || !project.notisPeringatan2Status) {
      return 'Notis Kedua';
    }
  }
  if (todayVal >= tamatVal) {
    if (project.perakuanKerjaTidakSiapStatus === 'PENDING' || !project.perakuanKerjaTidakSiapStatus) {
      return 'Kerja Tidak Siap';
    }
  }
  if (todayVal >= p1Time) {
    if (project.notisPeringatan1Status === 'PENDING' || !project.notisPeringatan1Status) {
      return 'Notis Pertama';
    }
  }

  return null;
};

interface DashboardProps {
  projects: Project[];
  user: User;
  onProjectClick: (project: Project) => void;
  onNewProject: () => void;
  onNavigate: (page: string) => void;
  onProfileClick: () => void;
  onUpdateProject: (params: { id: number; updates: Partial<Project> }) => Promise<any>;
}

const Dashboard: React.FC<DashboardProps> = ({ projects, user, onProjectClick, onNewProject, onNavigate, onProfileClick, onUpdateProject }) => {
  const { bulletins, addBulletin, deleteBulletin, markAsRead, toggleReaction, isSyncing: isBulletinSyncing } = useBulletins();
  const { users: allUsers, isSyncing: isUserSyncing } = useUsers();

  const [isAddingBulletin, setIsAddingBulletin] = useState(false);
  const [newBulletinContent, setNewBulletinContent] = useState('');
  const [selectedBulletin, setSelectedBulletin] = useState<BulletinItem | null>(null);
  const [bulletinToDelete, setBulletinToDelete] = useState<BulletinItem | null>(null);
  const [pjaFilter, setPjaFilter] = useState<string>('ALL');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'ALL'>('ALL');
  const [tablePage, setTablePage] = useState(1);
  const itemsPerPage = 5;



  // Long press detection refs
  const longPressTimer = React.useRef<any>(null);
  const isLongPress = React.useRef(false);

  const handleMouseDown = () => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
    }, 500);
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleMouseLeave = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleDashboardProjectClick = (project: Project) => {
    if (!isLongPress.current) {
      onProjectClick(project);
    }
  };

  const isManagement = user.role === Role.ADMIN || user.role === Role.JURUTERA;

  const allPjas = useMemo(() => {
    return allUsers.filter(u => u.role === Role.PJA);
  }, [allUsers]);

  useEffect(() => {
    setTablePage(1);
  }, [pjaFilter, searchQuery, statusFilter]);

  const displayProjects = useMemo(() => {
    if (user.role === Role.PJA) {
      return projects.filter(p => p.pjaId === user.id);
    }
    if (pjaFilter !== 'ALL') {
      return projects.filter(p => p.pjaId === Number(pjaFilter));
    }
    return projects;
  }, [projects, user, pjaFilter]);



  const filteredProjects = useMemo(() => {
    return displayProjects.filter(p => {
      // 1. Search filter
      const matchesSearch =
        (p.namaProjek || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.noFail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.noAduan || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.namaSyarikat || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // 2. Status filter
      if (statusFilter === 'ALL') {
        return p.status !== ProjectStatus.SIAP;
      }
      return p.status === statusFilter;
    }).sort((a, b) => {
      const timeA = new Date(a.tarikhBuka).getTime();
      const timeB = new Date(b.tarikhBuka).getTime();
      return timeB - timeA;
    });
  }, [displayProjects, searchQuery, statusFilter]);

  const paginatedProjects = useMemo(() => {
    const startIndex = (tablePage - 1) * itemsPerPage;
    return filteredProjects.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProjects, tablePage]);

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const pageFrom = Math.min(filteredProjects.length, (tablePage - 1) * itemsPerPage + 1);
  const pageTo = Math.min(filteredProjects.length, tablePage * itemsPerPage);
  const pjaName = (project: Project) => allUsers.find(u => u.id === project.pjaId)?.username.toUpperCase();

  const clearFilters = () => { setSearchQuery(''); setStatusFilter('ALL'); };

  const projectListRef = React.useRef<HTMLDivElement>(null);
  const isProjectListInView = useInView(projectListRef);

  const handleAddBulletin = async () => {
    if (!newBulletinContent.trim()) return;
    const author = `${user.fullName.split(' ')[0]} (${user.role === Role.ADMIN ? 'PT' : 'JR'})`;
    try {
      await addBulletin({ content: newBulletinContent, author });
      setNewBulletinContent('');
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

  const handleMarkAsRead = async (item: BulletinItem) => {
    setSelectedBulletin(item);
    if (!item.readBy?.includes(user.id)) {
      try {
        await markAsRead({ id: item.id, userId: user.id });
      } catch (err) {
        console.error('Failed to mark as read:', err);
      }
    }
  };

  const editorRef = React.useRef<HTMLDivElement>(null);

  const handleFormat = (command: string, value: string | undefined = undefined) => {
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setNewBulletinContent(editorRef.current.innerHTML);
    }
  };

  const handleProgressUpdate = async (project: Project, newProgress: string) => {
    const progress = Math.min(100, Math.max(0, parseInt(newProgress) || 0));
    if (progress === project.peratusSiap) return;

    try {
      await onUpdateProject({
        id: project.id,
        updates: { peratusSiap: progress }
      });
    } catch (error) {
      console.error("Failed to update progress", error);
    }
  };

  const REACTION_EMOJIS = ['👍', '😊', '😠', '❤️', '🔥', '👏'];

  const BulletinCard = ({
    item,
    isRead,
    onDelete,
    onRead,
    onToggleReaction,
    isAdmin
  }: {
    item: BulletinItem;
    isRead: boolean;
    onDelete?: () => void;
    onRead?: () => void;
    onToggleReaction?: (emoji: string) => void;
    isAdmin?: boolean;
  }) => {
    const bulletinUser = allUsers.find(u => {
      const displayName = `${u.fullName.split(' ')[0]} (${u.role === Role.ADMIN ? 'PT' : 'JR'})`;
      return displayName === item.author;
    });

    return (
      <div className={`group bg-white p-6 rounded-3xl shadow-sm border transition-all hover:shadow-xl hover:-translate-y-1 relative h-full flex flex-col justify-between ${!isRead ? 'border-red-200 bg-red-50/20' : 'border-slate-100'}`}>
        <div>
          <div className="flex items-center justify-between mb-5 relative z-10">
            <div className="flex items-center gap-2.5">
              {!isRead && (
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </div>
              )}
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${!isRead ? 'text-red-600' : 'text-slate-400'}`}>
                {formatDate(item.date)}
              </span>
            </div>
            {isAdmin && onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-slate-300 hover:text-red-500 transition-colors p-1 bg-slate-50 rounded-lg hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div
            className="text-sm text-slate-700 font-medium leading-[1.6] mb-6 line-clamp-4 relative z-10 bulletin-content"
            dangerouslySetInnerHTML={{ __html: item.content || '<span class="text-slate-300 italic">Tiada kandungan...</span>' }}
          />
        </div>

        <div className="space-y-4 relative z-10">
          {REACTION_EMOJIS.some(emoji => (item.reactions?.[emoji]?.length || 0) > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {REACTION_EMOJIS.map(emoji => {
                const count = item.reactions?.[emoji]?.length || 0;
                const hasReacted = item.reactions?.[emoji]?.includes(user.id);
                if (count === 0) return null;
                return (
                  <button
                    key={emoji}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleReaction?.(emoji);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs transition-all border ${hasReacted ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-100 hover:border-slate-200 text-slate-500'}`}
                  >
                    <span className="text-sm">{emoji}</span>
                    {count > 0 && <span className="font-bold text-[10px]">{count}</span>}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100/60">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 overflow-hidden ring-1 ring-slate-100">
                {bulletinUser?.avatarUrl ? (
                  <img src={bulletinUser.avatarUrl} alt={item.author} className="w-full h-full object-cover" />
                ) : (
                  item.author.charAt(0)
                )}
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item.author}</span>
            </div>
            {onRead && (
              <button
                onClick={onRead}
                className={`text-[10px] font-bold transition-all px-3 py-1.5 rounded-xl border ${!isRead ? 'bg-slate-900 text-white border-slate-900 hover:bg-emerald-600 hover:border-emerald-600' : 'text-slate-500 bg-white border-slate-100 hover:bg-slate-50 hover:text-emerald-600'}`}
              >
                {isRead ? 'Lihat' : 'Baca Penuh'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-8 pb-20 animate-fade-in">

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl tracking-tight text-slate-900  font-manrope font-extrabold mb-2">
            Selamat Datang, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">{(user.username || 'Pengguna').charAt(0).toUpperCase() + (user.username || 'Pengguna').slice(1)}</span> ✨
          </h1>
          <div className="flex items-center gap-2 text-slate-500">
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
            <div className="relative group z-20">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Filter className="w-4 h-4 text-slate-400" />
              </div>
              <select
                value={pjaFilter}
                onChange={(e) => setPjaFilter(e.target.value)}
                className="pl-10 pr-10 py-3 rounded-2xl border border-slate-200  bg-white  shadow-lg shadow-slate-200/50  focus:ring-2 focus:ring-emerald-500 text-sm max-md:text-base font-bold text-slate-700  appearance-none cursor-pointer min-w-[200px] transition-shadow hover:shadow-xl"
              >
                <option value="ALL">Semua Pegawai (PJA)</option>
                {allPjas.map(p => (
                  <option key={p.id} value={p.id}>PJA: {p.username.toUpperCase()}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              </div>
            </div>
          )}



          <div onClick={onProfileClick} className="flex items-center space-x-3 bg-white  border border-slate-200  px-4 py-2 rounded-2xl shadow-lg shadow-slate-200/50  hover:shadow-xl transition-shadow cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0 overflow-hidden ring-2 ring-white">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                (user.username || '??').substring(0, 2).toUpperCase()
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-bold text-slate-900  line-clamp-1">{user.fullName}</p>
              <p className="text-[10px] text-slate-500  font-bold tracking-wider uppercase">{user.role}</p>
            </div>
          </div>
        </div>
      </div>

      <section className="animate-fade-in mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800  flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-orange-500" /> Buletin
          </h2>
          {isManagement && (
            <button
              onClick={() => setIsAddingBulletin(!isAddingBulletin)}
              className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors max-md:w-11 max-md:h-11 max-md:flex max-md:items-center max-md:justify-center"
              title="Tambah Info"
              aria-label="Tambah Info"
            >
              {isAddingBulletin ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          )}
        </div>

        {isAddingBulletin && (
          <div className="animate-slide-up mb-12 max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/40">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
                    <PlusCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Cipta Buletin Baru</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Buletin kepada semua pengguna</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                  <button
                    onClick={() => handleFormat('bold')}
                    className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-sm font-black hover:bg-slate-100 shadow-sm transition-all active:scale-90"
                    title="Bold"
                  >
                    B
                  </button>
                  <button
                    onClick={() => handleFormat('italic')}
                    className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-sm italic font-serif hover:bg-slate-100 shadow-sm transition-all active:scale-90"
                    title="Italic"
                  >
                    I
                  </button>
                  <div className="w-px h-6 bg-slate-200 mx-1"></div>
                  <button
                    onClick={() => handleFormat('fontSize', '5')}
                    className="px-3 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-100 shadow-sm transition-all active:scale-95"
                  >
                    Besar
                  </button>
                  <button
                    onClick={() => handleFormat('fontSize', '3')}
                    className="px-3 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-100 shadow-sm transition-all active:scale-95"
                  >
                    Kecil
                  </button>
                  <div className="w-px h-6 bg-slate-200 mx-1"></div>
                  <div className="flex gap-1.5 px-1.5">
                    <button onClick={() => handleFormat('foreColor', '#ef4444')} className="w-6 h-6 rounded-full bg-red-500 border-2 border-white shadow-sm hover:scale-110 transition-transform" title="Merah"></button>
                    <button onClick={() => handleFormat('foreColor', '#3b82f6')} className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-sm hover:scale-110 transition-transform" title="Biru"></button>
                    <button onClick={() => handleFormat('foreColor', '#10b981')} className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white shadow-sm hover:scale-110 transition-transform" title="Hijau"></button>
                    <button onClick={() => handleFormat('foreColor', '#000000')} className="w-6 h-6 rounded-full bg-black border-2 border-white shadow-sm hover:scale-110 transition-transform" title="Hitam"></button>
                  </div>
                </div>
              </div>

              <div className="relative group mb-8">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-[2rem] blur-xl opacity-50 group-focus-within:opacity-100 transition-opacity"></div>
                <div className="relative bg-white border-2 border-slate-100 rounded-[2rem] overflow-hidden group-focus-within:border-emerald-500/50 transition-colors">
                  <div className="p-8 pb-12">
                    <div className="flex items-center gap-2.5 mb-6">
                      <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </div>
                      <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded-md">
                        BULETIN BARU
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-auto">
                        {formatDate(new Date().toISOString())}
                      </span>
                    </div>

                    <div
                      ref={editorRef}
                      contentEditable
                      onInput={(e) => setNewBulletinContent(e.currentTarget.innerHTML)}
                      className="min-h-[150px] outline-none text-slate-700 font-medium leading-[1.6] text-lg bulletin-content"
                    />

                    {!newBulletinContent && (
                      <div className="absolute top-[88px] left-8 pointer-events-none text-slate-300 italic text-lg">
                        Taip maklumat anda di sini... Gunakan toolbar di atas untuk format teks.
                      </div>
                    )}

                    <div className="mt-12 flex items-center justify-between pt-6 border-t border-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 ring-1 ring-slate-100">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            (user.fullName || 'U').charAt(0)
                          )}
                        </div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                          {user.fullName.split(' ')[0]} ({user.role === Role.ADMIN ? 'PT' : 'JR'})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setIsAddingBulletin(false);
                    setNewBulletinContent('');
                  }}
                  className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleAddBulletin}
                  disabled={!newBulletinContent || newBulletinContent === '<br>'}
                  className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Megaphone className="w-4 h-4" />
                  Siarkan Maklumat Sekarang
                </button>
              </div>
            </div>
          </div>
        )}

        {bulletins.length > 0 && (
          <MobileBulletins
            bulletins={bulletins.slice(0, 3)}
            userId={user.id}
            isAdmin={isManagement}
            onRead={handleMarkAsRead}
            onDelete={setBulletinToDelete}
          />
        )}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${bulletins.length > 0 ? 'max-md:hidden' : ''}`}>
          {bulletins.length > 0 ? bulletins.slice(0, 3).map((item) => (
            <BulletinCard
              key={item.id}
              item={item}
              isRead={item.readBy?.includes(user.id) || false}
              onDelete={() => setBulletinToDelete(item)}
              onRead={() => handleMarkAsRead(item)}
              onToggleReaction={(emoji) => toggleReaction({ id: item.id, userId: user.id, emoji })}
              isAdmin={isManagement}
            />
          )) : (
            <div className="col-span-3 p-12 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-300">
                <Megaphone className="w-8 h-8" />
              </div>
              <p className="text-slate-400 font-medium">Tiada maklumat terkini untuk dipaparkan.</p>
            </div>
          )}
        </div>
      </section>

      <section className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800  flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-500" /> Status Projek
          </h2>
          {statusFilter !== 'ALL' && (
            <button
              onClick={() => setStatusFilter('ALL')}
              className="text-xs font-bold text-emerald-600 hover:underline max-md:min-h-[44px]"
            >
              Lihat Semua Projek Aktif
            </button>
          )}
        </div>

        <StatusTiles
          projects={displayProjects}
          statusFilter={statusFilter}
          onToggle={(status) => setStatusFilter(statusFilter === status ? 'ALL' : status)}
        />
      </section>

      <div className="space-y-8">

        <div ref={projectListRef} className="space-y-6 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-800  flex items-center gap-2 min-w-0">
                <BarChart3 className="w-5 h-5 text-emerald-500 shrink-0" />
                {statusFilter === 'ALL' ? 'Projek Aktif' : `Projek: ${statusFilter.replace(/_/g, ' ')}`}
              </h2>
              <button
                onClick={() => onNavigate('projects')}
                className="md:hidden h-11 shrink-0 flex items-center gap-1.5 text-emerald-700 font-bold text-sm"
              >
                Lihat Semua <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-full md:w-64">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <BarChart3 className="w-4 h-4 text-slate-400 max-md:hidden" />
                  <Search className="w-5 h-5 text-slate-400 md:hidden" />
                </div>
                <input
                  type="text"
                  placeholder="Cari No. Fail / Aduan / Tajuk / Syarikat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-sm outline-none max-md:h-12 max-md:text-base max-md:pl-11"
                />
              </div>

              {filteredProjects.length > 0 && (
                <div className="flex items-center gap-3 max-md:hidden">
                  <div className="hidden lg:block text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                    <span className="text-emerald-600">{pageFrom}</span>-{pageTo} <span className="text-slate-400 font-medium mx-1">/</span> {filteredProjects.length}
                  </div>

                  {filteredProjects.length > itemsPerPage && (
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                      <button
                        onClick={() => setTablePage(prev => Math.max(1, prev - 1))}
                        disabled={tablePage === 1}
                        className={`p-1 rounded-lg transition-colors ${tablePage === 1 ? 'text-slate-300' : 'text-slate-600 hover:bg-slate-100 hover:text-emerald-600'}`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] font-black text-slate-700 min-w-[40px] text-center">
                        {tablePage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setTablePage(prev => Math.min(totalPages, prev + 1))}
                        disabled={tablePage === totalPages}
                        className={`p-1 rounded-lg transition-colors ${tablePage === totalPages ? 'text-slate-300' : 'text-slate-600 hover:bg-slate-100 hover:text-emerald-600'}`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => onNavigate('projects')}
                className="text-emerald-600 hover:text-emerald-700 font-bold text-sm flex items-center gap-2 group bg-white  px-4 py-2 rounded-xl transition-shadow hover:shadow-lg border border-transparent hover:border-emerald-100 max-md:hidden"
              >
                Lihat Semua <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onNewProject}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group max-md:hidden"
              >
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                <span className="text-xs font-bold tracking-tight whitespace-nowrap">Tambah Projek</span>
              </button>
            </div>
          </div>

          <div className="md:hidden space-y-3">
            {paginatedProjects.length > 0 ? paginatedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                pjaName={isManagement && pjaFilter === 'ALL' ? pjaName(project) : undefined}
                pendingNotice={getPendingNotice(project)}
                onOpen={() => handleDashboardProjectClick(project)}
                onProgressCommit={(value) => handleProgressUpdate(project, value)}
              />
            )) : (
              <div className="bg-white rounded-2xl border border-slate-200 px-6 py-12">
                <EmptyProjects onClear={clearFilters} />
              </div>
            )}
            {filteredProjects.length > 0 && (
              <MobilePager
                page={tablePage}
                totalPages={totalPages}
                from={pageFrom}
                to={pageTo}
                total={filteredProjects.length}
                onPrev={() => setTablePage(prev => Math.max(1, prev - 1))}
                onNext={() => setTablePage(prev => Math.min(totalPages, prev + 1))}
              />
            )}
          </div>

          <div className="hidden md:block bg-white  rounded-[2.5rem] shadow-xl shadow-slate-200/50  overflow-hidden border border-slate-100">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Projek</th>
                    <th className="px-6 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Kontraktor</th>
                    <th className="px-6 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-4 py-6 text-center text-xs font-black text-slate-400 uppercase tracking-widest">Kemajuan (%)</th>
                    <th className="px-8 py-6 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Kos (RM)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedProjects.length > 0 ? paginatedProjects.map((project) => (
                    <tr
                      key={project.id}
                      onMouseDown={handleMouseDown}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseLeave}
                      onClick={() => handleDashboardProjectClick(project)}
                      className="hover:bg-emerald-50/30  transition-colors cursor-pointer group"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg text-white shrink-0 mt-1 transition-transform group- ${project.status === ProjectStatus.SIAP ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 'bg-gradient-to-br from-blue-400 to-indigo-500'}`}>
                            <Zap className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900  break-words leading-tight whitespace-normal group-hover:text-emerald-600  transition-colors">{project.namaProjek}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[20px] font-black bg-slate-100  px-2 py-0.5 rounded text-slate-500">{project.noFail}</span>
                              {isManagement && pjaFilter === 'ALL' && (
                                <span className="text-[15px] font-black text-slate-400 px-1.5 py-0.5 rounded border border-slate-200">PJA: {pjaName(project)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-semibold text-slate-700">
                          {project.namaSyarikat || <span className="text-slate-400 italic font-normal">Belum dilantik</span>}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1.5 items-start">
                          <StatusChip status={project.status} />
                          {(() => {
                            const pendingNotice = getPendingNotice(project);
                            return pendingNotice && <NoticeChip notice={pendingNotice} />;
                          })()}
                        </div>
                      </td>
                      <td className="px-4 py-5 text-center">
                        <div className="relative inline-block w-20 group/input">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            defaultValue={project.peratusSiap || 0}
                            onBlur={(e) => handleProgressUpdate(project, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur();
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-center bg-slate-50 border border-transparent hover:border-slate-200 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-200 rounded-lg py-1.5 text-sm font-bold text-slate-700 outline-none transition-all"
                          />
                          <span className="absolute right-2 top-1.5 text-xs font-medium text-slate-400 pointer-events-none group-focus-within/input:hidden">%</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right font-bold text-slate-900  font-mono tracking-tight">
                        {formatCurrency(project.kosProjek)}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                        <EmptyProjects onClear={clearFilters} />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>



      </div>

      {isProjectListInView && (
        <button
          onClick={onNewProject}
          className="md:hidden fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 h-14 px-5 flex items-center gap-2 rounded-2xl bg-emerald-600 text-white font-bold text-sm border border-emerald-700 active:bg-emerald-700"
        >
          <Plus className="w-5 h-5" />
          Tambah Projek
        </button>
      )}

      {
        selectedBulletin && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 animate-fade-in" onClick={() => setSelectedBulletin(null)}>
            <div
              className="bg-white rounded-[2.5rem] shadow-2xl max-w-xl w-full border border-slate-200 animate-slide-up relative max-h-[90vh] overflow-y-auto custom-scrollbar"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-100  rounded-2xl flex items-center justify-center text-orange-600">
                      <Megaphone className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-900  text-xl">Butiran Maklumat</h3>
                  </div>
                  <button onClick={() => setSelectedBulletin(null)} className="p-2 hover:bg-slate-100  rounded-full text-slate-400 transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-wrap gap-4 text-xs font-bold">
                    <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50  px-3 py-1.5 rounded-full border border-slate-100">
                      <Calendar className="w-3.5 h-3.5" /> {formatDate(selectedBulletin.date)}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50  px-3 py-1.5 rounded-full border border-slate-100">
                      {(() => {
                        const bulletinUser = allUsers.find(u => {
                          const displayName = `${u.fullName.split(' ')[0]} (${u.role === Role.ADMIN ? 'PT' : 'JR'})`;
                          return displayName === selectedBulletin.author;
                        });
                        return (
                          <div className="w-4 h-4 rounded-full bg-slate-200  flex items-center justify-center text-[8px] font-black text-slate-500 overflow-hidden ring-1 ring-slate-300">
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

                  <div className="bg-slate-50  p-6 rounded-3xl border border-slate-100">
                    <div
                      className="text-slate-800 leading-relaxed whitespace-pre-wrap font-medium text-lg bulletin-content"
                      dangerouslySetInnerHTML={{ __html: selectedBulletin.content }}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {REACTION_EMOJIS.map(emoji => {
                      const count = selectedBulletin.reactions?.[emoji]?.length || 0;
                      const hasReacted = selectedBulletin.reactions?.[emoji]?.includes(user.id);
                      return (
                        <button
                          key={emoji}
                          onClick={() => toggleReaction({ id: selectedBulletin.id, userId: user.id, emoji })}
                          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-lg transition-all ${hasReacted ? 'bg-emerald-100 border-2 border-emerald-500 scale-110' : 'bg-white border border-slate-200 hover:bg-slate-50'}`}
                        >
                          <span>{emoji}</span>
                          {count > 0 && <span className="font-bold text-sm">{count}</span>}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setSelectedBulletin(null)}
                    className="w-full py-4 bg-slate-900  text-white  rounded-2xl font-bold transition-colors hover:bg-emerald-600  shadow-xl"
                  >
                    Tutup Paparan
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      }

      {
        bulletinToDelete && createPortal(
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 animate-fade-in" onClick={() => setBulletinToDelete(null)}>
            <div
              className="bg-white  rounded-3xl shadow-2xl max-w-md w-full p-8 border border-slate-200  animate-slide-up relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-red-50  rounded-full flex items-center justify-center mb-6 text-red-500">
                  <div className="w-14 h-14 bg-red-100  rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 stroke-[1.5]" />
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-slate-900  mb-2 font-manrope">
                  Padam Maklumat?
                </h3>

                <p className="text-slate-500  mb-8 text-sm leading-relaxed px-4">
                  Adakah anda pasti mahu memadam maklumat ini secara kekal daripada dashboard?
                </p>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setBulletinToDelete(null)}
                    className="flex-1 py-3.5 px-4 bg-white  text-slate-700  rounded-xl font-bold hover:bg-slate-50  transition-colors border border-slate-200  shadow-sm hover:shadow-md"
                  >
                    Batal
                  </button>
                  <button
                    onClick={confirmDeleteBulletin}
                    className="flex-1 py-3.5 px-4 rounded-xl font-bold text-white transition-colors flex items-center justify-center gap-2 shadow-lg bg-red-600 hover:bg-red-700 shadow-red-600/30"
                  >
                    <Trash2 className="w-4 h-4" />
                    Ya, Padam
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      }

    </div >
  );
};

export default Dashboard;