
import { createClient } from '@supabase/supabase-js';
import { User, Project, PresetGroup, BQTemplateDefinition, BulletinItem, Role, CompanyDetail, VoteDefinition, TemporaryImage } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

class SupabaseService {
    // --- MAPPERS ---
    public mapUser(u: any): User {
        return {
            id: u.id,
            username: u.username,
            fullName: u.full_name,
            role: u.role as Role,
            password: u.password,
            email: u.email,
            phone: u.phone,
            jawatan: u.jawatan,
            bahagian: u.bahagian,
            unit: u.unit,
            department: u.department,
            avatarUrl: u.avatar_url
        };
    }

    public mapTemporaryImage(img: any): TemporaryImage {
        return {
            id: img.id,
            createdAt: img.created_at,
            userId: img.user_id,
            userFullName: img.user_full_name,
            imageUrl: img.image_url,
            projectId: img.project_id,
            locationTag: img.location_tag
        };
    }

    public mapProject(p: any): Project {
        return {
            ...p,
            id: p.id,
            namaProjek: p.nama_projek,
            noAduan: p.no_aduan,
            projectLocations: p.project_locations,
            mukim: p.mukim,
            pjaId: p.pja_id,
            kosProjek: p.kos_projek,
            tarikhBuka: p.tarikh_buka,

            noFail: p.no_fail,
            noSebutharga: p.no_sebutharga,
            noInden: p.no_inden,
            noBpp: p.no_bpp,
            namaSyarikat: p.nama_syarikat,
            noVote: p.no_vote,
            tarikhLantikan: p.tarikh_lantikan,
            tarikhCetakanBpp: p.tarikh_cetakan_bpp,
            tempohKontrak: p.tempoh_kontrak,
            tarikhMulaKontrak: p.tarikh_mula_kontrak,
            tarikhTamatKontrak: p.tarikh_tamat_kontrak,
            tarikhSerahTapak: p.tarikh_serah_tapak,
            tarikhMulaKerja: p.tarikh_mula_kerja,
            isManualMulaKontrak: p.is_manual_mula_kontrak,
            isManualMulaKerja: p.is_manual_mula_kerja,

            tarikhPemeriksaan: p.tarikh_pemeriksaan,
            tarikhSiapSebenar: p.tarikh_siap_sebenar,
            tarikhTuntutanBayaran: p.tarikh_tuntutan_bayaran,
            kosSebenar: p.kos_sebenar,
            ladAmount: p.lad_amount,
            ladDays: p.lad_days,
            locAmount: p.loc_amount,
            locDays: p.loc_days,
            wangTahanan: p.wang_tahanan,

            prestasiScores: p.prestasi_scores,
            noInbois: p.no_inbois,

            tarikhHantarKewangan: p.tarikh_hantar_kewangan,
            tarikhPadanan: p.tarikh_padanan,
            peratusSiap: p.peratus_siap,

            bqData: p.bq_data,
            bqDataPelarasan: p.bq_data_pelarasan,
            globalDimensions: p.global_dimensions,
            locationDimensions: p.location_dimensions,
            locationDimensionsPelarasan: p.location_dimensions_pelarasan,
            globalCalculations: p.global_calculations,
            globalCalculationsPelarasan: p.global_calculations_pelarasan,

            akuJanjiMonth: p.aku_janji_month,
            akuJanjiPanelTitle: p.aku_janji_panel_title,
            akuJanjiFooterText: p.aku_janji_footer_text,

            coverJawatan: p.cover_jawatan,
            coverBahagian: p.cover_bahagian,
            coverUnit: p.cover_unit,
            coverSebutHargaText: p.cover_sebut_harga_text,

            updatedAt: p.updated_at
        };
    }

    private currentUser: User | null = null;

    constructor() {
    }

    setCurrentUser(user: User | null) {
        this.currentUser = user;
    }

