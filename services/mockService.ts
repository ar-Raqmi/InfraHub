
import { Project, User, Role, ProjectStatus, BQGroup, Aduan, TempohKontrakUnit } from '../types';

// Initial Seed Data
const INITIAL_USERS: User[] = [
  { id: 1, username: 'syafiq', fullName: 'Syafiq (Admin)', role: Role.ADMIN, password: 'password', email: 'syafiq@mps.gov.my', department: 'Unit Pembangunan', phone: '012-3456789' },
  { id: 2, username: 'ahmad', fullName: 'Ahmad (PJA)', role: Role.PJA, password: 'password', email: 'ahmad@mps.gov.my', department: 'Zon 1', phone: '013-9876543' },
  { id: 3, username: 'fatimah', fullName: 'Fatimah (PJA)', role: Role.PJA, password: 'password', email: 'fatimah@mps.gov.my', department: 'Zon 2', phone: '019-8765432' },
];

const INITIAL_PROJECTS: Project[] = [
  {
    id: 1,
    namaProjek: 'Cadangan Kerja-Kerja Membaikpulih Longkang',
    noFail: 'MPS.035556',
    tarikhBuka: '2023-10-15',
    pjaId: 2,
    bp: 'BP 4',
    zon: 'Gombak Setia',
    aduanList: [
      { id: 'a1', noAduan: 'MPS.012334', lokasi: 'Jalan 9/27 Taman Sri Gombak' }
    ],
    // Legacy fields for backward compatibility
    aduan: 'Longkang tersumbat dan pecah',
    lokasi: 'Jalan 9/27 Taman Sri Gombak',
    noAduan: 'MPS.012334',
    namaSyarikat: 'Syarikat Binaan Jaya',
    kosProjek: 1615.00,
    status: ProjectStatus.MENUNGGU_LANTIKAN,
    peratusSiap: 0,
    bqData: [
      {
        id: 'g1',
        bilNo: 'BIL NO. 1',
        title: 'KERJA-KERJA PERMULAAN',
        location: 'JALAN 9/27 TAMAN SRI GOMBAK',
        items: [
          { id: 'i1', description: '1.0 INSURAN', unit: '', qty: 0, rate: 0, amount: 0, isHeader: true },
          { id: 'i2', description: 'Menyediakan polisi insuran...', unit: 'L/S', qty: 1, rate: 340.00, amount: 340.00 },
          { id: 'i3', description: '2.0 PELAN PENGURUSAN LALULINTAS', unit: '', qty: 0, rate: 0, amount: 0, isHeader: true },
          { id: 'i4', description: 'Membekal dan menyediakan jentera...', unit: 'L/S', qty: 1, rate: 1275.00, amount: 1275.00 },
        ]
      }
    ]
  },
  {
    id: 2,
    namaProjek: 'Pemasangan Lampu Jalan LED',
    noFail: 'MPS.041122',
    tarikhBuka: '2023-11-01',
    pjaId: 3,
    bp: 'BP 2',
    zon: 'Taman Selayang',
    aduanList: [
      { id: 'a2', noAduan: 'MPS.092389', lokasi: 'Jalan Persimpangan Utama Taman Selayang' }
    ],
    // Legacy fields
    aduan: 'Lampu gelap di persimpangan',
    lokasi: 'Jalan Persimpangan Utama Taman Selayang',
    noAduan: 'MPS.092389',
    namaSyarikat: 'Elektrik Murni Sdn Bhd',
    kosProjek: 50000.00,
    kosProjekSebenar: 48500.00,
    tempohKontrak: 3,
    tempohKontrakUnit: TempohKontrakUnit.BULAN,
    status: ProjectStatus.SIAP,
    peratusSiap: 100,
    prestasi: 'Cemerlang',
    prestasiScores: { q1: 10, q2: 9, q3: 10, q4: 9, q5: 10, q6: 10 },
    cpcDate: '2024-01-15'
  },
  {
    id: 3,
    namaProjek: 'Turapan Jalan Presint 8',
    noFail: 'MPS.039911',
    tarikhBuka: '2024-02-15',
    pjaId: 2,
    bp: 'BP 1',
    zon: 'Presint 8',
    aduanList: [
      { id: 'a3-1', noAduan: 'MPS.123456', lokasi: 'Jalan Utama Presint 8' },
      { id: 'a3-2', noAduan: 'AHLI MAJLIS', lokasi: 'Jalan Utama Presint 8' }
    ],
    // Legacy fields
    aduan: 'Jalan berlubang',
    lokasi: 'Jalan Utama Presint 8',
    noAduan: 'MPS.123456, AHLI MAJLIS',
    namaSyarikat: 'Syarikat Binaan Jaya',
    kosProjek: 120000.00,
    tempohKontrak: 6,
    tempohKontrakUnit: TempohKontrakUnit.MINGGU,
    status: ProjectStatus.DALAM_PROSES,
    peratusSiap: 45
  },
  {
    id: 4,
    namaProjek: 'Menaiktaraf Longkang Utama',
    noFail: 'MPS.051122',
    tarikhBuka: '2025-01-10',
    pjaId: 2,
    bp: 'BP 3',
    zon: 'Bandar Baru Selayang',
    aduanList: [
      { id: 'a4', noAduan: 'MPS.034512', lokasi: 'Jalan Besar Bandar Baru Selayang' }
    ],
    // Legacy fields
    aduan: 'Banjir kilat',
    lokasi: 'Jalan Besar Bandar Baru Selayang',
    noAduan: 'MPS.034512',
    namaSyarikat: 'Jaya Bina Enterprise',
    kosProjek: 85000.00,
    tempohKontrak: 90,
    tempohKontrakUnit: TempohKontrakUnit.HARI,
    status: ProjectStatus.TUNTUTAN_BAYARAN,
    peratusSiap: 95
  }
];

