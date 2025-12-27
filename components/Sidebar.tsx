import React from 'react';
import { Home, FolderKanban, Users, Image as ImageIcon, LogOut, Settings, Hexagon } from 'lucide-react';
import { Role } from '../types';
import ThemeToggle from './ThemeToggle';

interface SidebarProps {
  role: Role;
  onNavigate: (page: string) => void;
  currentPage: string;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ role, onNavigate, currentPage, onLogout }) => {
  
  const navItemClass = (page: string) => `
    p-3 rounded-2xl transition-all duration-300 group relative
    ${currentPage === page 
      ? 'text-white bg-emerald-600 shadow-emerald-500/30 shadow-lg scale-105' 
      : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-white/5 hover:scale-110'}
  `;

  const mobileNavItemClass = (page: string) => `
    flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 relative group
    ${currentPage === page 
      ? 'text-emerald-600 -translate-y-2' 
      : 'text-slate-400 hover:text-emerald-600 active:scale-95'}
  `;

  return (
    <>
      <aside className="hidden md:flex fixed z-30 inset-y-6 left-6 w-20 glass-effect rounded-[2.5rem] flex-col items-center py-8 border border-white/40 dark:border-white/5 shadow-2xl transition-all duration-500 hover:shadow-emerald-500/10">
        
        <div className="mb-10 transition-all duration-300 cursor-pointer animate-float">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30">
            <Hexagon className="w-7 h-7 fill-current" />
          </div>
        </div>

        <div className="flex flex-col space-y-4 w-full px-3 items-center flex-1">
          
          <button onClick={() => onNavigate('dashboard')} className={navItemClass('dashboard')} title="Utama">
            <Home className="w-6 h-6" strokeWidth={1.5} />
            {currentPage === 'dashboard' && <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-400/50 blur-sm rounded-l-full"></span>}
          </button>

          <button onClick={() => onNavigate('projects')} className={navItemClass('projects')} title="Projek">
            <FolderKanban className="w-6 h-6" strokeWidth={1.5} />
          </button>

          <button onClick={() => onNavigate('users')} className={navItemClass('users')} title="Pengguna">
            <Users className="w-6 h-6" strokeWidth={1.5} />
          </button>

          <button onClick={() => onNavigate('report')} className={navItemClass('report')} title="Laporan">
            <ImageIcon className="w-6 h-6" strokeWidth={1.5} />
          </button>

        </div>

        <div className="mt-auto flex flex-col space-y-4 w-full px-3 items-center">
          <ThemeToggle className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-white/5 transition-all duration-300" />
          
          {role === Role.ADMIN && (
            <button onClick={() => onNavigate('settings')} className={navItemClass('settings')} title="Tetapan">
              <Settings className="w-6 h-6" strokeWidth={1.5} />
            </button>
          )}
          
          <div className="h-px w-10 bg-slate-200 dark:bg-white/10 my-2"></div>

          <button onClick={onLogout} className="p-3 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 group relative" title="Log Keluar">
            <LogOut className="w-6 h-6 group-hover:-translate-x-1 transition-transform" strokeWidth={1.5} />
          </button>
        </div>

      </aside>

      <nav className="md:hidden fixed z-50 bottom-6 inset-x-4 h-20 glass-effect border border-white/40 dark:border-white/5 rounded-[2rem] flex items-center justify-evenly shadow-2xl shadow-emerald-900/20">
          <button onClick={() => onNavigate('dashboard')} className={mobileNavItemClass('dashboard')}>
            <div className={`p-2 rounded-xl transition-all ${currentPage === 'dashboard' ? 'bg-emerald-100 dark:bg-emerald-900/30' : ''}`}>
               <Home className={`w-6 h-6 ${currentPage === 'dashboard' ? 'fill-current' : ''}`} strokeWidth={1.5} />
            </div>
            {currentPage === 'dashboard' && <span className="absolute -bottom-1 w-1 h-1 bg-emerald-500 rounded-full"></span>}
          </button>

          <button onClick={() => onNavigate('projects')} className={mobileNavItemClass('projects')}>
             <div className={`p-2 rounded-xl transition-all ${currentPage === 'projects' ? 'bg-emerald-100 dark:bg-emerald-900/30' : ''}`}>
                <FolderKanban className={`w-6 h-6 ${currentPage === 'projects' ? 'fill-current' : ''}`} strokeWidth={1.5} />
             </div>
             {currentPage === 'projects' && <span className="absolute -bottom-1 w-1 h-1 bg-emerald-500 rounded-full"></span>}
          </button>

          <div className="relative -top-6">
            <button onClick={() => onNavigate('dashboard')} className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/40 flex items-center justify-center text-white transform hover:scale-110 active:scale-95 transition-all">
               <Hexagon className="w-7 h-7 fill-current" />
            </button>
          </div>

          <button onClick={() => onNavigate('report')} className={mobileNavItemClass('report')}>
             <div className={`p-2 rounded-xl transition-all ${currentPage === 'report' ? 'bg-emerald-100 dark:bg-emerald-900/30' : ''}`}>
                <ImageIcon className={`w-6 h-6 ${currentPage === 'report' ? 'fill-current' : ''}`} strokeWidth={1.5} />
             </div>
             {currentPage === 'report' && <span className="absolute -bottom-1 w-1 h-1 bg-emerald-500 rounded-full"></span>}
          </button>

          <button onClick={onLogout} className={mobileNavItemClass('')}>
             <div className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-slate-400 hover:text-red-500">
                <LogOut className="w-6 h-6" strokeWidth={1.5} />
             </div>
          </button>
      </nav>
    </>
  );
};

export default Sidebar;