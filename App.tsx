
import React, { useState, useEffect } from 'react';
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

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Year Logic
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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
    if (['dashboard', 'projects', 'users', 'inbox', 'calendar', 'settings'].includes(page)) {
      setCurrentPage(page);
      setIsEditing(false);
    } else {
      showToast(`Modul ${page} sedang dibangunkan.`, 'info');
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-manrope text-slate-500 bg-slate-50 dark:bg-slate-900">Memuatkan...</div>;

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 font-sans transition-colors duration-300 relative overflow-x-hidden">
      
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-300 to-blue-300 dark:from-purple-900 dark:to-blue-900 rounded-full opacity-20 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-indigo-300 to-purple-300 dark:from-indigo-900 dark:to-purple-900 rounded-full opacity-20 animate-float" style={{ animationDelay: '-3s' }}></div>
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
        onLogout={handleLogout}
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
                    <AdminSettings user={user} />
                  )}
                </>
              )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;
