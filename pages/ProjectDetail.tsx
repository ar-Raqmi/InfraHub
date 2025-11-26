
import React, { useState, useEffect } from 'react';
import { Project, ProjectStatus, BQGroup, User, formatCurrency } from '../types';
import { ArrowLeft, Save, Printer, FileText, AlertCircle, CheckCircle, Download, Zap, Calculator, Calendar, FileDown } from 'lucide-react';
import BQEditor from './BQEditor';
import BQPelarasanEditor from './BQPelarasanEditor';
import { mockService } from '../services/mockService';
import { generateBQPDF, generateCoverPagePDF, generateAkuJanjiPDF, generateBQPelarasanPDF } from '../services/pdfExport';

interface ProjectDetailProps {
  project?: Project;
  onClose: () => void;
  onSave: () => void;
  currentUserRole: string;
  currentUser?: User;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onClose, onSave, currentUserRole, currentUser }) => {
  
  // Organized Tabs based on Workflow
  const TABS = [
    { id: 'fasa1', label: '1. Asas & BQ' },
    { id: 'fasa2', label: '2. Lantikan & Kontrak' },
    { id: 'fasa3', label: '3. Pelaksanaan & Pelarasan' },
    { id: 'fasa4', label: '4. Tuntutan & Penutup' }
  ];

  const [activeTab, setActiveTab] = useState('fasa1');
  const [isSaving, setIsSaving] = useState(false);
  const [autoStatus, setAutoStatus] = useState(true); // Default to auto status
  
  const [formData, setFormData] = useState<Partial<Project>>(project || {
    // Phase 1 Defaults
    namaProjek: '', noFail: '', noAduan: '', tarikhBuka: new Date().toISOString().split('T')[0], 
    pjaId: 0, aduan: '', bp: '', zon: '', lokasi: '', 
    status: ProjectStatus.MENUNGGU_LANTIKAN, bqData: [], bqPelarasanData: [], peratusSiap: 0
  });

  // Auto-Status Logic
  useEffect(() => {
    if (!autoStatus) return;

    let newStatus = ProjectStatus.MENUNGGU_LANTIKAN;

    // If Contractor is appointed and Vote No exists -> Phase 2
    if (formData.namaSyarikat && formData.noVote) {
      newStatus = ProjectStatus.DALAM_PROSES;
    }

    // If Progress is 100% or CPC is issued -> Phase 3 (Ready for claims)
    if (Number(formData.peratusSiap) === 100 || formData.cpcDate) {
      newStatus = ProjectStatus.TUNTUTAN_BAYARAN;
    }

    // If Final Claim submitted to Finance -> Phase 4 (Siap)
    if (formData.tarikhHantarKewangan) {
      newStatus = ProjectStatus.SIAP;
    }

    if (newStatus !== formData.status) {
      setFormData(prev => ({ ...prev, status: newStatus }));
    }
  }, [
    formData.namaSyarikat, 
    formData.noVote, 
    formData.peratusSiap, 
    formData.cpcDate, 
    formData.tarikhHantarKewangan, 
    autoStatus
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Allow digits only
    if (value === '' || /^\d+$/.test(value)) {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Allow digits and one dot
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePrestasiScoreChange = (question: string, score: number) => {
    setFormData(prev => ({
      ...prev,
      prestasiScores: { ...prev.prestasiScores, [question]: score }
    }));
  };

  const handleBQSave = async (bqData: BQGroup[]) => {
    const totalCost = bqData.reduce((acc, group) => {
      return acc + group.items.reduce((gTotal, item) => gTotal + (item.amount || 0), 0);
    }, 0);

    const updatedData = { ...formData, bqData, kosProjek: totalCost };
    setFormData(updatedData);

    try {
        if (project) await mockService.updateProject(project.id, updatedData);
    } catch (e) {}
  };

  const handleBQPelarasanSave = async (bqPelarasanData: BQGroup[]) => {
      const totalCost = bqPelarasanData.reduce((acc, group) => {
        return acc + group.items.reduce((gTotal, item) => gTotal + (item.amount || 0), 0);
      }, 0);
      
      // Update the Final Account cost based on Pelarasan
      const updatedData = { ...formData, bqPelarasanData, kosProjekSebenar: totalCost };
      setFormData(updatedData);
      
      try {
        if (project) await mockService.updateProject(project.id, updatedData);
      } catch (e) {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Convert string numbers
      const safeData = {
        ...formData,
        kosProjekSebenar: Number(formData.kosProjekSebenar) || 0,
        ladAmount: Number(formData.ladAmount) || 0,
        ladDays: Number(formData.ladDays) || 0,
        peratusSiap: Number(formData.peratusSiap) || 0
      };

      if (project) await mockService.updateProject(project.id, safeData);
      else await mockService.createProject(safeData as Project);
      setIsSaving(false);
      onSave();
    } catch (err) { setIsSaving(false); alert('Error saving project'); }
  };

  // PDF Export Handlers
  const handleExportCoverPage = () => {
    if (!formData.namaProjek) {
      alert('Sila isi Nama Projek terlebih dahulu');
      return;
    }
    generateCoverPagePDF(formData as Project, currentUser);
  };

  const handleExportBQ = () => {
    if (!formData.bqData || formData.bqData.length === 0) {
      alert('Tiada data BQ untuk dieksport');
      return;
    }
    generateBQPDF(formData as Project);
  };

  const handleExportAkuJanji = () => {
    if (!formData.namaSyarikat) {
      alert('Sila isi Nama Syarikat terlebih dahulu');
      return;
    }
    generateAkuJanjiPDF(formData as Project);
  };

  const handleExportBQPelarasan = () => {
    if (!formData.bqPelarasanData || formData.bqPelarasanData.length === 0) {
      alert('Tiada data BQ Pelarasan untuk dieksport');
      return;
    }
    generateBQPelarasanPDF(formData as Project);
  };

  const inputClass = "w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400 shadow-inner text-sm dark:[color-scheme:dark]";
  const labelClass = "block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 font-manrope";
  const sectionTitleClass = "text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-3 border-b border-slate-100 dark:border-white/10 pb-2";

  return (
    <div className="pb-10 relative min-h-screen">
      
      {/* Sticky Header: Status & Progress */}
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl py-4 -mx-4 sm:-mx-6 px-4 sm:px-6 border-b border-slate-200 dark:border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center mb-6 shadow-sm gap-4">
         <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full md:w-auto">
            <div className="w-full sm:w-auto">
               <div className="flex items-center gap-2 mb-1">
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Semasa</span>
                 <label className="flex items-center gap-1 cursor-pointer">
                   <input type="checkbox" checked={autoStatus} onChange={(e) => setAutoStatus(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 w-3 h-3" />
                   <span className="text-[10px] text-slate-400">Auto</span>
                 </label>
               </div>
               <select 
                  name="status" 
                  value={formData.status} 
                  onChange={(e) => { setAutoStatus(false); handleInputChange(e); }}
                  className="block w-full sm:w-auto bg-transparent font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none cursor-pointer text-sm"
               >
                  <option value={ProjectStatus.MENUNGGU_LANTIKAN}>1. Menunggu Lantikan</option>
                  <option value={ProjectStatus.DALAM_PROSES}>2. Dalam Proses</option>
                  <option value={ProjectStatus.TUNTUTAN_BAYARAN}>3. Tuntutan Bayaran</option>
                  <option value={ProjectStatus.SIAP}>4. Siap</option>
               </select>
            </div>
            
            <div className="hidden sm:block h-10 w-px bg-slate-300 dark:bg-slate-700"></div>
            
            <div className="flex items-center gap-4 w-full sm:w-auto">
               <div className="w-full sm:w-auto">
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">% Siap Di Tapak</span>
                 <div className="flex items-center gap-3 w-full">
                    <input 
                        type="text"
                        inputMode="numeric"
                        name="peratusSiap" 
                        value={formData.peratusSiap || ''} 
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          if (val === '' || (Number(val) >= 0 && Number(val) <= 100)) {
                             // @ts-ignore
                             handleInputChange({ target: { name: 'peratusSiap', value: val } });
                          }
                        }}
                        className="w-16 bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1 font-bold text-slate-900 dark:text-white focus:outline-none text-center border border-transparent focus:border-indigo-500"
                        placeholder="0"
                    />
                    {/* Determinate Progress Bar */}
                    <div className="flex-1 sm:w-32 h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                       <div 
                         className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out" 
                         style={{ width: `${Math.min(100, Math.max(0, Number(formData.peratusSiap) || 0))}%` }}
                       ></div>
                    </div>
                 </div>
               </div>
            </div>
         </div>
         
         <div className="flex gap-3 w-full md:w-auto">
            <button onClick={handleSubmit} disabled={isSaving} className="w-full md:w-auto justify-center px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-70 shadow-lg shadow-indigo-500/30">
              <Save className="h-4 w-4" /> {isSaving ? 'Menyimpan...' : 'Simpan Projek'}
            </button>
         </div>
      </div>

      {/* Header Info */}
      <div className="flex items-center justify-between mb-8 px-2 no-print">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors">
            <ArrowLeft className="h-6 w-6 text-slate-900 dark:text-slate-200" />
          </button>
          <div>
            <h1 className="text-2xl font-bold gradient-text">{project ? 'Kemaskini Projek' : 'Daftar Projek Baru'}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-mono font-medium">{formData.noFail || 'No. Fail Belum Ditetapkan'}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl mb-8 no-print overflow-x-auto mx-2 scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Form Content */}
      <form className="animate-fade-in-up px-2">
        
        {/* --- FASA 1: ASAS & BQ --- */}
        {activeTab === 'fasa1' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                 <h3 className={sectionTitleClass}><Zap className="h-5 w-5 text-blue-500"/> Maklumat Asas Projek</h3>
              </div>

              <div className="group md:col-span-2">
                <label className={labelClass}>Nama Projek <span className="text-red-500">*</span></label>
                <textarea name="namaProjek" value={formData.namaProjek} onChange={handleInputChange} className={inputClass} rows={2} required placeholder="Tajuk Projek Lengkap..." />
              </div>

              <div className="group">
                <label className={labelClass}>No. Fail</label>
                <input type="text" name="noFail" value={formData.noFail} onChange={handleInputChange} className={inputClass} placeholder="MPS..." />
              </div>

              <div className="group">
                <label className={labelClass}>No. Aduan (Jika ada)</label>
                <input type="text" name="noAduan" value={formData.noAduan} onChange={handleInputChange} className={inputClass} />
              </div>

              <div className="group">
                <label className={labelClass}>Tarikh Buka Fail</label>
                <input type="date" name="tarikhBuka" value={formData.tarikhBuka} onChange={handleInputChange} className={inputClass} />
              </div>

              <div className="group">
                <label className={labelClass}>Lokasi Tapak</label>
                <input type="text" name="lokasi" value={formData.lokasi} onChange={handleInputChange} className={inputClass} />
              </div>

              <div className="group">
                <label className={labelClass}>BP (Blok Perancangan)</label>
                <select name="bp" value={formData.bp} onChange={handleInputChange} className={inputClass}>
                  <option value="">Pilih...</option>
                  <option value="Zon 1">Zon 1</option>
                  <option value="Zon 2">Zon 2</option>
                  <option value="Zon 3">Zon 3</option>
                </select>
              </div>

              <div className="group">
                <label className={labelClass}>Zon / Kawasan</label>
                <input type="text" name="zon" value={formData.zon} onChange={handleInputChange} className={inputClass} placeholder="cth: Gombak Setia" />
              </div>

              <div className="group md:col-span-2">
                <label className={labelClass}>Aduan / Catatan</label>
                <textarea name="aduan" value={formData.aduan} onChange={handleInputChange} rows={3} className={inputClass} />
              </div>
            </div>

            {/* PDF Export Buttons for Phase 1 */}
            <div className="flex flex-wrap gap-3 border-t border-slate-200 dark:border-white/5 pt-6">
              <button
                type="button"
                onClick={handleExportCoverPage}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30"
              >
                <FileDown className="w-4 h-4" /> Export Cover Page (PDF)
              </button>
              <button
                type="button"
                onClick={handleExportBQ}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-bold hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-lg shadow-indigo-500/30"
              >
                <FileDown className="w-4 h-4" /> Export BQ (PDF)
              </button>
            </div>

            <div className="border-t border-slate-200 dark:border-white/5 pt-8">
               <h3 className={sectionTitleClass}><Calculator className="h-5 w-5 text-indigo-500"/> Bill of Quantities (BQ)</h3>
               <BQEditor 
                  initialData={formData.bqData} 
                  onSave={handleBQSave} 
                  projectName={formData.namaProjek || ''}
                  noFail={formData.noFail || ''}
                  projectLocation={formData.lokasi || ''}
               />
            </div>
          </div>
        )}

        {/* --- FASA 2: LANTIKAN & KONTRAK --- */}
        {activeTab === 'fasa2' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="md:col-span-2 flex justify-between items-center mb-4">
                <h3 className={sectionTitleClass}><FileText className="h-5 w-5 text-indigo-500"/> Maklumat Lantikan</h3>
                <button
                  type="button"
                  onClick={handleExportAkuJanji}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/30"
                >
                  <FileDown className="w-4 h-4" /> Export Aku Janji (PDF)
                </button>
             </div>

             <div className="group md:col-span-2">
                <label className={labelClass}>Nama Syarikat Kontraktor</label>
                <input type="text" name="namaSyarikat" value={formData.namaSyarikat} onChange={handleInputChange} className={inputClass} placeholder="Nama Syarikat..." />
             </div>

             <div className="group">
                <label className={labelClass}>No. Vote</label>
                <input type="text" name="noVote" value={formData.noVote} onChange={handleInputChange} className={inputClass} />
             </div>

             <div className="group">
                <label className={labelClass}>Bulan (Peruntukan)</label>
                <select name="bulan" value={formData.bulan} onChange={handleInputChange} className={inputClass}>
                   <option value="">Pilih...</option>
                   {['Januari','Februari','Mac','April','Mei','Jun','Julai','Ogos','September','Oktober','November','Disember'].map(m => (
                     <option key={m} value={m}>{m}</option>
                   ))}
                </select>
             </div>

             <div className="group">
                <label className={labelClass}>Kos Projek (RM)</label>
                <input type="text" value={formData.kosProjek ? formatCurrency(formData.kosProjek) : 'RM 0.00'} readOnly className={`${inputClass} bg-slate-100 dark:bg-slate-900 text-slate-500`} />
                <p className="text-[10px] text-slate-400 mt-1">Auto-kira dari BQ</p>
             </div>

             <div className="group">
                <label className={labelClass}>Tarikh Lantikan (SST)</label>
                <input type="date" name="tarikhLantikan" value={formData.tarikhLantikan} onChange={handleInputChange} className={inputClass} />
             </div>

             <div className="group">
                <label className={labelClass}>Tarikh Cetakan BPP</label>
                <input type="date" name="tarikhCetakanBpp" value={formData.tarikhCetakanBpp} onChange={handleInputChange} className={inputClass} />
             </div>
             
             <div className="group">
                <label className={labelClass}>Kod ISO</label>
                <input type="text" name="iso" value={formData.iso} onChange={handleInputChange} className={inputClass} placeholder="ISO..." />
             </div>

             <div className="md:col-span-2 pt-6">
                <h3 className={sectionTitleClass}><Calendar className="h-5 w-5 text-orange-500"/> Tempoh Kontrak</h3>
             </div>

             <div className="group">
                <label className={labelClass}>Tarikh Mula Kontrak</label>
                <input type="date" name="tarikhMulaKontrak" value={formData.tarikhMulaKontrak} onChange={handleInputChange} className={inputClass} />
             </div>

             <div className="group">
                <label className={labelClass}>Tarikh Tamat Kontrak</label>
                <input type="date" name="tarikhTamatKontrak" value={formData.tarikhTamatKontrak} onChange={handleInputChange} className={inputClass} />
             </div>

             <div className="group">
                <label className={labelClass}>Tempoh (Minggu/Bulan)</label>
                <input type="text" name="tempohKontrak" value={formData.tempohKontrak} onChange={handleInputChange} className={inputClass} placeholder="cth: 12 Minggu" />
             </div>

             <div className="group">
                <label className={labelClass}>Tarikh Serah Tapak</label>
                <input type="date" name="tarikhSerahTapak" value={formData.tarikhSerahTapak} onChange={handleInputChange} className={inputClass} />
             </div>

             <div className="group">
                <label className={labelClass}>Tarikh Mula Kerja (Sebenar)</label>
                <input type="date" name="tarikhMulaKerja" value={formData.tarikhMulaKerja} onChange={handleInputChange} className={inputClass} />
             </div>
          </div>
        )}

        {/* --- FASA 3: PELAKSANAAN, CPC & PRESTASI --- */}
        {activeTab === 'fasa3' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="md:col-span-2">
                <h3 className={sectionTitleClass}><Zap className="h-5 w-5 text-yellow-500"/> Kemajuan & Penyiapan</h3>
             </div>

             <div className="group">
                <label className={labelClass}>Tarikh Permohonan Lawatan Tapak</label>
                <input type="date" name="tarikhPermohonanLawatanTapak" value={formData.tarikhPermohonanLawatanTapak} onChange={handleInputChange} className={inputClass} />
             </div>

             <div className="group">
                <label className={labelClass}>Tarikh Siap Sebenar (Tapak)</label>
                <input type="date" name="tarikhSiapSebenar" value={formData.tarikhSiapSebenar} onChange={handleInputChange} className={inputClass} />
             </div>

             {/* LAD */}
             <div className="md:col-span-2 glass-effect p-6 rounded-2xl border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 mt-2">
                <h4 className="font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2"><AlertCircle className="h-4 w-4"/> Denda Lewat (LAD)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="group">
                     <label className={labelClass}>Jumlah Hari Lewat</label>
                     <input 
                       type="text" 
                       inputMode="numeric"
                       name="ladDays" 
                       value={formData.ladDays || ''} 
                       onChange={handleNumericChange} 
                       className={inputClass} 
                       placeholder="0" 
                     />
                   </div>
                   <div className="group">
                     <label className={labelClass}>Jumlah Denda (RM)</label>
                     <input 
                       type="text" 
                       inputMode="decimal"
                       name="ladAmount" 
                       value={formData.ladAmount || ''} 
                       onChange={handleCurrencyChange} 
                       className={inputClass} 
                       placeholder="0.00" 
                     />
                   </div>
                </div>
             </div>

             {/* CPC */}
             <div className="md:col-span-2 glass-effect p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-900/10 mt-2">
                <h4 className="font-bold text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2"><CheckCircle className="h-4 w-4"/> Sijil Siap Kerja (CPC)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="group">
                     <label className={labelClass}>Tarikh CPC</label>
                     <input type="date" name="cpcDate" value={formData.cpcDate} onChange={handleInputChange} className={inputClass} />
                   </div>
                   <div className="group">
                     <label className={labelClass}>Rujukan Surat CPC</label>
                     <input type="text" name="cpcRef" value={formData.cpcRef} onChange={handleInputChange} className={inputClass} placeholder="Ruj. Surat..." />
                   </div>
                </div>
             </div>

             {/* Prestasi - Moved Here from Phase 4 */}
             <div className="md:col-span-2 glass-effect p-6 rounded-2xl border border-slate-200 dark:border-white/10 mt-4">
                <h4 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2"><FileText className="h-4 w-4"/> Penilaian Prestasi Kontraktor</h4>
                
                <div className="space-y-6">
                   {[
                     { id: 'q1', text: 'Kualiti Kerja' },
                     { id: 'q2', text: 'Jadual Pelaksanaan' },
                     { id: 'q3', text: 'Pengurusan Tapak' },
                     { id: 'q4', text: 'Pematuhan Arahan' },
                     { id: 'q5', text: 'Kebersihan & Keselamatan' },
                     { id: 'q6', text: 'Kerjasama' }
                   ].map((q) => (
                     <div key={q.id} className="border-b border-slate-100 dark:border-white/5 pb-4">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">{q.text}</p>
                        <div className="flex justify-between gap-1 overflow-x-auto">
                           {[1,2,3,4,5,6,7,8,9,10].map(num => (
                             <label key={num} className="flex flex-col items-center cursor-pointer min-w-[30px]">
                                <input 
                                   type="radio" 
                                   name={`prestasi_${q.id}`} 
                                   checked={formData.prestasiScores?.[q.id as keyof typeof formData.prestasiScores] === num}
                                   onChange={() => handlePrestasiScoreChange(q.id, num)}
                                   className="mb-1 accent-indigo-600"
                                />
                                <span className="text-[10px] text-slate-400">{num}</span>
                             </label>
                           ))}
                        </div>
                     </div>
                   ))}
                </div>

                <div className="mt-6 group">
                   <label className={labelClass}>Rumusan Prestasi</label>
                   <select name="prestasi" value={formData.prestasi} onChange={handleInputChange} className={inputClass}>
                     <option value="">Pilih...</option>
                     <option value="Cemerlang">Cemerlang (9-10)</option>
                     <option value="Baik">Baik (7-8)</option>
                     <option value="Memuaskan">Memuaskan (5-6)</option>
                     <option value="Tidak Memuaskan">Tidak Memuaskan (&lt;5)</option>
                   </select>
                </div>
             </div>
            </div>

            {/* BQ Pelarasan Section */}
            <div className="border-t border-slate-200 dark:border-white/5 pt-8">
               <div className="flex justify-between items-center mb-6">
                 <h3 className={sectionTitleClass}><Calculator className="h-5 w-5 text-purple-500"/> BQ Pelarasan (Variation Order)</h3>
                 <button
                   type="button"
                   onClick={handleExportBQPelarasan}
                   className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-bold hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg shadow-purple-500/30"
                 >
                   <FileDown className="w-4 h-4" /> Export BQ Pelarasan (PDF)
                 </button>
               </div>
               <BQPelarasanEditor 
                 originalData={formData.bqData || []}
                 initialPelarasanData={formData.bqPelarasanData}
                 onSave={handleBQPelarasanSave}
                 projectName={formData.namaProjek || ''}
               />
            </div>
          </div>
        )}

        {/* --- FASA 4: TUNTUTAN & PENUTUP --- */}
        {activeTab === 'fasa4' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="md:col-span-2">
                <h3 className={sectionTitleClass}><Calculator className="h-5 w-5 text-emerald-500"/> Tuntutan Bayaran</h3>
             </div>

             <div className="group">
                <label className={labelClass}>Tarikh Syarikat Kemukakan Tuntutan</label>
                <input type="date" name="tarikhSyarikatKemukakanTuntutan" value={formData.tarikhSyarikatKemukakanTuntutan} onChange={handleInputChange} className={inputClass} />
             </div>

             <div className="group">
                <label className={labelClass}>Tarikh Hantar Ke Kewangan</label>
                <input type="date" name="tarikhHantarKewangan" value={formData.tarikhHantarKewangan} onChange={handleInputChange} className={inputClass} />
             </div>

             <div className="group">
                <label className={labelClass}>Tarikh Padanan Kali 2</label>
                <input type="date" name="tarikhPadanan" value={formData.tarikhPadanan} onChange={handleInputChange} className={inputClass} />
             </div>

             <div className="group">
                <label className={labelClass}>Kos Projek Sebenar / Final Account (RM)</label>
                <input 
                  type="text"
                  inputMode="decimal"
                  name="kosProjekSebenar" 
                  value={formData.kosProjekSebenar || ''} 
                  onChange={handleCurrencyChange} 
                  className={inputClass} 
                  placeholder="0.00"
                />
                <p className="text-[10px] text-slate-400 mt-1">Dikira dari BQ Pelarasan</p>
             </div>
          </div>
        )}

      </form>
    </div>
  );
};

export default ProjectDetail;
