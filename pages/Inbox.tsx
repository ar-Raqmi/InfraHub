import React, { useState, useMemo, useEffect } from 'react';
import { Project, ProjectStatus, Role, User } from '../types';
import { supabaseService } from '../services/supabaseService';
import { useUsers } from '../hooks/useUsers';
import { useProjects } from '../hooks/useProjects';
import { 
  AlertCircle, 
  Search, 
  Trash, 
  FileWarning, 
  FileText, 
  AlertTriangle,
  Zap,
  CheckCircle2,
  Inbox as InboxIcon,
  Trash2,
  Circle,
  History,
  Mail,
  ShieldAlert,
  User as UserIcon
} from 'lucide-react';

interface InboxProps {
  onProjectClick: (p: Project) => void;
}

interface TaskNotification {
  id: string;
  projectId: number;
  projectNoFail: string;
  projectName: string;
  type: 'DEADLINE' | 'PERINGATAN_1' | 'PERINGATAN_2' | 'PERINGATAN_3';
  title: string;
  message: string;
  date: string;
  severity: 'error' | 'warning' | 'info';
  status: ProjectStatus;
  pjaName: string;
  pjaId: number;
}

type FilterView = 'AKTIF' | 'SAMPAH';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const Inbox: React.FC<InboxProps> = ({ onProjectClick }) => {
  const { users: allUsers } = useUsers();
  const { projects } = useProjects();
  const user = supabaseService.getCurrentUser();

  const [selectedTask, setSelectedTask] = useState<TaskNotification | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<FilterView>('AKTIF');
  
  const [readIds, setReadIds] = useState<string[]>(() => JSON.parse(localStorage.getItem('infrahub_read_notifications') || '[]'));
  
  const [trashMap, setTrashMap] = useState<Record<string, number>>(() => 
    JSON.parse(localStorage.getItem('infrahub_trash_map_notifications') || '{}')
  );

  const [permanentIds, setPermanentIds] = useState<string[]>(() => 
    JSON.parse(localStorage.getItem('infrahub_permanent_notifications') || '[]')
  );

  // Auto-delete logic: Remove items from trash that are older than 7 days
  useEffect(() => {
    const now = Date.now();
    let hasChanged = false;
    const newTrashMap = { ...trashMap };
    const newPermanentIds = [...permanentIds];

    Object.entries(trashMap).forEach(([id, deletedAt]) => {
      if (now - (deletedAt as number) > SEVEN_DAYS_MS) {
        delete newTrashMap[id];
        if (!newPermanentIds.includes(id)) {
          newPermanentIds.push(id);
        }
        hasChanged = true;
      }
    });

    if (hasChanged) {
      setTrashMap(newTrashMap);
      setPermanentIds(newPermanentIds);
      localStorage.setItem('infrahub_trash_map_notifications', JSON.stringify(newTrashMap));
      localStorage.setItem('infrahub_permanent_notifications', JSON.stringify(newPermanentIds));
    }
  }, []);

  useEffect(() => { localStorage.setItem('infrahub_read_notifications', JSON.stringify(readIds)); }, [readIds]);
  useEffect(() => { localStorage.setItem('infrahub_trash_map_notifications', JSON.stringify(trashMap)); }, [trashMap]);
  useEffect(() => { localStorage.setItem('infrahub_permanent_notifications', JSON.stringify(permanentIds)); }, [permanentIds]);

  const notifications = useMemo(() => {
    if (!user) return [];
    
    const now = new Date();
    
    const filteredProjects = (user.role === Role.ADMIN || user.role === Role.JURUTERA)
      ? projects
      : projects.filter(p => p.pjaId === user.id);

    const generated: TaskNotification[] = [];

    filteredProjects.forEach(p => {
      if (p.status !== ProjectStatus.DALAM_PROSES || !p.tarikhTamatKontrak) return;

      const tamat = new Date(p.tarikhTamatKontrak);
      const pja = allUsers.find(u => u.id === p.pjaId);
      const pjaName = pja ? pja.username.toUpperCase() : 'PJA';

      // Peringatan 1: 7 days before
      const p1Date = new Date(tamat); p1Date.setDate(tamat.getDate() - 7);
      if (now >= p1Date) {
        generated.push({
          id: `p1-${p.id}`,
          projectId: p.id,
          projectNoFail: p.noFail,
          projectName: p.namaProjek,
          type: 'PERINGATAN_1',
          title: 'Notis Peringatan Pertama Diperlukan',
          message: `Projek akan tamat pada ${p.tarikhTamatKontrak.split('-').reverse().join('/')}. Sila jana dan hantar Notis Peringatan Pertama kepada kontraktor segera.`,
          date: p1Date.toISOString().split('T')[0],
          severity: 'warning',
          status: p.status,
          pjaName,
          pjaId: p.pjaId
        });
      }

      // Deadline
      if (now >= tamat) {
        generated.push({
          id: `deadline-${p.id}`,
          projectId: p.id,
          projectNoFail: p.noFail,
          projectName: p.namaProjek,
          type: 'DEADLINE',
          title: 'PROJEK TAMAT KONTRAK (BELUM SIAP)',
          message: `Tarikh tamat kontrak telah dicapai (${p.tarikhTamatKontrak.split('-').reverse().join('/')}) tetapi status masih dalam proses. Sila ambil tindakan segera.`,
          date: p.tarikhTamatKontrak,
          severity: 'error',
          status: p.status,
          pjaName,
          pjaId: p.pjaId
        });
      }

      // Peringatan 2: 1 week after
      const p2Date = new Date(tamat); p2Date.setDate(tamat.getDate() + 7);
      if (now >= p2Date) {
        generated.push({
          id: `p2-${p.id}`,
          projectId: p.id,
          projectNoFail: p.noFail,
          projectName: p.namaProjek,
          type: 'PERINGATAN_2',
          title: 'Notis Peringatan Kedua Diperlukan',
          message: `Projek telah lewat 1 minggu. Sila hantar Notis Peringatan Kedua dan kenakan denda LAD jika perlu.`,
          date: p2Date.toISOString().split('T')[0],
          severity: 'error',
          status: p.status,
          pjaName,
          pjaId: p.pjaId
        });
      }

      // Peringatan 3: 2 weeks after
      const p3Date = new Date(tamat); p3Date.setDate(tamat.getDate() + 14);
      if (now >= p3Date) {
        generated.push({
          id: `p3-${p.id}`,
          projectId: p.id,
          projectNoFail: p.noFail,
          projectName: p.namaProjek,
          type: 'PERINGATAN_3',
          title: 'Notis Peringatan Ketiga Diperlukan',
          message: `Projek telah lewat 2 minggu. Notis Peringatan Ketiga (Terakhir) perlu dikeluarkan serta-merta.`,
          date: p3Date.toISOString().split('T')[0],
          severity: 'error',
          status: p.status,
          pjaName,
          pjaId: p.pjaId
        });
      }
    });

    return generated
      .filter(n => {
        // Exclude permanently deleted items
        if (permanentIds.includes(n.id)) return false;

        const matchesSearch = n.projectNoFail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            n.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            n.title.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (!matchesSearch) return false;

        if (currentView === 'SAMPAH') return trashMap.hasOwnProperty(n.id);
        
        // Default Aktif view: Items NOT in trash
        return !trashMap.hasOwnProperty(n.id);
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [projects, user, searchTerm, readIds, trashMap, permanentIds, currentView, allUsers]);

  useEffect(() => {
    if (notifications.length > 0 && !selectedTask) {
      setSelectedTask(notifications[0]);
    } else if (notifications.length === 0) {
      setSelectedTask(null);
    }
  }, [notifications, currentView]);

  const toggleRead = (id: string) => {
    if (readIds.includes(id)) {
      setReadIds(prev => prev.filter(item => item !== id));
    } else {
      setReadIds(prev => [...prev, id]);
    }
  };

  const moveTaskToTrash = (id: string) => {
    setTrashMap(prev => ({ ...prev, [id]: Date.now() }));
    if (selectedTask?.id === id) {
      setSelectedTask(null);
    }
  };

  const restoreTaskFromTrash = (id: string) => {
    const newTrashMap = { ...trashMap };
    delete newTrashMap[id];
    setTrashMap(newTrashMap);
    if (selectedTask?.id === id) {
      setSelectedTask(null);
    }
  };

  const deletePermanently = (id: string) => {
    const newTrashMap = { ...trashMap };
    delete newTrashMap[id];
    setTrashMap(newTrashMap);
    setPermanentIds(prev => [...new Set([...prev, id])]);
    if (selectedTask?.id === id) {
      setSelectedTask(null);
    }
  };

  const handleOpenProject = () => {
    if (!selectedTask) return;
    const project = projects.find(p => p.id === selectedTask.projectId);
    if (project) {
      if (!readIds.includes(selectedTask.id)) {
          setReadIds(prev => [...prev, selectedTask.id]);
      }
      onProjectClick(project);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6 animate-fade-in">
      {/* Left List: Tugasan */}
      <div className="w-full md:w-[400px] bg-white/95  border border-white/10 shadow-xl rounded-[2.5rem] shadow-xl border border-white/20  overflow-hidden flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-xl font-bold text-slate-800">Inbox</h2>
             <div className="flex bg-slate-100  p-1 rounded-xl">
                 <button onClick={() => setCurrentView('AKTIF')} className={`p-1.5 rounded-lg transition-colors ${currentView === 'AKTIF' ? 'bg-white  text-emerald-600 shadow-sm' : 'text-slate-400'}`} title="Aktif"><InboxIcon className="w-4 h-4"/></button>
                 <button onClick={() => setCurrentView('SAMPAH')} className={`p-1.5 rounded-lg transition-colors ${currentView === 'SAMPAH' ? 'bg-white  text-red-600 shadow-sm' : 'text-slate-400'}`} title="Tong Sampah"><Trash2 className="w-4 h-4"/></button>
             </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari fail atau tajuk..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50  border-0 text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900  font-medium" 
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {notifications.length > 0 ? notifications.map(task => {
            const pja = allUsers.find(u => u.id === task.pjaId);
            return (
              <div 
                key={task.id} 
                                  onClick={() => setSelectedTask(task)}
                                  className={`p-5 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors relative ${selectedTask?.id === task.id ? 'bg-emerald-50/50 ring-1 ring-inset ring-emerald-500/20' : ''} ${!readIds.includes(task.id) ? 'bg-white' : 'opacity-70'}`}
                                >
                
                {selectedTask?.id === task.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>}
                
                <div className="flex justify-between items-start mb-2">
                                      <div className="flex items-center gap-2">
                                        {!readIds.includes(task.id) && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm"></div>}
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${task.severity === 'error' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                          {task.type.replace(/_/g, ' ')}
                                        </span>
                                      </div>
                  
                  <span className="text-[10px] font-bold text-slate-400 font-mono">{task.date.split('-').reverse().join('/')}</span>
                </div>
                
                                  <h4 className={`text-sm mb-1 line-clamp-1 ${!readIds.includes(task.id) ? 'font-black text-slate-900' : 'font-medium text-slate-600'}`}>
                                    {task.title}
                                  </h4>
                                <p className="text-xs text-slate-500  font-medium mb-3 truncate">
                  {task.projectNoFail} - {task.projectName}
                </p>

                <div className="flex items-center gap-2">
                   <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[8px] font-black text-white shrink-0 overflow-hidden shadow-sm">
                      {pja?.avatarUrl ? (
                          <img src={pja.avatarUrl} alt={pja.username} className="w-full h-full object-cover" />
                      ) : (
                          task.pjaName.charAt(0).toUpperCase()
                      )}
                   </div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">PJA: {task.pjaName}</span>
                </div>
              </div>
            );
          }) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
              <Mail className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm font-medium">Tiada tugasan dalam kategori ini.</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Content: Details */}
      <div className="flex-1 bg-white/95  border border-white/10 shadow-xl rounded-[2.5rem] shadow-xl border border-white/20  flex flex-col overflow-hidden">
        {selectedTask ? (
          <>
            <div className="p-6 border-b border-slate-100  flex justify-between items-center bg-white/50">
              <div className="flex gap-2">
                {currentView === 'SAMPAH' ? (
                  <>
                    <button 
                      onClick={() => restoreTaskFromTrash(selectedTask.id)} 
                      className="p-2.5 rounded-xl transition-colors shadow-sm bg-white  border border-slate-100  text-emerald-600 hover:bg-emerald-50" 
                      title="Pulihkan ke Inbox"
                    >
                      <History className="w-5 h-5"/>
                    </button>
                    <button 
                      onClick={() => deletePermanently(selectedTask.id)} 
                      className="p-2.5 rounded-xl transition-colors shadow-sm bg-white  border border-slate-100  text-red-600 hover:bg-red-50" 
                      title="Padam Selamanya"
                    >
                      <Trash2 className="w-5 h-5"/>
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => moveTaskToTrash(selectedTask.id)} 
                    className="p-2.5 rounded-xl transition-colors shadow-sm bg-white  border border-slate-100  text-slate-400 hover:text-red-500 hover:bg-red-50" 
                    title="Pindah ke Tong Sampah"
                  >
                    <Trash className="w-5 h-5"/>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-4">
                 <div className="text-right hidden sm:block">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sistem InfraHub</p>
                   <p className="text-xs font-bold text-slate-600">Automated Alert</p>
                 </div>
                 <button onClick={() => toggleRead(selectedTask.id)} className={`p-2.5 rounded-xl transition-colors bg-white  border border-slate-100  ${readIds.includes(selectedTask.id) ? 'text-emerald-600' : 'text-slate-400'}`} title="Tanda Telah Baca/Belum Baca">
                    {readIds.includes(selectedTask.id) ? <CheckCircle2 className="w-5 h-5"/> : <Circle className="w-5 h-5"/>}
                 </button>
              </div>
            </div>

            <div className="p-10 flex-1 overflow-y-auto">
              <div className="max-w-3xl">
                {currentView === 'SAMPAH' && (
                  <div className="mb-6 p-4 bg-red-50  border border-red-100  rounded-2xl flex items-center gap-3">
                    <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
                    <p className="text-xs text-red-600  font-medium">
                      Item di dalam tong sampah akan dipadam secara automatik selepas 7 hari.
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-4 mb-8">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg ${selectedTask.severity === 'error' ? 'bg-gradient-to-br from-red-500 to-rose-600' : 'bg-gradient-to-br from-orange-500 to-amber-600'}`}>
                    {selectedTask.severity === 'error' ? <FileWarning className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-slate-900  leading-tight mb-1">{selectedTask.title}</h1>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-emerald-600 bg-emerald-50  px-3 py-1 rounded-lg border border-emerald-100  uppercase">{selectedTask.projectNoFail}</span>
                      <span className="text-xs text-slate-400 font-medium">Dijana secara automatik pada {selectedTask.date.split('-').reverse().join('/')}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50  p-8 rounded-[2rem] border border-slate-100  mb-10 shadow-inner">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Butiran Projek</span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-800  mb-6 leading-relaxed uppercase">
                    {selectedTask.projectName}
                  </h3>

                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status Projek</p>
                      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700   text-xs font-bold uppercase tracking-wider">
                        {selectedTask.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">PJA</p>
                      {(() => {
                          const pja = allUsers.find(u => u.id === selectedTask.pjaId);
                          return (
                              <div className="flex items-center gap-2 mt-1">
                                  <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-[10px] font-black text-white shrink-0 overflow-hidden shadow-sm">
                                      {pja?.avatarUrl ? (
                                          <img src={pja.avatarUrl} alt={pja.username} className="w-full h-full object-cover" />
                                      ) : (
                                          selectedTask.pjaName.charAt(0).toUpperCase()
                                      )}
                                  </div>
                                  <p className="text-sm font-bold text-slate-700">{selectedTask.pjaName}</p>
                              </div>
                          );
                      })()}
                    </div>
                  </div>

                  <div className="prose  max-w-none text-slate-600  leading-loose">
                    <p className="font-medium">{selectedTask.message}</p>
                    <p className="mt-4 italic text-sm">Sila layari modul Projek untuk mengemaskini maklumat atau menjana notis PDF yang berkaitan untuk dihantar kepada pihak kontraktor melalui emel atau serahan tangan.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => toggleRead(selectedTask.id)}
                    className="flex-1 py-4 bg-slate-900  text-white  rounded-2xl font-bold text-sm shadow-xl flex items-center justify-center gap-3 transition-colors hover:scale-[1.02]"
                  >
                    {readIds.includes(selectedTask.id) ? (
                        <><Circle className="w-5 h-5" /> Tandakan Belum Baca</>
                    ) : (
                        <><CheckCircle2 className="w-5 h-5" /> Tanda Telah Baca</>
                    )}
                  </button>
                  <button 
                    onClick={handleOpenProject}
                    className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-xl flex items-center justify-center gap-3 transition-colors hover:scale-[1.02]"
                  >
                    <FileText className="w-5 h-5" /> Buka Fail Projek
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/50">
            <div className="w-24 h-24 bg-white  rounded-[2rem] shadow-xl flex items-center justify-center mb-6">
              <Zap className="w-10 h-10 text-emerald-500 opacity-20" />
            </div>
            <h3 className="text-xl font-bold text-slate-600">Pilih Tugasan</h3>
            <p className="text-sm max-w-xs mt-2">Pilih tugasan dari senarai di sebelah kiri untuk melihat butiran dan tindakan yang perlu diambil.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inbox;