    async login(username: string, password: string): Promise<User> {
        const { data, error } = await supabase
            .from('app_users')
            .select('*')
            .ilike('username', username)
            .eq('password', password)
            .single();

        if (error || !data) throw new Error('Invalid credentials');
        const user = this.mapUser(data);
        this.setCurrentUser(user);
        return user;
    }

    async logout() {
        this.setCurrentUser(null);
    }

    getCurrentUser(): User | null {
        return this.currentUser;
    }

    async getBulletins(): Promise<BulletinItem[]> {
        const { data, error } = await supabase
            .from('bulletins')
            .select('*')
            .order('date', { ascending: false },)
            .order('id', { ascending: false });
        if (error) throw error;

        return (data || []).map(b => ({
            ...b,
            readBy: b.read_by,
            reactions: b.reactions
        }));
    }

    async addBulletin(content: string, author: string): Promise<BulletinItem> {
        const { data: currentBulletins } = await supabase
            .from('bulletins')
            .select('id')
            .order('date', { ascending: false })
            .order('id', { ascending: false });

        if (currentBulletins && currentBulletins.length >= 3) {
            const idsToDelete = currentBulletins.slice(2).map(b => b.id);
            await supabase.from('bulletins').delete().in('id', idsToDelete);
        }

        const newItem = {
            id: Date.now().toString(),
            content,
            date: new Date().toISOString().split('T')[0],
            author,
            read_by: [],
            reactions: {}
        };
        const { data, error } = await supabase.from('bulletins').insert(newItem).select().single();
        if (error) throw error;
        return {
            ...data,
            readBy: data.read_by,
            reactions: data.reactions
        };
    }

    async markBulletinAsRead(id: string, userId: number) {
        const { data: bulletin } = await supabase.from('bulletins').select('read_by').eq('id', id).single();
        if (!bulletin) return;

        const readBy = bulletin.read_by || [];
        if (!readBy.includes(userId)) {
            const { error } = await supabase
                .from('bulletins')
                .update({ read_by: [...readBy, userId] })
                .eq('id', id);
            if (error) throw error;
        }
    }

    async toggleReaction(id: string, userId: number, emoji: string) {
        const { data: bulletin } = await supabase.from('bulletins').select('reactions').eq('id', id).single();
        if (!bulletin) return;

        const reactions = bulletin.reactions || {};
        const userList = reactions[emoji] || [];

        if (userList.includes(userId)) {
            // Remove
            reactions[emoji] = userList.filter((uid: number) => uid !== userId);
            if (reactions[emoji].length === 0) delete reactions[emoji];
        } else {
            // Add
            reactions[emoji] = [...userList, userId];
        }

        const { error } = await supabase
            .from('bulletins')
            .update({ reactions })
            .eq('id', id);
        if (error) throw error;
    }

    async deleteBulletin(id: string) {
        const { error } = await supabase.from('bulletins').delete().eq('id', id);
        if (error) throw error;
    }

    async getLibraryGroups(): Promise<PresetGroup[]> {
        const { data, error } = await supabase.from('library_groups').select('*');
        if (error) throw error;
        return data || [];
    }

    async saveLibraryGroups(groups: PresetGroup[]) {
        const { error } = await supabase.from('library_groups').upsert(
            groups.map(g => ({
                id: g.id,
                title: g.title,
                category: g.category,
                items: g.items
            }))
        );
        if (error) throw error;
    }

    async getTemplates(): Promise<BQTemplateDefinition[]> {
        const { data, error } = await supabase
            .from('templates')
            .select('*')
            .order('order_index', { ascending: true });
        if (error) throw error;
        return data?.map(t => ({
            ...t,
            groupRefs: t.group_refs,
            orderIndex: t.order_index
        })) || [];
    }

