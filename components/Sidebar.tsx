import React from 'react';
import { Users, Image as ImageIcon, LogOut, Settings, LayoutDashboard, Briefcase, HardHat, User as UserIcon, LucideIcon } from 'lucide-react';
import { Role } from '../types';
import { pageHref } from '../lib/appUrl';

interface SidebarProps {
  role: Role;
  currentPage: string;
  onLogout: () => void;
  onNavigate?: (page: string) => void;
  selectedYear?: number;
  mobileTitle?: string;
  mobileTopBar?: boolean;
  mobileBottomNav?: boolean;
  mobileTopBarActions?: React.ReactNode;
}

interface NavEntry {
  page: string;
  label: string;
  tabLabel: string;
  title: string;
  Icon: LucideIcon;
  desktop: boolean;
  adminOnly?: boolean;
}

const NAV_ENTRIES: NavEntry[] = [
  { page: 'dashboard', label: 'Dashboard', tabLabel: 'Dashboard', title: 'Dashboard', Icon: LayoutDashboard, desktop: true },
  { page: 'projects', label: 'Projek', tabLabel: 'Projek', title: 'Senarai Projek', Icon: Briefcase, desktop: true },
  { page: 'report', label: 'Laporan Bergambar', tabLabel: 'Laporan', title: 'Laporan Bergambar', Icon: ImageIcon, desktop: true },
  { page: 'users', label: 'Pengguna', tabLabel: 'Pengguna', title: 'Pengguna', Icon: Users, desktop: true },
  { page: 'profile', label: 'Profil Pengguna', tabLabel: 'Profil', title: 'Profil Pengguna', Icon: UserIcon, desktop: false },
  { page: 'settings', label: 'Tetapan', tabLabel: 'Tetapan', title: 'Tetapan', Icon: Settings, desktop: true, adminOnly: true },
];

const Sidebar: React.FC<SidebarProps> = ({
  role, currentPage, onLogout, onNavigate, selectedYear,
  mobileTitle, mobileTopBar = true, mobileBottomNav = true, mobileTopBarActions,
}) => {
  const linkMode = !onNavigate;
  const entries = NAV_ENTRIES.filter(e => !e.adminOnly || role === Role.ADMIN);
  const pageTitle = mobileTitle ?? NAV_ENTRIES.find(e => e.page === currentPage)?.title ?? 'InfraHub';

  const navHref = (page: string): string | undefined =>
    linkMode ? pageHref(page, selectedYear) : undefined;

  const NavItem = ({ entry }: { entry: NavEntry }) => {
    const active = currentPage === entry.page;
    const cls = `p-3 rounded-2xl transition-colors group relative ${active
        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
        : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
      }`;
    const inner = (
      <>
        <entry.Icon className="w-6 h-6" strokeWidth={1.5} />
        {active && <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-400/50 rounded-l-full"></span>}
        <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl border border-slate-700">
          {entry.label}
        </div>
      </>
    );
    if (linkMode) {
      return <a href={navHref(entry.page)} className={cls}>{inner}</a>;
    }
    return <button onClick={() => onNavigate!(entry.page)} className={cls}>{inner}</button>;
  };

  const MobileTab = ({ entry }: { entry: NavEntry }) => {
    const active = currentPage === entry.page;
    const cls = `flex-1 min-w-0 h-full flex flex-col items-center justify-center gap-0.5 ${active ? 'text-emerald-700' : 'text-slate-500'}`;
    const inner = (
      <>
        <span className={`px-4 py-1 rounded-full ${active ? 'bg-emerald-100' : ''}`}>
          <entry.Icon className="w-5 h-5" strokeWidth={active ? 2.25 : 1.75} />
        </span>
        <span className={`text-[11px] leading-none truncate max-w-full ${active ? 'font-extrabold' : 'font-semibold'}`}>{entry.tabLabel}</span>
      </>
    );
    if (linkMode) return <a href={navHref(entry.page)} className={cls} aria-current={active ? 'page' : undefined}>{inner}</a>;
    return <button onClick={() => onNavigate!(entry.page)} className={cls}>{inner}</button>;
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
          {entries.filter(e => e.desktop).map(e => <NavItem key={e.page} entry={e} />)}
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

      {/* Mobile top bar: solid, because tw-config.js disables blur and shadow so translucency would show content through it. */}
      {mobileTopBar && (
        <header className="md:hidden fixed top-0 inset-x-0 h-14 bg-white border-b border-slate-200 z-[60] pl-4 pr-2 flex items-center gap-3">
          <div className="w-9 h-9 shrink-0 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
            <HardHat className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <h1 className="font-extrabold text-slate-800 text-[15px] truncate">{pageTitle}</h1>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">InfraHub</span>
          </div>
          {mobileTopBarActions}
        </header>
      )}

      {/* Mobile bottom tab bar */}
      {mobileBottomNav && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-50 pb-[env(safe-area-inset-bottom)]" aria-label="Navigasi utama">
          <div className="h-16 flex items-stretch">
            {entries.map(e => <MobileTab key={e.page} entry={e} />)}
          </div>
        </nav>
      )}
    </>
  );
};

export default Sidebar;
