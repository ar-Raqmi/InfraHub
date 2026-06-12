import { User, Project, PresetGroup, BQTemplateDefinition, BulletinItem, Role, CompanyDetail, VoteDefinition, TemporaryImage } from '../types';

class CloudflareService {
    private apiVersion = 'v126';
    private currentUser: User | null = null;
    private baseUrl = '/api';

    constructor() {
        this.loadSession();
    }

    private loadSession() {
        try {
            const storedUser = localStorage.getItem('infrahub_user');
            const loginTimeStr = localStorage.getItem('infrahub_login_time');
            if (storedUser && loginTimeStr) {
                const loginTime = parseInt(loginTimeStr, 10);
                const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
                if (Date.now() - loginTime < sevenDaysMs) {
                    this.currentUser = JSON.parse(storedUser);
                } else {
                    this.clearSession();
                }
            }
        } catch (e) {
            console.error('Failed to load session', e);
        }
    }

    private clearSession() {
        this.currentUser = null;
        localStorage.removeItem('infrahub_user');
        localStorage.removeItem('infrahub_login_time');
    }

    setCurrentUser(user: User | null) {
        this.currentUser = user;
        if (user) {
            localStorage.setItem('infrahub_user', JSON.stringify(user));
        } else {
            this.clearSession();
        }
    }

    async login(username: string, password: string): Promise<User> {
        const response = await fetch(`${this.baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) throw new Error('Invalid credentials');
        const data: any = await response.json();
        localStorage.setItem('infrahub_login_time', Date.now().toString());
        this.setCurrentUser(data.user);
        return data.user;
    }

    async logout() {
        this.setCurrentUser(null);
    }

    getCurrentUser(): User | null {
        return this.currentUser;
    }

    // --- BULLETINS ---
    async getBulletins(): Promise<BulletinItem[]> {
        const response = await fetch(`${this.baseUrl}/bulletins`);
        if (!response.ok) throw new Error('Failed to fetch bulletins');
        return response.json();
    }

    async addBulletin(content: string, author: string): Promise<BulletinItem> {
        const response = await fetch(`${this.baseUrl}/bulletins`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, author })
        });
        if (!response.ok) throw new Error('Failed to add bulletin');
        return response.json();
    }

    async markBulletinAsRead(id: string, userId: number) {
        const response = await fetch(`${this.baseUrl}/bulletins/${id}/read`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        if (!response.ok) throw new Error('Failed to mark as read');
    }

    async toggleReaction(id: string, userId: number, emoji: string) {
        const response = await fetch(`${this.baseUrl}/bulletins/${id}/react`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, emoji })
        });
        if (!response.ok) throw new Error('Failed to react');
    }

    async deleteBulletin(id: string) {
        const response = await fetch(`${this.baseUrl}/bulletins/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete bulletin');
    }

    // --- SYSTEM LIBRARY GROUPS ---
    async getLibraryGroups(): Promise<PresetGroup[]> {
        const response = await fetch(`${this.baseUrl}/system/library_groups`);
        if (!response.ok) throw new Error('Failed to fetch library groups');
        return response.json();
    }

    async saveLibraryGroups(groups: PresetGroup[]) {
        const response = await fetch(`${this.baseUrl}/system/library_groups`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(groups)
        });
        if (!response.ok) throw new Error('Failed to save library groups');
    }

    // --- TEMPLATES ---
    async getTemplates(): Promise<BQTemplateDefinition[]> {
        const response = await fetch(`${this.baseUrl}/system/templates`);
        if (!response.ok) throw new Error('Failed to fetch templates');
        return response.json();
    }

