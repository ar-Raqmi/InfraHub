import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { supabaseService } from '../services/supabaseService';
import { Trash2, UserPlus, Shield, User as UserIcon, Edit2, X, Save, Mail, Phone } from 'lucide-react';

interface UsersProps {
  currentUser: User;
  onUserUpdate?: () => void;
}

const Users: React.FC<UsersProps> = ({ currentUser, onUserUpdate }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const initialFormState = { 
    username: '', 
    fullName: '', 
    password: '', 
    email: '',
    phone: '',
    role: Role.PJA,
    jawatan: '',
    bahagian: 'Bahagian Infrastruktur',
    unit: 'Unit Selenggara Infrastruktur'
  };
  
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
        const data = await supabaseService.getUsers();
        
        // Sort by Hierarchy (ADMIN > JURUTERA > PJA) then Alphabetically by fullName
        const sortedData = [...data].sort((a, b) => {
          const roleOrder = { [Role.ADMIN]: 1, [Role.JURUTERA]: 2, [Role.PJA]: 3 };
          const orderA = roleOrder[a.role as Role] || 99;
          const orderB = roleOrder[b.role as Role] || 99;
          
          if (orderA !== orderB) {
            return orderA - orderB;
          }
          
          return a.fullName.localeCompare(b.fullName);
        });

        setUsers(sortedData);
    } catch (err) {
        console.error('Failed to load users:', err);
    }
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
          email: user.email || '',
          phone: user.phone || '',
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
    
    try {
        if (editingId) {
            await supabaseService.updateUser(editingId, formData);
        } else {
            if (!formData.password) {
                alert('Sila masukkan kata laluan untuk pengguna baru.');
                return;
            }
            await supabaseService.addUser(formData);
        }
        
        await loadUsers();
        if (onUserUpdate) onUserUpdate();
        resetForm();
    } catch (err) {
        console.error('Failed to save user:', err);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (window.confirm('Adakah anda pasti mahu memadam pengguna ini?')) {
      try {
        await supabaseService.deleteUser(id);
        await loadUsers();
        if (onUserUpdate) onUserUpdate();
      } catch (err) {
        console.error('Failed to delete user:', err);
      }
    }
  };

  const isAdmin = currentUser.role === Role.ADMIN;

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Pengurusan Pengguna</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {isAdmin ? 'Uruskan akaun Admin dan PJA serta butiran jabatan.' : 'Lihat maklumat akaun Admin dan PJA.'}
          </p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => { resetForm(); setIsFormOpen(!isFormOpen); }}
            className="bg-emerald-600 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:bg-emerald-700 transition-all"
          >
            {isFormOpen ? <X className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            <span>{isFormOpen ? 'Tutup' : 'Tambah Pengguna'}</span>
          </button>
        )}
      </div>

      {isAdmin && isFormOpen && (
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

            {/* Email & Phone */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Email Rasmi</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="cth: user@mps.gov.my"
                />
              </div>
            </div>
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">No. Telefon</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="cth: 012-3456789"
                />
              </div>
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
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Jabatan (Bahagian)</label>
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
                <option value={Role.ADMIN}>Admin</option>
                <option value={Role.JURUTERA}>Jurutera</option>
                <option value={Role.PJA}>PJA</option>
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
        {users.map(u => (
          <div key={u.id} className="glass-effect rounded-3xl p-6 border border-white/20 dark:border-white/5 shadow-lg relative group transition-all hover:scale-[1.01]">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg text-white shrink-0 overflow-hidden ${u.role === Role.ADMIN ? 'bg-gradient-to-br from-teal-500 to-emerald-600' : 'bg-gradient-to-br from-blue-400 to-cyan-500'}`}>
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt={u.fullName} className="w-full h-full object-cover" />
                  ) : (
                    u.role === Role.ADMIN ? <Shield className="w-6 h-6" /> : <UserIcon className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white break-words">{u.fullName}</h3>
                  <p className="text-sm text-slate-500">@{u.username}</p>
                </div>
              </div>
              
              {isAdmin && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => handleEditClick(u)}
                      className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {currentUser.id !== u.id && (
                      <button 
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                        title="Padam"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                </div>
              )}
            </div>

            <div className="mt-6 space-y-2">
                <div className="flex justify-between text-xs items-start">
                    <span className="text-slate-400 shrink-0">Jawatan</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 text-right break-words ml-4">{u.jawatan || '-'}</span>
                </div>
                <div className="flex justify-between text-xs items-start">
                    <span className="text-slate-400 shrink-0">Jabatan</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 text-right break-words ml-4">{u.bahagian || '-'}</span>
                </div>
                 <div className="flex justify-between text-xs items-start">
                    <span className="text-slate-400 shrink-0">Emel</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 text-right break-all ml-4" title={u.email}>{u.email || '-'}</span>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.role === Role.ADMIN ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                {u.role}
              </span>
              <span className="text-xs text-slate-400">ID: {u.id}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Users;