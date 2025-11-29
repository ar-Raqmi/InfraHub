
import React, { useState, useEffect } from 'react';
import { mockService } from '../services/mockService';
import { Trash2, Plus, Settings as SettingsIcon, Building2, FileDigit, ShieldAlert } from 'lucide-react';
import { User, Role } from '../types';

interface AdminSettingsProps {
  user: User;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ user }) => {
  const [companies, setCompanies] = useState<string[]>([]);
  const [voteNumbers, setVoteNumbers] = useState<string[]>([]);
  
  const [newCompany, setNewCompany] = useState('');
  const [newVote, setNewVote] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setCompanies(mockService.getCompanies());
    setVoteNumbers(mockService.getVoteNumbers());
  };

  const handleAddCompany = () => {
    if (newCompany.trim()) {
      mockService.addCompany(newCompany.trim());
      setNewCompany('');
      loadData();
    }
  };

  const handleDeleteCompany = (name: string) => {
    if (confirm(`Padam syarikat "${name}"?`)) {
      mockService.deleteCompany(name);
      loadData();
    }
  };

  const handleAddVote = () => {
    if (newVote.trim()) {
      mockService.addVoteNumber(newVote.trim());
      setNewVote('');
      loadData();
    }
  };

  const handleDeleteVote = (vote: string) => {
    if (confirm(`Padam No. Vot "${vote}"?`)) {
      mockService.deleteVoteNumber(vote);
      loadData();
    }
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

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Tetapan Sistem</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Uruskan senarai data dropdown untuk borang projek.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Companies Manager */}
        <div className="glass-effect rounded-3xl p-8 border border-white/20 dark:border-white/5 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Senarai Syarikat</h3>
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
                <span className="font-medium text-slate-700 dark:text-slate-300">{company}</span>
                <button 
                  onClick={() => handleDeleteCompany(company)}
                  className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {companies.length === 0 && <p className="text-center text-slate-400 italic py-4">Tiada syarikat didaftarkan.</p>}
          </div>
        </div>

        {/* Vote Numbers Manager */}
        <div className="glass-effect rounded-3xl p-8 border border-white/20 dark:border-white/5 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
              <FileDigit className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Senarai No. Vot</h3>
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
                  onClick={() => handleDeleteVote(vote)}
                  className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {voteNumbers.length === 0 && <p className="text-center text-slate-400 italic py-4">Tiada No. Vot didaftarkan.</p>}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminSettings;
