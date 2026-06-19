import React, { useState, useEffect, Suspense, lazy } from 'react';
import { createPortal } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import { User, Project } from './types';
import { apiService } from './services/apiService';
import Sidebar from './components/Sidebar';
import { SyncStatus } from './components/SyncStatus';
import { useProjects } from './hooks/useProjects';
import { useUsers } from './hooks/useUsers';
import { useBulletins } from './hooks/useBulletins';
import { useSettings } from './hooks/useSettings';
import YearSelector from './components/YearSelector';
import Toast from './components/Toast';
import { HelpCircle, X, RefreshCw, Loader2 } from 'lucide-react';
import Login from './pages/Login';

// --- Code Splitting (Lazy Load) ---
// These pages will ONLY download when you click on them.
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProjectsList = lazy(() => import('./pages/ProjectsList'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const Users = lazy(() => import('./pages/Users'));
const ImageReportGenerator = lazy(() => import('./pages/ImageReportGenerator'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Initialize Global Hooks for Pre-Warming Cache
  const {
    projects,
    createProject,
    updateProject,
    deleteProject: deleteProjectHook,
    isLoading: isProjectsLoading
  } = useProjects();

  const { users } = useUsers();
  const { bulletins } = useBulletins();
  const { settings } = useSettings(selectedYear);

  const [selectedProject, setSelectedProject] = useState<Project | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const [showNavWarning, setShowNavWarning] = useState(false);
  const [pendingPage, setPendingPage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const queryClient = useQueryClient();

  // Sync data whenever page changes (ensures "sync on open")
  useEffect(() => {
    const projectPages = ['dashboard', 'projects', 'report'];
    if (projectPages.includes(currentPage)) {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    }

    // Also sync bulletins and users if going to dashboard
    if (currentPage === 'dashboard') {
      queryClient.invalidateQueries({ queryKey: ['bulletins'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  }, [currentPage, queryClient]);

  useEffect(() => {
    // Signal to the splash screen that the app is ready
    // @ts-ignore
    if (typeof window.__APP_READY__ === 'function') {
      // @ts-ignore
      window.__APP_READY__();
    }
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  const handleRefresh = async () => {
    showToast('Mengemaskini data...', 'info');
    // Invalidate ALL queries to force a fresh background fetch
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['temporary_gallery'], exact: false }),
      queryClient.invalidateQueries()
    ]);
    showToast('Data dikemaskini!', 'success');
  };

  const refreshUser = () => {
    const currentUser = apiService.getCurrentUser();
    setUser(currentUser ? { ...currentUser } : null);
  };

  useEffect(() => {
    refreshUser();
    setAuthLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;

    // Push initial history state to prevent immediate back navigation
    window.history.pushState(null, '', window.location.href);

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Adakah anda pasti mahu menyegarkan halaman?';
      return e.returnValue;
    };

    const handlePopState = () => {
      const confirmLeave = window.confirm('Adakah anda pasti mahu kembali ke halaman sebelumnya? Tindakan ini boleh menyebabkan anda keluar dari aplikasi.');
      if (!confirmLeave) {
        window.history.pushState(null, '', window.location.href);
      } else {
        window.history.go(-1);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [user]);

  // Filter Projects by Year
  const filteredProjects = projects.filter(p => {
    if (!p.tarikhBuka) return false;
    const projectYear = new Date(p.tarikhBuka).getFullYear();
    return projectYear === selectedYear;
  });

  const handleLogin = (u: User) => {
    setUser({ ...u });
    setCurrentPage('dashboard');
    showToast(`Selamat kembali, ${u.fullName}!`, 'success');
  };

  const handleLogout = async () => {
    await apiService.logout();
    setUser(null);
    showToast('Anda telah log keluar.', 'info');
  };

  const handleAddProject = () => {
    setSelectedProject(undefined);
    setIsEditing(true);
  };

  const handleEditProject = (p: Project) => {
    setSelectedProject(p);
    setIsEditing(true);
  };

  const handleDeleteProject = async (project: Project) => {
    try {
      await deleteProjectHook(project.id);
      showToast('Projek berjaya dipadam.', 'success');
    } catch (err) {
      console.error('Delete failed:', err);
      showToast('Gagal memadam projek.', 'error');
    }
  };

  const handleProjectSaved = () => {
    showToast('Projek berjaya disimpan!', 'success');
  };

  const handleNavClick = (page: string) => {
    if (isEditing) {
      setPendingPage(page);
      setShowNavWarning(true);
      return;
    }

    // Security & Role check for PJE
    if (user?.role !== 'ADMIN' && page === 'settings') {
      showToast(`Hanya Admin dibenarkan akses ke modul ${page}.`, 'error');
      return;
    }

    if (page === 'profile' || page === 'users') {
      refreshUser();
    }

    if (['dashboard', 'projects', 'users', 'report', 'settings', 'profile'].includes(page)) {
      setCurrentPage(page);
    } else {
      showToast(`Modul ${page} sedang dibangunkan.`, 'info');
    }
  };

  const confirmNavigation = () => {
    if (pendingPage) {
      setIsEditing(false);
      if (['dashboard', 'projects', 'users', 'report', 'settings', 'profile'].includes(pendingPage)) {
        setCurrentPage(pendingPage);
      } else if (pendingPage === 'logout') {
        handleLogout();
      }
      setPendingPage(null);
      setShowNavWarning(false);
    }
  };

  const cancelNavigation = () => {
    setShowNavWarning(false);
    setPendingPage(null);
  };

  const handleLogoutRequest = () => {
    if (isEditing) {
      setPendingPage('logout');
      setShowNavWarning(true);
    } else {
      handleLogout();
    }
  };

  if (authLoading) return <div className="h-screen flex items-center justify-center font-manrope text-slate-500 bg-slate-50">Memuatkan...</div>;

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // A generic loading fallback for Suspense
  const PageLoader = () => (
    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
      <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-500" />
      <p className="text-sm">Memuatkan modul...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans transition-colors duration-200 relative overflow-x-hidden selection:bg-blue-500/30 selection:text-blue-900">

      <SyncStatus />

      {/* Static Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-50/50 to-transparent"></div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <Sidebar
        role={user.role}
        onNavigate={handleNavClick}
        currentPage={currentPage}
        onLogout={handleLogoutRequest}
      />

      <main className="md:pl-32 pt-24 md:pt-0 pb-24 md:pb-10 min-h-screen relative z-10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {!isEditing && (
            <header className="relative z-40 animate-fade-in flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-10 gap-4">
              <div className="flex items-center gap-4">
                <YearSelector selectedYear={selectedYear} onYearChange={setSelectedYear} />
                <button
                  onClick={handleRefresh}
                  className="bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-200 p-2.5 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 group"
                  title="Kemaskini Data"
                >
                  <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                </button>
              </div>
            </header>
          )}

          <div className="animate-slide-up">
            {isEditing ? (
              <Suspense fallback={<PageLoader />}>
                <div className="bg-white/95 border border-white/10 shadow-xl rounded-3xl p-4 md:p-6 shadow-xl border border-white/20">
                  <ProjectDetail
                    project={selectedProject}
                    projects={projects}
                    onClose={() => setIsEditing(false)}
                    onSave={handleProjectSaved}
                    onSwitchProject={handleEditProject}
                    currentUserRole={user.role}
                    selectedYear={selectedYear}
                    onShowToast={showToast}
                  />
                </div>
              </Suspense>
            ) : (
              <Suspense fallback={<PageLoader />}>
                {currentPage === 'dashboard' && (
                  <Dashboard
                    projects={filteredProjects}
                    user={user}
                    onProjectClick={handleEditProject}
                    onNewProject={handleAddProject}
                    onNavigate={handleNavClick}
                    onProfileClick={() => setCurrentPage('profile')}
                    onUpdateProject={async (params) => updateProject(params)}
                  />
                )}
                {currentPage === 'projects' && (
                  <ProjectsList
                    projects={filteredProjects}
                    selectedYear={selectedYear}
                    onAddProject={handleAddProject}
                    onEditProject={handleEditProject}
                    onDeleteProject={handleDeleteProject}
                    user={user}
                  />
                )}
                {currentPage === 'users' && (
                  <Users currentUser={user} onUserUpdate={refreshUser} />
                )}
                {currentPage === 'report' && (
                  <ImageReportGenerator projects={filteredProjects} user={user} />
                )}
                {currentPage === 'profile' && (
                  <Profile user={user} onUserUpdate={refreshUser} />
                )}
                {currentPage === 'settings' && (
                  <AdminSettings user={user} selectedYear={selectedYear} />
                )}
              </Suspense>
            )}
          </div>

        </div>
      </main>

      {/* Navigation Warning Modal */}
      {showNavWarning && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={cancelNavigation}>
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-slide-up relative"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={cancelNavigation} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100">
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center text-center pt-2">
              <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mb-6 text-yellow-500">
                <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center">
                  <HelpCircle className="w-8 h-8 stroke-[1.5]" />
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2 font-jakarta">
                Kembali ke Senarai?
              </h3>

              <p className="text-slate-500 mb-8 text-sm leading-relaxed px-4">
                Sebarang perubahan yang belum disimpan mungkin akan hilang. Adakah anda pasti mahu meninggalkan halaman ini?
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={cancelNavigation}
                  className="flex-1 py-3.5 px-4 bg-white text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors border border-slate-200 shadow-sm hover:shadow-md"
                >
                  Batal
                </button>
                <button
                  onClick={confirmNavigation}
                  className="flex-1 py-3.5 px-4 rounded-xl font-bold text-white transition-colors flex items-center justify-center gap-2 shadow-lg bg-yellow-500 hover:bg-yellow-600 shadow-yellow-500/30"
                >
                  Ya, Kembali
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

export default App;