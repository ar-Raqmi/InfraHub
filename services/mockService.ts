
import { Project, User, Role, ProjectStatus, BQGroup, CompanyDetail } from '../types';

// --- RAW DATA FROM PROMPT ---
const RAW_PROJECT_DATA = `
CADANGAN KERJA-KERJA MEMBAIKPULIH LONGKANG DAN PERABOT JALAN SERTA KERJA-KERJA BERKAITAN DI 1. PEMASANGAN RALLING DI JALAN JU 7, TAMAN JASA UTAMA, 2. TEPI PADANG DI JALAN JU 10, TAMAN JASA UTAMA. DAERAH GOMBAK SELANGOR DARUL EHSAN	MPS 28/PLP-01/25	06/01/2025	FARHAN	MPS.024313, PENDUDUK	BP 4: SELAYANG - GOMBAK BARAT	282090	JENTAYU PERTAMA ENTERPRISE	30,480.19	26,690.34	1/16/2025	13/03/2025	1/24/2025	1/28/2025	100%	05/03/2025	05/03/2025	3/17/2025	3/19/2025	21/03/2025	26/03/2025	70%	27/02/2025
CADANGAN KERJA-KERJA MEMBAIKPULIH SEMULA LONGKANG SEDIA ADA DI NO 19 JALAN SETIA 2 TAMAN SETIA SERTA KERJA-KERJA BERKAITAN, MUKIM RAWANG , DAERAH GOMBAK, SELANGOR DARUL EHSAN.	MPS 28/PLP-02/25	06/01/2025	NURSILMI	AHLI MAJLIS	BP 6: RAWANG TIMUR	282090	RAMI BINA ENTERPRISE	28,277.16	25,520.86	1/22/2025	19/03/2025	1/21/2025	1/27/2025	100%	07/03/2025	07/03/2025			30/04/2025	05/05/2025	73%	04/03/2025
CADANGAN KERJA-KERJA MEMBAIKPULIH SEMULA LONGKANG SEDIA ADA DI NO 3D JALAN SEPAKAT KG MELAYU BT 16 SERTA KERJA- KERJA BERKAITAN, MUKIM RAWANG , DAERAH GOMBAK, SELANGOR DARUL EHSAN.	MPS 28/PLP-03/25	06/01/2025	NURSILMI	MPS.024518	BP 6: RAWANG TIMUR	282090	GGAFIQ ENTERPRISE	32,368.72	32,368.72	1/22/2025	19/03/2025	1/20/2025	1/24/2025	100%	07/03/2025	07/03/2025	3/17/2025	3/26/2025	28/03/2025	07/04/2025	95%	20/02/2025
CADANGAN KERJA-KERJA MEMBAIKPULIH SEMULA LONGKANG SEDIA ADA DI NO 37 JALAN 4/4 TAMAN BUKIT RAWANG JAYA, NO 28 JALAN 2/11 TAMAN BUKIT RAWANG JAYA ,JALAN 2 TAMAN BUKIT RAWANG JAYA SERTA KERJA-KERJA BERKAITAN, MUKIM RAWANG , DAERAH GOMBAK, SELANGOR DARUL EHSAN.	MPS 28/PLP-04/25	06/01/2025	NURSILMI	MPS.023202, MPS.018698, SEL.913776	BP 6: RAWANG TIMUR	282090	SRI MEGA ENTERPRISE	34,175.44	34,163.46	1/16/2025	13/03/2025	1/20/2025	1/24/2025	100%	22/05/2025	22/05/2025	6/3/2025	6/16/2025	18/06/2025	25/06/2025	80%	15/03/2025
CADANGAN KERJA-KERJA MEMBAIKPULIH SEMULA LONGKANG SEDIA ADA DI NO 18 JALAN MAWAR 12, TEPI PADANG TAMAN MAWAR , JALAN 4B TAMAN MUHIBAH SERTA KERJA-KERJA BERKAITAN, MUKIM RAWANG, DAERAH GOMBAK, SELANGOR DARUL EHSAN.	MPS 28/PLP-05/25	06/01/2025	NURSILMI	MPS.024252, MPS.024251, MPS.024127	BP 6: RAWANG TIMUR	282090	MUBARAK MAJU ENTERPRISE	30,927.26	30,927.26	1/16/2025	13/03/2025	1/21/2025	1/27/2025	100%	19/03/2025	19/03/2025	3/24/2025	3/25/2025	26/03/2025	07/04/2025	83%	20/02/2025
CADANGAN KERJA-KERJA MEMBAIKPULIH SEMULA LONGKANG SEDIA ADA DI NO 4612 JALAN RAWANG GARDEN 7, NO 4640,4641,4656,4657 JALAN RAWANG GARDEN 8 TAMAN RAWANG GARDEN .NO 4 JALAN SRI HIJAU 4 TAMAN SRI HIJAU SERTA KERJA-KERJA BERKAITAN, MUKIM RAWANG, DAERAH GOMBAK, SELANGOR DARUL EHSAN.	MPS 28/PLP-06/25	06/01/2025	NURSILMI	MPS.023442, MPS.025878, MPS.025108	BP 6: RAWANG TIMUR	282090	P ONE CONSTRUCTION	27,999.24	27,999.24	1/16/2025	13/03/2025	1/16/2025	1/20/2025	100%	24/02/2025	24/02/2025	3/3/2025	3/7/2025	11/03/2025	17/03/2025	95%	24/01/2025
CADANGAN KERJA-KERJA MEMBAIKPULIH LONGKANG DI LORONG SAMUDERA SELATAN 2 DAN KERJA-KERJA MEMBAIKPULIH LONGKANG DI LORONG SAMUDERA SELATAN 1 SERTA KERJA-KERJA BERKAITAN,MUKIM BATU,DAERAH GOMBAK,SELANGOR DARUL EHSAN	MPS 28/PLP-07/25	07/01/2025	KHAIRUL	AHLI MAJLIS	BP 4: SELAYANG - GOMBAK BARAT	282090	MAZIQ ENGINEERING & SERVICES	29,179.61	29,179.61	1/16/2025	13/03/2025	1/15/2025	1/20/2025	100%	25/02/2025	25/02/2025	1/23/2025	3/4/2025	10/03/2025	17/03/2025	80%	18/02/2025
CADANGAN KERJA-KERJA MEMBAIKPULIH LONGKANG DI JALAN 1 TAMAN JALAN 1 TAMAN GREENWOOD SERTA KERJA-KERJA BERKAITAN,MUKIM BATU,DAERAH GOMBAK,SELANGOR DARUL EHSAN	MPS 28/PLP-08/25	07/01/2025	KHAIRUL	AHLI MAJLIS	BP 3: GOMBAK SELATAN	282090	JUTAAN HASIL ENTERPRISE	27,683.91	19,131.74	1/16/2025	13/03/2025	1/21/2025	1/27/2025	100%	30/05/2025	30/05/2025	6/26/2025	6/26/2025	25/06/2025	26/06/2025	48%	28/03/2025
CADANGAN KERJA-KERJA MEMBAIKPULIH LONGKANG DI JALAN SRI EHSAN 8, TAMAN SRI EHSAN, SERTA KERJA-KERJA BERKAITAN, MUKIM BATU, DAERAH GOMBAK, SELANGOR DARUL EHSAN	MPS 28/PLP-09/25	07/01/2025	SALAM	MEMO DALAMAN JPSPK	BP 5: KEPONG - SUNGAI BULOH	282090	ALPHA CULTURE RESOURCES	59,406.34	59,300.91	1/22/2025	19/03/2025	1/22/2025	1/27/2025	100%	21/03/2025	21/03/2025	4/14/2025	4/16/2025	30/04/2025	05/05/2025	82%	07/03/2025
CADANGAN KERJA-KERJA MEMBAIKPULIH SEMULA LONGKANG SEDIA ADA DI NO 30 PT4476 JALAN 7 KG SG TERENTANG , NO 182A & 184A LORONG 2 KG SG TERENTANG SERTA KERJA-KERJA BERKAITAN MUKIM RAWANG , DAERAH GOMBAK, SELANGOR DARUL EHSAN.	MPS 28/PLP-10/25	07/01/2025	NURSILMI	MPS.025408, MPS.025196	BP 6: RAWANG TIMUR	282090	PERWAJA MAJU ENTERPRISE	32,623.27	29,620.26	1/16/2025	13/03/2025	1/21/2025	1/27/2025	100%	13/05/2025	13/05/2025	6/3/2025	6/9/2025	18/06/2025	25/06/2025	77%	23/04/2025
`;

