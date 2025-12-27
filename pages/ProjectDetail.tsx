
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Project, ProjectStatus, BQGroup, formatCurrency, BP_OPTIONS, ZON_OPTIONS, GlobalDimensions, User, Role, getCurrentDate, formatDate, ProjectLocation, BQItem, CalculationPart } from '../types';
import { ArrowLeft, Save, Zap, Folder, CheckCircle, Edit, Info, Calculator, Calendar, Lock, Unlock, RefreshCw, AlertCircle, FileSignature, X, Plus, HelpCircle, FileText, Download, Loader2, FileWarning, Award, Star, Megaphone, User as UserIcon, ChevronDown } from 'lucide-react';
import BQEditor from './BQEditor';
import BQPelarasanEditor from './BQPelarasanEditor';
import AkuJanjiEditor from './AkuJanjiEditor';
import LADCertificate from './LADCertificate';
import CPCCertificate from './CPCCertificate';
import PrestasiCertificate from './PrestasiCertificate';
import NotisGenerator from './NotisGenerator';
import { supabaseService } from '../services/supabaseService';

const toRoman = (num: number): string => {
  const lookup: { [key: string]: number } = {m:1000,cm:900,d:500,cd:400,c:100,xc:90,l:50,xl:40,x:10,ix:9,v:5,iv:4,i:1};
  let roman = '';
  for (let i in lookup ) {
    while ( num >= lookup[i] ) {
      roman += i;
      num -= lookup[i];
    }
  }
  return roman;
};

const getMalayMonthYear = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const months = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

const getItemLevel = (item: BQItem): 0 | 1 | 2 => {
    if (item.type === 'HEADER') {
        const isUppercase = item.description === item.description.toUpperCase() && /[A-Z]/.test(item.description);
        return isUppercase ? 0 : 1;
    }
    return 2; 
};

const getAutoNumber = (items: BQItem[], currentIndex: number) => {
    let sectionIndex = 0;
    let itemIndex = 0;
    let variantIndex = 0;
    let lastHeaderType: 'NONE' | 'SECTION' | 'ITEM_PARENT' = 'NONE';

    for (let i = 0; i <= currentIndex; i++) {
        const item = items[i];
        const level = getItemLevel(item);

        if (level === 0) { 
            sectionIndex++;
            itemIndex = 0;
            variantIndex = 0;
            lastHeaderType = 'SECTION';
        } else if (level === 1) { 
            itemIndex++;
            variantIndex = 0;
            lastHeaderType = 'ITEM_PARENT';
        } else { 
            if (lastHeaderType === 'ITEM_PARENT') {
                variantIndex++;
            } else {
                itemIndex++; 
            }
        }
    }

    const currentItem = items[currentIndex];
    const level = getItemLevel(currentItem);
    
    if (level === 0) return `${sectionIndex}.0`;
    if (level === 1) return `${sectionIndex}.${itemIndex}`;
    
    if (lastHeaderType === 'ITEM_PARENT') {
        return `${toRoman(variantIndex)})`;
    } else {
        return `${sectionIndex}.${itemIndex}`;
    }
};

const getBase64ImageFromURL = (url: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
      } else {
          resolve(null);
      }
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = url;
  });
};

interface ProjectDetailProps {
  project?: Project;
  onClose: () => void;
  onSave: () => void;
  currentUserRole: string;
  selectedYear: number;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

const addDaysSkippingWeekends = (dateStr: string, daysToAdd: number): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return ''; 
  date.setDate(date.getDate() + daysToAdd);
  if (date.getDay() === 6) { date.setDate(date.getDate() + 2); } else if (date.getDay() === 0) { date.setDate(date.getDate() + 1); }
  return date.toISOString().split('T')[0];
};

const calculateEndDate = (startDateStr: string, duration: number, unit: 'Minggu' | 'Bulan' | 'Tahun'): string => {
  if (!startDateStr || !duration) return '';
  const date = new Date(startDateStr);
  if (isNaN(date.getTime())) return '';
  if (unit === 'Minggu') { date.setDate(date.getDate() + (duration * 7)); } else if (unit === 'Bulan') { date.setMonth(date.getMonth() + duration); } else if (unit === 'Tahun') { date.setFullYear(date.getFullYear() + duration); }
  return date.toISOString().split('T')[0];
};

