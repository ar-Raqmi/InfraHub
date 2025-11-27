
import { Project, User, Role, ProjectStatus, BQGroup } from '../types';

// Initial Seed Data
const INITIAL_USERS: User[] = [
  { id: 1, username: 'syafiq', fullName: 'Syafiq (Admin)', role: Role.ADMIN, password: 'password', email: 'syafiq@mps.gov.my', department: 'Unit Pembangunan', phone: '012-3456789' },
  { id: 2, username: 'ahmad', fullName: 'Ahmad (PJA)', role: Role.PJA, password: 'password', email: 'ahmad@mps.gov.my', department: 'Zon 1', phone: '013-9876543' },
];

const INITIAL_PROJECTS: Project[] = [];

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
    
    // FAILSAFE: Ensure Syafiq and Ahmad exist if localStorage has old data
    if (!this.users.find(u => u.username === 'syafiq')) {
      this.users.push(INITIAL_USERS[0]);
    }
    if (!this.users.find(u => u.username === 'ahmad')) {
      this.users.push(INITIAL_USERS[1]);
    }

    this.projects = storedProjects ? JSON.parse(storedProjects) : INITIAL_PROJECTS;
    if (storedSession) {
      this.currentUser = JSON.parse(storedSession);
    }
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
    // Simple case-insensitive match for username
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
    
    // Ensure numbers
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

  async deleteUser(id: number) {
    this.users = this.users.filter(u => u.id !== id);
    this.saveData();
  }
}

export const mockService = new MockService();
