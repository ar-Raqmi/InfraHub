
export enum Role {
  ADMIN = 'ADMIN', // "Blue"
  PJA = 'PJA',     // "Yellow"
  JURUTERA = 'JURUTERA', // New Role for Signers
}

export enum ProjectStatus {
  MENUNGGU_LANTIKAN = 'MENUNGGU_LANTIKAN', // Phase 1
  DALAM_PROSES = 'DALAM_PROSES',           // Phase 2 (Pelaksanaan)
  PEMERIKSAAN_TAPAK = 'PEMERIKSAAN_TAPAK', // Phase 2b (Pemeriksaan)
  TUNTUTAN_BAYARAN = 'TUNTUTAN_BAYARAN',   // Phase 3
  SIAP = 'SIAP',                           // Phase 4
}

export const BP_OPTIONS = [
  "BP 1: GOMBAK UTARA",
  "BP 2: PERMATANG KUARZA",
  "BP 3: GOMBAK SELATAN",
  "BP 4: SELAYANG-GOMBAK BARAT",
  "BP 5: KEPONG-SUNGAI BULOH",
  "BP 6: RAWANG TIMUR",
  "BP 7: RAWANG UTARA",
  "BP 8: RAWANG BARAT",
  "BP 9: RAWANG SELATAN",
  "BP 10: KAWASAN PEMELIHARAAN"
];

// Generate Zon 1 to Zon 24
export const ZON_OPTIONS = Array.from({ length: 24 }, (_, i) => `Zon ${i + 1}`);

// --- BQ PRESET TYPES ---
export type PresetVariant = {
  id: string;
  label: string; // e.g. "Dengan tangan"
  rate: number;
  unit: string;
};

export type PresetItem = {
  id: string;
  description: string;
  rate?: number; // Optional: If the item itself has a rate (no variants)
  unit?: string;
  variants?: PresetVariant[];
};

export type PresetGroup = {
  id: string;
  title: string; // Header Title (e.g. KERJA PENGOREKAN)
  category: string; // Main Group Category
  items: PresetItem[];
};

// --- DYNAMIC TEMPLATES ---
export type BQTemplateType = 'PERMULAAN_BASIC' | 'PERMULAAN_EMPTY' | 'LONGKANG' | 'EMPTY' | 'CUSTOM';

export interface BQTemplateItemRef {
    groupId: string;
    itemId: string;
    variantId?: string;
}

export interface BQTemplateBillDefinition {
    id: string;
    title: string;
    items: BQTemplateItemRef[];
}

export interface BQTemplateDefinition {
    id: string;
    key: BQTemplateType;
    title: string;
    subtitle: string;
    icon: 'file' | 'edit' | 'layout' | 'plus';
    color: 'blue' | 'indigo' | 'emerald' | 'slate';
    // Structured bills for multi-bill creation
    bills: BQTemplateBillDefinition[];
    // Legacy support
    groupRefs: string[]; 
}

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: Role;
  password?: string; // For mock auth
  email?: string;
  phone?: string;
  department?: string; // Legacy field, keeping for compat
  avatarUrl?: string; 
  
  // NEW FIELDS FOR COVER PAGE BINDING
  jawatan?: string;
  bahagian?: string;
  unit?: string;
}

export interface BulletinItem {
  id: string;
  content: string;
  date: string;
  author: string;
}

export interface CompanyDetail {
  name: string;
  address: string;
  ownerName: string;
  phone: string;
  phoneAlt?: string;
  email: string;
  gred: string; // e.g. "G1"
  registrationNumber?: string;
  limit?: number; 
}

export interface VoteDefinition {
  code: string; // No. Vot (e.g. "P.04.123")
  name: string; // Nama Vot (e.g. "Penyelenggaraan Jalan")
  allocation: number; // Jumlah Vot (Budget)
}

export interface GlobalDimensions {
  length: number; // P
  width: number;  // L
  depth: number;  // T
}

export interface CalculationPart {
  id: string;
  label?: string; // Optional: e.g. "Base", "Wall 1"
  
  // Flags
  hasLength: boolean;
  hasWidth: boolean;
  hasDepth: boolean;

  // Values
  length: number;
  width: number;
  depth: number;
  multiplier: number; // Factor
}

export interface BQItem {
  id: string;
  
  // Structure
  type: 'HEADER' | 'ITEM' | 'NOTE'; 
  isCollapsed?: boolean; // NEW: Controls visibility of children
  
  // Content
  description: string; // Main Description
  variant?: string; // e.g., "i) Dengan tangan"
  
  // Pricing & Unit
  unit: string;
  rate: number;
  
  // Dimensions for Calculation
  isGlobal?: boolean; // NEW: If true, syncs with location global dims
  
  // --- NEW: Multiple Calculation Parts ---
  calculationParts?: CalculationPart[];

  // --- DEPRECATED: Single Dim Fields (Keeping for backward compat if needed during migration) ---
  hasLength?: boolean;
  hasWidth?: boolean;
  hasDepth?: boolean;
  dimLength?: number; 
  dimWidth?: number;  
  dimDepth?: number;  
  dimMultiplier?: number; 
  
  // Custom Calculation Override (String Mode)
  isCustomCalc?: boolean;
  customCalc?: string; // The manual text string "80 x 0.5 = 40"

  // Calculated
  qty: number;
  amount: number;

  // Template Source Tracking (Optional)
  sourceGroupId?: string;
  sourceItemId?: string;
  sourceVariantId?: string;
}

export interface BQGroup {
  id: string;
  title: string; // e.g., "KERJA-KERJA PERMULAAN"
  locationId?: string; // Links to a specific locationRow ID
  calculationId?: string; // NEW: Links to a unique Global Calculation ID
  items: BQItem[];
}

