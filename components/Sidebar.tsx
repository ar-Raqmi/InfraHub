import React from 'react';
import { Home, FolderKanban, Users, Image as ImageIcon, LogOut, Settings, Hexagon, LayoutDashboard, Briefcase, Plus, Zap, User as UserIcon } from 'lucide-react';
import { Role } from '../types';

interface SidebarProps {
  role: Role;
  onNavigate: (page: string) => void;
  currentPage: string;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ role, onNavigate, currentPage, onLogout }) => {

  const navItemClass = (page: string) => `
    p-3 rounded-2xl transition-colors duration-200 group relative
    ${currentPage === page
      ? 'text-white bg-emerald-600 shadow-emerald-500/30 shadow-lg'
      : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}
  `;

  const mobileNavItemClass = (page: string) => `
    flex flex-col items-center justify-center p-3 rounded-2xl transition-colors duration-200 relative group
    ${currentPage === page
      ? 'text-emerald-600'
      : 'text-slate-400 hover:text-emerald-600 active:scale-95'}
  `;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed z-30 inset-y-6 left-6 w-20 bg-white rounded-[2.5rem] flex-col items-center py-8 border border-slate-100 shadow-2xl">

        {/* Logo */}
        <div className="mb-10 cursor-pointer" onClick={() => onNavigate('dashboard')}>
          <div className="w-12 h-12 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
            <Zap className="w-7 h-7" strokeWidth={2.5} />
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 flex flex-col gap-4">
          <NavItem
            icon={<LayoutDashboard className="w-6 h-6" strokeWidth={1.5} />}
            label="Dashboard"
            active={currentPage === 'dashboard'}
            onClick={() => onNavigate('dashboard')}
          />
          <NavItem
            icon={<Briefcase className="w-6 h-6" strokeWidth={1.5} />}
            label="Projek"
            active={currentPage === 'projects'}
            onClick={() => onNavigate('projects')}
          />
          <NavItem
            icon={<ImageIcon className="w-6 h-6" strokeWidth={1.5} />}
            label="Laporan Bergambar"
            active={currentPage === 'report'}
            onClick={() => onNavigate('report')}
          />
          <NavItem
            icon={<Users className="w-6 h-6" strokeWidth={1.5} />}
            label="Pengguna"
            active={currentPage === 'users'}
            onClick={() => onNavigate('users')}
          />
          {role === Role.ADMIN && (
            <NavItem
              icon={<Settings className="w-6 h-6" strokeWidth={1.5} />}
              label="Tetapan"
              active={currentPage === 'settings'}
              onClick={() => onNavigate('settings')}
            />
          )}
        </nav>

        {/* Bottom Actions */}
        <div className="flex flex-col items-center gap-4 mt-auto">
          <button
            onClick={onLogout}
            className="p-3 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors group relative"
          >
            <LogOut className="w-6 h-6 transition-transform group-hover:-translate-x-1" strokeWidth={1.5} />

            {/* Tooltip */}
            <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl border border-slate-700">
              Log Keluar
            </div>
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-20 bg-slate-50/80 backdrop-blur-md z-[60] px-6 flex items-center justify-between border-b border-slate-200/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
            <Zap className="w-6 h-6" />
          </div>
          <span className="font-bold text-slate-800 font-jakarta tracking-tight">ElectricHub</span>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 text-slate-600 active:scale-95 transition-all hover:bg-red-50 hover:border-red-100 group"
        >
          <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-500 transition-colors" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-red-600 transition-colors">Log Keluar</span>
        </button>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 h-20 bg-white/90 backdrop-blur-lg border border-slate-100 rounded-[2.5rem] shadow-2xl z-50 px-4 flex items-center justify-around">
        <button onClick={() => onNavigate('projects')} className="flex-1 flex justify-center">
          <div className={`p-3 rounded-2xl transition-all ${currentPage === 'projects' ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400'}`}>
            <Briefcase className="w-6 h-6" />
          </div>
        </button>

        <button onClick={() => onNavigate('users')} className="flex-1 flex justify-center">
          <div className={`p-3 rounded-2xl transition-all ${currentPage === 'users' ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400'}`}>
            <Users className="w-6 h-6" />
          </div>
        </button>

        <div className="flex-1 flex justify-center -translate-y-6">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`w-16 h-16 rounded-3xl flex items-center justify-center text-white active:scale-90 transition-all border-4 border-white shadow-xl ${currentPage === 'dashboard'
                ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 shadow-emerald-500/40'
                : 'bg-slate-800 shadow-slate-900/40'
              }`}
          >
            <HardHat className="w-8 h-8" />
          </button>
        </div>

        <button onClick={() => onNavigate('report')} className="flex-1 flex justify-center">
          <div className={`p-3 rounded-2xl transition-all ${currentPage === 'report' ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400'}`}>
            <ImageIcon className="w-6 h-6" />
          </div>
        </button>

        <button onClick={() => onNavigate('profile')} className="flex-1 flex justify-center">
          <div className={`p-3 rounded-2xl transition-all ${currentPage === 'profile' ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400'}`}>
            <UserIcon className="w-6 h-6" />
          </div>
        </button>
      </nav>
    </>
  );
};

const NavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`p-3 rounded-2xl transition-colors group relative ${active
        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
        : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
      }`}
  >
    {icon}
    {active && <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-400/50 rounded-l-full"></span>}

    {/* Tooltip */}
    <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl border border-slate-700">
      {label}
    </div>
  </button>
);

export default Sidebar;
