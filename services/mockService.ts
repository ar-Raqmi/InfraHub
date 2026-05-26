
import { Project, User, Role, ProjectStatus, BQGroup, CompanyDetail, VoteDefinition, ProjectLocation, PresetGroup, BQTemplateDefinition, BulletinItem } from '../types';
import { INITIAL_LIBRARY_DATA, INITIAL_TEMPLATE_DATA } from '../data/bqPresets';

const VOTES: VoteDefinition[] = [
    { code: '282090', name: 'LONGKANG', allocation: 2000000 },
    { code: '282130', name: 'INFRA & KEMUDAHAN AWAM', allocation: 1500000 },
    { code: '282050', name: 'PENYELENGGARAAN JALAN & LORONG', allocation: 3000000 },
    { code: '272040', name: 'PAPAN TANDA', allocation: 500000 },
    { code: '282180', name: 'PENYELENGGARAAN PERHENTIAN BAS', allocation: 600000 },
    { code: '331100', name: 'MEMBINA PONDOK BAS', allocation: 800000 }
];

const MOCK_COMPANIES: CompanyDetail[] = [
    {
        name: "MEGA BINA CONSTRUCTIONS",
        registrationNumber: "0120230101-SL123456",
        address: "No. 12, Jalan SJ 3, Taman Selayang Jaya, 68100 Batu Caves, Selangor",
        ownerName: "Ahmad Bin Abdullah",
        gred: "G1",
        phone: "012-3456789",
        phoneAlt: "03-61234567",
        email: "megabina@gmail.com"
    },
    {
        name: "SINAR HARAPAN ENTERPRISE",
        registrationNumber: "0120230505-SL654321",
        address: "Lot 45, Kampung Laksamana, 68100 Batu Caves, Selangor",
        ownerName: "Siti Binti Kassim",
        gred: "G1",
        phone: "019-8765432",
        phoneAlt: "",
        email: "sinarharapan@yahoo.com"
    },
    {
        name: "TEGUH BERSATU MAJU",
        registrationNumber: "0120221112-SL987654",
        address: "No 5, Jalan 2/3, Bandar Baru Selayang, 68100 Batu Caves, Selangor",
        ownerName: "Muthu A/L Raman",
        gred: "G1",
        phone: "013-5551234",
        phoneAlt: "03-61389999",
        email: "teguhbersatu@outlook.com"
    },
    {
        name: "WARISAN TIMUR RESOURCES",
        registrationNumber: "0120240220-SL112233",
        address: "Unit B-2-1, Apartmen Cempaka, Taman Gombak Permai, 68100 Batu Caves",
        ownerName: "Wan Hassan Bin Wan Ismail",
        gred: "G1",
        phone: "017-3334444",
        phoneAlt: "",
        email: "warisantimur@gmail.com"
    },
    {
        name: "BINAJAYA SOLUSI",
        registrationNumber: "0120230808-SL445566",
        address: "No. 88, Jalan SG 4/1, Taman Sri Gombak, 68100 Batu Caves, Selangor",
        ownerName: "Chong Wei Ming",
        gred: "G1",
        phone: "016-7778888",
        phoneAlt: "03-61891111",
        email: "binajaya.solusi@gmail.com"
    }
];

const INITIAL_USERS: User[] = [
  { id: 1, username: 'syafiq', fullName: 'Syafiq Daniel Bin Ahmad Firdaus', role: Role.ADMIN, password: 'password', email: 'syafiq@mps.gov.my', phone: '012-3456789', jawatan: 'Pembantu Tadbir N1', bahagian: 'Bahagian Elektrikal', unit: 'Unit Elektrikal' },
  { id: 2, username: 'khairul', fullName: 'Mohamad Khairul Amirin Bin Zainal Abidin', role: Role.PJE, password: 'password', email: 'khairul@mps.gov.my', phone: '013-9876543', jawatan: 'Penolong Jurutera Elektrik', bahagian: 'Bahagian Elektrikal', unit: 'Unit Elektrikal' },
  { id: 3, username: 'farhan', fullName: 'Muhammad Farhan', role: Role.PJE, password: 'password', email: 'farhan@mps.gov.my', phone: '014-1234567', jawatan: 'Penolong Jurutera Elektrik', bahagian: 'Bahagian Elektrikal', unit: 'Unit Elektrikal' },
  { id: 4, username: 'nursilmi', fullName: 'Nursilmi Binti Ahmad', role: Role.PJE, password: 'password', email: 'nursilmi@mps.gov.my', phone: '015-9876543', jawatan: 'Penolong Jurutera Elektrik', bahagian: 'Bahagian Elektrikal', unit: 'Unit Elektrikal' },
  { id: 5, username: 'salam', fullName: 'Muhammad Salam', role: Role.PJE, password: 'password', email: 'salam@mps.gov.my', phone: '016-1234567', jawatan: 'Penolong Jurutera Elektrik', bahagian: 'Bahagian Elektrikal', unit: 'Unit Elektrikal' },
  { id: 6, username: 'ain', fullName: "A'IN SYAHIRA BINTI RATIMIN", role: Role.JURUTERA, password: 'password', email: 'ain@mps.gov.my', phone: '017-1122334', jawatan: 'Jurutera Awam', bahagian: 'Jabatan Kejuruteraan', unit: 'Majlis Perbandaran Selayang' }
];

