import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Project, ProjectStatus, BQGroup, formatCurrency, BP_OPTIONS, ZON_OPTIONS, MUKIM_OPTIONS, GlobalDimensions, User, Role, getCurrentDate, formatDate, ProjectLocation, BQItem, CalculationPart } from '../types';
import { ArrowLeft, Save, Zap, Folder, CheckCircle, Edit, Info, Calculator, Calendar, Lock, Unlock, RefreshCw, AlertCircle, FileSignature, X, Plus, HelpCircle, FileText, Download, Loader2, FileWarning, Award, Star, Megaphone, User as UserIcon, ChevronDown, Check, ShieldCheck, CloudDownload, Search, Database } from 'lucide-react';
import BQEditor from './BQEditor';
import BQPelarasanEditor from './BQPelarasanEditor';
import AkuJanjiEditor from './AkuJanjiEditor';
import LADCertificate from './LADCertificate';
import LoCCertificate from './LoCCertificate';
import CPCCertificate from './CPCCertificate';
import PrestasiCertificate from './PrestasiCertificate';
import NotisGenerator from './NotisGenerator';
import { apiService } from '../services/apiService';
import StrictDateInput from '../components/StrictDateInput';
import { useProjects } from '../hooks/useProjects';
import { useUsers } from '../hooks/useUsers';
import { useSettings } from '../hooks/useSettings';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const toRoman = (num: number): string => {
  const lookup: { [key: string]: number } = { m: 1000, cm: 900, d: 500, cd: 400, c: 100, xc: 90, l: 50, xl: 40, x: 10, ix: 9, v: 5, iv: 4, i: 1 };
  let roman = '';
  for (let i in lookup) {
    while (num >= lookup[i]) {
      roman += i;
      num -= lookup[i];
    }
  }
  return roman;
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
  projects?: Project[];
  onClose: () => void;
  onSave: () => void;
  onSwitchProject?: (project: Project) => void;
  currentUserRole: Role;
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
  isVerifying?: boolean;
  hasFullData?: boolean;
  showRemoteUpdateNotice?: boolean;
  onApplyRemoteUpdate?: () => void;
  isLoading?: boolean;
  hasUnsavedChanges?: boolean;
  isNewProject?: boolean;
}

