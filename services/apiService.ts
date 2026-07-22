import { User, Project, PresetGroup, BQTemplateDefinition, BulletinItem, CompanyDetail, VoteDefinition, TemporaryImage } from '../types';

class CloudflareService {
    private apiVersion = 'v126';
    private currentUser: User | null = null;
    private baseUrl = '/api';

    constructor() {
        this.loadSession();
    }

    // --- HTTP HELPER ---
    // Centralizes fetch boilerplate (URL build, JSON/FormData body, status check,
    // error message). `json` controls whether the body is JSON-encoded (default)
    // or passed through raw (FormData). `expectJson=false` for void responses.
    private async request<T = any>(opts: {
        path: string;
        method?: string;
        body?: any;
        query?: Record<string, string>;
        json?: boolean;
        expectJson?: boolean;
        errorMessage: string;
    }): Promise<T> {
        const { path, method = 'GET', body, query, json = true, expectJson = true, errorMessage } = opts;
        let url = `${this.baseUrl}${path}`;
        if (query) url += `?${new URLSearchParams(query).toString()}`;

        const init: RequestInit = { method };
        if (body !== undefined) {
            if (json) {
                init.headers = { 'Content-Type': 'application/json' };
                init.body = JSON.stringify(body);
            } else {
                init.body = body as BodyInit;
            }
        }

        const response = await fetch(url, init);
        if (!response.ok) throw new Error(errorMessage);
        return expectJson ? response.json() : (undefined as T);
    }

    // Read a single settings key with a fallback (avoids repeating the
    // getSettings + `s.x || default` pattern across every accessor).
    private async getSetting<T>(year: number, key: string, fallback: T): Promise<T> {
        const s: any = await this.getSettings(year);
        return s[key] ?? fallback;
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
        const data: any = await this.request({
            path: '/auth/login',
            method: 'POST',
            body: { username, password },
            errorMessage: 'Invalid credentials'
        });
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
        return this.request<BulletinItem[]>({ path: '/bulletins', errorMessage: 'Failed to fetch bulletins' });
    }

    async addBulletin(content: string, author: string): Promise<BulletinItem> {
        return this.request<BulletinItem>({
            path: '/bulletins', method: 'POST', body: { content, author }, errorMessage: 'Failed to add bulletin'
        });
    }

    async markBulletinAsRead(id: string, userId: number) {
        await this.request({ path: `/bulletins/${id}/read`, method: 'PUT', body: { userId }, expectJson: false, errorMessage: 'Failed to mark as read' });
    }

    async toggleReaction(id: string, userId: number, emoji: string) {
        await this.request({ path: `/bulletins/${id}/react`, method: 'PUT', body: { userId, emoji }, expectJson: false, errorMessage: 'Failed to react' });
    }

    async deleteBulletin(id: string) {
        await this.request({ path: `/bulletins/${id}`, method: 'DELETE', expectJson: false, errorMessage: 'Failed to delete bulletin' });
    }

    // --- SYSTEM LIBRARY GROUPS ---
    async getLibraryGroups(): Promise<PresetGroup[]> {
        return this.request<PresetGroup[]>({ path: '/system/library_groups', errorMessage: 'Failed to fetch library groups' });
    }

    async saveLibraryGroups(groups: PresetGroup[]) {
        await this.request({ path: '/system/library_groups', method: 'PUT', body: groups, expectJson: false, errorMessage: 'Failed to save library groups' });
    }

    // --- TEMPLATES ---
    async getTemplates(): Promise<BQTemplateDefinition[]> {
        return this.request<BQTemplateDefinition[]>({ path: '/system/templates', errorMessage: 'Failed to fetch templates' });
    }

    async saveTemplates(templates: BQTemplateDefinition[]) {
        await this.request({ path: '/system/templates', method: 'PUT', body: templates, expectJson: false, errorMessage: 'Failed to save templates' });
    }

    async deleteTemplate(id: string) {
        await this.request({ path: `/system/templates/${id}`, method: 'DELETE', expectJson: false, errorMessage: 'Failed to delete template' });
    }

    // --- PROJECTS ---
    async getProjects(): Promise<Project[]> {
        // This endpoint is optimized and excludes heavy JSON blobs like bq_data
        return this.request<Project[]>({ path: '/projects', query: { v: this.apiVersion }, errorMessage: 'Failed to fetch projects' });
    }

    async getProjectById(id: number): Promise<Project> {
        // This endpoint returns all data including the heavy JSON blobs for editing
        return this.request<Project>({ path: `/projects/${id}`, query: { v: this.apiVersion }, errorMessage: 'Failed to fetch project' });
    }

    async createProject(project: Omit<Project, 'id'>) {
        return this.request({ path: '/projects', method: 'POST', body: project, errorMessage: 'Failed to create project' });
    }

    async updateProject(id: number, updates: Partial<Project>) {
        return this.request({ path: `/projects/${id}`, method: 'PUT', body: updates, errorMessage: 'Failed to update project' });
    }

    async deleteProject(id: number) {
        await this.request({ path: `/projects/${id}`, method: 'DELETE', expectJson: false, errorMessage: 'Failed to delete project' });
    }