const INITIAL_BULLETINS: BulletinItem[] = [
  { id: 'b1', content: 'Semua PJE diingatkan untuk mengemaskini tarikh pemeriksaan tapak bagi fasa pelarasan.', date: '2025-05-15', author: 'Syafiq (Admin)' },
  { id: 'b2', content: 'Mesyuarat mingguan bahagian akan diadakan pada hari Selasa jam 9:00 pagi.', date: '2025-05-14', author: 'Ain (Jurutera)' }
];

class MockService {
  private users: User[] = [];
  private projects: Project[] = [];
  private libraryGroups: PresetGroup[] = [];
  private templates: BQTemplateDefinition[] = [];
  private bulletins: BulletinItem[] = [];
  private systemSettings: Record<string, any> = {}; 
  private currentUser: User | null = null;

  constructor() {
    this.loadData();
  }

  private loadData() {
    const storedUsers = localStorage.getItem('electrichub_users');
    const storedProjects = localStorage.getItem('electrichub_projects');
    const storedLibrary = localStorage.getItem('electrichub_library');
    const storedTemplates = localStorage.getItem('electrichub_templates');
    const storedSession = localStorage.getItem('electrichub_session');
    const storedSettings = localStorage.getItem('electrichub_settings');
    const storedBulletins = localStorage.getItem('electrichub_bulletins');

    this.users = storedUsers ? JSON.parse(storedUsers) : INITIAL_USERS;
    this.projects = storedProjects ? JSON.parse(storedProjects) : [];
    this.libraryGroups = storedLibrary ? JSON.parse(storedLibrary) : INITIAL_LIBRARY_DATA;
    this.templates = storedTemplates ? JSON.parse(storedTemplates) : INITIAL_TEMPLATE_DATA;
    this.systemSettings = storedSettings ? JSON.parse(storedSettings) : {};
    this.bulletins = storedBulletins ? JSON.parse(storedBulletins) : INITIAL_BULLETINS;

    // Prune bulletins if they exceed limit from storage
    if (this.bulletins.length > 3) {
      this.bulletins = this.bulletins.slice(0, 3);
    }

    // Initialize Settings for 2025 (and keep legacy 2024 if needed)
    ['2024', '2025'].forEach(year => {
        if (!this.systemSettings[year]) {
            const companyNames = MOCK_COMPANIES.map(c => c.name);
            const companyDetailsMap: Record<string, CompanyDetail> = {};
            MOCK_COMPANIES.forEach(c => {
                companyDetailsMap[c.name] = c;
            });

            this.systemSettings[year] = {
                companies: companyNames,
                voteNumbers: VOTES,
                sebuthargaNumbers: ['MPS/SH/2025/001'],
                meetingDate: '',
                companyDetails: companyDetailsMap,
                companyOrder: companyNames,
                manualFinancials: { outsource: 0, ydp: 0 }
            };
        }
    });

    if (storedSession) {
      this.currentUser = JSON.parse(storedSession);
    }
  }

