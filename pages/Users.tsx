import React, { useState } from 'react';
import { User, Role } from '../types';
import { useUsers } from '../hooks/useUsers'; // New Hook
import { Trash2, UserPlus, Edit2, X, Save, Mail, Phone, Loader2 } from 'lucide-react';
import UserAvatar from '../components/admin/UserAvatar';
import UserMobileList from '../components/admin/UserMobileList';
import UserDetailSheet from '../components/admin/UserDetailSheet';
import MobilePortal from '../components/admin/MobilePortal';

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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
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
      setSelectedUser(null);
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
        setSelectedUser(null);
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
        <Loader2 className="w-8 h-8 animate-spin mb-2 text-emerald-500" />
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
            className="bg-emerald-600 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:bg-emerald-700 transition-colors"
          >
            {isFormOpen ? <X className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            <span>{isFormOpen ? 'Tutup' : 'Tambah Pengguna'}</span>
          </button>
        )}
      </div>

      {isAdmin && isFormOpen && (
        <MobilePortal>
        <div className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain bg-white px-4 pt-4 md:inset-auto md:z-auto md:overflow-visible md:bg-white/95 border border-white/10 shadow-xl md:p-6 md:rounded-3xl shadow-xl border border-emerald-100 animate-slide-up md:relative">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-200">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                  {editingId ? <Edit2 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              </div>
              <h3 className="flex-1 font-bold text-lg text-slate-800">
                  {editingId ? 'Kemaskini Pengguna' : 'Tambah Pengguna Baru'}
              </h3>
              <button type="button" onClick={resetForm} aria-label="Tutup" className="md:hidden w-11 h-11 flex items-center justify-center rounded-xl text-slate-500 active:bg-slate-100">
                  <X className="w-5 h-5" />
              </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Nama Penuh (PJA)</label>
              <input 
                type="text" 
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none"
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
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none"
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
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none"
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
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none"
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
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none"
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
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="cth: Penolong Jurutera JA29"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Jabatan (Bahagian)</label>
              <input 
                type="text" 
                value={formData.bahagian}
                onChange={e => setFormData({...formData, bahagian: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="cth: Bahagian Infrastruktur"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Unit</label>
              <input 
                type="text" 
                value={formData.unit}
                onChange={e => setFormData({...formData, unit: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="cth: Unit Selenggara Infrastruktur"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Peranan</label>
              <select 
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value as Role})}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value={Role.ADMIN}>Admin</option>
                <option value={Role.JURUTERA}>Jurutera</option>
                <option value={Role.PJA}>PJA</option>
              </select>
            </div>

            <div className="sticky bottom-0 -mx-4 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-white md:static md:mx-0 md:px-0 md:pt-4 md:pb-0 md:bg-transparent md:col-span-2 lg:col-span-4 flex justify-end gap-3 md:mt-4 border-t border-slate-200">
              <button 
                  type="button" 
                  onClick={resetForm}
                  disabled={isSaving}
                  className="flex-1 md:flex-none min-h-[48px] md:min-h-0 border border-slate-200 md:border-0 px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                  Batal
              </button>
              <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-1 md:flex-none min-h-[48px] md:min-h-0 justify-center px-8 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
        </MobilePortal>
      )}

      <UserMobileList users={sortedUsers} onSelect={setSelectedUser} />

      <UserDetailSheet
        user={selectedUser}
        canManage={isAdmin}
        canDelete={selectedUser !== null && currentUser.id !== selectedUser.id}
        onClose={() => setSelectedUser(null)}
        onEdit={handleEditClick}
        onDelete={handleDeleteUser}
      />

      <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedUsers.map(u => (
          <div key={u.id} className="bg-white/95 border border-white/10 shadow-xl rounded-3xl p-6 border border-white/20 shadow-lg relative group transition-colors hover:scale-[1.01]">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <UserAvatar user={u} />
                <div>
                  <h3 className="font-bold text-slate-900 break-words">{u.fullName}</h3>
                  <p className="text-sm text-slate-500">@{u.username}</p>
                </div>
              </div>
              
              {isAdmin && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-colors">
                    <button 
                      onClick={() => handleEditClick(u)}
                      className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-colors"
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
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.role === Role.ADMIN ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'}`}>
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