// Helper to parse dates (handles DD/MM/YYYY and M/D/YYYY)
const parseDate = (str: string) => {
  if (!str) return undefined;
  const parts = str.trim().split(/[\/-]/);
  if (parts.length !== 3) return undefined;
  
  let d = parseInt(parts[0]);
  let m = parseInt(parts[1]);
  let y = parseInt(parts[2]);
  
  // Heuristic: If Month > 12, it must be Day (swap)
  // Example: 1/16/2025 -> d=1, m=16 (Swap to m=1, d=16)
  if (m > 12) {
      const temp = d;
      d = m;
      m = temp;
  }
  
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};

const parseCurrency = (str: string) => {
    return parseFloat(str.replace(/,/g, '')) || 0;
};

// Initial Seed Data
const INITIAL_USERS: User[] = [
  { 
    id: 1, 
    username: 'syafiq', 
    fullName: 'Syafiq Daniel Bin Ahmad Firdaus', 
    role: Role.ADMIN, 
    password: 'password', 
    email: 'syafiq@mps.gov.my', 
    phone: '012-3456789',
    jawatan: 'Pembantu Tadbir N1',
    bahagian: 'Bahagian Infrastruktur',
    unit: 'Unit Selenggara Infrastruktur'
  },
  { 
    id: 2, 
    username: 'khairul', 
    fullName: 'Mohamad Khairul Amirin Bin Zainal Abidin', 
    role: Role.PJA, 
    password: 'password', 
    email: 'khairul@mps.gov.my', 
    phone: '013-9876543',
    jawatan: 'Penolong Jurutera JA5',
    bahagian: 'Bahagian Infrastruktur',
    unit: 'Unit Selenggara Infrastruktur'
  },
  { 
    id: 3, 
    username: 'farhan', 
    fullName: 'Muhammad Farhan', 
    role: Role.PJA, 
    password: 'password', 
    email: 'farhan@mps.gov.my', 
    phone: '014-1234567',
    jawatan: 'Penolong Jurutera JA5',
    bahagian: 'Bahagian Infrastruktur',
    unit: 'Unit Selenggara Infrastruktur'
  },
  { 
    id: 4, 
    username: 'nursilmi', 
    fullName: 'Nursilmi Binti Ahmad', 
    role: Role.PJA, 
    password: 'password', 
    email: 'nursilmi@mps.gov.my', 
    phone: '015-9876543',
    jawatan: 'Penolong Jurutera JA5',
    bahagian: 'Bahagian Infrastruktur',
    unit: 'Unit Selenggara Infrastruktur'
  },
  { 
    id: 5, 
    username: 'salam', 
    fullName: 'Abd Salam', 
    role: Role.PJA, 
    password: 'password', 
    email: 'salam@mps.gov.my', 
    phone: '016-1234567',
    jawatan: 'Penolong Jurutera JA5',
    bahagian: 'Bahagian Infrastruktur',
    unit: 'Unit Selenggara Infrastruktur'
  }
];

