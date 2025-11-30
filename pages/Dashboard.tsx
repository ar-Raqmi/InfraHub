import React from 'react';
import { Project, ProjectStatus, User, formatCurrency, formatDate } from '../types';
import { Search, Bell, TrendingUp, Clock, AlertCircle, CheckCircle, Plus, Printer, ArrowRight, Activity, Zap, FileClock, Banknote } from 'lucide-react';

interface DashboardProps {
  projects: Project[];
  user: User;
  onProjectClick: (project: Project) => void;
  onNewProject: () => void;
  onNavigate: (page: string) => void;
  onProfileClick: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ projects, user, onProjectClick, onNewProject, onNavigate, onProfileClick }) => {
  // KPIs
  const totalValue = projects.reduce((acc, p) => acc + (p.kosProjek || 0), 0);
  
  // 4 Phase Counts
  const phase1 = projects.filter(p => p.status === ProjectStatus.MENUNGGU_LANTIKAN);
  const phase2 = projects.filter(p => p.status === ProjectStatus.DALAM_PROSES);
  const phase3 = projects.filter(p => p.status === ProjectStatus.TUNTUTAN_BAYARAN);
  const phase4 = projects.filter(p => p.status === ProjectStatus.SIAP);

  const recentProjects = [...projects].sort((a, b) => new Date(b.tarikhBuka).getTime() - new Date(a.tarikhBuka).getTime()).slice(0, 5);

  const handleDummyAction = (action: string) => {
    alert(`Fungsi '${action}' akan datang!`);
  };

  return (
    <div className="w-full">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 md:mb-10 gap-6">
        <div>
          <h1 className="text-2xl md:text-4xl tracking-tight gradient-text font-manrope font-bold mb-2">
            Selamat Pagi, {user.username.charAt(0).toUpperCase() + user.username.slice(1)} ✨
          </h1>
          <button 
            onClick={() => handleDummyAction('Ringkasan Mingguan')}
            className="flex items-center text-slate-500 dark:text-slate-400 group transition-all duration-300 hover:text-emerald-600"
          >
            <span className="text-sm md:text-base font-medium">Ringkasan projek minggu ini</span>
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center space-y-4 md:space-y-0 md:space-x-4 mt-2 lg:mt-0">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari projek, fail..." 
              className="pl-12 pr-4 py-3 w-full md:w-72 rounded-2xl border-0 glass-effect shadow-lg focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all duration-300 placeholder-slate-400 dark:text-white dark:placeholder-slate-500"
            />
          </div>
          <div className="flex items-center gap-4 justify-between md:justify-start">
             <button 
                onClick={() => onNavigate('inbox')}
                className="p-3 rounded-2xl glass-effect shadow-lg hover:shadow-xl transition-all duration-300 relative group transform hover:scale-105"
                title="Inbox / Notifikasi"
             >
                <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:text-emerald-600 transition-colors" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
             </button>
             <div onClick={onProfileClick} className="flex items-center space-x-3 glass-effect px-4 py-2 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
                   {user.username.substring(0,2).toUpperCase()}
                </div>
                <div className="block text-left">
                   <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">{user.fullName}</p>
                   <p className="text-xs text-slate-500 dark:text-slate-400 font-medium capitalize">{user.role.toLowerCase()}</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold gradient-text">Status Projek</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          
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
            <p className="text-xs text-blue-500 font-medium">Fasa 2 (Pelaksanaan)</p>
          </div>

          {/* Phase 3: Tuntutan Bayaran */}
          <div className="glass-effect rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 group transform hover:-translate-y-2 border border-white/20 dark:border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-300 bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg text-white">
              <Banknote className="w-6 h-6" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Tuntutan Bayaran</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{phase3.length}</p>
            <p className="text-xs text-orange-500 font-medium">Fasa 3 (Pembayaran)</p>
          </div>

          {/* Phase 4: Siap */}
          <div className="glass-effect rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 group transform hover:-translate-y-2 border border-white/20 dark:border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-300 bg-gradient-to-br from-green-500 to-green-600 shadow-lg text-white">
              <CheckCircle className="w-6 h-6" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Siap</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{phase4.length}</p>
            <p className="text-xs text-green-500 font-medium">Fasa 4 (Selesai)</p>
          </div>
        </div>
      </section>

      {/* Quick Actions & Recent Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        
        {/* Quick Actions */}
        <div className="glass-effect rounded-3xl p-6 shadow-xl border border-white/20 dark:border-white/5 flex flex-col justify-center">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Tindakan Pantas</h3>
            <div className="space-y-3">
              <button onClick={onNewProject} className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <Plus className="w-5 h-5" />
                    </div>
                    <span className="font-medium">Projek Baru</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => handleDummyAction('Laporan Bulanan')} className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <Printer className="w-5 h-5" />
                    </div>
                    <span className="font-medium">Laporan Bulanan</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
              </button>
            </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-effect rounded-3xl p-6 shadow-xl border border-white/20 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/30">
          <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500" /> Aktiviti Terkini
          </h4>
          <div className="space-y-4">
              {recentProjects.length > 0 ? recentProjects.slice(0,4).map((p, i) => (
                <div key={p.id} className="flex items-start gap-3 p-2 hover:bg-white/50 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer" onClick={() => onProjectClick(p)}>
                  <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${i === 0 ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                  <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-1">{p.namaProjek}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{p.noFail}</span>
                        <p className="text-xs text-slate-400">Dikemaskini</p>
                      </div>
                  </div>
                </div>
              )) : (
                <div className="text-sm text-slate-400 italic">Tiada aktiviti terkini.</div>
              )}
          </div>
        </div>
      </div>

      {/* Recent Projects Table */}
      <section className="animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
           <h2 className="text-xl md:text-2xl font-bold gradient-text">Projek Terkini</h2>
           <button 
             onClick={() => onNavigate('projects')} 
             className="text-emerald-600 hover:text-emerald-700 font-medium text-sm flex items-center gap-2 group"
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
                  {recentProjects.length > 0 ? recentProjects.map((project) => (
                    <tr 
                      key={project.id} 
                      onClick={() => onProjectClick(project)}
                      className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all duration-300 cursor-pointer"
                    >
                      <td className="px-6 md:px-8 py-5">
                         <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg text-white shrink-0 ${project.status === ProjectStatus.SIAP ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'}`}>
                               <Zap className="w-5 h-5" />
                            </div>
                            <div>
                               <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{project.namaProjek}</p>
                               <p className="text-sm text-slate-500 dark:text-slate-400">{project.noFail}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-medium text-slate-700 dark:text-slate-300">
                         {project.namaSyarikat || 'Belum dilantik'}
                      </td>
                      <td className="px-6 py-5">
                         <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold ${project.status === ProjectStatus.SIAP ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                            {project.status.replace(/_/g, ' ')}
                         </span>
                      </td>
                      <td className="px-6 py-5 text-right font-bold text-slate-900 dark:text-white">
                         {formatCurrency(project.kosProjek)}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-8 py-8 text-center text-slate-400 italic">
                        Tiada projek untuk dipaparkan bagi tahun ini.
                      </td>
                    </tr>
                  )}
               </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Dashboard;