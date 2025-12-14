

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Project } from './types';
import { mockService } from './services/mockService';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ProjectsList from './pages/ProjectsList';
import ProjectDetail from './pages/ProjectDetail';
import Login from './pages/Login';
import Users from './pages/Users';
import Inbox from './pages/Inbox';
import Calendar from './pages/Calendar';
import Profile from './pages/Profile';
import AdminSettings from './pages/AdminSettings';
import YearSelector from './components/YearSelector';
import Toast from './components/Toast';
import { HelpCircle, X } from 'lucide-react';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Year Logic
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Navigation Guard State
  const [showNavWarning, setShowNavWarning] = useState(false);
  const [pendingPage, setPendingPage] = useState<string | null>(null);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    const currentUser = mockService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const loadProjects = () => {
    setProjects(mockService.getProjects());
  };

  // Filter Projects by Year
  const filteredProjects = projects.filter(p => {
    if (!p.tarikhBuka) return false;
    const projectYear = new Date(p.tarikhBuka).getFullYear();
    return projectYear === selectedYear;
  });

  const handleLogin = (u: User) => {
    setUser(u);
    setCurrentPage('dashboard');
    showToast(`Selamat kembali, ${u.fullName}!`, 'success');
  };

  const handleLogout = () => {
    mockService.logout();
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
    await mockService.deleteProject(project.id);
    loadProjects();
    showToast('Projek berjaya dipadam.', 'success');
  };

  const handleProjectSaved = () => {
    loadProjects();
    setIsEditing(false);
    showToast('Projek berjaya disimpan!', 'success');
  };

  const handleNavClick = (page: string) => {
    if (isEditing) {
       setPendingPage(page);
       setShowNavWarning(true);
       return;
    }

    if (['dashboard', 'projects', 'users', 'inbox', 'calendar', 'settings'].includes(page)) {
      setCurrentPage(page);
    } else {
      showToast(`Modul ${page} sedang dibangunkan.`, 'info');
    }
  };

  const confirmNavigation = () => {
    if (pendingPage) {
        setIsEditing(false);
        if (['dashboard', 'projects', 'users', 'inbox', 'calendar', 'settings'].includes(pendingPage)) {
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

  // Override Logout for Nav Guard
  const handleLogoutRequest = () => {
    if (isEditing) {
        setPendingPage('logout');
        setShowNavWarning(true);
    } else {
        handleLogout();
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-manrope text-slate-500 bg-slate-50 dark:bg-slate-900">Memuatkan...</div>;

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950 font-sans transition-colors duration-300 relative overflow-x-hidden">
      
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-teal-300 to-emerald-300 dark:from-teal-900 dark:to-emerald-900 rounded-full opacity-20 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-emerald-300 to-teal-300 dark:from-emerald-900 dark:to-teal-900 rounded-full opacity-20 animate-float" style={{ animationDelay: '-3s' }}></div>
      </div>

      {/* Toast Notification Container */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Sidebar / Bottom Nav */}
      <Sidebar 
        role={user.role} 
        onNavigate={handleNavClick} 
        currentPage={currentPage}
        onLogout={handleLogoutRequest}
      />

      {/* Main Content Area */}
      <main className="md:ml-20 pb-24 md:pb-6 min-h-screen relative z-10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* Top Bar / Header */}
          <header className="relative z-40 opacity-0 animate-slide-down delay-100 flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-10 gap-4">
             <div className="flex items-center gap-4">
               <YearSelector selectedYear={selectedYear} onYearChange={setSelectedYear} />
             </div>
          </header>

          {/* Page Content */}
          <div className="animate-fade-in-up delay-200">
             {isEditing ? (
                <div className="glass-effect rounded-3xl p-4 md:p-6 shadow-xl border border-white/20 dark:border-white/5">
                  <ProjectDetail 
                    project={selectedProject} 
                    onClose={() => setIsEditing(false)} 
                    onSave={handleProjectSaved}
                    currentUserRole={user.role}
                    selectedYear={selectedYear}
                    onShowToast={showToast}
                  />
                </div>
              ) : (
                <>
                  {currentPage === 'dashboard' && (
                    <Dashboard 
                      projects={filteredProjects} 
                      user={user} 
                      onProjectClick={handleEditProject} 
                      onNewProject={handleAddProject}
                      onNavigate={handleNavClick}
                      onProfileClick={() => setCurrentPage('profile')}
                    />
                  )}
                  {currentPage === 'projects' && (
                     <ProjectsList 
                      projects={filteredProjects} 
                      onAddProject={handleAddProject}
                      onEditProject={handleEditProject}
                      onDeleteProject={handleDeleteProject}
                    />
                  )}
                  {currentPage === 'users' && (
                    <Users currentUser={user} />
                  )}
                  {currentPage === 'inbox' && (
                    <Inbox />
                  )}
                  {currentPage === 'calendar' && (
                    <Calendar projects={filteredProjects} />
                  )}
                  {currentPage === 'profile' && (
                    <Profile user={user} />
                  )}
                  {currentPage === 'settings' && (
                    <AdminSettings user={user} selectedYear={selectedYear} />
                  )}
                </>
              )}
          </div>

        </div>
      </main>

      {/* Navigation Warning Modal */}
      {showNavWarning && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={cancelNavigation}>
            <div 
              className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 transform scale-100 transition-all animate-slide-up relative" 
              onClick={e => e.stopPropagation()}
            >
                <button onClick={cancelNavigation} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                   <X className="w-5 h-5" />
                </button>
                <div className="flex flex-col items-center text-center pt-2">
                   <div className="w-20 h-20 bg-yellow-50 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-6 text-yellow-500 animate-pulse-slow">
                      <div className="w-14 h-14 bg-yellow-100 dark:bg-yellow-900/40 rounded-full flex items-center justify-center">
                        <HelpCircle className="w-8 h-8 stroke-[1.5]" />
                      </div>
                   </div>

                   <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 font-jakarta">
                     Kembali ke Senarai?
                   </h3>
                   
                   <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm leading-relaxed px-4">
                     Sebarang perubahan yang belum disimpan mungkin akan hilang. Adakah anda pasti mahu meninggalkan halaman ini?
                   </p>
                   
                   <div className="flex gap-3 w-full">
                      <button 
                        onClick={cancelNavigation}
                        className="flex-1 py-3.5 px-4 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-600 transition-all border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md"
                      >
                        Batal
                      </button>
                      <button 
                        onClick={confirmNavigation}
                        className="flex-1 py-3.5 px-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg bg-yellow-500 hover:bg-yellow-600 shadow-yellow-500/30"
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
