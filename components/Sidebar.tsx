import React from 'react';
import { Users, Image as ImageIcon, LogOut, Settings, LayoutDashboard, Briefcase, HardHat, User as UserIcon } from 'lucide-react';
import { Role } from '../types';
import { pageHref } from '../lib/appUrl';

interface SidebarProps {
  role: Role;
  currentPage: string;
  onLogout: () => void;
  onNavigate?: (page: string) => void;
  selectedYear?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ role, currentPage, onLogout, onNavigate, selectedYear }) => {
  const linkMode = !onNavigate;

  const navHref = (page: string): string | undefined =>
    linkMode ? pageHref(page, selectedYear) : undefined;

  const NavItem = ({ page, icon, label }: { page: string; icon: React.ReactNode; label: string }) => {
    const active = currentPage === page;
    const cls = `p-3 rounded-2xl transition-colors group relative ${active
        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
        : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
      }`;
    const inner = (
      <>
        {icon}
        {active && <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-400/50 rounded-l-full"></span>}
        <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl border border-slate-700">
          {label}
        </div>
      </>
    );
    if (linkMode) {
      return <a href={navHref(page)} className={cls}>{inner}</a>;
    }
    return <button onClick={() => onNavigate!(page)} className={cls}>{inner}</button>;
  };

  const Logo = () => {
    const logoInner = (
      <div className="w-12 h-12 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
        <HardHat className="w-7 h-7" strokeWidth={2.5} />
      </div>
    );
    if (linkMode) {
      return <a href={navHref('dashboard')} className="mb-10 block cursor-pointer">{logoInner}</a>;
    }
    return <div className="mb-10 cursor-pointer" onClick={() => onNavigate!('dashboard')}>{logoInner}</div>;
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed z-30 inset-y-6 left-6 w-20 bg-white rounded-[2.5rem] flex-col items-center py-8 border border-slate-100 shadow-2xl">
        <Logo />
        <nav className="flex-1 flex flex-col gap-4">
          <NavItem page="dashboard" icon={<LayoutDashboard className="w-6 h-6" strokeWidth={1.5} />} label="Dashboard" />
          <NavItem page="projects" icon={<Briefcase className="w-6 h-6" strokeWidth={1.5} />} label="Projek" />
          <NavItem page="report" icon={<ImageIcon className="w-6 h-6" strokeWidth={1.5} />} label="Laporan Bergambar" />
          <NavItem page="users" icon={<Users className="w-6 h-6" strokeWidth={1.5} />} label="Pengguna" />
          {role === Role.ADMIN && (
            <NavItem page="settings" icon={<Settings className="w-6 h-6" strokeWidth={1.5} />} label="Tetapan" />
          )}
        </nav>
        <div className="flex flex-col items-center gap-4 mt-auto">
          <button
            onClick={onLogout}
            className="p-3 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors group relative"
          >
            <LogOut className="w-6 h-6 transition-transform group-hover:-translate-x-1" strokeWidth={1.5} />
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
            <HardHat className="w-6 h-6" />
          </div>
          <span className="font-bold text-slate-800 font-jakarta tracking-tight">InfraHub</span>
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
        {(() => {
          const MobileBtn = ({ page, children }: { page: string; children: React.ReactNode }) => {
            const active = currentPage === page;
            const cls = `p-3 rounded-2xl transition-all ${active ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400'}`;
            if (linkMode) return <a href={navHref(page)} className="flex-1 flex justify-center"><div className={cls}>{children}</div></a>;
            return <button onClick={() => onNavigate!(page)} className="flex-1 flex justify-center"><div className={cls}>{children}</div></button>;
          };
          return (
            <>
              <MobileBtn page="projects"><Briefcase className="w-6 h-6" /></MobileBtn>
              <MobileBtn page="users"><Users className="w-6 h-6" /></MobileBtn>
              <div className="flex-1 flex justify-center -translate-y-6">
                {linkMode ? (
                  <a href={navHref('dashboard')} className={`w-16 h-16 rounded-3xl flex items-center justify-center text-white active:scale-90 transition-all border-4 border-white shadow-xl ${currentPage === 'dashboard' ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 shadow-emerald-500/40' : 'bg-slate-800 shadow-slate-900/40'}`}>
                    <HardHat className="w-8 h-8" />
                  </a>
                ) : (
                  <button onClick={() => onNavigate!('dashboard')} className={`w-16 h-16 rounded-3xl flex items-center justify-center text-white active:scale-90 transition-all border-4 border-white shadow-xl ${currentPage === 'dashboard' ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 shadow-emerald-500/40' : 'bg-slate-800 shadow-slate-900/40'}`}>
                    <HardHat className="w-8 h-8" />
                  </button>
                )}
              </div>
              <MobileBtn page="report"><ImageIcon className="w-6 h-6" /></MobileBtn>
              <MobileBtn page="profile"><UserIcon className="w-6 h-6" /></MobileBtn>
            </>
          );
        })()}
      </nav>
    </>
  );
};

export default Sidebar;