    async saveTemplates(templates: BQTemplateDefinition[]) {
        const { error } = await supabase.from('templates').upsert(
            templates.map((t, idx) => ({
                id: t.id,
                key: t.key,
                title: t.title,
                subtitle: t.subtitle,
                icon: t.icon,
                color: t.color,
                bills: t.bills,
                group_refs: t.groupRefs,
                order_index: idx
            }))
        );
        if (error) throw error;
    }

    async deleteTemplate(id: string) {
        const { error } = await supabase.from('templates').delete().eq('id', id);
        if (error) throw error;
    }

    async getProjects(): Promise<Project[]> {
        const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data?.map(this.mapProject) || [];
    }

    async getProjectById(id: number): Promise<Project> {
        const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();
        if (error) throw error;
        return this.mapProject(data);
    }

    private sanitizePayload(payload: any): any {
        const sanitized: any = {};
        Object.keys(payload).forEach(key => {
            const value = payload[key];
            // Convert empty strings to null for the database
            if (value === '') {
                sanitized[key] = null;
            } else {
                sanitized[key] = value;
            }
        });
        return sanitized;
    }

    async createProject(project: Omit<Project, 'id'>) {
        const newId = Date.now();
        const dbProject = this.sanitizePayload({
            id: newId,
            nama_projek: project.namaProjek,
            no_aduan: project.noAduan,
            aduan: project.aduan,
            lokasi: project.lokasi,
            project_locations: project.projectLocations,
            bp: project.bp,
            zon: project.zon,
            mukim: project.mukim,
            pja_id: project.pjaId,
            kos_projek: Number(project.kosProjek) || 0,
            tarikh_buka: project.tarikhBuka,
            no_fail: project.noFail,
            no_sebutharga: project.noSebutharga,
            no_inden: project.noInden,
            no_bpp: project.noBpp,
            nama_syarikat: project.namaSyarikat,
            bulan: project.bulan,
            no_vote: project.noVote,
            tarikh_lantikan: project.tarikhLantikan,
            tarikh_cetakan_bpp: project.tarikhCetakanBpp,
            tempoh_kontrak: project.tempohKontrak,
            tarikh_mula_kontrak: project.tarikhMulaKontrak,
            tarikh_tamat_kontrak: project.tarikhTamatKontrak,
            tarikh_serah_tapak: project.tarikhSerahTapak,
            iso: project.iso,
            tarikh_mula_kerja: project.tarikhMulaKerja,
            is_manual_mula_kontrak: project.isManualMulaKontrak,
            is_manual_mula_kerja: project.isManualMulaKerja,
            tarikh_pemeriksaan: project.tarikhPemeriksaan,
            tarikh_siap_sebenar: project.tarikhSiapSebenar,
            prestasi: project.prestasi,
            tarikh_tuntutan_bayaran: project.tarikhTuntutanBayaran,
            kos_sebenar: project.kosSebenar,
            lad_amount: project.ladAmount,
            lad_days: project.ladDays,
            loc_amount: project.locAmount,
            loc_days: project.locDays,
            wang_tahanan: project.wangTahanan,
            skop: project.skop,
            prestasi_scores: project.prestasiScores,
            no_inbois: project.noInbois,
            tarikh_hantar_kewangan: project.tarikhHantarKewangan,
            tarikh_padanan: project.tarikhPadanan,
            peratus_siap: project.peratusSiap,
            status: project.status,
            bq_data: project.bqData,
            bq_data_pelarasan: project.bqDataPelarasan,
            global_dimensions: project.globalDimensions,
            location_dimensions: project.locationDimensions,
            location_dimensions_pelarasan: project.locationDimensionsPelarasan,
            global_calculations: project.globalCalculations,
            global_calculations_pelarasan: project.globalCalculationsPelarasan,
            aku_janji_month: project.akuJanjiMonth,
            aku_janji_panel_title: project.akuJanjiPanelTitle,
            aku_janji_footer_text: project.akuJanjiFooterText,
            cover_jawatan: project.coverJawatan,
            cover_bahagian: project.coverBahagian,
            cover_unit: project.coverUnit,
            cover_sebut_harga_text: project.coverSebutHargaText,
            updated_at: new Date().toISOString()
        });

        const { data, error } = await supabase.from('projects').insert(dbProject).select().single();
        if (error) throw error;
        return this.mapProject(data);
    }