// GENERATE PROJECTS FROM RAW DATA
const INITIAL_PROJECTS: Project[] = RAW_PROJECT_DATA.trim().split('\n').map((line, index) => {
    const cols = line.split('\t');
    
    const namaProjek = cols[0];
    const noFail = cols[1];
    const tarikhBuka = parseDate(cols[2]) || '';
    const pjaName = cols[3]?.toLowerCase();
    const aduan = cols[4];
    const bp = cols[5];
    const noVote = cols[6];
    const namaSyarikat = cols[7];
    const kosProjek = parseCurrency(cols[8]);
    const kosSebenar = parseCurrency(cols[9]);
    const tarikhMulaKontrak = parseDate(cols[10]);
    const tarikhTamatKontrak = parseDate(cols[11]);
    const tarikhSerahTapak = parseDate(cols[12]);
    const tarikhMulaKerja = parseDate(cols[13]);
    const peratusSiap = parseInt(cols[14]?.replace('%', '')) || 0;
    const tarikhTuntutan = parseDate(cols[15]);
    // cols[16] Dokumen Terima - Ignored or mapped if needed
    // cols[17] PJA Peraku - Ignored
    // cols[18] JR Peraku - Ignored
    const tarikhHantarKewangan = parseDate(cols[19]);
    const tarikhPadanan = parseDate(cols[20]);
    const prestasiStr = cols[21]?.replace('%', ''); // "70%"
    
    // Map PJA Name to ID
    let pjaId = 1; // Default Admin
    const user = INITIAL_USERS.find(u => u.username === pjaName);
    if (user) pjaId = user.id;

    // Determine Status
    let status = ProjectStatus.MENUNGGU_LANTIKAN;
    if (namaSyarikat) status = ProjectStatus.DALAM_PROSES;
    if (tarikhTuntutan) status = ProjectStatus.TUNTUTAN_BAYARAN;
    if (tarikhPadanan) status = ProjectStatus.SIAP;

    return {
        id: Date.now() + index,
        namaProjek,
        noFail,
        tarikhBuka,
        pjaId,
        noAduan: aduan,
        bp,
        noVote,
        namaSyarikat,
        kosProjek,
        kosSebenar,
        tarikhMulaKontrak,
        tarikhTamatKontrak,
        tarikhSerahTapak,
        tarikhMulaKerja,
        peratusSiap,
        tarikhTuntutanBayaran: tarikhTuntutan,
        tarikhHantarKewangan,
        tarikhPadanan,
        status,
        prestasi: prestasiStr ? `${prestasiStr}%` : undefined,
        // Default empty arrays
        bqData: [],
        bqDataPelarasan: []
    } as Project;
});