    async saveTemplates(templates: BQTemplateDefinition[]) {
        const response = await fetch(`${this.baseUrl}/system/templates`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(templates)
        });
        if (!response.ok) throw new Error('Failed to save templates');
    }

    async deleteTemplate(id: string) {
        const response = await fetch(`${this.baseUrl}/system/templates/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete template');
    }

    // --- PROJECTS ---
    async getProjects(): Promise<Project[]> {
        // This endpoint is optimized and excludes heavy JSON blobs like bq_data
        const response = await fetch(`${this.baseUrl}/projects?v=${this.apiVersion}`);
        if (!response.ok) throw new Error('Failed to fetch projects');
        return response.json();
    }

    async getProjectById(id: number): Promise<Project> {
        // This endpoint returns all data including the heavy JSON blobs for editing
        const response = await fetch(`${this.baseUrl}/projects/${id}?v=${this.apiVersion}`);
        if (!response.ok) throw new Error('Failed to fetch project');
        return response.json();
    }

    async createProject(project: Omit<Project, 'id'>) {
        const response = await fetch(`${this.baseUrl}/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(project)
        });
        if (!response.ok) throw new Error('Failed to create project');
        return response.json();
    }

    async updateProject(id: number, updates: Partial<Project>) {
        const response = await fetch(`${this.baseUrl}/projects/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (!response.ok) throw new Error('Failed to update project');
        return response.json();
    }

    async deleteProject(id: number) {
        const response = await fetch(`${this.baseUrl}/projects/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete project');
    }

    // --- USERS ---
    async getUsers(): Promise<User[]> {
        const response = await fetch(`${this.baseUrl}/users`);
        if (!response.ok) throw new Error('Failed to fetch users');
        return response.json();
    }

    async addUser(user: Omit<User, 'id'>) {
        const response = await fetch(`${this.baseUrl}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
        if (!response.ok) throw new Error('Failed to add user');
        return response.json();
    }

    async updateUser(id: number, updates: Partial<User>) {
        const response = await fetch(`${this.baseUrl}/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (!response.ok) throw new Error('Failed to update user');

        const updatedUser: any = await response.json();
        if (this.currentUser && this.currentUser.id === id) {
            this.setCurrentUser(updatedUser);
        }
        return updatedUser;
    }

    async deleteUser(id: number) {
        const response = await fetch(`${this.baseUrl}/users/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete user');
    }

    // --- SYSTEM SETTINGS (COMPANIES, VOTES, ETC) ---
    async getSettings(year: number) {
        const response = await fetch(`${this.baseUrl}/system/settings/${year}`);
        if (!response.ok) return {}; // Fallback for new years
        return response.json();
    }

    async updateSettings(year: number, settings: any) {
        const response = await fetch(`${this.baseUrl}/system/settings/${year}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
        if (!response.ok) throw new Error('Failed to update settings');
    }

    async getCompanies(year: number): Promise<string[]> {
        const s: any = await this.getSettings(year);
        return s.companies || [];
    }

    async getCompanyOrder(year: number): Promise<string[]> {
        const s: any = await this.getSettings(year);
        return s.company_order || [];
    }

    async saveCompanyOrder(year: number, order: string[]) {
        await this.updateSettings(year, { company_order: order });
    }

    async addCompany(year: number, name: string) {
        const s: any = await this.getSettings(year);
        const companies = s.companies || [];
        const order = s.company_order || [];

        if (!companies.includes(name)) {
            companies.push(name);
            order.push(name);
            await this.updateSettings(year, { companies, company_order: order });
        }
    }

    async deleteCompany(year: number, name: string) {
        const s: any = await this.getSettings(year);
        const companies = (s.companies || []).filter((c: string) => c !== name);
        const order = (s.company_order || []).filter((c: string) => c !== name);
        const details = s.company_details || {};
        if (details[name]) delete details[name];

        await this.updateSettings(year, { companies, company_order: order, company_details: details });
    }

    async getCompanyDetails(year: number, name: string): Promise<CompanyDetail | undefined> {
        const s: any = await this.getSettings(year);
        return s.company_details?.[name];
    }

    async getAllCompanyDetails(year: number): Promise<Record<string, CompanyDetail>> {
        const s: any = await this.getSettings(year);
        return s.company_details || {};
    }

    async saveCompanyDetails(year: number, detail: CompanyDetail) {
        const s: any = await this.getSettings(year);
        const details = s.company_details || {};
        details[detail.name] = detail;

        const companies = s.companies || [];
        if (!companies.includes(detail.name)) companies.push(detail.name);

        await this.updateSettings(year, { company_details: details, companies });
    }

    async getVoteNumbers(year: number): Promise<string[]> {
        const votes = await this.getVotes(year);
        return votes.map((v: VoteDefinition) => v.code);
    }

    async getVotes(year: number): Promise<VoteDefinition[]> {
        const s: any = await this.getSettings(year);
        return s.vote_numbers || [];
    }

    async saveVote(year: number, vote: VoteDefinition) {
        const s: any = await this.getSettings(year);
        let votes = s.vote_numbers || [];
        const index = votes.findIndex((v: any) => v.code === vote.code);
        if (index >= 0) votes[index] = vote;
        else votes.push(vote);

        await this.updateSettings(year, { vote_numbers: votes });
    }

    async deleteVoteNumber(year: number, voteCode: string) {
        const s: any = await this.getSettings(year);
        const votes = (s.vote_numbers || []).filter((v: any) => v.code !== voteCode);
        await this.updateSettings(year, { vote_numbers: votes });
    }

    async getSebuthargaNumbers(year: number): Promise<string[]> {
        const s: any = await this.getSettings(year);
        return s.sebutharga_numbers || [];
    }

    async addSebuthargaNumber(year: number, sh: string) {
        const s: any = await this.getSettings(year);
        const nums = s.sebutharga_numbers || [];
        if (!nums.includes(sh)) {
            nums.push(sh);
            await this.updateSettings(year, { sebutharga_numbers: nums });
        }
    }

    async deleteSebuthargaNumber(year: number, sh: string) {
        const s: any = await this.getSettings(year);
        const nums = (s.sebutharga_numbers || []).filter((n: string) => n !== sh);
        await this.updateSettings(year, { sebutharga_numbers: nums });
    }

    async getManualFinancials(year: number) {
        const s: any = await this.getSettings(year);
        return s.manual_financials || { outsource: 0, ydp: 0 };
    }

    async saveManualFinancials(year: number, data: { outsource: number, ydp: number }) {
        await this.updateSettings(year, { manual_financials: data });
    }

    // --- TEMPORARY GALLERY ---
    async getTemporaryGallery(limit = 24, offset = 0): Promise<TemporaryImage[]> {
        const response = await fetch(`${this.baseUrl}/storage/gallery?limit=${limit}&offset=${offset}&v=${this.apiVersion}`);
        if (!response.ok) throw new Error('Failed to fetch gallery');
        return response.json();
    }

    async uploadTemporaryImage(file: File, userId: number, userFullName: string, projectId?: number, location?: string): Promise<TemporaryImage> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId.toString());
        formData.append('userFullName', userFullName);
        if (projectId) formData.append('projectId', projectId.toString());
        if (location) formData.append('location', location);

        const response = await fetch(`${this.baseUrl}/storage/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Failed to upload image');
        return response.json();
    }

    async updateTemporaryImageLocation(id: string, location: string): Promise<void> {
        const response = await fetch(`${this.baseUrl}/storage/gallery/${id}/location`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ location })
        });
        if (!response.ok) throw new Error('Failed to update location');
    }

    async deleteTemporaryImage(id: string, imageUrl: string) {
        const response = await fetch(`${this.baseUrl}/storage/gallery/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl })
        });
        if (!response.ok) throw new Error('Failed to delete image');
    }

    async batchUpdateTemporaryImageLocation(ids: string[], location: string) {
        await Promise.all(ids.map(id => this.updateTemporaryImageLocation(id, location)));
    }

    async batchDeleteTemporaryImages(items: { id: string, imageUrl: string }[]) {
        await Promise.all(items.map(item => this.deleteTemporaryImage(item.id, item.imageUrl)));
    }

    async cleanupExpiredGalleryImages() {
        const response = await fetch(`${this.baseUrl}/storage/cleanup`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to cleanup images');
    }

    // --- NOTIFICATIONS ---
    async getNotificationStates(userId: number): Promise<any[]> {
        const response = await fetch(`${this.baseUrl}/notifications?userId=${userId}`);
        if (!response.ok) throw new Error('Failed to fetch notification states');
        return response.json();
    }

    async updateNotificationState(id: string, userId: number, updates: { isRead?: boolean, isDeleted?: boolean }) {
        const response = await fetch(`${this.baseUrl}/notifications/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, ...updates })
        });
        if (!response.ok) throw new Error('Failed to update notification state');
    }

    async deleteNotificationPermanently(id: string, userId: number) {
        const response = await fetch(`${this.baseUrl}/notifications/${id}?userId=${userId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete notification permanently');
    }

    // Compatibility mappers for legacy real-time hooks
    mapProject(p: any) { return p; }
    mapBulletin(b: any) { return b; }
    mapUser(u: any) { return u; }
}

// Export a singleton instance
export const apiService = new CloudflareService();
export const api: any = {
    channel: () => {
        const channelMock: any = {
            on: () => channelMock,
            subscribe: (cb: any) => { if (cb) cb("SUBSCRIBED"); return channelMock; },
        };
        return channelMock;
    },
    removeChannel: () => { },
    storage: {
        from: () => ({
            getPublicUrl: (path: string) => ({ data: { publicUrl: path } })
        })
    }
};
