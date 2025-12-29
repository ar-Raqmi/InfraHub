import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Project } from './types';
import { supabaseService } from './services/supabaseService';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ProjectsList from './pages/ProjectsList';
import ProjectDetail from './pages/ProjectDetail';
import Login from './pages/Login';
import Users from './pages/Users';
import Inbox from './pages/Inbox';
import ImageReportGenerator from './pages/ImageReportGenerator';
import Profile from './pages/Profile';
import AdminSettings from './pages/AdminSettings';
import YearSelector from './components/YearSelector';
import Toast from './components/Toast';
import { HelpCircle, X, RefreshCw } from 'lucide-react';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [showNavWarning, setShowNavWarning] = useState(false);
  const [pendingPage, setPendingPage] = useState<string | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  const refreshUser = () => {
    const currentUser = supabaseService.getCurrentUser();
    setUser(currentUser ? { ...currentUser } : null);
  };

  useEffect(() => {
    refreshUser();
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const loadProjects = async () => {
    try {
      const data = await supabaseService.getProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
      showToast('Gagal memuatkan projek.', 'error');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadProjects();
      if (currentPage === 'profile' || currentPage === 'users') {
        refreshUser();
      }
      showToast('Data telah dikemaskini.', 'success');
    } catch (err) {
      showToast('Gagal mengemaskini data.', 'error');
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

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
    await supabaseService.logout();
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
      await supabaseService.deleteProject(project.id);
      await loadProjects();
      showToast('Projek berjaya dipadam.', 'success');
    } catch (err) {
      console.error('Delete failed:', err);
      showToast('Gagal memadam projek.', 'error');
    }
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

    // Security & Role check for PJA
    if (user?.role !== 'ADMIN' && page === 'settings') {
       showToast(`Hanya Admin dibenarkan akses ke modul ${page}.`, 'error');
       return;
    }

    loadProjects(); // Refresh projects on navigation
    if (page === 'profile' || page === 'users') {
      refreshUser(); // Refresh user state on relevant pages
    }

    if (['dashboard', 'projects', 'users', 'inbox', 'report', 'settings', 'profile'].includes(page)) {
      setCurrentPage(page);
    } else {
      showToast(`Modul ${page} sedang dibangunkan.`, 'info');
    }
  };

  const confirmNavigation = () => {
    if (pendingPage) {
        setIsEditing(false);
        if (['dashboard', 'projects', 'users', 'inbox', 'report', 'settings', 'profile'].includes(pendingPage)) {
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

  if (loading) return <div className="h-screen flex items-center justify-center font-manrope text-slate-500 bg-slate-50">Memuatkan...</div>;

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50  font-sans transition-colors duration-200 relative overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-900">
      
      {/* Static Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-emerald-50/50 to-transparent"></div>
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
      <main className="md:pl-32 pt-24 md:pt-0 pb-24 md:pb-10 min-h-screen relative z-10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Top Bar / Header */}
          <header className="relative z-40 opacity-0 animate-fade-in flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-10 gap-4">
             <div className="flex items-center gap-4">
               <YearSelector selectedYear={selectedYear} onYearChange={setSelectedYear} />
               
               <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className={`flex items-center gap-2 bg-white  rounded-2xl px-4 py-2 shadow-sm border border-slate-200  transition-colors hover:bg-slate-50  group ${refreshing ? 'opacity-70' : ''}`}
               >
                 <RefreshCw className={`w-4 h-4 text-emerald-500 ${refreshing ? 'animate-spin' : ''}`} />
                 <span className="font-bold text-slate-700  font-manrope hidden sm:inline">Refresh</span>
               </button>
             </div>
          </header>

          {/* Page Content */}
          <div className="animate-slide-up">
             {isEditing ? (
                <div className="bg-white/95  border border-white/10 shadow-xl rounded-3xl p-4 md:p-6 shadow-xl border border-white/20">
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
                  {currentPage === 'inbox' && (
                    <Inbox onProjectClick={handleEditProject} />
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
                </>
              )}
          </div>

        </div>
      </main>

      {/* Navigation Warning Modal */}
      {showNavWarning && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={cancelNavigation}>
            <div 
              className="bg-white  rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200  animate-slide-up relative" 
              onClick={e => e.stopPropagation()}
            >
                <button onClick={cancelNavigation} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600  transition-colors p-2 rounded-full hover:bg-slate-100">
                   <X className="w-5 h-5" />
                </button>
                <div className="flex flex-col items-center text-center pt-2">
                   <div className="w-20 h-20 bg-yellow-50  rounded-full flex items-center justify-center mb-6 text-yellow-500">
                      <div className="w-14 h-14 bg-yellow-100  rounded-full flex items-center justify-center">
                        <HelpCircle className="w-8 h-8 stroke-[1.5]" />
                      </div>
                   </div>

                   <h3 className="text-xl font-bold text-slate-900  mb-2 font-jakarta">
                     Kembali ke Senarai?
                   </h3>
                   
                   <p className="text-slate-500  mb-8 text-sm leading-relaxed px-4">
                     Sebarang perubahan yang belum disimpan mungkin akan hilang. Adakah anda pasti mahu meninggalkan halaman ini?
                   </p>
                   
                   <div className="flex gap-3 w-full">
                      <button 
                        onClick={cancelNavigation}
                        className="flex-1 py-3.5 px-4 bg-white  text-slate-700  rounded-xl font-bold hover:bg-slate-50  transition-colors border border-slate-200  shadow-sm hover:shadow-md"
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