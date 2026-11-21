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
    const cls = `relative flex flex-col items-center justify-center gap-1 min-h-[60px] px-1 rounded-ih-md border transition-colors ${active
        ? 'bg-surface border-line text-ink'
        : 'border-transparent text-muted hover:text-ink hover:bg-surface/70'
      }`;
    const inner = (
      <>
        {active && <span className="absolute -left-3 top-3 bottom-3 w-[3px] rounded-r-full bg-emerald-bright" aria-hidden />}
        <entry.Icon className={`w-[22px] h-[22px] ${active ? 'text-emerald-deep' : ''}`} strokeWidth={active ? 2.25 : 1.75} />
        <span className={`text-[11.5px] leading-tight text-center ${active ? 'font-bold' : 'font-semibold'}`}>{entry.tabLabel}</span>
      </>
    );
    if (linkMode) {
      return <a href={navHref(entry.page)} className={cls} title={entry.label} aria-current={active ? 'page' : undefined}>{inner}</a>;
    }
    return <button onClick={() => onNavigate!(entry.page)} className={cls} title={entry.label}>{inner}</button>;
  };

  const MobileTab = ({ entry }: { entry: NavEntry }) => {
    const active = currentPage === entry.page;
    const cls = `flex-1 min-w-0 h-full flex flex-col items-center justify-center gap-1 ${active ? 'text-ink' : 'text-muted'}`;
    const inner = (
      <>
        <span className={`px-4 py-1 rounded-full ${active ? 'bg-emerald-tint text-emerald-deep' : ''}`}>
          <entry.Icon className="w-5 h-5" strokeWidth={active ? 2.25 : 1.75} />
        </span>
        <span className={`text-[11px] leading-none truncate max-w-full ${active ? 'font-bold' : 'font-semibold'}`}>{entry.tabLabel}</span>
      </>
    );
    if (linkMode) return <a href={navHref(entry.page)} className={cls} aria-current={active ? 'page' : undefined}>{inner}</a>;
    return <button onClick={() => onNavigate!(entry.page)} className={cls}>{inner}</button>;
  };

  const Mark = ({ size }: { size: 'rail' | 'bar' }) => (
    <span className={`${size === 'rail' ? 'w-11 h-11 rounded-ih-md' : 'w-9 h-9 rounded-ih-sm'} shrink-0 bg-emerald-bright text-ink flex items-center justify-center`}>
      <HardHat className={size === 'rail' ? 'w-6 h-6' : 'w-5 h-5'} strokeWidth={2.25} />
    </span>
  );

  const Logo = () => {
    const logoInner = (
      <span className="flex flex-col items-center gap-1.5">
        <Mark size="rail" />
        <span className="font-display font-extrabold text-[13px] tracking-tight text-ink">InfraHub</span>
      </span>
    );
    if (linkMode) {
      return <a href={navHref('dashboard')} className="mb-6 flex justify-center cursor-pointer">{logoInner}</a>;
    }
    return <div className="mb-6 flex justify-center cursor-pointer" onClick={() => onNavigate!('dashboard')}>{logoInner}</div>;
  };

  return (
    <>
      {/* Desktop rail: 112 px wide, flush left; ProjectDetail's fixed header starts at md:left-28 to match. */}
      <aside className="hidden md:flex fixed z-30 inset-y-0 left-0 w-28 bg-paper-deep border-r border-line flex-col py-6 px-3">
        <Logo />
        <nav className="flex-1 flex flex-col gap-1.5" aria-label="Navigasi utama">
          {entries.filter(e => e.desktop).map(e => <NavItem key={e.page} entry={e} />)}
        </nav>
        <div className="mt-auto pt-4 border-t border-line flex flex-col items-stretch gap-2">
          <span className="ih-eyebrow text-[10px] text-muted text-center">{role}</span>
          <button
            onClick={onLogout}
            className="flex flex-col items-center justify-center gap-1 min-h-[60px] rounded-ih-md text-muted hover:text-danger hover:bg-danger-tint transition-colors"
            title="Log Keluar"
          >
            <LogOut className="w-[22px] h-[22px]" strokeWidth={1.75} />
            <span className="text-[11.5px] font-semibold leading-tight">Log Keluar</span>
          </button>
        </div>
      </aside>

      {/* Mobile top bar: solid, because tw-config.js disables blur and shadow so translucency would show content through it. */}
      {mobileTopBar && (
        <header className="md:hidden fixed top-0 inset-x-0 h-14 bg-surface border-b border-line z-[60] pl-4 pr-2 flex items-center gap-3">
          <Mark size="bar" />
          <div className="min-w-0 flex-1 leading-tight">
            <h1 className="font-display font-bold text-ink text-[17px] tracking-tight truncate">{pageTitle}</h1>
            <span className="block text-[10px] font-bold text-muted uppercase tracking-[0.14em]">InfraHub</span>
          </div>
          {mobileTopBarActions}
        </header>
      )}

      {/* Mobile bottom tab bar */}
      {mobileBottomNav && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-surface border-t border-line z-50 pb-[env(safe-area-inset-bottom)]" aria-label="Navigasi utama">
          <div className="h-16 flex items-stretch">
            {entries.map(e => <MobileTab key={e.page} entry={e} />)}
          </div>
        </nav>
      )}
    </>
  );
};

export default Sidebar;
