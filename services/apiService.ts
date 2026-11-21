import { User, Project, PresetGroup, BQTemplateDefinition, BulletinItem, CompanyDetail, VoteDefinition, TemporaryImage, Contract, ContractCompany, ContractStatus, RateBookVersion, RateBookMatchRow, MatchDecision, ChangeLogEntry, LookupValue, PolicyRuleRecord } from '../types';
import type { ParsedBook } from '../domain/rateBook/types';
import type { BookDiff } from '../domain/rateBook/diffBooks';
import type { BookRow } from '../domain/rateBook/rows';
import type { RowMatch, MatchStats } from '../domain/rateBook/matchItems';
import type { RepricePlan } from '../domain/reprice';

/** Error from an /api call; `message` stays the caller's text, the server's reason rides along. */
export class ApiError extends Error {
    constructor(message: string, public status: number, public serverMessage?: string, public detail?: unknown) {
        super(message);
    }
}

export type ContractInputBody = {
    code?: string; title?: string; kind?: 'PANEL' | 'STANDALONE'; valid_from?: string | null; valid_to?: string | null;
    company_cap?: number | null; meeting_number?: string | null; meeting_date?: string | null; notes?: string | null;
};

export interface ImportResult {
    version: RateBookVersion;
    stats: { parse: ParsedBook['stats']; warnings: ParsedBook['warnings']; match: MatchStats; baseVersionId: string | null };
    matches: RowMatch[];
    removed: BookRow[];
}

export interface VersionDetail {
    version: RateBookVersion;
    groups: PresetGroup[];
    matches: RateBookMatchRow[];
    removed: BookRow[];
}

export interface MatchDecisionBody {
    new_ref: string; decision: MatchDecision; old_group_id?: string; old_item_id?: string; old_variant_id?: string | null;
}

export type RepriceResult =
    | { dryRun: true; contract: { id: string; code: string }; rateBookVersionId: string; plan: RepricePlan }
    | { dryRun: false; plan: RepricePlan; project: Project };