class MockService {
  private users: User[] = [];
  private projects: Project[] = [];
  private currentUser: User | null = null;

  constructor() {
    this.loadData();
  }

  private loadData() {
    const storedUsers = localStorage.getItem('infrahub_users');
    const storedProjects = localStorage.getItem('infrahub_projects');
    const storedSession = localStorage.getItem('infrahub_session');

    this.users = storedUsers ? JSON.parse(storedUsers) : INITIAL_USERS;
    this.projects = storedProjects ? JSON.parse(storedProjects) : INITIAL_PROJECTS;

    // Migrate old projects to new format
    this.projects = this.projects.map(project => this.migrateProject(project));

    if (storedSession) {
      this.currentUser = JSON.parse(storedSession);
    }
  }

  // Migrate old project format to new format with aduanList
  private migrateProject(project: Project): Project {
    // If project already has aduanList, return as-is
    if (project.aduanList && project.aduanList.length > 0) {
      return project;
    }

    // Create aduanList from old fields
    const aduanList: Aduan[] = [];
    if (project.noAduan || project.lokasi) {
      aduanList.push({
        id: `a-${project.id}-1`,
        noAduan: project.noAduan || '',
        lokasi: project.lokasi || ''
      });
    }

    return {
      ...project,
      aduanList: aduanList.length > 0 ? aduanList : []
    };
  }

  private saveData() {
    localStorage.setItem('infrahub_users', JSON.stringify(this.users));
    localStorage.setItem('infrahub_projects', JSON.stringify(this.projects));
    if (this.currentUser) {
      localStorage.setItem('infrahub_session', JSON.stringify(this.currentUser));
    } else {
      localStorage.removeItem('infrahub_session');
    }
  }

  // Auth
  async login(username: string, password: string): Promise<User> {
    const user = this.users.find(u => u.username === username && u.password === password);
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

  getProjectById(id: number) {
    return this.projects.find(p => p.id === id);
  }

  async createProject(project: Omit<Project, 'id'>) {
    const newId = Date.now();
    const safeProject = {
      ...project,
      id: newId,
      kosProjek: Number(project.kosProjek) || 0,
      kosProjekSebenar: Number(project.kosProjekSebenar) || 0,
      peratusSiap: Number(project.peratusSiap) || 0,
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
    if (updates.kosProjekSebenar !== undefined) updatedProject.kosProjekSebenar = Number(updates.kosProjekSebenar);

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

  async deleteUser(id: number) {
    this.users = this.users.filter(u => u.id !== id);
    this.saveData();
  }
}

export const mockService = new MockService();
