
export enum Role {
  ADMIN = 'ADMIN', // PT (Pembantu Tadbir) - Full access
  PJA = 'PJA',     // Penolong Jurutera Awam - Limited access
}

export enum ProjectStatus {
  MENUNGGU_LANTIKAN = 'MENUNGGU_LANTIKAN', // Phase 1
  DALAM_PROSES = 'DALAM_PROSES',           // Phase 2 (Pelaksanaan)
  TUNTUTAN_BAYARAN = 'TUNTUTAN_BAYARAN',   // Phase 3
  SIAP = 'SIAP',                           // Phase 4
}

export enum TempohKontrakUnit {
  HARI = 'HARI',
  MINGGU = 'MINGGU',
  BULAN = 'BULAN',
}

export interface Aduan {
  id: string;
  noAduan: string; // e.g., "MPS.012334" or "AHLI MAJLIS"
  lokasi: string;  // e.g., "Jalan 1/2 Sri Gombak"
}

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

export interface BQItem {
  id: string;
  description: string; // Keterangan
  unit: string;
  qty: number;
  rate: number;
  amount: number; // Calculated
  isHeader?: boolean; // For bold headers like "1.0 INSURAN"
  isCalculationRow?: boolean; // For the (P) x (L) rows
  calculationFormula?: string;
}

export interface BQGroup {
  id: string;
  bilNo?: string; // e.g., "BIL NO. 1"
  title: string; // e.g., "KERJA-KERJA PERMULAAN"
  location?: string; // e.g., "JALAN 9/27 TAMAN SRI GOMBAK"
  items: BQItem[];
}

export interface PrestasiScores {
  q1: number; // Kualiti Kerja
  q2: number; // Jadual Pelaksanaan
  q3: number; // Pengurusan Tapak
  q4: number; // Pematuhan Arahan
  q5: number; // Kebersihan & Keselamatan
  q6: number; // Kerjasama
}

export interface Project {
  id: number;
  
  // --- PHASE 1: BQ BUILDING & ASAS ---
  namaProjek: string;
  noFail: string;
  tarikhBuka: string;
  bp: string; // Blok Perancangan
  zon?: string;
  pjaId: number;

  // Aduan - Multiple complaint numbers with locations
  aduanList: Aduan[]; // New: Supports multiple aduan with lokasi

  // Legacy fields (kept for backward compatibility)
  noAduan?: string; // Deprecated: Use aduanList instead
  lokasi?: string;  // Deprecated: Use aduanList instead
  aduan?: string;   // Deprecated: Use aduanList instead
  
  // --- PHASE 2: FILE CREATION & LANTIKAN ---
  noVote?: string;
  namaSyarikat?: string;
  bulan?: string;
  kosProjek?: number; // Derived from BQ (Auto take from BQ)
  tarikhLantikan?: string; // SST Date
  tarikhCetakanBpp?: string; // Date BPP Printed
  tarikhMulaKontrak?: string;
  tarikhTamatKontrak?: string; // Auto-calculated from tempohKontrak + unit
  tempohKontrak?: number; // Contract period value
  tempohKontrakUnit?: TempohKontrakUnit; // HARI, MINGGU, or BULAN
  tarikhSerahTapak?: string;
  tarikhMulaKerja?: string; // Actual start
  iso?: string; // Auto-generated code

  // --- PHASE 3: PELARASAN & PELAKSANAAN ---
  tarikhPermohonanLawatanTapak?: string;
  tarikhSiapSebenar?: string; // CPC Date essentially
  
  // LAD (Denda Lewat)
  ladAmount?: number; 
  ladDays?: number;
  
  // CPC (Certificate of Practical Completion)
  cpcDate?: string; 
  cpcRef?: string;

  // --- PHASE 4: TUNTUTAN & CLOSING ---
  tarikhSyarikatKemukakanTuntutan?: string; // Tarikh Syarikat Kemukakan Dokumen Tuntutan
  tarikhHantarKewangan?: string; // Tarikh Hantar Dokumen Tuntutan Ke Kewangan
  tarikhPadanan?: string; // Tarikh Padanan Kali 2
  
  kosProjekSebenar?: number; // Final Account
  
  // Prestasi
  prestasi?: 'Cemerlang' | 'Baik' | 'Memuaskan' | 'Tidak Memuaskan';
  prestasiScores?: PrestasiScores;
  
  // Regular Update
  peratusSiap?: number; // Available globally

  status: ProjectStatus;
  bqData?: BQGroup[]; // Stored BQ JSON
  bqPelarasanData?: BQGroup[]; // Stored Adjusted BQ JSON (Phase 3)
}

export const formatCurrency = (amount: number | undefined) => {
  if (amount === undefined) return '-';
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
  }).format(amount);
};

export const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ms-MY');
};

export const getStatusLabel = (status: ProjectStatus) => {
  switch (status) {
    case ProjectStatus.MENUNGGU_LANTIKAN: return 'Menunggu Lantikan';
    case ProjectStatus.DALAM_PROSES: return 'Dalam Proses';
    case ProjectStatus.TUNTUTAN_BAYARAN: return 'Tuntutan Bayaran';
    case ProjectStatus.SIAP: return 'Siap';
    default: return status;
  }
};

export const getStatusColor = (status: ProjectStatus) => {
  switch (status) {
    case ProjectStatus.MENUNGGU_LANTIKAN: return 'bg-slate-100 text-slate-700 border-slate-200';
    case ProjectStatus.DALAM_PROSES: return 'bg-blue-100 text-blue-700 border-blue-200';
    case ProjectStatus.TUNTUTAN_BAYARAN: return 'bg-orange-100 text-orange-700 border-orange-200';
    case ProjectStatus.SIAP: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    default: return 'bg-gray-100 text-gray-700';
  }
};
