import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Role } from '../types';
import { supabaseService } from '../services/supabaseService';
import { Camera, Lock, Save, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, X, Info, Trash2, AlertTriangle } from 'lucide-react';

interface ProfileProps {
  user: User;
  onUserUpdate?: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user: initialUser, onUserUpdate }) => {
  const [user, setUser] = useState<User>(initialUser);
  const [isUploading, setIsUploading] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
        alert("Fail terlalu besar. Sila pilih gambar di bawah 20MB.");
        return;
    }

    setIsUploading(true);
    try {
      const compressedBase64 = await compressImage(file);
      const updatedUser = await supabaseService.updateUser(user.id, { avatarUrl: compressedBase64 });
      setUser(updatedUser);
      if (onUserUpdate) onUserUpdate(); 
      setSuccessMessage('Gambar profil berjaya dikemaskini.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error("Compression/Upload error:", err);
      alert("Gagal memproses gambar.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploading(true);
    setIsDeleteDialogOpen(false);
    try {
        const updatedUser = await supabaseService.updateUser(user.id, { avatarUrl: '' });
        setUser(updatedUser);
        if (onUserUpdate) onUserUpdate();
        setSuccessMessage('Gambar profil telah dipadam.');
        setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
        console.error("Remove error:", err);
        alert("Gagal memadam gambar.");
    } finally {
        setIsUploading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (passwordData.current !== user.password) {
        setPasswordError('Kata laluan semasa tidak tepat.');
        return;
    }
    if (passwordData.new.length < 6) {
        setPasswordError('Kata laluan baru mestilah sekurang-kurangnya 6 aksara.');
        return;
    }
    if (passwordData.new !== passwordData.confirm) {
        setPasswordError('Sahkan kata laluan baru tidak sepadan.');
        return;
    }

    setIsUploading(true);
    try {
        const updatedUser = await supabaseService.updateUser(user.id, { password: passwordData.new });
        setUser(updatedUser);
        if (onUserUpdate) onUserUpdate(); 
        setIsChangingPassword(false);
        setPasswordData({ current: '', new: '', confirm: '' });
        setSuccessMessage('Kata laluan berjaya ditukar.');
        setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
        setPasswordError('Ralat sistem. Sila cuba lagi.');
    } finally {
        setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold gradient-text">Profil Pengguna</h1>
        {successMessage && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50  text-emerald-600  rounded-xl border border-emerald-100  text-xs font-bold animate-in fade-in slide-in-from-right-4">
                <CheckCircle className="w-4 h-4" /> {successMessage}
            </div>
        )}
      </div>

      <div className="bg-white/95  border border-white/10 shadow-xl p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-white/20  relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full  -mr-32 -mt-32"></div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
          <div className="relative group">
            {user.avatarUrl && !isUploading && (
                <button 
                    onClick={(e) => { e.stopPropagation(); setIsDeleteDialogOpen(true); }}
                    className="absolute -top-2 -right-2 w-10 h-10 bg-white  rounded-full flex items-center justify-center shadow-xl border border-slate-100  text-red-500 hover:text-red-600  transition-colors z-20 group/remove"
                    title="Padam Foto"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            )}

            <div 
              onClick={handleAvatarClick}
              className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-5xl font-bold shadow-2xl cursor-pointer overflow-hidden border-4 border-white  transition-transform"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                user.username.charAt(0).toUpperCase()
              )}
              
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <Camera className="w-8 h-8 text-white" />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Tukar Foto</span>
              </div>
            </div>
            
            {isUploading && (
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white  rounded-full flex items-center justify-center shadow-lg border border-slate-100">
                    <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                </div>
            )}
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*" 
            />
          </div>

          <div className="flex-1 text-center md:text-left pt-2">
                          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                            <h2 className="text-3xl font-black text-slate-900 leading-tight break-words">{user.fullName}</h2>
                            <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest self-center md:self-auto ${user.role === Role.ADMIN ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                              {user.role}
                            </span>
            
            </div>
            <p className="text-lg text-slate-500  font-medium">@{user.username}</p>
            
            <div className="mt-8 grid grid-cols-3 sm:grid-cols-1 gap-6">
                <div className="bg-slate-50/50  p-4 rounded-2xl border border-slate-100">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email Rasmi</label>
                    <p className="text-sm text-slate-800  font-bold break-all leading-tight">{user.email || 'N/A'}</p>
                </div>
                <div className="bg-slate-50/50  p-4 rounded-2xl border border-slate-100">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">No. Telefon</label>
                    <p className="text-sm text-slate-800  font-bold break-all leading-tight">{user.phone || 'N/A'}</p>
                </div>
                <div className="bg-slate-50/50  p-4 rounded-2xl border border-slate-100">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Jabatan</label>
                    <p className="text-sm text-slate-800  font-bold leading-tight">{user.bahagian || user.department || 'N/A'}</p>
                </div>
            </div>
          </div>
        </div>
        
        <div className="mt-10 pt-8 border-t border-slate-100  flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400">
                <Info className="w-4 h-4" />
                <p className="text-xs font-medium italic">Gambar profil akan dimampatkan secara automatik untuk menjimatkan storan.</p>
            </div>
            
            <button 
                onClick={() => setIsChangingPassword(!isChangingPassword)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-colors shadow-md  ${isChangingPassword ? 'bg-slate-200 text-slate-600   hover:bg-slate-300' : 'bg-white  text-emerald-600 border border-emerald-100  hover:bg-emerald-50'}`}
            >
                {isChangingPassword ? <X className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {isChangingPassword ? 'Batal Tukar Password' : 'Tukar Kata Laluan'}
            </button>
        </div>

        {isChangingPassword && (
            <div className="mt-8 p-8 bg-slate-50  rounded-[2rem] border border-emerald-100  animate-slide-up">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100  text-emerald-600 flex items-center justify-center">
                        <Lock className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Keselamatan Akaun</h3>
                </div>

                <form onSubmit={handlePasswordSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Kata Laluan Semasa</label>
                        <div className="relative">
                            <input 
                                type={showCurrentPassword ?"text" :"password"}
                                value={passwordData.current}
                                onChange={e => setPasswordData({...passwordData, current: e.target.value})}
                                className="w-full px-4 py-3 rounded-xl bg-white  border border-slate-200  outline-none focus:ring-2 focus:ring-emerald-500 transition-colors text-sm font-bold"
                                required
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500"
                            >
                                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Kata Laluan Baru</label>
                        <div className="relative">
                            <input 
                                type={showNewPassword ?"text" :"password"}
                                value={passwordData.new}
                                onChange={e => setPasswordData({...passwordData, new: e.target.value})}
                                className="w-full px-4 py-3 rounded-xl bg-white  border border-slate-200  outline-none focus:ring-2 focus:ring-emerald-500 transition-colors text-sm font-bold"
                                required
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500"
                            >
                                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Sahkan Kata Laluan</label>
                        <input 
                            type="password"
                            value={passwordData.confirm}
                            onChange={e => setPasswordData({...passwordData, confirm: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl bg-white  border border-slate-200  outline-none focus:ring-2 focus:ring-emerald-500 transition-colors text-sm font-bold"
                            required
                        />
                    </div>

                    {passwordError && (
                        <div className="md:col-span-3 flex items-center gap-2 p-4 rounded-xl bg-red-50  text-red-600  text-xs font-bold border border-red-100">
                            <AlertCircle className="w-4 h-4" /> {passwordError}
                        </div>
                    )}

                    <div className="md:col-span-3 flex justify-end gap-3 pt-2">
                        <button 
                            type="submit" 
                            disabled={isUploading}
                            className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-colors flex items-center gap-2  disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {isUploading ? 'Menyimpan...' : 'Kemaskini Kata Laluan'}
                        </button>
                    </div>
                </form>
            </div>
        )}
      </div>

      {/* Custom Confirmation Modal for Deletion */}
      {isDeleteDialogOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60  animate-fade-in" onClick={() => setIsDeleteDialogOpen(false)}>
            <div 
              className="bg-white  rounded-3xl shadow-2xl max-w-md w-full p-8 border border-slate-200  transform scale-100 transition-colors animate-slide-up relative" 
              onClick={e => e.stopPropagation()}
            >
                <div className="flex flex-col items-center text-center">
                   <div className="w-20 h-20 bg-red-50  rounded-full flex items-center justify-center mb-6 text-red-500">
                      <div className="w-14 h-14 bg-red-100  rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 stroke-[1.5]" />
                      </div>
                   </div>

                   <h3 className="text-2xl font-bold text-slate-900  mb-2 font-manrope">
                     Padam Gambar Profil?
                   </h3>
                   
                   <p className="text-slate-500  mb-8 text-sm leading-relaxed px-4">
                     Adakah anda pasti mahu memadam gambar profil anda? Tindakan ini tidak boleh dibatalkan.
                   </p>
                   
                   <div className="flex gap-3 w-full">
                      <button 
                        onClick={() => setIsDeleteDialogOpen(false)}
                        className="flex-1 py-3.5 px-4 bg-white  text-slate-700  rounded-xl font-bold hover:bg-slate-50  transition-colors border border-slate-200  shadow-sm hover:shadow-md"
                      >
                        Batal
                      </button>
                      <button 
                        onClick={handleRemoveAvatar}
                        className="flex-1 py-3.5 px-4 rounded-xl font-bold text-white transition-colors flex items-center justify-center gap-2 shadow-lg bg-red-600 hover:bg-red-700 shadow-red-600/30"
                      >
                         <Trash2 className="w-4 h-4" />
                         Ya, Padam
                      </button>
                   </div>
                </div>
            </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Profile;