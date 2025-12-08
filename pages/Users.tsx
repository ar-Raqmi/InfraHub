

import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { mockService } from '../services/mockService';
import { Trash2, UserPlus, Shield, User as UserIcon, Edit2, X, Save } from 'lucide-react';

interface UsersProps {
  currentUser: User;
}

const Users: React.FC<UsersProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const initialFormState = { 
    username: '', 
    fullName: '', 
    password: '', 
    role: Role.PJA,
    jawatan: '',
    bahagian: 'Bahagian Infrastruktur',
    unit: 'Unit Selenggara Infrastruktur'
  };
  
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setUsers(mockService.getUsers());
  };

  const resetForm = () => {
      setFormData(initialFormState);
      setEditingId(null);
      setIsFormOpen(false);
  };

  const handleEditClick = (user: User) => {
      setFormData({
          username: user.username,
          fullName: user.fullName,
          password: user.password || '',
          role: user.role,
          jawatan: user.jawatan || '',
          bahagian: user.bahagian || '',
          unit: user.unit || ''
      });
      setEditingId(user.id);
      setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.fullName) return;
    
    if (editingId) {
        await mockService.updateUser(editingId, formData);
    } else {
        if (!formData.password) {
            alert('Sila masukkan kata laluan untuk pengguna baru.');
            return;
        }
        await mockService.addUser(formData);
    }
    
    loadUsers();
    resetForm();
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
          <p className="text-slate-500 dark:text-slate-400 mt-1">Uruskan akaun Admin dan PJA serta butiran jabatan.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsFormOpen(!isFormOpen); }}
          className="bg-emerald-600 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:bg-emerald-700 transition-all"
        >
          {isFormOpen ? <X className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
          <span>{isFormOpen ? 'Tutup' : 'Tambah Pengguna'}</span>
        </button>
      </div>

      {isFormOpen && (
        <div className="glass-effect p-6 rounded-3xl shadow-xl border border-emerald-100 dark:border-emerald-900/30 animate-slide-down relative">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-200 dark:border-white/10">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
                  {editingId ? <Edit2 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              </div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                  {editingId ? 'Kemaskini Pengguna' : 'Tambah Pengguna Baru'}
              </h3>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Nama Penuh (PJA)</label>
              <input 
                type="text" 
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="cth: Mohamad Khairul..."
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">ID Pengguna</label>
              <input 
                type="text" 
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="cth: khairul"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Kata Laluan</label>
              <input 
                type="password" 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder={editingId ? "Biarkan kosong jika sama" : "••••••"}
              />
            </div>
            
            {/* Extended Details */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Jawatan</label>
              <input 
                type="text" 
                value={formData.jawatan}
                onChange={e => setFormData({...formData, jawatan: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="cth: Penolong Jurutera JA29"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Bahagian</label>
              <input 
                type="text" 
                value={formData.bahagian}
                onChange={e => setFormData({...formData, bahagian: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="cth: Bahagian Infrastruktur"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Unit</label>
              <input 
                type="text" 
                value={formData.unit}
                onChange={e => setFormData({...formData, unit: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="cth: Unit Selenggara Infrastruktur"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Peranan</label>
              <select 
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value as Role})}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value={Role.PJA}>PJA</option>
                <option value={Role.ADMIN}>Admin</option>
              </select>
            </div>

            <div className="md:col-span-2 lg:col-span-4 flex justify-end gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
              <button 
                  type="button" 
                  onClick={resetForm} 
                  className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                  Batal
              </button>
              <button 
                  type="submit" 
                  className="px-8 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2"
              >
                  <Save className="w-4 h-4" />
                  Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
          <div key={user.id} className="glass-effect rounded-3xl p-6 border border-white/20 dark:border-white/5 shadow-lg relative group transition-all hover:scale-[1.01]">
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
              
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={() => handleEditClick(user)}
                    className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {currentUser.id !== user.id && (
                    <button 
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                      title="Padam"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
              </div>
            </div>

            <div className="mt-6 space-y-2">
                <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Jawatan</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{user.jawatan || '-'}</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Bahagian</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{user.bahagian || '-'}</span>
                </div>
                 <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Unit</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{user.unit || '-'}</span>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.role === Role.ADMIN ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
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