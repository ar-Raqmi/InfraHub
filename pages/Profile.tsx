import React from 'react';
import { User } from '../types';

interface ProfileProps {
  user: User;
}

const Profile: React.FC<ProfileProps> = ({ user }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <h1 className="text-3xl font-bold gradient-text">Profil Pengguna</h1>
      <div className="glass-effect p-8 rounded-3xl shadow-xl border border-white/20 dark:border-white/5">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{user.fullName}</h2>
            <p className="text-slate-500 dark:text-slate-400">@{user.username}</p>
            <span className="inline-block mt-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
              {user.role}
            </span>
          </div>
        </div>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email</label>
             <p className="text-slate-800 dark:text-slate-200 font-medium">{user.email || '-'}</p>
          </div>
          <div>
             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Telefon</label>
             <p className="text-slate-800 dark:text-slate-200 font-medium">{user.phone || '-'}</p>
          </div>
          <div>
             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Jabatan</label>
             <p className="text-slate-800 dark:text-slate-200 font-medium">{user.department || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
