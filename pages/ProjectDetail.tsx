import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Project, ProjectStatus, BQGroup, formatCurrency, BP_OPTIONS, ZON_OPTIONS, GlobalDimensions, User, Role, getCurrentDate, formatDate } from '../types';
import { ArrowLeft, Save, Zap, Folder, CheckCircle, Edit, Printer, Info, Calculator, Calendar, Lock, Unlock, RefreshCw, AlertCircle, FileSignature, X, Plus, HelpCircle } from 'lucide-react';
import BQEditor from './BQEditor';
import BQPelarasanEditor from './BQPelarasanEditor';
import AkuJanjiEditor from './AkuJanjiEditor';
import { mockService } from '../services/mockService';

interface ProjectDetailProps {
  project?: Project;
  onClose: () => void;
  onSave: () => void;
  currentUserRole: string;
  selectedYear: number;
}

// --- HELPER FUNCTIONS FOR DATES ---
const addDaysSkippingWeekends = (dateStr: string, daysToAdd: number): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return ''; // Invalid date check

  let count = 0;
  
  // Simple add days
  date.setDate(date.getDate() + daysToAdd);
  
  // Adjust if landing on weekend
  if (date.getDay() === 6) { // Saturday
    date.setDate(date.getDate() + 2); // Move to Monday
  } else if (date.getDay() === 0) { // Sunday
    date.setDate(date.getDate() + 1); // Move to Monday
  }
  
  return date.toISOString().split('T')[0];
};

const calculateEndDate = (startDateStr: string, duration: number, unit: 'Minggu' | 'Bulan' | 'Tahun'): string => {
  if (!startDateStr || !duration) return '';
  const date = new Date(startDateStr);
  if (isNaN(date.getTime())) return '';

  if (unit === 'Minggu') {
    date.setDate(date.getDate() + (duration * 7));
  } else if (unit === 'Bulan') {
    date.setMonth(date.getMonth() + duration);
  } else if (unit === 'Tahun') {
    date.setFullYear(date.getFullYear() + duration);
  }
  
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
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sun (0) or Sat (6)
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

// --- CUSTOM DATE INPUT COMPONENT ---
// Hybrid Input: Allows typing DD/MM/YYYY OR picking via Calendar Icon
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
  
  // Sync text value with prop value (YYYY-MM-DD -> DD/MM/YYYY)
  // Only sync if the incoming value is different from what we represent, 
  // to avoid overwriting user while typing if parent re-renders for other reasons.
  useEffect(() => {
    if (value) {
      const formatted = formatDate(value);
      setTextValue(formatted);
      setError(false);
    } else {
       // If value is cleared externally, clear text
       // But we don't want to clear if the user is currently typing garbage that isn't saved yet
       // Simple approach: if value is empty, and we aren't in an error state (meaning we just loaded), clear it.
       if (!error) setTextValue('');
    }
  }, [value]);

  const validateAndParse = (input: string): string | null => {
      // Allow separators: / . -
      // Clean up multiple separators or spaces
      const parts = input.trim().split(/[\/\-\.]/);
      
      if (parts.length !== 3) return null;

      let d = parseInt(parts[0], 10);
      let m = parseInt(parts[1], 10);
      let y = parseInt(parts[2], 10);

      if (isNaN(d) || isNaN(m) || isNaN(y)) return null;

      // Year expansion (e.g. 25 -> 2025)
      if (y < 100) {
          y += 2000;
      }

      // Basic Range Checks
      if (m < 1 || m > 12) return null;
      if (d < 1 || d > 31) return null;
      
      // Strict Date Validity (e.g. Feb 30)
      const dateObj = new Date(y, m - 1, d);
      if (dateObj.getFullYear() !== y || dateObj.getMonth() !== m - 1 || dateObj.getDate() !== d) {
          return null;
      }

      // Return ISO YYYY-MM-DD
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTextValue(val);
    // Remove error while typing to be less annoying
    if (error) setError(false);
  };

  const commitDate = () => {
    if (textValue.trim() === '') {
        setError(false);
        onChange({ target: { name, value: '' } });
        return;
    }

    const isoDate = validateAndParse(textValue);
    
    if (isoDate) {
        setError(false);
        // Update parent
        onChange({ target: { name, value: isoDate } });
        // Update local text to be perfectly formatted (e.g. 1/1/25 -> 01/01/2025)
        setTextValue(formatDate(isoDate));
    } else {
        // Invalid date format
        setError(true);
        // We send empty to parent so calculations don't run on garbage data
        onChange({ target: { name, value: '' } });
    }
  };

  const handleBlur = () => {
      commitDate();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          e.currentTarget.blur(); // Triggers handleBlur
      }
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Native picker returns YYYY-MM-DD
    setError(false);
    onChange(e); // Picker updates trigger immediate change
  };

  return (
    <div className="relative">
        <div className={`relative flex items-center ${className} ${error ? 'border-red-400 focus:border-red-500 ring-1 ring-red-100 dark:ring-red-900/20' : ''}`}>
        {/* Visible Text Input for Manual Typing */}
        <input
            type="text"
            value={textValue}
            onChange={handleTextChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || 'DD/MM/YYYY'}
            readOnly={readOnly}
            disabled={disabled}
            className={`w-full h-full bg-transparent border-none outline-none p-0 text-inherit placeholder-slate-400 ${readOnly ? 'cursor-not-allowed' : ''}`}
        />

        {/* Calendar Picker Trigger */}
        <div className="relative ml-2 w-5 h-5 shrink-0">
            <Calendar className={`w-5 h-5 pointer-events-none ${error ? 'text-red-400' : 'text-slate-400'}`} />
            {!readOnly && !disabled && (
            <input
                type="date"
                name={name}
                value={value || ''}
                onChange={handlePickerChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                tabIndex={-1}
            />
            )}
        </div>
        </div>
        {error && (
            <div className="absolute -bottom-5 left-0 text-[10px] text-red-500 font-bold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Tarikh tidak sah
            </div>
        )}
    </div>
  );
};

