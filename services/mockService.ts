

import { Project, User, Role, ProjectStatus, BQGroup } from '../types';

// Initial Seed Data
const INITIAL_USERS: User[] = [
  { 
    id: 1, 
    username: 'syafiq', 
    fullName: 'Syafiq Daniel Bin Ahmad Firdaus', 
    role: Role.ADMIN, 
    password: 'password', 
    email: 'syafiq@mps.gov.my', 
    department: 'Unit Pembangunan', 
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
    department: 'Zon 1', 
    phone: '013-9876543',
    jawatan: 'Penolong Jurutera JA5',
    bahagian: 'Bahagian Infrastruktur',
    unit: 'Unit Selenggara Infrastruktur'
  },
];

const INITIAL_PROJECTS: Project[] = [];

// Initial Dropdown Data
const INITIAL_COMPANIES = [
  "Syarikat Pembinaan Jaya Sdn Bhd",
  "Teguh Bina Enterprise",
  "Maju Infrastruktur Sdn Bhd",
  "Khairul Enterprise"
];

const INITIAL_VOTES = [
  "282090",
  "340001",
  "560002"
];

class MockService {
  private users: User[] = [];
  private projects: Project[] = [];
  private companies: string[] = [];
  private voteNumbers: string[] = [];
  private currentUser: User | null = null;

  constructor() {
    this.loadData();
  }

  private loadData() {
    const storedUsers = localStorage.getItem('infrahub_users');
    const storedProjects = localStorage.getItem('infrahub_projects');
    const storedSession = localStorage.getItem('infrahub_session');
    
    // New Stored Data
    const storedCompanies = localStorage.getItem('infrahub_companies');
    const storedVotes = localStorage.getItem('infrahub_votes');

    this.users = storedUsers ? JSON.parse(storedUsers) : INITIAL_USERS;
    
    // FAILSAFE: Ensure Syafiq and Khairul exist if localStorage has old data
    if (!this.users.find(u => u.username === 'syafiq')) {
      this.users.unshift(INITIAL_USERS[0]);
    }
    if (!this.users.find(u => u.username === 'khairul')) {
      this.users.push(INITIAL_USERS[1]);
    }

    this.projects = storedProjects ? JSON.parse(storedProjects) : INITIAL_PROJECTS;
    
    this.companies = storedCompanies ? JSON.parse(storedCompanies) : INITIAL_COMPANIES;
    this.voteNumbers = storedVotes ? JSON.parse(storedVotes) : INITIAL_VOTES;

    if (storedSession) {
      this.currentUser = JSON.parse(storedSession);
    }
  }

  private saveData() {
    localStorage.setItem('infrahub_users', JSON.stringify(this.users));
    localStorage.setItem('infrahub_projects', JSON.stringify(this.projects));
    localStorage.setItem('infrahub_companies', JSON.stringify(this.companies));
    localStorage.setItem('infrahub_votes', JSON.stringify(this.voteNumbers));

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

  // Dropdown Management (Companies)
  getCompanies() {
    return [...this.companies];
  }

  async addCompany(name: string) {
    if (!this.companies.includes(name)) {
      this.companies.push(name);
      this.saveData();
    }
  }

  async deleteCompany(name: string) {
    this.companies = this.companies.filter(c => c !== name);
    this.saveData();
  }

  // Dropdown Management (Votes)
  getVoteNumbers() {
    return [...this.voteNumbers];
  }

  async addVoteNumber(vote: string) {
    if (!this.voteNumbers.includes(vote)) {
      this.voteNumbers.push(vote);
      this.saveData();
    }
  }

  async deleteVoteNumber(vote: string) {
    this.voteNumbers = this.voteNumbers.filter(v => v !== vote);
    this.saveData();
  }
}

export const mockService = new MockService();