    // --- USERS ---
    async getUsers(): Promise<User[]> {
        return this.request<User[]>({ path: '/users', errorMessage: 'Failed to fetch users' });
    }

    async addUser(user: Omit<User, 'id'>) {
        return this.request({ path: '/users', method: 'POST', body: user, errorMessage: 'Failed to add user' });
    }

    async updateUser(id: number, updates: Partial<User>) {
        const updatedUser: any = await this.request({
            path: `/users/${id}`, method: 'PUT', body: updates, errorMessage: 'Failed to update user'
        });
        if (this.currentUser && this.currentUser.id === id) {
            this.setCurrentUser(updatedUser);
        }
        return updatedUser;
    }

    async deleteUser(id: number) {
        await this.request({ path: `/users/${id}`, method: 'DELETE', expectJson: false, errorMessage: 'Failed to delete user' });
    }

    // --- SYSTEM SETTINGS (COMPANIES, VOTES, ETC) ---
    // Note: getSettings intentionally returns {} on failure (fallback for new
    // years) instead of throwing, so it does not use request().
    async getSettings(year: number) {
        const response = await fetch(`${this.baseUrl}/system/settings/${year}`);
        if (!response.ok) return {}; // Fallback for new years
        return response.json();
    }

    async updateSettings(year: number, settings: any) {
        await this.request({ path: `/system/settings/${year}`, method: 'PUT', body: settings, expectJson: false, errorMessage: 'Failed to update settings' });
    }

    async getCompanies(year: number): Promise<string[]> {
        return this.getSetting<string[]>(year, 'companies', []);
    }

    async getCompanyOrder(year: number): Promise<string[]> {
        return this.getSetting<string[]>(year, 'company_order', []);
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
        const details = await this.getSetting<Record<string, CompanyDetail>>(year, 'company_details', {});
        return details?.[name];
    }

    async getAllCompanyDetails(year: number): Promise<Record<string, CompanyDetail>> {
        return this.getSetting<Record<string, CompanyDetail>>(year, 'company_details', {});
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
        return this.getSetting<VoteDefinition[]>(year, 'vote_numbers', []);
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
        return this.getSetting<string[]>(year, 'sebutharga_numbers', []);
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
        return this.getSetting(year, 'manual_financials', { outsource: 0, ydp: 0 });
    }

    async saveManualFinancials(year: number, data: { outsource: number, ydp: number }) {
        await this.updateSettings(year, { manual_financials: data });
    }

    // --- TEMPORARY GALLERY ---
    async getTemporaryGallery(limit = 24, offset = 0): Promise<TemporaryImage[]> {
        return this.request<TemporaryImage[]>({
            path: '/storage/gallery',
            query: { limit: String(limit), offset: String(offset), v: this.apiVersion },
            errorMessage: 'Failed to fetch gallery'
        });
    }

    async uploadTemporaryImage(file: File | Blob, userId: number, userFullName: string, projectId?: number, location?: string): Promise<TemporaryImage> {
        const formData = new FormData();
        const fileName = (file as any).name || 'image.jpg';
        formData.append('file', file, fileName);
        formData.append('userId', userId.toString());
        formData.append('userFullName', userFullName);
        if (projectId) formData.append('projectId', projectId.toString());
        if (location) formData.append('location', location);

        return this.request<TemporaryImage>({
            path: '/storage/upload', method: 'POST', body: formData, json: false, errorMessage: 'Failed to upload image'
        });
    }

    async updateTemporaryImageLocation(id: string, location: string): Promise<void> {
        await this.request({ path: `/storage/gallery/${id}/location`, method: 'PUT', body: { location }, expectJson: false, errorMessage: 'Failed to update location' });
    }

    async deleteTemporaryImage(id: string, imageUrl: string) {
        await this.request({ path: `/storage/gallery/${id}`, method: 'DELETE', body: { imageUrl }, expectJson: false, errorMessage: 'Failed to delete image' });
    }

    async batchUpdateTemporaryImageLocation(ids: string[], location: string) {
        await Promise.all(ids.map(id => this.updateTemporaryImageLocation(id, location)));
    }

    async batchDeleteTemporaryImages(items: { id: string, imageUrl: string }[]) {
        await Promise.all(items.map(item => this.deleteTemporaryImage(item.id, item.imageUrl)));
    }

    async cleanupExpiredGalleryImages() {
        await this.request({ path: '/storage/cleanup', method: 'DELETE', expectJson: false, errorMessage: 'Failed to cleanup images' });
    }

    // --- NOTIFICATIONS ---
    async getNotificationStates(userId: number): Promise<any[]> {
        return this.request<any[]>({ path: '/notifications', query: { userId: String(userId) }, errorMessage: 'Failed to fetch notification states' });
    }

    async updateNotificationState(id: string, userId: number, updates: { isRead?: boolean, isDeleted?: boolean }) {
        await this.request({
            path: `/notifications/${id}`, method: 'PUT', body: { userId, ...updates }, expectJson: false, errorMessage: 'Failed to update notification state'
        });
    }

    async deleteNotificationPermanently(id: string, userId: number) {
        await this.request({ path: `/notifications/${id}`, method: 'DELETE', query: { userId: String(userId) }, expectJson: false, errorMessage: 'Failed to delete notification permanently' });
    }
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
};
