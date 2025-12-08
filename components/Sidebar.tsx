
import React from 'react';
import { Home, FolderKanban, Users, Calendar, LogOut, Settings, Hexagon, Menu } from 'lucide-react';
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
    p-3 rounded-xl transition-all duration-300 group relative
    ${currentPage === page 
      ? 'text-emerald-600 bg-white/80 dark:bg-emerald-500/20 shadow-lg scale-110' 
      : 'text-gray-400 hover:text-emerald-600 hover:bg-white/50 dark:hover:bg-white/5 hover:shadow-lg hover:scale-110'}
  `;

  const mobileNavItemClass = (page: string) => `
    flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300
    ${currentPage === page 
      ? 'text-emerald-600' 
      : 'text-gray-400 hover:text-emerald-600'}
  `;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed z-30 inset-y-0 left-0 w-20 glass-effect flex-col items-center py-8 border-r border-white/20 dark:border-white/5 shadow-2xl transition-all duration-500 animate-fade-in-left">
        
        {/* Brand */}
        <div className="mb-10 transition-all duration-300 cursor-pointer hover:text-emerald-700 animate-glow text-emerald-600">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110">
            <Hexagon className="w-6 h-6 fill-current" />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col space-y-6 w-full px-2 items-center">
          
          <button onClick={() => onNavigate('dashboard')} className={navItemClass('dashboard')} title="Utama">
            <Home className="w-5 h-5" strokeWidth={1.5} />
          </button>

          <button onClick={() => onNavigate('projects')} className={navItemClass('projects')} title="Projek">
            <FolderKanban className="w-5 h-5" strokeWidth={1.5} />
          </button>

          {role === Role.ADMIN && (
            <button onClick={() => onNavigate('users')} className={navItemClass('users')} title="Pengguna">
              <Users className="w-5 h-5" strokeWidth={1.5} />
            </button>
          )}

          <button onClick={() => onNavigate('calendar')} className={navItemClass('calendar')} title="Kalendar">
            <Calendar className="w-5 h-5" strokeWidth={1.5} />
          </button>

        </div>

        {/* Bottom Actions */}
        <div className="mt-auto flex flex-col space-y-6 w-full px-2 items-center">
          <ThemeToggle className="p-3 rounded-xl text-gray-400 hover:text-emerald-600 hover:bg-white/50 dark:hover:bg-white/5 hover:shadow-lg hover:scale-110 transition-all duration-300" />
          
          {role === Role.ADMIN && (
            <button onClick={() => onNavigate('settings')} className={navItemClass('settings')} title="Tetapan">
              <Settings className="w-5 h-5" strokeWidth={1.5} />
            </button>
          )}
          
          <button onClick={onLogout} className="p-3 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:shadow-lg hover:scale-110 transition-all duration-300" title="Log Keluar">
            <LogOut className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed z-50 bottom-0 inset-x-0 h-20 glass-effect border-t border-white/20 dark:border-white/5 flex items-center justify-around px-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl pb-safe">
          <button onClick={() => onNavigate('dashboard')} className={mobileNavItemClass('dashboard')}>
            <Home className={`w-6 h-6 ${currentPage === 'dashboard' ? 'fill-current' : ''}`} strokeWidth={1.5} />
            <span className="text-[10px] font-medium mt-1">Utama</span>
          </button>

          <button onClick={() => onNavigate('projects')} className={mobileNavItemClass('projects')}>
            <FolderKanban className={`w-6 h-6 ${currentPage === 'projects' ? 'fill-current' : ''}`} strokeWidth={1.5} />
            <span className="text-[10px] font-medium mt-1">Projek</span>
          </button>

          <button onClick={() => onNavigate('calendar')} className={mobileNavItemClass('calendar')}>
            <Calendar className={`w-6 h-6 ${currentPage === 'calendar' ? 'fill-current' : ''}`} strokeWidth={1.5} />
            <span className="text-[10px] font-medium mt-1">Kalendar</span>
          </button>

          <button onClick={onLogout} className="flex flex-col items-center justify-center p-2 rounded-xl text-gray-400 hover:text-red-500 transition-all">
            <LogOut className="w-6 h-6" strokeWidth={1.5} />
            <span className="text-[10px] font-medium mt-1">Keluar</span>
          </button>
      </nav>
    </>
  );
};

export default Sidebar;