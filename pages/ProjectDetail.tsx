
import React, { useState, useEffect } from 'react';
import { Project, ProjectStatus, BQGroup, formatCurrency, BP_OPTIONS, ZON_OPTIONS, GlobalDimensions } from '../types';
import { ArrowLeft, Save, Zap, FileText, Calendar, Info, Folder, CheckCircle } from 'lucide-react';
import BQEditor from './BQEditor';
import { mockService } from '../services/mockService';

interface ProjectDetailProps {
  project?: Project;
  onClose: () => void;
  onSave: () => void;
  currentUserRole: string;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onClose, onSave, currentUserRole }) => {
  
  // WORKFLOW PHASES Based on Image
  const TABS = [
    { id: 'phase1', label: '1. BQ Building (PJA)', color: 'bg-yellow-400 text-yellow-900', ringColor: 'ring-yellow-400' },
    { id: 'phase2', label: '2. File Creation (PT)', color: 'bg-blue-500 text-white', ringColor: 'ring-blue-500' },
    { id: 'phase3', label: '3. Pelarasan (PJA)', color: 'bg-yellow-400 text-yellow-900', ringColor: 'ring-yellow-400' },
    { id: 'phase4', label: '4. Penutup (PT)', color: 'bg-orange-500 text-white', ringColor: 'ring-orange-500' },
  ];

  const [activeTab, setActiveTab] = useState('phase1');
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Project>>(project || {
    // Defaults
    namaProjek: '', noFail: '', noAduan: '', tarikhBuka: new Date().toISOString().split('T')[0], 
    pjaId: 0, bp: '', zon: '', lokasi: '', 
    status: ProjectStatus.MENUNGGU_LANTIKAN, 
    bqData: [], 
    globalDimensions: { length: 0, width: 0, depth: 0 }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBQSave = async (bqData: BQGroup[], globalDims: GlobalDimensions) => {
    const totalCost = bqData.reduce((acc, group) => {
      return acc + group.items.reduce((gTotal, item) => gTotal + (item.amount || 0), 0);
    }, 0);

    // Auto update status if needed logic here
    const updatedData = { ...formData, bqData, globalDimensions: globalDims, kosProjek: totalCost };
    setFormData(updatedData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const safeData = { ...formData };
      if (project) await mockService.updateProject(project.id, safeData);
      else await mockService.createProject(safeData as Project);
      setIsSaving(false);
      onSave();
    } catch (err) { setIsSaving(false); alert('Error saving project'); }
  };

  // Styles
  const inputClass = "w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm shadow-sm";
  const labelClass = "block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 font-manrope";
  
  // Phase Containers
  const yellowPhaseClass = "bg-yellow-50/80 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700 p-6 rounded-3xl animate-fade-in-up";
  const bluePhaseClass = "bg-blue-50/80 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-700 p-6 rounded-3xl animate-fade-in-up";
  const orangePhaseClass = "bg-orange-50/80 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-700 p-6 rounded-3xl animate-fade-in-up";

  return (
    <div className="pb-20 relative min-h-screen">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-8 px-2 no-print">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors">
            <ArrowLeft className="h-6 w-6 text-slate-900 dark:text-slate-200" />
          </button>
          <div>
            <h1 className="text-2xl font-bold gradient-text">{project ? 'Kemaskini Projek' : 'Daftar Projek Baru'}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{formData.noFail || 'No. Fail Belum Ditetapkan'}</p>
          </div>
        </div>
        <button onClick={handleSubmit} disabled={isSaving} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/30">
           <Save className="h-4 w-4" /> {isSaving ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>

      {/* Workflow Tabs */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl mb-8 no-print overflow-x-auto mx-2 gap-2 scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
              activeTab === tab.id 
                ? `${tab.color} shadow-md transform scale-105` 
                : 'text-slate-500 hover:bg-white/50 dark:hover:bg-white/5'
            }`}
          >
            {activeTab === tab.id && <CheckCircle className="w-4 h-4" />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- PHASE 1: BQ BUILDING (YELLOW) --- */}
      {activeTab === 'phase1' && (
        <div className="space-y-6">
           <div className={yellowPhaseClass}>
              <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-400 mb-6 flex items-center gap-2">
                <Zap className="h-5 w-5"/> Maklumat Asas (PJA)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="group lg:col-span-2">
                   <label className={labelClass}>Cadangan Kerja (Nama Projek)</label>
                   <textarea name="namaProjek" value={formData.namaProjek} onChange={handleInputChange} className={inputClass} rows={2} placeholder="CADANGAN KERJA-KERJA..." />
                </div>
                <div className="group">
                   <label className={labelClass}>No. Aduan</label>
                   <input type="text" name="noAduan" value={formData.noAduan} onChange={handleInputChange} className={inputClass} />
                </div>
                
                <div className="group">
                   <label className={labelClass}>Lokasi</label>
                   <input type="text" name="lokasi" value={formData.lokasi} onChange={handleInputChange} className={inputClass} />
                </div>

                <div className="group">
                   <label className={labelClass}>BP (Blok Perancangan)</label>
                   <select name="bp" value={formData.bp} onChange={handleInputChange} className={inputClass}>
                     <option value="">Pilih BP...</option>
                     {BP_OPTIONS.map(bp => <option key={bp} value={bp}>{bp}</option>)}
                   </select>
                </div>

                <div className="group">
                   <label className={labelClass}>Zon</label>
                   <select name="zon" value={formData.zon} onChange={handleInputChange} className={inputClass}>
                     <option value="">Pilih Zon...</option>
                     {ZON_OPTIONS.map(z => <option key={z} value={z}>{z}</option>)}
                   </select>
                </div>

                <div className="group">
                   <label className={labelClass}>Tarikh Buka</label>
                   <input type="date" name="tarikhBuka" value={formData.tarikhBuka} onChange={handleInputChange} className={inputClass} />
                </div>
              </div>
           </div>

           {/* BQ WIZARD */}
           <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
               <div className="bg-slate-50 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-slate-700 dark:text-slate-300">Penyediaan BQ (Wizard)</h3>
               </div>
               <BQEditor 
                  initialData={formData.bqData} 
                  initialDims={formData.globalDimensions}
                  onSave={handleBQSave} 
                  projectData={formData as Project}
               />
           </div>
        </div>
      )}

      {/* --- PHASE 2: FILE CREATION (BLUE) --- */}
      {activeTab === 'phase2' && (
        <div className="space-y-6">
           <div className={bluePhaseClass}>
              <h3 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-6 flex items-center gap-2">
                <Folder className="h-5 w-5"/> Maklumat Fail & Kontrak (PT)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <div className="group">
                    <label className={labelClass}>No. Fail</label>
                    <input type="text" name="noFail" value={formData.noFail} onChange={handleInputChange} className={inputClass} />
                 </div>
                 <div className="group lg:col-span-2">
                    <label className={labelClass}>Nama Syarikat</label>
                    <input type="text" name="namaSyarikat" value={formData.namaSyarikat} onChange={handleInputChange} className={inputClass} />
                 </div>
                 <div className="group">
                    <label className={labelClass}>Bulan</label>
                    <select name="bulan" value={formData.bulan} onChange={handleInputChange} className={inputClass}>
                       <option value="">Pilih...</option>
                       {['Januari','Februari','Mac','April','Mei','Jun','Julai','Ogos','September','Oktober','November','Disember'].map(m => (
                         <option key={m} value={m}>{m}</option>
                       ))}
                    </select>
                 </div>
                 <div className="group">
                    <label className={labelClass}>No. Vot</label>
                    <input type="text" name="noVote" value={formData.noVote} onChange={handleInputChange} className={inputClass} />
                 </div>
                 <div className="group">
                    <label className={labelClass}>Tarikh Lantikan</label>
                    <input type="date" name="tarikhLantikan" value={formData.tarikhLantikan} onChange={handleInputChange} className={inputClass} />
                 </div>
                 <div className="group">
                    <label className={labelClass}>Tarikh BPP</label>
                    <input type="date" name="tarikhCetakanBpp" value={formData.tarikhCetakanBpp} onChange={handleInputChange} className={inputClass} />
                 </div>
                 <div className="group">
                    <label className={labelClass}>Tempoh Kontrak</label>
                    <input type="text" name="tempohKontrak" value={formData.tempohKontrak} onChange={handleInputChange} className={inputClass} placeholder="Minggu/Bulan" />
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
                    <label className={labelClass}>Tarikh Serah Tapak</label>
                    <input type="date" name="tarikhSerahTapak" value={formData.tarikhSerahTapak} onChange={handleInputChange} className={inputClass} />
                 </div>
                 <div className="group">
                    <label className={labelClass}>ISO</label>
                    <input type="text" name="iso" value={formData.iso} onChange={handleInputChange} className={inputClass} />
                 </div>
                 <div className="group">
                    <label className={labelClass}>Tarikh Mula Kerja</label>
                    <input type="date" name="tarikhMulaKerja" value={formData.tarikhMulaKerja} onChange={handleInputChange} className={inputClass} />
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* --- PHASE 3: PELARASAN BUILDING (YELLOW) --- */}
      {activeTab === 'phase3' && (
        <div className="space-y-6">
           <div className={yellowPhaseClass}>
              <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-400 mb-6 flex items-center gap-2">
                <Info className="h-5 w-5"/> BQ Pelarasan Building
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <div className="group">
                    <label className={labelClass}>Tarikh Pemeriksaan</label>
                    <input type="date" name="tarikhPemeriksaan" value={formData.tarikhPemeriksaan} onChange={handleInputChange} className={inputClass} />
                 </div>
                 <div className="group">
                    <label className={labelClass}>Tarikh Siap (Sebenar)</label>
                    <input type="date" name="tarikhSiapSebenar" value={formData.tarikhSiapSebenar} onChange={handleInputChange} className={inputClass} />
                 </div>
                 <div className="group">
                    <label className={labelClass}>Prestasi</label>
                    <select name="prestasi" value={formData.prestasi} onChange={handleInputChange} className={inputClass}>
                       <option value="">Pilih...</option>
                       <option value="Cemerlang">Cemerlang</option>
                       <option value="Baik">Baik</option>
                       <option value="Memuaskan">Memuaskan</option>
                       <option value="Tidak Memuaskan">Tidak Memuaskan</option>
                    </select>
                 </div>
                 
                 <div className="group">
                    <label className={labelClass}>Tuntutan Bayaran (RM)</label>
                    <input type="number" name="tuntutanBayaran" value={formData.tuntutanBayaran} onChange={handleInputChange} className={inputClass} />
                 </div>
                 <div className="group">
                    <label className={labelClass}>Kos Sebenar (RM)</label>
                    <input type="number" name="kosSebenar" value={formData.kosSebenar} onChange={handleInputChange} className={inputClass} />
                 </div>
                 <div className="group">
                    <label className={labelClass}>Tarikh Survey</label>
                    <input type="date" name="tarikhSurvey" value={formData.tarikhSurvey} onChange={handleInputChange} className={inputClass} />
                 </div>

                 <div className="group">
                    <label className={labelClass}>LAD (RM)</label>
                    <input type="number" name="ladAmount" value={formData.ladAmount} onChange={handleInputChange} className={inputClass} />
                 </div>
                 <div className="group">
                    <label className={labelClass}>Tarikh CPC</label>
                    <input type="date" name="cpcDate" value={formData.cpcDate} onChange={handleInputChange} className={inputClass} />
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* --- PHASE 4: CLOSING FILE (ORANGE) --- */}
      {activeTab === 'phase4' && (
        <div className="space-y-6">
           <div className={orangePhaseClass}>
              <h3 className="text-lg font-bold text-orange-800 dark:text-orange-300 mb-6 flex items-center gap-2">
                <CheckCircle className="h-5 w-5"/> Closing File / Project
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <div className="group">
                    <label className={labelClass}>Tarikh Hantar Kewangan</label>
                    <input type="date" name="tarikhHantarKewangan" value={formData.tarikhHantarKewangan} onChange={handleInputChange} className={inputClass} />
                 </div>
                 <div className="group">
                    <label className={labelClass}>Tarikh Pemadanan</label>
                    <input type="date" name="tarikhPadanan" value={formData.tarikhPadanan} onChange={handleInputChange} className={inputClass} />
                 </div>
                 <div className="group">
                    <label className={labelClass}>% Kerja Di Tapak</label>
                    <input type="number" name="peratusSiap" value={formData.peratusSiap} onChange={handleInputChange} className={inputClass} placeholder="100" />
                 </div>
                 <div className="group">
                    <label className={labelClass}>Status Projek</label>
                    <select name="status" value={formData.status} onChange={handleInputChange} className={inputClass}>
                       <option value={ProjectStatus.MENUNGGU_LANTIKAN}>Menunggu Lantikan</option>
                       <option value={ProjectStatus.DALAM_PROSES}>Dalam Proses</option>
                       <option value={ProjectStatus.TUNTUTAN_BAYARAN}>Tuntutan Bayaran</option>
                       <option value={ProjectStatus.SIAP}>Siap</option>
                    </select>
                 </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default ProjectDetail;
