import React, { useState, useEffect, useCallback, useRef, useMemo, useReducer } from 'react';
import { createPortal } from 'react-dom';
import { Project, ProjectStatus, BQGroup, formatCurrency, BP_OPTIONS, ZON_OPTIONS, MUKIM_OPTIONS, GlobalDimensions, User, Role, getCurrentDate, formatDate, ProjectLocation, BQItem, CalculationPart } from '../types';
import { ArrowLeft, Save, Zap, Folder, CheckCircle, Edit, Info, Calculator, Calendar, Lock, Unlock, RefreshCw, AlertCircle, FileSignature, X, Plus, HelpCircle, FileText, Download, Loader2, FileWarning, Award, Star, Megaphone, User as UserIcon, ChevronDown, Check, ShieldCheck, CloudDownload, Database } from 'lucide-react';
import BQEditor from './BQEditor';
import BQPelarasanEditor from './BQPelarasanEditor';
import AkuJanjiEditor from './AkuJanjiEditor';
import LADCertificate from './LADCertificate';
import LoCCertificate from './LoCCertificate';
import CPCCertificate from './CPCCertificate';
import PrestasiCertificate from './PrestasiCertificate';
import NotisGenerator from './NotisGenerator';
import { apiService } from '../services/apiService';
import { BQPDFExporter } from '../services/pdf';
import StrictDateInput from '../components/StrictDateInput';
import { useProjects } from '../hooks/useProjects';
import { useUsers } from '../hooks/useUsers';
import { useSettings } from '../hooks/useSettings';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import BottomSheet from '../components/BottomSheet';
import MobileDetailHeader from '../components/detail/MobileDetailHeader';
import MobileActionBar, { getSaveState } from '../components/detail/MobileActionBar';
import MobileTitleCard from '../components/detail/MobileTitleCard';
import NoticeRow from '../components/detail/NoticeRow';
import ProjectSwitcherPanel from '../components/detail/ProjectSwitcherPanel';
import PjaAvatar from '../components/detail/PjaAvatar';
import LokasiTextarea from '../components/detail/LokasiTextarea';
import { STATUS_OPTIONS, TriColourBar, parseProgress } from '../components/detail/progress';
import { useIsMobile } from '../components/detail/useIsMobile';
import { useAutosize } from '../components/detail/useAutosize';
import CostHUD from '../components/detail/CostHUD';
import ContractPanel from '../components/detail/ContractPanel';
import { PhaseStepperDesktop, PhaseStepperPhone } from '../components/detail/PhaseStepper';
import { useOrgConfig } from '../hooks/useOrgConfig';
import { useContracts } from '../hooks/useContracts';
import { useRateBookVersions } from '../hooks/useRateBook';
import { rateSourceLabel } from '../components/bq/useProjectBook';
import { ladPatch, ladPolicyFor, locPatch, locPolicyFor, settlementPatch, toPolicyRules } from '../components/detail/moneyRules';