    async updateProject(id: number, updates: Partial<Project>) {
        // Map updates to snake_case
        const rawUpdates: any = {};
        if (updates.namaProjek !== undefined) rawUpdates.nama_projek = updates.namaProjek;
        if (updates.noAduan !== undefined) rawUpdates.no_aduan = updates.noAduan;
        if (updates.aduan !== undefined) rawUpdates.aduan = updates.aduan;
        if (updates.lokasi !== undefined) rawUpdates.lokasi = updates.lokasi;
        if (updates.projectLocations !== undefined) rawUpdates.project_locations = updates.projectLocations;
        if (updates.bp !== undefined) rawUpdates.bp = updates.bp;
        if (updates.zon !== undefined) rawUpdates.zon = updates.zon;
        if (updates.mukim !== undefined) rawUpdates.mukim = updates.mukim;
        if (updates.pjaId !== undefined) rawUpdates.pja_id = updates.pjaId;
        if (updates.kosProjek !== undefined) rawUpdates.kos_projek = updates.kosProjek;
        if (updates.tarikhBuka !== undefined) rawUpdates.tarikh_buka = updates.tarikhBuka;

        if (updates.noFail !== undefined) rawUpdates.no_fail = updates.noFail;
        if (updates.noSebutharga !== undefined) rawUpdates.no_sebutharga = updates.noSebutharga;
        if (updates.noInden !== undefined) rawUpdates.no_inden = updates.noInden;
        if (updates.noBpp !== undefined) rawUpdates.no_bpp = updates.noBpp;
        if (updates.namaSyarikat !== undefined) rawUpdates.nama_syarikat = updates.namaSyarikat;
        if (updates.bulan !== undefined) rawUpdates.bulan = updates.bulan;
        if (updates.noVote !== undefined) rawUpdates.no_vote = updates.noVote;
        if (updates.tarikhLantikan !== undefined) rawUpdates.tarikh_lantikan = updates.tarikhLantikan;
        if (updates.tarikhCetakanBpp !== undefined) rawUpdates.tarikh_cetakan_bpp = updates.tarikhCetakanBpp;
        if (updates.tempohKontrak !== undefined) rawUpdates.tempoh_kontrak = updates.tempohKontrak;
        if (updates.tarikhMulaKontrak !== undefined) rawUpdates.tarikh_mula_kontrak = updates.tarikhMulaKontrak;
        if (updates.tarikhTamatKontrak !== undefined) rawUpdates.tarikh_tamat_kontrak = updates.tarikhTamatKontrak;
        if (updates.tarikhSerahTapak !== undefined) rawUpdates.tarikh_serah_tapak = updates.tarikhSerahTapak;
        if (updates.iso !== undefined) rawUpdates.iso = updates.iso;
        if (updates.tarikhMulaKerja !== undefined) rawUpdates.tarikh_mula_kerja = updates.tarikhMulaKerja;
        if (updates.isManualMulaKontrak !== undefined) rawUpdates.is_manual_mula_kontrak = updates.isManualMulaKontrak;
        if (updates.isManualMulaKerja !== undefined) rawUpdates.is_manual_mula_kerja = updates.isManualMulaKerja;

        if (updates.tarikhPemeriksaan !== undefined) rawUpdates.tarikh_pemeriksaan = updates.tarikhPemeriksaan;
        if (updates.tarikhSiapSebenar !== undefined) rawUpdates.tarikh_siap_sebenar = updates.tarikhSiapSebenar;
        if (updates.prestasi !== undefined) rawUpdates.prestasi = updates.prestasi;
        if (updates.tarikhTuntutanBayaran !== undefined) rawUpdates.tarikh_tuntutan_bayaran = updates.tarikhTuntutanBayaran;
        if (updates.kosSebenar !== undefined) rawUpdates.kos_sebenar = updates.kosSebenar;
        if (updates.ladAmount !== undefined) rawUpdates.lad_amount = updates.ladAmount;
        if (updates.ladDays !== undefined) rawUpdates.lad_days = updates.ladDays;
        if (updates.locAmount !== undefined) rawUpdates.loc_amount = updates.locAmount;
        if (updates.locDays !== undefined) rawUpdates.loc_days = updates.locDays;
        if (updates.wangTahanan !== undefined) rawUpdates.wang_tahanan = updates.wangTahanan;

        if (updates.skop !== undefined) rawUpdates.skop = updates.skop;
        if (updates.prestasiScores !== undefined) rawUpdates.prestasi_scores = updates.prestasiScores;
        if (updates.noInbois !== undefined) rawUpdates.no_inbois = updates.noInbois;

        if (updates.tarikhHantarKewangan !== undefined) rawUpdates.tarikh_hantar_kewangan = updates.tarikhHantarKewangan;
        if (updates.tarikhPadanan !== undefined) rawUpdates.tarikh_padanan = updates.tarikhPadanan;
        if (updates.peratusSiap !== undefined) rawUpdates.peratus_siap = updates.peratusSiap;
        if (updates.status !== undefined) rawUpdates.status = updates.status;

        if (updates.bqData !== undefined) rawUpdates.bq_data = updates.bqData;
        if (updates.bqDataPelarasan !== undefined) rawUpdates.bq_data_pelarasan = updates.bqDataPelarasan;
        if (updates.globalDimensions !== undefined) rawUpdates.global_dimensions = updates.globalDimensions;
        if (updates.locationDimensions !== undefined) rawUpdates.location_dimensions = updates.locationDimensions;
        if (updates.locationDimensionsPelarasan !== undefined) rawUpdates.location_dimensions_pelarasan = updates.locationDimensionsPelarasan;
        if (updates.globalCalculations !== undefined) rawUpdates.global_calculations = updates.globalCalculations;
        if (updates.globalCalculationsPelarasan !== undefined) rawUpdates.global_calculations_pelarasan = updates.globalCalculationsPelarasan;

        if (updates.akuJanjiMonth !== undefined) rawUpdates.aku_janji_month = updates.akuJanjiMonth;
        if (updates.akuJanjiPanelTitle !== undefined) rawUpdates.aku_janji_panel_title = updates.akuJanjiPanelTitle;
        if (updates.akuJanjiFooterText !== undefined) rawUpdates.aku_janji_footer_text = updates.akuJanjiFooterText;

        if (updates.coverJawatan !== undefined) rawUpdates.cover_jawatan = updates.coverJawatan;
        if (updates.coverBahagian !== undefined) rawUpdates.cover_bahagian = updates.coverBahagian;
        if (updates.coverUnit !== undefined) rawUpdates.cover_unit = updates.coverUnit;
        if (updates.coverSebutHargaText !== undefined) rawUpdates.cover_sebut_harga_text = updates.coverSebutHargaText;

        rawUpdates.updated_at = new Date().toISOString();

        const dbUpdates = this.sanitizePayload(rawUpdates);

        const { data, error } = await supabase.from('projects').update(dbUpdates).eq('id', id).select().single();
        if (error) throw error;
        return this.mapProject(data);
    }