import { sanitizeProject, sanitizeLibraryGroups, sanitizeTemplates, sanitizeUser } from '../lib/text';

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

        const headers: Record<string, string> = {};
        // The acting user for the server's change log (CONTRACT §5).
        if (this.currentUser?.id) headers['X-InfraHub-User'] = String(this.currentUser.id);
        const init: RequestInit = { method, headers };
        if (body !== undefined) {
            if (json) {
                headers['Content-Type'] = 'application/json';
                init.body = JSON.stringify(body);
            } else {
                init.body = body as BodyInit;
            }
        }

        const response = await fetch(url, init);
        if (!response.ok) {
            const payload: any = await response.json().catch(() => null);
            throw new ApiError(errorMessage, response.status, payload?.message, payload?.detail);
        }
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
        await this.request({ path: '/system/library_groups', method: 'PUT', body: sanitizeLibraryGroups(groups), expectJson: false, errorMessage: 'Failed to save library groups' });
    }

    // --- TEMPLATES ---
    async getTemplates(): Promise<BQTemplateDefinition[]> {
        return this.request<BQTemplateDefinition[]>({ path: '/system/templates', errorMessage: 'Failed to fetch templates' });
    }

    async saveTemplates(templates: BQTemplateDefinition[]) {
        await this.request({ path: '/system/templates', method: 'PUT', body: sanitizeTemplates(templates), expectJson: false, errorMessage: 'Failed to save templates' });
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
        return this.request({ path: '/projects', method: 'POST', body: sanitizeProject(project), errorMessage: 'Failed to create project' });
    }

    async updateProject(id: number, updates: Partial<Project>) {
        return this.request({ path: `/projects/${id}`, method: 'PUT', body: sanitizeProject(updates), errorMessage: 'Failed to update project' });
    }

    async deleteProject(id: number) {
        await this.request({ path: `/projects/${id}`, method: 'DELETE', expectJson: false, errorMessage: 'Failed to delete project' });
    }

    // --- USERS ---
    async getUsers(): Promise<User[]> {
        return this.request<User[]>({ path: '/users', errorMessage: 'Failed to fetch users' });
    }

    async addUser(user: Omit<User, 'id'>) {
        return this.request({ path: '/users', method: 'POST', body: sanitizeUser(user), errorMessage: 'Failed to add user' });
    }

    async updateUser(id: number, updates: Partial<User>) {
        const updatedUser: any = await this.request({
            path: `/users/${id}`, method: 'PUT', body: sanitizeUser(updates), errorMessage: 'Failed to update user'
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
    // --- v2: CONTRACTS (SEBUTHARGA) ---
    async getContracts(): Promise<Contract[]> {
        return this.request<Contract[]>({ path: '/contracts', errorMessage: 'Gagal memuat senarai kontrak' });
    }

    async getContract(id: string): Promise<Contract> {
        return this.request<Contract>({ path: `/contracts/${enc(id)}`, errorMessage: 'Gagal memuat kontrak' });
    }

    async createContract(body: ContractInputBody & { clone_from?: string }): Promise<Contract> {
        return this.request<Contract>({ path: '/contracts', method: 'POST', body, errorMessage: 'Gagal mencipta kontrak' });
    }

    async updateContract(id: string, body: ContractInputBody): Promise<Contract> {
        return this.request<Contract>({ path: `/contracts/${enc(id)}`, method: 'PATCH', body, errorMessage: 'Gagal mengemas kini kontrak' });
    }

    async setContractStatus(id: string, status: ContractStatus): Promise<Contract> {
        return this.request<Contract>({ path: `/contracts/${enc(id)}/status`, method: 'POST', body: { status }, errorMessage: 'Gagal menukar status kontrak' });
    }

    async getContractCompanies(id: string): Promise<ContractCompany[]> {
        return this.request<ContractCompany[]>({ path: `/contracts/${enc(id)}/companies`, errorMessage: 'Gagal memuat panel' });
    }

    async saveContractCompanies(id: string, companies: { name: string; cap?: number | null; details?: CompanyDetail | null }[]): Promise<ContractCompany[]> {
        return this.request<ContractCompany[]>({ path: `/contracts/${enc(id)}/companies`, method: 'PUT', body: companies, errorMessage: 'Gagal menyimpan panel' });
    }

    // --- v2: RATE BOOKS ---
    async getContractBook(id: string, version?: string | number): Promise<PresetGroup[]> {
        const query = version !== undefined ? { version: String(version) } : undefined;
        return this.request<PresetGroup[]>({ path: `/contracts/${enc(id)}/book`, query, errorMessage: 'Gagal memuat buku kadar' });
    }

    async getContractVersions(id: string): Promise<RateBookVersion[]> {
        return this.request<RateBookVersion[]>({ path: `/contracts/${enc(id)}/versions`, errorMessage: 'Gagal memuat versi' });
    }

    async importRateBook(id: string, body: { fileName: string; rateColumn: string; book: ParsedBook }): Promise<ImportResult> {
        return this.request<ImportResult>({ path: `/contracts/${enc(id)}/versions/import`, method: 'POST', body, errorMessage: 'Gagal mengimport buku kadar' });
    }

    async getRateBookVersion(versionId: string): Promise<VersionDetail> {
        return this.request<VersionDetail>({ path: `/rate-book/versions/${enc(versionId)}`, errorMessage: 'Gagal memuat versi' });
    }

    async decideMatches(versionId: string, decisions: MatchDecisionBody[]): Promise<RateBookMatchRow[]> {
        return this.request<RateBookMatchRow[]>({ path: `/rate-book/versions/${enc(versionId)}/matches`, method: 'PATCH', body: { decisions }, errorMessage: 'Gagal menyimpan keputusan padanan' });
    }

    async publishRateBook(versionId: string, message: string): Promise<{ version: RateBookVersion; diff: BookDiff['stats'] }> {
        return this.request({ path: `/rate-book/versions/${enc(versionId)}/publish`, method: 'POST', body: { message }, errorMessage: 'Gagal menerbitkan buku kadar' });
    }

    async diffRateBooks(fromVersionId: string, toVersionId: string): Promise<BookDiff> {
        return this.request<BookDiff>({ path: '/rate-book/diff', query: { from: fromVersionId, to: toVersionId }, errorMessage: 'Gagal membanding versi' });
    }

    // --- v2: PROJECT <-> CONTRACT ---
    async swapProjectContract(projectId: number, contractId: string, unlock = false): Promise<Project> {
        return this.request<Project>({ path: `/projects/${projectId}/contract`, method: 'POST', body: { contractId, unlock }, errorMessage: 'Gagal menukar kontrak projek' });
    }

    async repriceProject(projectId: number, toContractId: string, dryRun: boolean, unlock = false): Promise<RepriceResult> {
        return this.request<RepriceResult>({ path: `/projects/${projectId}/reprice`, method: 'POST', body: { toContractId, dryRun, unlock }, errorMessage: 'Gagal menghitung harga semula' });
    }

    // --- v2: CHANGE LOG ---
    async logProjectEvent(projectId: number, entry: { action: string; message?: string; diff?: unknown }): Promise<void> {
        await this.request({ path: `/projects/${projectId}/log`, method: 'POST', body: entry, errorMessage: 'Gagal merekod log projek' });
    }

    async deleteContract(contractId: string): Promise<void> {
        await this.request({ path: `/contracts/${contractId}`, method: 'DELETE', errorMessage: 'Gagal memadam kontrak' });
    }

    async getChangeLog(filter: { entity?: string; entityId?: string; limit?: number } = {}): Promise<ChangeLogEntry[]> {
        const query: Record<string, string> = {};
        if (filter.entity) query.entity = filter.entity;
        if (filter.entityId) query.entityId = filter.entityId;
        if (filter.limit) query.limit = String(filter.limit);
        return this.request<ChangeLogEntry[]>({ path: '/changelog', query, errorMessage: 'Gagal memuat log perubahan' });
    }

    // --- v2: ORGANISATION CONFIG, LOOKUPS, POLICIES ---
    async getOrgConfig(): Promise<Record<string, unknown>> {
        return this.request<Record<string, unknown>>({ path: '/config', errorMessage: 'Gagal memuat tetapan' });
    }

    async setOrgConfig(key: string, value: unknown): Promise<{ key: string; value: unknown }> {
        return this.request({ path: `/config/${enc(key)}`, method: 'PUT', body: { value }, errorMessage: 'Gagal menyimpan tetapan' });
    }

    async getLookups(list: string): Promise<LookupValue[]> {
        return this.request<LookupValue[]>({ path: `/lookups/${enc(list)}`, errorMessage: 'Gagal memuat senarai' });
    }

    async saveLookups(list: string, values: LookupValue[]): Promise<LookupValue[]> {
        return this.request<LookupValue[]>({ path: `/lookups/${enc(list)}`, method: 'PUT', body: values, errorMessage: 'Gagal menyimpan senarai' });
    }

    async getPolicies(): Promise<PolicyRuleRecord[]> {
        return this.request<PolicyRuleRecord[]>({ path: '/policies', errorMessage: 'Gagal memuat peraturan' });
    }

    async addPolicy(rule: { key: string; effective_from: string; value: unknown; note?: string }): Promise<PolicyRuleRecord[]> {
        return this.request<PolicyRuleRecord[]>({ path: '/policies', method: 'POST', body: rule, errorMessage: 'Gagal menyimpan peraturan' });
    }

    async runLegacyMigration(): Promise<Record<string, unknown>> {
        return this.request({ path: '/v2/admin/migrate-legacy', method: 'POST', errorMessage: 'Migrasi gagal' });
    }
}

const enc = encodeURIComponent;

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
