
import React, { useRef, useState } from 'react';
import { User } from '../types';
import { User as UserIcon, Mail, Building, Shield, Award, Clock, Camera } from 'lucide-react';

interface ProfileProps {
  user: User;
}

const Profile: React.FC<ProfileProps> = ({ user }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState<string | null>(user.avatarUrl || null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);
      // In a real app, you would upload this file to the server here
    }
  };

  return (
    <div className="animate-fade-in-up space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Profil Pengguna</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Maklumat peribadi dan statistik akaun</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Info Card */}
        <div className="lg:col-span-1">
          <div className="glass-effect rounded-3xl p-8 shadow-xl border border-white/20 dark:border-white/5 flex flex-col items-center text-center">
            
            <div className="relative group cursor-pointer" onClick={handleImageClick}>
              <div className={`w-32 h-32 rounded-full flex items-center justify-center text-white font-bold text-4xl shadow-2xl mb-6 ring-4 ring-white dark:ring-slate-800 overflow-hidden ${!profileImage ? 'bg-gradient-to-tr from-indigo-500 to-purple-500' : ''}`}>
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user.username.substring(0,2).toUpperCase()
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity mb-6">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{user.fullName}</h2>
            <span className={`mt-2 px-4 py-1.5 rounded-full text-xs font-bold ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
              {user.role}
            </span>
            
            <div className="w-full mt-8 space-y-4 text-left">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <Mail className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Email</p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{user.email || '-'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <Building className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Jabatan / Zon</p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{user.department || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Stats & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="glass-effect rounded-3xl p-6 border border-white/20 dark:border-white/5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">12</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Projek Disiapkan</p>
              </div>
            </div>
            <div className="glass-effect rounded-3xl p-6 border border-white/20 dark:border-white/5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">5</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Projek Aktif</p>
              </div>
            </div>
          </div>

          {/* Recent Logins / Security */}
          <div className="glass-effect rounded-3xl p-8 shadow-xl border border-white/20 dark:border-white/5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-500" /> Keselamatan
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Tukar Kata Laluan</p>
                  <p className="text-xs text-slate-500">Terakhir dikemaskini 3 bulan lepas</p>
                </div>
                <button className="px-4 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-white rounded-xl text-sm font-bold shadow-sm hover:bg-slate-100 transition-all">
                  Tukar
                </button>
              </div>
              <div className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Pengesahan 2 Faktor (2FA)</p>
                  <p className="text-xs text-slate-500">Tingkatkan keselamatan akaun anda</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