const calculateBusinessDays = (startDateStr: string, endDateStr: string): number => {
  if (!startDateStr || !endDateStr) return 0;
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  if (start > end) return 0;
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const dayOfWeek = cur.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { count++; }
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

interface StrictDateInputProps {
  name: string;
  value?: string;
  onChange: (e: any) => void;
  className?: string;
  readOnly?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const StrictDateInput: React.FC<StrictDateInputProps> = ({ name, value, onChange, className, readOnly, disabled, placeholder }) => {
  const [textValue, setTextValue] = useState('');
  const [error, setError] = useState(false);
  useEffect(() => {
    if (value) { const formatted = formatDate(value); setTextValue(formatted); setError(false); } else { if (!error) setTextValue(''); }
  }, [value]);
  const validateAndParse = (input: string): string | null => {
      const parts = input.trim().split(/[\/\-\.]/);
      if (parts.length !== 3) return null;
      let d = parseInt(parts[0], 10); let m = parseInt(parts[1], 10); let y = parseInt(parts[2], 10);
      if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
      if (y < 100) { y += 2000; }
      if (m < 1 || m > 12) return null;
      if (d < 1 || d > 31) return null;
      const dateObj = new Date(y, m - 1, d);
      if (dateObj.getFullYear() !== y || dateObj.getMonth() !== m - 1 || dateObj.getDate() !== d) { return null; }
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; setTextValue(val); if (error) setError(false);
  };
  const commitDate = () => {
    if (textValue.trim() === '') { setError(false); onChange({ target: { name, value: '' } }); return; }
    const isoDate = validateAndParse(textValue);
    if (isoDate) { setError(false); onChange({ target: { name, value: isoDate } }); setTextValue(formatDate(isoDate)); } else { setError(true); onChange({ target: { name, value: '' } }); }
  };
  const handleBlur = () => { commitDate(); };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.currentTarget.blur(); } };
  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => { setError(false); onChange(e); };
  return (
    <div className="relative">
        <div className={`relative flex items-center ${className} ${error ? 'border-red-400 focus:border-red-500 ring-1 ring-red-100 dark:ring-red-900/20' : ''}`}>
        <input type="text" value={textValue} onChange={handleTextChange} onBlur={handleBlur} onKeyDown={handleKeyDown} placeholder={placeholder || 'DD/MM/YYYY'} readOnly={readOnly} disabled={disabled} className={`w-full h-full bg-transparent border-none outline-none p-0 text-inherit placeholder-slate-400 ${readOnly ? 'cursor-not-allowed' : ''}`} />
        <div className="relative ml-2 w-5 h-5 shrink-0">
            <Calendar className={`w-5 h-5 pointer-events-none ${error ? 'text-red-400' : 'text-slate-400'}`} />
            {!readOnly && !disabled && ( <input type="date" name={name} value={value || ''} onChange={handlePickerChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" tabIndex={-1} /> )}
        </div>
        </div>
        {error && ( <div className="absolute -bottom-5 left-0 text-[10px] text-red-500 font-bold flex items-center gap-1"> <AlertCircle className="w-3 h-3" /> Tarikh tidak sah </div> )}
    </div>
  );
};

interface CostHUDProps {
  grandTotal: number;
  finalTotal?: number;
  extraTotal?: number;
  status: ProjectStatus;
  progress: number;
  onStatusChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onProgressChange: (val: number) => void;
  saveAction: React.ReactNode;
  exportAction: React.ReactNode;
  isPelarasanActive: boolean;
  isReadOnly?: boolean;
}

const CostHUD = ({ grandTotal, finalTotal, extraTotal, status, progress, onStatusChange, onProgressChange, saveAction, exportAction, isPelarasanActive, isReadOnly }: CostHUDProps) => {
  const [localProgress, setLocalProgress] = useState(progress ? progress.toString() : '0');
  const [isEditingProgress, setIsEditingProgress] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setLocalProgress(progress !== undefined ? progress.toString() : '0'); }, [progress]);

  const handleBlur = () => {
    let val = parseFloat(localProgress.replace(/[^0-9.]/g, ''));
    if (isNaN(val)) val = 0; if (val > 100) val = 100;
    onProgressChange(val); setLocalProgress(val.toString());
    setIsEditingProgress(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { 
    if (e.key === 'Enter') { 
        handleBlur(); 
        (e.currentTarget as HTMLInputElement).blur(); 
    } 
  };

  const toggleEdit = () => {
    if (isReadOnly) return;
    setIsEditingProgress(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return createPortal(
    <div className="fixed top-0 left-0 md:left-28 right-0 z-[90] transition-all duration-300 animate-slide-down no-print">
       <div className="bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-2xl border-b border-slate-200 dark:border-slate-800 shadow-2xl px-3 md:px-8 py-3 md:py-4 flex items-center justify-between gap-4 md:gap-12">
          <div className="flex-1 flex justify-center max-w-3xl border-l border-r border-slate-200/50 dark:border-slate-800/50 mx-2 md:mx-6 px-4 md:px-8">
                <div className="w-full max-w-lg flex flex-col gap-2">
                     <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="relative group shrink-0">
                                <select 
                                  name="status" 
                                  value={status} 
                                  onChange={onStatusChange} 
                                  disabled={isReadOnly}
                                  className={`appearance-none bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 px-3 md:pl-4 md:pr-10 text-[10px] md:text-xs font-black text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 transition-all uppercase tracking-wider ${isReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 hover:border-emerald-500/50'}`} 
                                >
                                    <option value={ProjectStatus.MENUNGGU_LANTIKAN}>Lantikan</option>
                                    <option value={ProjectStatus.DALAM_PROSES}>Proses</option>
                                    <option value={ProjectStatus.PEMERIKSAAN_TAPAK}>Tapak</option>
                                    <option value={ProjectStatus.TUNTUTAN_BAYARAN}>Bayaran</option>
                                    <option value={ProjectStatus.SIAP}>Siap</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none group-hover:text-emerald-500 transition-colors" />
                            </div>
                            {!isReadOnly && <div className="scale-100">{saveAction}</div>}
                            <div className="scale-100">{exportAction}</div>
                         </div>
                         
                         <div 
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all group ${isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/20 active:scale-95'}`} 
                            onClick={toggleEdit}
                         >
                            <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest hidden xs:inline group-hover:text-emerald-500 transition-colors">Siap</span>
                            <div className="flex items-baseline gap-1">
                                <input 
                                    ref={inputRef}
                                    id="progress-input" 
                                    type="number" 
                                    inputMode="decimal"
                                    value={localProgress} 
                                    onChange={(e) => setLocalProgress(e.target.value)} 
                                    onBlur={handleBlur} 
                                    onKeyDown={handleKeyDown} 
                                    disabled={isReadOnly} 
                                    className={`w-10 md:w-14 text-right bg-transparent border-b-2 p-0 text-sm md:text-lg font-black text-emerald-600 dark:text-emerald-400 focus:ring-0 outline-none transition-all ${isEditingProgress ? 'border-emerald-500 bg-white dark:bg-slate-800 px-2 rounded-t-md' : 'border-transparent'}`} 
                                />
                                <span className="text-xs md:text-sm font-black text-emerald-500/50">%</span>
                            </div>
                         </div>
                     </div>
                     <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-700/50">
                        <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all duration-700 ease-out relative" style={{ width: `${Math.min(100, Math.max(0, Number(progress) || 0))}%` }} >
                           <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                     </div>
                </div>
          </div>


          <div className="flex items-center gap-4 md:gap-10 shrink-0">
              <div className="text-right hidden xs:block">
                  <div className="flex flex-col">
                      <p className="text-[10px] md:text-xs font-black text-emerald-500 uppercase tracking-[0.2em] mb-1.5 leading-none"> 
                        {isPelarasanActive ? 'Ringkasan Kos Akhir' : 'Jumlah Kos Projek'} 
                      </p>
                      <div className="flex items-center gap-6 justify-end">
                        <div className="flex flex-col items-end">
                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">{isPelarasanActive ? 'Harga Asal' : ''}</span>
                           <p className={`font-mono font-bold leading-none transition-all ${isPelarasanActive ? 'text-slate-400 line-through text-xs md:text-lg' : 'text-xl md:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 drop-shadow-sm'}`}> 
                             {formatCurrency(grandTotal)} 
                           </p>
                        </div>
                        {isPelarasanActive && finalTotal !== undefined && (
                          <>
                            <div className="flex flex-col items-end border-l-2 border-slate-200 dark:border-slate-700 pl-6 ml-2">
                               <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Harga Akhir</span>
                               <p className={`text-xl md:text-3xl font-black font-mono leading-none transition-all ${ finalTotal < grandTotal ? 'text-red-600' : finalTotal > grandTotal ? 'text-blue-600' : 'text-emerald-600' }`}> 
                                 {formatCurrency(finalTotal)} 
                               </p>
                            </div>
                            <div className="flex flex-col items-end border-l border-slate-200 dark:border-slate-700 pl-4 ml-2">
                               <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">Deductions</span>
                               <p className="text-xs md:text-sm font-bold font-mono leading-none text-red-400">
                                 -{formatCurrency((Math.min(grandTotal + (extraTotal || 0), grandTotal)) - (finalTotal || 0))}
                               </p>
                            </div>
                            {extraTotal !== undefined && extraTotal > 0 && (
                              <div className="flex flex-col items-end border-l border-slate-200 dark:border-slate-700 pl-4 ml-2">
                                 <span className="text-[8px] font-bold text-blue-500 uppercase tracking-wider mb-1">Extra (Capped)</span>
                                 <p className="text-xs md:text-sm font-bold font-mono leading-none text-blue-500">
                                   +{formatCurrency(extraTotal)}
                                 </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                  </div>
              </div>
              <div className="xs:hidden text-right flex flex-col items-end">
                  {isPelarasanActive && finalTotal !== undefined ? (
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                            <span className="text-[7px] font-bold text-slate-400 uppercase leading-none mb-0.5">H. Asal</span>
                            <p className="text-[10px] font-bold text-slate-400 line-through leading-none">{formatCurrency(grandTotal)}</p>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[7px] font-black text-emerald-500 uppercase leading-none mb-0.5">H. Akhir</span>
                            <p className={`text-sm font-black font-mono leading-none ${finalTotal < grandTotal ? 'text-red-600' : finalTotal > grandTotal ? 'text-blue-600' : 'text-emerald-600'}`}>
                              {formatCurrency(finalTotal)}
                            </p>
                        </div>
                      </div>
                  ) : (
                      <>
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest">KOS PROJEK</p>
                          <p className="text-base font-black font-mono text-emerald-600">{formatCurrency(grandTotal)}</p>
                      </>
                  )}
              </div>
          </div>
       </div>
    </div>,
    document.body
  );
};

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onClose, onSave, currentUserRole, selectedYear, onShowToast }) => {
  const currentUser = supabaseService.getCurrentUser();
  const TABS = [
    { id: 'phase1', label: '1. BQ Building (PJA)', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800 shadow-sm', ringColor: 'ring-yellow-400' },
    { id: 'phase2', label: '2. File Creation (PT)', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 shadow-sm', ringColor: 'ring-blue-500' },
    { id: 'phase3', label: '3. Pelarasan (PJA)', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800 shadow-sm', ringColor: 'ring-yellow-400' },
    { id: 'phase4', label: '4. Penutup (PT)', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800 shadow-sm', ringColor: 'ring-orange-500' },
  ];

  const [activeTab, setActiveTab] = useState('phase1');
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [voteNumbers, setVoteNumbers] = useState<string[]>([]);
  const [sebuthargaNumbers, setSebuthargaNumbers] = useState<string[]>([]);
  const [tempohVal, setTempohVal] = useState<number>(0);
  const [tempohUnit, setTempohUnit] = useState<'Minggu'|'Bulan'|'Tahun'>('Minggu');
  const [locationRows, setLocationRows] = useState<ProjectLocation[]>([]);
  const [isLADOpen, setIsLADOpen] = useState(false);
  const [isCPCOpen, setIsCPCOpen] = useState(false);
  const [isPrestasiOpen, setIsPrestasiOpen] = useState(false);
  const [isNotisOpen, setIsNotisOpen] = useState(false);
  const [confirmationState, setConfirmationState] = useState<{ isOpen: boolean; type: 'back' | 'save' | null; }>({ isOpen: false, type: null });

  const initialPjaId = (currentUser?.role === Role.PJA && !project) ? currentUser.id : (project?.pjaId || 0);

  const [formData, setFormData] = useState<Partial<Project>>(project || {
    namaProjek: '', noFail: '', noAduan: '', tarikhBuka: getCurrentDate(), 
    pjaId: initialPjaId, bp: '', zon: '', lokasi: '', 
    status: ProjectStatus.MENUNGGU_LANTIKAN, 
    bqData: [], 
    bqDataPelarasan: [],
    globalDimensions: { length: 0, width: 0, depth: 0 },
    locationDimensions: {},
    locationDimensionsPelarasan: {}, 
    coverJawatan: (currentUser?.role === Role.PJA && !project) ? currentUser.jawatan : '',
    coverBahagian: (currentUser?.role === Role.PJA && !project) ? currentUser.bahagian : '',
    coverUnit: (currentUser?.role === Role.PJA && !project) ? currentUser.unit : '',
    prestasiScores: [0,0,0,0,0,0],
    skop: 'BEKALAN',
    noInbois: '',
    isManualMulaKontrak: project?.isManualMulaKontrak || false,
    isManualMulaKerja: project?.isManualMulaKerja || false
  });

  const isPJA = currentUser?.role === Role.PJA;
  const isDifferentPJA = isPJA && formData.pjaId !== 0 && formData.pjaId !== currentUser?.id;
  const isGlobalReadOnly = isDifferentPJA;
  const isPTSectionReadOnly = isPJA || isGlobalReadOnly;

  useEffect(() => {
    const fetchData = async () => {
        try {
            const u = await supabaseService.getUsers();
            setUsers(u);
            let year = selectedYear;
            if (project && project.tarikhBuka) { year = new Date(project.tarikhBuka).getFullYear(); }
            const [comps, votes, sh] = await Promise.all([
                supabaseService.getCompanies(year),
                supabaseService.getVoteNumbers(year),
                supabaseService.getSebuthargaNumbers(year)
            ]);
            setCompanies(comps); 
            setVoteNumbers(votes); 
            setSebuthargaNumbers(sh);
        } catch (err) {
            console.error('Failed to load project detail data:', err);
        }
    };
    fetchData();
  }, [project, selectedYear]);

  const handlePjaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedPjaId = Number(e.target.value);
      const selectedUser = users.find(u => u.id === selectedPjaId);
      setFormData(prev => ({
          ...prev,
          pjaId: selectedPjaId,
          coverJawatan: selectedUser?.jawatan || prev.coverJawatan || '',
          coverBahagian: selectedUser?.bahagian || prev.coverBahagian || 'Bahagian Infrastruktur',
          coverUnit: selectedUser?.unit || prev.coverUnit || 'Unit Selenggara Infrastruktur'
      }));
  };

  const handleBackClick = () => { setConfirmationState({ isOpen: true, type: 'back' }); };
  const handleSaveClick = () => { setConfirmationState({ isOpen: true, type: 'save' }); };
  const cancelConfirmation = () => { setConfirmationState({ isOpen: false, type: null }); };
  const confirmAction = async () => {
    if (confirmationState.type === 'back') { setConfirmationState({ isOpen: false, type: null }); onClose(); } 
    else if (confirmationState.type === 'save') {
        setConfirmationState({ isOpen: false, type: null }); setIsSaving(true);
        try {
            if (project && project.id) { await supabaseService.updateProject(project.id, formData); } else { await supabaseService.createProject(formData as any); }
            onSave();
        } catch (e) { console.error(e); if (onShowToast) onShowToast("Ralat menyimpan projek.", "error"); } finally { setIsSaving(false); }
    }
  };

  const addLocationRow = () => { setLocationRows(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), lokasi: '', aduan: '' }]); };
  const removeLocationRow = (id: string) => { setLocationRows(prev => { if (prev.length <= 1) return [{ id: Math.random().toString(36).substr(2, 9), lokasi: '', aduan: '' }]; return prev.filter(r => r.id !== id); }); };
  const updateLocationRow = (id: string, field: 'lokasi' | 'aduan', value: string) => { setLocationRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r)); };
  
  const handlePrestasiUpdate = (newScores: number[], percentage: number, skop: 'BEKALAN'|'PERKHIDMATAN'|'KERJA', noInbois: string) => {
      const prestasiString = `${percentage}%`;
      setFormData(prev => ({ ...prev, prestasiScores: newScores, prestasi: prestasiString, skop: skop, noInbois: noInbois }));
      if (onShowToast) onShowToast("Maklumat prestasi dikemaskini. Sila simpan projek.", "info");
  };

  useEffect(() => {
    if (project) {
        if (project.projectLocations && project.projectLocations.length > 0) { setLocationRows(project.projectLocations); } 
        else {
            const locs = (project.lokasi || '').split('\n').filter(l => l.trim() !== '');
            const aduans = (project.noAduan || '').split('\n');
            let rows = locs.map((l, i) => ({ id: Math.random().toString(36).substr(2, 9), lokasi: l, aduan: aduans[i] || '' }));
            if (rows.length === 0) { rows = [{ id: Math.random().toString(36).substr(2, 9), lokasi: '', aduan: '' }]; }
            setLocationRows(rows);
        }
    } else if (locationRows.length === 0) { setLocationRows([{ id: Math.random().toString(36).substr(2, 9), lokasi: '', aduan: '' }]); }
  }, [project]);

  useEffect(() => {
     const lokasiStr = locationRows.map(r => r.lokasi).join('\n');
     const aduanStr = locationRows.map(r => r.aduan).join('\n');
     if (formData.lokasi !== lokasiStr || formData.noAduan !== aduanStr || JSON.stringify(formData.projectLocations) !== JSON.stringify(locationRows)) { setFormData(prev => ({ ...prev, lokasi: lokasiStr, noAduan: aduanStr, projectLocations: locationRows })); }
  }, [locationRows]);

  useEffect(() => {
    if (project?.tempohKontrak) { const parts = project.tempohKontrak.split(' '); if (parts.length === 2) { setTempohVal(Number(parts[0])); setTempohUnit(parts[1] as any); } }
  }, [project]);

  // Auto-detect manual mode on load
  useEffect(() => {
    if (project) {
        let detectedManualKontrak = project.isManualMulaKontrak || false;
        let detectedManualKerja = project.isManualMulaKerja || false;

        if (project.tarikhCetakanBpp && project.tarikhMulaKontrak && !project.isManualMulaKontrak) {
            const autoDate = addDaysSkippingWeekends(project.tarikhCetakanBpp, 2);
            if (autoDate !== project.tarikhMulaKontrak) {
                detectedManualKontrak = true;
            }
        }
        if (project.tarikhSerahTapak && project.tarikhMulaKerja && !project.isManualMulaKerja) {
            const autoDate = addDaysSkippingWeekends(project.tarikhSerahTapak, 2);
            if (autoDate !== project.tarikhMulaKerja) {
                detectedManualKerja = true;
            }
        }

        // Ensure formData has these values if they were detected
        if (detectedManualKontrak !== formData.isManualMulaKontrak || detectedManualKerja !== formData.isManualMulaKerja) {
            setFormData(prev => ({ 
                ...prev, 
                isManualMulaKontrak: detectedManualKontrak, 
                isManualMulaKerja: detectedManualKerja 
            }));
        }
    }
  }, [project]);

  useEffect(() => {
    const newVal = tempohVal > 0 ? `${tempohVal} ${tempohUnit}` : '';
    if (formData.tempohKontrak !== newVal) { setFormData(prev => ({ ...prev, tempohKontrak: newVal })); }
  }, [tempohVal, tempohUnit]);

  useEffect(() => {
    if (formData.tarikhTamatKontrak && formData.tarikhSiapSebenar) {
        const endDate = new Date(formData.tarikhTamatKontrak); const actualDate = new Date(formData.tarikhSiapSebenar);
        const timeDiff = actualDate.getTime() - endDate.getTime(); const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        const ladDays = dayDiff > 0 ? dayDiff : 0; const contractSum = formData.kosProjek || 0;
        let dailyRate = contractSum < 20000 ? 20.00 : (contractSum * 0.064) / 365;
        const totalLad = parseFloat((dailyRate * ladDays).toFixed(2));
        if (formData.ladDays !== ladDays || formData.ladAmount !== totalLad) { setFormData(prev => ({ ...prev, ladDays: ladDays, ladAmount: totalLad })); }
    } else { if (formData.ladDays !== 0 && formData.ladDays !== undefined) { setFormData(prev => ({ ...prev, ladDays: 0, ladAmount: 0 })); } }
  }, [formData.tarikhTamatKontrak, formData.tarikhSiapSebenar, formData.kosProjek]);

  // Synchronized Kos Sebenar Watcher (THIS IS THE HARGA AKHIR CALCULATION)
  useEffect(() => {
    const bqSum = formData.bqDataPelarasan?.reduce((acc, group) => { 
        return acc + group.items.reduce((itemSum, item) => itemSum + (item.amount || 0), 0); 
    }, 0);

    // If bqSum is 0 and we have no groups, or if it's explicitly null/undefined, fallback to kosProjek
    const rawAdjustedBqSum = (bqSum === 0 && (!formData.bqDataPelarasan || formData.bqDataPelarasan.length === 0)) 
        ? (formData.kosProjek ?? 0) 
        : (bqSum ?? (formData.kosProjek ?? 0));
    
    // CAP THE BQ SUM AT THE CONTRACT PRICE (kosProjek)
    const contractPrice = formData.kosProjek || 0;
    const cappedAdjustedBqSum = Math.min(rawAdjustedBqSum, contractPrice);
    const extraPrice = Math.max(0, rawAdjustedBqSum - contractPrice);

    // THE CRITICAL CALCULATION: Capped Adjusted BQ Sum - LAD - Wang Tahanan = HARGA AKHIR (kosSebenar)
    const finalCalculatedTotal = cappedAdjustedBqSum - (formData.ladAmount || 0) - (formData.wangTahanan || 0);
    
    if (formData.kosSebenar !== finalCalculatedTotal || formData.bqPelarasanExtra !== extraPrice) {
        setFormData(prev => ({ 
          ...prev, 
          kosSebenar: Math.max(0, finalCalculatedTotal),
          bqPelarasanExtra: extraPrice
        }));
    }
  }, [formData.bqDataPelarasan, formData.ladAmount, formData.wangTahanan, formData.kosProjek]);

  useEffect(() => {
    if (activeTab === 'phase3' && formData.bqData && formData.bqData.length > 0) {
       const sourceData = formData.bqData; const targetData = formData.bqDataPelarasan || [];
       const syncedData = sourceData.map(sourceBill => {
           const targetBill = targetData.find(b => b.id === sourceBill.id);
           if (!targetBill) { return JSON.parse(JSON.stringify(sourceBill)); }
           const newBill = { ...targetBill, title: sourceBill.title, locationId: sourceBill.locationId, calculationId: targetBill.calculationId || sourceBill.calculationId };
           newBill.items = sourceBill.items.map(sourceItem => {
               const targetItem = targetBill.items.find(i => i.id === sourceItem.id);
               if (!targetItem) { return JSON.parse(JSON.stringify(sourceItem)); }
               return { 
                   ...targetItem, 
                   description: sourceItem.description, 
                   unit: sourceItem.unit, 
                   rate: sourceItem.rate, 
                   variant: sourceItem.variant, 
                   type: sourceItem.type,
                   isGlobal: targetItem.isGlobal !== undefined ? targetItem.isGlobal : sourceItem.isGlobal,
                   calculationParts: targetItem.calculationParts || sourceItem.calculationParts,
                   qty: targetItem.qty !== undefined ? targetItem.qty : sourceItem.qty,
                   amount: targetItem.amount !== undefined ? targetItem.amount : sourceItem.amount
               };
           });
           return newBill;
       });

       if (JSON.stringify(syncedData) !== JSON.stringify(targetData)) { 
           setFormData(prev => ({ ...prev, bqDataPelarasan: syncedData })); 
       }
    }
  }, [activeTab, formData.bqData]);

  useEffect(() => {
    if (!formData.isManualMulaKontrak && formData.tarikhCetakanBpp) { const newDate = addDaysSkippingWeekends(formData.tarikhCetakanBpp, 2); if (newDate && newDate !== formData.tarikhMulaKontrak) { setFormData(prev => ({ ...prev, tarikhMulaKontrak: newDate })); } }
  }, [formData.tarikhCetakanBpp, formData.isManualMulaKontrak]);

  useEffect(() => {
    if (formData.tarikhMulaKontrak && tempohVal > 0) { const newDate = calculateEndDate(formData.tarikhMulaKontrak, tempohVal, tempohUnit); if (newDate && newDate !== formData.tarikhTamatKontrak) { setFormData(prev => ({ ...prev, tarikhTamatKontrak: newDate })); } }
  }, [formData.tarikhMulaKontrak, tempohVal, tempohUnit]);

  useEffect(() => {
     if (!formData.isManualMulaKerja && formData.tarikhSerahTapak) { const newDate = addDaysSkippingWeekends(formData.tarikhSerahTapak, 2); if (newDate && newDate !== formData.tarikhMulaKerja) { setFormData(prev => ({ ...prev, tarikhMulaKerja: newDate })); } }
  }, [formData.tarikhSerahTapak, formData.isManualMulaKerja]);

  useEffect(() => {
     if (formData.tarikhCetakanBpp && formData.tarikhSerahTapak) { const days = calculateBusinessDays(formData.tarikhCetakanBpp, formData.tarikhSerahTapak); const isoString = `${days} Hari`; if (formData.iso !== isoString) { setFormData(prev => ({ ...prev, iso: isoString })); } }
  }, [formData.tarikhCetakanBpp, formData.tarikhSerahTapak]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target; const finalValue = name === 'namaProjek' ? value.toUpperCase() : value;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleLocationDimensionsChange = (calculationId: string, dims: GlobalDimensions) => {
    setFormData(prev => ({ 
      ...prev, 
      globalCalculations: { 
        ...(prev.globalCalculations || {}), 
        [calculationId]: dims 
      } 
    }));
  };

  const handleGlobalCalculationsPelarasanChange = (calculationId: string, dims: GlobalDimensions) => {
    setFormData(prev => ({ 
      ...prev, 
      globalCalculationsPelarasan: { 
        ...(prev.globalCalculationsPelarasan || {}), 
        [calculationId]: dims 
      } 
    }));
  };

  const handleBQPelarasanChange = (bqDataPelarasan: BQGroup[]) => {
    setFormData(prev => ({ ...prev, bqDataPelarasan }));
  };

  const handleBQChange = (bqData: BQGroup[]) => {
    setFormData(prev => ({ ...prev, bqData }));
  };

  // Synchronized Kos Projek Watcher
  useEffect(() => {
    const total = formData.bqData?.reduce((acc, group) => { 
        return acc + group.items.reduce((itemSum, item) => itemSum + (item.amount || 0), 0); 
    }, 0) || 0;
    if (formData.kosProjek !== total) {
        setFormData(prev => ({ ...prev, kosProjek: total }));
    }
  }, [formData.bqData]);

  const handleAkuJanjiUpdate = (updates: Partial<Project>) => { setFormData(prev => ({ ...prev, ...updates })); };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
        if (activeTab === 'phase1') { await handleExportRealBQPDF(); } 
        else if (activeTab === 'phase3') { await handleExportRealPelarasanPDF(); } 
    } catch (e) { console.error(e); if (onShowToast) onShowToast("Gagal menjana PDF", "error"); } finally { setIsExporting(false); }
  };

  const handleExportRealBQPDF = async () => {
      // @ts-ignore
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const sealsLogo = await getBase64ImageFromURL("https://upload.wikimedia.org/wikipedia/commons/6/6e/Selayang_Seal.png");
      const mpsLogo = await getBase64ImageFromURL("https://i.imgur.com/ZB7DFaV.png");
      const pjaUser = users.find(u => u.id === formData.pjaId);
      const year = formData.tarikhBuka ? new Date(formData.tarikhBuka).getFullYear() : new Date().getFullYear();
      const monthNames = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"];
      const dateObj = formData.tarikhBuka ? new Date(formData.tarikhBuka) : new Date();
      const formattedDate = `${monthNames[dateObj.getMonth()]} ${year}`;
      const settings = await supabaseService.getSettings(year);
      const meetingDate = settings.meetingDate || '.........................';

      // --- PAGE 1: COVER LETTER ---
      doc.setFont("helvetica", "bold"); 
      if(sealsLogo) doc.addImage(sealsLogo, 'PNG', 15, 15, 25, 20); 
      if(mpsLogo) doc.addImage(mpsLogo, 'PNG', 170, 15, 25, 20);
      
      doc.setFontSize(11); doc.text("JABATAN KEJURUTERAAN", pageWidth/2, 20, { align: "center" });
      doc.setFontSize(13); doc.text("MAJLIS PERBANDARAN SELAYANG", pageWidth/2, 25, { align: "center" });
      doc.setFontSize(8); doc.setFont("helvetica", "normal");
      doc.text("Persiaran 3, Bandar Baru Selayang", pageWidth/2, 30, { align: "center" });
      doc.text("68100 Batu Caves, Selangor.", pageWidth/2, 33, { align: "center" });
      doc.text("Tel. : 03-61204897/61311426 Fax. : 03-61204879", pageWidth/2, 36, { align: "center" });
      doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text("CADANGAN KERJA", pageWidth/2, 45, { align: "center" });
      doc.setLineWidth(0.5); doc.line(pageWidth/2 - 20, 46, pageWidth/2 + 20, 46); 

      let y = 55;
      const coverBody = [
          [{ content: 'Tarikh', styles: { fontStyle: 'bold' } }, { content: `\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 ${formattedDate}`, styles: { fontStyle: 'bold' } }],
          [{ content: 'Daripada', styles: { fontStyle: 'bold' } }, { content: `${pjaUser?.fullName.toUpperCase() || 'PJA'}\n${pjaUser?.jawatan || ''}\n${pjaUser?.bahagian || ''}\n${pjaUser?.unit || ''}` }],
          [{ content: 'Kepada', styles: { fontStyle: 'bold' } }, { content: 'Pengarah\nJabatan Kejuruteraan' }],
          [{ content: 'Tajuk', styles: { fontStyle: 'bold' } }, { content: formData.namaProjek?.toUpperCase() || '', styles: { fontStyle: 'bold' } }],
          [{ content: 'Blok Perancangan', styles: { fontStyle: 'bold' } }, { content: formData.bp || '' }],
          [{ content: 'Zon', styles: { fontStyle: 'bold' } }, { content: formData.zon || '' }],
      ];
      // @ts-ignore
      doc.autoTable({ startY: y, body: coverBody, theme: 'plain', styles: { fontSize: 9, cellPadding: 3, lineColor: 0, lineWidth: 0.1, textColor: 0 }, columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 'auto' } }, margin: { left: 20, right: 20 } });
      
      // @ts-ignore
      y = doc.lastAutoTable.finalY + 10;

      const pageHeight = doc.internal.pageSize.getHeight();
      const marginBottom = 15;
      const signatureBlockHeight = 60; 

      // 2. Reference Text
      doc.setFontSize(9); 
      doc.setFont("helvetica", "normal"); 
      doc.text("Perkara di atas adalah dirujuk.", 20, y); 
      y += 8; // Reduced from 10

      // 3. Project Title 
      const p1 = `2.   ${(formData.namaProjek || '').toLowerCase().replace(/\b\w/g, char => char.toUpperCase())}`;
      doc.setFont("helvetica", "bold");
      doc.text(p1, 20, y, { maxWidth: 170, align: "justify" });
      const lineCount = doc.splitTextToSize(p1, 170).length;
      y += (lineCount * 4.5);

      // 4. Attachments
      doc.setFont("helvetica", "normal"); 
      doc.text("Bersama-sama ini dilampirkan pelan tapak, gambar lokasi aduan serta spesifikasi kerja (BQ)", 28, y); 
      y += 10; 
      doc.text("Sekian, terima kasih.", 20, y); 
      y += 10;

      // 5. Slogans
      doc.setFont("helvetica", "bold"); 
      doc.setFontSize(8); 
      const slogans = [
          "“KITASELANGOR MAJU BERSAMA”", 
          "“MALAYSIA MADANI”", 
          "“BERKHIDMAT UNTUK NEGARA”", 
          "“MAMPAN PROGRESIF SEJAHTERA”"
      ]; 
      slogans.forEach(s => { 
          doc.text(s, 20, y); 
          y += 4; 
      }); 

      y += 8;

      if (y + 40 > pageHeight - marginBottom) {
          doc.addPage();
          y = 20; 
      }

      // 6. Signature Details
      doc.setFont("helvetica", "normal"); 
      doc.setFontSize(9); 
      doc.text("Saya yang menjalankan amanah,", 20, y); 

      y += 18;
      doc.text("..................................................................", 20, y); 

      y += 5; 
      doc.setFont("helvetica", "bold"); 
      doc.text(`(${pjaUser?.fullName.toUpperCase() || 'NAMA PJA'})`, 20, y); 

      y += 5; 
      doc.setFont("helvetica", "normal"); 
      doc.text(pjaUser?.jawatan || '', 20, y); 

      y += 4; 
      doc.text(pjaUser?.bahagian || '', 20, y); 

      y += 4; 
      doc.text(pjaUser?.unit || '', 20, y);

      // --- PAGE 2: ULASAN ---
      doc.addPage(); doc.rect(20, 20, 170, 120); doc.rect(20, 145, 170, 120); y = 30; doc.setFont("helvetica", "bold"); doc.text("ULASAN JURUTERA", 25, y); y += 10;
      const titleLines = doc.splitTextToSize(formData.namaProjek?.toUpperCase() || '', 160); doc.text(titleLines, 25, y); y += (titleLines.length * 5) + 10;
      doc.setFontSize(9); doc.text("Anggaran Kontrak", 25, y); doc.text(":", 60, y); doc.text(formatCurrency(formData.kosProjek), 65, y); y += 8; doc.text("Tempoh Kontrak", 25, y); doc.text(":", 60, y); doc.text(formData.tempohKontrak || '', 65, y); y += 8; doc.text("Lantikan", 25, y); doc.text(":", 60, y); doc.text(formData.namaSyarikat?.toUpperCase() || '', 65, y); 
      y = 125; doc.text("Tandatangan :", 25, y); y += 10; doc.text("Tarikh             :", 25, y);
      y = 155; doc.setFontSize(11); doc.text("ULASAN PENGARAH", 25, y); y += 10; doc.setFontSize(9); doc.setFont("helvetica", "normal");
      const ulasanText = `Rujuk kelulusan Jawatankuasa Sebutharga Majlis Perbandaran Selayang (MPS) yang bersidang pada ${meetingDate} dengan rotasi bagi syarikat :-`;
      const splitUlasan = doc.splitTextToSize(ulasanText, 160); doc.text(splitUlasan, 25, y);
      y += 40; doc.line(25, y, 185, y); y += 15; doc.line(25, y, 185, y);
      y = 250; doc.text("Tandatangan :", 25, y); y += 10; doc.text("Tarikh             :", 25, y);

      // --- BQ DATA SECTION ---
      const bqData = formData.bqData || [];
      let bqSectionIdx = 0;
      
      for (const bill of bqData) {
          doc.addPage();
          const isPermulaan = bill.title.toUpperCase().includes('PERMULAAN');
          let locText = isPermulaan ? (locationRows || []).map(l => l.lokasi).join('\n') : ((locationRows || []).find(l => l.id === bill.locationId)?.lokasi || 'TIADA LOKASI');
          let aduanText = isPermulaan ? (locationRows || []).map(l => l.aduan).join('\n') : ((locationRows || []).find(l => l.id === bill.locationId)?.aduan || '');
          
          const tableBody = [];
          // Style definitions
          const sideOnlyBorder = { top: 0, right: 0.1, bottom: 0, left: 0.1 };
          const titleBorder = { top: 0.1, right: 0.1, bottom: 0, left: 0.1 };

          // 1. Add Section Title as a Body Row
          tableBody.push([{ content: bill.title, colSpan: 6, styles: { fontStyle: 'bold', halign: 'left', lineWidth: titleBorder, fillColor: [245, 245, 245] } }]);

          // 2. Build Items
          bill.items.forEach((item, itemIndex) => {
              const autoNum = getAutoNumber(bill.items, itemIndex);
              const isHeader = item.type === 'HEADER';
              let descText = item.description;
              if (item.variant) descText += `\n${item.variant}`;
              
              if (!isHeader && item.calculationParts?.length > 0) {
                  const dims = item.calculationParts
                      .filter(p => (p.hasLength && p.length > 0) || (p.hasWidth && p.width > 0) || (p.hasDepth && p.depth > 0) || p.multiplier !== 1)
                      .map(p => {
                          const parts = [];
                          if (p.hasLength) parts.push(`${p.length}m(P)`);
                          if (p.hasWidth) parts.push(`${p.width}m(L)`);
                          if (p.hasDepth) parts.push(`${p.depth}m(T)`);
                          if (p.multiplier !== 1) parts.push(`x ${p.multiplier}`);
                          return parts.join(' x ');
                      }).join('\n');
                  if (dims) descText += `\n\n${dims}`;
              }

              tableBody.push([
                  { content: autoNum, styles: { halign: 'center', valign: 'top', lineWidth: sideOnlyBorder } },
                  { content: descText, styles: { fontStyle: isHeader ? 'bold' : 'normal', lineWidth: sideOnlyBorder } },
                  { content: item.unit, styles: { halign: 'center', valign: 'top', lineWidth: sideOnlyBorder } },
                  { content: item.qty || '', styles: { halign: 'center', valign: 'top', lineWidth: sideOnlyBorder } },
                  { content: item.rate ? formatCurrency(item.rate).replace('RM', '') : '', styles: { halign: 'right', valign: 'top', lineWidth: sideOnlyBorder } },
                  { content: item.amount ? formatCurrency(item.amount).replace('RM', '') : '', styles: { halign: 'right', valign: 'top', lineWidth: sideOnlyBorder } }
              ]);
          });

          // 3. Define the Total Row as FOOTER
          const billTotal = bill.items.reduce((s, i) => s + (i.amount || 0), 0);
          const tableFooter = [[
              { content: 'TO COLLECTION', colSpan: 5, styles: { fontStyle: 'bold', halign: 'right', lineWidth: 0.1 } },
              { content: formatCurrency(billTotal).replace('RM', ''), styles: { fontStyle: 'bold', halign: 'right', lineWidth: 0.1 } }
          ]];

          let tableStartY = 15;
          if (bqSectionIdx === 0) {
              // Project Title Header
              // @ts-ignore
              doc.autoTable({
                  body: [[{ content: `${formData.namaProjek?.toUpperCase()}`, colSpan: 6, styles: { halign: 'center', fontStyle: 'bold', fontSize: 10 } }]],
                  theme: 'grid', startY: 15, styles: { lineWidth: 0.1, lineColor: 0 }, margin: { left: 10, right: 10 }
              });
              // @ts-ignore
              tableStartY = doc.lastAutoTable.finalY;
          }

          const complexHead = [
              [{ content: 'LOKASI ADUAN', colSpan: 4, styles: { halign: 'center', fontStyle: 'bold', fontSize: 8 } }, { content: 'NO ADUAN', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', fontSize: 8 } }],
              [{ content: locText, colSpan: 4, styles: { halign: 'center', fontSize: 8 } }, { content: aduanText, colSpan: 2, styles: { halign: 'center', fontSize: 8 } }],
              ['BIL', 'KETERANGAN', 'UNIT', 'KUANTITI', 'KADAR (RM)', 'JUMLAH (RM)']
          ];

          // 4. Main Table with Logic to prevent Orphaned Footer
          // @ts-ignore
          doc.autoTable({
              head: complexHead,
              body: tableBody,
              foot: tableFooter,
              theme: 'grid',
              startY: tableStartY,
              rowPageBreak: 'avoid',
              showHead: 'everyPage', // Key: Repeats Location info on page breaks
              showFoot: 'lastPage',  // Footer only at the end
              margin: { top: 20, left: 10, right: 10, bottom: 20 },
              tableLineWidth: 0.1,
              tableLineColor: [0, 0, 0],
              styles: { fontSize: 8, cellPadding: 2, lineColor: 0, lineWidth: 0.1, textColor: 0 },
              headStyles: { fillColor: 255, textColor: 0, fontStyle: 'bold', lineWidth: 0.1 },
              footStyles: { fillColor: 255, textColor: 0, fontStyle: 'bold', lineWidth: 0.1 },
              columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 13 }, 3: { cellWidth: 17 }, 4: { cellWidth: 25 }, 5: { cellWidth: 25 } },
              didDrawCell: (data) => {
                  // This ensures vertical lines continue correctly
                  if (data.section === 'body' && data.row.index === tableBody.length - 1) {
                      doc.setLineWidth(0.1);
                      doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
                  }
              }
          });
          bqSectionIdx++;
      }

      // --- SUMMARY PAGE ---
      doc.addPage(); 
      const grandTotal = bqData.reduce((acc, g) => acc + g.items.reduce((s, i) => s + (i.amount||0), 0), 0);
      doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("SENARAI RINGKASAN", pageWidth/2, 20, { align: "center" }); 
      doc.setLineWidth(0.5); doc.line(pageWidth/2 - 20, 21, pageWidth/2 + 20, 21);
      
      const summaryBody = bqData.map(b => [
          { content: b.title, styles: { fontStyle: 'bold' } },
          { content: formatCurrency(b.items.reduce((s,i) => s+(i.amount||0), 0)).replace('RM', ''), styles: { halign: 'right', fontStyle: 'bold' } }
      ]);
      
      // @ts-ignore
      doc.autoTable({
          startY: 30,
          head: [['KETERANGAN', 'JUMLAH (RM)']],
          body: summaryBody,
          foot: [[{ content: 'TOTAL COLLECTION', styles: { halign: 'center' } }, { content: formatCurrency(grandTotal).replace('RM', ''), styles: { halign: 'right' } }]],
          theme: 'grid',
          styles: { fontSize: 8, cellPadding: 1.5, lineColor: 0, lineWidth: 0.1 },
          headStyles: { fillColor: 240, textColor: 0, fontStyle: 'bold' },
          footStyles: { fillColor: 240, textColor: 0, fontStyle: 'bold' },
          margin: { left: 20, right: 20 }
      });

      // --- NOTES & SIGNATURES ---
      // @ts-ignore
      y = doc.lastAutoTable.finalY + 15;
      const notes = "Sebelum kerja-kerja dimulakan pemborong dikehendaki melawat tapak bersama dengan Penolong Jurutera kawasan untuk mempastikan tempat dan menyelesaikan masalah berbangkit di tapak sebelum memulakan kerja. Kontraktor adalah dikecualikan daripada mengemukakkan Bon Perlaksanaan. Walaubagaimanapun, tempoh tanggungan kecacatan seperti di bawah juga dikenakan kepada kontraktor dan syarat ini hendaklah dinyatakan dalam surat tawaran.\n( Rujuk Kementerian Kewangan Surat Pekeliling Perbendaharaan Bil 3 Tahun 2007)";

      // @ts-ignore
      doc.autoTable({
        startY: y, margin: { left: 20, right: 20 }, body: [[notes]], theme: 'plain',
        styles: { fontSize: 9, font: "helvetica", halign: 'justify', cellPadding: 0 },
        columnStyles: { 0: { cellWidth: 170 } }
      });

      // @ts-ignore
      y = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(9); doc.setFont("helvetica", "bold"); 
      doc.text("Nilai Projek", 20, y); doc.text("Tempoh Tanggungan Kecacatan", 100, y); 
      y += 5; doc.setFont("helvetica", "normal"); 
      doc.text("RM 10,000 - RM 100,000", 20, y); doc.text("6 Bulan dari tarikh kerja diperakukan siap", 100, y); 
      y += 5; doc.text("Melebihi RM 10,000", 20, y); doc.text("12 bulan dari tarikh kerja diperakukan siap", 100, y);
      
      y = 250; doc.setFont("helvetica", "bold"); doc.text("Disediakan oleh", 20, y); doc.text("Disemak oleh,", 120, y); 
      y += 20; doc.line(20, y, 80, y); doc.line(120, y, 180, y);
      
      doc.save(`BQ_Dokumen_${formData.noFail || 'Draft'}.pdf`);
  };

  const handleExportRealPelarasanPDF = async () => {
      // @ts-ignore
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      
      const pelarasanData = formData.bqDataPelarasan || [];
      const originalData = formData.bqData || [];
      
      let pelSectionIdx = 0;
      for (const bill of pelarasanData) {
          doc.addPage();
          const originalBill = originalData.find(b => b.id === bill.id);
          const isPermulaan = bill.title.toUpperCase().includes('PERMULAAN');
          let locText = isPermulaan ? (locationRows || []).map(l => l.lokasi).join('\n') : ((locationRows || []).find(l => l.id === bill.locationId)?.lokasi || 'TIADA LOKASI');
          let aduanText = isPermulaan ? (locationRows || []).map(l => l.aduan).join('\n') : ((locationRows || []).find(l => l.id === bill.locationId)?.aduan || '');

          const tableBody = [];
          const sideOnlyBorder = { top: 0, right: 0.1, bottom: 0, left: 0.1 };
          const titleBorder = { top: 0.1, right: 0.1, bottom: 0, left: 0.1 };
          const fullBorder = 0.1;

          tableBody.push([{ content: bill.title, colSpan: 9, styles: { fontStyle: 'bold', halign: 'left', lineWidth: titleBorder, fontSize: 8 } }]);

          let itemIndex = 0;
          for (const item of bill.items) {
              const autoNum = getAutoNumber(bill.items, itemIndex);
              const isHeader = item.type === 'HEADER';
              const originalItem = originalBill?.items.find(i => i.id === item.id);
              const origQty = originalItem?.qty || 0;
              const origAmt = originalItem?.amount || 0;
              const diff = (item.amount || 0) - origAmt;

              let descText = item.description;
              if (item.variant) descText += `\n${item.variant}`;
              
              if (!isHeader && item.calculationParts && item.calculationParts.length > 0) {
                  const dims = item.calculationParts.filter(p => (p.hasLength && p.length>0) || (p.hasWidth && p.width>0) || (p.hasDepth && p.depth>0) || p.multiplier !== 1)
                      .map(p => {
                          const parts = [];
                          if (p.hasLength) parts.push(`${p.length}m(P)`);
                          if (p.hasWidth) parts.push(`${p.width}m(L)`);
                          if (p.hasDepth) parts.push(`${p.depth}m(T)`);
                          if (p.multiplier !== 1) parts.push(`x ${p.multiplier}`);
                          return parts.join(' x ');
                      }).join('\n');
                  if (dims) descText += `\n\nKiraan Laras:\n${dims}`;
              }

              tableBody.push([
                  { content: autoNum, styles: { halign: 'center', valign: 'top', lineWidth: sideOnlyBorder } },
                  { content: descText, styles: { fontStyle: isHeader ? 'bold' : 'normal', lineWidth: sideOnlyBorder } },
                  { content: item.unit, styles: { halign: 'center', valign: 'top', lineWidth: sideOnlyBorder } },
                  { content: item.rate ? formatCurrency(item.rate).replace('RM', '').trim() : '', styles: { halign: 'right', valign: 'top', lineWidth: sideOnlyBorder } },
                  { content: origQty || '', styles: { halign: 'center', valign: 'top', lineWidth: sideOnlyBorder, fillColor: [245, 245, 245] } },
                  { content: origAmt ? formatCurrency(origAmt).replace('RM', '').trim() : '', styles: { halign: 'right', valign: 'top', lineWidth: sideOnlyBorder, fillColor: [245, 245, 245] } },
                  { content: item.qty || '', styles: { halign: 'center', valign: 'top', lineWidth: sideOnlyBorder } },
                  { content: item.amount ? formatCurrency(item.amount).replace('RM', '').trim() : '', styles: { halign: 'right', valign: 'top', lineWidth: sideOnlyBorder } },
                  { content: diff !== 0 ? (diff > 0 ? '+' : '') + formatCurrency(diff).replace('RM', '').trim() : '-', styles: { halign: 'right', valign: 'top', lineWidth: sideOnlyBorder, fontStyle: 'bold', textColor: diff > 0 ? [0, 100, 255] : (diff < 0 ? [255, 0, 0] : [0, 0, 0]) } }
              ]);
              itemIndex++;
          }

          const billTotalOrig = originalBill?.items.reduce((s, i) => s + (i.amount||0), 0) || 0;
          const billTotalLaras = bill.items.reduce((s, i) => s + (i.amount||0), 0);
          const billTotalDiff = billTotalLaras - billTotalOrig;

          tableBody.push([
              { content: `JUMLAH ${bill.title}`, colSpan: 5, styles: { fontStyle: 'bold', halign: 'right', lineWidth: fullBorder, fillColor: [255, 255, 255] } },
              { content: formatCurrency(billTotalOrig).replace('RM', '').trim(), styles: { fontStyle: 'bold', halign: 'right', lineWidth: fullBorder, fillColor: [245, 245, 245] } },
              { content: '', styles: { lineWidth: fullBorder } },
              { content: formatCurrency(billTotalLaras).replace('RM', '').trim(), styles: { fontStyle: 'bold', halign: 'right', lineWidth: fullBorder, fillColor: [255, 255, 255] } },
              { content: formatCurrency(billTotalDiff).replace('RM', '').trim(), styles: { fontStyle: 'bold', halign: 'right', lineWidth: fullBorder, fillColor: [255, 255, 255] } }
          ]);

          let tableStartY = 15;
          if (pelSectionIdx === 0) {
              // @ts-ignore
              doc.autoTable({
                  body: [[{ content: `JADUAL PELARASAN HARGA - ${formData.namaProjek?.toUpperCase()}`, colSpan: 9, styles: { halign: 'center', fontStyle: 'bold', fontSize: 8 } }]],
                  theme: 'grid',
                  startY: 15,
                  tableLineWidth: 0.1,
                  tableLineColor: [0, 0, 0],
                  styles: { fontSize: 7, cellPadding: 1, lineColor: 0, lineWidth: 0.1, textColor: 0 },
                  margin: { left: 10, right: 10 }
              });
              // @ts-ignore
              tableStartY = doc.lastAutoTable.finalY;
          }

          const complexHead = [
              [
                  { content: 'LOKASI ADUAN', colSpan: 6, styles: { halign: 'center', fontStyle: 'bold', fontSize: 8 } },
                  { content: 'NO ADUAN', colSpan: 3, styles: { halign: 'center', fontStyle: 'bold', fontSize: 8 } }
              ],
              [
                  { content: locText, colSpan: 6, styles: { halign: 'center', fontSize: 7 } },
                  { content: aduanText, colSpan: 3, styles: { halign: 'center', fontSize: 7 } }
              ],
              [
                  { content: 'BIL', styles: { halign: 'center', fontSize: 7 } },
                  { content: 'KETERANGAN', styles: { halign: 'center', fontSize: 7 } },
                  { content: 'UNIT', styles: { halign: 'center', fontSize: 7 } },
                  { content: 'KADAR (RM)', styles: { halign: 'center', fontSize: 7 } },
                  { content: 'QTY (ASAL)', styles: { halign: 'center', fontSize: 7, fillColor: [230, 230, 230] } },
                  { content: 'AMAUN (ASAL)', styles: { halign: 'center', fontSize: 7, fillColor: [230, 230, 230] } },
                  { content: 'QTY (LARAS)', styles: { halign: 'center', fontSize: 7 } },
                  { content: 'AMAUN (LARAS)', styles: { halign: 'center', fontSize: 7 } },
                  { content: 'BEZA (RM)', styles: { halign: 'center', fontSize: 7 } }
              ]
          ];

          // @ts-ignore
          doc.autoTable({ head: complexHead, body: tableBody, theme: 'grid', startY: tableStartY, rowPageBreak: 'avoid', tableLineWidth: 0.1, tableLineColor: [0, 0, 0], styles: { fontSize: 7, cellPadding: 1, lineColor: 0, lineWidth: 0.1, textColor: 0 }, headStyles: { fillColor: 255, textColor: 0, fontStyle: 'bold', lineWidth: 0.1, lineColor: 0 }, columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 10 }, 3: { cellWidth: 15 }, 4: { cellWidth: 15 }, 5: { cellWidth: 15 }, 6: { cellWidth: 15 }, 7: { cellWidth: 15 }, 8: { cellWidth: 15 } }, margin: { top: 15, left: 10, right: 10, bottom: 20 }, showHead: 'everyPage' });
          pelSectionIdx++;
      }

      // --- SUMMARY PAGE ---
      doc.addPage();
      const grandTotalOriginal = originalData.reduce((sum, bill) => sum + bill.items.reduce((s, i) => s + (i.amount||0), 0), 0);
      const grandTotalAdjusted = pelarasanData.reduce((sum, bill) => sum + bill.items.reduce((s, i) => s + (i.amount||0), 0), 0);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("RINGKASAN PELARASAN HARGA", pageWidth/2, 20, { align: "center" });
      doc.setLineWidth(0.5);
      doc.line(pageWidth/2 - 30, 21, pageWidth/2 + 30, 21);

      const summaryTableBody = pelarasanData.map(bill => {
          const origTotal = originalData.find(b => b.id === bill.id)?.items.reduce((s,i) => s+(i.amount||0), 0) || 0;
          const larasTotal = bill.items.reduce((s,i) => s+(i.amount||0), 0);
          const diffTotal = larasTotal - origTotal;
          return [
              { content: bill.title, styles: { fontStyle: 'bold' } },
              { content: formatCurrency(origTotal).replace('RM', '').trim(), styles: { halign: 'right' } },
              { content: formatCurrency(larasTotal).replace('RM', '').trim(), styles: { halign: 'right' } },
              { content: (diffTotal > 0 ? '+' : '') + formatCurrency(diffTotal).replace('RM', '').trim(), styles: { halign: 'right', fontStyle: 'bold', textColor: diffTotal > 0 ? [0, 100, 255] : (diffTotal < 0 ? [255, 0, 0] : [0,0,0]) } }
          ];
      });
      
      summaryTableBody.push([
          { content: 'JUMLAH KESELURUHAN', styles: { fontStyle: 'bold', halign: 'center' } as any },
          { content: formatCurrency(grandTotalOriginal).replace('RM', '').trim(), styles: { fontStyle: 'bold', halign: 'right' } as any },
          { content: formatCurrency(grandTotalAdjusted).replace('RM', '').trim(), styles: { fontStyle: 'bold', halign: 'right' } as any },
          { content: formatCurrency(grandTotalAdjusted - grandTotalOriginal).replace('RM', '').trim(), styles: { fontStyle: 'bold', halign: 'right' } as any }
      ]);

      // @ts-ignore
      doc.autoTable({ startY: 30, head: [['KETERANGAN', 'ASAL (RM)', 'LARAS (RM)', 'BEZA (RM)']], body: summaryTableBody, theme: 'grid', styles: { fontSize: 7, cellPadding: 1.5, lineColor: 0, lineWidth: 0.1, textColor: 0 }, headStyles: { fillColor: 240, textColor: 0, fontStyle: 'bold', lineWidth: 0.1, lineColor: 0, halign: 'center' }, columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 25 }, 2: { cellWidth: 25 }, 3: { cellWidth: 25 } }, margin: { left: 20, right: 20 } });

      // --- FINAL CONTRACT SUMMARY BLOCK ---
      // @ts-ignore
      let y = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(8); 
      doc.setFont("helvetica", "bold"); 
      doc.text("PELARASAN JUMLAH HARGA KONTRAK (HARGA AKHIR)", 20, y);
      
      const valBQAsal = Number(grandTotalOriginal) || 0;
      const valBQLarasRaw = Number(grandTotalAdjusted) || 0;
      const valBQLarasCapped = Math.min(valBQLarasRaw, valBQAsal);
      const valExtra = Math.max(0, valBQLarasRaw - valBQAsal);
      const valWT = Number(formData.wangTahanan) || 0;
      const valLAD = Number(formData.ladAmount) || 0;

      const finalPayment = valBQLarasCapped - valWT - valLAD;

      // 1. Reference Table (Contract Asal Only)
      const referenceData = [
          ["HARGA KONTRAK ASAL", formatCurrency(valBQAsal).replace('RM', '').trim()]
      ];

      // 2. Calculation Table (The actual math)
      const calculationData = [
          ["HARGA PELARASAN", formatCurrency(valBQLarasRaw).replace('RM', '').trim()],
          ["WANG TAHANAN", valWT > 0 ? `-${formatCurrency(valWT).replace('RM', '').trim()}` : '-'],
          ["LAD", valLAD > 0 ? `-${formatCurrency(valLAD).replace('RM', '').trim()}` : '-'],
          [
            { content: "JUMLAH DIBAYAR (HARGA AKHIR)", styles: { fillColor: [240, 240, 240], fontStyle: 'bold' } }, 
            { content: formatCurrency(finalPayment).replace('RM', '').trim(), styles: { fillColor: [240, 240, 240], fontStyle: 'bold' } }
          ]
      ];

      if (valExtra > 0) {
          calculationData.splice(1, 0, ["PENAMBAHAN", `+${formatCurrency(valExtra).replace('RM', '').trim()}`]);
      }

      // Render Table 1: Reference
      // @ts-ignore
      doc.autoTable({
          startY: y + 5,
          body: referenceData,
          theme: 'grid',
          styles: { fontSize: 8, cellPadding: 2, lineColor: 0, lineWidth: 0.1, textColor: [100, 100, 100] }, // Grey text for reference
          columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 40, halign: 'right' } },
          margin: { left: 20, right: 20 }
      });

      // Render Table 2: Calculation
      // @ts-ignore
      doc.autoTable({
          startY: doc.lastAutoTable.finalY + 2, // Starts immediately after the reference table
          body: calculationData,
          theme: 'grid',
          styles: { fontSize: 8, cellPadding: 2, lineColor: 0, lineWidth: 0.1, textColor: 0 },
          columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 40, halign: 'right' } },
          margin: { left: 20, right: 20 }
      });

      // DLP Signatures
      // @ts-ignore
      y = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("Disediakan oleh", 20, y);
      doc.text("Disemak oleh,", 120, y);
      y += 20;
      doc.line(20, y, 80, y);
      doc.line(120, y, 180, y);
      
      doc.save(`BQ_Pelarasan_${formData.noFail || 'Draft'}.pdf`);
  };

  const grandTotal = formData.bqData?.reduce((acc, group) => { return acc + group.items.reduce((itemSum, item) => itemSum + (item.amount || 0), 0); }, 0) || 0;
  const finalTotalDisplay = formData.kosSebenar; // ALREADY CALCULATED AS: PELARASAN - LAD - WANG TAHANAN

  const actionButtons = (
    <div className="flex items-center gap-2">
       <button onClick={handleBackClick} className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 p-2 rounded-lg font-bold text-xs shadow-sm transition-all flex items-center justify-center" title="Kembali ke Senarai"> <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline ml-1">Kembali</span> </button>
      {!isGlobalReadOnly && (
        <button onClick={handleSaveClick} disabled={isSaving} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white p-2 rounded-lg font-bold text-xs shadow-md shadow-emerald-500/30 transition-all flex items-center justify-center" title="Simpan Projek"> <Save className="w-4 h-4" /> <span className="hidden sm:inline ml-1">{isSaving ? '...' : 'Simpan'}</span> </button>
      )}
    </div>
  );

  const exportAction = (
     <button onClick={handleExportPDF} disabled={isExporting} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg font-bold shadow-md transition-all hover:scale-105 disabled:opacity-70 disabled:scale-100 text-xs" > {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Download className="w-3.5 h-3.5"/>} <span>PDF</span> </button>
  );

  const inputClass = "w-full px-4 py-3 rounded-lg bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-slate-200 placeholder-slate-400 text-sm shadow-sm dark:shadow-inner disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed";
  const labelClass = "block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 font-jakarta";
  const yellowPhaseClass = "bg-white/80 dark:bg-[#0f172a]/80 border border-yellow-500/30 p-8 rounded-3xl animate-fade-in-up shadow-xl dark:shadow-2xl relative overflow-hidden backdrop-blur-sm";
  const bluePhaseClass = "bg-white/80 dark:bg-[#0f172a]/80 border border-blue-500/30 p-8 rounded-3xl animate-fade-in-up shadow-xl dark:shadow-2xl relative overflow-hidden backdrop-blur-sm";
  const orangePhaseClass = "bg-white/80 dark:bg-[#0f172a]/80 border border-orange-500/30 p-8 rounded-3xl animate-fade-in-up shadow-xl dark:shadow-2xl relative overflow-hidden backdrop-blur-sm";

  return (
    <div className="relative min-h-screen text-slate-900 dark:text-slate-200 pb-20">
      <CostHUD 
        grandTotal={grandTotal} 
        finalTotal={finalTotalDisplay} 
        extraTotal={formData.bqPelarasanExtra}
        isPelarasanActive={activeTab === 'phase3'} 
        status={formData.status || ProjectStatus.MENUNGGU_LANTIKAN} 
        progress={formData.peratusSiap || 0} 
        onStatusChange={handleInputChange} 
        onProgressChange={(val) => setFormData(prev => ({ ...prev, peratusSiap: val }))} 
        saveAction={actionButtons} 
        exportAction={exportAction} 
        isReadOnly={isGlobalReadOnly} 
      />
      <div className="pt-24">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 px-2 no-print gap-4">
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1.5 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></div>
                  <div> <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{project ? 'Kemaskini Projek' : 'Daftar Projek Baru'}</h1> <p className="text-xs text-slate-500 font-mono mt-0.5 uppercase tracking-wider">{formData.noFail || 'No. Fail Belum Ditetapkan'}</p> </div>
                </div>
              </div>
            </div>
            {isGlobalReadOnly && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-800/50 text-xs font-bold shadow-sm">
                <Lock className="w-4 h-4" /> Mode Paparan Sahaja
              </div>
            )}
          </div>
          <div className="mb-6">
              <div className="grid grid-cols-4 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-2xl gap-2 border border-slate-200 dark:border-slate-800">
                  {TABS.map((tab) => ( <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-2 py-3 md:px-4 md:py-3 rounded-xl text-[10px] md:text-xs font-bold transition-all flex flex-col md:flex-row items-center justify-center gap-2 border border-transparent ${ activeTab === tab.id ? `${tab.color}` : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200' }`} > {tab.label} </button> ))}
              </div>
          </div>
        {activeTab === 'phase1' && (
          <div className="space-y-4">
            <div className={yellowPhaseClass}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>
                <h3 className="text-lg font-bold text-yellow-600 dark:text-yellow-500 mb-6 flex items-center gap-3"> <Zap className="h-5 w-5"/> Maklumat Asas (PJA) </h3>
                <div className="flex flex-col gap-6">
                  <div className="group w-full"> <label className={labelClass}>Cadangan Kerja (Nama Projek)</label> <textarea name="namaProjek" value={formData.namaProjek} onChange={handleInputChange} disabled={isGlobalReadOnly} className={`${inputClass} min-h-[60px] text-sm font-bold resize-y`} placeholder="CADANGAN KERJA-KERJA..." /> </div>
                  <div className="group w-full bg-slate-50 dark:bg-black/20 p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                         <div className="flex items-center gap-2"> <div className="w-1 h-3 bg-emerald-500 rounded-full"></div> <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Lokasi & No. Aduan</label> </div>
                         {!isGlobalReadOnly && (
                           <button type="button" onClick={addLocationRow} className="text-[10px] flex items-center gap-1 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 font-bold transition-all shadow-sm" > <Plus className="w-3 h-3" /> Tambah Lokasi </button>
                         )}
                      </div>
                      <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                          {locationRows.map((row, idx) => (
                              <div key={row.id} className="flex flex-col md:flex-row gap-2 items-start animate-fade-in group/row">
                                  <div className="w-full md:flex-[2] relative"> <span className="absolute left-3 top-3.5 text-xs font-bold text-slate-400 select-none">{idx + 1}.</span> <input type="text" value={row.lokasi} onChange={(e) => updateLocationRow(row.id, 'lokasi', e.target.value)} disabled={isGlobalReadOnly} className={`${inputClass} pl-8 py-2 text-xs ${!row.lokasi ? 'border-red-200 dark:border-red-900/30 focus:border-red-500' : ''}`} placeholder="Lokasi" required /> </div>
                                  <div className="w-full md:flex-1 flex gap-2"> <input type="text" value={row.aduan} onChange={(e) => updateLocationRow(row.id, 'aduan', e.target.value)} disabled={isGlobalReadOnly} className={`${inputClass} py-2 text-xs dark:bg-[#162032] dark:border-slate-600 dark:text-white`} placeholder="Aduan" /> {!isGlobalReadOnly && <button type="button" onClick={() => removeLocationRow(row.id)} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-white/5 border border-transparent hover:border-red-100 dark:hover:border-red-900/30 transition-all shadow-sm" title="Padam Baris" > <X className="w-4 h-4" /> </button>} </div>
                              </div>
                          ))}
                      </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="group"> <label className={labelClass}>BP</label> <select name="bp" value={formData.bp} onChange={handleInputChange} disabled={isGlobalReadOnly} className={`${inputClass} py-2 font-bold`}> <option value="">Pilih...</option> {BP_OPTIONS.map(bp => <option key={bp} value={bp}>{bp}</option>)} </select> </div>
                    <div className="group"> <label className={labelClass}>Zon</label> <select name="zon" value={formData.zon} onChange={handleInputChange} disabled={isGlobalReadOnly} className={`${inputClass} py-2 font-bold`}> <option value="">Pilih...</option> {ZON_OPTIONS.map(z => <option key={z} value={z}>{z}</option>)} </select> </div>
                    <div className="group"> <label className={labelClass}>Tarikh Buka</label> <StrictDateInput name="tarikhBuka" value={formData.tarikhBuka} onChange={handleInputChange} disabled={isGlobalReadOnly} className={`${inputClass} py-2 font-bold`} /> </div>
                    
                    <div className="group"> 
                       <label className={labelClass}>Pegawai (PJA)</label> 
                       <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:border-emerald-300">
                           <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shrink-0 overflow-hidden shadow-md text-white font-black">
                               {users.find(u => u.id === formData.pjaId)?.avatarUrl ? (
                                   <img src={users.find(u => u.id === formData.pjaId)?.avatarUrl} alt="PJA" className="w-full h-full object-cover" />
                               ) : (
                                   users.find(u => u.id === formData.pjaId)?.username?.substring(0,2).toUpperCase() || 'PJA'
                               )}
                           </div>
                           <div className="flex-1 min-w-0">
                               <select name="pjaId" value={formData.pjaId || ''} onChange={handlePjaChange} disabled={isPJA || isGlobalReadOnly} className="w-full bg-transparent border-none outline-none text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer p-0 m-0" > 
                                   <option value="">Pilih PJA...</option> 
                                   {users.map(u => ( <option key={u.id} value={u.id}> {u.username.toUpperCase()} </option> ))} 
                               </select>
                               {users.find(u => u.id === formData.pjaId) && <p className="text-[9px] text-slate-400 font-bold uppercase truncate">{users.find(u => u.id === formData.pjaId)?.role.toLowerCase()}</p>}
                           </div>
                       </div>
                    </div>
                  </div>
                </div>
            </div>
            <div id="pdf-export-container" className="flex flex-col items-center gap-0 w-full">
                <div className="rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-2xl bg-white/50 dark:bg-[#0f172a]/40 flex flex-col h-auto overflow-visible w-full">
                    <div className="bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-md p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 rounded-t-[2rem]"> <div className="flex items-center gap-4"> <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20"> <Calculator className="w-5 h-5" /> </div> <div> <h3 className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">Penyediaan BQ</h3> <p className="text-xs text-slate-500 font-medium">Wizard Mode</p> </div> </div> </div>
                    <div className="bg-slate-50/50 dark:bg-[#0f172a]/30 flex-1 relative rounded-b-[2rem]"> <BQEditor initialData={formData.bqData} onDataChange={handleBQChange} projectData={formData as Project} isPrintView={false} locationRows={locationRows} onLocationDimensionsChange={handleLocationDimensionsChange} onShowToast={onShowToast} readOnly={isGlobalReadOnly} /> </div>
                </div>
            </div>
          </div>
        )}
        {activeTab === 'phase2' && (
          <div className="space-y-6">
            <div className={bluePhaseClass}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
                <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-8 gap-4"> <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 flex items-center gap-3"> <Folder className="h-5 w-5"/> Maklumat Fail & Kontrak (PT) </h3> <button onClick={() => setIsNotisOpen(true)} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all shadow-red-500/20" > <Megaphone className="w-4 h-4" /> Jana Notis </button> </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-8">
                  <div className="group"> <label className={labelClass}>No. Fail</label> <input type="text" name="noFail" value={formData.noFail} onChange={handleInputChange} disabled={isPTSectionReadOnly} className={inputClass} /> </div>
                  <div className="group lg:col-span-2"> <label className={labelClass}>Nama Syarikat</label> <select name="namaSyarikat" value={formData.namaSyarikat} onChange={handleInputChange} disabled={isPTSectionReadOnly} className={inputClass}> <option value="">Pilih Syarikat...</option> {companies.map(c => <option key={c} value={c}>{c}</option>)} </select> </div>
                  <div className="group"> <label className={labelClass}>Bulan</label> <select name="bulan" value={formData.bulan} onChange={handleInputChange} disabled={isPTSectionReadOnly} className={inputClass}> <option value="">Pilih...</option> {['Januari','Februari','Mac','April','Mei','Jun','Julai','Ogos','September','Oktober','November','Disember'].map(m => ( <option key={m} value={m}>{m}</option> ))} </select> </div>
                  <div className="group"> <label className={labelClass}>No. Vot</label> <select name="noVote" value={formData.noVote} onChange={handleInputChange} disabled={isPTSectionReadOnly} className={inputClass}> <option value="">Pilih Vot...</option> {voteNumbers.map(v => <option key={v} value={v}>{v}</option>)} </select> </div>
                  <div className="group"> <label className={labelClass}>Tarikh Lantikan</label> <StrictDateInput name="tarikhLantikan" value={formData.tarikhLantikan} onChange={handleInputChange} disabled={isPTSectionReadOnly} className={inputClass} /> </div>
                  <div className="group"> <label className={labelClass}>Tarikh BPP</label> <StrictDateInput name="tarikhCetakanBpp" value={formData.tarikhCetakanBpp} onChange={handleInputChange} disabled={isPTSectionReadOnly} className={inputClass} /> </div>
                  <div className="group"> <label className={labelClass}>Tempoh Kontrak</label> <div className="flex gap-2"> <input type="number" value={tempohVal || ''} onChange={(e) => setTempohVal(Number(e.target.value))} disabled={isPTSectionReadOnly} className={`${inputClass} flex-1`} placeholder="0" /> <select value={tempohUnit} onChange={(e) => setTempohUnit(e.target.value as any)} disabled={isPTSectionReadOnly} className={`${inputClass} w-32`} > <option value="Minggu">Minggu</option> <option value="Bulan">Bulan</option> <option value="Tahun">Tahun</option> </select> </div> </div>
                  <div className="group"> <div className="flex justify-between items-center mb-1"> <label className={labelClass}>Tarikh Mula Kontrak</label> {!isPTSectionReadOnly && <button type="button" onClick={() => setFormData(prev => ({ ...prev, isManualMulaKontrak: !formData.isManualMulaKontrak }))} className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-emerald-500" title={formData.isManualMulaKontrak ? "Reset to Auto" : "Manual Edit"} > {formData.isManualMulaKontrak ? <Unlock className="w-3 h-3"/> : <Lock className="w-3 h-3"/>} {formData.isManualMulaKontrak ? "Manual" : "Auto"} </button>} </div> <StrictDateInput name="tarikhMulaKontrak" value={formData.tarikhMulaKontrak} onChange={handleInputChange} disabled={isPTSectionReadOnly || !formData.isManualMulaKontrak} className={`${inputClass} ${(!formData.isManualMulaKontrak || isPTSectionReadOnly) ? 'bg-slate-50 dark:bg-slate-800/50' : 'ring-2 ring-emerald-500/20'}`} readOnly={!formData.isManualMulaKontrak} /> {!formData.isManualMulaKontrak && <p className="text-[10px] text-slate-400 mt-1 italic flex items-center gap-1"><RefreshCw className="w-3 h-3"/> +2 hari dari BPP (Business Days)</p>} </div>
                  <div className="group"> <label className={labelClass}>Tarikh Tamat Kontrak (Auto)</label> <StrictDateInput name="tarikhTamatKontrak" value={formData.tarikhTamatKontrak} onChange={() => {}} className={`${inputClass} bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed`} readOnly /> </div>
                  <div className="group"> <label className={labelClass}>No. BPP</label> <input type="text" name="noBpp" value={formData.noBpp || ''} onChange={handleInputChange} disabled={isPTSectionReadOnly} className={inputClass} /> </div>
                  <div className="group"> <label className={labelClass}>Tarikh Serah Tapak</label> <StrictDateInput name="tarikhSerahTapak" value={formData.tarikhSerahTapak} onChange={handleInputChange} disabled={isPTSectionReadOnly} className={inputClass} /> </div>
                  <div className="group"> <label className={labelClass}>ISO (BPP ke Serah Tapak)</label> <input type="text" name="iso" value={formData.iso} className={`${inputClass} bg-slate-50 dark:bg-slate-800/50 font-mono`} readOnly placeholder="Auto calc..." /> <p className="text-[10px] text-slate-400 mt-1 italic">Hari bekerja sahaja</p> </div>
                  <div className="group"> <div className="flex justify-between items-center mb-1"> <label className={labelClass}>Tarikh Mula Kerja</label> {!isPTSectionReadOnly && <button type="button" onClick={() => setFormData(prev => ({ ...prev, isManualMulaKerja: !formData.isManualMulaKerja }))} className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-emerald-500" title={formData.isManualMulaKerja ? "Reset to Auto" : "Manual Edit"} > {formData.isManualMulaKerja ? <Unlock className="w-3 h-3"/> : <Lock className="w-3 h-3"/>} {formData.isManualMulaKerja ? "Manual" : "Auto"} </button>} </div> <StrictDateInput name="tarikhMulaKerja" value={formData.tarikhMulaKerja} onChange={handleInputChange} disabled={isPTSectionReadOnly || !formData.isManualMulaKerja} className={`${inputClass} ${(!formData.isManualMulaKerja || isPTSectionReadOnly) ? 'bg-slate-50 dark:bg-slate-800/50' : 'ring-2 ring-emerald-500/20'}`} readOnly={!formData.isManualMulaKerja} /> {!formData.isManualMulaKerja && <p className="text-[10px] text-slate-400 mt-1 italic flex items-center gap-1"><RefreshCw className="w-3 h-3"/> +2 hari dari Serah Tapak (Business Days)</p>} </div>
                  <div className="group"> <label className={labelClass}>No. Inden</label> <input type="text" name="noInden" value={formData.noInden || ''} onChange={handleInputChange} disabled={isPTSectionReadOnly} className={inputClass} placeholder="cth: A00321423" /> </div>
                  <div className="group"> <label className={labelClass}>No. Sebutharga</label> <select name="noSebutharga" value={formData.noSebutharga || ''} onChange={handleInputChange} disabled={isPTSectionReadOnly} className={inputClass}> <option value="">Pilih No. Sebutharga...</option> {sebuthargaNumbers.map(sh => <option key={sh} value={sh}>{sh}</option>)} </select> </div>
                </div>
            </div>
            <div className="rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl bg-white/50 dark:bg-[#0f172a]/40 overflow-hidden">
                <div className="bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-md p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-10"> <div className="flex items-center gap-4"> <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20"> <FileSignature className="w-6 h-6" /> </div> <div> <h3 className="font-bold text-slate-900 dark:text-white text-xl tracking-tight">Dokumen Aku Janji</h3> <p className="text-xs text-slate-500 font-medium">Jana dan cetak dokumen rasmi</p> </div> </div> </div>
                <div className="p-6 bg-slate-50/50 dark:bg-[#0f172a]/30"> <AkuJanjiEditor project={formData as Project} selectedYear={selectedYear} pjaUser={users.find(u => u.id === formData.pjaId)} onUpdate={handleAkuJanjiUpdate} isPrintView={false} readOnly={isGlobalReadOnly} /> </div>
            </div>
          </div>
        )}
        {activeTab === 'phase3' && (
          <div className="space-y-6">
            <div className={yellowPhaseClass}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>
                <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-8 gap-4">
                    <h3 className="text-lg font-bold text-yellow-600 dark:text-yellow-500 flex items-center gap-3"> <Info className="h-5 w-5"/> BQ Pelarasan Building </h3>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => setIsCPCOpen(true)} className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all" > <Award className="w-4 h-4" /> CPC (Siap Kerja) </button>
                        <button onClick={() => setIsLADOpen(true)} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all" > <FileWarning className="w-4 h-4" /> Perakuan LAD </button>
                        <button onClick={() => setIsPrestasiOpen(true)} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all" > <Star className="w-4 h-4" /> Borang Penilaian Prestasi </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
                  <div className="group"> <label className={labelClass}>Tarikh Pemeriksaan</label> <StrictDateInput name="tarikhPemeriksaan" value={formData.tarikhPemeriksaan} onChange={handleInputChange} disabled={isGlobalReadOnly} className={inputClass} /> </div>
                  <div className="group"> <label className={labelClass}>Tarikh Siap (Sebenar)</label> <StrictDateInput name="tarikhSiapSebenar" value={formData.tarikhSiapSebenar} onChange={handleInputChange} disabled={isGlobalReadOnly} className={inputClass} /> </div>
                  <div className="group"> <label className={labelClass}>Prestasi (%) - Auto</label> <div className="relative"> <input type="text" name="prestasi" value={formData.prestasi || ''} readOnly className={`${inputClass} bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed`} placeholder="0%" /> </div> </div>
                  <div className="group"> <label className={labelClass}>Tarikh Tuntutan Bayaran</label> <StrictDateInput name="tarikhTuntutanBayaran" value={formData.tarikhTuntutanBayaran || ''} onChange={handleInputChange} disabled={isGlobalReadOnly} className={inputClass} /> </div>
                  <div className="group"> <label className={labelClass}>Hari LAD (Auto)</label> <input type="number" name="ladDays" value={formData.ladDays || 0} onChange={() => {}} className={`${inputClass} bg-slate-100 dark:bg-slate-800 text-red-500 font-bold`} readOnly /> </div>
                  <div className="group"> <label className={labelClass}>Jumlah LAD (RM) (Auto)</label> <input type="text" name="ladAmount" value={formatCurrency(formData.ladAmount || 0)} onChange={() => {}} className={`${inputClass} bg-slate-100 dark:bg-slate-800 text-red-500 font-bold`} readOnly /> </div>
                  <div className="group"> <label className={labelClass}>Wang Tahanan (RM)</label> <input type="number" name="wangTahanan" value={formData.wangTahanan} onChange={handleInputChange} disabled={isGlobalReadOnly} className={inputClass} placeholder="0.00" /> </div>
                  <div className="group"> <label className={labelClass}>Harga Kontrak (Asal)</label> <div className={`${inputClass} bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold flex items-center`}> {formatCurrency(formData.kosProjek || 0)} </div> </div>
                  <div className="group"> <label className={labelClass}>Harga Akhir (Bersih)</label> <div className={`${inputClass} bg-slate-100 dark:bg-slate-800 font-bold flex items-center ${ (formData.kosSebenar || 0) < (formData.kosProjek || 0) ? 'text-red-600' : (formData.kosSebenar || 0) > (formData.kosProjek || 0) ? 'text-blue-600' : 'text-slate-600' }`}> {formatCurrency(formData.kosSebenar)} </div> </div>
                </div>
            </div>
            <div className="rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl bg-white/50 dark:bg-[#0f172a]/40 flex flex-col h-auto overflow-visible w-full">
                <div className="bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-md p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-10"> <div className="flex items-center gap-4"> <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20"> <Edit className="w-6 h-6" /> </div> <div> <h3 className="font-bold text-slate-900 dark:text-white text-xl tracking-tight">Pelarasan BQ</h3> <p className="text-xs text-slate-500 font-medium">Bandingkan dengan kontrak asal & buat pelarasan</p> </div> </div> </div>
                <div className="bg-slate-50/50 dark:bg-[#0f172a]/30"> <BQPelarasanEditor originalData={formData.bqData || []} pelarasanData={formData.bqDataPelarasan || []} onDataChange={handleBQPelarasanChange} projectData={formData as Project} isPrintView={false} locationRows={locationRows} globalCalculationsPelarasan={formData.globalCalculationsPelarasan || {}} onGlobalCalculationsPelarasanChange={handleGlobalCalculationsPelarasanChange} readOnly={isGlobalReadOnly} /> </div>
            </div>
          </div>
        )}
        {activeTab === 'phase4' && (
          <div className="space-y-6">
            <div className={orangePhaseClass}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent"></div>
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4"> <h3 className="text-lg font-bold text-orange-600 dark:text-orange-400 flex items-center gap-3"> <CheckCircle className="h-5 w-5"/> Closing File / Project  </h3> </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-8">
                  <div className="group"> <label className={labelClass}>Tarikh Hantar Kewangan</label> <StrictDateInput name="tarikhHantarKewangan" value={formData.tarikhHantarKewangan} onChange={handleInputChange} disabled={isPTSectionReadOnly} className={inputClass} /> </div>
                  <div className="group"> <label className={labelClass}>Tarikh Padanan</label> <StrictDateInput name="tarikhPadanan" value={formData.tarikhPadanan} onChange={handleInputChange} disabled={isPTSectionReadOnly} className={inputClass} /> </div>
                </div>
            </div>
          </div>
        )}
      </div>
      {confirmationState.isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={cancelConfirmation}>
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 transform scale-100 transition-all animate-slide-up relative" onClick={e => e.stopPropagation()} >
                <button onClick={cancelConfirmation} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"> <X className="w-5 h-5" /> </button>
                <div className="flex flex-col items-center text-center pt-2">
                   {confirmationState.type === 'back' ? ( <div className="w-20 h-20 bg-yellow-50 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-6 text-yellow-500 animate-pulse-slow"> <div className="w-14 h-14 bg-yellow-100 dark:bg-yellow-900/40 rounded-full flex items-center justify-center"> <HelpCircle className="w-8 h-8 stroke-[1.5]" /> </div> </div> ) : ( <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-6 text-emerald-500 animate-pulse-slow"> <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center"> <CheckCircle className="w-8 h-8 stroke-[1.5]" /> </div> </div> )}
                   <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 font-jakarta"> {confirmationState.type === 'back' ? 'Kembali ke Senarai?' : 'Simpan Projek?'} </h3>
                   <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm leading-relaxed px-4"> {confirmationState.type === 'back' ? 'Sebuang perubahan yang belum disimpan mungkin akan hilang. Adakah anda pasti mahu kembali?' : 'Adakah anda pasti mahu menyimpan maklumat projek ini? Pastikan semua maklumat adalah tepat.'} </p>
                   <div className="flex gap-3 w-full"> <button onClick={cancelConfirmation} className="flex-1 py-3.5 px-4 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-600 transition-all border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md" > Batal </button> <button onClick={confirmAction} className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg ${ confirmationState.type === 'back' ? 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-500/30' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30' }`} > {confirmationState.type === 'back' ? 'Ya, Kembali' : 'Ya, Simpan'} </button> </div>
                </div>
            </div>
        </div>,
        document.body
      )}
      {isLADOpen && ( <LADCertificate project={formData as Project} pjaUser={users.find(u => u.id === formData.pjaId)} onClose={() => setIsLADOpen(false)} /> )}
      {isCPCOpen && ( <CPCCertificate project={formData as Project} pjaUser={users.find(u => u.id === formData.pjaId)} onClose={() => setIsCPCOpen(false)} /> )}
      {isPrestasiOpen && ( <PrestasiCertificate project={formData as Project} onClose={() => setIsPrestasiOpen(false)} onUpdate={handlePrestasiUpdate} /> )}
      {isNotisOpen && ( <NotisGenerator project={formData as Project} pjaUser={users.find(u => u.id === formData.pjaId)} onClose={() => setIsNotisOpen(false)} /> )}
    </div>
  );
};

export default ProjectDetail;