const CostHUD = ({
  grandTotal, finalTotal, extraTotal, status, progress,
  onStatusChange, onProgressChange, saveAction, exportAction,
  isPelarasanActive, isReadOnly, isVerifying, hasFullData,
  showRemoteUpdateNotice, onApplyRemoteUpdate, isLoading,
  hasUnsavedChanges, isNewProject
}: CostHUDProps) => {
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
    <div className="fixed top-0 left-0 md:left-28 right-0 z-[90] bg-white border-b border-slate-300 shadow-xl no-print">

      <div className="md:hidden w-full bg-slate-50 border-b border-slate-200 px-4 py-1.5 flex flex-col items-center">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center">
            <span className="text-[8px] font-bold text-slate-400 uppercase leading-none">{isPelarasanActive ? 'Asal' : 'Kos'}</span>
            <p className={`font-mono font-bold leading-none ${isPelarasanActive ? 'text-slate-400 line-through text-sm' : 'text-xl text-emerald-600'}`}>
              {isLoading ? "---" : formatCurrency(grandTotal)}
            </p>
          </div>
          {isPelarasanActive && finalTotal !== undefined && (
            <>
              <div className="w-[1px] h-6 bg-slate-300 mx-1" />
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-black text-emerald-600 uppercase leading-none">Akhir</span>
                <p className={`text-xl font-black font-mono leading-none ${finalTotal < grandTotal ? 'text-red-600' : finalTotal > grandTotal ? 'text-blue-600' : 'text-emerald-600'}`}>{formatCurrency(finalTotal)}</p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.4fr_minmax(0,1.4fr)_1.2fr] items-center px-3 py-1.5 md:px-8 md:py-3 gap-2 md:gap-0">

        <div className="flex items-center gap-2 md:gap-3 justify-between md:justify-start w-full">
          <div className="flex items-center gap-2 md:gap-3 shrink-0">

            <div className="relative group">
              <select
                name="status"
                value={status}
                onChange={onStatusChange}
                disabled={isReadOnly}
                className="appearance-none bg-slate-100 border-2 border-slate-200 rounded-xl py-1 md:py-1.5 pl-3 md:pl-4 pr-8 md:pr-10 text-[10px] md:text-[11px] font-black text-slate-700 focus:ring-2 focus:ring-emerald-500 transition-all uppercase tracking-wider cursor-pointer hover:bg-white hover:border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value={ProjectStatus.FASA_DRAF}>Fasa Draf</option>
                <option value={ProjectStatus.MENUNGGU_LANTIKAN}>Menunggu Lantikan</option>
                <option value={ProjectStatus.DALAM_PROSES}>Dalam Proses</option>
                <option value={ProjectStatus.PEMERIKSAAN_TAPAK}>Pemeriksaan Tapak</option>
                <option value={ProjectStatus.TUNTUTAN_BAYARAN}>Tuntutan Bayaran</option>
                <option value={ProjectStatus.SIAP}>Siap</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 text-slate-400 pointer-events-none group-hover:text-emerald-500 transition-colors" />
            </div>
            {!isReadOnly && <div className="scale-90 md:scale-95">{saveAction}</div>}
            <div className="scale-90 md:scale-95">{exportAction}</div>
            
            <div className={`hidden sm:flex px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider items-center ${isNewProject ? 'bg-blue-100 text-blue-700' : hasUnsavedChanges ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {isNewProject ? 'Baru' : hasUnsavedChanges ? 'Belum Disimpan' : 'Disimpan'}
            </div>
          </div>

          <div className="md:hidden flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100" onClick={toggleEdit}>
            {isEditingProgress ? (
              <div className="flex items-center">
                <input
                  type="number"
                  value={localProgress}
                  onChange={(e) => setLocalProgress(e.target.value)}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  className="w-8 bg-transparent text-[10px] font-black text-emerald-600 outline-none border-b border-emerald-500 p-0 text-center"
                  autoFocus
                  inputMode="decimal"
                />
                <span className="text-[10px] font-black text-emerald-600">%</span>
              </div>
            ) : (
              <span className="text-[10px] font-black text-emerald-600">{localProgress}%</span>
            )}
          </div>
        </div>

        <div className="hidden md:flex flex-col items-center justify-center w-full max-w-md mx-auto px-4">
          <div className="flex items-center justify-between w-full mb-1 px-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prestasi Projek</span>
            <div
              className={`flex items-center gap-1 px-2 py-0 rounded-lg transition-all ${isReadOnly ? '' : 'hover:bg-emerald-50 cursor-pointer group'}`}
              onClick={toggleEdit}
            >
              <div className="flex items-baseline">
                <input
                  ref={inputRef}
                  type="number"
                  value={localProgress}
                  onChange={(e) => setLocalProgress(e.target.value)}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  disabled={isReadOnly}
                  className={`w-10 text-right bg-transparent border-b-2 border-transparent p-0 text-base font-black text-emerald-600 focus:ring-0 outline-none transition-all ${isEditingProgress ? 'border-emerald-500 bg-white shadow-inner rounded-t px-1' : ''}`}
                />
                <span className="text-xs font-black text-emerald-500/50">%</span>
              </div>
              {!isReadOnly && <Edit className="w-3 h-3 text-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity" />}
            </div>
          </div>
          <div className="flex gap-1 h-3.5 w-full">
            {[
              { color: '#0059B2', start: 0, end: 33.33 },
              { color: '#EF4444', start: 33.33, end: 66.66 },
              { color: '#008C4A', start: 66.66, end: 100 }
            ].map((seg, i) => {
              const p = Math.min(100, Math.max(0, Number(progress) || 0));
              const width = Math.max(0, Math.min(100, ((p - seg.start) / (seg.end - seg.start)) * 100));
              return (
                <div key={i} className="flex-1 bg-slate-100 border border-slate-900 overflow-hidden h-full">
                  <div
                    className="h-full transition-all duration-1000 ease-out"
                    style={{ width: `${width}%`, backgroundColor: seg.color }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 3: Price Breakdown (Right) */}
        <div className="hidden md:flex items-center justify-end gap-6 w-full">
          <div className="flex flex-col items-end shrink-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none text-right">
              {isPelarasanActive ? 'Harga Kontrak' : 'Jumlah Kos'}
            </p>
            <p className={`font-mono font-bold leading-none ${isPelarasanActive ? 'text-slate-400 line-through text-base' : 'text-xl text-emerald-600'}`}>
              {(isVerifying || !hasFullData) ? (
                <span className="animate-pulse opacity-50 px-2 bg-slate-100 rounded text-sm font-sans uppercase tracking-tight text-slate-400">Memuatkan...</span>
              ) : formatCurrency(grandTotal)}
            </p>
          </div>

          {isPelarasanActive && finalTotal !== undefined && (
            <div className="flex items-center gap-6 border-l-2 border-slate-100 pl-6 shrink-0">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-0.5 leading-none text-right">Harga Akhir</span>
                <p className={`text-xl font-black font-mono leading-none ${finalTotal < grandTotal ? 'text-red-600' : finalTotal > grandTotal ? 'text-blue-600' : 'text-emerald-600'}`}>
                  {formatCurrency(finalTotal)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="md:hidden flex h-1.5 w-full bg-slate-100">
        {[
          { color: '#0059B2', start: 0, end: 33.33 },
          { color: '#EF4444', start: 33.33, end: 66.66 },
          { color: '#008C4A', start: 66.66, end: 100 }
        ].map((seg, i) => {
          const p = Math.min(100, Math.max(0, Number(progress) || 0));
          const width = Math.max(0, Math.min(100, ((p - seg.start) / (seg.end - seg.start)) * 100));
          return (
            <div key={i} className="flex-1 h-full overflow-hidden">
              <div
                className="h-full transition-all duration-1000 ease-out"
                style={{ width: `${width}%`, backgroundColor: seg.color }}
              />
            </div>
          );
        })}
      </div>
    </div>,
    document.body
  );
};

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, projects = [], onClose, onSave, onSwitchProject, currentUserRole, selectedYear, onShowToast }) => {
  const { createProject, updateProject } = useProjects();
  const { users } = useUsers();
  const queryClient = useQueryClient();
  const projectYear = project?.tarikhBuka ? new Date(project.tarikhBuka).getFullYear() : selectedYear;
  const { companies, votes: voteNumbers, sebuthargaNumbers, settings } = useSettings(projectYear);

  // Get the latest project data from the cache (which is updated by Realtime in useProjects)
  const { data: latestProject, isFetching: isVerifying } = useQuery({
    queryKey: ['projects', project?.id, 'v126'],
    queryFn: async () => {
      if (!project?.id) return null;
      return await apiService.getProjectById(project.id);
    },
    enabled: !!project?.id,
    staleTime: 0, // Force fresh check
  });

const CACHE_VERSION = 'v126';
  const currentUser = apiService.getCurrentUser();

  // Track if local form has unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showRemoteUpdateNotice, setShowRemoteUpdateNotice] = useState(false);

  // Detect remote changes
  useEffect(() => {
    if (latestProject && project && latestProject.id === project.id) {
      const hasFullDataLocally = formData?.bqData && formData.bqData.length > 0;
      const hasFullDataRemotely = latestProject?.bqData && latestProject.bqData.length > 0;
      
      // Safety Mapper for any legacy properties
      const mappedLatest = {
        ...latestProject,
        kosProjek: latestProject.kosProjek ?? (latestProject as any).kos_projek ?? 0,
        namaProjek: latestProject.namaProjek ?? (latestProject as any).nama_projek ?? '',
      } as Project;

      // Force sync if we are moving from a stale (snake_case) or legacy object to the new v125 structure
      const isVersionMismatch = (!formData?.apiVersion && mappedLatest?.apiVersion === CACHE_VERSION) || (formData?.apiVersion && formData.apiVersion !== CACHE_VERSION && mappedLatest?.apiVersion === CACHE_VERSION);
      const needsInitialSync = (!hasFullDataLocally && hasFullDataRemotely) || isVersionMismatch;
      const needsUpdateSync = latestProject.updatedAt !== project.updatedAt;

      if (needsInitialSync || needsUpdateSync) {
        if (!hasUnsavedChanges || needsInitialSync) {
          console.log(`[ProjectDetail] Syncing data. InitialSync: ${needsInitialSync}, UpdateSync: ${needsUpdateSync}`);
          setFormData(mappedLatest);
          if (onShowToast && needsUpdateSync && !needsInitialSync) {
            onShowToast("Data dikemaskini secara automatik dari awan.", "info");
          }
        } else if (needsUpdateSync) {
          setShowRemoteUpdateNotice(true);
        }
      }
    }
  }, [latestProject, project?.id]);

  const handleApplyRemoteUpdate = () => {
    if (latestProject) {
      setFormData(latestProject);
      setHasUnsavedChanges(false);
      setShowRemoteUpdateNotice(false);
      if (onShowToast) onShowToast("Data awan telah digunakan.", "success");
    }
  };

  // Detect project switch and reset ALL local state to reflect the new project
  useEffect(() => {
    setHasUnsavedChanges(false);
    setShowRemoteUpdateNotice(false);
    setIsSwitcherOpen(false);
    setSwitcherSearchQuery('');

    // Defensive mapping to handle stale snake_case data from old cached project list
    const mappedProject = project ? {
      ...project,
      namaProjek: project.namaProjek || (project as any).nama_projek,
      noAduan: project.noAduan || (project as any).no_aduan,
      lokasi: project.lokasi || (project as any).lokasi,
      bp: project.bp || (project as any).bp,
      zon: project.zon || (project as any).zon,
      mukim: project.mukim || (project as any).mukim,
      pjaId: project.pjaId || (project as any).pja_id,
      kosProjek: project.kosProjek !== undefined ? project.kosProjek : (project as any).kos_projek,
      tarikhBuka: project.tarikhBuka || (project as any).tarikh_buka,
      notisPeringatan1Status: project.notisPeringatan1Status || (project as any).notis_peringatan_1_status || 'PENDING',
      perakuanKerjaTidakSiapStatus: project.perakuanKerjaTidakSiapStatus || (project as any).perakuan_kerja_tidak_siap_status || 'PENDING',
      notisPeringatan2Status: project.notisPeringatan2Status || (project as any).notis_peringatan_2_status || 'PENDING',
      notisPeringatan3Status: project.notisPeringatan3Status || (project as any).notis_peringatan_3_status || 'PENDING',
      isTiadaNotisDiperlukan: project.isTiadaNotisDiperlukan !== undefined ? project.isTiadaNotisDiperlukan : Boolean((project as any).is_tiada_notis_diperlukan),
    } : null;

    // Reset formData to the new project's data (or blank defaults for new project)
    const initialPja = (currentUser?.role === Role.PJA && !project) ? currentUser.id : (mappedProject?.pjaId || 0);
    
    setFormData(prev => {
      // Check if we are switching TO the same project ID (refresh) or a DIFFERENT one
      const isSameProject = project?.id && prev?.id === project.id;
      
      const nextData: Partial<Project> = (mappedProject as Project) || {
        namaProjek: '', noFail: '', noAduan: '', tarikhBuka: getCurrentDate(),
        pjaId: initialPja, bp: '', zon: '', mukim: '', lokasi: '',
        status: ProjectStatus.FASA_DRAF,
        bqData: [],
        bqDataPelarasan: [],
        globalDimensions: { length: 0, width: 0, depth: 0 },
        locationDimensions: {},
        locationDimensionsPelarasan: {},
        coverJawatan: (currentUser?.role === Role.PJA && !project) ? currentUser.jawatan : '',
        coverBahagian: (currentUser?.role === Role.PJA && !project) ? currentUser.bahagian : '',
        coverUnit: (currentUser?.role === Role.PJA && !project) ? currentUser.unit : '',
        prestasiScores: [0, 0, 0, 0, 0, 0],
        skop: undefined,
        noInbois: '',
        isManualMulaKontrak: false,
        isManualMulaKerja: false,
        isLocDeductionEnabled: false,
        notisPeringatan1Status: 'PENDING',
        perakuanKerjaTidakSiapStatus: 'PENDING',
        notisPeringatan2Status: 'PENDING',
        notisPeringatan3Status: 'PENDING',
        isTiadaNotisDiperlukan: false
      };

      // CRITICAL: If the incoming project is "Partial" (from Dashboard list) but we already have 
      // "Full" data in the local state for THIS project, PRESERVE the full data.
      if (isSameProject) {
        if (!nextData.bqData?.length && prev.bqData?.length) nextData.bqData = prev.bqData;
        if (!nextData.bqDataPelarasan?.length && prev.bqDataPelarasan?.length) nextData.bqDataPelarasan = prev.bqDataPelarasan;
        if (!nextData.locationDimensions && prev.locationDimensions) nextData.locationDimensions = prev.locationDimensions;
        if (!nextData.globalCalculations && prev.globalCalculations) nextData.globalCalculations = prev.globalCalculations;
      }

      return nextData;
    });

    // Reset tempoh values
    if (project?.tempohKontrak) {
      const parts = project.tempohKontrak.split(' ');
      if (parts.length === 2) {
        setTempohVal(Number(parts[0]));
        setTempohUnit(parts[1] as any);
      }
    } else {
      setTempohVal(0);
      setTempohUnit('Minggu');
    }

    // Reset location rows
    if (project) {
      if (project.projectLocations && project.projectLocations.length > 0) {
        setLocationRows(project.projectLocations);
      } else {
        const locs = (project.lokasi || '').split('\n').filter(l => l.trim() !== '');
        const aduans = (project.noAduan || '').split('\n');
        let rows = locs.map((l, i) => ({ id: Math.random().toString(36).substr(2, 9), lokasi: l, aduan: aduans[i] || '' }));
        if (rows.length === 0) rows = [{ id: Math.random().toString(36).substr(2, 9), lokasi: '', aduan: '' }];
        setLocationRows(rows);
      }
    } else {
      setLocationRows([{ id: Math.random().toString(36).substr(2, 9), lokasi: '', aduan: '' }]);
    }
  }, [project?.id]);

  const TABS = [
    { id: 'phase1', label: '1. BQ Building (PJA)', color: 'bg-yellow-100 text-yellow-700 border-yellow-200 shadow-sm', ringColor: 'ring-yellow-400' },
    { id: 'phase2', label: '2. File Creation (PT)', color: 'bg-blue-100 text-blue-700 border-blue-200 shadow-sm', ringColor: 'ring-blue-500' },
    { id: 'phase3', label: '3. Pelarasan (PJA)', color: 'bg-yellow-100 text-yellow-700 border-yellow-200 shadow-sm', ringColor: 'ring-yellow-400' },
    { id: 'phase4', label: '4. Penutup (PT)', color: 'bg-orange-100 text-orange-700 border-orange-200 shadow-sm', ringColor: 'ring-orange-500' },
  ];

  const [activeTab, setActiveTab] = useState('phase1');
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [tempohVal, setTempohVal] = useState<number>(0);
  const [tempohUnit, setTempohUnit] = useState<'Minggu' | 'Bulan' | 'Tahun'>('Minggu');
  const [locationRows, setLocationRows] = useState<ProjectLocation[]>([]);
  const [isLADOpen, setIsLADOpen] = useState(false);
  const [isLoCOpen, setIsLoCOpen] = useState(false);
  const [isCPCOpen, setIsCPCOpen] = useState(false);
  const [isPrestasiOpen, setIsPrestasiOpen] = useState(false);
  const [isNotisOpen, setIsNotisOpen] = useState(false);
  const [isZonDropdownOpen, setIsZonDropdownOpen] = useState(false);
  const zonDropdownRef = useRef<HTMLDivElement>(null);
  const zonPortalRef = useRef<HTMLDivElement>(null);
  const [confirmationState, setConfirmationState] = useState<{ isOpen: boolean; type: 'back' | 'save' | 'reset_pelarasan' | 'switch' | null; }>({ isOpen: false, type: null });
  const [showPelarasanWarning, setShowPelarasanWarning] = useState(false);



  // Project Switcher State
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [switcherSearchQuery, setSwitcherSearchQuery] = useState('');
  const [showSiapProjects, setShowSiapProjects] = useState(false);
  const [pendingSwitchProject, setPendingSwitchProject] = useState<Project | null>(null);
  const switcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutsideSwitcher = (event: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setIsSwitcherOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideSwitcher);
    return () => document.removeEventListener('mousedown', handleClickOutsideSwitcher);
  }, []);

  const filteredSwitcherProjects = useMemo(() => {
    return projects.filter(p => {
      // Role-based filtering
      if (currentUserRole === Role.PJA && p.pjaId !== currentUser?.id) return false;
      
      // Status filtering (Toggle "Siap")
      if (!showSiapProjects && p.status === ProjectStatus.SIAP) return false;

      // Search filtering
      const searchLower = switcherSearchQuery.toLowerCase();
      const matchesSearch = 
        (p.namaProjek || '').toLowerCase().includes(searchLower) ||
        (p.noFail || '').toLowerCase().includes(searchLower);

      return matchesSearch;
    }).sort((a, b) => {
      // Natural sort by file number
      return (a.noFail || '').localeCompare(b.noFail || '', undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [projects, switcherSearchQuery, showSiapProjects, currentUserRole, currentUser?.id]);

  const handleProjectSwitch = (p: Project) => {
    if (p.id === project?.id) {
      setIsSwitcherOpen(false);
      return;
    }

    if (hasUnsavedChanges) {
      setPendingSwitchProject(p);
      setConfirmationState({ isOpen: true, type: 'switch' });
    } else {
      onSwitchProject?.(p);
      setIsSwitcherOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutsideTrigger = zonDropdownRef.current && !zonDropdownRef.current.contains(target);
      const isOutsidePortal = zonPortalRef.current && !zonPortalRef.current.contains(target);

      if (isOutsideTrigger && isOutsidePortal) {
        setIsZonDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initialPjaId = (currentUser?.role === Role.PJA && !project) ? currentUser.id : (project?.pjaId || 0);

  const [formData, setFormData] = useState<Partial<Project>>(project || {
    namaProjek: '', noFail: '', noAduan: '', tarikhBuka: getCurrentDate(),
    pjaId: initialPjaId, bp: '', zon: '', mukim: '', lokasi: '',
    status: ProjectStatus.FASA_DRAF,
    bqData: [],
    bqDataPelarasan: [],
    globalDimensions: { length: 0, width: 0, depth: 0 },
    locationDimensions: {},
    locationDimensionsPelarasan: {},
    coverJawatan: (currentUser?.role === Role.PJA && !project) ? currentUser.jawatan : '',
    coverBahagian: (currentUser?.role === Role.PJA && !project) ? currentUser.bahagian : '',
    coverUnit: (currentUser?.role === Role.PJA && !project) ? currentUser.unit : '',
    prestasiScores: [0, 0, 0, 0, 0, 0],
    skop: undefined,
    noInbois: '',
    isManualMulaKontrak: project?.isManualMulaKontrak || false,
    isManualMulaKerja: project?.isManualMulaKerja || false,
    isLocDeductionEnabled: project?.isLocDeductionEnabled ?? false,
    notisPeringatan1Status: project?.notisPeringatan1Status || 'PENDING',
    perakuanKerjaTidakSiapStatus: project?.perakuanKerjaTidakSiapStatus || 'PENDING',
    notisPeringatan2Status: project?.notisPeringatan2Status || 'PENDING',
    notisPeringatan3Status: project?.notisPeringatan3Status || 'PENDING',
    isTiadaNotisDiperlukan: project?.isTiadaNotisDiperlukan || false
  });

  const isPJA = currentUser?.role === Role.PJA;
  const isDifferentPJA = isPJA && formData.pjaId !== 0 && formData.pjaId !== currentUser?.id;
  const isGlobalReadOnly = isDifferentPJA || isVerifying; // LOCK during sync check
  const isPTSectionReadOnly = isPJA || isGlobalReadOnly;

  const isCPCBlocked = useMemo(() => {
    if (formData.isTiadaNotisDiperlukan || !formData.tarikhTamatKontrak) {
      return false;
    }
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' });
    const todayVal = new Date(todayStr).getTime();
    
    const tamatVal = new Date(formData.tarikhTamatKontrak).getTime();
    if (isNaN(tamatVal)) return false;
    
    const oneDayMs = 24 * 60 * 60 * 1000;
    const p1Time = tamatVal - (7 * oneDayMs);
    const p2Time = tamatVal + (7 * oneDayMs);
    const p3Time = tamatVal + (14 * oneDayMs);
    
    if (todayVal >= p3Time) {
      if (!formData.notisPeringatan3Status || formData.notisPeringatan3Status === 'PENDING') return true;
    }
    if (todayVal >= p2Time) {
      if (!formData.notisPeringatan2Status || formData.notisPeringatan2Status === 'PENDING') return true;
    }
    if (todayVal >= tamatVal) {
      if (!formData.perakuanKerjaTidakSiapStatus || formData.perakuanKerjaTidakSiapStatus === 'PENDING') return true;
    }
    if (todayVal >= p1Time) {
      if (!formData.notisPeringatan1Status || formData.notisPeringatan1Status === 'PENDING') return true;
    }
    
    return false;
  }, [formData.tarikhTamatKontrak, formData.notisPeringatan1Status, formData.perakuanKerjaTidakSiapStatus, formData.notisPeringatan2Status, formData.notisPeringatan3Status, formData.isTiadaNotisDiperlukan]);

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
    setHasUnsavedChanges(true);
  };

  const handleBackClick = () => { setConfirmationState({ isOpen: true, type: 'back' }); };
  const handleSaveClick = () => { setConfirmationState({ isOpen: true, type: 'save' }); };
  const cancelConfirmation = () => { setConfirmationState({ isOpen: false, type: null }); };

  const handleInitializePelarasan = () => {
    if (!formData.bqData || formData.bqData.length === 0) {
      if (onShowToast) onShowToast("Sila pastikan BQ Kontrak (Phase 1) telah diisi terlebih dahulu.", "error");
      return;
    }

    const clonedBQData: BQGroup[] = JSON.parse(JSON.stringify(formData.bqData));

    const clonedGlobalCalculations = formData.globalCalculations
      ? JSON.parse(JSON.stringify(formData.globalCalculations))
      : {};

    setFormData(prev => ({
      ...prev,
      bqDataPelarasan: clonedBQData,
      globalCalculationsPelarasan: clonedGlobalCalculations
    }));
    setHasUnsavedChanges(true);

    if (onShowToast) onShowToast("Pelarasan telah dimulakan berdasarkan BQ Kontrak.", "success");
  };

  const handleResetPelarasan = () => {
    setConfirmationState({ isOpen: true, type: 'reset_pelarasan' });
  };

  const confirmAction = async () => {
    if (confirmationState.type === 'back') { setConfirmationState({ isOpen: false, type: null }); onClose(); }
    else if (confirmationState.type === 'save') {
      setConfirmationState({ isOpen: false, type: null }); setIsSaving(true);
      try {
        if (project && project.id) {
          await updateProject({ id: project.id, updates: formData });
        } else {
          await createProject(formData as any);
        }
        setHasUnsavedChanges(false);
        onSave();
      } catch (e) {
        console.error(e);
        if (onShowToast) onShowToast("Ralat menyimpan projek.", "error");
      } finally {
        setIsSaving(false);
      }
    }
    else if (confirmationState.type === 'switch') {
      // Save current project first, then switch
      setConfirmationState({ isOpen: false, type: null }); setIsSaving(true);
      try {
        if (project && project.id) {
          await updateProject({ id: project.id, updates: formData });
        } else {
          await createProject(formData as any);
        }
        setHasUnsavedChanges(false);
        if (onShowToast) onShowToast("Projek disimpan. Menukar projek...", "success");
        if (pendingSwitchProject) {
          onSwitchProject?.(pendingSwitchProject);
          setPendingSwitchProject(null);
          setIsSwitcherOpen(false);
        }
      } catch (e) {
        console.error(e);
        if (onShowToast) onShowToast("Ralat menyimpan projek.", "error");
      } finally {
        setIsSaving(false);
      }
    }
    else if (confirmationState.type === 'reset_pelarasan') {
      setConfirmationState({ isOpen: false, type: null });
      handleInitializePelarasan();
    }
  };

  const discardAndSwitch = () => {
    setConfirmationState({ isOpen: false, type: null });
    setHasUnsavedChanges(false);
    if (pendingSwitchProject) {
      onSwitchProject?.(pendingSwitchProject);
      setPendingSwitchProject(null);
      setIsSwitcherOpen(false);
    }
  };

  const addLocationRow = () => {
    setLocationRows(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), lokasi: '', aduan: '' }]);
    setHasUnsavedChanges(true);
  };
  const removeLocationRow = (id: string) => {
    setLocationRows(prev => { if (prev.length <= 1) return [{ id: Math.random().toString(36).substr(2, 9), lokasi: '', aduan: '' }]; return prev.filter(r => r.id !== id); });
    setHasUnsavedChanges(true);
  };
  const updateLocationRow = (id: string, field: 'lokasi' | 'aduan', value: string) => {
    setLocationRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    setHasUnsavedChanges(true);
  };

  const handlePrestasiUpdate = (newScores: number[], percentage: number, skop: 'BEKALAN' | 'PERKHIDMATAN' | 'KERJA', noInbois: string) => {
    const prestasiString = `${percentage}%`;
    setFormData(prev => ({ ...prev, prestasiScores: newScores, prestasi: prestasiString, skop: skop, noInbois: noInbois }));
    setHasUnsavedChanges(true);
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
    if (formData.lokasi !== lokasiStr || formData.noAduan !== aduanStr || JSON.stringify(formData.projectLocations) !== JSON.stringify(locationRows)) {
      setFormData(prev => ({ ...prev, lokasi: lokasiStr, noAduan: aduanStr, projectLocations: locationRows }));
    }
  }, [locationRows]);

  useEffect(() => {
    if (project?.tempohKontrak) { const parts = project.tempohKontrak.split(' '); if (parts.length === 2) { setTempohVal(Number(parts[0])); setTempohUnit(parts[1] as any); } }
  }, [project]);

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

  // --- LoC Calculation Effect ---
  useEffect(() => {
    if (formData.isLocDeductionEnabled !== false) {
      if (formData.tarikhSiapSebenar && formData.tarikhTuntutanBayaran) {
        const siapDate = new Date(formData.tarikhSiapSebenar);
        const tuntutanDate = new Date(formData.tarikhTuntutanBayaran);

        const timeDiff = tuntutanDate.getTime() - siapDate.getTime();
        const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        const locDays = Math.max(0, dayDiff - 14);
        const locRate = 100.00;
        const totalLoC = locDays * locRate;

        if (formData.locDays !== locDays || formData.locAmount !== totalLoC) {
          setFormData(prev => ({ ...prev, locDays: locDays, locAmount: totalLoC }));
        }
      } else {
        if (formData.locDays !== 0 && formData.locDays !== undefined) {
          setFormData(prev => ({ ...prev, locDays: 0, locAmount: 0 }));
        }
      }
    } else {
      if (formData.locDays !== 0 || formData.locAmount !== 0) {
        setFormData(prev => ({ ...prev, locDays: 0, locAmount: 0 }));
      }
    }
  }, [formData.tarikhSiapSebenar, formData.tarikhTuntutanBayaran, formData.isLocDeductionEnabled]);

  useEffect(() => {
    const bqSum = formData.bqDataPelarasan?.reduce((acc, group) => {
      const gSum = group.items.reduce((itemSum, item) => {
        const val = Number(item.amount) || 0;
        return itemSum + val;
      }, 0);
      return acc + gSum;
    }, 0);

    const bqOriginalSum = formData.bqData?.reduce((acc, group) => {
      const gSum = group.items.reduce((itemSum, item) => {
        const val = Number(item.amount) || 0;
        return itemSum + val;
      }, 0);
      return acc + gSum;
    }, 0) || 0;

    const bqSumVal = bqSum || 0;
    const hasPelarasan = formData.bqDataPelarasan && formData.bqDataPelarasan.length > 0;
    
    const rawAdjustedBqSum = (bqSumVal === 0 && !hasPelarasan)
      ? (Number(formData.kosProjek) || 0)
      : bqSumVal;

    const contractPrice = Number(formData.kosProjek) || 0;
    const cappedAdjustedBqSum = Math.min(rawAdjustedBqSum, contractPrice);
    const extraPrice = Math.max(0, rawAdjustedBqSum - contractPrice);

    const ladAmount = Number(formData.ladAmount) || 0;
    const locAmount = Number(formData.locAmount) || 0;
    const wangTahanan = Number(formData.wangTahanan) || 0;

    const finalCalculatedTotal = cappedAdjustedBqSum - ladAmount - locAmount - wangTahanan;

    if (Number(formData.kosSebenar) !== finalCalculatedTotal || Number(formData.bqPelarasanExtra) !== extraPrice) {
      setFormData(prev => ({
        ...prev,
        kosSebenar: Math.max(0, parseFloat(finalCalculatedTotal.toFixed(2))),
        bqPelarasanExtra: parseFloat(extraPrice.toFixed(2))
      }));
    }
  }, [formData.bqDataPelarasan, formData.ladAmount, formData.locAmount, formData.wangTahanan, formData.kosProjek, formData.bqData]);

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
    const { name, value } = e.target;

    setFormData(prev => {
      const next = { ...prev, [name]: value };

      if (name === 'namaSyarikat' && value) {
        next.status = ProjectStatus.DALAM_PROSES;
      }

      if (name === 'tarikhPemeriksaan' && value) {
        next.status = ProjectStatus.PEMERIKSAAN_TAPAK;
        next.peratusSiap = 100;
      }

      if (name === 'tarikhTuntutanBayaran' && value) {
        next.status = ProjectStatus.TUNTUTAN_BAYARAN;
        next.peratusSiap = 100;
      }

      if (name === 'tarikhPadanan' && value) {
        next.status = ProjectStatus.SIAP;
        next.peratusSiap = 100;
      }

      return next;
    });
    setHasUnsavedChanges(true);
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'namaProjek') {
      setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
    }
  };

  const handleLocationDimensionsChange = (calculationId: string, dims: GlobalDimensions[]) => {
    setFormData(prev => ({
      ...prev,
      globalCalculations: {
        ...(prev.globalCalculations || {}),
        [calculationId]: dims
      }
    }));
    setHasUnsavedChanges(true);
  };
  const handleGlobalCalculationsPelarasanChange = (calculationId: string, dims: GlobalDimensions[]) => {
    setFormData(prev => ({
      ...prev,
      globalCalculationsPelarasan: {
        ...(prev.globalCalculationsPelarasan || {}),
        [calculationId]: dims
      }
    }));
    setHasUnsavedChanges(true);
  };
  const handleBQPelarasanChange = (bqDataPelarasan: BQGroup[]) => {
    if (bqDataPelarasan.length === 0 && (formData.bqDataPelarasan && formData.bqDataPelarasan.length > 0)) {
       return;
    }
    setFormData(prev => ({ ...prev, bqDataPelarasan }));
    setHasUnsavedChanges(true);
  };

  const handleBQChange = (bqData: BQGroup[]) => {
    if (bqData.length === 0 && (formData.bqData && formData.bqData.length > 0)) {
       // Ignore accidental wipes during initialization sync
       return;
    }
    setFormData(prev => ({ ...prev, bqData }));
    setHasUnsavedChanges(true);
  };

  useEffect(() => {
    const total = formData.bqData?.reduce((acc, group) => {
      const gSum = group.items.reduce((itemSum, item) => {
        return itemSum + (Number(item.amount) || 0);
      }, 0);
      return acc + gSum;
    }, 0) || 0;
    
    if (Number(formData.kosProjek || 0) !== total) {
      setFormData(prev => ({ ...prev, kosProjek: parseFloat(total.toFixed(2)) }));
    }
  }, [formData.bqData]);

  const handleAkuJanjiUpdate = (updates: Partial<Project>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

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
    const pageHeight = doc.internal.pageSize.getHeight();
    const sealsLogo = await getBase64ImageFromURL("https://upload.wikimedia.org/wikipedia/commons/6/6e/Selayang_Seal.png");
    const mpsLogo = await getBase64ImageFromURL("https://i.imgur.com/ZB7DFaV.png");
    const pjaUser = users.find(u => u.id === formData.pjaId);
    const year = formData.tarikhBuka ? new Date(formData.tarikhBuka).getFullYear() : new Date().getFullYear();
    const monthNames = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"];
    const dateObj = formData.tarikhBuka ? new Date(formData.tarikhBuka) : new Date();
    const formattedDate = `${monthNames[dateObj.getMonth()]} ${year}`;
    const settings: any = await apiService.getSettings(year);
    const meetingDate = settings.meeting_date || '.........................';
    const meetingNumber = settings.meeting_number || 'XXXX';

    // --- PAGE 1: COVER LETTER ---
    doc.setFont("helvetica", "bold");
    if (sealsLogo) doc.addImage(sealsLogo, 'PNG', 15, 15, 25, 20);
    if (mpsLogo) doc.addImage(mpsLogo, 'PNG', 170, 15, 25, 20);

    doc.setFontSize(12); doc.text("JABATAN KEJURUTERAAN", pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(14); doc.text("MAJLIS PERBANDARAN SELAYANG", pageWidth / 2, 25, { align: "center" });

    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.text("Persiaran 3, Bandar Baru Selayang", pageWidth / 2, 30, { align: "center" });
    doc.text("68100 Batu Caves, Selangor.", pageWidth / 2, 33.5, { align: "center" });
    doc.text("Tel. : 03-61204897/61311426 Fax. : 03-61204879", pageWidth / 2, 37, { align: "center" });

    doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.text("CADANGAN KERJA", pageWidth / 2, 46, { align: "center" });
    doc.setLineWidth(0.5); doc.line(pageWidth / 2 - 20, 47, pageWidth / 2 + 20, 47);

    let y = 56;
    const coverBody = [
      [{ content: 'Tarikh', styles: { fontStyle: 'bold' } }, { content: `         ${formattedDate}`, styles: { fontStyle: 'bold' } }],
      [{ content: 'Daripada', styles: { fontStyle: 'bold' } }, {
        content: `${pjaUser?.fullName.toUpperCase() || 'PJA'}
${pjaUser?.jawatan || ''}
${pjaUser?.bahagian || ''}
${pjaUser?.unit || ''}`
      }],
      [{ content: 'Kepada', styles: { fontStyle: 'bold' } }, {
        content: `Pengarah
Jabatan Kejuruteraan` }],
      [{ content: 'Tajuk', styles: { fontStyle: 'bold' } }, { content: formData.namaProjek?.toUpperCase() || '', styles: { fontStyle: 'bold' } }],
      [{ content: 'Blok Perancangan', styles: { fontStyle: 'bold' } }, { content: formData.bp || '' }],
      [{ content: 'Zon', styles: { fontStyle: 'bold' } }, { content: formData.zon || '' }],
    ];

    // @ts-ignore
    doc.autoTable({
      startY: y,
      body: coverBody,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 3, lineColor: 0, lineWidth: 0.1, textColor: 0 },
      columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 'auto' } },
      margin: { left: 20, right: 20 }
    });

    // @ts-ignore
    y = doc.lastAutoTable.finalY + 11;

    const marginBottom = 15;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Perkara di atas adalah dirujuk.", 20, y);
    y += 7;

    const p1 = `2.   ${(formData.namaProjek || '').toLowerCase().replace(/\b\w/g, char => char.toUpperCase())}`;
    doc.setFont("helvetica", "bold");
    doc.text(p1, 20, y, { maxWidth: 170, align: "justify" });
    const lineCount = doc.splitTextToSize(p1, 170).length;
    y += (lineCount * 5);

    doc.setFont("helvetica", "normal");
    doc.text("Bersama-sama ini dilampirkan pelan tapak, gambar lokasi aduan serta spesifikasi kerja (BQ)", 28, y);
    y += 8;
    doc.text("Sekian, terima kasih.", 20, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const slogans = [
      "\u201cKITASELANGOR MAJU BERSAMA\u201d",
      "\u201cMALAYSIA MADANI\u201d",
      "\u201cBERKHIDMAT UNTUK NEGARA\u201d",
      "\u201cMAMPAN PROGRESIF SEJAHTERA\u201d"
    ];
    slogans.forEach(s => {
      doc.text(s, 20, y);
      y += 4;
    });

    y += 6;

    if (y + 40 > pageHeight - marginBottom) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Saya yang menjalankan amanah,", 20, y);

    y += 15;
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
    doc.addPage(); doc.rect(20, 20, 170, 120); doc.rect(20, 145, 170, 120); y = 30; doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text("ULASAN JURUTERA", 25, y); y += 10;
    doc.setFontSize(10.5);
    const titleLines = doc.splitTextToSize(formData.namaProjek?.toUpperCase() || '', 160); doc.text(titleLines, 25, y); y += (titleLines.length * 5) + 10;
    doc.setFontSize(9);
    doc.text("Anggaran Kontrak", 25, y); doc.text(": ___________________________________________________________", 60, y); y += 8;
    doc.text("Tempoh Kontrak", 25, y); doc.text(": ___________________________________________________________", 60, y); y += 8;
    doc.text("Lantikan", 25, y); doc.text(": ___________________________________________________________", 60, y); y += 8;
    doc.text("________________________________________________________________________________", 25, y); y += 8;
    doc.text("________________________________________________________________________________", 25, y); y += 8;
    y = 125; doc.text("Tandatangan :", 25, y); y += 10; doc.text("Tarikh             :", 25, y);
    y = 155; doc.setFontSize(11); doc.text("ULASAN PENGARAH", 25, y); y += 10; doc.setFontSize(10.5); doc.setFont("helvetica", "normal");
    const ulasanText = `Rujuk kelulusan Jawatankuasa Sebutharga Majlis Perbandaran Selayang (MPS) Bil. ${meetingNumber} yang bersidang pada ${meetingDate} dengan rotasi bagi syarikat :-`;
    const splitUlasan = doc.splitTextToSize(ulasanText, 160); doc.text(splitUlasan, 25, y);
    y += 40; doc.line(25, y, 185, y); y += 15; doc.line(25, y, 185, y);
    y = 250; doc.text("Tandatangan :", 25, y); y += 10; doc.text("Tarikh             :", 25, y);

    // --- BQ DATA SECTION ---
    const bqData = formData.bqData || [];
    let bqSectionIdx = 0;

    for (const bill of bqData) {
      doc.addPage();
      const isPermulaan = bill.title.toUpperCase().includes('PERMULAAN') || bill.title.toUpperCase().includes('INSURANS');
      const billLocs = bill.locationIds || (bill.locationId ? [bill.locationId] : []);
      let locText = isPermulaan ? (locationRows || []).map(l => l.lokasi).join('\n') : ((locationRows || []).filter(l => billLocs.includes(l.id)).map(l => l.lokasi).join('\n') || 'TIADA LOKASI');
      let aduanText = isPermulaan ? (locationRows || []).map(l => l.aduan).join('\n') : ((locationRows || []).filter(l => billLocs.includes(l.id)).map(l => l.aduan).join('\n') || '');

      const tableBody = [];
      const sideOnlyBorder = { top: 0, right: 0.1, bottom: 0, left: 0.1 };
      const titleBorder = { top: 0.1, right: 0.1, bottom: 0, left: 0.1 };

      tableBody.push([{ content: bill.title, colSpan: 7, styles: { fontStyle: 'bold', halign: 'left', lineWidth: titleBorder, fillColor: [245, 245, 245] } }]);

      bill.items.forEach((item, itemIndex) => {
        const autoNum = getAutoNumber(bill.items, itemIndex);
        const isHeader = item.type === 'HEADER';
        let descText = item.description;
        if (item.variant) descText += `\n${item.variant}`;

        const rawParts = (!isHeader && item.calculationParts) ? item.calculationParts : [];
        const activeParts = rawParts.filter(p =>
          (p.hasLength && typeof p.length === 'number') || (p.hasWidth && typeof p.width === 'number') || (p.hasDepth && typeof p.depth === 'number') || p.multiplier !== 1
        );

        let hideMainValues = activeParts.length > 0;
        let showSubRows = true;

        if (activeParts.length === 1) {
          const p = activeParts[0];
          const hasDimensions = (p.hasLength && typeof p.length === 'number') || (p.hasWidth && typeof p.width === 'number') || (p.hasDepth && typeof p.depth === 'number');

          if (!hasDimensions) {
            showSubRows = false;
            hideMainValues = false;

            let inlineText = '';
            if (p.label) inlineText += ` - ${p.label}`;
            if (p.multiplier !== 1) inlineText += ` x ${p.multiplier}`;
            if (inlineText) descText += inlineText;
          }
        }

        tableBody.push([
          { content: autoNum, styles: { halign: 'center', valign: 'top', lineWidth: sideOnlyBorder } },
          { content: descText, styles: { fontStyle: isHeader ? 'bold' : 'normal', lineWidth: sideOnlyBorder } },
          { content: hideMainValues ? '' : item.unit, styles: { halign: 'center', valign: 'top', lineWidth: sideOnlyBorder } },
          { content: hideMainValues ? '' : (item.qty || ''), styles: { halign: 'center', valign: 'top', lineWidth: sideOnlyBorder } },
          { content: hideMainValues ? '' : (item.rate ? formatCurrency(item.rate).replace('RM', '') : ''), styles: { halign: 'right', valign: 'top', lineWidth: sideOnlyBorder } },
          { content: hideMainValues ? '' : (item.amount ? formatCurrency(item.amount).replace('RM', '') : ''), styles: { halign: 'right', valign: 'top', lineWidth: sideOnlyBorder } }
        ]);

        if (showSubRows && activeParts.length > 0) {
          activeParts.forEach(p => {
            let product = 1;
            if (p.hasLength && typeof p.length === 'number') product *= p.length;
            if (p.hasWidth && typeof p.width === 'number') product *= p.width;
            if (p.hasDepth && typeof p.depth === 'number') product *= p.depth;
            const partQtyVal = product * p.multiplier;
            const partQty = partQtyVal % 1 === 0 ? partQtyVal : parseFloat(partQtyVal.toFixed(2));
            const partAmount = partQtyVal * item.rate;

            const partsStr = [];
            const hasDim = (p.hasLength && typeof p.length === 'number') || (p.hasWidth && typeof p.width === 'number') || (p.hasDepth && typeof p.depth === 'number');
            if (p.hasLength) partsStr.push(`${p.length}m(P)`);
            if (p.hasWidth) partsStr.push(`${p.width}m(L)`);
            if (p.hasDepth) partsStr.push(`${p.depth}m(T)`);

            let dimStr = partsStr.join(' x ');
            if (hasDim) {
              if (p.multiplier !== 1) dimStr += ` x ${p.multiplier}`;
              if (p.label) dimStr += ` - ${p.label}`;
            } else {
              dimStr = '';
              if (p.label) dimStr += `- ${p.label}`;
              if (p.multiplier !== 1) dimStr += ` x ${p.multiplier}`;
              dimStr = dimStr.trim().startsWith('- ') ? dimStr.trim().substring(2) : dimStr.trim();
            }

            tableBody.push([
              { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0, bottom: 0.5 } } },
              { content: dimStr, styles: { fontSize: 7, lineWidth: sideOnlyBorder, cellPadding: { top: 0, bottom: 0.5, left: 3, right: 1 } } },
              { content: item.unit, styles: { halign: 'center', fontSize: 7, lineWidth: sideOnlyBorder, cellPadding: { top: 0, bottom: 0.5 } } },
              { content: partQty.toString(), styles: { halign: 'center', fontSize: 7, lineWidth: sideOnlyBorder, cellPadding: { top: 0, bottom: 0.5 } } },
              { content: item.rate ? formatCurrency(item.rate).replace('RM', '') : '', styles: { halign: 'right', fontSize: 7, lineWidth: sideOnlyBorder, cellPadding: { top: 0, bottom: 0.5 } } },
              { content: formatCurrency(partAmount).replace('RM', ''), styles: { halign: 'right', fontSize: 7, lineWidth: sideOnlyBorder, cellPadding: { top: 0, bottom: 0.5 } } }
            ]);
          });
        }
      });

      const billTotal = bill.items.reduce((s, i) => s + (i.amount || 0), 0);

      let tableStartY = 15;
      if (bqSectionIdx === 0) {
        // @ts-ignore
        doc.autoTable({
          body: [[{ content: `${formData.namaProjek?.toUpperCase()}`, colSpan: 6, styles: { halign: 'center', fontStyle: 'bold', fontSize: 8 } }]],
          theme: 'grid', startY: 15, styles: { lineWidth: 0.1, lineColor: 0 }, margin: { left: 10, right: 10 }
        });
        // @ts-ignore
        tableStartY = doc.lastAutoTable.finalY;
      }

      const complexHead = [
        [{ content: 'LOKASI', colSpan: 4, styles: { halign: 'center', fontStyle: 'bold', fontSize: 7.5 } }, { content: 'ADUAN', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', fontSize: 7.5 } }],
        [{ content: locText, colSpan: 4, styles: { halign: 'center', fontSize: 7.5 } }, { content: aduanText, colSpan: 2, styles: { halign: 'center', fontSize: 7.5 } }],
        ['BIL', 'KETERANGAN', 'UNIT', 'KUANTITI', 'KADAR (RM)', 'JUMLAH (RM)']
      ];

      const footerHeight = 8;
      const distBottom = 20;
      const footerY = pageHeight - distBottom - footerHeight;

      // @ts-ignore
      doc.autoTable({
        head: complexHead,
        body: tableBody,
        theme: 'plain',
        startY: tableStartY,
        rowPageBreak: 'avoid',
        showHead: 'everyPage',
        showFoot: 'never',
        margin: { top: 20, left: 10, right: 10, bottom: distBottom + footerHeight + 5 },
        styles: { fontSize: 7.5, cellPadding: 1.4, textColor: 0 },
        headStyles: { fillColor: 255, textColor: 0, fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 13 }, 3: { cellWidth: 17 }, 4: { cellWidth: 25 }, 5: { cellWidth: 25 } },
        didDrawCell: (data) => {
          doc.setDrawColor(0);
          doc.setLineWidth(0.1);
          doc.line(data.cell.x, data.cell.y, data.cell.x, data.cell.y + data.cell.height);
          doc.line(data.cell.x + data.cell.width, data.cell.y, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
          if (data.section === 'head' || (data.section === 'body' && data.row.index === 0)) {
            doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
            doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
          }
        }
      });

      // @ts-ignore
      const finalY = doc.lastAutoTable.finalY;
      if (finalY < footerY) {
        const xPositions = [10, 20, 120, 133, 150, 175, 200];
        doc.setLineWidth(0.1);
        doc.setDrawColor(0);
        xPositions.forEach(x => {
          doc.line(x, finalY, x, footerY);
        });
      }

      // @ts-ignore
      doc.autoTable({
        body: [[
          { content: 'TO COLLECTION', styles: { fontStyle: 'bold', halign: 'right', lineWidth: 0.1 } },
          { content: formatCurrency(billTotal).replace('RM', ''), styles: { fontStyle: 'bold', halign: 'right', lineWidth: 0.1 } }
        ]],
        startY: footerY,
        theme: 'grid',
        styles: { fontSize: 7.5, cellPadding: 0.8, lineColor: 0, lineWidth: 0.1, textColor: 0 },
        columnStyles: { 0: { cellWidth: 165 }, 1: { cellWidth: 25 } },
        margin: { left: 10, right: 10 },
        showHead: false
      });
      bqSectionIdx++;
    }

    doc.addPage();
    const grandTotal = bqData.reduce((acc, g) => acc + g.items.reduce((s, i) => s + (i.amount || 0), 0), 0);
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("RINGKASAN", pageWidth / 2, 20, { align: "center" });

    const summaryBody = bqData.map(b => [
      { content: b.title, styles: { fontStyle: 'bold' } },
      { content: formatCurrency(b.items.reduce((s, i) => s + (i.amount || 0), 0)).replace('RM', ''), styles: { halign: 'right', fontStyle: 'bold' } }
    ]);

    // @ts-ignore
    doc.autoTable({
      startY: 30,
      head: [['KETERANGAN', 'JUMLAH (RM)']],
      body: summaryBody,
      foot: [[{ content: 'TOTAL COLLECTION', styles: { halign: 'center' } }, { content: formatCurrency(grandTotal).replace('RM', ''), styles: { halign: 'right' } }]],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.0, lineColor: 0, lineWidth: 0.1 },
      headStyles: { fillColor: 240, textColor: 0, fontStyle: 'bold' },
      footStyles: { fillColor: 240, textColor: 0, fontStyle: 'bold' },
      margin: { left: 20, right: 20 }
    });

    y = doc.lastAutoTable.finalY + 15;
    const notes = "Sebelum kerja-kerja dimulakan pemborong dikehendaki melawat tapak bersama dengan Penolong Jurutera kawasan untuk mempastikan tempat dan menyelesaikan masalah berbangkit di tapak sebelum memulakan kerja. Kontraktor adalah dikecualikan daripada mengemukakkan Bon Perlaksanaan. Walaubagaimanapun, tempoh tanggungan kecacatan seperti di bawah juga dikenakan kepada kontraktor dan syarat ini hendaklah dinyatakan dalam surat tawaran.\n( Rujuk Kementerian Kewangan Surat Pekeliling Perbendaharaan Bil 3 Tahun 2007)";

    // @ts-ignore
    doc.autoTable({
      startY: y, margin: { left: 20, right: 20 }, body: [[notes]], theme: 'plain',
      styles: { fontSize: 9, font: "helvetica", halign: 'justify', cellPadding: 0 },
      columnStyles: { 0: { cellWidth: 170 } }
    });

    y = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text("Nilai Projek", 20, y); doc.text("Tempoh Tanggungan Kecacatan", 100, y);
    y += 5; doc.setFont("helvetica", "normal");
    doc.text("RM 10,000 - RM 100,000", 20, y); doc.text("6 Bulan dari tarikh kerja diperakukan siap", 100, y);
    y += 5; doc.text("Melebihi RM 100,000", 20, y); doc.text("12 bulan dari tarikh kerja diperakukan siap", 100, y);

    y = 250; doc.setFont("helvetica", "bold"); doc.text("Disediakan oleh", 20, y); doc.text("Disemak oleh,", 120, y);
    y += 20; doc.line(20, y, 80, y); doc.line(120, y, 180, y);

    doc.save(`BQ_${formData.lokasi || 'Draft'}.pdf`);
  };

  const handleExportRealPelarasanPDF = async () => {
    // @ts-ignore
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const pelarasanData = formData.bqDataPelarasan || [];
    const originalData = formData.bqData || [];

    let pelSectionIdx = 0;

    for (const bill of pelarasanData) {
      if (pelSectionIdx > 0) doc.addPage();
      const originalBill = originalData.find(b => b.id === bill.id);
      const isPermulaan = bill.title.toUpperCase().includes('PERMULAAN') || bill.title.toUpperCase().includes('INSURANS');
      const billLocs = bill.locationIds || (bill.locationId ? [bill.locationId] : []);
      let locText = isPermulaan ? (locationRows || []).map(l => l.lokasi).join('\n') : ((locationRows || []).filter(l => billLocs.includes(l.id)).map(l => l.lokasi).join('\n') || 'TIADA LOKASI');
      let aduanText = isPermulaan ? (locationRows || []).map(l => l.aduan).join('\n') : ((locationRows || []).filter(l => billLocs.includes(l.id)).map(l => l.aduan).join('\n') || '');

      const tableBody = [];
      const sideOnlyBorder = { top: 0, right: 0.1, bottom: 0, left: 0.1 };
      const titleBorder = { top: 0.1, right: 0.1, bottom: 0, left: 0.1 };

      tableBody.push([{ content: bill.title, colSpan: 7, styles: { fontStyle: 'bold', halign: 'left', lineWidth: titleBorder, fillColor: [245, 245, 245] } }]);

      bill.items.forEach((item, itemIndex) => {
        const autoNum = getAutoNumber(bill.items, itemIndex);
        const isHeader = item.type === 'HEADER';
        const originalItem = originalBill?.items.find(i => i.id === item.id);
        const isAddition = item.isAdjustment === true;

        let descText = item.description;
        if (item.variant) descText += `\n${item.variant}`;

        const rowFontStyle = isAddition ? 'bold' : (isHeader ? 'bold' : 'normal');
        const textColor = isAddition ? [0, 80, 200] : [0, 0, 0];

        const rawParts = (!isHeader && item.calculationParts) ? item.calculationParts : [];
        const activeParts = rawParts.filter(p => (p.hasLength && typeof p.length === 'number') || (p.hasWidth && typeof p.width === 'number') || (p.hasDepth && typeof p.depth === 'number') || p.multiplier !== 1 || (p.label && p.label.trim() !== ''));

        const rawOrigParts = (originalItem && !isHeader && originalItem.calculationParts) ? originalItem.calculationParts : [];
        const activeOrigParts = rawOrigParts.filter(p => (p.hasLength && typeof p.length === 'number') || (p.hasWidth && typeof p.width === 'number') || (p.hasDepth && typeof p.depth === 'number') || p.multiplier !== 1 || (p.label && p.label.trim() !== ''));

        const fmtQty = (val: number | undefined, forceZero: boolean = false) => {
          if (val === undefined || val === null || isNaN(val)) return '';
          if (val === 0 && !forceZero) return '';
          return val % 1 === 0 ? val.toString() : parseFloat(val.toFixed(2)).toString();
        };
        const fmtAmt = (val: number | undefined, allowZero: boolean = false) => {
          if (val === undefined || val === null || isNaN(val)) return '';
          if (val === 0 && !allowZero) return '';
          return formatCurrency(val).replace('RM', '');
        };

        const getDimStr = (p: any, includeItemDesc: boolean = false) => {
          if (!p) return includeItemDesc ? (item.description || '') : '';
          const partsStr = [];
          const hasDimensions = (p.hasLength && typeof p.length === 'number') || (p.hasWidth && typeof p.width === 'number') || (p.hasDepth && typeof p.depth === 'number');

          if (p.hasLength && typeof p.length === 'number') partsStr.push(`${p.length}m(P)`);
          if (p.hasWidth && typeof p.width === 'number') partsStr.push(`${p.width}m(L)`);
          if (p.hasDepth && typeof p.depth === 'number') partsStr.push(`${p.depth}m(T)`);

          let str = partsStr.join(' x ');

          if (hasDimensions) {
            if (p.multiplier !== 1) str += ` x ${p.multiplier}`;
            if (p.label) str += ` - ${p.label}`;
          } else {
            let base = includeItemDesc ? item.description : '';
            let inlineParts = [];
            if (p.label) inlineParts.push(`- ${p.label}`);
            if (p.multiplier !== 1) inlineParts.push(`x ${p.multiplier}`);

            let inline = inlineParts.join(' ');
            if (base && inline) str = `${base} ${inline}`;
            else if (base) str = base;
            else {
              str = inline.trim();
              if (str.startsWith('- ')) str = str.substring(2);
            }
          }
          return str.trim();
        };

        const hasPartChanged = (p: any, pOrig: any) => {
          if (!pOrig) return true;
          return p.length !== pOrig.length || p.width !== pOrig.width || p.depth !== pOrig.depth ||
            p.multiplier !== pOrig.multiplier || p.label !== pOrig.label;
        };

        const hasChanged = isAddition || (originalItem ? (
          item.qty !== originalItem.qty || item.amount !== originalItem.amount || item.rate !== originalItem.rate ||
          activeParts.length !== activeOrigParts.length ||
          activeParts.some((p, idx) => hasPartChanged(p, activeOrigParts[idx]))
        ) : false);

        const isInlineType = !isHeader && activeParts.length === 1 &&
          !(activeParts[0].hasLength || activeParts[0].hasWidth || activeParts[0].hasDepth);

        const showSubRows = (activeParts.length > 0 || activeOrigParts.length > 0) && !isInlineType;
        const isInlineChange = isInlineType && hasChanged;
        const hideMainValues = showSubRows || isInlineChange;

        if (isInlineType && !hasChanged) {
          const p = activeParts[0];
          let inlineParts = [];
          if (p.label) inlineParts.push(`- ${p.label}`);
          if (p.multiplier !== 1) inlineParts.push(`x ${p.multiplier}`);
          let inline = inlineParts.join(' ');
          if (inline) descText += ` ${inline}`;
        }

        const showZero = !!(originalItem && (originalItem.qty || 0) > 0);
        const cellTextColor = (item.qty === 0 && showZero) ? [200, 0, 0] : textColor;

        // 1. Push Main Item Row
        tableBody.push([
          { content: autoNum, styles: { halign: 'center', valign: 'top', lineWidth: sideOnlyBorder, fontStyle: rowFontStyle as any, textColor: textColor as any } },
          { content: isInlineChange ? '' : descText, styles: { fontStyle: rowFontStyle as any, lineWidth: sideOnlyBorder, textColor: textColor as any } },
          { content: (hideMainValues || isHeader) ? '' : item.unit, styles: { halign: 'center', valign: 'top', lineWidth: sideOnlyBorder, textColor: cellTextColor as any } },
          { content: (hideMainValues || isHeader) ? '' : fmtQty(item.qty, showZero), styles: { halign: 'center', valign: 'top', lineWidth: sideOnlyBorder, textColor: cellTextColor as any } },
          { content: (hideMainValues || isHeader) ? '' : (item.rate ? formatCurrency(item.rate).replace('RM', '') : ''), styles: { halign: 'right', valign: 'top', lineWidth: sideOnlyBorder, textColor: cellTextColor as any } },
          { content: (!hasChanged && !hideMainValues && !isHeader) ? fmtAmt(item.amount, showZero) : '', styles: { halign: 'right', valign: 'top', lineWidth: sideOnlyBorder, textColor: textColor as any } },
          { content: (hideMainValues || isHeader) ? '' : fmtAmt(item.amount, showZero), styles: { halign: 'right', valign: 'top', lineWidth: sideOnlyBorder, textColor: cellTextColor as any, fontStyle: rowFontStyle as any } }
        ]);

        // 2. Push Calculation Parts with Side-by-Side logic
        if (isInlineChange) {
          if (isAddition) {
            const pCurr = activeParts[0];
            tableBody.push([
              { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
              { content: getDimStr(pCurr, true), styles: { fontsize: 6.5, fontStyle: 'bold', textColor: [0, 80, 200], lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5, left: 3 } } },
              { content: item.unit, styles: { halign: 'center', fontsize: 6.5, textColor: [0, 80, 200], lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
              { content: fmtQty(item.qty), styles: { halign: 'center', fontsize: 6.5, textColor: [0, 80, 200], lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
              { content: item.rate ? formatCurrency(item.rate).replace('RM', '') : '', styles: { halign: 'right', fontsize: 6.5, textColor: [0, 80, 200], lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
              { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
              { content: fmtAmt(item.amount, true), styles: { halign: 'right', fontsize: 6.5, textColor: [0, 80, 200], fontStyle: 'bold', lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } }
            ]);
          } else if (originalItem) {
            const pOrig = activeOrigParts[0];
            const pCurr = activeParts[0];
            const partColor = item.amount < (originalItem.amount || 0) ? [200, 0, 0] : [0, 80, 200];

            // 1. Original Line (Black)
            tableBody.push([
              { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1 } } },
              { content: getDimStr(pOrig, true), styles: { fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1, left: 3 } } },
              { content: item.unit, styles: { halign: 'center', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1 } } },
              { content: fmtQty(originalItem.qty), styles: { halign: 'center', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1 } } },
              { content: originalItem.rate ? formatCurrency(originalItem.rate).replace('RM', '') : '', styles: { halign: 'right', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1 } } },
              { content: fmtAmt(originalItem.amount), styles: { halign: 'right', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1 } } },
              { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1 } } }
            ]);
            // 2. Adjusted Line (Colored)
            tableBody.push([
              { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
              { content: getDimStr(pCurr, true), styles: { fontsize: 6.5, fontStyle: 'bold', textColor: partColor as any, lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5, left: 3 } } },
              { content: item.unit, styles: { halign: 'center', fontsize: 6.5, textColor: partColor as any, lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
              { content: fmtQty(item.qty), styles: { halign: 'center', fontsize: 6.5, textColor: partColor as any, lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
              { content: item.rate ? formatCurrency(item.rate).replace('RM', '') : '', styles: { halign: 'right', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 }, textColor: partColor as any } },
              { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
              { content: fmtAmt(item.amount, true), styles: { halign: 'right', fontsize: 6.5, textColor: partColor as any, fontStyle: 'bold', lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } }
            ]);
          }
        } else if (!isHeader && showSubRows) {
          const processedOrigIds = new Set<string>();
          activeParts.forEach(p => {
            const pOrig = activeOrigParts.find(op => op.id === p.id);
            if (pOrig) processedOrigIds.add(pOrig.id);
            let product = 1;
            if (p.hasLength && typeof p.length === 'number') product *= p.length;
            if (p.hasWidth && typeof p.width === 'number') product *= p.width;
            if (p.hasDepth && typeof p.depth === 'number') product *= p.depth;
            const pQtyVal = product * p.multiplier;
            const pAmt = pQtyVal * item.rate;
            const hasDimensions = (p.hasLength && typeof p.length === 'number') || (p.hasWidth && typeof p.width === 'number') || (p.hasDepth && typeof p.depth === 'number');
            const isPartInlineType = !hasDimensions && activeParts.length === 1;
            const dimStr = getDimStr(p, isPartInlineType);

            if (isAddition) {
              tableBody.push([
                { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
                { content: dimStr, styles: { fontsize: 6.5, fontStyle: 'bold', textColor: [0, 80, 200], lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5, left: 3 } } },
                { content: item.unit, styles: { halign: 'center', fontsize: 6.5, textColor: [0, 80, 200], lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
                { content: fmtQty(pQtyVal), styles: { halign: 'center', fontsize: 6.5, textColor: [0, 80, 200], lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
                { content: item.rate ? formatCurrency(item.rate).replace('RM', '') : '', styles: { halign: 'right', fontsize: 6.5, textColor: [0, 80, 200], lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
                { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
                { content: fmtAmt(pAmt, true), styles: { halign: 'right', fontsize: 6.5, textColor: [0, 80, 200], fontStyle: 'bold', lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } }
              ]);
            } else if (!pOrig) {
              tableBody.push([
                { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
                { content: dimStr, styles: { fontsize: 6.5, fontStyle: 'bold', textColor: [0, 80, 200], lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5, left: 3 } } },
                { content: item.unit, styles: { halign: 'center', fontsize: 6.5, textColor: [0, 80, 200], lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
                { content: fmtQty(pQtyVal), styles: { halign: 'center', fontsize: 6.5, textColor: [0, 80, 200], lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
                { content: item.rate ? formatCurrency(item.rate).replace('RM', '') : '', styles: { halign: 'right', fontsize: 6.5, textColor: [0, 80, 200], lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
                { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
                { content: fmtAmt(pAmt, true), styles: { halign: 'right', fontsize: 6.5, textColor: [0, 80, 200], fontStyle: 'bold', lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } }
              ]);
            } else if (hasPartChanged(p, pOrig)) {
              let origProd = 1; if (pOrig.hasLength) origProd *= pOrig.length; if (pOrig.hasWidth) origProd *= pOrig.width; if (pOrig.hasDepth) origProd *= pOrig.depth;
              const pOrigAmt = (origProd * pOrig.multiplier) * (originalItem?.rate || 0);
              const partColor = pAmt < pOrigAmt ? [200, 0, 0] : [0, 80, 200];
              const dimStrOrig = getDimStr(pOrig, false);

              tableBody.push([
                { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1 } } },
                { content: dimStrOrig, styles: { fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1, left: 3 } } },
                { content: item.unit, styles: { halign: 'center', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1 } } },
                { content: fmtQty(origProd * pOrig.multiplier), styles: { halign: 'center', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1 } } },
                { content: originalItem?.rate ? formatCurrency(originalItem.rate).replace('RM', '') : '', styles: { halign: 'right', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1 } } },
                { content: fmtAmt(pOrigAmt), styles: { halign: 'right', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1 } } },
                { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1 } } }
              ]);
              tableBody.push([
                { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
                { content: dimStr, styles: { fontsize: 6.5, fontStyle: 'bold', textColor: partColor as any, lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5, left: 3 } } },
                { content: item.unit, styles: { halign: 'center', fontsize: 6.5, textColor: partColor as any, lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
                { content: fmtQty(pQtyVal), styles: { halign: 'center', fontsize: 6.5, textColor: partColor as any, lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
                { content: item.rate ? formatCurrency(item.rate).replace('RM', '') : '', styles: { halign: 'right', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 }, textColor: partColor as any } },
                { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
                { content: fmtAmt(pAmt, true), styles: { halign: 'right', fontsize: 6.5, textColor: partColor as any, fontStyle: 'bold', lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } }
              ]);
            } else {
              tableBody.push([
                { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0, bottom: 0.5 } } },
                { content: dimStr, styles: { fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0, bottom: 0.5, left: 3 } } },
                { content: item.unit, styles: { halign: 'center', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0, bottom: 0.5 } } },
                { content: fmtQty(pQtyVal), styles: { halign: 'center', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0, bottom: 0.5 } } },
                { content: item.rate ? formatCurrency(item.rate).replace('RM', '') : '', styles: { halign: 'right', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0, bottom: 0.5 } } },
                { content: fmtAmt(pAmt), styles: { halign: 'right', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0, bottom: 0.5 } } },
                { content: fmtAmt(pAmt), styles: { halign: 'right', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0, bottom: 0.5 } } }
              ]);
            }
          });
          activeOrigParts.forEach(pOrig => {
            if (!processedOrigIds.has(pOrig.id)) {
              let origProd = 1; if (pOrig.hasLength) origProd *= pOrig.length; if (pOrig.hasWidth) origProd *= pOrig.width; if (pOrig.hasDepth) origProd *= pOrig.depth;
              const pOrigAmt = (origProd * pOrig.multiplier) * (originalItem?.rate || 0);
              const dimStrOrig = getDimStr(pOrig, false);
              tableBody.push([
                { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1 } } },
                { content: dimStrOrig, styles: { fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1, left: 3 } } },
                { content: item.unit, styles: { halign: 'center', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1 } } },
                { content: fmtQty(origProd * pOrig.multiplier), styles: { halign: 'center', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1 } } },
                { content: originalItem?.rate ? formatCurrency(originalItem.rate).replace('RM', '') : '', styles: { halign: 'right', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1 } } },
                { content: fmtAmt(pOrigAmt), styles: { halign: 'right', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1 } } },
                { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1 } } }
              ]);
              tableBody.push([
                { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
                { content: dimStrOrig, styles: { fontsize: 6.5, fontStyle: 'bold', textColor: [200, 0, 0], lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5, left: 3 } } },
                { content: item.unit, styles: { halign: 'center', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 }, textColor: [200, 0, 0] } },
                { content: '0', styles: { halign: 'center', fontsize: 6.5, textColor: [200, 0, 0], lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
                { content: item.rate ? formatCurrency(item.rate).replace('RM', '') : '', styles: { halign: 'right', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 }, textColor: [200, 0, 0] } },
                { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
                { content: '0.00', styles: { halign: 'right', fontsize: 6.5, textColor: [200, 0, 0], fontStyle: 'bold', lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } }
              ]);
            }
          });
        }
      });
      const billTotal = bill.items.reduce((s, i) => s + (i.amount || 0), 0);
      const originalBillTotal = originalBill?.items.reduce((s, i) => s + (i.amount || 0), 0) || 0;

      let tableStartY = 15;
      if (pelSectionIdx === 0) {
        // @ts-ignore
        doc.autoTable({
          body: [[{ content: `${formData.namaProjek?.toUpperCase()}`, colSpan: 7, styles: { halign: 'center', fontStyle: 'bold', fontSize: 8 } }]],
          theme: 'grid', startY: 15, styles: { lineWidth: 0.1, lineColor: 0 }, margin: { left: 10, right: 10 }
        });
        // @ts-ignore
        tableStartY = doc.lastAutoTable.finalY;
      }

      const complexHead = [
        [{ content: 'LOKASI', colSpan: 4, styles: { halign: 'center', fontStyle: 'bold', fontSize: 7 } }, { content: 'ADUAN', colSpan: 3, styles: { halign: 'center', fontStyle: 'bold', fontSize: 7.5 } }],
        [{ content: locText, colSpan: 4, styles: { halign: 'center', fontSize: 7 } }, { content: aduanText, colSpan: 3, styles: { halign: 'center', fontSize: 7.5 } }],
        ['BIL', 'KETERANGAN', 'UNIT', 'KUANTITI', 'KADAR (RM)', 'ASAL (RM)', 'JUMLAH (RM)']
      ];

      const footerHeight = 8; const distBottom = 20; const footerY = pageHeight - distBottom - footerHeight;

      // @ts-ignore
      doc.autoTable({
        head: complexHead, body: tableBody, theme: 'plain', startY: tableStartY, rowPageBreak: 'avoid', showHead: 'everyPage',
        margin: { top: 20, left: 10, right: 10, bottom: distBottom + footerHeight + 5 },
        styles: { fontSize: 6.3, cellPadding: 0.6, textColor: 0 },
        headStyles: { fillColor: 255, textColor: 0, fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 9 }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 10 }, 3: { cellWidth: 15 }, 4: { cellWidth: 15 }, 5: { cellWidth: 20 }, 6: { cellWidth: 20 } },
        didDrawCell: (data) => {
          doc.setDrawColor(0); doc.setLineWidth(0.1);
          doc.line(data.cell.x, data.cell.y, data.cell.x, data.cell.y + data.cell.height);
          doc.line(data.cell.x + data.cell.width, data.cell.y, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
          if (data.section === 'head' || (data.section === 'body' && data.row.index === 0)) {
            doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
            doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
          }
        }
      });

      // @ts-ignore
      const finalY = doc.lastAutoTable.finalY;
      if (finalY < footerY) {
        const xPositions = [10, 19, 120, 130, 145, 160, 180, 200];
        doc.setLineWidth(0.1); doc.setDrawColor(0);
        xPositions.forEach(x => { doc.line(x, finalY, x, footerY); });
      }

      // @ts-ignore
      doc.autoTable({
        body: [[
          { content: 'TO COLLECTION', styles: { fontStyle: 'bold', halign: 'right', lineWidth: 0.1 } },
          { content: originalBillTotal === 0 ? '' : formatCurrency(originalBillTotal).replace('RM', ''), styles: { fontStyle: 'bold', halign: 'right', lineWidth: 0.1 } },
          { content: billTotal === 0 ? '' : formatCurrency(billTotal).replace('RM', ''), styles: { fontStyle: 'bold', halign: 'right', lineWidth: 0.1 } }
        ]],
        startY: footerY, theme: 'grid', styles: { fontSize: 7, cellPadding: 0.8, lineColor: 0, lineWidth: 0.1, textColor: 0 },
        columnStyles: { 0: { cellWidth: 150 }, 1: { cellWidth: 20 }, 2: { cellWidth: 20 } },
        margin: { left: 10, right: 10 }, showHead: false
      });
      pelSectionIdx++;
    }

    // --- SUMMARY PAGE ---
    doc.addPage();
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("RINGKASAN", pageWidth / 2, 20, { align: "center" });

    const summaryBody = pelarasanData.map(b => {
      const orig = originalData.find(ob => ob.id === b.id)?.items.reduce((s, i) => s + (i.amount || 0), 0) || 0;
      const laras = b.items.reduce((s, i) => s + (i.amount || 0), 0);
      const diff = parseFloat((laras - orig).toFixed(2));
      return [
        { content: b.title, styles: { fontStyle: 'bold' } },
        { content: formatCurrency(orig).replace('RM', ''), styles: { halign: 'right' } },
        { content: formatCurrency(laras).replace('RM', ''), styles: { halign: 'right', fontStyle: 'bold' } },
        { content: Math.abs(diff) < 0.01 ? '-' : (diff > 0 ? '+' : '') + formatCurrency(diff).replace('RM', ''), styles: { halign: 'right', fontStyle: 'bold', textColor: diff > 0.01 ? [0, 80, 200] : (diff < -0.01 ? [200, 0, 0] : [0, 0, 0]) } }
      ];
    });

    const grandTotalOrig = originalData.reduce((acc, g) => acc + g.items.reduce((s, i) => s + (i.amount || 0), 0), 0);
    const grandTotalLaras = pelarasanData.reduce((acc, g) => acc + g.items.reduce((s, i) => s + (i.amount || 0), 0), 0);
    const grandTotalDiff = parseFloat((grandTotalLaras - grandTotalOrig).toFixed(2));

    // @ts-ignore
    doc.autoTable({
      startY: 30, head: [['KETERANGAN', 'ASAL (RM)', 'LARAS (RM)', 'BEZA (+/-)']], body: summaryBody,
      foot: [[
        { content: 'JUMLAH KESELURUHAN', styles: { halign: 'center' } },
        { content: formatCurrency(grandTotalOrig).replace('RM', ''), styles: { halign: 'right' } },
        { content: formatCurrency(grandTotalLaras).replace('RM', ''), styles: { halign: 'right' } },
        { content: Math.abs(grandTotalDiff) < 0.01 ? '-' : (grandTotalDiff > 0 ? '+' : '') + formatCurrency(grandTotalDiff).replace('RM', ''), styles: { halign: 'right' } }
      ]],
      theme: 'grid', styles: { fontSize: 8, cellPadding: 1.5, lineColor: 0, lineWidth: 0.1 },
      headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
      footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
      margin: { left: 15, right: 15 }
    });

    let y = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(0); doc.text("HARGA AKHIR", 20, y);
    const valBQAsal = Number(grandTotalOrig) || 0;
    const valBQLarasRaw = Number(grandTotalLaras) || 0;
    const valPotongan = valBQAsal - valBQLarasRaw;
    const valWT = Number(formData.wangTahanan) || 0;
    const valLAD = Number(formData.ladAmount) || 0;
    const valLoC = Number(formData.locAmount) || 0;
    const valBase = Math.min(valBQLarasRaw, valBQAsal);
    const finalPayment = valBase - valWT - valLAD - valLoC;

    const calculationData = [
      ["HARGA KONTRAK", formatCurrency(valBQAsal).replace('RM', '').trim()],
      ["POTONGAN", valPotongan > 0 ? formatCurrency(valPotongan).replace('RM', '').trim() : '-'],
      ["WANG TAHANAN", valWT > 0 ? `-${formatCurrency(valWT).replace('RM', '').trim()}` : '-'],
      ["LAD", valLAD > 0 ? `-${formatCurrency(valLAD).replace('RM', '').trim()}` : '-'],
      ["LOC", valLoC > 0 ? `-${formatCurrency(valLoC).replace('RM', '').trim()}` : '-'],
      [{ content: "JUMLAH DIBAYAR", styles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: 0 } }, { content: formatCurrency(finalPayment).replace('RM', '').trim(), styles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: 0 } }]
    ];

    // @ts-ignore
    doc.autoTable({
      startY: y + 5, body: calculationData, theme: 'grid', styles: { fontSize: 8, cellPadding: 1.2, lineColor: 0, lineWidth: 0.1, textColor: 0 },
      columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 40, halign: 'right' } }, margin: { left: 20, right: 20 }
    });

    y = doc.lastAutoTable.finalY + 15;
    const notes = "Sebelum kerja-kerja dimulakan pemborong dikehendaki melawat tapak bersama dengan Penolong Jurutera kawasan untuk mempastikan tempat dan menyelesaikan masalah berbangkit di tapak sebelum memulakan kerja. Kontraktor adalah dikecualikan daripada mengemukakkan Bon Perlaksanaan. Walaubagaimanapun, tempoh tanggungan kecacatan seperti di bawah juga dikenakan kepada kontraktor dan syarat ini hendaklah dinyatakan dalam surat tawaran.\n( Rujuk Kementerian Kewangan Surat Pekeliling Perbendaharaan Bil 3 Tahun 2007)";

    // @ts-ignore
    doc.autoTable({
      startY: y, margin: { left: 20, right: 20 }, body: [[notes]], theme: 'plain',
      styles: { fontSize: 9, font: "helvetica", halign: 'justify', cellPadding: 0 },
      columnStyles: { 0: { cellWidth: 170 } }
    });

    y = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text("Nilai Projek", 20, y); doc.text("Tempoh Tanggungan Kecacatan", 100, y);
    y += 5; doc.setFont("helvetica", "normal");
    doc.text("RM 10,000 - RM 100,000", 20, y); doc.text("6 Bulan dari tarikh kerja diperakukan siap", 100, y);
    y += 5; doc.text("Melebihi RM 100,000", 20, y); doc.text("12 bulan dari tarikh kerja diperakukan siap", 100, y);

    y = 250; doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("Disediakan oleh", 20, y); doc.text("Disemak oleh,", 120, y);
    y += 20; doc.line(20, y, 80, y); doc.line(120, y, 180, y);
    doc.save(`BQ_Pelarasan_${formData.noFail || 'Draft'}.pdf`);
  };

  const grandTotal = formData.bqData?.reduce((acc, group) => {
    const gSum = group.items.reduce((itemSum, item) => {
      // Robust calculation: use amount if present, otherwise derive from qty * rate
      let val = Number(item.amount);
      if (!val || isNaN(val)) {
        val = (Number(item.qty) || 0) * (Number(item.rate) || 0);
      }
      return itemSum + (isNaN(val) ? 0 : val);
    }, 0);
    return acc + gSum;
  }, 0) || 0;
  const finalTotalDisplay = formData.kosSebenar;

  const actionButtons = (
    <div className="flex items-center gap-2">
      <button onClick={handleBackClick} className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 p-2 rounded-lg font-bold text-xs shadow-sm transition-colors flex items-center justify-center" title="Kembali ke Senarai"> <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline ml-1">Kembali</span> </button>
      {!isGlobalReadOnly && (
        <button onClick={handleSaveClick} disabled={isSaving} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white p-2 rounded-lg font-bold text-xs shadow-md shadow-emerald-500/30 transition-colors flex items-center justify-center" title="Simpan Projek"> <Save className="w-4 h-4" /> <span className="hidden sm:inline ml-1">{isSaving ? '...' : 'Simpan'}</span> </button>
      )}
    </div>
  );

  const exportAction = (
    <button onClick={handleExportPDF} disabled={isExporting} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg font-bold shadow-md transition-colors disabled:opacity-70 disabled:scale-100 text-xs" > {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} <span>PDF</span> </button>
  );

  const inputClass = "w-full px-4 py-3 rounded-lg bg-white border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors text-slate-900 placeholder-slate-400 text-sm shadow-sm disabled:bg-slate-50 disabled:cursor-not-allowed";
  const labelClass = "block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-jakarta";
  const yellowPhaseClass = "bg-white/80 border border-yellow-500/30 p-8 rounded-3xl animate-fade-in shadow-xl relative overflow-hidden";
  const bluePhaseClass = "bg-white/80 border border-blue-500/30 p-8 rounded-3xl animate-fade-in shadow-xl relative overflow-hidden";
  const orangePhaseClass = "bg-white/80 border border-orange-500/30 p-8 rounded-3xl animate-fade-in shadow-xl relative overflow-hidden";

  const isDataMissing = (!formData.bqData || formData.bqData.length === 0);
  const isStillLoading = isVerifying || (formData.kosProjek > 0 && isDataMissing);

  return (
    <div className="relative min-h-screen text-slate-900 pb-20">
      {/* Loading Overlay (Data-Driven for Slow Connections) */}
      {isStillLoading && (
        <div className="fixed inset-0 z-[100] bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-500">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-emerald-500/10 border border-slate-100 flex flex-col items-center gap-6 max-w-sm mx-auto">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-slate-100 border-t-emerald-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Database className="w-6 h-6 text-emerald-600 animate-pulse" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-jakarta font-bold text-slate-800">Menyalin Data...</h3>
              <p className="text-sm text-slate-500 leading-relaxed px-4">
                Sila tunggu sebentar sementara maklumat penuh projek sedang diproses. <br/> Ini mungkin mengambil masa pada sambungan perlahan.
              </p>
            </div>
          </div>
        </div>
      )}
      <CostHUD
        grandTotal={grandTotal}
        finalTotal={activeTab === 'phase3' ? finalTotalDisplay : undefined}
        status={formData.status}
        progress={formData.peratusSiap || 0}
        onStatusChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
        onProgressChange={(val) => setFormData({ ...formData, peratusSiap: val })}
        saveAction={actionButtons}
        exportAction={exportAction}
        isPelarasanActive={activeTab === 'phase3'}
        isReadOnly={isGlobalReadOnly}
        isVerifying={isVerifying}
        hasFullData={formData.bqData && formData.bqData.length > 0}
        showRemoteUpdateNotice={showRemoteUpdateNotice}
        onApplyRemoteUpdate={handleApplyRemoteUpdate}
        hasUnsavedChanges={hasUnsavedChanges}
        isNewProject={!project}
      />
      <div className="pt-24">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 px-2 no-print gap-4">
          <div className="flex items-center gap-4">
            <div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1.5 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></div>
                <div className="relative" ref={switcherRef}>
                  <button
                    onClick={() => project && setIsSwitcherOpen(!isSwitcherOpen)}
                    className={`flex flex-col items-start transition-all ${project ? 'hover:bg-slate-50 p-2 -m-2 rounded-xl group/title' : ''}`}
                    disabled={!project}
                  >
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        {project ? 'Kemaskini Projek' : 'Daftar Projek Baru'}
                        {project && <ChevronDown className={`w-4 h-4 text-slate-400 group-hover/title:text-emerald-500 transition-all ${isSwitcherOpen ? 'rotate-180' : ''}`} />}
                      </h1>
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-0.5 uppercase tracking-wider">
                      {formData.noFail || 'No. Fail Belum Ditetapkan'}
                    </p>
                  </button>

                  {isSwitcherOpen && (
                    <div className="absolute top-full left-0 mt-3 w-[400px] md:w-[600px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] animate-slide-up overflow-hidden">
                      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <div className="relative mb-3">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Cari No. Fail atau Nama Projek..."
                            value={switcherSearchQuery}
                            onChange={(e) => setSwitcherSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                            autoFocus
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={showSiapProjects}
                              onChange={(e) => setShowSiapProjects(e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300"
                            />
                            <span className="text-xs font-bold text-slate-600">Tunjuk Projek Siap</span>
                          </label>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{filteredSwitcherProjects.length} Projek Dijumpai</span>
                        </div>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
                        {filteredSwitcherProjects.length > 0 ? (
                          filteredSwitcherProjects.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => handleProjectSwitch(p)}
                              className={`w-full text-left p-3 rounded-xl transition-all mb-1 group/item ${p.id === project?.id ? 'bg-emerald-50 ring-1 ring-emerald-500/20' : 'hover:bg-slate-50'}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${p.status === ProjectStatus.SIAP ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2 mb-0.5">
                                    <span className="text-[10px] font-black text-slate-400 font-mono uppercase tracking-tighter">{p.noFail}</span>
                                    {p.id === project?.id && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded uppercase">Aktif</span>}
                                  </div>
                                  <h4 className="text-xs font-bold text-slate-800 leading-normal line-clamp-2 md:line-clamp-none group-hover/item:text-emerald-700 transition-colors">
                                    {p.namaProjek}
                                  </h4>
                                </div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-8 text-center">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                              <Search className="w-6 h-6 text-slate-300" />
                            </div>
                            <p className="text-sm font-bold text-slate-400">Tiada projek yang sepadan.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            </div>
          </div>
          {isGlobalReadOnly && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-200 text-xs font-bold shadow-sm">
              <Lock className="w-4 h-4" /> Mode Paparan Sahaja
            </div>
          )}
        </div>
        
        {/* Warning Notice & Certificate Status Card */}
        {(() => {
          const hasTamatDate = !!formData.tarikhTamatKontrak;
          
          // Calculate triggered dates if tamat date is filled
          let p1Str = '-';
          let tamatStr = '-';
          let p2Str = '-';
          let p3Str = '-';
          
          if (hasTamatDate) {
            const tamatDateObj = new Date(formData.tarikhTamatKontrak!);
            if (!isNaN(tamatDateObj.getTime())) {
              tamatStr = formatDate(formData.tarikhTamatKontrak!);
              
              const p1Date = new Date(tamatDateObj);
              p1Date.setDate(tamatDateObj.getDate() - 7);
              p1Str = formatDate(p1Date.toISOString().split('T')[0]);
              
              const p2Date = new Date(tamatDateObj);
              p2Date.setDate(tamatDateObj.getDate() + 7);
              p2Str = formatDate(p2Date.toISOString().split('T')[0]);
              
              const p3Date = new Date(tamatDateObj);
              p3Date.setDate(tamatDateObj.getDate() + 14);
              p3Str = formatDate(p3Date.toISOString().split('T')[0]);
            }
          }
          
          const isAdminOrJurutera = currentUser?.role === Role.ADMIN || currentUser?.role === Role.JURUTERA;
          const isNoticeReadOnly = isGlobalReadOnly || !isAdminOrJurutera || formData.status === ProjectStatus.SIAP;
          
          const handleNoticeStatusChange = (field: string, val: string) => {
            setFormData(prev => ({
              ...prev,
              [field]: val
            }));
            setHasUnsavedChanges(true);
          };
          
          const selectClass = "px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none text-xs font-bold text-slate-700 cursor-pointer focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-100 disabled:cursor-not-allowed transition-all";
          
          return (
            <div className="mb-6 bg-white/95 border border-slate-200 shadow-xl rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-red-500 to-rose-600"></div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-rose-50 to-red-50 text-red-600 rounded-xl flex items-center justify-center shadow-sm">
                    <FileWarning className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm tracking-tight font-jakarta">Status Notis Peringatan & Perakuan Kontrak</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Urus kelulusan dan rekod notis peringatan rasmi</p>
                  </div>
                </div>
                {!hasTamatDate && (
                  <div className="text-[10px] text-amber-700 font-black bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-xl uppercase tracking-wider">
                    Tarikh tamat kontrak belum diisi
                  </div>
                )}
              </div>
              
              {hasTamatDate ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Notice 1 */}
                    <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100 flex flex-col gap-2">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Notis Peringatan Pertama</span>
                        <span className="text-[10px] font-bold text-slate-600">Automatik: {p1Str}</span>
                      </div>
                      <select
                        value={formData.notisPeringatan1Status || 'PENDING'}
                        onChange={(e) => handleNoticeStatusChange('notisPeringatan1Status', e.target.value)}
                        disabled={isNoticeReadOnly}
                        className={selectClass}
                      >
                        <option value="PENDING">Belum Diambil Tindakan</option>
                        <option value="SENT">Selesai Dikeluarkan</option>
                        <option value="NOT_REQUIRED">Tidak Diperlukan</option>
                      </select>
                    </div>
                    
                    {/* Perakuan Kerja Tidak Siap */}
                    <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100 flex flex-col gap-2">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Perakuan Kerja Tidak Siap</span>
                        <span className="text-[10px] font-bold text-slate-600">Automatik: {tamatStr}</span>
                      </div>
                      <select
                        value={formData.perakuanKerjaTidakSiapStatus || 'PENDING'}
                        onChange={(e) => handleNoticeStatusChange('perakuanKerjaTidakSiapStatus', e.target.value)}
                        disabled={isNoticeReadOnly}
                        className={selectClass}
                      >
                        <option value="PENDING">Belum Diambil Tindakan</option>
                        <option value="SENT">Selesai Dikeluarkan</option>
                        <option value="NOT_REQUIRED">Tidak Diperlukan</option>
                      </select>
                    </div>
                    
                    {/* Notice 2 */}
                    <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100 flex flex-col gap-2">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Notis Peringatan Kedua</span>
                        <span className="text-[10px] font-bold text-slate-600">Automatik: {p2Str}</span>
                      </div>
                      <select
                        value={formData.notisPeringatan2Status || 'PENDING'}
                        onChange={(e) => handleNoticeStatusChange('notisPeringatan2Status', e.target.value)}
                        disabled={isNoticeReadOnly}
                        className={selectClass}
                      >
                        <option value="PENDING">Belum Diambil Tindakan</option>
                        <option value="SENT">Selesai Dikeluarkan</option>
                        <option value="NOT_REQUIRED">Tidak Diperlukan</option>
                      </select>
                    </div>
                    
                    {/* Notice 3 */}
                    <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100 flex flex-col gap-2">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Notis Peringatan Ketiga</span>
                        <span className="text-[10px] font-bold text-slate-600">Automatik: {p3Str}</span>
                      </div>
                      <select
                        value={formData.notisPeringatan3Status || 'PENDING'}
                        onChange={(e) => handleNoticeStatusChange('notisPeringatan3Status', e.target.value)}
                        disabled={isNoticeReadOnly}
                        className={selectClass}
                      >
                        <option value="PENDING">Belum Diambil Tindakan</option>
                        <option value="SENT">Selesai Dikeluarkan</option>
                        <option value="NOT_REQUIRED">Tidak Diperlukan</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2.5 pt-2">
                    <input
                      type="checkbox"
                      id="isTiadaNotisDiperlukan"
                      checked={formData.isTiadaNotisDiperlukan || false}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          isTiadaNotisDiperlukan: e.target.checked
                        }));
                        setHasUnsavedChanges(true);
                      }}
                      disabled={isNoticeReadOnly}
                      className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <label htmlFor="isTiadaNotisDiperlukan" className="text-xs font-bold text-slate-600 select-none cursor-pointer">
                      Tiada Sebarang Notis Diperlukan (Bypass Semua)
                    </label>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Sila isikan **Tarikh Tamat Kontrak** dalam Tab **File Creation (Fasa 2)** terlebih dahulu.
                  Status notis amaran kontrak akan dipaparkan dan dijana secara automatik selepas tarikh tamat diisi.
                </p>
              )}
            </div>
          );
        })()}
        
        <div className="mb-6">
          <div className="grid grid-cols-4 bg-slate-100 p-1 rounded-2xl gap-2 border border-slate-200">
            {TABS.map((tab) => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-2 py-3 md:px-4 md:py-3 rounded-xl text-[10px] md:text-xs font-bold transition-colors flex flex-col md:flex-row items-center justify-center gap-2 border border-transparent ${activeTab === tab.id ? `${tab.color}` : 'text-slate-500 hover:bg-slate-200 hover:text-slate-900'}`} > {tab.label} </button>))}
          </div>
        </div>
        {activeTab === 'phase1' && (
          <div className="space-y-4">
            <div className={yellowPhaseClass}>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>
              <h3 className="text-lg font-bold text-yellow-600 mb-6 flex items-center gap-3"> <Zap className="h-5 w-5" /> Maklumat Asas (PJA) </h3>
              <div className="flex flex-col gap-6">
                <div className="group w-full"> <label className={labelClass}>Cadangan Kerja (Nama Projek)</label> <textarea name="namaProjek" value={formData.namaProjek || ''} onChange={handleInputChange} onBlur={handleInputBlur} disabled={isGlobalReadOnly} className={`${inputClass} min-h-[60px] text-sm font-bold resize-y uppercase`} placeholder="CADANGAN KERJA-KERJA..." /> </div>
                <div className="group w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2"> <div className="w-1 h-3 bg-emerald-500 rounded-full"></div> <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Lokasi & No. Aduan</label> </div>
                    {!isGlobalReadOnly && (
                      <button type="button" onClick={addLocationRow} className="text-[10px] flex items-center gap-1 bg-white border border-slate-200 text-emerald-600 px-3 py-1.5 rounded-lg hover:bg-emerald-50 font-bold transition-colors shadow-sm" > <Plus className="w-3 h-3" /> Tambah Lokasi </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                    {locationRows.map((row, idx) => (
                      <div key={row.id} className="flex flex-col md:flex-row gap-2 items-start animate-fade-in group/row">
                        <div className="w-full md:flex-[2] relative"> <span className="absolute left-3 top-3.5 text-xs font-bold text-slate-400 select-none">{idx + 1}.</span> <input type="text" value={row.lokasi} onChange={(e) => updateLocationRow(row.id, 'lokasi', e.target.value)} disabled={isGlobalReadOnly} className={`${inputClass} pl-8 py-2 text-xs ${!row.lokasi ? 'border-red-200 focus:border-red-500' : ''}`} placeholder="Lokasi" required /> </div>
                        <div className="w-full md:flex-1 flex gap-2"> <input type="text" value={row.aduan} onChange={(e) => updateLocationRow(row.id, 'aduan', e.target.value)} disabled={isGlobalReadOnly} className={`${inputClass} py-2 text-xs`} placeholder="Aduan" /> {!isGlobalReadOnly && <button type="button" onClick={() => removeLocationRow(row.id)} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-white border border-transparent hover:border-red-100 transition-colors shadow-sm" title="Padam Baris" > <X className="w-4 h-4" /> </button>} </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="group"> <label className={labelClass}>BP</label> <select name="bp" value={formData.bp || ''} onChange={handleInputChange} disabled={isGlobalReadOnly} className={`${inputClass} py-2 font-bold`}> <option value="">Pilih...</option> {BP_OPTIONS.map(bp => <option key={bp} value={bp}>{bp}</option>)} </select> </div>
                  <div className="group" ref={zonDropdownRef}>
                    <label className={labelClass}>Zon</label>
                    <div className="relative">
                      <div
                        className={`${inputClass} py-2 font-bold cursor-pointer flex items-center justify-between min-h-[42px] ${isGlobalReadOnly ? 'bg-slate-50' : ''}`}
                        onClick={() => !isGlobalReadOnly && setIsZonDropdownOpen(!isZonDropdownOpen)}
                      >
                        <span className={`${!formData.zon ? 'text-slate-400 font-normal' : ''} truncate pr-2`}>
                          {formData.zon || 'Pilih...'}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isZonDropdownOpen ? 'rotate-180' : ''}`} />
                      </div>

                      {isZonDropdownOpen && createPortal(
                        <div
                          ref={zonPortalRef}
                          className="fixed bg-white border border-slate-200 rounded-xl shadow-2xl z-[9999] max-h-64 overflow-y-auto p-2 grid grid-cols-2 gap-1 w-72"
                          style={{
                            top: zonDropdownRef.current ? zonDropdownRef.current.getBoundingClientRect().bottom + 5 : 0,
                            left: zonDropdownRef.current ? zonDropdownRef.current.getBoundingClientRect().left : 0
                          }}
                        >
                          {ZON_OPTIONS.map(z => {
                            const currentZons = formData.zon ? formData.zon.split(', ').filter(Boolean) : [];
                            const isChecked = currentZons.includes(z);

                            return (
                              <div
                                key={z}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  let nextZons;
                                  if (isChecked) {
                                    nextZons = currentZons.filter(item => item !== z);
                                  } else {
                                    nextZons = [...currentZons, z].sort((a, b) => {
                                      const numA = parseInt(a.replace('Zon ', ''));
                                      const numB = parseInt(b.replace('Zon ', ''));
                                      return numA - numB;
                                    });
                                  }
                                  setFormData(prev => ({ ...prev, zon: nextZons.join(', ') }));
                                  setHasUnsavedChanges(true);
                                }}
                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer ${isChecked ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-50 text-slate-600'}`}
                              >
                                <span className="text-[11px] font-bold select-none">{z}</span>
                                {isChecked && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                              </div>
                            );
                          })}
                        </div>,
                        document.body
                      )}
                    </div>
                  </div>
                  <div className="group"> <label className={labelClass}>Mukim</label> <select name="mukim" value={formData.mukim || ''} onChange={handleInputChange} disabled={isGlobalReadOnly} className={`${inputClass} py-2 font-bold`}> <option value="">Pilih...</option> {MUKIM_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)} </select> </div>
                  <div className="group"> <label className={labelClass}>Tarikh Buka</label> <StrictDateInput name="tarikhBuka" value={formData.tarikhBuka || ''} onChange={handleInputChange} disabled={isGlobalReadOnly} className={`${inputClass} py-2 font-bold`} /> </div>

                  <div className="group">
                    <label className={labelClass}>Pegawai (PJA)</label>
                    <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm transition-colors hover:border-emerald-300">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shrink-0 overflow-hidden shadow-md text-white font-black">
                        {users.find(u => u.id === formData.pjaId)?.avatarUrl ? (
                          <img src={users.find(u => u.id === formData.pjaId)?.avatarUrl} alt="PJA" className="w-full h-full object-cover" />
                        ) : (
                          users.find(u => u.id === formData.pjaId)?.username?.substring(0, 2).toUpperCase() || 'PJA'
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <select name="pjaId" value={formData.pjaId || ''} onChange={handlePjaChange} disabled={isPJA || isGlobalReadOnly} className="w-full bg-transparent border-none outline-none text-xs font-bold text-slate-800 cursor-pointer p-0 m-0" >
                          <option value="">Pilih PJA...</option>
                          {users.map(u => (<option key={u.id} value={u.id}> {u.username.toUpperCase()} </option>))}
                        </select>
                        {users.find(u => u.id === formData.pjaId) && <p className="text-[9px] text-slate-400 font-bold uppercase truncate">{users.find(u => u.id === formData.pjaId)?.role.toLowerCase()}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div id="pdf-export-container" className="flex flex-col items-center gap-0 w-full">
              <div className="rounded-[2rem] border border-slate-200 shadow-2xl bg-white/50 flex flex-col h-auto overflow-visible w-full">
                <div className="bg-white/80 p-4 border-b border-slate-200 flex items-center justify-between shrink-0 rounded-t-[2rem]"> <div className="flex items-center gap-4"> <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20"> <Calculator className="w-5 h-5" /> </div> <div> <h3 className="font-bold text-slate-900 text-lg tracking-tight">Penyediaan BQ</h3> <p className="text-xs text-slate-500 font-medium">Wizard Mode</p> </div> </div> </div>
                <div className="bg-slate-50/50 flex-1 relative rounded-b-[2rem]"> <BQEditor initialData={formData.bqData} onDataChange={handleBQChange} projectData={formData as Project} isPrintView={false} locationRows={locationRows} onLocationDimensionsChange={handleLocationDimensionsChange} onShowToast={onShowToast} readOnly={isGlobalReadOnly} /> </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'phase2' && (
          <div className="space-y-6">
            <div className={bluePhaseClass}>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
              <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-8 gap-4"> <h3 className="text-lg font-bold text-blue-600 flex items-center gap-3"> <Folder className="h-5 w-5" /> Maklumat Fail & Kontrak (PT) </h3> <button onClick={() => setIsNotisOpen(true)} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-colors shadow-red-500/20" > <Megaphone className="w-4 h-4" /> Jana Notis </button> </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-8">
                <div className="group"> <label className={labelClass}>No. Fail</label> <input type="text" name="noFail" value={formData.noFail || ''} onChange={handleInputChange} disabled={isPTSectionReadOnly} className={inputClass} /> </div>
                <div className="group lg:col-span-2"> <label className={labelClass}>Nama Syarikat</label> <select name="namaSyarikat" value={formData.namaSyarikat || ''} onChange={handleInputChange} disabled={isPTSectionReadOnly} className={inputClass}> <option value="">Pilih Syarikat...</option> {companies.map(c => <option key={c} value={c}>{c}</option>)} </select> </div>
                <div className="group"> <label className={labelClass}>Bulan</label> <select name="bulan" value={formData.bulan || ''} onChange={handleInputChange} disabled={isPTSectionReadOnly} className={inputClass}> <option value="">Pilih...</option> {['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'].map(m => (<option key={m} value={m}>{m}</option>))} </select> </div>
                <div className="group"> <label className={labelClass}>No. Vot</label> <select name="noVote" value={formData.noVote || ''} onChange={handleInputChange} disabled={isPTSectionReadOnly} className={inputClass}> <option value="">Pilih Vot...</option> {voteNumbers.map(v => <option key={v.code} value={v.code}>{v.code} ({v.name})</option>)} </select> </div>
                <div className="group"> <label className={labelClass}>Tarikh Lantikan</label> <StrictDateInput name="tarikhLantikan" value={formData.tarikhLantikan || ''} onChange={handleInputChange} disabled={isPTSectionReadOnly} className={inputClass} /> </div>
                <div className="group"> <label className={labelClass}>Tarikh BPP</label> <StrictDateInput name="tarikhCetakanBpp" value={formData.tarikhCetakanBpp || ''} onChange={handleInputChange} disabled={isPTSectionReadOnly} className={inputClass} /> </div>
                <div className="group"> <label className={labelClass}>Tempoh Kontrak</label> <div className="flex gap-2"> <input type="number" value={tempohVal || ''} onChange={(e) => {
                  setTempohVal(Number(e.target.value));
                  setHasUnsavedChanges(true);
                }} disabled={isPTSectionReadOnly} className={`${inputClass} w-20 px-2 text-center`} placeholder="0" /> <select value={tempohUnit} onChange={(e) => {
                  setTempohUnit(e.target.value as any);
                  setHasUnsavedChanges(true);
                }} disabled={isPTSectionReadOnly} className={`${inputClass} flex-1`} > <option value="Minggu">Minggu</option> <option value="Bulan">Bulan</option> <option value="Tahun">Tahun</option> </select> </div> </div>
                <div className="group"> <div className="flex justify-between items-center mb-1"> <label className={labelClass}>Tarikh Mula Kontrak</label> {!isPTSectionReadOnly && <button type="button" onClick={() => setFormData(prev => ({ ...prev, isManualMulaKontrak: !formData.isManualMulaKontrak }))} className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-emerald-500" title={formData.isManualMulaKontrak ? "Reset to Auto" : "Manual Edit"} > {formData.isManualMulaKontrak ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />} {formData.isManualMulaKontrak ? "Manual" : "Auto"} </button>} </div> <StrictDateInput name="tarikhMulaKontrak" value={formData.tarikhMulaKontrak || ''} onChange={handleInputChange} disabled={isPTSectionReadOnly || !formData.isManualMulaKontrak} className={`${inputClass} ${(!formData.isManualMulaKontrak || isPTSectionReadOnly) ? 'bg-slate-50' : 'ring-2 ring-emerald-500/20'}`} readOnly={!formData.isManualMulaKontrak} /> {!formData.isManualMulaKontrak && <p className="text-[10px] text-slate-400 mt-1 italic flex items-center gap-1"><RefreshCw className="w-3 h-3" /> +2 hari dari BPP (Business Days)</p>} </div>
                <div className="group"> <label className={labelClass}>Tarikh Tamat Kontrak (Auto)</label> <StrictDateInput name="tarikhTamatKontrak" value={formData.tarikhTamatKontrak || ''} onChange={() => { }} className={`${inputClass} bg-slate-50 cursor-not-allowed`} readOnly /> </div>
                <div className="group"> <label className={labelClass}>No. BPP</label> <input type="text" name="noBpp" value={formData.noBpp || ''} onChange={handleInputChange} disabled={isPTSectionReadOnly} className={inputClass} /> </div>
                <div className="group"> <label className={labelClass}>Tarikh Serah Tapak</label> <StrictDateInput name="tarikhSerahTapak" value={formData.tarikhSerahTapak || ''} onChange={handleInputChange} disabled={isPTSectionReadOnly} className={inputClass} /> </div>
                <div className="group"> <label className={labelClass}>ISO (BPP ke Serah Tapak)</label> <input type="text" name="iso" value={formData.iso || ''} className={`${inputClass} bg-slate-50 font-mono`} readOnly placeholder="Auto calc..." /> <p className="text-[10px] text-slate-400 mt-1 italic">Hari bekerja sahaja</p> </div>
                <div className="group"> <div className="flex justify-between items-center mb-1"> <label className={labelClass}>Tarikh Mula Kerja</label> {!isPTSectionReadOnly && <button type="button" onClick={() => {
                  setFormData(prev => ({ ...prev, isManualMulaKerja: !formData.isManualMulaKerja }));
                  setHasUnsavedChanges(true);
                }} className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-emerald-500" title={formData.isManualMulaKerja ? "Reset to Auto" : "Manual Edit"} > {formData.isManualMulaKerja ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />} {formData.isManualMulaKerja ? "Manual" : "Auto"} </button>} </div> <StrictDateInput name="tarikhMulaKerja" value={formData.tarikhMulaKerja || ''} onChange={handleInputChange} disabled={isPTSectionReadOnly || !formData.isManualMulaKerja} className={`${inputClass} ${(!formData.isManualMulaKerja || isPTSectionReadOnly) ? 'bg-slate-50' : 'ring-2 ring-emerald-500/20'}`} readOnly={!formData.isManualMulaKerja} /> {!formData.isManualMulaKerja && <p className="text-[10px] text-slate-400 mt-1 italic flex items-center gap-1"><RefreshCw className="w-3 h-3" /> +2 hari dari Serah Tapak (Business Days)</p>} </div>
                <div className="group"> <label className={labelClass}>No. Inden</label> <input type="text" name="noInden" value={formData.noInden || ''} onChange={handleInputChange} disabled={isPTSectionReadOnly} className={inputClass} placeholder="cth: A00321423" /> </div>
                <div className="group"> <label className={labelClass}>No. Sebutharga</label> <select name="noSebutharga" value={formData.noSebutharga || ''} onChange={handleInputChange} disabled={isPTSectionReadOnly} className={inputClass}> <option value="">Pilih No. Sebutharga...</option> {sebuthargaNumbers.map(sh => <option key={sh} value={sh}>{sh}</option>)} </select> </div>
              </div>
            </div>
            <div className="rounded-[2rem] border border-slate-200 shadow-2xl bg-white/50">
              <div className="bg-white/80 p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10"> <div className="flex items-center gap-4"> <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20"> <FileSignature className="w-6 h-6" /> </div> <div> <h3 className="font-bold text-slate-900 text-xl tracking-tight">Dokumen Aku Janji</h3> <p className="text-xs text-slate-500 font-medium">Jana dan cetak dokumen rasmi</p> </div> </div> </div>
              <div className="p-6 bg-slate-50/50"> <AkuJanjiEditor project={formData as Project} selectedYear={selectedYear} pjaUser={users.find(u => u.id === formData.pjaId)} onUpdate={handleAkuJanjiUpdate} isPrintView={false} readOnly={isGlobalReadOnly} /> </div>
            </div>
          </div>
        )}
        {activeTab === 'phase3' && (
          <div className="space-y-6">
            <div className={yellowPhaseClass}>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>
              {isCPCBlocked && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-2xl mb-6 shadow-sm animate-pulse">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                  <div>
                    <p className="font-extrabold">Penjanaan Sijil CPC (Siap Kerja) Disekat</p>
                    <p className="text-[10px] text-red-600 font-medium">Sila pastikan Admin atau Jurutera (JR) menetapkan status Notis Peringatan/Perakuan kepada 'Selesai Dikeluarkan' atau 'Tidak Diperlukan' untuk melepaskan sekatan ini.</p>
                  </div>
                </div>
              )}
              <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-8 gap-4">
                <h3 className="text-lg font-bold text-yellow-600 flex items-center gap-3"> <Info className="h-5 w-5" /> BQ Pelarasan Building </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      if (isCPCBlocked) return;
                      if (!formData.bqDataPelarasan || formData.bqDataPelarasan.length === 0) {
                        setShowPelarasanWarning(true);
                        return;
                      }
                      setIsCPCOpen(true);
                    }}
                    disabled={isCPCBlocked}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all ${
                      isCPCBlocked 
                        ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none' 
                        : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                    }`}
                    title={isCPCBlocked ? "Penjanaan CPC disekat oleh Notis Peringatan" : "Jana CPC (Siap Kerja)"}
                  >
                    <Award className="w-4 h-4" /> CPC (Siap Kerja)
                  </button>
                  <button
                    onClick={() => {
                      if (!formData.bqDataPelarasan || formData.bqDataPelarasan.length === 0) {
                        setShowPelarasanWarning(true);
                        return;
                      }
                      setIsLADOpen(true);
                    }}
                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-colors"
                  >
                    <FileWarning className="w-4 h-4" /> Perakuan LAD
                  </button>
                  <button
                    onClick={() => {
                      if (!formData.bqDataPelarasan || formData.bqDataPelarasan.length === 0) {
                        setShowPelarasanWarning(true);
                        return;
                      }
                      setIsLoCOpen(true);
                    }}
                    className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-colors"
                  >
                    <FileWarning className="w-4 h-4" /> Perakuan LoC
                  </button>
                  <button
                    onClick={() => {
                      if (!formData.bqDataPelarasan || formData.bqDataPelarasan.length === 0) {
                        setShowPelarasanWarning(true);
                        return;
                      }
                      setIsPrestasiOpen(true);
                    }}
                    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-colors"
                  >
                    <Star className="w-4 h-4" /> Borang Penilaian Prestasi
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
                <div className="group"> <label className={labelClass}>Tarikh Pemeriksaan</label> <StrictDateInput name="tarikhPemeriksaan" value={formData.tarikhPemeriksaan || ''} onChange={handleInputChange} disabled={isGlobalReadOnly} className={inputClass} /> </div>
                <div className="group"> <label className={labelClass}>Tarikh Siap (Sebenar)</label> <StrictDateInput name="tarikhSiapSebenar" value={formData.tarikhSiapSebenar || ''} onChange={handleInputChange} disabled={isGlobalReadOnly} className={inputClass} /> </div>
                <div className="group"> <label className={labelClass}>Tarikh Tuntutan Bayaran</label> <StrictDateInput name="tarikhTuntutanBayaran" value={formData.tarikhTuntutanBayaran || ''} onChange={handleInputChange} disabled={isGlobalReadOnly} className={inputClass} /> </div>
                <div className="group">
                  <label className={labelClass}>No. Inbois</label>
                  <input
                    type="text"
                    name="noInbois"
                    value={formData.noInbois || ''}
                    onChange={handleInputChange}
                    disabled={isGlobalReadOnly}
                    className={inputClass}
                    placeholder="Masukkan No. Inbois..."
                  />
                </div>
                <div className="group">
                  <div className="flex justify-between items-center mb-1">
                    <label className={labelClass}>Hari LoC (Auto)</label>
                    {!isGlobalReadOnly && (
                      <div className="flex items-center gap-1.5" title="Enable LoC Deduction?">
                        <input
                          type="checkbox"
                          checked={formData.isLocDeductionEnabled !== false}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, isLocDeductionEnabled: e.target.checked }));
                            setHasUnsavedChanges(true);
                          }}
                          className="w-3.5 h-3.5 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300 cursor-pointer"
                        />
                        <span className="text-[12px] font-bold text-slate-400 uppercase tracking-tight cursor-pointer" onClick={() => {
                          setFormData(prev => ({ ...prev, isLocDeductionEnabled: !prev.isLocDeductionEnabled }));
                          setHasUnsavedChanges(true);
                        }}>LEWAT</span>
                      </div>
                    )}
                  </div>
                  <input type="number" name="locDays" value={formData.locDays || 0} onChange={() => { }} className={`${inputClass} bg-slate-100 text-amber-600 font-bold ${formData.isLocDeductionEnabled === false ? 'opacity-50' : ''}`} readOnly />
                </div>
                <div className="group"> <label className={labelClass}>Jumlah LoC (RM) (Auto)</label> <input type="text" name="locAmount" value={formatCurrency(formData.locAmount || 0)} onChange={() => { }} className={`${inputClass} bg-slate-100 text-amber-600 font-bold`} readOnly /> </div>
                <div className="group"> <label className={labelClass}>Hari LAD (Auto)</label> <input type="number" name="ladDays" value={formData.ladDays || 0} onChange={() => { }} className={`${inputClass} bg-slate-100 text-red-500 font-bold`} readOnly /> </div>
                <div className="group"> <label className={labelClass}>Jumlah LAD (RM) (Auto)</label> <input type="text" name="ladAmount" value={formatCurrency(formData.ladAmount || 0)} onChange={() => { }} className={`${inputClass} bg-slate-100 text-red-500 font-bold`} readOnly /> </div>
                <div className="group"> <label className={labelClass}>Prestasi (%) - Auto</label> <div className="relative"> <input type="text" name="prestasi" value={formData.prestasi || ''} readOnly className={`${inputClass} bg-slate-100 text-slate-500 cursor-not-allowed`} placeholder="0%" /> </div> </div>
                <div className="group"> <label className={labelClass}>Wang Tahanan (RM)</label> <input type="number" name="wangTahanan" value={formData.wangTahanan ?? ''} onChange={handleInputChange} disabled={isGlobalReadOnly} className={inputClass} placeholder="0.00" /> </div>
                <div className="group"> <label className={labelClass}>Harga Kontrak (Asal)</label> <div className={`${inputClass} bg-slate-50 text-slate-500 font-bold flex items-center`}> {formatCurrency(formData.kosProjek || 0)} </div> </div>
                <div className="group"> <label className={labelClass}>Harga Akhir (Bersih)</label> <div className={`${inputClass} bg-slate-100 font-bold flex items-center ${(formData.kosSebenar || 0) < (formData.kosProjek || 0) ? 'text-red-600' : (formData.kosSebenar || 0) > (formData.kosProjek || 0) ? 'text-blue-600' : 'text-slate-600'}`}> {formatCurrency(formData.kosSebenar)} </div> </div>
              </div>
            </div>
            <div className="rounded-[2rem] border border-slate-200 shadow-2xl bg-white/50 flex flex-col h-auto overflow-visible w-full">
              <div className="bg-white/80 p-4 border-b border-slate-200 flex items-center justify-between shrink-0 rounded-t-[2rem]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20"> <Edit className="w-6 h-6" /> </div>
                  <div> <h3 className="font-bold text-slate-900 text-xl tracking-tight">Pelarasan BQ</h3> <p className="text-xs text-slate-500 font-medium">Bandingkan dengan kontrak asal & buat pelarasan</p> </div>
                </div>
                {!isGlobalReadOnly && (
                  <div className="flex gap-2">
                    {formData.bqDataPelarasan && formData.bqDataPelarasan.length > 0 ? (
                      <button
                        onClick={handleResetPelarasan}
                        className="flex items-center gap-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-slate-200 hover:border-red-200"
                      >
                        <RefreshCw className="w-4 h-4" /> Reset Pelarasan
                      </button>
                    ) : (
                      <button
                        onClick={handleInitializePelarasan}
                        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-all"
                      >
                        <Zap className="w-4 h-4" /> Mulakan Pelarasan
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="bg-slate-50/50 flex-1 relative rounded-b-[2rem]"> <BQPelarasanEditor originalData={formData.bqData || []} pelarasanData={formData.bqDataPelarasan || []} onDataChange={handleBQPelarasanChange} projectData={formData as Project} isPrintView={false} locationRows={locationRows} globalCalculationsPelarasan={formData.globalCalculationsPelarasan || {}} onGlobalCalculationsPelarasanChange={handleGlobalCalculationsPelarasanChange} readOnly={isGlobalReadOnly} /> </div>
            </div>
          </div>
        )}
        {activeTab === 'phase4' && (
          <div className="space-y-6">
            <div className={orangePhaseClass}>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent"></div>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4"> <h3 className="text-lg font-bold text-orange-600 flex items-center gap-3"> <CheckCircle className="h-5 w-5" /> Closing File / Project  </h3> </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-8">
                <div className="group"> <label className={labelClass}>Tarikh Hantar Kewangan</label> <StrictDateInput name="tarikhHantarKewangan" value={formData.tarikhHantarKewangan || ''} onChange={handleInputChange} disabled={isPTSectionReadOnly} className={inputClass} /> </div>
                <div className="group"> <label className={labelClass}>Tarikh Padanan</label> <StrictDateInput name="tarikhPadanan" value={formData.tarikhPadanan || ''} onChange={handleInputChange} disabled={isPTSectionReadOnly} className={inputClass} /> </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {confirmationState.isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={cancelConfirmation}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 transform scale-100 transition-colors animate-slide-up relative" onClick={e => e.stopPropagation()} >
            <button onClick={cancelConfirmation} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100"> <X className="w-5 h-5" /> </button>
            <div className="flex flex-col items-center text-center pt-2">
              {confirmationState.type === 'back' ? (
                <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mb-6 text-yellow-500">
                  <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center"> <HelpCircle className="w-8 h-8 stroke-[1.5]" /> </div>
                </div>
              ) : confirmationState.type === 'reset_pelarasan' ? (
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 text-red-500">
                  <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center"> <RefreshCw className="w-8 h-8 stroke-[1.5]" /> </div>
                </div>
              ) : confirmationState.type === 'switch' ? (
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 text-blue-500">
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center"> <HelpCircle className="w-8 h-8 stroke-[1.5]" /> </div>
                </div>
              ) : (
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 text-emerald-500">
                  <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center"> <CheckCircle className="w-8 h-8 stroke-[1.5]" /> </div>
                </div>
              )}
              <h3 className="text-xl font-bold text-slate-900 mb-2 font-jakarta">
                {confirmationState.type === 'back' ? 'Kembali ke Senarai?' :
                  confirmationState.type === 'reset_pelarasan' ? 'Set Semula Pelarasan?' :
                  confirmationState.type === 'switch' ? 'Terdapat Perubahan Belum Disimpan' :
                  'Simpan Projek?'}
              </h3>
              <p className="text-slate-500 mb-8 text-sm leading-relaxed px-4">
                {confirmationState.type === 'back' ? 'Sebarang perubahan yang belum disimpan mungkin akan hilang. Adakah anda pasti mahu kembali?' :
                  confirmationState.type === 'reset_pelarasan' ? 'Semua maklumat pelarasan yang telah diisi akan dipadam dan diset semula mengikut BQ asal. Adakah anda pasti?' :
                  confirmationState.type === 'switch' ? 'Anda mempunyai perubahan yang belum disimpan. Apa yang anda mahu lakukan?' :
                  'Adakah anda pasti mahu menyimpan maklumat projek ini? Pastikan semua maklumat adalah tepat.'}
              </p>

              {confirmationState.type === 'switch' ? (
                <div className="flex flex-col gap-3 w-full">
                  <button
                    onClick={confirmAction}
                    className="w-full py-3.5 px-4 rounded-xl font-bold text-white transition-colors flex items-center justify-center gap-2 shadow-lg bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30"
                  >
                    <Save className="w-4 h-4" /> Simpan & Tukar Projek
                  </button>
                  <button
                    onClick={discardAndSwitch}
                    className="w-full py-3 px-4 bg-white text-slate-600 rounded-xl font-bold hover:bg-red-50 hover:text-red-600 transition-colors border border-slate-200 hover:border-red-200 shadow-sm text-sm"
                  >
                    Teruskan Tanpa Simpan
                  </button>
                </div>
              ) : (
                <div className="flex gap-3 w-full">
                  <button onClick={cancelConfirmation} className="flex-1 py-3.5 px-4 bg-white text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors border border-slate-200 shadow-sm hover:shadow-md" > Batal </button>
                  <button onClick={confirmAction} className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-white transition-colors flex items-center justify-center gap-2 shadow-lg ${confirmationState.type === 'back' ? 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-500/30' : confirmationState.type === 'reset_pelarasan' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'}`} >
                    {confirmationState.type === 'back' ? 'Ya, Kembali' : confirmationState.type === 'reset_pelarasan' ? 'Ya, Set Semula' : 'Ya, Simpan'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {showPelarasanWarning && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={() => setShowPelarasanWarning(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 transform scale-100 transition-colors animate-slide-up relative" onClick={e => e.stopPropagation()} >
            <button onClick={() => setShowPelarasanWarning(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100"> <X className="w-5 h-5" /> </button>
            <div className="flex flex-col items-center text-center pt-2">
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 text-amber-500">
                <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center"> <AlertCircle className="w-8 h-8 stroke-[1.5]" /> </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2 font-jakarta"> Pelarasan Diperlukan </h3>
              <p className="text-slate-500 mb-8 text-sm leading-relaxed px-4"> Sila sediakan Pelarasan terlebih dahulu sebelum menjana dokumen ini. </p>
              <button onClick={() => setShowPelarasanWarning(false)} className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-amber-500/30" > Tutup </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {isLADOpen && (<LADCertificate project={formData as Project} pjaUser={users.find(u => u.id === formData.pjaId)} onClose={() => setIsLADOpen(false)} />)}
      {isLoCOpen && (<LoCCertificate project={formData as Project} pjaUser={users.find(u => u.id === formData.pjaId)} onClose={() => setIsLoCOpen(false)} />)}
      {isCPCOpen && (<CPCCertificate project={formData as Project} pjaUser={users.find(u => u.id === formData.pjaId)} onClose={() => setIsCPCOpen(false)} />)}
      {isPrestasiOpen && (<PrestasiCertificate project={formData as Project} onClose={() => setIsPrestasiOpen(false)} onUpdate={handlePrestasiUpdate} />)}
      {isNotisOpen && (<NotisGenerator project={formData as Project} pjaUser={users.find(u => u.id === formData.pjaId)} onClose={() => setIsNotisOpen(false)} />)}
    </div>
  );
};

export default ProjectDetail;