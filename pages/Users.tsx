import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { mockService } from '../services/mockService';
import { Trash2, UserPlus, Shield, User as UserIcon } from 'lucide-react';

interface UsersProps {
  currentUser: User;
}

const Users: React.FC<UsersProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', fullName: '', password: '', role: Role.PJA });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setUsers(mockService.getUsers());
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password || !newUser.fullName) return;
    
    await mockService.addUser(newUser);
    setNewUser({ username: '', fullName: '', password: '', role: Role.PJA });
    setIsAdding(false);
    loadUsers();
  };

  const handleDeleteUser = async (id: number) => {
    if (window.confirm('Adakah anda pasti mahu memadam pengguna ini?')) {
      await mockService.deleteUser(id);
      loadUsers();
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Pengurusan Pengguna</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Uruskan akaun Admin dan PJA</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-emerald-600 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:bg-emerald-700 transition-all"
        >
          <UserPlus className="h-5 w-5" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      {isAdding && (
        <div className="glass-effect p-6 rounded-3xl shadow-xl border border-emerald-100 dark:border-emerald-900/30 animate-slide-down">
          <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">ID Pengguna</label>
              <input 
                type="text" 
                value={newUser.username}
                onChange={e => setNewUser({...newUser, username: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border-0 shadow-sm"
                placeholder="cth: ali"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Nama Penuh</label>
              <input 
                type="text" 
                value={newUser.fullName}
                onChange={e => setNewUser({...newUser, fullName: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border-0 shadow-sm"
                placeholder="Nama Penuh"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Kata Laluan</label>
              <input 
                type="password" 
                value={newUser.password}
                onChange={e => setNewUser({...newUser, password: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border-0 shadow-sm"
                placeholder="••••••"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Peranan</label>
              <select 
                value={newUser.role}
                onChange={e => setNewUser({...newUser, role: e.target.value as Role})}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border-0 shadow-sm"
              >
                <option value={Role.PJA}>PJA</option>
                <option value={Role.ADMIN}>Admin</option>
              </select>
            </div>
            <div className="md:col-span-4 lg:col-span-4 flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-500">Batal</button>
              <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold">Simpan</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
          <div key={user.id} className="glass-effect rounded-3xl p-6 border border-white/20 dark:border-white/5 shadow-lg relative group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg text-white ${user.role === Role.ADMIN ? 'bg-gradient-to-br from-teal-500 to-emerald-600' : 'bg-gradient-to-br from-blue-400 to-cyan-500'}`}>
                  {user.role === Role.ADMIN ? <Shield className="w-6 h-6" /> : <UserIcon className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{user.fullName}</h3>
                  <p className="text-sm text-slate-500">@{user.username}</p>
                </div>
              </div>
              {currentUser.id !== user.id && (
                <button 
                  onClick={() => handleDeleteUser(user.id)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.role === Role.ADMIN ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'}`}>
                {user.role}
              </span>
              <span className="text-xs text-slate-400">ID: {user.id}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Users;