import React, { useState } from 'react';
import { apiService } from '../services/apiService';
import { User as UserType } from '../types';
import { HardHat, User, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLogin: (user: UserType) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await apiService.login(username, password);
      onLogin(user);
    } catch (err) {
      setError('Nama pengguna atau kata laluan salah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50  flex items-start justify-center p-4 pt-10 md:items-center md:pt-4 relative overflow-hidden font-sans selection:bg-emerald-500/30">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-b from-emerald-50/50 to-transparent"></div>
      </div>

      <div className="w-full max-w-md bg-white/95  rounded-[40px] p-6 md:p-12 shadow-2xl border border-white/50  relative z-10 animate-fade-in">
        
        <div className="flex flex-row md:flex-col items-center gap-4 md:gap-0 mb-6 md:mb-10">
          <div className="w-12 h-12 md:w-16 md:h-16 shrink-0 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center md:mb-6 shadow-xl shadow-emerald-500/30">
            <HardHat className="w-7 h-7 md:w-10 md:h-10 text-white" strokeWidth={2.5} />
          </div>
          <div className="md:text-center">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900  mb-1 md:mb-2 tracking-tight font-jakarta">InfraHub</h2>
            <p className="text-slate-500  font-bold uppercase tracking-[0.2em] text-[10px]">by Syafiq Daniel</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
          <div className="space-y-2">
            <label htmlFor="login-username" className="text-[10px] font-black text-slate-400  uppercase tracking-widest ml-1">ID Pengguna</label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                <User className="w-5 h-5" />
              </div>
              <input 
                id="login-username"
                type="text" 
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder=""
                className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-50  border border-slate-200  focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow text-slate-900  placeholder-slate-400 shadow-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="login-password" className="text-[10px] font-black text-slate-400  uppercase tracking-widest ml-1">Kata Laluan</label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <input 
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=""
                className="w-full pl-12 pr-14 md:pr-5 py-4 rounded-2xl bg-slate-50  border border-slate-200  focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow text-slate-900  placeholder-slate-400 shadow-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Sembunyikan kata laluan' : 'Tunjuk kata laluan'}
                className="md:hidden absolute right-1.5 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-xl text-slate-400 active:bg-slate-100"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-red-50  border border-red-100  text-red-600  text-sm font-medium text-center">
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-slate-900  text-white  rounded-2xl font-bold text-lg hover:bg-emerald-600  transition-colors shadow-xl shadow-slate-900/10  mt-2 md:mt-4 flex items-center justify-center gap-2 group disabled:opacity-70"
          >
            {loading ? 'Sila tunggu...' : 'Log Masuk'} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;