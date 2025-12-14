


import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { mockService } from '../services/mockService';
import { Trash2, Plus, Building2, FileDigit, ShieldAlert, Calendar, Info, Edit2, X, Save, FileText, AlertTriangle } from 'lucide-react';
import { User, Role, CompanyDetail } from '../types';

interface AdminSettingsProps {
  user: User;
  selectedYear: number;
}

// Custom Date Input Component matching the requested style
const DatePickerInput = ({ value, onChange, placeholder }: { value: string, onChange: (val: string) => void, placeholder?: string }) => {
    // Helper: "17 Disember 2024" -> "2024-12-17"
    const malayToIso = (str: string) => {
        if (!str) return '';
        const parts = str.split(' ');
        if (parts.length !== 3) return '';
        
        const day = parts[0].padStart(2, '0');
        const months = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"];
        const monthName = parts[1];
        
        // Find month index case-insensitive
        const monthIdx = months.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
        
        if (monthIdx === -1) return '';
        
        return `${parts[2]}-${String(monthIdx + 1).padStart(2, '0')}-${day}`;
    };

    // Helper: "2024-12-17" -> "17 Disember 2024"
    const isoToMalay = (iso: string) => {
        if (!iso) return '';
        const [y, m, d] = iso.split('-');
        const months = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"];
        return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`;
    };

    // Helper: "17 Disember 2024" -> "17/12/2024"
    const malayToDisplay = (str: string) => {
        const iso = malayToIso(str);
        if (!iso) return str; // Return original if parsing fails (fallback)
        const [y, m, d] = iso.split('-');
        return `${d}/${m}/${y}`;
    };

    // Helper: "17/12/2024" -> "17 Disember 2024"
    const displayToMalay = (disp: string) => {
        const parts = disp.trim().split(/[\/\-\.]/); // Allow / . -
        if (parts.length !== 3) return '';
        
        const d = parts[0].padStart(2, '0');
        const m = parts[1].padStart(2, '0');
        let y = parts[2];
        
        if (y.length === 2) y = "20" + y; // Simple year handling

        const months = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"];
        const mInt = parseInt(m);
        if (mInt < 1 || mInt > 12) return '';
        
        return `${parseInt(d)} ${months[mInt-1]} ${y}`;
    };

    // Internal state for text input (DD/MM/YYYY)
    const [text, setText] = useState('');

    // Sync internal text when parent value changes
    useEffect(() => {
        setText(malayToDisplay(value));
    }, [value]);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setText(val);
        
        // Basic validation for DD/MM/YYYY or D/M/YYYY
        if (/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}$/.test(val)) {
             const malay = displayToMalay(val);
             if (malay) onChange(malay);
        } else if (val === '') {
            onChange('');
        }
    };

    const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const iso = e.target.value;
        if (iso) {
            onChange(isoToMalay(iso));
        }
    };

    return (
        <div className="relative flex items-center w-full px-4 py-3 rounded-lg bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700/50 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-slate-200 shadow-sm dark:shadow-inner h-14">
            <input 
                type="text" 
                value={text}
                onChange={handleTextChange}
                placeholder={placeholder || "DD/MM/YYYY"}
                className="w-full h-full bg-transparent border-none outline-none p-0 text-inherit placeholder-slate-400 font-bold"
            />
            <div className="relative ml-2 w-5 h-5 shrink-0 group">
                <Calendar className="w-5 h-5 pointer-events-none text-slate-400 group-hover:text-emerald-500 transition-colors" />
                <input 
                    type="date" 
                    value={malayToIso(value)}
                    onChange={handlePickerChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    tabIndex={-1}
                />
            </div>
        </div>
    );
};

const AdminSettings: React.FC<AdminSettingsProps> = ({ user, selectedYear }) => {
  const [companies, setCompanies] = useState<string[]>([]);
  const [voteNumbers, setVoteNumbers] = useState<string[]>([]);
  const [sebuthargaNumbers, setSebuthargaNumbers] = useState<string[]>([]);
  
  const [newCompany, setNewCompany] = useState('');
  const [newVote, setNewVote] = useState('');
  const [newSebutharga, setNewSebutharga] = useState('');
  
  // Meeting Settings
  const [meetingDate, setMeetingDate] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Company Edit Modal
  const [companyToEdit, setCompanyToEdit] = useState<CompanyDetail | null>(null);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);

  // Delete Modal State
  const [deleteConfig, setDeleteConfig] = useState<{
      isOpen: boolean;
      type: 'COMPANY' | 'VOTE' | 'SEBUTHARGA' | null;
      value: string;
  }>({ isOpen: false, type: null, value: '' });

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const loadData = () => {
    setCompanies(mockService.getCompanies(selectedYear));
    setVoteNumbers(mockService.getVoteNumbers(selectedYear));
    setSebuthargaNumbers(mockService.getSebuthargaNumbers(selectedYear));
    
    // Load settings for specific year
    const settings = mockService.getSettings(selectedYear);
    setMeetingDate(settings.meetingDate || '');
  };

  const handleAddCompany = () => {
    if (newCompany.trim()) {
      mockService.addCompany(selectedYear, newCompany.trim());
      setNewCompany('');
      loadData();
    }
  };

  const initiateDelete = (type: 'COMPANY' | 'VOTE' | 'SEBUTHARGA', value: string) => {
      setDeleteConfig({ isOpen: true, type, value });
  };

  const confirmDelete = async () => {
      const { type, value } = deleteConfig;
      if (type === 'COMPANY') {
          await mockService.deleteCompany(selectedYear, value);
      } else if (type === 'VOTE') {
          await mockService.deleteVoteNumber(selectedYear, value);
      } else if (type === 'SEBUTHARGA') {
          await mockService.deleteSebuthargaNumber(selectedYear, value);
      }
      setDeleteConfig({ isOpen: false, type: null, value: '' });
      loadData();
  };

  const openCompanyModal = (name: string) => {
      const details = mockService.getCompanyDetails(selectedYear, name);
      if (details) {
          setCompanyToEdit(details);
      } else {
          // Initialize empty details for existing string-only company
          setCompanyToEdit({
              name: name,
              address: '',
              ownerName: '',
              phone: '',
              email: '',
              gred: 'G1',
              phoneAlt: '',
              registrationNumber: ''
          });
      }
      setIsCompanyModalOpen(true);
  };

  const handleSaveCompanyDetails = async (e: React.FormEvent) => {
      e.preventDefault();
      if (companyToEdit) {
          await mockService.saveCompanyDetails(selectedYear, companyToEdit);
          setIsCompanyModalOpen(false);
          setCompanyToEdit(null);
          loadData();
      }
  };

  const handleAddVote = () => {
    if (newVote.trim()) {
      mockService.addVoteNumber(selectedYear, newVote.trim());
      setNewVote('');
      loadData();
    }
  };

  const handleAddSebutharga = () => {
    if (newSebutharga.trim()) {
      mockService.addSebuthargaNumber(selectedYear, newSebutharga.trim());
      setNewSebutharga('');
      loadData();
    }
  };

  const handleSaveSettings = async () => {
      setIsSavingSettings(true);
      await mockService.updateSettings(selectedYear, { meetingDate });
      setTimeout(() => setIsSavingSettings(false), 500);
  };

  if (user.role !== Role.ADMIN) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500">
        <ShieldAlert className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Akses Ditolak</h2>
        <p>Hanya Admin boleh mengakses tetapan ini.</p>
      </div>
    );
  }

  const inputClass = "w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-blue-500 text-sm";
  const labelClass = "block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1";

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Tetapan Sistem</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Uruskan data utama bagi tahun <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedYear}</span>.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Meeting Settings */}
        <div className="glass-effect rounded-3xl p-8 border border-white/20 dark:border-white/5 shadow-xl xl:col-span-2 relative overflow-hidden group">
            {/* Background Blob */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 dark:bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none transition-opacity opacity-50 group-hover:opacity-100"></div>

            <div className="flex items-center gap-4 mb-8 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-sm border border-orange-100 dark:border-orange-800/30">
                    <Calendar className="w-7 h-7" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Tetapan Mesyuarat</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800/50">
                            Tahun {selectedYear}
                        </span>
                    </div>
                </div>
            </div>
            
            <div className="relative z-10 mt-2">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 font-jakarta pl-1">
                    Tarikh Sidang Jawatankuasa Sebutharga
                </label>
                
                <div className="flex flex-col md:flex-row gap-4 items-stretch">
                    {/* New Date Picker Input */}
                    <div className="flex-1">
                        <DatePickerInput 
                            value={meetingDate} 
                            onChange={setMeetingDate} 
                            placeholder="DD/MM/YYYY"
                        />
                    </div>

                    {/* Save Button */}
                    <button 
                        onClick={handleSaveSettings}
                        disabled={isSavingSettings}
                        className="h-14 px-8 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-lg transition-all font-bold shadow-lg shadow-orange-500/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0 md:w-auto w-full text-base"
                    >
                        {isSavingSettings ? 'Menyimpan...' : 'Simpan Tetapan'}
                    </button>
                </div>

                <p className="text-[11px] text-slate-400 mt-3 pl-1 italic flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    Tarikh ini akan dipaparkan dalam dokumen "Ulasan Pengarah".
                </p>
            </div>
        </div>

        {/* Companies Manager */}
        <div className="glass-effect rounded-3xl p-8 border border-white/20 dark:border-white/5 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Senarai Syarikat ({selectedYear})</h3>
          </div>

          <div className="flex gap-2 mb-6">
             <input 
               type="text" 
               value={newCompany} 
               onChange={(e) => setNewCompany(e.target.value)}
               className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
               placeholder="Tambah Syarikat Baru..."
             />
             <button 
               onClick={handleAddCompany}
               className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
             >
               <Plus className="w-5 h-5" />
             </button>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {companies.map((company, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group">
                <span className="font-medium text-slate-700 dark:text-slate-300 truncate pr-2">{company}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => openCompanyModal(company)}
                      className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Edit Maklumat"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => initiateDelete('COMPANY', company)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Padam"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                </div>
              </div>
            ))}
            {companies.length === 0 && <p className="text-center text-slate-400 italic py-4">Tiada syarikat didaftarkan untuk tahun {selectedYear}.</p>}
          </div>
        </div>

        {/* Vote Numbers Manager */}
        <div className="glass-effect rounded-3xl p-8 border border-white/20 dark:border-white/5 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
              <FileDigit className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Senarai No. Vot ({selectedYear})</h3>
          </div>

          <div className="flex gap-2 mb-6">
             <input 
               type="text" 
               value={newVote} 
               onChange={(e) => setNewVote(e.target.value)}
               className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
               placeholder="Tambah No. Vot..."
             />
             <button 
               onClick={handleAddVote}
               className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
             >
               <Plus className="w-5 h-5" />
             </button>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {voteNumbers.map((vote, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group">
                <span className="font-medium text-slate-700 dark:text-slate-300 font-mono">{vote}</span>
                <button 
                  onClick={() => initiateDelete('VOTE', vote)}
                  className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {voteNumbers.length === 0 && <p className="text-center text-slate-400 italic py-4">Tiada No. Vot didaftarkan untuk tahun {selectedYear}.</p>}
          </div>
        </div>

        {/* Sebutharga Numbers Manager (New) */}
        <div className="glass-effect rounded-3xl p-8 border border-white/20 dark:border-white/5 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Senarai No. Sebutharga ({selectedYear})</h3>
          </div>

          <div className="flex gap-2 mb-6">
             <input 
               type="text" 
               value={newSebutharga} 
               onChange={(e) => setNewSebutharga(e.target.value)}
               className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
               placeholder="cth: MPS/SH/..."
             />
             <button 
               onClick={handleAddSebutharga}
               className="px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
             >
               <Plus className="w-5 h-5" />
             </button>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {sebuthargaNumbers.map((sh, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group">
                <span className="font-medium text-slate-700 dark:text-slate-300 font-mono">{sh}</span>
                <button 
                  onClick={() => initiateDelete('SEBUTHARGA', sh)}
                  className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {sebuthargaNumbers.length === 0 && <p className="text-center text-slate-400 italic py-4">Tiada No. Sebutharga didaftarkan untuk tahun {selectedYear}.</p>}
          </div>
        </div>

      </div>

      {/* Edit Company Details Modal */}
      {isCompanyModalOpen && companyToEdit && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsCompanyModalOpen(false)}>
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700 transform scale-100 transition-all animate-slide-up relative" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Building2 className="w-6 h-6 text-blue-600" />
                          Maklumat Syarikat
                      </h3>
                      <button onClick={() => setIsCompanyModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                          <X className="w-6 h-6" />
                      </button>
                  </div>
                  
                  <form onSubmit={handleSaveCompanyDetails} className="space-y-4">
                      <div>
                          <label className={labelClass}>Nama Syarikat</label>
                          <input 
                              type="text" 
                              value={companyToEdit.name}
                              onChange={e => setCompanyToEdit({...companyToEdit, name: e.target.value})}
                              className={inputClass}
                              required
                          />
                      </div>
                      <div>
                          <label className={labelClass}>Nombor Pendaftaran (MOF/CIDB)</label>
                          <input 
                              type="text" 
                              value={companyToEdit.registrationNumber || ''}
                              onChange={e => setCompanyToEdit({...companyToEdit, registrationNumber: e.target.value})}
                              className={inputClass}
                              placeholder="cth: 1961008-SL008245"
                          />
                      </div>
                      <div>
                          <label className={labelClass}>Alamat Lengkap</label>
                          <textarea 
                              value={companyToEdit.address}
                              onChange={e => setCompanyToEdit({...companyToEdit, address: e.target.value})}
                              className={`${inputClass} min-h-[80px] resize-none`}
                              placeholder="No. Jalan, Taman, Poskod..."
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className={labelClass}>Nama Pemilik</label>
                              <input 
                                  type="text" 
                                  value={companyToEdit.ownerName}
                                  onChange={e => setCompanyToEdit({...companyToEdit, ownerName: e.target.value})}
                                  className={inputClass}
                              />
                          </div>
                          <div>
                              <label className={labelClass}>Gred CIDB</label>
                              <input 
                                  type="text" 
                                  value={companyToEdit.gred}
                                  onChange={e => setCompanyToEdit({...companyToEdit, gred: e.target.value})}
                                  className={inputClass}
                                  placeholder="cth: G1"
                              />
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className={labelClass}>No. Telefon</label>
                              <input 
                                  type="text" 
                                  value={companyToEdit.phone}
                                  onChange={e => setCompanyToEdit({...companyToEdit, phone: e.target.value})}
                                  className={inputClass}
                              />
                          </div>
                          <div>
                              <label className={labelClass}>No. Tel Alternatif</label>
                              <input 
                                  type="text" 
                                  value={companyToEdit.phoneAlt || ''}
                                  onChange={e => setCompanyToEdit({...companyToEdit, phoneAlt: e.target.value})}
                                  className={inputClass}
                              />
                          </div>
                      </div>
                      <div>
                          <label className={labelClass}>Emel</label>
                          <input 
                              type="email" 
                              value={companyToEdit.email}
                              onChange={e => setCompanyToEdit({...companyToEdit, email: e.target.value})}
                              className={inputClass}
                          />
                      </div>

                      <div className="pt-4 flex gap-3">
                          <button 
                              type="button" 
                              onClick={() => setIsCompanyModalOpen(false)}
                              className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                          >
                              Batal
                          </button>
                          <button 
                              type="submit" 
                              className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                          >
                              <Save className="w-4 h-4" /> Simpan
                          </button>
                      </div>
                  </form>
              </div>
          </div>,
          document.body
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfig.isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setDeleteConfig({ ...deleteConfig, isOpen: false })}>
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 transform scale-100 transition-all animate-slide-up relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => setDeleteConfig({ ...deleteConfig, isOpen: false })} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                   <X className="w-5 h-5" />
                </button>
                <div className="flex flex-col items-center text-center pt-2">
                   <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6 text-red-500 animate-pulse-slow">
                      <div className="w-14 h-14 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 stroke-[1.5]" />
                      </div>
                   </div>
                   <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 font-jakarta">Padam Item?</h3>
                   <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm leading-relaxed px-4">
                     Adakah anda pasti mahu memadam <br/>
                     <span className="font-bold text-slate-900 dark:text-white block mt-1 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 break-all">
                       {deleteConfig.value}
                     </span>
                     <span className="mt-2 block text-xs text-red-500 font-medium">Tindakan ini tidak boleh dikembalikan.</span>
                   </p>
                   
                   <div className="flex gap-3 w-full">
                      <button 
                        onClick={() => setDeleteConfig({ ...deleteConfig, isOpen: false })}
                        className="flex-1 py-3.5 px-4 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-600 transition-all border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md"
                      >
                        Batal
                      </button>
                      <button 
                        onClick={confirmDelete}
                        className="flex-1 py-3.5 px-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg bg-red-600 hover:bg-red-700 shadow-red-600/30 hover:-translate-y-0.5"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Pasti</span>
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

export default AdminSettings;