import React, { useState } from 'react';
import { mockService } from '../services/mockService';
import { User } from '../types';
import { Hexagon, ArrowRight } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await mockService.login(username, password);
      onLogin(user);
    } catch (err) {
      setError('Nama pengguna atau kata laluan salah.');
    }
  };

  return (
    <div className="h-screen w-full bg-slate-50 relative overflow-hidden flex items-center justify-center p-4 font-manrope">
      
      {/* Theme Toggle Top Right */}
      <div className="absolute top-6 right-6 z-50">
         <ThemeToggle />
      </div>

      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-pink-50 dark:from-slate-900 dark:to-slate-950">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-teal-300/30 rounded-full blur-[80px] animate-float"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-300/30 rounded-full blur-[80px] animate-float" style={{ animationDelay: '-2s' }}></div>
        </div>
      </div>

      <div className="w-full max-w-md bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[40px] p-8 md:p-12 shadow-2xl border border-white/50 dark:border-white/10 relative z-10 animate-fade-in-up">
        
        <div className="flex flex-col items-center mb-10">
           <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/30 animate-glow transform hover:scale-110 transition-transform duration-500">
             <Hexagon className="h-8 w-8 text-white fill-current" />
           </div>
           <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">InfraHub</h1>
           <p className="text-slate-500 dark:text-slate-400 text-center font-medium">Sistem Pengurusan Projek 
             <br/> Jabatan Kejuruteraan
           </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">ID Pengguna</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-slate-900 dark:text-white placeholder-slate-400 shadow-sm"
              // placeholder="Contoh: syafiq"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">Kata Laluan</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-slate-900 dark:text-white placeholder-slate-400 shadow-sm"
              // placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-300 text-sm font-medium text-center animate-pulse">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-lg hover:bg-emerald-600 dark:hover:bg-emerald-50 transition-all shadow-xl shadow-slate-900/10 dark:shadow-white/5 mt-4 flex items-center justify-center gap-2 group"
          >
            Log Masuk <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-slate-200 dark:border-white/10 text-center">
           <div className="inline-flex gap-2 text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
             <span>syafiq / password</span>
             <span className="opacity-30">|</span>
             <span>khairul / password</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
