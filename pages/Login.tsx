import React, { useState } from 'react';
import { apiService } from '../services/apiService';
import { User as UserType } from '../types';
import { HardHat, User, Lock, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLogin: (user: UserType) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen bg-slate-50  flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-emerald-500/30">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-b from-emerald-50/50 to-transparent"></div>
      </div>

      <div className="w-full max-w-md bg-white/95  rounded-[40px] p-8 md:p-12 shadow-2xl border border-white/50  relative z-10 animate-fade-in">
        
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/30">
            <HardHat className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
          <h2 className="text-4xl font-black text-slate-900  mb-2 tracking-tight font-jakarta">InfraHub</h2>
          <p className="text-slate-500  font-bold uppercase tracking-[0.2em] text-[10px]">by Syafiq Daniel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400  uppercase tracking-widest ml-1">ID Pengguna</label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                <User className="w-5 h-5" />
              </div>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder=""
                className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-50  border border-slate-200  focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow text-slate-900  placeholder-slate-400 shadow-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400  uppercase tracking-widest ml-1">Kata Laluan</label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=""
                className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-50  border border-slate-200  focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow text-slate-900  placeholder-slate-400 shadow-sm"
                required
              />
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
            className="w-full py-4 bg-slate-900  text-white  rounded-2xl font-bold text-lg hover:bg-emerald-600  transition-colors shadow-xl shadow-slate-900/10  mt-4 flex items-center justify-center gap-2 group disabled:opacity-70"
          >
            {loading ? 'Sila tunggu...' : 'Log Masuk'} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;