  private saveData() {
    localStorage.setItem('electrichub_users', JSON.stringify(this.users));
    localStorage.setItem('electrichub_projects', JSON.stringify(this.projects));
    localStorage.setItem('electrichub_library', JSON.stringify(this.libraryGroups));
    localStorage.setItem('electrichub_templates', JSON.stringify(this.templates));
    localStorage.setItem('electrichub_settings', JSON.stringify(this.systemSettings));
    localStorage.setItem('electrichub_bulletins', JSON.stringify(this.bulletins));

    if (this.currentUser) {
      localStorage.setItem('electrichub_session', JSON.stringify(this.currentUser));
    } else {
      localStorage.removeItem('electrichub_session');
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

  // Bulletin Board
  getBulletins() {
    return [...this.bulletins];
  }

  async addBulletin(content: string, author: string) {
    const newItem: BulletinItem = {
      id: Date.now().toString(),
      content,
      date: new Date().toISOString().split('T')[0],
      author
    };
    this.bulletins.unshift(newItem);
    
    // Auto delete the fourth one to prevent data overload
    if (this.bulletins.length > 3) {
      this.bulletins = this.bulletins.slice(0, 3);
    }
    
    this.saveData();
    return newItem;
  }

  async deleteBulletin(id: string) {
    this.bulletins = this.bulletins.filter(b => b.id !== id);
    this.saveData();
  }

  // BQ Library
  getLibraryGroups(): PresetGroup[] {
    return [...this.libraryGroups];
  }

  async saveLibraryGroups(groups: PresetGroup[]) {
    this.libraryGroups = groups;
    this.saveData();
  }

  // BQ Templates
  getTemplates(): BQTemplateDefinition[] {
      return [...this.templates];
  }

  async saveTemplates(templates: BQTemplateDefinition[]) {
      this.templates = templates;
      this.saveData();
  }

  // Projects
  getProjects() {
    return [...this.projects];
  }

  async createProject(project: Omit<Project, 'id'>) {
    const newId = Date.now();
    const now = new Date().toISOString();
    const safeProject = {
      ...project,
      id: newId,
      updatedAt: now,
      kosProjek: Number(project.kosProjek) || 0,
    };

    this.projects.push(safeProject);
    this.saveData();
    return safeProject;
  }

  async updateProject(id: number, updates: Partial<Project>) {
    const index = this.projects.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Project not found');
    
    const now = new Date().toISOString();
    const updatedProject = { ...this.projects[index], ...updates, updatedAt: now };
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

  getCompanyOrder(year: number): string[] {
      const key = year.toString();
      return this.systemSettings[key]?.companyOrder || [];
  }

  async saveCompanyOrder(year: number, order: string[]) {
      const key = year.toString();
      const settings = this.systemSettings[key] || {};
      this.systemSettings[key] = { ...settings, companyOrder: order };
      this.saveData();
  }

  async addCompany(year: number, name: string) {
    const key = year.toString();
    const settings = this.systemSettings[key] || {};
    const companies = settings.companies || [];
    
    if (!companies.includes(name)) {
      companies.push(name);
      const order = settings.companyOrder || [];
      order.push(name);
      this.systemSettings[key] = { ...settings, companies, companyOrder: order };
      this.saveData();
    }
  }

  async deleteCompany(year: number, name: string) {
    const key = year.toString();
    const settings = this.systemSettings[key] || {};
    const companies = settings.companies || [];
    const companyDetails = settings.companyDetails || {};
    const order = settings.companyOrder || [];
    
    if (companyDetails[name]) {
        delete companyDetails[name];
    }

    this.systemSettings[key] = { 
        ...settings, 
        companies: companies.filter((c: string) => c !== name),
        companyOrder: order.filter((c: string) => c !== name),
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
      
      const companies = settings.companies || [];
      if (!companies.includes(detail.name)) {
          companies.push(detail.name);
      }

      this.systemSettings[key] = { ...settings, companies, companyDetails };
      this.saveData();
  }

  // Dropdown Management (Votes) - Year Binded
  getVoteNumbers(year: number): string[] {
    const votes = this.getVotes(year);
    return votes.map(v => v.code);
  }

  getVotes(year: number): VoteDefinition[] {
      const key = year.toString();
      const raw = this.systemSettings[key]?.voteNumbers || [];
      return raw.map((v: any) => {
          if (typeof v === 'string') return { code: v, name: 'Vot Am', allocation: 0 };
          return v;
      });
  }

  async saveVote(year: number, vote: VoteDefinition) {
    const key = year.toString();
    const settings = this.systemSettings[key] || {};
    let votes = settings.voteNumbers || [];
    
    votes = votes.map((v: any) => typeof v === 'string' ? { code: v, name: 'Vot Am', allocation: 0 } : v);

    const index = votes.findIndex((v: VoteDefinition) => v.code === vote.code);
    if (index >= 0) {
        votes[index] = vote;
    } else {
        votes.push(vote);
    }

    this.systemSettings[key] = { ...settings, voteNumbers: votes };
    this.saveData();
  }

  async deleteVoteNumber(year: number, voteCode: string) {
    const key = year.toString();
    const settings = this.systemSettings[key] || {};
    let votes = settings.voteNumbers || [];
    votes = votes.map((v: any) => typeof v === 'string' ? { code: v, name: 'Vot Am', allocation: 0 } : v);

    this.systemSettings[key] = {
        ...settings,
        voteNumbers: votes.filter((v: VoteDefinition) => v.code !== voteCode)
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

  // System Settings (General & Financials)
  getSettings(year: number) {
    return this.systemSettings[year.toString()] || {};
  }

  async updateSettings(year: number, settings: any) {
    const yearKey = year.toString();
    this.systemSettings[yearKey] = { ...this.systemSettings[yearKey], ...settings };
    this.saveData();
  }

  getManualFinancials(year: number) {
      const key = year.toString();
      return this.systemSettings[key]?.manualFinancials || { outsource: 0, ydp: 0 };
  }

  async saveManualFinancials(year: number, data: { outsource: number, ydp: number }) {
      const key = year.toString();
      const settings = this.systemSettings[key] || {};
      this.systemSettings[key] = { ...settings, manualFinancials: data };
      this.saveData();
  }
}

export const mockService = new MockService();
