import React, { useState } from 'react';
import { User, Role } from '../types';
import { useUsers } from '../hooks/useUsers'; // New Hook
import { Trash2, UserPlus, Shield, User as UserIcon, Edit2, X, Save, Mail, Phone, Loader2 } from 'lucide-react';

interface UsersProps {
  currentUser: User;
  onUserUpdate?: () => void;
}

const Users: React.FC<UsersProps> = ({ currentUser, onUserUpdate }) => {
  // Use Smart Hook
  const { users, addUser, updateUser, deleteUser, isLoading, isSyncing } = useUsers();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
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

  // Sort by Hierarchy (ADMIN > JURUTERA > PJA) then Alphabetically by fullName
  const sortedUsers = [...users].sort((a, b) => {
    const roleOrder = { [Role.ADMIN]: 1, [Role.JURUTERA]: 2, [Role.PJA]: 3 };
    const orderA = roleOrder[a.role as Role] || 99;
    const orderB = roleOrder[b.role as Role] || 99;
    
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    return a.fullName.localeCompare(b.fullName);
  });

  const resetForm = () => {
      setFormData(initialFormState);
      setEditingId(null);
      setIsFormOpen(false);
      setIsSaving(false);
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
    
    setIsSaving(true);
    try {
        if (editingId) {
            await updateUser({ id: editingId, updates: formData });
        } else {
            if (!formData.password) {
                alert('Sila masukkan kata laluan untuk pengguna baru.');
                setIsSaving(false);
                return;
            }
            await addUser(formData);
        }
        
        // No need to manually loadUsers(), the hook updates automatically
        if (onUserUpdate) onUserUpdate();
        resetForm();
    } catch (err) {
        console.error('Failed to save user:', err);
        alert('Gagal menyimpan pengguna. Sila cuba lagi.');
        setIsSaving(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (window.confirm('Adakah anda pasti mahu memadam pengguna ini?')) {
      try {
        await deleteUser(id);
        if (onUserUpdate) onUserUpdate();
      } catch (err) {
        console.error('Failed to delete user:', err);
        alert('Gagal memadam pengguna.');
      }
    }
  };

  const isAdmin = currentUser.role === Role.ADMIN;

  if (isLoading && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-500" />
        <p>Memuatkan senarai pengguna...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
            Pengurusan Pengguna
            {isSyncing && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
          </h1>
          <p className="text-slate-500 mt-1">
            {isAdmin ? 'Uruskan akaun Admin dan PJA serta butiran jabatan.' : 'Lihat maklumat akaun Admin dan PJA.'}
          </p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => { resetForm(); setIsFormOpen(!isFormOpen); }}
            className="bg-blue-600 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-colors"
          >
            {isFormOpen ? <X className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            <span>{isFormOpen ? 'Tutup' : 'Tambah Pengguna'}</span>
          </button>
        )}
      </div>

      {isAdmin && isFormOpen && (
        <div className="bg-white/95 border border-white/10 shadow-xl p-6 rounded-3xl shadow-xl border border-blue-100 animate-slide-up relative">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-200">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  {editingId ? <Edit2 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              </div>
              <h3 className="font-bold text-lg text-slate-800">
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
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="cth: Penolong Jurutera JA29"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Jabatan (Bahagian)</label>
              <input 
                type="text" 
                value={formData.bahagian}
                onChange={e => setFormData({...formData, bahagian: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="cth: Bahagian Infrastruktur"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Unit</label>
              <input 
                type="text" 
                value={formData.unit}
                onChange={e => setFormData({...formData, unit: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="cth: Unit Selenggara Infrastruktur"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Peranan</label>
              <select 
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value as Role})}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value={Role.ADMIN}>Admin</option>
                <option value={Role.JURUTERA}>Jurutera</option>
                <option value={Role.PJA}>PJA</option>
              </select>
            </div>

            <div className="md:col-span-2 lg:col-span-4 flex justify-end gap-3 mt-4 pt-4 border-t border-slate-200">
              <button 
                  type="button" 
                  onClick={resetForm}
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                  Batal
              </button>
              <button 
                  type="submit" 
                  disabled={isSaving}
                  className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedUsers.map(u => (
          <div key={u.id} className="bg-white/95 border border-white/10 shadow-xl rounded-3xl p-6 border border-white/20 shadow-lg relative group transition-colors hover:scale-[1.01]">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg text-white shrink-0 overflow-hidden ${u.role === Role.ADMIN ? 'bg-gradient-to-br from-cyan-500 to-blue-600' : 'bg-gradient-to-br from-blue-400 to-cyan-500'}`}>
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt={u.fullName} className="w-full h-full object-cover" />
                  ) : (
                    u.role === Role.ADMIN ? <Shield className="w-6 h-6" /> : <UserIcon className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 break-words">{u.fullName}</h3>
                  <p className="text-sm text-slate-500">@{u.username}</p>
                </div>
              </div>
              
              {isAdmin && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-colors">
                    <button 
                      onClick={() => handleEditClick(u)}
                      className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {currentUser.id !== u.id && (
                      <button 
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
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
                    <span className="font-medium text-slate-700 text-right break-words ml-4">{u.jawatan || '-'}</span>
                </div>
                <div className="flex justify-between text-xs items-start">
                    <span className="text-slate-400 shrink-0">Jabatan</span>
                    <span className="font-medium text-slate-700 text-right break-words ml-4">{u.bahagian || '-'}</span>
                </div>
                 <div className="flex justify-between text-xs items-start">
                    <span className="text-slate-400 shrink-0">Emel</span>
                    <span className="font-medium text-slate-700 text-right break-all ml-4" title={u.email}>{u.email || '-'}</span>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.role === Role.ADMIN ? 'bg-cyan-100 text-cyan-700' : 'bg-blue-100 text-blue-700'}`}>
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