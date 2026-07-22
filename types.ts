
export enum Role {
  ADMIN = 'ADMIN', // "Blue"
  PJA = 'PJA',     // "Yellow"
  JURUTERA = 'JURUTERA', // New Role for Signers
}

export enum ProjectStatus {
  FASA_DRAF = 'FASA_DRAF',
  MENUNGGU_LANTIKAN = 'MENUNGGU_LANTIKAN',
  DALAM_PROSES = 'DALAM_PROSES',
  PEMERIKSAAN_TAPAK = 'PEMERIKSAAN_TAPAK',
  TUNTUTAN_BAYARAN = 'TUNTUTAN_BAYARAN',
  SIAP = 'SIAP',
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

export const MUKIM_OPTIONS = [
  "BATU",
  "RAWANG"
];

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
  items: (BQTemplateItemRef | BQItem)[];
}

export interface BQTemplateDefinition {
  id: string;
  key: BQTemplateType;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  // Structured bills for multi-bill creation
  bills: BQTemplateBillDefinition[];
  // Legacy support
  groupRefs: string[];
  orderIndex?: number;
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

export interface TemporaryImage {
  id: string;
  createdAt: string;
  userId: number;
  userFullName: string;
  imageUrl: string;
  thumbnailUrl?: string;
  projectId?: number;
  locationTag?: string;
}

export interface BulletinItem {
  id: string;
  content: string;
  date: string;
  author: string;
  readBy?: number[];
  reactions?: Record<string, number[]>;
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
  label?: string; // NEW: Label for this dimension group
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

  // NEW: Global linking
  isGlobal?: boolean;
  globalIndex?: number; // Index in the globalCalculations array
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

  // --- NEW: Pelarasan Addition ---
  isAdjustment?: boolean; // If true, this item was added during Pelarasan phase
}

export interface BQGroup {
  id: string;
  title: string; // e.g., "KERJA-KERJA PERMULAAN"
  locationId?: string; // act as a fallback for old datas
  locationIds?: string[]; // NEW: Links to multiple locationRow IDs
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
  apiVersion?: string;
  updatedAt?: string; // Tracking for "Recent Changes"

  // --- PHASE 1: BQ BUILDING (Yellow - PJA) ---
  namaProjek: string;
  noAduan?: string;
  aduan?: string;
  lokasi?: string;
  projectLocations?: ProjectLocation[]; // Structured location data with stable IDs
  bp: string; // Blok Perancangan
  zon?: string;
  mukim?: string;
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
  locAmount?: number; // Late of Claim Amount (Denda Lewat)
  locDays?: number;   // Late of Claim Days
  isLocDeductionEnabled?: boolean; // Toggle for LoC deduction
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
  globalCalculations?: Record<string, GlobalDimensions | GlobalDimensions[]>;
  globalCalculationsPelarasan?: Record<string, GlobalDimensions | GlobalDimensions[]>;

  // AKU JANJI
  akuJanjiMonth?: string; // The selected month string e.g. "November"
  akuJanjiPanelTitle?: string; // Title for "Kontraktor Panel"
  akuJanjiFooterText?: string; // Text after year, e.g. "PJA NAME - COMPANY"

  // COVER PAGE SETTINGS (NEW)
  coverJawatan?: string; // e.g. "Penolong Jurutera JA5"
  coverBahagian?: string; // e.g. "Bahagian Infrastruktur"
  coverUnit?: string; // e.g. "Unit Selenggara Infrastruktur"
  coverSebutHargaText?: string; // Multiline text for Page 2

  // NOTICE STATUS SETTINGS (NEW)
  notisPeringatan1Status?: 'PENDING' | 'SENT' | 'NOT_REQUIRED';
  perakuanKerjaTidakSiapStatus?: 'PENDING' | 'SENT' | 'NOT_REQUIRED';
  notisPeringatan2Status?: 'PENDING' | 'SENT' | 'NOT_REQUIRED';
  notisPeringatan3Status?: 'PENDING' | 'SENT' | 'NOT_REQUIRED';
  isTiadaNotisDiperlukan?: boolean;
}

import { Formatter } from './services/Formatter';
import { StatusHelper } from './services/StatusHelper';
import { calculateLADDailyRate } from './services/finance';

export const formatCurrency = Formatter.formatCurrency;
export const formatDate = Formatter.formatDate;
export const formatDateMalay = Formatter.formatDateMalay;
export const formatDateMalayTitleCase = Formatter.formatDateMalayTitleCase;
export const getCurrentDate = Formatter.getCurrentDate;
export const getStatusColor = StatusHelper.getStatusColor;
export const getStatusLabel = StatusHelper.getStatusLabel;
export { calculateLADDailyRate };
