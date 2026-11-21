import React from 'react';
import Sidebar from './Sidebar';
import YearSelector from './YearSelector';
import { RefreshCw } from 'lucide-react';
import { apiService } from '../services/apiService';
import { Role } from '../types';
import { PageUrl } from '../lib/appUrl';
import { navigateReplace } from '../lib/navigate';

interface AppShellProps {
  currentPage: string;
  selectedYear?: number;
  onYearChange?: (year: number) => void;
  showYearSelector?: boolean;
  mobileTopBar?: boolean;
  mobileBottomNav?: boolean;
  children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ currentPage, selectedYear, onYearChange, showYearSelector = true, mobileTopBar = true, mobileBottomNav = true, children }) => {
  const user = apiService.getCurrentUser();
  const role = (user?.role ?? Role.PJA) as Role;

  const handleLogout = async () => {
    await apiService.logout();
    navigateReplace(PageUrl.login);
  };

  const hasYear = showYearSelector && selectedYear !== undefined && onYearChange;
  const refreshButton = (size: string) => (
    <button
      onClick={() => window.location.reload()}
      className={`${size} flex items-center justify-center bg-surface text-muted hover:text-ink border border-line hover:border-ink rounded-ih-md transition-colors group`}
      title="Kemaskini Data"
      aria-label="Kemaskini Data"
    >
      <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
    </button>
  );

  return (
    <div className="min-h-screen bg-paper text-ink font-sans relative overflow-x-clip">
      <div className="hidden md:block absolute top-0 inset-x-0 h-[420px] ih-grid-paper ih-fade-down pointer-events-none" aria-hidden />

      <Sidebar
        role={role}
        currentPage={currentPage}
        onLogout={handleLogout}
        selectedYear={selectedYear}
        mobileTopBar={mobileTopBar}
        mobileBottomNav={mobileBottomNav}
        mobileTopBarActions={hasYear && (
          <div className="flex items-center gap-2">
            <YearSelector selectedYear={selectedYear} onYearChange={onYearChange} variant="sheet" />
            {refreshButton('w-11 h-11')}
          </div>
        )}
      />

      <main className={`md:pl-32 ${mobileTopBar ? 'pt-14' : 'pt-0'} md:pt-0 ${mobileBottomNav ? 'pb-[calc(4rem+env(safe-area-inset-bottom))]' : 'pb-0'} md:pb-10 min-h-screen relative z-10`}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
          {hasYear && (
            <header className="relative z-40 animate-fade-in hidden md:flex md:items-center justify-between mb-10 gap-4">
              <div className="flex items-center gap-4">
                <YearSelector selectedYear={selectedYear} onYearChange={onYearChange} />
                {refreshButton('w-11 h-11')}
              </div>
            </header>
          )}
          <div className="animate-slide-up">{children}</div>
        </div>
      </main>
    </div>
  );
};

export default AppShell;