// Extract Companies and Votes from parsed projects
const UNIQUE_COMPANIES = Array.from(new Set(INITIAL_PROJECTS.map(p => p.namaSyarikat).filter(Boolean))) as string[];
const UNIQUE_VOTES = Array.from(new Set(INITIAL_PROJECTS.map(p => p.noVote).filter(Boolean))) as string[];

const INITIAL_SEBUTHARGA = [
    "MPS/SH/2024/001",
    "MPS/SH/2024/002",
    "MPS/SH/2024/003"
];

class MockService {
  private users: User[] = [];
  private projects: Project[] = [];
  private systemSettings: Record<string, any> = {}; // Keyed by year string
  private currentUser: User | null = null;

  constructor() {
    this.loadData();
  }

  private loadData() {
    const storedUsers = localStorage.getItem('infrahub_users');
    const storedProjects = localStorage.getItem('infrahub_projects');
    const storedSession = localStorage.getItem('infrahub_session');
    const storedSettings = localStorage.getItem('infrahub_settings');

    // Use Parsed Users if not in local storage, or merge/reset
    this.users = storedUsers ? JSON.parse(storedUsers) : INITIAL_USERS;
    
    // Ensure new PJAs exist if loading from old local storage
    INITIAL_USERS.forEach(initUser => {
        if (!this.users.find(u => u.username === initUser.username)) {
            this.users.push(initUser);
        }
    });

    // Overwrite projects with the requested mock data for this session to ensure they appear
    // In a real app, we wouldn't overwrite user data, but for this "Mock" request, we reset.
    if (!storedProjects || storedProjects.length < 5) {
         this.projects = INITIAL_PROJECTS;
    } else {
         this.projects = JSON.parse(storedProjects);
         // Optional: Merge new mock data if needed, but let's just stick to what's there if valid
    }

    this.systemSettings = storedSettings ? JSON.parse(storedSettings) : {};

    const currentYear = "2025"; // Based on mock data year
    if (!this.systemSettings[currentYear]) {
        this.systemSettings[currentYear] = {
            companies: UNIQUE_COMPANIES,
            voteNumbers: UNIQUE_VOTES,
            sebuthargaNumbers: INITIAL_SEBUTHARGA,
            meetingDate: '',
            companyDetails: {} 
        };
    }

    if (storedSession) {
      this.currentUser = JSON.parse(storedSession);
    }
  }

  private saveData() {
    localStorage.setItem('infrahub_users', JSON.stringify(this.users));
    localStorage.setItem('infrahub_projects', JSON.stringify(this.projects));
    localStorage.setItem('infrahub_settings', JSON.stringify(this.systemSettings));

    if (this.currentUser) {
      localStorage.setItem('infrahub_session', JSON.stringify(this.currentUser));
    } else {
      localStorage.removeItem('infrahub_session');
    }
  }

  // Auth
  async login(username: string, password: string): Promise<User> {
    const user = this.users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    if (!user) throw new Error('Invalid credentials');
    this.currentUser = user;
    this.saveData();
    return user;
  }

  async logout() {
    this.currentUser = null;
    this.saveData();
  }

  getCurrentUser() {
    return this.currentUser;
  }

  // Projects
  getProjects() {
    return [...this.projects];
  }

  async createProject(project: Omit<Project, 'id'>) {
    const newId = Date.now();
    const safeProject = {
      ...project,
      id: newId,
      kosProjek: Number(project.kosProjek) || 0,
    };

    this.projects.push(safeProject);
    this.saveData();
    return safeProject;
  }

  async updateProject(id: number, updates: Partial<Project>) {
    const index = this.projects.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Project not found');
    
    const updatedProject = { ...this.projects[index], ...updates };
    if (updates.kosProjek !== undefined) updatedProject.kosProjek = Number(updates.kosProjek);

    this.projects[index] = updatedProject;
    this.saveData();
    return this.projects[index];
  }

  async deleteProject(id: number) {
    this.projects = this.projects.filter(p => p.id !== id);
    this.saveData();
  }

  // Users
  getUsers() {
    return this.users;
  }

