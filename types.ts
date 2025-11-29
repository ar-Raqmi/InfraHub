

export enum Role {
  ADMIN = 'ADMIN', // "Blue"
  PJA = 'PJA',     // "Yellow"
}

export enum ProjectStatus {
  MENUNGGU_LANTIKAN = 'MENUNGGU_LANTIKAN', // Phase 1
  DALAM_PROSES = 'DALAM_PROSES',           // Phase 2 (Pelaksanaan)
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

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: Role;
  password?: string; // For mock auth
  email?: string;
  phone?: string;
  department?: string;
  avatarUrl?: string; // Added for profile picture
}

export interface GlobalDimensions {
  length: number; // P
  width: number;  // L
  depth: number;  // T
}

export interface BQItem {
  id: string;
  description: string; // Keterangan
  unit: string;
  qty: number;
  rate: number;
  amount: number; // Calculated
  isHeader?: boolean; // For bold headers like "1.0 INSURAN"
  isNote?: boolean; // NEW: For description only lines (no price)
  
  // New Smart Calculation Fields
  isCalculation?: boolean; // If true, use dimensions to calculate Qty
  isSynced?: boolean; // If true, uses Global Dimensions
  
  // Calculation Toggles - Control Formula
  includeLength?: boolean; // Include P in formula
  includeWidth?: boolean;  // Include L in formula
  includeDepth?: boolean;  // Include T in formula

  // Instance dimensions (if not synced, or overrides)
  dimLength?: number; // Panjang (P)
  dimWidth?: number;  // Lebar (L)
  dimDepth?: number;  // Tebal/Tinggi (T)
  dimCount?: number;  // Bilangan Unit / Faktor
}

export interface BQGroup {
  id: string;
  title: string; // e.g., "BIL NO. 1 - KERJA-KERJA PERMULAAN"
  location?: string; // e.g., "JALAN 9/27 TAMAN SRI GOMBAK"
  items: BQItem[];
}

export interface Project {
  id: number;
  
  // --- PHASE 1: BQ BUILDING (Yellow - PJA) ---
  namaProjek: string;
  noAduan?: string;
  aduan?: string;
  lokasi?: string;
  bp: string; // Blok Perancangan
  zon?: string;
  pjaId: number; // The PJA in charge
  kosProjek?: number; // Auto take from BQ
  tarikhBuka: string; // Today's date default
  
  // --- PHASE 2: FILE CREATION (Blue - Admin/PT) ---
  noFail: string;
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

  // --- PHASE 3: BQ PELARASAN BUILDING (Yellow - PJA) ---
  tarikhPemeriksaan?: string; // Tarikh Pemeriksaan
  tarikhSiapSebenar?: string; // Tarikh Siap (Pemeriksa)
  prestasi?: 'Cemerlang' | 'Baik' | 'Memuaskan' | 'Tidak Memuaskan';
  tarikhTuntutanBayaran?: string; // Changed from number amount to date
  
  kosSebenar?: number; // Calculated from BQPelarasan
  
  cpcDate?: string;
  ladAmount?: number;
  ladDays?: number;

  // --- PHASE 4: CLOSING FILE/PROJECT (Orange - Admin/PT) ---
  tarikhHantarKewangan?: string; // Tarikh Hantar ke Pemadanan
  tarikhPadanan?: string; // Tarikh Pemadanan
  peratusSiap?: number; // % Kerja di Tapak
  status: ProjectStatus;

  // DATA
  bqData?: BQGroup[]; // Original Contract BQ
  bqDataPelarasan?: BQGroup[]; // Adjusted BQ (Pelarasan)
  globalDimensions?: GlobalDimensions; // Saved global dims for this project
}

export const formatCurrency = (amount: number | undefined) => {
  if (amount === undefined) return '-';
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
  }).format(amount);
};

// Strict Malaysia Date Format (DD/MM/YYYY)
// Manually parsing string to avoid timezone shifts and force format
export const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  
  // Remove time part if exists
  const cleanDate = dateString.split('T')[0];
  const parts = cleanDate.split('-');
  
  // Expecting YYYY-MM-DD
  if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
  }
  
  return dateString;
};

// Get Today's Date in Malaysia Time (YYYY-MM-DD for inputs)
export const getCurrentDate = () => {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' });
};

export const getStatusColor = (status: ProjectStatus) => {
  switch (status) {
    case ProjectStatus.MENUNGGU_LANTIKAN: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case ProjectStatus.DALAM_PROSES: return 'bg-blue-100 text-blue-700 border-blue-200';
    case ProjectStatus.TUNTUTAN_BAYARAN: return 'bg-yellow-100 text-yellow-700 border-yellow-200'; // Phase 3 is also yellow in diagram
    case ProjectStatus.SIAP: return 'bg-orange-100 text-orange-700 border-orange-200'; // Phase 4 is orange
    default: return 'bg-gray-100 text-gray-700';
  }
};