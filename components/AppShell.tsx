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
      className={`${size} flex items-center justify-center bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 border border-slate-200 hover:border-emerald-200 rounded-xl transition-colors group`}
      title="Kemaskini Data"
      aria-label="Kemaskini Data"
    >
      <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans transition-colors duration-200 relative overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-900">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-emerald-50/50 to-transparent"></div>
      </div>

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
                {refreshButton('p-2.5 shadow-sm hover:shadow-md')}
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