export interface ProjectLocation {
  id: string;
  lokasi: string;
  aduan: string;
}

export interface Project {
  id: number;
  updatedAt?: string; // Tracking for "Recent Changes"
  
  // --- PHASE 1: BQ BUILDING (Yellow - PJA) ---
  namaProjek: string;
  noAduan?: string;
  aduan?: string;
  lokasi?: string;
  projectLocations?: ProjectLocation[]; // Structured location data with stable IDs
  bp: string; // Blok Perancangan
  zon?: string;
  pjaId: number; // The PJA in charge
  kosProjek?: number; // Auto take from BQ
  tarikhBuka: string; // Today's date default
  
  // --- PHASE 2: FILE CREATION (Blue - Admin/PT) ---
  noFail: string;
  noSebutharga?: string; // NEW: No. Sebutharga (e.g. MPS/SH/192/23)
  noInden?: string; // NEW: No. Inden / Pesanan Rasmi
  noBpp?: string; // NEW: No. BPP
  namaSyarikat?: string;
  bulan?: string;
  noVote?: string; // No Vot
  tarikhLantikan?: string; // Tarikh Lantikan
  tarikhCetakanBpp?: string; // Tarikh BPP
  tempohKontrak?: string; // Tempoh Kontrak
  tarikhMulaKontrak?: string; // Tarikh Mula Kontrak
  tarikhTamatKontrak?: string; // Tarikh Tamat Kontrak
  tarikhSerahTapak?: string; // Tarikh Serah Tapak
  iso?: string; // ISO
  tarikhMulaKerja?: string; // Auto or manual type (Mula + tempoh)
  isManualMulaKontrak?: boolean; // Persisted manual toggle
  isManualMulaKerja?: boolean; // Persisted manual toggle

  // --- PHASE 3: BQ PELARASAN BUILDING (Yellow - PJA) ---
  tarikhPemeriksaan?: string; // Tarikh Pemeriksaan
  tarikhSiapSebenar?: string; // Tarikh Siap (Pemeriksa)
  prestasi?: string; // Changed to string for % input
  tarikhTuntutanBayaran?: string; // Changed from number amount to date
  
  kosSebenar?: number; // Calculated from BQPelarasan (Capped at kosProjek)
  bqPelarasanExtra?: number; // Extra price overflow (uncapped amount above kosProjek)
  
  ladAmount?: number;
  ladDays?: number;
  wangTahanan?: number; // Retention Money

  // --- PRESTASI FORM DATA (NEW) ---
  skop?: 'BEKALAN' | 'PERKHIDMATAN' | 'KERJA';
  prestasiScores?: number[]; // Array of 6 scores (1-10)
  noInbois?: string; // Dedicated field for Invoice No in Prestasi Certificate

  // --- PHASE 4: CLOSING FILE/PROJECT (Orange - Admin/PT) ---
  tarikhHantarKewangan?: string; // Tarikh Hantar ke Pemadanan
  tarikhPadanan?: string; // Tarikh Pemadanan
  peratusSiap?: number; // % Kerja di Tapak
  status: ProjectStatus;

  // DATA
  bqData?: BQGroup[]; // Original Contract BQ
  bqDataPelarasan?: BQGroup[]; // Adjusted BQ (Pelarasan)
  
  // Dimensions
  globalDimensions?: GlobalDimensions; // DEPRECATED: Keep for backward compat
  locationDimensions?: Record<string, GlobalDimensions>; // Map location string to dims (Contract)
  locationDimensionsPelarasan?: Record<string, GlobalDimensions>; // NEW: Map location string to dims (Pelarasan)
  
  // NEW DIMENSIONS (BINDED BY BIL NO / CALCULATION ID)
  globalCalculations?: Record<string, GlobalDimensions>;
  globalCalculationsPelarasan?: Record<string, GlobalDimensions>;

  // AKU JANJI
  akuJanjiMonth?: string; // The selected month string e.g. "November"
  akuJanjiPanelTitle?: string; // Title for "Kontraktor Panel"
  akuJanjiFooterText?: string; // Text after year, e.g. "PJA NAME - COMPANY"

  // COVER PAGE SETTINGS (NEW)
  coverJawatan?: string; // e.g. "Penolong Jurutera JA5"
  coverBahagian?: string; // e.g. "Bahagian Infrastruktur"
  coverUnit?: string; // e.g. "Unit Selenggara Infrastruktur"
  coverSebutHargaText?: string; // Multiline text for Page 2
}

export const formatCurrency = (amount: number | undefined) => {
  if (amount === undefined) return '-';
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
  }).format(amount);
};

export const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  
  const cleanDate = dateString.split('T')[0];
  const parts = cleanDate.split('-');
  
  if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
  }
  
  return dateString;
};

export const formatDateMalay = (dateString?: string) => {
  if (!dateString) return '-';
  const months = ["JANUARI", "FEBRUARI", "MAC", "APRIL", "MEI", "JUN", "JULAI", "OGOS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DISEMBER"];
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day} ${month} ${year}`;
};

export const getCurrentDate = () => {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' });
};

export const getStatusColor = (status: ProjectStatus) => {
  switch (status) {
    case ProjectStatus.MENUNGGU_LANTIKAN: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case ProjectStatus.DALAM_PROSES: return 'bg-blue-100 text-blue-700 border-blue-200';
    case ProjectStatus.PEMERIKSAAN_TAPAK: return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case ProjectStatus.TUNTUTAN_BAYARAN: return 'bg-orange-100 text-orange-700 border-orange-200'; // Kept yellow/orange theme
    case ProjectStatus.SIAP: return 'bg-emerald-100 text-emerald-700 border-emerald-200'; // Changed to Emerald for Done
    default: return 'bg-gray-100 text-gray-700';
  }
};