  async addUser(user: Omit<User, 'id'>) {
    const newId = Date.now();
    const newUser = { ...user, id: newId };
    this.users.push(newUser);
    this.saveData();
    return newUser;
  }
  
  async updateUser(id: number, updates: Partial<User>) {
      const index = this.users.findIndex(u => u.id === id);
      if (index === -1) throw new Error('User not found');
      
      this.users[index] = { ...this.users[index], ...updates };
      
      // Update session if editing current user
      if (this.currentUser && this.currentUser.id === id) {
          this.currentUser = this.users[index];
      }
      
      this.saveData();
      return this.users[index];
  }

  async deleteUser(id: number) {
    this.users = this.users.filter(u => u.id !== id);
    this.saveData();
  }

  // Dropdown Management (Companies) - Year Binded
  getCompanies(year: number) {
    const key = year.toString();
    return this.systemSettings[key]?.companies || [];
  }

  async addCompany(year: number, name: string) {
    const key = year.toString();
    const settings = this.systemSettings[key] || {};
    const companies = settings.companies || [];
    
    if (!companies.includes(name)) {
      companies.push(name);
      this.systemSettings[key] = { ...settings, companies };
      this.saveData();
    }
  }

  async deleteCompany(year: number, name: string) {
    const key = year.toString();
    const settings = this.systemSettings[key] || {};
    const companies = settings.companies || [];
    const companyDetails = settings.companyDetails || {};
    
    // Also delete details
    if (companyDetails[name]) {
        delete companyDetails[name];
    }

    this.systemSettings[key] = { 
        ...settings, 
        companies: companies.filter((c: string) => c !== name),
        companyDetails
    };
    this.saveData();
  }

  // Company Details Management
  getCompanyDetails(year: number, name: string): CompanyDetail | undefined {
      const key = year.toString();
      const settings = this.systemSettings[key];
      return settings?.companyDetails?.[name];
  }

  async saveCompanyDetails(year: number, detail: CompanyDetail) {
      const key = year.toString();
      const settings = this.systemSettings[key] || {};
      const companyDetails = settings.companyDetails || {};
      
      companyDetails[detail.name] = detail;
      
      // Also ensure company is in the list
      const companies = settings.companies || [];
      if (!companies.includes(detail.name)) {
          companies.push(detail.name);
      }

      this.systemSettings[key] = { ...settings, companies, companyDetails };
      this.saveData();
  }

  // Dropdown Management (Votes) - Year Binded
  getVoteNumbers(year: number) {
    const key = year.toString();
    return this.systemSettings[key]?.voteNumbers || [];
  }

  async addVoteNumber(year: number, vote: string) {
    const key = year.toString();
    const settings = this.systemSettings[key] || {};
    const voteNumbers = settings.voteNumbers || [];

    if (!voteNumbers.includes(vote)) {
      voteNumbers.push(vote);
      this.systemSettings[key] = { ...settings, voteNumbers };
      this.saveData();
    }
  }

  async deleteVoteNumber(year: number, vote: string) {
    const key = year.toString();
    const settings = this.systemSettings[key] || {};
    const voteNumbers = settings.voteNumbers || [];

    this.systemSettings[key] = {
        ...settings,
        voteNumbers: voteNumbers.filter((v: string) => v !== vote)
    };
    this.saveData();
  }

  // Dropdown Management (Sebutharga Numbers) - Year Binded
  getSebuthargaNumbers(year: number) {
    const key = year.toString();
    return this.systemSettings[key]?.sebuthargaNumbers || [];
  }

  async addSebuthargaNumber(year: number, sh: string) {
    const key = year.toString();
    const settings = this.systemSettings[key] || {};
    const sebuthargaNumbers = settings.sebuthargaNumbers || [];

    if (!sebuthargaNumbers.includes(sh)) {
      sebuthargaNumbers.push(sh);
      this.systemSettings[key] = { ...settings, sebuthargaNumbers };
      this.saveData();
    }
  }

  async deleteSebuthargaNumber(year: number, sh: string) {
    const key = year.toString();
    const settings = this.systemSettings[key] || {};
    const sebuthargaNumbers = settings.sebuthargaNumbers || [];

    this.systemSettings[key] = {
        ...settings,
        sebuthargaNumbers: sebuthargaNumbers.filter((v: string) => v !== sh)
    };
    this.saveData();
  }

  // System Settings
  getSettings(year: number) {
    return this.systemSettings[year.toString()] || {};
  }

  async updateSettings(year: number, settings: any) {
    const yearKey = year.toString();
    this.systemSettings[yearKey] = { ...this.systemSettings[yearKey], ...settings };
    this.saveData();
  }
}

export const mockService = new MockService();