interface ProjectDetailProps {
  project?: Project;
  projects?: Project[];
  onClose: () => void;
  onSave: (savedProject?: Project) => void;
  onSwitchProject?: (project: Project) => void;
  currentUserRole: Role;
  selectedYear: number;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

// Height of MobileDetailHeader plus a small gap.
const MOBILE_HEADER_OFFSET = 124;

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

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, projects = [], onClose, onSave, onSwitchProject, currentUserRole, selectedYear, onShowToast }) => {
  const { createProject, createProjectAsync, updateProject, updateProjectAsync } = useProjects();
  const { users } = useUsers();
  const queryClient = useQueryClient();
  const projectYear = project?.tarikhBuka ? new Date(project.tarikhBuka).getFullYear() : selectedYear;
  const { companies, votes: voteNumbers, sebuthargaNumbers, settings } = useSettings(projectYear);
  const { policies } = useOrgConfig();
  const { contracts, activeContract } = useContracts();
  const policyRules = useMemo(() => toPolicyRules(policies), [policies]);

  // Get the latest project data from the cache (which is updated by Realtime in useProjects)
  const { data: latestProject, isFetching: isVerifying, isError: isVerifyError } = useQuery({
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
  const hasFullSyncRef = useRef(false);

  // Detect remote changes
  useEffect(() => {
    if (latestProject && project && latestProject.id === project.id) {
      hasFullSyncRef.current = true;
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
      hasFullSyncRef.current = true;
      setHasUnsavedChanges(false);
      setShowRemoteUpdateNotice(false);
      if (onShowToast) onShowToast("Data awan telah digunakan.", "success");
    }
  };

  // Detect project switch and reset ALL local state to reflect the new project
  useEffect(() => {
    setHasUnsavedChanges(false);
    hasFullSyncRef.current = false;
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
  const [isNotisCardCollapsed, setIsNotisCardCollapsed] = useState(true);



  // Project Switcher State
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isSwitcherSheetOpen, setIsSwitcherSheetOpen] = useState(false);
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

  // The Zon list is a fixed-position portal: re-render on scroll so it follows its field.
  const [, repositionZonDropdown] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    if (!isZonDropdownOpen) return;
    window.addEventListener('scroll', repositionZonDropdown, { passive: true });
    return () => window.removeEventListener('scroll', repositionZonDropdown);
  }, [isZonDropdownOpen]);

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

  const isMobile = useIsMobile();

  const toggleZonDropdown = () => {
    if (isGlobalReadOnly) return;
    const field = zonDropdownRef.current;
    // On a phone, bring the field up under the fixed header first so the whole list fits on screen.
    if (!isZonDropdownOpen && isMobile && field) window.scrollBy({ top: field.getBoundingClientRect().top - MOBILE_HEADER_OFFSET });
    setIsZonDropdownOpen(!isZonDropdownOpen);
  };
  const titleRef = useRef<HTMLTextAreaElement>(null);
  useAutosize(titleRef, formData.namaProjek || '', isMobile && activeTab === 'phase1');

  const isCPCBlocked = useMemo(() => {
    if (formData.isTiadaNotisDiperlukan || !formData.tarikhTamatKontrak) {
      return false;
    }
    let todayVal = 0;
    if (formData.tarikhPemeriksaan) {
      const checkVal = new Date(formData.tarikhPemeriksaan).getTime();
      if (!isNaN(checkVal)) {
        todayVal = checkVal;
      }
    }
    if (!todayVal) {
      const now = new Date();
      const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' });
      todayVal = new Date(todayStr).getTime();
    }
    
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
  }, [formData.tarikhTamatKontrak, formData.tarikhPemeriksaan, formData.notisPeringatan1Status, formData.perakuanKerjaTidakSiapStatus, formData.notisPeringatan2Status, formData.notisPeringatan3Status, formData.isTiadaNotisDiperlukan]);

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
        let savedProject;
        if (project && project.id) {
          savedProject = await updateProjectAsync({ id: project.id, updates: formData });
        } else {
          savedProject = await createProjectAsync(formData as any);
        }
        setHasUnsavedChanges(false);
        onSave(savedProject);
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
          await updateProjectAsync({ id: project.id, updates: formData });
        } else {
          await createProjectAsync(formData as any);
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

  const handlePrestasiPersist = async (updates: Partial<Project>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    try {
      if (project?.id) {
        await updateProjectAsync({ id: project.id, updates: { ...formData, ...updates } });
        setHasUnsavedChanges(false);
        if (onShowToast) onShowToast("Penilaian prestasi telah disimpan.", "success");
      } else {
        setHasUnsavedChanges(true);
        if (onShowToast) onShowToast("Maklumat prestasi dikemaskini. Sila simpan projek.", "info");
      }
    } catch (e) {
      console.error(e);
      setHasUnsavedChanges(true);
      if (onShowToast) onShowToast("Gagal menyimpan ke awan. Sila simpan secara manual.", "error");
    }
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

  // LAD / LoC / kos sebenar: domain/money fed by the dated policy rules (Tetapan), see components/detail/moneyRules.
  useEffect(() => {
    if (!policyRules.length) return;
    const patch = ladPatch(formData, ladPolicyFor(policyRules, formData));
    if (patch) setFormData(prev => ({ ...prev, ...patch }));
  }, [formData.tarikhTamatKontrak, formData.tarikhSiapSebenar, formData.kosProjek, policyRules]);

  useEffect(() => {
    if (!policyRules.length) return;
    const patch = locPatch(formData, locPolicyFor(policyRules, formData));
    if (patch) setFormData(prev => ({ ...prev, ...patch }));
  }, [formData.tarikhSiapSebenar, formData.tarikhTuntutanBayaran, formData.isLocDeductionEnabled, policyRules]);

  useEffect(() => {
    if (project?.id && !hasFullSyncRef.current) return;
    const patch = settlementPatch(formData);
    if (patch) setFormData(prev => ({ ...prev, ...patch }));
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
    if (project?.id && !hasFullSyncRef.current) return;
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

  // No. Sebutharga follows the bound contract (new projects: the AKTIF one the API will bind them to).
  const boundContract = contracts.find(c => c.id === formData.contractId) ?? (formData.contractId ? undefined : activeContract);
  const boundContractCode = boundContract?.code;
  const { data: bookVersions = [] } = useRateBookVersions(boundContract?.id);
  const pricedVersionNo = bookVersions.find(v => v.id === formData.rateBookVersionId)?.versionNo ?? boundContract?.stats?.currentVersion ?? null;
  useEffect(() => {
    if (boundContractCode && !formData.noSebutharga) setFormData(prev => ({ ...prev, noSebutharga: boundContractCode }));
  }, [boundContractCode, formData.noSebutharga]);

  const saveBeforeSwap = async () => {
    if (!project?.id) return;
    await updateProjectAsync({ id: project.id, updates: formData });
    setHasUnsavedChanges(false);
    onShowToast?.('Perubahan projek disimpan dahulu sebelum menukar sebutharga.', 'info');
  };

  // Re-price applied on the server: take its BQ, total, contract and No. Sebutharga as the new saved state.
  const handleContractApplied = (saved: Project) => {
    setFormData(prev => ({ ...prev, bqData: saved.bqData, kosProjek: saved.kosProjek, contractId: saved.contractId, rateBookVersionId: saved.rateBookVersionId, noSebutharga: saved.noSebutharga, updatedAt: saved.updatedAt }));
    setHasUnsavedChanges(false);
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    queryClient.invalidateQueries({ queryKey: ['contracts'] });
    onShowToast?.(`Projek kini memakai sebutharga ${saved.noSebutharga}.`, 'success');
  };

  const handleAkuJanjiUpdate = (updates: Partial<Project>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

  const getExportMissingFields = (): string[] => {
    const missing: string[] = [];
    const isBlank = (val: unknown) => !String(val ?? '').trim();
    const hasLineValue = (val: unknown) => String(val ?? '').split('\n').some(s => s.trim() !== '');

    if (activeTab === 'phase1') {
      if (isBlank(formData.namaProjek)) missing.push('Cadangan Kerja');
      if (!hasLineValue(formData.lokasi)) missing.push('Lokasi');
      if (!hasLineValue(formData.noAduan)) missing.push('Aduan');
      if (isBlank(formData.zon)) missing.push('Zon');
      if (isBlank(formData.mukim)) missing.push('Mukim');
      if (isBlank(formData.tarikhBuka)) missing.push('Tarikh Buka');
      if (isBlank(formData.bp)) missing.push('BP');
    }
    return missing;
  };

  const handleExportPDF = async () => {
    const missing = getExportMissingFields();
    if (missing.length > 0) {
      if (onShowToast) onShowToast(`Sila isi: ${missing.join(', ')}`, 'error');
      return;
    }
    setIsExporting(true);
    try {
      if (activeTab === 'phase1') { await handleExportRealBQPDF(); }
      else if (activeTab === 'phase3') { await handleExportRealPelarasanPDF(); }
    } catch (e) { console.error(e); if (onShowToast) onShowToast("Gagal menjana PDF", "error"); } finally { setIsExporting(false); }
  };

  const handleExportRealBQPDF = async () => {
    await BQPDFExporter.exportBQ(formData, users, locationRows, rateSourceLabel(boundContract, pricedVersionNo));
  };

  const handleExportRealPelarasanPDF = async () => {
    await BQPDFExporter.exportPelarasan(formData, locationRows);
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

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, status: e.target.value as ProjectStatus });
  const handleProgressChange = (val: number) => setFormData({ ...formData, peratusSiap: val });

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

  const inputClass = "w-full px-4 py-3 rounded-lg bg-white border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors text-slate-900 placeholder-slate-400 text-sm max-md:text-base shadow-sm disabled:bg-slate-50 disabled:cursor-not-allowed";
  // Phones: two short fields side by side, stacked under 380 px where a date no longer fits half the width.
  const pairClass = "flex flex-col gap-4 min-[380px]:max-md:grid min-[380px]:max-md:grid-cols-2 min-[380px]:max-md:gap-3";
  const labelClass = "block text-[10px] max-md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 font-jakarta";
  const yellowPhaseClass = "bg-white/80 border border-yellow-500/30 p-8 max-md:p-4 rounded-3xl animate-fade-in shadow-xl relative overflow-hidden";
  const bluePhaseClass = "bg-white/80 border border-blue-500/30 p-8 max-md:p-4 rounded-3xl animate-fade-in shadow-xl relative overflow-hidden";
  const orangePhaseClass = "bg-white/80 border border-orange-500/30 p-8 max-md:p-4 rounded-3xl animate-fade-in shadow-xl relative overflow-hidden";

  const ptFields = {
    noFail: (
      <div className="group"> <label className={labelClass}>No. Fail</label> <input type="text" name="noFail" value={formData.noFail || ''} onChange={handleInputChange} disabled={isPTSectionReadOnly} className={inputClass} /> </div>
    ),
    namaSyarikat: (
      <div className="group lg:col-span-2"> <label className={labelClass}>Nama Syarikat</label> <select name="namaSyarikat" value={formData.namaSyarikat || ''} onChange={handleInputChange} disabled={isPTSectionReadOnly} className={inputClass}> <option value="">Pilih Syarikat...</option> {companies.map(c => <option key={c} value={c}>{c}</option>)} </select> </div>
    ),
    bulan: (
      <div className="group"> <label className={labelClass}>Bulan</label> <select name="bulan" value={formData.bulan || ''} onChange={handleInputChange} disabled={isPTSectionReadOnly} className={inputClass}> <option value="">Pilih...</option> {['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'].map(m => (<option key={m} value={m}>{m}</option>))} </select> </div>
    ),
    noVote: (
      <div className="group"> <label className={labelClass}>No. Vot</label> <select name="noVote" value={formData.noVote || ''} onChange={handleInputChange} disabled={isPTSectionReadOnly} className={inputClass}> <option value="">Pilih Vot...</option> {voteNumbers.map(v => <option key={v.code} value={v.code}>{v.code} ({v.name})</option>)} </select> </div>
    ),
    tarikhLantikan: (
      <div className="group"> <label className={labelClass}>Tarikh Lantikan</label> <StrictDateInput name="tarikhLantikan" value={formData.tarikhLantikan || ''} onChange={handleInputChange} disabled={isPTSectionReadOnly} className={inputClass} /> </div>
    ),
    tarikhBpp: (
      <div className="group"> <label className={labelClass}>Tarikh BPP</label> <StrictDateInput name="tarikhCetakanBpp" value={formData.tarikhCetakanBpp || ''} onChange={handleInputChange} disabled={isPTSectionReadOnly} className={inputClass} /> </div>
    ),
    tempoh: (
      <div className="group"> <label className={labelClass}>Tempoh Kontrak</label> <div className="flex gap-2"> <input type="number" value={tempohVal || ''} onChange={(e) => {
        setTempohVal(Number(e.target.value));
        setHasUnsavedChanges(true);
      }} disabled={isPTSectionReadOnly} className={`${inputClass} !w-24 text-center`} placeholder="0" /> <select value={tempohUnit} onChange={(e) => {
        setTempohUnit(e.target.value as any);
        setHasUnsavedChanges(true);
      }} disabled={isPTSectionReadOnly} className={`${inputClass} min-w-[100px] flex-1`} > <option value="Minggu">Minggu</option> <option value="Bulan">Bulan</option> <option value="Tahun">Tahun</option> </select> </div> </div>
    ),
    mulaKontrak: (
      <div className="group"> <div className="flex justify-between items-center mb-1"> <label className={labelClass}>Tarikh Mula Kontrak</label> {!isPTSectionReadOnly && <button type="button" onClick={() => setFormData(prev => ({ ...prev, isManualMulaKontrak: !formData.isManualMulaKontrak }))} className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-emerald-500 max-md:h-11 max-md:px-3 max-md:text-xs max-md:rounded-lg max-md:border max-md:border-slate-200" title={formData.isManualMulaKontrak ? "Reset to Auto" : "Manual Edit"} > {formData.isManualMulaKontrak ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />} {formData.isManualMulaKontrak ? "Manual" : "Auto"} </button>} </div> <StrictDateInput name="tarikhMulaKontrak" value={formData.tarikhMulaKontrak || ''} onChange={handleInputChange} disabled={isPTSectionReadOnly || !formData.isManualMulaKontrak} className={`${inputClass} ${(!formData.isManualMulaKontrak || isPTSectionReadOnly) ? 'bg-slate-50' : 'ring-2 ring-emerald-500/20'}`} readOnly={!formData.isManualMulaKontrak} /> {!formData.isManualMulaKontrak && <p className="text-[10px] max-md:text-xs text-slate-400 mt-1 italic flex items-center gap-1"><RefreshCw className="w-3 h-3" /> +2 hari dari BPP (Business Days)</p>} </div>
    ),
    tamatKontrak: (
      <div className="group"> <label className={labelClass}>Tarikh Tamat Kontrak (Auto)</label> <StrictDateInput name="tarikhTamatKontrak" value={formData.tarikhTamatKontrak || ''} onChange={() => { }} className={`${inputClass} bg-slate-50 cursor-not-allowed`} readOnly /> </div>
    ),
    noBpp: (
      <div className="group"> <label className={labelClass}>No. BPP</label> <input type="text" name="noBpp" value={formData.noBpp || ''} onChange={handleInputChange} disabled={isPTSectionReadOnly} className={inputClass} /> </div>
    ),
    serahTapak: (
      <div className="group"> <label className={labelClass}>Tarikh Serah Tapak</label> <StrictDateInput name="tarikhSerahTapak" value={formData.tarikhSerahTapak || ''} onChange={handleInputChange} disabled={isPTSectionReadOnly} className={inputClass} /> </div>
    ),
    iso: (
      <div className="group"> <label className={labelClass}>ISO (BPP ke Serah Tapak)</label> <input type="text" name="iso" value={formData.iso || ''} className={`${inputClass} bg-slate-50 font-mono`} readOnly placeholder="Auto calc..." /> {!isMobile && <p className="text-[10px] text-slate-400 mt-1 italic">Hari bekerja sahaja</p>} </div>
    ),
    mulaKerja: (
      <div className="group"> <div className="flex justify-between items-center mb-1"> <label className={labelClass}>Tarikh Mula Kerja</label> {!isPTSectionReadOnly && <button type="button" onClick={() => {
        setFormData(prev => ({ ...prev, isManualMulaKerja: !formData.isManualMulaKerja }));
        setHasUnsavedChanges(true);
      }} className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-emerald-500 max-md:h-11 max-md:px-3 max-md:text-xs max-md:rounded-lg max-md:border max-md:border-slate-200" title={formData.isManualMulaKerja ? "Reset to Auto" : "Manual Edit"} > {formData.isManualMulaKerja ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />} {formData.isManualMulaKerja ? "Manual" : "Auto"} </button>} </div> <StrictDateInput name="tarikhMulaKerja" value={formData.tarikhMulaKerja || ''} onChange={handleInputChange} disabled={isPTSectionReadOnly || !formData.isManualMulaKerja} className={`${inputClass} ${(!formData.isManualMulaKerja || isPTSectionReadOnly) ? 'bg-slate-50' : 'ring-2 ring-emerald-500/20'}`} readOnly={!formData.isManualMulaKerja} /> {!formData.isManualMulaKerja && <p className="text-[10px] max-md:text-xs text-slate-400 mt-1 italic flex items-center gap-1"><RefreshCw className="w-3 h-3" /> +2 hari dari Serah Tapak (Business Days)</p>} </div>
    ),
    noInden: (
      <div className="group"> <label className={labelClass}>No. Inden</label> <input type="text" name="noInden" value={formData.noInden || ''} onChange={handleInputChange} disabled={isPTSectionReadOnly} className={inputClass} placeholder="cth: A00321423" /> </div>
    ),
    noSebutharga: (
      <div className="group"> <label className={labelClass}>No. Sebutharga</label> <input type="text" name="noSebutharga" value={formData.noSebutharga || ''} readOnly className={`${inputClass} bg-slate-50`} aria-describedby="noSebutharga-hint" /> <p id="noSebutharga-hint" className="mt-1 text-xs text-muted">Ditetapkan oleh kontrak projek. Tukar melalui "Tukar sebutharga" di atas.</p> </div>
    ),
  };
  const ptCardTop = (
    <>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
      <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-8 max-md:mb-4 gap-4"> <h3 className="text-lg font-bold text-blue-600 flex items-center gap-3"> <Folder className="h-5 w-5" /> Maklumat Fail & Kontrak (PT) </h3> <button onClick={() => setIsNotisOpen(true)} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-colors shadow-red-500/20 max-md:w-full max-md:h-12 max-md:justify-center max-md:text-sm" > <Megaphone className="w-4 h-4" /> Jana Notis </button> </div>
    </>
  );
  const ptPairClass = `${pairClass} min-[380px]:max-md:items-end`;
  const ptGroupHeadingClass = "text-xs font-bold text-blue-600 uppercase tracking-widest mb-4";

  const certTileClass = "max-md:min-h-[52px] max-md:px-3 max-md:text-[13px] max-md:leading-tight max-md:text-left";

  const isDataMissing = (!formData.bqData || formData.bqData.length === 0);
  const isStillLoading = isVerifying || (!!project?.id && !hasFullSyncRef.current && isDataMissing && !isVerifyError);

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
        onStatusChange={handleStatusChange}
        onProgressChange={handleProgressChange}
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
      {isMobile && (<>
      <MobileDetailHeader
        title={project ? 'Kemaskini Projek' : 'Daftar Projek Baru'}
        noFail={formData.noFail || 'No. Fail Belum Ditetapkan'}
        onBack={handleBackClick}
        onOpenSwitcher={project ? () => setIsSwitcherSheetOpen(true) : undefined}
        grandTotal={grandTotal}
        finalTotal={activeTab === 'phase3' ? finalTotalDisplay : undefined}
        isLoading={isStillLoading}
        progress={formData.peratusSiap || 0}
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <MobileActionBar
        saveState={getSaveState(!project, hasUnsavedChanges)}
        onExport={handleExportPDF}
        isExporting={isExporting}
        onSave={isGlobalReadOnly ? undefined : handleSaveClick}
        isSaving={isSaving}
      />
      </>)}
      <div className="pt-24 max-md:pt-[108px]">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 max-md:mb-0 px-2 no-print gap-4">
          <div className="flex max-md:hidden items-center gap-4">
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
                      <ProjectSwitcherPanel
                        projects={filteredSwitcherProjects}
                        activeId={project?.id}
                        query={switcherSearchQuery}
                        onQueryChange={setSwitcherSearchQuery}
                        showSiap={showSiapProjects}
                        onShowSiapChange={setShowSiapProjects}
                        onPick={handleProjectSwitch}
                        autoFocusSearch
                        listClassName="max-h-[400px] overflow-y-auto p-2 custom-scrollbar"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            </div>
          </div>
          {isGlobalReadOnly && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-200 text-xs font-bold shadow-sm max-md:mb-4">
              <Lock className="w-4 h-4" /> Mode Paparan Sahaja
            </div>
          )}
        </div>

        {isMobile && <MobileTitleCard
          title={formData.namaProjek || ''}
          status={formData.status as ProjectStatus}
          onStatusChange={handleStatusChange}
          progress={formData.peratusSiap || 0}
          onProgressChange={handleProgressChange}
          readOnly={isGlobalReadOnly}
        />}
        {isMobile && <PhaseStepperPhone project={formData} />}
        <ContractPanel
          project={formData}
          savedId={project?.id}
          readOnly={isGlobalReadOnly}
          hasUnsavedChanges={hasUnsavedChanges}
          onApplied={handleContractApplied}
          onSaveFirst={saveBeforeSwap}
        />
        
        {/* Warning Notice & Certificate Status Card */}
        {(() => {
          const hasTamatDate = !!formData.tarikhTamatKontrak;
          if (!hasTamatDate) return null; // Hide completely if no date
          
          const tamatVal = new Date(formData.tarikhTamatKontrak!).getTime();
          if (isNaN(tamatVal)) return null;

          let todayVal = 0;
          if (formData.tarikhPemeriksaan) {
            const checkVal = new Date(formData.tarikhPemeriksaan).getTime();
            if (!isNaN(checkVal)) {
              todayVal = checkVal;
            }
          }
          if (!todayVal) {
            const now = new Date();
            const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' });
            todayVal = new Date(todayStr).getTime();
          }

          const oneDayMs = 24 * 60 * 60 * 1000;
          const p1Time = tamatVal - (7 * oneDayMs);
          const p2Time = tamatVal + (7 * oneDayMs);
          const p3Time = tamatVal + (14 * oneDayMs);

          const formatDateForUI = (time: number) => {
            const d = new Date(time);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
          };

          const p1Str = formatDateForUI(p1Time);
          const tamatStr = formatDateForUI(tamatVal);
          const p2Str = formatDateForUI(p2Time);
          const p3Str = formatDateForUI(p3Time);

          const isP1Passed = todayVal >= p1Time;
          const isTamatPassed = todayVal >= tamatVal;
          const isP2Passed = todayVal >= p2Time;
          const isP3Passed = todayVal >= p3Time;

          const isP1Warning = isP1Passed && (formData.notisPeringatan1Status === 'PENDING' || !formData.notisPeringatan1Status) && !formData.isTiadaNotisDiperlukan;
          const isTamatWarning = isTamatPassed && (formData.perakuanKerjaTidakSiapStatus === 'PENDING' || !formData.perakuanKerjaTidakSiapStatus) && !formData.isTiadaNotisDiperlukan;
          const isP2Warning = isP2Passed && (formData.notisPeringatan2Status === 'PENDING' || !formData.notisPeringatan2Status) && !formData.isTiadaNotisDiperlukan;
          const isP3Warning = isP3Passed && (formData.notisPeringatan3Status === 'PENDING' || !formData.notisPeringatan3Status) && !formData.isTiadaNotisDiperlukan;

          let warningCount = 0;
          if (isP1Warning) warningCount++;
          if (isTamatWarning) warningCount++;
          if (isP2Warning) warningCount++;
          if (isP3Warning) warningCount++;

          const isAdminOrJurutera = currentUser?.role === Role.ADMIN || currentUser?.role === Role.JURUTERA;
          const isNoticeReadOnly = isGlobalReadOnly || !isAdminOrJurutera || formData.status === ProjectStatus.SIAP;

          const handleNoticeStatusChange = (field: string, val: string) => {
            setFormData(prev => ({
              ...prev,
              [field]: val
            }));
            setHasUnsavedChanges(true);
          };

          return (
            <div className="mb-6 max-md:mb-4 bg-white/95 border border-slate-200 shadow-xl rounded-3xl p-5 max-md:p-4 transition-all duration-300">
              {/* Clickable Header for Collapsing */}
              <div 
                onClick={() => setIsNotisCardCollapsed(!isNotisCardCollapsed)}
                className="flex items-center justify-between gap-4 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-rose-50 to-red-50 text-red-600 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                    <FileWarning className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-[14px] tracking-tight font-jakarta">Status Notis Peringatan & Perakuan Kontrak</h3>
                    <p className={`text-[12px] font-bold ${warningCount > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                      {warningCount > 0 ? `${warningCount} Notis Perlu Tindakan Segera` : '✓ Semua notis selesai / dikecualikan'}
                    </p>
                  </div>
                </div>
                
                {warningCount > 0 && <span className="md:hidden ml-auto shrink-0 min-w-[28px] h-7 px-2 rounded-full bg-rose-500 text-white text-sm font-bold flex items-center justify-center">{warningCount}</span>}
                <button 
                  type="button"
                  aria-label="Buka/tutup notis"
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors max-md:w-11 max-md:h-11 max-md:shrink-0 max-md:flex max-md:items-center max-md:justify-center"
                >
                  <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isNotisCardCollapsed ? '' : 'rotate-180'}`} />
                </button>
              </div>

              {/* Collapsible Content */}
              {!isNotisCardCollapsed && (
                <div className="mt-5 pt-4 border-t border-slate-100 space-y-5 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Notis Peringatan Pertama', date: p1Str, field: 'notisPeringatan1Status', isWarning: isP1Warning },
                      { label: 'Perakuan Kerja Tidak Siap', date: tamatStr, field: 'perakuanKerjaTidakSiapStatus', isWarning: isTamatWarning },
                      { label: 'Notis Peringatan Kedua', date: p2Str, field: 'notisPeringatan2Status', isWarning: isP2Warning },
                      { label: 'Notis Peringatan Ketiga', date: p3Str, field: 'notisPeringatan3Status', isWarning: isP3Warning }
                    ].map(n => (
                      <NoticeRow key={n.field} {...n} value={formData[n.field as keyof Project] as string | undefined} readOnly={isNoticeReadOnly} onChange={handleNoticeStatusChange} />
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100 max-md:min-h-[44px]">
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
                      className="w-4 h-4 max-md:w-5 max-md:h-5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <label htmlFor="isTiadaNotisDiperlukan" className="text-xs max-md:text-sm font-bold text-slate-600 select-none cursor-pointer max-md:flex-1 max-md:py-3">
                      Tiada Notis Diperlukan
                    </label>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
        
        <div className="mb-6 max-md:hidden">
          <PhaseStepperDesktop project={formData} tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
        {activeTab === 'phase1' && (
          <div className="space-y-4">
            <div className={yellowPhaseClass}>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>
              <h3 className="text-lg font-bold text-yellow-600 mb-6 max-md:mb-4 flex items-center gap-3"> <Zap className="h-5 w-5" /> Maklumat Asas (PJA) </h3>
              <div className="flex flex-col gap-6">
                <div className="group w-full"> <label className={labelClass}>Cadangan Kerja (Nama Projek)</label> <textarea ref={titleRef} name="namaProjek" value={formData.namaProjek || ''} onChange={handleInputChange} onBlur={handleInputBlur} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.currentTarget as HTMLTextAreaElement).blur(); } }} disabled={isGlobalReadOnly} className={`${inputClass} min-h-[60px] text-sm font-bold resize-y max-md:resize-none max-md:overflow-hidden max-md:leading-[1.45] uppercase`} placeholder="CADANGAN KERJA-KERJA..." /> </div>
                <div className="group w-full bg-slate-50 p-4 max-md:p-3 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2"> <div className="w-1 h-3 bg-emerald-500 rounded-full"></div> <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Lokasi & No. Aduan</label> </div>
                    {!isGlobalReadOnly && (
                      <button type="button" onClick={addLocationRow} className="text-[10px] flex max-md:hidden items-center gap-1 bg-white border border-slate-200 text-emerald-600 px-3 py-1.5 rounded-lg hover:bg-emerald-50 font-bold transition-colors shadow-sm" > <Plus className="w-3 h-3" /> Tambah Lokasi </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 max-md:max-h-none max-md:overflow-visible max-md:pr-0 custom-scrollbar">
                    {locationRows.map((row, idx) => (
                      <div key={row.id} className="flex flex-col md:flex-row gap-2 items-start animate-fade-in group/row max-md:bg-white max-md:border max-md:border-slate-200 max-md:rounded-xl max-md:p-2">
                        <div className="w-full md:flex-[2] relative"> <span className="absolute left-3 top-3.5 text-xs font-bold text-slate-400 select-none">{idx + 1}.</span> {isMobile ? <LokasiTextarea value={row.lokasi} onChange={(v) => updateLocationRow(row.id, 'lokasi', v)} disabled={isGlobalReadOnly} className={`${inputClass} pl-8 py-3 leading-snug ${!row.lokasi ? 'border-red-200 focus:border-red-500' : ''}`} /> : <input type="text" value={row.lokasi} onChange={(e) => updateLocationRow(row.id, 'lokasi', e.target.value)} disabled={isGlobalReadOnly} className={`${inputClass} pl-8 py-2 text-xs ${!row.lokasi ? 'border-red-200 focus:border-red-500' : ''}`} placeholder="Lokasi" required />} </div>
                        <div className="w-full md:flex-1 flex gap-2"> <input type="text" value={row.aduan} onChange={(e) => updateLocationRow(row.id, 'aduan', e.target.value)} disabled={isGlobalReadOnly} className={`${inputClass} py-2 text-xs max-md:min-h-[48px]`} placeholder="Aduan" /> {!isGlobalReadOnly && <button type="button" onClick={() => removeLocationRow(row.id)} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-white border border-transparent hover:border-red-100 transition-colors shadow-sm max-md:w-12 max-md:h-12 max-md:shrink-0 max-md:flex max-md:items-center max-md:justify-center max-md:border-slate-200" title="Padam Baris" aria-label="Padam Baris" > <X className="w-4 h-4 max-md:w-5 max-md:h-5" /> </button>} </div>
                      </div>
                    ))}
                  </div>
                  {!isGlobalReadOnly && (
                    <button type="button" onClick={addLocationRow} className="md:hidden mt-3 w-full h-12 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-300 bg-white text-emerald-700 text-sm font-bold"> <Plus className="w-4 h-4" /> Tambah Lokasi </button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 max-md:grid-cols-1 gap-4">
                  <div className="group"> <label className={labelClass}>BP</label> <select name="bp" value={formData.bp || ''} onChange={handleInputChange} disabled={isGlobalReadOnly} className={`${inputClass} py-2 font-bold max-md:min-h-[48px]`}> <option value="">Pilih...</option> {BP_OPTIONS.map(bp => <option key={bp} value={bp}>{bp}</option>)} </select> </div>
                  <div className="group" ref={zonDropdownRef}>
                    <label className={labelClass}>Zon</label>
                    <div className="relative">
                      <div
                        className={`${inputClass} py-2 font-bold cursor-pointer flex items-center justify-between min-h-[42px] max-md:min-h-[48px] ${isGlobalReadOnly ? 'bg-slate-50' : ''}`}
                        onClick={toggleZonDropdown}
                      >
                        <span className={`${!formData.zon ? 'text-slate-400 font-normal' : ''} truncate pr-2`}>
                          {formData.zon || 'Pilih...'}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isZonDropdownOpen ? 'rotate-180' : ''}`} />
                      </div>

                      {isZonDropdownOpen && createPortal(
                        <div
                          ref={zonPortalRef}
                          className="fixed bg-white border border-slate-200 rounded-xl shadow-2xl z-[9999] max-h-64 max-md:max-h-[60vh] overflow-y-auto p-2 grid grid-cols-2 max-md:grid-cols-4 gap-1 w-72"
                          style={{
                            top: zonDropdownRef.current ? zonDropdownRef.current.getBoundingClientRect().bottom + 5 : 0,
                            left: zonDropdownRef.current ? zonDropdownRef.current.getBoundingClientRect().left : 0,
                            width: isMobile && zonDropdownRef.current ? zonDropdownRef.current.getBoundingClientRect().width : undefined
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
                                className={`flex items-center justify-between p-2 max-md:p-1 max-md:h-11 max-md:justify-center max-md:gap-1 rounded-lg cursor-pointer ${isChecked ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-50 text-slate-600'}`}
                              >
                                <span className="text-[11px] max-md:text-[13px] font-bold select-none">{z}</span>
                                {isChecked && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                              </div>
                            );
                          })}
                        </div>,
                        document.body
                      )}
                    </div>
                  </div>
                  <div className={`${pairClass} md:contents`}>
                    <div className="group"> <label className={labelClass}>Mukim</label> <select name="mukim" value={formData.mukim || ''} onChange={handleInputChange} disabled={isGlobalReadOnly} className={`${inputClass} py-2 font-bold max-md:min-h-[48px]`}> <option value="">Pilih...</option> {MUKIM_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)} </select> </div>
                    <div className="group"> <label className={labelClass}>Tarikh Buka</label> <StrictDateInput name="tarikhBuka" value={formData.tarikhBuka || ''} onChange={handleInputChange} disabled={isGlobalReadOnly} className={`${inputClass} py-2 font-bold max-md:min-h-[48px] max-md:px-3`} /> </div>
                  </div>

                  <div className="group">
                    <label className={labelClass}>Pegawai (PJA)</label>
                    <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm transition-colors hover:border-emerald-300">
                      <div className="w-10 h-10 max-md:w-11 max-md:h-11 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shrink-0 overflow-hidden shadow-md text-white font-black">
                        <PjaAvatar user={users.find(u => u.id === formData.pjaId)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <select name="pjaId" value={formData.pjaId || ''} onChange={handlePjaChange} disabled={isPJA || isGlobalReadOnly} className="w-full bg-transparent border-none outline-none text-xs max-md:text-base max-md:min-h-[44px] font-bold text-slate-800 cursor-pointer p-0 m-0" >
                          <option value="">Pilih PJA...</option>
                          {users.map(u => (<option key={u.id} value={u.id}> {u.username.toUpperCase()} </option>))}
                        </select>
                        {users.find(u => u.id === formData.pjaId) && <p className="text-[9px] max-md:text-[11px] text-slate-400 font-bold uppercase truncate">{users.find(u => u.id === formData.pjaId)?.role.toLowerCase()}</p>}
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
          <div className="space-y-6 max-md:space-y-4">
            {isMobile ? (
              <>
                <div className={bluePhaseClass}>
                  {ptCardTop}
                  <div className="flex flex-col gap-4">{ptFields.noFail}{ptFields.namaSyarikat}{ptFields.bulan}{ptFields.noVote}{ptFields.noSebutharga}</div>
                </div>
                <section className={bluePhaseClass}>
                  <h4 className={ptGroupHeadingClass}>Tarikh Kontrak</h4>
                  <div className="flex flex-col gap-4">
                    <div className={ptPairClass}>{ptFields.tarikhLantikan}{ptFields.tarikhBpp}</div>
                    <div className={ptPairClass}>{ptFields.noBpp}{ptFields.noInden}</div>
                    {ptFields.tempoh}{ptFields.mulaKontrak}{ptFields.tamatKontrak}
                  </div>
                </section>
                <section className={bluePhaseClass}>
                  <h4 className={ptGroupHeadingClass}>Tapak</h4>
                  <div className="flex flex-col gap-4">
                    <div>
                      <div className={ptPairClass}>{ptFields.serahTapak}{ptFields.iso}</div>
                      <p className="text-xs text-slate-400 mt-1 italic text-right">Hari bekerja sahaja</p>
                    </div>
                    {ptFields.mulaKerja}
                  </div>
                </section>
              </>
            ) : (
              <div className={bluePhaseClass}>
                {ptCardTop}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-8">
                  {ptFields.noFail}{ptFields.namaSyarikat}{ptFields.bulan}{ptFields.noVote}{ptFields.tarikhLantikan}{ptFields.tarikhBpp}{ptFields.tempoh}{ptFields.mulaKontrak}{ptFields.tamatKontrak}{ptFields.noBpp}{ptFields.serahTapak}{ptFields.iso}{ptFields.mulaKerja}{ptFields.noInden}{ptFields.noSebutharga}
                </div>
              </div>
            )}
            <div className="rounded-[2rem] border border-slate-200 shadow-2xl bg-white/50">
              <div className="bg-white/80 p-6 max-md:p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10"> <div className="flex items-center gap-4"> <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20"> <FileSignature className="w-6 h-6" /> </div> <div> <h3 className="font-bold text-slate-900 text-xl tracking-tight">Dokumen Aku Janji</h3> <p className="text-xs text-slate-500 font-medium">Jana dan cetak dokumen rasmi</p> </div> </div> </div>
              <div className="p-6 max-md:p-3 bg-slate-50/50"> <AkuJanjiEditor project={formData as Project} selectedYear={selectedYear} pjaUser={users.find(u => u.id === formData.pjaId)} onUpdate={handleAkuJanjiUpdate} isPrintView={false} readOnly={isGlobalReadOnly} /> </div>
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
                    <p className="text-[14px] font-extrabold">CPC (Siap Kerja) Disekat</p>
                    <p className="text-[12px] text-red-600 font-medium">Sila pastikan PT atau Jurutera menetapkan status Notis Peringatan/Perakuan kepada 'Selesai Dikeluarkan' atau 'Tidak Diperlukan' untuk melepaskan sekatan ini.</p>
                  </div>
                </div>
              )}
              <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-8 gap-4">
                <h3 className="text-lg font-bold text-yellow-600 flex items-center gap-3"> <Info className="h-5 w-5" /> BQ Pelarasan Building </h3>
                <div className="flex flex-wrap gap-2 max-md:grid max-md:grid-cols-2">
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
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all ${certTileClass} ${
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
                    className={`flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-colors ${certTileClass}`}
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
                    className={`flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-colors ${certTileClass}`}
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
                    className={`flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-colors ${certTileClass}`}
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
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 max-md:mb-4 gap-4"> <h3 className="text-lg font-bold text-orange-600 flex items-center gap-3"> <CheckCircle className="h-5 w-5" /> Closing File / Project  </h3> </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-8 max-md:gap-y-4 max-md:items-end min-[380px]:max-md:grid-cols-2 min-[380px]:max-md:gap-x-3">
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
      {isLADOpen && (<LADCertificate project={formData as Project} onClose={() => setIsLADOpen(false)} />)}
      {isLoCOpen && (<LoCCertificate project={formData as Project} onClose={() => setIsLoCOpen(false)} />)}
      {isCPCOpen && (<CPCCertificate project={formData as Project} pjaUser={users.find(u => u.id === formData.pjaId)} onClose={() => setIsCPCOpen(false)} />)}
      {isPrestasiOpen && (<PrestasiCertificate project={formData as Project} onClose={() => setIsPrestasiOpen(false)} onPersist={handlePrestasiPersist} />)}
      {isNotisOpen && (<NotisGenerator project={formData as Project} pjaUser={users.find(u => u.id === formData.pjaId)} onClose={() => setIsNotisOpen(false)} />)}
      <BottomSheet open={isSwitcherSheetOpen} title="Tukar Projek" onClose={() => setIsSwitcherSheetOpen(false)}>
        <div className="-mx-5 -my-4">
          <ProjectSwitcherPanel
            projects={filteredSwitcherProjects}
            activeId={project?.id}
            query={switcherSearchQuery}
            onQueryChange={setSwitcherSearchQuery}
            showSiap={showSiapProjects}
            onShowSiapChange={setShowSiapProjects}
            onPick={(p) => { setIsSwitcherSheetOpen(false); handleProjectSwitch(p); }}
            autoFocusSearch={false}
            listClassName="p-2"
          />
        </div>
      </BottomSheet>
    </div>
  );
};

export default ProjectDetail;