// --- FIXED COST HUD COMPONENT (PORTAL) ---
interface CostHUDProps {
  grandTotal: number;
  finalTotal?: number; // Added for Pelarasan Total
  status: ProjectStatus;
  progress: number;
  onStatusChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onProgressChange: (val: number) => void;
  saveAction?: React.ReactNode;
  isPrintView: boolean;
  onToggleView: (view: 'editor' | 'print') => void;
  isPelarasanActive?: boolean;
}

const CostHUD = ({ grandTotal, finalTotal, status, progress, onStatusChange, onProgressChange, saveAction, isPrintView, onToggleView, isPelarasanActive }: CostHUDProps) => {
  const [localProgress, setLocalProgress] = useState(progress ? progress.toString() : '');

  useEffect(() => {
    setLocalProgress(progress !== undefined ? progress.toString() : '');
  }, [progress]);

  const handleBlur = () => {
    let val = parseFloat(localProgress.replace(/[^0-9.]/g, ''));
    if (isNaN(val)) val = 0;
    if (val > 100) val = 100;
    
    onProgressChange(val);
    setLocalProgress(val.toString());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        handleBlur();
        (e.currentTarget as HTMLInputElement).blur();
    }
  };

  return createPortal(
    <div className="fixed top-0 left-0 md:left-20 right-0 z-[90] transition-all duration-300 animate-slide-down no-print">
       <div className="bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-lg px-4 py-3 flex items-center justify-between gap-4">
          
          {/* View Toggles */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
             <button 
                onClick={() => onToggleView('editor')}
                className={`p-2 rounded-lg transition-all ${!isPrintView ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                title="Editor Mode"
             >
                <Edit className="w-4 h-4" />
             </button>
             <button 
                onClick={() => onToggleView('print')}
                className={`p-2 rounded-lg transition-all ${isPrintView ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                title="Preview & Print Mode"
             >
                <Printer className="w-4 h-4" />
             </button>
          </div>

          {/* Center Section: Status */}
          <div className="flex-1 flex justify-center max-w-2xl px-4 border-l border-r border-slate-100 dark:border-slate-800/50 mx-2">
             {isPrintView ? (
                <div className="text-center">
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Preview Mode</span>
                </div>
             ) : (
                <div className="w-full max-w-md flex flex-col gap-2">
                     <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <div className="relative group">
                                <select 
                                    name="status" 
                                    value={status} 
                                    onChange={onStatusChange} 
                                    className="appearance-none bg-slate-100 dark:bg-slate-800 border-none rounded-lg py-1.5 pl-3 pr-8 text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <option value={ProjectStatus.MENUNGGU_LANTIKAN}>Menunggu Lantikan</option>
                                    <option value={ProjectStatus.DALAM_PROSES}>Dalam Proses</option>
                                    <option value={ProjectStatus.TUNTUTAN_BAYARAN}>Tuntutan Bayaran</option>
                                    <option value={ProjectStatus.SIAP}>Siap</option>
                                </select>
                            </div>
                            {saveAction}
                         </div>

                         <div className="flex items-center gap-1 group cursor-text" onClick={() => document.getElementById('progress-input')?.focus()}>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Siap</span>
                            <input 
                                id="progress-input"
                                type="text" 
                                value={localProgress}
                                onChange={(e) => setLocalProgress(e.target.value)}
                                onBlur={handleBlur}
                                onKeyDown={handleKeyDown}
                                className="w-10 text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 p-0 text-sm font-bold text-emerald-600 dark:text-emerald-400 focus:ring-0 outline-none transition-colors"
                            />
                            <span className="text-xs font-bold text-slate-400">%</span>
                         </div>
                     </div>
                     <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-500 ease-out"
                            style={{ width: `${Math.min(100, Math.max(0, Number(progress) || 0))}%` }}
                        ></div>
                     </div>
                </div>
             )}
          </div>

          {/* Costs */}
          <div className="flex items-center gap-4 md:gap-8 shrink-0">
              <div className="text-right">
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-0.5">
                    {isPelarasanActive ? 'Kos Asal' : 'Kos Projek'}
                  </p>
                  <p className={`text-lg font-bold font-mono leading-none ${isPelarasanActive ? 'text-slate-400 line-through text-sm' : 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400'}`}>
                      {formatCurrency(grandTotal)}
                  </p>
                  {isPelarasanActive && finalTotal !== undefined && (
                     <p className="text-xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 leading-none mt-1">
                        {formatCurrency(finalTotal)}
                     </p>
                  )}
              </div>
          </div>
       </div>
    </div>,
    document.body
  );
};

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onClose, onSave, currentUserRole, selectedYear }) => {
  
  // Revised TABS to be consistent
  const TABS = [
    { 
      id: 'phase1', 
      label: '1. BQ Building (PJA)', 
      color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800 shadow-sm', 
      ringColor: 'ring-yellow-400' 
    },
    { 
      id: 'phase2', 
      label: '2. File Creation (PT)', 
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 shadow-sm', 
      ringColor: 'ring-blue-500' 
    },
    { 
      id: 'phase3', 
      label: '3. Pelarasan (PJA)', 
      color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800 shadow-sm', 
      ringColor: 'ring-yellow-400' 
    },
    { 
      id: 'phase4', 
      label: '4. Penutup (PT)', 
      color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800 shadow-sm', 
      ringColor: 'ring-orange-500' 
    },
  ];

  const [activeTab, setActiveTab] = useState('phase1');
  const [isSaving, setIsSaving] = useState(false);
  const [isPrintView, setIsPrintView] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [previewCost, setPreviewCost] = useState(0); 
  const [users, setUsers] = useState<User[]>([]);
  
  // Lists for Dropdowns
  const [companies, setCompanies] = useState<string[]>([]);
  const [voteNumbers, setVoteNumbers] = useState<string[]>([]);

  // Local state for complex inputs
  const [tempohVal, setTempohVal] = useState<number>(0);
  const [tempohUnit, setTempohUnit] = useState<'Minggu'|'Bulan'|'Tahun'>('Minggu');
  
  // Manual Date Overrides
  const [manualMulaKontrak, setManualMulaKontrak] = useState(false);
  const [manualMulaKerja, setManualMulaKerja] = useState(false);

  // Dynamic Location/Aduan State
  const [locationRows, setLocationRows] = useState<{ id: string; lokasi: string; aduan: string }[]>([]);

  // Confirmation Modal State
  const [confirmationState, setConfirmationState] = useState<{
    isOpen: boolean;
    type: 'back' | 'save' | null;
  }>({ isOpen: false, type: null });

  useEffect(() => {
    setUsers(mockService.getUsers());
    setCompanies(mockService.getCompanies());
    setVoteNumbers(mockService.getVoteNumbers());
  }, []);
  
  const [formData, setFormData] = useState<Partial<Project>>(project || {
    namaProjek: '', noFail: '', noAduan: '', tarikhBuka: getCurrentDate(), 
    pjaId: 0, bp: '', zon: '', lokasi: '', 
    status: ProjectStatus.MENUNGGU_LANTIKAN, 
    bqData: [], 
    bqDataPelarasan: [],
    globalDimensions: { length: 0, width: 0, depth: 0 }
  });

  // Initialize Location/Aduan Rows
  useEffect(() => {
    if (project) {
        // Parse existing strings (assumed newline separated)
        const locs = (project.lokasi || '').split('\n').filter(l => l.trim() !== '');
        const aduans = (project.noAduan || '').split('\n');
        
        let rows = locs.map((l, i) => ({
            id: Math.random().toString(36).substr(2, 9),
            lokasi: l,
            aduan: aduans[i] || ''
        }));
        
        if (rows.length === 0) {
            rows = [{ id: Math.random().toString(36).substr(2, 9), lokasi: '', aduan: '' }];
        }
        setLocationRows(rows);
    } else if (locationRows.length === 0) {
        // New project default
        setLocationRows([{ id: Math.random().toString(36).substr(2, 9), lokasi: '', aduan: '' }]);
    }
  }, [project]);

  // Sync Location Rows back to FormData Strings
  useEffect(() => {
     // Join with newlines for storage
     const lokasiStr = locationRows.map(r => r.lokasi).join('\n');
     const aduanStr = locationRows.map(r => r.aduan).join('\n');
     
     if (formData.lokasi !== lokasiStr || formData.noAduan !== aduanStr) {
         setFormData(prev => ({ ...prev, lokasi: lokasiStr, noAduan: aduanStr }));
     }
  }, [locationRows]);

  const addLocationRow = () => {
      setLocationRows([...locationRows, { id: Math.random().toString(36).substr(2, 9), lokasi: '', aduan: '' }]);
  };

  const removeLocationRow = (id: string) => {
      if (locationRows.length > 1) {
          setLocationRows(locationRows.filter(r => r.id !== id));
      } else {
          // If only 1, just clear it
          setLocationRows([{ ...locationRows[0], lokasi: '', aduan: '' }]);
      }
  };

  const updateLocationRow = (id: string, field: 'lokasi' | 'aduan', value: string) => {
      setLocationRows(locationRows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };


  // Initialize Split Tempoh State from saved string (e.g., "5 Minggu")
  useEffect(() => {
    if (project?.tempohKontrak) {
      const parts = project.tempohKontrak.split(' ');
      if (parts.length === 2) {
        setTempohVal(Number(parts[0]));
        setTempohUnit(parts[1] as any);
      }
    }
  }, [project]);

  // Update formData tempoh string when val/unit changes
  useEffect(() => {
    const newVal = tempohVal > 0 ? `${tempohVal} ${tempohUnit}` : '';
    if (formData.tempohKontrak !== newVal) {
        setFormData(prev => ({ ...prev, tempohKontrak: newVal }));
    }
  }, [tempohVal, tempohUnit]);

  // Handle Phase 3 Activation - Initialize Pelarasan Data if missing
  useEffect(() => {
    if (activeTab === 'phase3' && (!formData.bqDataPelarasan || formData.bqDataPelarasan.length === 0) && formData.bqData && formData.bqData.length > 0) {
       // Deep copy the original BQ to Pelarasan BQ
       const clonedData = JSON.parse(JSON.stringify(formData.bqData));
       setFormData(prev => ({ ...prev, bqDataPelarasan: clonedData }));
    }
  }, [activeTab, formData.bqData]);

  // --- AUTO CALCULATION LOGIC ---

  // 1. Calculate Tarikh Mula Kontrak
  useEffect(() => {
    if (!manualMulaKontrak && formData.tarikhCetakanBpp) {
       const newDate = addDaysSkippingWeekends(formData.tarikhCetakanBpp, 2);
       if (newDate && newDate !== formData.tarikhMulaKontrak) {
         setFormData(prev => ({ ...prev, tarikhMulaKontrak: newDate }));
       }
    }
  }, [formData.tarikhCetakanBpp, manualMulaKontrak]);

  // 2. Calculate Tarikh Tamat Kontrak
  useEffect(() => {
    if (formData.tarikhMulaKontrak && tempohVal > 0) {
       const newDate = calculateEndDate(formData.tarikhMulaKontrak, tempohVal, tempohUnit);
       if (newDate && newDate !== formData.tarikhTamatKontrak) {
         setFormData(prev => ({ ...prev, tarikhTamatKontrak: newDate }));
       }
    }
  }, [formData.tarikhMulaKontrak, tempohVal, tempohUnit]);

  // 3. Calculate Tarikh Mula Kerja
  useEffect(() => {
     if (!manualMulaKerja && formData.tarikhSerahTapak) {
        const newDate = addDaysSkippingWeekends(formData.tarikhSerahTapak, 2);
        if (newDate && newDate !== formData.tarikhMulaKerja) {
            setFormData(prev => ({ ...prev, tarikhMulaKerja: newDate }));
        }
     }
  }, [formData.tarikhSerahTapak, manualMulaKerja]);

  // 4. Calculate ISO (Business Days between BPP and Serah Tapak)
  useEffect(() => {
     if (formData.tarikhCetakanBpp && formData.tarikhSerahTapak) {
         const days = calculateBusinessDays(formData.tarikhCetakanBpp, formData.tarikhSerahTapak);
         const isoString = `${days} Hari`;
         if (formData.iso !== isoString) {
             setFormData(prev => ({ ...prev, iso: isoString }));
         }
     }
  }, [formData.tarikhCetakanBpp, formData.tarikhSerahTapak]);

  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBQChange = (bqData: BQGroup[], globalDims: GlobalDimensions) => {
    const totalCost = bqData.reduce((acc, group) => {
      return acc + group.items.reduce((gTotal, item) => gTotal + (item.amount || 0), 0);
    }, 0);
    
    setFormData(prev => ({ 
      ...prev, 
      bqData, 
      globalDimensions: globalDims, 
      kosProjek: totalCost 
    }));
  };

  const handleBQPelarasanChange = (bqDataPelarasan: BQGroup[], globalDims: GlobalDimensions) => {
    // Calculate new total
    const totalCostPelarasan = bqDataPelarasan.reduce((acc, group) => {
      return acc + group.items.reduce((gTotal, item) => gTotal + (item.amount || 0), 0);
    }, 0);

    setFormData(prev => ({ 
      ...prev, 
      bqDataPelarasan, 
      kosSebenar: totalCostPelarasan 
    }));
  };

  const handleAkuJanjiUpdate = (updates: Partial<Project>) => {
      setFormData(prev => ({ ...prev, ...updates }));
  };

  // Separated Save Logic
  const executeSave = async () => {
    setIsSaving(true);
    try {
      const safeData = { ...formData };
      if (project) await mockService.updateProject(project.id, safeData);
      else await mockService.createProject(safeData as Project);
      setIsSaving(false);
      onSave();
    } catch (err) { setIsSaving(false); alert('Error saving project'); }
  };

  // Old handler just calls confirm now
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    handleSaveClick();
  };

  // --- CONFIRMATION HANDLERS ---
  const handleBackClick = () => setConfirmationState({ isOpen: true, type: 'back' });
  const handleSaveClick = () => setConfirmationState({ isOpen: true, type: 'save' });
  const cancelConfirmation = () => setConfirmationState({ isOpen: false, type: null });
  
  const confirmAction = () => {
    if (confirmationState.type === 'back') {
      onClose();
    } else if (confirmationState.type === 'save') {
      executeSave();
    }
    setConfirmationState({ isOpen: false, type: null });
  };

  const grandTotal = formData.bqData?.reduce((acc, group) => {
      return acc + group.items.reduce((itemSum, item) => itemSum + (item.amount || 0), 0);
  }, 0) || 0;

  const pelarasanTotal = formData.bqDataPelarasan?.reduce((acc, group) => {
    return acc + group.items.reduce((itemSum, item) => itemSum + (item.amount || 0), 0);
  }, 0) || 0;

  // Final Total for Display (Pelarasan Total - LAD)
  const finalTotalDisplay = activeTab === 'phase3' 
    ? pelarasanTotal - (Number(formData.ladAmount || 0)) 
    : undefined;

  const actionButtons = (
    <div className="flex items-center gap-2">
       <button 
          onClick={handleBackClick} 
          className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 p-2 rounded-lg font-bold text-xs shadow-sm transition-all flex items-center justify-center"
          title="Kembali ke Senarai"
      >
          <ArrowLeft className="w-4 h-4" /> 
          <span className="hidden sm:inline ml-1">Kembali</span>
      </button>
      <button 
          onClick={handleSaveClick} 
          disabled={isSaving} 
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white p-2 rounded-lg font-bold text-xs shadow-md shadow-emerald-500/30 transition-all flex items-center justify-center"
          title="Simpan Projek"
      >
          <Save className="w-4 h-4" /> 
          <span className="hidden sm:inline ml-1">{isSaving ? '...' : 'Simpan'}</span>
      </button>
    </div>
  );

  const inputClass = "w-full px-4 py-3 rounded-lg bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-slate-200 placeholder-slate-400 text-sm shadow-sm dark:shadow-inner";
  const labelClass = "block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 font-jakarta";
  const disabledClass = "bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed";

  const yellowPhaseClass = "bg-white/80 dark:bg-[#0f172a]/80 border border-yellow-500/30 p-8 rounded-3xl animate-fade-in-up shadow-xl dark:shadow-2xl relative overflow-hidden backdrop-blur-sm";
  const bluePhaseClass = "bg-white/80 dark:bg-[#0f172a]/80 border border-blue-500/30 p-8 rounded-3xl animate-fade-in-up shadow-xl dark:shadow-2xl relative overflow-hidden backdrop-blur-sm";
  const orangePhaseClass = "bg-white/80 dark:bg-[#0f172a]/80 border border-orange-500/30 p-8 rounded-3xl animate-fade-in-up shadow-xl dark:shadow-2xl relative overflow-hidden backdrop-blur-sm";

  return (
    <div className={`relative min-h-screen text-slate-900 dark:text-slate-200 ${isPrintView ? 'pb-12' : 'pb-40'}`}>
      
      <CostHUD 
          grandTotal={grandTotal}
          finalTotal={finalTotalDisplay}
          isPelarasanActive={activeTab === 'phase3'}
          status={formData.status || ProjectStatus.MENUNGGU_LANTIKAN}
          progress={formData.peratusSiap || 0}
          onStatusChange={handleInputChange}
          onProgressChange={(val) => setFormData(prev => ({ ...prev, peratusSiap: val }))}
          saveAction={actionButtons}
          isPrintView={isPrintView}
          onToggleView={(view) => setIsPrintView(view === 'print')}
      />

      <div className={`${isPrintView ? 'pt-20' : 'pt-24'}`}>
        
        {!isPrintView && (
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 px-2 no-print gap-4">
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1.5 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></div>
                  <div>
                      <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{project ? 'Kemaskini Projek' : 'Daftar Projek Baru'}</h1>
                      <p className="text-xs text-slate-500 font-mono mt-0.5 uppercase tracking-wider">{formData.noFail || 'No. Fail Belum Ditetapkan'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isPrintView && (
          <div className="mb-8">
              <div className="grid grid-cols-4 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-2xl gap-2 border border-slate-200 dark:border-slate-800">
                  {TABS.map((tab) => (
                      <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-2 py-3 md:px-4 md:py-4 rounded-xl text-[10px] md:text-xs font-bold transition-all flex flex-col md:flex-row items-center justify-center gap-2 border border-transparent ${
                          activeTab === tab.id 
                          ? `${tab.color}` 
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                      >
                      {tab.label}
                      </button>
                  ))}
              </div>
          </div>
        )}

        {/* --- PHASE 1 --- */}
        {activeTab === 'phase1' && (
          <div className="space-y-6">
            <div className={`${yellowPhaseClass} ${isPrintView ? 'hidden' : ''}`}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>
                <h3 className="text-lg font-bold text-yellow-600 dark:text-yellow-500 mb-8 flex items-center gap-3">
                  <Zap className="h-5 w-5"/> Maklumat Asas (PJA)
                </h3>
                
                {/* VERTICAL STACK FOR CLEANER LAYOUT */}
                <div className="flex flex-col gap-8">
                  
                  {/* Section 1: Project Name (Full Width) */}
                  <div className="group w-full">
                    <label className={labelClass}>Cadangan Kerja (Nama Projek)</label>
                    <textarea name="namaProjek" value={formData.namaProjek} onChange={handleInputChange} className={`${inputClass} min-h-[80px] text-base resize-y`} placeholder="CADANGAN KERJA-KERJA..." />
                  </div>
                  
                  {/* Section 2: Dynamic Location Manager (Card Style) */}
                  <div className="group w-full bg-slate-50 dark:bg-black/20 p-5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-2">
                            <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Lokasi & No. Aduan</label>
                         </div>
                         <button 
                            type="button" 
                            onClick={addLocationRow}
                            className="text-[11px] flex items-center gap-1.5 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 font-bold transition-all shadow-sm"
                         >
                            <Plus className="w-3.5 h-3.5" /> Tambah Lokasi
                         </button>
                      </div>
                      
                      <div className="space-y-3">
                          {locationRows.map((row, idx) => (
                              <div key={row.id} className="flex flex-col md:flex-row gap-3 items-start animate-fade-in group/row">
                                  <div className="w-full md:flex-[2] relative">
                                      <span className="absolute left-3 top-3.5 text-xs font-bold text-slate-400 select-none">{idx + 1}.</span>
                                      <input 
                                          type="text" 
                                          value={row.lokasi} 
                                          onChange={(e) => updateLocationRow(row.id, 'lokasi', e.target.value)}
                                          className={`${inputClass} pl-8 ${!row.lokasi ? 'border-red-200 dark:border-red-900/30 focus:border-red-500' : ''}`}
                                          placeholder="Lokasi"
                                          required
                                      />
                                  </div>
                                  <div className="w-full md:flex-1 flex gap-2">
                                      <input 
                                          type="text" 
                                          value={row.aduan} 
                                          onChange={(e) => updateLocationRow(row.id, 'aduan', e.target.value)}
                                          className={`${inputClass} dark:bg-[#162032] dark:border-slate-600 dark:text-white`}
                                          placeholder="Aduan"
                                      />
                                      <button 
                                          type="button" 
                                          onClick={() => removeLocationRow(row.id)}
                                          className="p-3 rounded-lg text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-white/5 border border-transparent hover:border-red-100 dark:hover:border-red-900/30 transition-all shadow-sm opacity-100 md:opacity-0 md:group-hover/row:opacity-100"
                                          title="Padam Baris"
                                      >
                                          <X className="w-4 h-4" />
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Section 3: Metadata Grid (4 Columns) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
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
                        <StrictDateInput name="tarikhBuka" value={formData.tarikhBuka} onChange={handleInputChange} className={inputClass} />
                    </div>
                    <div className="group">
                        <label className={labelClass}>Disediakan Oleh</label>
                        <select name="pjaId" value={formData.pjaId || ''} onChange={(e) => setFormData(prev => ({ ...prev, pjaId: Number(e.target.value) }))} className={inputClass}>
                            <option value="">Pilih Pegawai...</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.role === Role.ADMIN ? 'PT' : 'PJA'} {u.username.toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>
                  </div>

                </div>
            </div>

            <div className={`rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl bg-white/50 dark:bg-[#0f172a]/40 ${isPrintView ? 'min-h-[60vh] bg-white text-black' : 'overflow-hidden'}`}>
                {!isPrintView && (
                  <div className="bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-md p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-10">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                          <Calculator className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-xl tracking-tight">Penyediaan BQ (Wizard)</h3>
                          <p className="text-xs text-slate-500 font-medium">Uruskan item dan ukuran global di sini</p>
                        </div>
                      </div>
                  </div>
                )}
                <div className="bg-slate-50/50 dark:bg-[#0f172a]/30">
                  <BQEditor 
                      initialData={formData.bqData} 
                      initialDims={formData.globalDimensions}
                      onDataChange={handleBQChange}
                      onGroupChange={setActiveGroupIndex}
                      projectData={formData as Project}
                      isPrintView={isPrintView}
                      onPreviewCostChange={setPreviewCost}
                  />
                </div>
            </div>
          </div>
        )}

        {/* --- PHASE 2: FILE CREATION (BLUE) --- */}
        {/* We hide the form in print view and only show Aku Janji Doc if print view is active in phase 2 */}
        {activeTab === 'phase2' && (
          <div className="space-y-6">
            {!isPrintView && (
            <div className={bluePhaseClass}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
                <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-8 flex items-center gap-3">
                  <Folder className="h-5 w-5"/> Maklumat Fail & Kontrak (PT)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-8">
                  <div className="group">
                      <label className={labelClass}>No. Fail</label>
                      <input type="text" name="noFail" value={formData.noFail} onChange={handleInputChange} className={inputClass} />
                  </div>

                  {/* Dropdown for Company */}
                  <div className="group lg:col-span-2">
                      <label className={labelClass}>Nama Syarikat (Dropdown)</label>
                      <select name="namaSyarikat" value={formData.namaSyarikat} onChange={handleInputChange} className={inputClass}>
                          <option value="">Pilih Syarikat...</option>
                          {companies.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
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

                  {/* Dropdown for No. Vot */}
                  <div className="group">
                      <label className={labelClass}>No. Vot (Dropdown)</label>
                      <select name="noVote" value={formData.noVote} onChange={handleInputChange} className={inputClass}>
                          <option value="">Pilih Vot...</option>
                          {voteNumbers.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                  </div>

                  <div className="group">
                      <label className={labelClass}>Tarikh Lantikan</label>
                      <StrictDateInput name="tarikhLantikan" value={formData.tarikhLantikan} onChange={handleInputChange} className={inputClass} />
                  </div>
                  <div className="group">
                      <label className={labelClass}>Tarikh BPP</label>
                      <StrictDateInput name="tarikhCetakanBpp" value={formData.tarikhCetakanBpp} onChange={handleInputChange} className={inputClass} />
                  </div>

                  {/* Tempoh Kontrak: Composite Input */}
                  <div className="group">
                      <label className={labelClass}>Tempoh Kontrak</label>
                      <div className="flex gap-2">
                          <input 
                              type="number" 
                              value={tempohVal || ''} 
                              onChange={(e) => setTempohVal(Number(e.target.value))} 
                              className={`${inputClass} flex-1`}
                              placeholder="0" 
                          />
                          <select 
                              value={tempohUnit} 
                              onChange={(e) => setTempohUnit(e.target.value as any)} 
                              className={`${inputClass} w-32`}
                          >
                              <option value="Minggu">Minggu</option>
                              <option value="Bulan">Bulan</option>
                              <option value="Tahun">Tahun</option>
                          </select>
                      </div>
                  </div>

                  {/* Tarikh Mula Kontrak - Auto Calculated with Manual Override */}
                  <div className="group">
                      <div className="flex justify-between items-center mb-1">
                          <label className={labelClass}>Tarikh Mula Kontrak</label>
                          <button 
                            type="button" 
                            onClick={() => setManualMulaKontrak(!manualMulaKontrak)}
                            className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-emerald-500"
                            title={manualMulaKontrak ? "Reset to Auto" : "Manual Edit"}
                          >
                             {manualMulaKontrak ? <Unlock className="w-3 h-3"/> : <Lock className="w-3 h-3"/>}
                             {manualMulaKontrak ? "Manual" : "Auto"}
                          </button>
                      </div>
                      <StrictDateInput 
                        name="tarikhMulaKontrak" 
                        value={formData.tarikhMulaKontrak} 
                        onChange={handleInputChange} 
                        className={`${inputClass} ${!manualMulaKontrak ? 'bg-slate-50 dark:bg-slate-800/50' : 'ring-2 ring-emerald-500/20'}`}
                        readOnly={!manualMulaKontrak}
                      />
                      {!manualMulaKontrak && <p className="text-[10px] text-slate-400 mt-1 italic flex items-center gap-1"><RefreshCw className="w-3 h-3"/> +2 hari dari BPP (Business Days)</p>}
                  </div>

                  {/* Tarikh Tamat Kontrak - Auto Calculated */}
                  <div className="group">
                      <label className={labelClass}>Tarikh Tamat Kontrak (Auto)</label>
                      <StrictDateInput 
                        name="tarikhTamatKontrak" 
                        value={formData.tarikhTamatKontrak} 
                        onChange={() => {}} 
                        className={`${inputClass} bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed`}
                        readOnly 
                      />
                  </div>

                  <div className="group">
                      <label className={labelClass}>Tarikh Serah Tapak</label>
                      <StrictDateInput name="tarikhSerahTapak" value={formData.tarikhSerahTapak} onChange={handleInputChange} className={inputClass} />
                  </div>

                  {/* ISO - Auto Calculated Business Days */}
                  <div className="group">
                      <label className={labelClass}>ISO (BPP ke Serah Tapak)</label>
                      <input 
                        type="text" 
                        name="iso" 
                        value={formData.iso} 
                        className={`${inputClass} bg-slate-50 dark:bg-slate-800/50 font-mono`}
                        readOnly
                        placeholder="Auto calc..."
                      />
                      <p className="text-[10px] text-slate-400 mt-1 italic">Hari bekerja sahaja</p>
                  </div>

                  {/* Tarikh Mula Kerja - Auto Calculated with Manual Override */}
                  <div className="group">
                      <div className="flex justify-between items-center mb-1">
                          <label className={labelClass}>Tarikh Mula Kerja</label>
                          <button 
                            type="button" 
                            onClick={() => setManualMulaKerja(!manualMulaKerja)}
                            className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-emerald-500"
                            title={manualMulaKerja ? "Reset to Auto" : "Manual Edit"}
                          >
                             {manualMulaKerja ? <Unlock className="w-3 h-3"/> : <Lock className="w-3 h-3"/>}
                             {manualMulaKerja ? "Manual" : "Auto"}
                          </button>
                      </div>
                      <StrictDateInput 
                        name="tarikhMulaKerja" 
                        value={formData.tarikhMulaKerja} 
                        onChange={handleInputChange} 
                        className={`${inputClass} ${!manualMulaKerja ? 'bg-slate-50 dark:bg-slate-800/50' : 'ring-2 ring-emerald-500/20'}`}
                        readOnly={!manualMulaKerja}
                      />
                      {!manualMulaKerja && <p className="text-[10px] text-slate-400 mt-1 italic flex items-center gap-1"><RefreshCw className="w-3 h-3"/> +2 hari dari Serah Tapak (Business Days)</p>}
                  </div>
                </div>
            </div>
            )}

            {/* --- AKU JANJI SECTION (NEW) --- */}
            <div className={`rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl bg-white/50 dark:bg-[#0f172a]/40 ${isPrintView ? 'min-h-[60vh] bg-white text-black' : 'overflow-hidden'}`}>
                {!isPrintView && (
                  <div className="bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-md p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-10">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                          <FileSignature className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-xl tracking-tight">Dokumen Aku Janji</h3>
                          <p className="text-xs text-slate-500 font-medium">Jana dan cetak dokumen rasmi</p>
                        </div>
                      </div>
                  </div>
                )}
                
                <div className="p-6 bg-slate-50/50 dark:bg-[#0f172a]/30">
                     <AkuJanjiEditor 
                        project={formData as Project} 
                        selectedYear={selectedYear}
                        pjaUser={users.find(u => u.id === formData.pjaId)}
                        onUpdate={handleAkuJanjiUpdate}
                        isPrintView={isPrintView}
                     />
                </div>
            </div>

          </div>
        )}

        {/* --- PHASE 3: BQ PELARASAN --- */}
        {activeTab === 'phase3' && (
          <div className="space-y-6">
            <div className={`${yellowPhaseClass} ${isPrintView ? 'hidden' : ''}`}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>
                <h3 className="text-lg font-bold text-yellow-600 dark:text-yellow-500 mb-8 flex items-center gap-3">
                  <Info className="h-5 w-5"/> BQ Pelarasan Building
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
                  <div className="group">
                      <label className={labelClass}>Tarikh Pemeriksaan</label>
                      <StrictDateInput name="tarikhPemeriksaan" value={formData.tarikhPemeriksaan} onChange={handleInputChange} className={inputClass} />
                  </div>
                  <div className="group">
                      <label className={labelClass}>Tarikh Siap (Sebenar)</label>
                      <StrictDateInput name="tarikhSiapSebenar" value={formData.tarikhSiapSebenar} onChange={handleInputChange} className={inputClass} />
                  </div>
                  <div className="group">
                      <label className={labelClass}>Prestasi (%)</label>
                      <div className="relative">
                        <input type="text" name="prestasi" value={formData.prestasi} onChange={handleInputChange} className={inputClass} placeholder="80%" />
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                            <span className="text-slate-400 text-xs font-bold">%</span>
                        </div>
                      </div>
                  </div>
                  <div className="group">
                      <label className={labelClass}>Tarikh Tuntutan Bayaran</label>
                      <StrictDateInput name="tarikhTuntutanBayaran" value={formData.tarikhTuntutanBayaran || ''} onChange={handleInputChange} className={inputClass} />
                  </div>
                  
                  {/* LAD FIELDS - SWAPPED ORDER AND UPDATED */}
                   <div className="group">
                      <label className={labelClass}>Hari LAD</label>
                      <input type="number" name="ladDays" value={formData.ladDays} onChange={handleInputChange} className={inputClass} placeholder="0" />
                  </div>
                  <div className="group">
                      <label className={labelClass}>Jumlah LAD (RM)</label>
                      <input type="number" name="ladAmount" value={formData.ladAmount} onChange={handleInputChange} className={inputClass} placeholder="0.00" />
                  </div>
                  
                  {/* REMOVED TARIKH CPC */}
                  
                  {/* Display Only Calculated Field */}
                  <div className="group">
                      <label className={labelClass}>Kos Sebenar (Auto Calc)</label>
                      <div className={`${inputClass} bg-slate-100 dark:bg-slate-800 text-slate-600 font-bold flex items-center`}>
                          {formatCurrency(formData.kosSebenar)}
                      </div>
                  </div>

                </div>
            </div>

            {/* PELARASAN EDITOR */}
            <div className={`rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl bg-white/50 dark:bg-[#0f172a]/40 ${isPrintView ? 'min-h-[60vh] bg-white text-black' : 'overflow-hidden'}`}>
                {!isPrintView && (
                  <div className="bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-md p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-10">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                          <Edit className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-xl tracking-tight">Pelarasan BQ</h3>
                          <p className="text-xs text-slate-500 font-medium">Bandingkan dengan kontrak asal & buat pelarasan</p>
                        </div>
                      </div>
                  </div>
                )}
                <div className="bg-slate-50/50 dark:bg-[#0f172a]/30">
                  <BQPelarasanEditor 
                      originalData={formData.bqData || []}
                      pelarasanData={formData.bqDataPelarasan || []}
                      globalDims={formData.globalDimensions || { length: 0, width: 0, depth: 0 }}
                      onDataChange={handleBQPelarasanChange}
                      projectData={formData as Project}
                      isPrintView={isPrintView}
                  />
                </div>
            </div>
          </div>
        )}

        {/* --- PHASE 4 --- */}
        {!isPrintView && activeTab === 'phase4' && (
          <div className="space-y-6">
            <div className={orangePhaseClass}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent"></div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                  <h3 className="text-lg font-bold text-orange-600 dark:text-orange-400 flex items-center gap-3">
                    <CheckCircle className="h-5 w-5"/> Closing File / Project
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-8">
                  <div className="group">
                      <label className={labelClass}>Tarikh Hantar Kewangan</label>
                      <StrictDateInput name="tarikhHantarKewangan" value={formData.tarikhHantarKewangan} onChange={handleInputChange} className={inputClass} />
                  </div>
                  <div className="group">
                      <label className={labelClass}>Tarikh Padanan</label>
                      <StrictDateInput name="tarikhPadanan" value={formData.tarikhPadanan} onChange={handleInputChange} className={inputClass} />
                  </div>
                </div>
            </div>
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL (PORTAL) */}
      {confirmationState.isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={cancelConfirmation}>
            <div 
              className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 transform scale-100 transition-all animate-slide-up relative" 
              onClick={e => e.stopPropagation()}
            >
                <button onClick={cancelConfirmation} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                   <X className="w-5 h-5" />
                </button>
                <div className="flex flex-col items-center text-center pt-2">
                   
                   {/* Icon based on action type */}
                   {confirmationState.type === 'back' ? (
                     <div className="w-20 h-20 bg-yellow-50 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-6 text-yellow-500 animate-pulse-slow">
                        <div className="w-14 h-14 bg-yellow-100 dark:bg-yellow-900/40 rounded-full flex items-center justify-center">
                          <HelpCircle className="w-8 h-8 stroke-[1.5]" />
                        </div>
                     </div>
                   ) : (
                     <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-6 text-emerald-500 animate-pulse-slow">
                        <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-8 h-8 stroke-[1.5]" />
                        </div>
                     </div>
                   )}

                   <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 font-jakarta">
                     {confirmationState.type === 'back' ? 'Kembali ke Senarai?' : 'Simpan Projek?'}
                   </h3>
                   
                   <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm leading-relaxed px-4">
                     {confirmationState.type === 'back' 
                        ? 'Sebarang perubahan yang belum disimpan mungkin akan hilang. Adakah anda pasti mahu kembali?' 
                        : 'Adakah anda pasti mahu menyimpan maklumat projek ini? Pastikan semua maklumat adalah tepat.'}
                   </p>
                   
                   <div className="flex gap-3 w-full">
                      <button 
                        onClick={cancelConfirmation}
                        className="flex-1 py-3.5 px-4 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-600 transition-all border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md"
                      >
                        Batal
                      </button>
                      <button 
                        onClick={confirmAction}
                        className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg ${
                            confirmationState.type === 'back' 
                            ? 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-500/30' 
                            : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                        }`}
                      >
                         {confirmationState.type === 'back' ? 'Ya, Kembali' : 'Ya, Simpan'}
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

export default ProjectDetail;