    async deleteProject(id: number) {
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) throw error;
    }

    async getUsers(): Promise<User[]> {
        const { data, error } = await supabase.from('app_users').select('*');
        if (error) throw error;
        return data?.map(this.mapUser) || [];
    }

    async addUser(user: Omit<User, 'id'>) {
        const newId = Date.now();
        const dbUser = {
            id: newId,
            username: user.username,
            full_name: user.fullName,
            role: user.role,
            password: user.password,
            email: user.email,
            phone: user.phone,
            jawatan: user.jawatan,
            bahagian: user.bahagian,
            unit: user.unit,
            department: user.department,
            avatar_url: user.avatarUrl
        };
        const { data, error } = await supabase.from('app_users').insert(dbUser).select().single();
        if (error) throw error;
        return this.mapUser(data);
    }

    async updateUser(id: number, updates: Partial<User>) {
        const dbUpdates: any = {};
        if (updates.username !== undefined) dbUpdates.username = updates.username;
        if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
        if (updates.role !== undefined) dbUpdates.role = updates.role;
        if (updates.password !== undefined) dbUpdates.password = updates.password;
        if (updates.email !== undefined) dbUpdates.email = updates.email;
        if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
        if (updates.jawatan !== undefined) dbUpdates.jawatan = updates.jawatan;
        if (updates.bahagian !== undefined) dbUpdates.bahagian = updates.bahagian;
        if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
        if (updates.department !== undefined) dbUpdates.department = updates.department;
        if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;

        const { data, error } = await supabase.from('app_users').update(dbUpdates).eq('id', id).select().single();
        if (error) throw error;

        const mapped = this.mapUser(data);
        if (this.currentUser && this.currentUser.id === id) {
            this.setCurrentUser(mapped);
        }
        return mapped;
    }

    async deleteUser(id: number) {
        const { error } = await supabase.from('app_users').delete().eq('id', id);
        if (error) throw error;
    }

    private async getSystemSettings(year: number) {
        const { data, error } = await supabase.from('system_settings').select('*').eq('year', year).single();
        if (error && error.code !== 'PGRST116') throw error;
        return data || {};
    }

    private async updateSystemSettings(year: number, updates: any) {
        const { error } = await supabase
            .from('system_settings')
            .upsert({ year, ...updates }, { onConflict: 'year' });

        if (error) throw error;
    }

    async getCompanies(year: number): Promise<string[]> {
        const s = await this.getSystemSettings(year);
        return s.companies || [];
    }

    async getCompanyOrder(year: number): Promise<string[]> {
        const s = await this.getSystemSettings(year);
        return s.company_order || [];
    }

    async saveCompanyOrder(year: number, order: string[]) {
        await this.updateSystemSettings(year, { company_order: order });
    }

    async addCompany(year: number, name: string) {
        const s = await this.getSystemSettings(year);
        const companies = s.companies || [];
        const order = s.company_order || [];

        if (!companies.includes(name)) {
            companies.push(name);
            order.push(name);
            await this.updateSystemSettings(year, { companies, company_order: order });
        }
    }

    async deleteCompany(year: number, name: string) {
        const s = await this.getSystemSettings(year);
        const companies = (s.companies || []).filter((c: string) => c !== name);
        const order = (s.company_order || []).filter((c: string) => c !== name);
        const details = s.company_details || {};
        if (details[name]) delete details[name];

        await this.updateSystemSettings(year, { companies, company_order: order, company_details: details });
    }

    async getCompanyDetails(year: number, name: string): Promise<CompanyDetail | undefined> {
        const s = await this.getSystemSettings(year);
        return s.company_details?.[name];
    }

    async getAllCompanyDetails(year: number): Promise<Record<string, CompanyDetail>> {
        const s = await this.getSystemSettings(year);
        return s.company_details || {};
    }

    async saveCompanyDetails(year: number, detail: CompanyDetail) {
        const s = await this.getSystemSettings(year);
        const details = s.company_details || {};
        details[detail.name] = detail;

        const companies = s.companies || [];
        if (!companies.includes(detail.name)) companies.push(detail.name);

        await this.updateSystemSettings(year, { company_details: details, companies });
    }

    async getVoteNumbers(year: number): Promise<string[]> {
        const votes = await this.getVotes(year);
        return votes.map(v => v.code);
    }

    async getVotes(year: number): Promise<VoteDefinition[]> {
        const s = await this.getSystemSettings(year);
        return s.vote_numbers || [];
    }

    async saveVote(year: number, vote: VoteDefinition) {
        const s = await this.getSystemSettings(year);
        let votes = s.vote_numbers || [];
        const index = votes.findIndex((v: any) => v.code === vote.code);
        if (index >= 0) votes[index] = vote;
        else votes.push(vote);

        await this.updateSystemSettings(year, { vote_numbers: votes });
    }

    async deleteVoteNumber(year: number, voteCode: string) {
        const s = await this.getSystemSettings(year);
        const votes = (s.vote_numbers || []).filter((v: any) => v.code !== voteCode);
        await this.updateSystemSettings(year, { vote_numbers: votes });
    }

    async getSebuthargaNumbers(year: number): Promise<string[]> {
        const s = await this.getSystemSettings(year);
        return s.sebutharga_numbers || [];
    }

    async addSebuthargaNumber(year: number, sh: string) {
        const s = await this.getSystemSettings(year);
        const nums = s.sebutharga_numbers || [];
        if (!nums.includes(sh)) {
            nums.push(sh);
            await this.updateSystemSettings(year, { sebutharga_numbers: nums });
        }
    }

    async deleteSebuthargaNumber(year: number, sh: string) {
        const s = await this.getSystemSettings(year);
        const nums = (s.sebutharga_numbers || []).filter((n: string) => n !== sh);
        await this.updateSystemSettings(year, { sebutharga_numbers: nums });
    }

    async getSettings(year: number) {
        const s = await this.getSystemSettings(year);
        return s;
    }

    async updateSettings(year: number, settings: any) {
        await this.updateSystemSettings(year, settings);
    }

    async getManualFinancials(year: number) {
        const s = await this.getSystemSettings(year);
        return s.manual_financials || { outsource: 0, ydp: 0 };
    }

    async saveManualFinancials(year: number, data: { outsource: number, ydp: number }) {
        await this.updateSystemSettings(year, { manual_financials: data });
    }

    // --- TEMPORARY GALLERY ---
    async getTemporaryGallery(): Promise<TemporaryImage[]> {
        const { data, error } = await supabase
            .from('temporary_gallery')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(img => this.mapTemporaryImage(img));
    }

    async uploadTemporaryImage(file: File, userId: number, userFullName: string, projectId?: number, location?: string): Promise<TemporaryImage> {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        // 1. Upload to Storage
        const { error: uploadError } = await supabase.storage
            .from('temp_gallery')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true,
                contentType: file.type,
            });

        if (uploadError) {
            console.error('Storage upload error:', uploadError);
            throw uploadError;
        }

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('temp_gallery')
            .getPublicUrl(filePath);

        // 3. Save to Database
        const newItem = {
            user_id: userId,
            user_full_name: userFullName,
            image_url: publicUrl,
            project_id: projectId || null,
            location_tag: location || null,
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase.from('temporary_gallery').insert(newItem).select().single();
        if (error) throw error;

        return this.mapTemporaryImage(data);
    }

    async deleteTemporaryImage(id: string, imageUrl: string) {
        // Extract filename from URL (assuming Supabase standard public URL)
        // URL like: .../storage/v1/object/public/temp_gallery/123_456.jpg
        const parts = imageUrl.split('/');
        const fileName = parts[parts.length - 1];

        // 1. Delete from Storage
        const { error: storageError } = await supabase.storage
            .from('temp_gallery')
            .remove([fileName]);

        if (storageError) console.error("Storage delete error", storageError);

        // 2. Delete from Database
        const { error: dbError } = await supabase.from('temporary_gallery').delete().eq('id', id);
        if (dbError) throw dbError;
    }
}

export const supabaseService = new SupabaseService();
