import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { apiService } from '../services/apiService';
import { useSettings } from '../hooks/useSettings';
import { useBulletins } from '../hooks/useBulletins';
import { Trash2, Plus, Building2, FileDigit, ShieldAlert, Calendar, Info, Edit2, X, Save, FileText, AlertTriangle, ArrowUp, ArrowDown, Package, Layers, PlusCircle, MinusCircle, ChevronRight, ChevronDown, List, HelpCircle, LayoutTemplate, FileInput, Edit3, Grid2x2, Check, GripVertical, ArrowLeft, ArrowRight, ClipboardList, Box, Truck, Wrench, Hammer, Ruler, CheckSquare, Grid, Zap, Briefcase, Archive, Star, Award, Bookmark, PenTool, RefreshCw, ChevronsUp, ChevronsDown, Hash, Loader2 } from 'lucide-react';
import { User, Role, CompanyDetail, VoteDefinition, PresetGroup, PresetItem, PresetVariant, BQTemplateDefinition, BQTemplateBillDefinition, BQItem } from '../types';
import { createItem, createHeader } from '../data/bqPresets';

interface AdminSettingsProps {
    user: User;
    selectedYear: number;
}

// Icon Map for Template Cards
const ICON_MAP = {
    file: FileInput,
    'file-text': FileText,
    edit: Edit3,
    layout: LayoutTemplate,
    list: List,
    grid: Grid,
    plus: Plus,
    check: CheckSquare,
    clipboard: ClipboardList,
    layers: Layers,
    box: Box,
    package: Package,
    truck: Truck,
    wrench: Wrench,
    hammer: Hammer,
    ruler: Ruler,
    zap: Zap,
    briefcase: Briefcase,
    archive: Archive,
    star: Star,
    award: Award,
    bookmark: Bookmark,
    tool: PenTool
};

const getColorStyles = (color: string) => {
    const colors: Record<string, string> = {
        slate: "bg-slate-100 text-slate-600 border-slate-200",
        red: "bg-red-100 text-red-600 border-red-200",
        orange: "bg-orange-100 text-orange-600 border-orange-200",
        amber: "bg-amber-100 text-amber-600 border-amber-200",
        yellow: "bg-yellow-100 text-yellow-600 border-yellow-200",
        lime: "bg-lime-100 text-lime-600 border-lime-200",
        green: "bg-green-100 text-green-600 border-green-200",
        emerald: "bg-blue-100 text-blue-600 border-blue-200",
        teal: "bg-cyan-100 text-cyan-600 border-cyan-200",
        cyan: "bg-cyan-100 text-cyan-600 border-cyan-200",
        sky: "bg-sky-100 text-sky-600 border-sky-200",
        blue: "bg-blue-100 text-blue-600 border-blue-200",
        indigo: "bg-indigo-100 text-indigo-600 border-indigo-200",
        violet: "bg-violet-100 text-violet-600 border-violet-200",
        purple: "bg-purple-100 text-purple-600 border-purple-200",
        fuchsia: "bg-fuchsia-100 text-fuchsia-600 border-fuchsia-200",
        pink: "bg-pink-100 text-pink-600 border-pink-200",
        rose: "bg-rose-100 text-rose-600 border-rose-200",
    };
    return colors[color] || colors['blue'];
}

// Helper for Roman Numerals
function toRoman(num: number): string {
    const lookup: { [key: string]: number } = { m: 1000, cm: 900, d: 500, cd: 400, c: 100, xc: 90, l: 50, xl: 40, x: 10, ix: 9, v: 5, iv: 4, i: 1 };
    let roman = '';
    for (let i in lookup) {
        while (num >= lookup[i]) {
            roman += i;
            num -= lookup[i];
        }
    }
    return roman;
}

// Custom Date Input Component matching the requested style
const DatePickerInput = ({ value, onChange, placeholder }: { value: string, onChange: (val: string) => void, placeholder?: string }) => {
    const malayToIso = (str: string) => {
        if (!str) return '';
        const parts = str.split(' ');
        if (parts.length !== 3) return '';
        const day = parts[0].padStart(2, '0');
        const months = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"];
        const monthName = parts[1];
        const monthIdx = months.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
        if (monthIdx === -1) return '';
        return `${parts[2]}-${String(monthIdx + 1).padStart(2, '0')}-${day}`;
    };

    const isoToMalay = (iso: string) => {
        if (!iso) return '';
        const [y, m, d] = iso.split('-');
        const months = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"];
        return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
    };

    const malayToDisplay = (str: string) => {
        const iso = malayToIso(str);
        if (!iso) return str;
        const [y, m, d] = iso.split('-');
        return `${d}/${m}/${y}`;
    };

    const displayToMalay = (disp: string) => {
        const parts = disp.trim().split(/[\/\-\.]/);
        if (parts.length !== 3) return '';
        const d = parts[0].padStart(2, '0');
        const m = parts[1].padStart(2, '0');
        let y = parts[2];
        if (y.length === 2) y = "20" + y;
        const months = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"];
        const mInt = parseInt(m);
        if (mInt < 1 || mInt > 12) return '';
        return `${parseInt(d)} ${months[mInt - 1]} ${y}`;
    };

    const [text, setText] = useState('');

    useEffect(() => {
        setText(malayToDisplay(value));
    }, [value]);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setText(val);
        if (/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}$/.test(val)) {
            const malay = displayToMalay(val);
            if (malay) onChange(malay);
        } else if (val === '') {
            onChange('');
        }
    };

    const pickerRef = useRef<HTMLInputElement>(null);

    const handleIconClick = () => {
        if (pickerRef.current) {
            if ('showPicker' in HTMLInputElement.prototype) {
                try {
                    pickerRef.current.showPicker();
                } catch (err) {
                    pickerRef.current.click();
                }
            } else {
                pickerRef.current.click();
            }
        }
    };

    const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const iso = e.target.value;
        if (iso) {
            onChange(isoToMalay(iso));
        }
    };

    return (
        <div className="relative flex items-center w-full px-4 py-3 rounded-lg bg-white  border border-slate-300  focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 outline-none transition-colors text-slate-900  shadow-sm  h-14">
            <input
                type="text"
                value={text}
                onChange={handleTextChange}
                placeholder={placeholder || "DD/MM/YYYY"}
                className="w-full h-full bg-transparent border-none outline-none p-0 text-inherit placeholder-slate-400 font-bold"
            />
            <div
                className="relative ml-2 w-5 h-5 shrink-0 group cursor-pointer"
                onClick={handleIconClick}
            >
                <Calendar className="w-5 h-5 pointer-events-none text-slate-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <input
                type="date"
                ref={pickerRef}
                value={malayToIso(value)}
                onChange={handlePickerChange}
                className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
                tabIndex={-1}
            />
        </div>
    );
};

const AdminSettings: React.FC<AdminSettingsProps> = ({ user, selectedYear }) => {
    const {
        settings,
        companies,
        votes,
        sebuthargaNumbers,
        updateSettings,
        isSyncing: isSettingsSyncing
    } = useSettings(selectedYear);

    const [companyOrder, setCompanyOrder] = useState<string[]>([]);
    const [newCompany, setNewCompany] = useState('');
    const [editingVote, setEditingVote] = useState<VoteDefinition | null>(null);
    const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
    const [newSebutharga, setNewSebutharga] = useState('');
    const [meetingDate, setMeetingDate] = useState('');
    const [meetingNumber, setMeetingNumber] = useState('');
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [companyToEdit, setCompanyToEdit] = useState<CompanyDetail | null>(null);
    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
    const [deleteConfig, setDeleteConfig] = useState<{ isOpen: boolean; type: 'COMPANY' | 'VOTE' | 'SEBUTHARGA' | 'PRESET_GROUP' | 'TEMPLATE' | null; value: string; }>({ isOpen: false, type: null, value: '' });

    const [libraryGroups, setLibraryGroups] = useState<PresetGroup[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
    const [isSavingLibrary, setIsSavingLibrary] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isAddingCategory, setIsAddingCategory] = useState(false);

    const [templates, setTemplates] = useState<BQTemplateDefinition[]>([]);
    const [editingTemplate, setEditingTemplate] = useState<BQTemplateDefinition | null>(null);
    const [isEditTemplateModalOpen, setIsEditTemplateModalOpen] = useState(false);

    const ICON_MAP_KEYS = Object.keys(ICON_MAP) as (keyof typeof ICON_MAP)[];
    const COLOR_LIST = ['slate', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'];

    useEffect(() => {
        if (settings) {
            setMeetingDate(settings.meeting_date || '');
            setMeetingNumber(settings.meeting_number || '');
            const loadedOrder = settings.company_order || [];
            const loadedCompanies = settings.companies || [];
            const combinedOrder = Array.from(new Set([...loadedOrder, ...loadedCompanies])).filter(c => loadedCompanies.includes(c));
            setCompanyOrder(combinedOrder);
        }
    }, [settings]);

    useEffect(() => {
        const loadLibraryAndTemplates = async () => {
            try {
                const [library, loadedTemplates] = await Promise.all([
                    apiService.getLibraryGroups(),
                    apiService.getTemplates()
                ]);
                setLibraryGroups(library);
                const categories = Array.from(new Set(library.map(g => g.category)));
                if (categories.length > 0 && !selectedCategory) setSelectedCategory(categories[0]);
                setTemplates(loadedTemplates);
            } catch (err) {
                console.error('Failed to load library/templates:', err);
            }
        };
        loadLibraryAndTemplates();
    }, []);

    const handleAddCompany = async () => {
        if (newCompany.trim()) {
            const newCompanies = [...companies, newCompany.trim()];
            const newOrder = [...companyOrder, newCompany.trim()];
            await updateSettings({ companies: newCompanies, company_order: newOrder });
            setNewCompany('');
        }
    };

    const moveCompany = async (index: number, direction: 'up' | 'down' | 'top' | 'bottom' | number) => {
        const newOrder = [...companyOrder];
        const item = newOrder.splice(index, 1)[0];

        let targetIndex = index;
        if (direction === 'up') targetIndex = Math.max(0, index - 1);
        else if (direction === 'down') targetIndex = Math.min(newOrder.length, index + 1);
        else if (direction === 'top') targetIndex = 0;
        else if (direction === 'bottom') targetIndex = newOrder.length;
        else if (typeof direction === 'number') targetIndex = Math.max(0, Math.min(newOrder.length, direction));

        newOrder.splice(targetIndex, 0, item);
        setCompanyOrder(newOrder);
        await updateSettings({ company_order: newOrder });
    };

    const jumpToRank = (index: number) => {
        const currentRank = index + 1;
        const input = prompt(`Masukkan kedudukan baru untuk syarikat ini (1-${companyOrder.length}):`, currentRank.toString());
        if (input !== null) {
            const newRank = parseInt(input);
            if (!isNaN(newRank) && newRank >= 1 && newRank <= companyOrder.length) {
                moveCompany(index, newRank - 1);
            }
        }
    };

    const moveTemplate = async (index: number, direction: 'prev' | 'next') => {
        if (direction === 'prev' && index === 0) return;
        if (direction === 'next' && index === templates.length - 1) return;

        const newTemplates = [...templates];
        const targetIndex = direction === 'prev' ? index - 1 : index + 1;
        const temp = newTemplates[index];
        newTemplates[index] = newTemplates[targetIndex];
        newTemplates[targetIndex] = temp;

        setTemplates(newTemplates);
        await apiService.saveTemplates(newTemplates);
    };

    const initiateDelete = (type: 'COMPANY' | 'VOTE' | 'SEBUTHARGA' | 'PRESET_GROUP' | 'TEMPLATE', value: string) => {
        setDeleteConfig({ isOpen: true, type, value });
    };

    const confirmDelete = async () => {
        const { type, value } = deleteConfig;
        if (type === 'COMPANY') {
            const newCompanies = companies.filter(c => c !== value);
            const newOrder = companyOrder.filter(c => c !== value);
            const details = settings.company_details || {};
            if (details[value]) delete details[value];
            await updateSettings({ companies: newCompanies, company_order: newOrder, company_details: details });
        } else if (type === 'VOTE') {
            const newVotes = votes.filter(v => v.code !== value);
            await updateSettings({ vote_numbers: newVotes });
        } else if (type === 'SEBUTHARGA') {
            const newNums = sebuthargaNumbers.filter(n => n !== value);
            await updateSettings({ sebutharga_numbers: newNums });
        } else if (type === 'PRESET_GROUP') {
            const newGroups = libraryGroups.filter(g => g.id !== value);
            setLibraryGroups(newGroups);
            await apiService.saveLibraryGroups(newGroups);
        } else if (type === 'TEMPLATE') {
            await apiService.deleteTemplate(value);
            const newTemplates = templates.filter(t => t.id !== value);
            setTemplates(newTemplates);
        }
        setDeleteConfig({ isOpen: false, type: null, value: '' });
    };

    const openCompanyModal = async (name: string) => {
        const details = settings.company_details?.[name];
        setCompanyToEdit(details || { name: name, address: '', ownerName: '', phone: '', email: '', gred: 'G1', phoneAlt: '', registrationNumber: '' });
        setIsCompanyModalOpen(true);
    };

    const handleSaveCompanyDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        if (companyToEdit) {
            const details = settings.company_details || {};
            details[companyToEdit.name] = companyToEdit;
            const newCompanies = Array.from(new Set([...companies, companyToEdit.name]));
            await updateSettings({ company_details: details, companies: newCompanies });
            setIsCompanyModalOpen(false);
            setCompanyToEdit(null);
        }
    };

    const openVoteModal = (vote?: VoteDefinition) => {
        setEditingVote(vote ? { ...vote } : { code: '', name: '', allocation: 0 });
        setIsVoteModalOpen(true);
    };

    const handleSaveVote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingVote) {
            let newVotes = [...votes];
            const index = newVotes.findIndex(v => v.code === editingVote.code);
            if (index >= 0) newVotes[index] = editingVote;
            else newVotes.push(editingVote);
            await updateSettings({ vote_numbers: newVotes });
            setIsVoteModalOpen(false);
            setEditingVote(null);
        }
    };

    const handleAddSebutharga = async () => {
        if (newSebutharga.trim() && !sebuthargaNumbers.includes(newSebutharga.trim())) {
            const newNums = [...sebuthargaNumbers, newSebutharga.trim()];
            await updateSettings({ sebutharga_numbers: newNums });
            setNewSebutharga('');
        }
    };

    const handleSaveSettings = async () => {
        setIsSavingSettings(true);
        try {
            await updateSettings({
                meeting_date: meetingDate,
                meeting_number: meetingNumber
            });
        } catch (err: any) {
            console.error('Failed to save settings:', err);
            alert('Ralat menyimpan: ' + (err.message || 'Sila semak konsol'));
        } finally {
            setIsSavingSettings(false);
        }
    };



    const saveLibraryState = async (newGroups: PresetGroup[]) => {
        setIsSavingLibrary(true);
        setLibraryGroups(newGroups);
        try {
            await apiService.saveLibraryGroups(newGroups);
        } catch (err) {
            console.error('Failed to save library:', err);
        } finally {
            setIsSavingLibrary(false);
        }
    };

    const handleAddGroup = (category: string) => {
        const newGroup: PresetGroup = {
            id: `custom-${Date.now()}`,
            title: 'TEMPLATE BARU',
            category: category,
            items: []
        };
        saveLibraryState([...libraryGroups, newGroup]);
        setActiveGroupId(newGroup.id);
    };

    const handleAddCategory = () => {
        if (newCategoryName.trim()) {
            // Creating a new category requires creating at least one empty group with that category
            const newGroup: PresetGroup = {
                id: `cat-init-${Date.now()}`,
                title: 'KUMPULAN PERTAMA',
                category: newCategoryName.trim(),
                items: []
            };
            saveLibraryState([...libraryGroups, newGroup]);
            setSelectedCategory(newCategoryName.trim());
            setActiveGroupId(newGroup.id);
            setNewCategoryName('');
            setIsAddingCategory(false);
        }
    };

    const handleUpdateGroup = (groupId: string, updates: Partial<PresetGroup>) => {
        const newGroups = libraryGroups.map(g => g.id === groupId ? { ...g, ...updates } : g);
        saveLibraryState(newGroups);
    };

    const handleAddItem = (groupId: string) => {
        const newGroups = libraryGroups.map(g => {
            if (g.id !== groupId) return g;
            const newItem: PresetItem = {
                id: `item-${Date.now()}`,
                description: 'ITEM BARU',
                rate: 0,
                unit: 'm'
            };
            return { ...g, items: [...g.items, newItem] };
        });
        saveLibraryState(newGroups);
    };

    const handleUpdateItem = (groupId: string, itemId: string, updates: Partial<PresetItem>) => {
        const newGroups = libraryGroups.map(g => {
            if (g.id !== groupId) return g;
            return {
                ...g,
                items: g.items.map(i => i.id === itemId ? { ...i, ...updates } : i)
            };
        });
        saveLibraryState(newGroups);
    };

    const handleDeleteItem = (groupId: string, itemId: string) => {
        const newGroups = libraryGroups.map(g => {
            if (g.id !== groupId) return g;
            return { ...g, items: g.items.filter(i => i.id !== itemId) };
        });
        saveLibraryState(newGroups);
    };

    const handleAddVariant = (groupId: string, itemId: string) => {
        const newGroups = libraryGroups.map(g => {
            if (g.id !== groupId) return g;
            return {
                ...g,
                items: g.items.map(item => {
                    if (item.id !== itemId) return item;
                    const newVariant: PresetVariant = {
                        id: `v-${Date.now()}`,
                        label: 'VARIAN BARU',
                        rate: 0,
                        unit: item.unit || 'm'
                    };
                    return { ...item, variants: [...(item.variants || []), newVariant] };
                })
            };
        });
        saveLibraryState(newGroups);
    };

    const handleUpdateVariant = (groupId: string, itemId: string, varId: string, updates: Partial<PresetVariant>) => {
        const newGroups = libraryGroups.map(g => {
            if (g.id !== groupId) return g;
            return {
                ...g,
                items: g.items.map(item => {
                    if (item.id !== itemId) return item;
                    return {
                        ...item,
                        variants: (item.variants || []).map(v => v.id === varId ? { ...v, ...updates } : v)
                    };
                })
            };
        });
        saveLibraryState(newGroups);
    };

    const handleDeleteVariant = (groupId: string, itemId: string, varId: string) => {
        const newGroups = libraryGroups.map(g => {
            if (g.id !== groupId) return g;
            return {
                ...g, items: g.items.map(item => {
                    if (item.id !== itemId) return item;
                    return { ...item, variants: (item.variants || []).filter(v => v.id !== varId) };
                })
            };
        });
        saveLibraryState(newGroups);
    };

    // --- TEMPLATE GENERATION LOGIC ---

    const generateInsuransTemplate = async () => {
        // Hardcoded references for Insurans
        const refs = [
            { groupId: 'G1-1', itemId: '1-01', variantId: '1-01-v1' },
            { groupId: 'G1-2', itemId: '2-01' },
            { groupId: 'G1-3', itemId: '3-01' }
        ];

        const templateItems: BQItem[] = [];
        let lastGroupId = '';

        refs.forEach(ref => {
            const group = libraryGroups.find(g => g.id === ref.groupId);
            if (group) {
                // Add Group Header if new group
                if (ref.groupId !== lastGroupId) {
                    templateItems.push(createHeader(group.title.toUpperCase()));
                    lastGroupId = ref.groupId;
                }
                const item = createItem(libraryGroups, ref.groupId, ref.itemId, ref.variantId);
                if (item) {
                    // Restore source tracking for sync
                    item.sourceGroupId = ref.groupId;
                    item.sourceItemId = ref.itemId;
                    item.sourceVariantId = ref.variantId;
                    templateItems.push(item);
                }
            }
        });

        const newTemplate: BQTemplateDefinition = {
            id: `tpl-${Date.now()}`,
            key: 'PERMULAAN_BASIC', // Using standard key
            title: 'KERJA PERMULAAN (INSURANS)',
            subtitle: 'Insurans, Traffic Mgmt & Laporan',
            icon: 'file-text',
            color: 'blue',
            bills: [
                { id: 'b1', title: 'KERJA PERMULAAN (INSURANS)', items: templateItems }
            ],
            groupRefs: [] // Legacy
        };

        await handleSaveTemplate(newTemplate);
    };

    const generateEmptyTemplate = async () => {
        const newTemplate: BQTemplateDefinition = {
            id: `tpl-${Date.now()}`,
            key: 'EMPTY',
            title: 'TEMPLATE KOSONG',
            subtitle: 'Bina senarai BQ dari kosong',
            icon: 'layout',
            color: 'slate',
            bills: [
                { id: 'b1', title: 'KERJA-KERJA UMUM', items: [] }
            ],
            groupRefs: []
        };
        await handleSaveTemplate(newTemplate);
    };

    const handleSaveTemplate = async (template: BQTemplateDefinition) => {
        const index = templates.findIndex(t => t.id === template.id);
        let newTemplates = [...templates];
        if (index >= 0) newTemplates[index] = template;
        else newTemplates.push(template);

        setTemplates(newTemplates);
        await apiService.saveTemplates(newTemplates);
        setIsEditTemplateModalOpen(false);
        setEditingTemplate(null);
    };

    const openEditTemplateModal = (template: BQTemplateDefinition) => {
        setEditingTemplate({ ...template });
        setIsEditTemplateModalOpen(true);
    };

    if (user.role !== Role.ADMIN) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <ShieldAlert className="w-16 h-16 text-red-400 mb-4" />
                <h2 className="text-xl font-bold text-slate-800">Akses Ditolak</h2>
                <p>Hanya Admin boleh mengakses tetapan ini.</p>
            </div>
        );
    }

    const categories = Array.from(new Set(libraryGroups.map(g => g.category)));
    const currentCategoryGroups = libraryGroups.filter(g => g.category === selectedCategory);
    const activeGroup = libraryGroups.find(g => g.id === activeGroupId);

    const inputClass = "w-full px-4 py-2.5 rounded-lg bg-slate-50  border border-slate-200  outline-none focus:ring-2 focus:ring-blue-500 text-sm";
    const labelClass = "block text-xs font-bold text-slate-500  uppercase tracking-wide mb-1";

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold gradient-text">Tetapan Sistem</h1>
                    <p className="text-slate-500  mt-1">Uruskan data utama bagi tahun <span className="font-bold text-blue-600">{selectedYear}</span>.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Row 1: Meeting Settings & No. Sebutharga */}
                <div className="bg-white/95 border border-white/10 shadow-xl rounded-3xl p-8 border border-white/20 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full -mr-16 -mt-16 pointer-events-none opacity-50"></div>
                    <div className="flex items-center gap-4 mb-8 relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-orange-600 shadow-sm border border-orange-100">
                            <Calendar className="w-7 h-7" />
                        </div>
                        <div><h3 className="text-xl font-bold text-slate-900">Tetapan Mesyuarat</h3><div className="flex items-center gap-2 mt-1"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200">Tahun {selectedYear}</span></div></div>
                    </div>
                    <div className="relative z-10 mt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-jakarta pl-1">Bil. Mesyuarat (Contoh: 1/2025)</label>
                                <input
                                    type="text"
                                    value={meetingNumber}
                                    onChange={(e) => setMeetingNumber(e.target.value)}
                                    className="w-full h-14 px-4 py-3 rounded-lg bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors text-slate-900 font-bold"
                                    placeholder="Bil. Mesyuarat (e.g., 1/2025)"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-jakarta pl-1">Tarikh Sidang Jawatankuasa</label>
                                <DatePickerInput value={meetingDate} onChange={setMeetingDate} placeholder="DD/MM/YYYY" />
                            </div>
                        </div>
                        <button onClick={handleSaveSettings} disabled={isSavingSettings} className="h-14 px-8 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-lg transition-colors font-bold shadow-lg shadow-orange-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full text-base">
                            {isSavingSettings ? 'Menyimpan...' : 'Simpan Tetapan Mesyuarat'}
                        </button>
                        <p className="text-[11px] text-slate-400 mt-3 pl-1 italic flex items-center gap-1.5"><Info className="w-3.5 h-3.5" />Maklumat ini akan dipaparkan pada dokumen "Ulasan Pengarah".</p>
                    </div>
                </div>

                {/* No. Sebutharga Manager */}
                <div className="bg-white/95 border border-white/10 shadow-xl rounded-3xl p-8 border border-white/20 shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                            <Award className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Senarai No. Sebutharga ({selectedYear})</h3>
                            <p className="text-xs text-slate-500 mt-1">Uruskan nombor sebutharga sedia ada.</p>
                        </div>
                    </div>
                    <div className="flex gap-2 mb-6">
                        <input
                            type="text"
                            value={newSebutharga}
                            onChange={(e) => setNewSebutharga(e.target.value)}
                            className="flex-1 px-4 py-3 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Tambah No. Sebutharga Baru..."
                            onKeyDown={(e) => e.key === 'Enter' && handleAddSebutharga()}
                        />
                        <button onClick={handleAddSebutharga} className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="space-y-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                        {sebuthargaNumbers.length > 0 ? (
                            sebuthargaNumbers.map((sh, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group">
                                    <span className="font-mono font-bold text-slate-700 truncate pr-2 flex-1">{sh}</span>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-colors">
                                        <button onClick={() => initiateDelete('SEBUTHARGA', sh)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Padam">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-4 text-slate-400 italic text-sm">
                                Tiada rekod.
                            </div>
                        )}
                    </div>
                </div>

                {/* --- BQ TEMPLATE MANAGER --- */}
                <div className="xl:col-span-2 bg-white/95  border border-white/10 shadow-xl rounded-3xl p-8 border border-white/20  shadow-xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                <Grid2x2 className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900">Pengurusan Template BQ</h3>
                                <p className="text-sm text-slate-500">Uruskan template BQ untuk projek baru.</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={generateEmptyTemplate} className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors text-xs"><LayoutTemplate className="w-4 h-4" /> Jana Template Kosong</button>
                            <button onClick={generateInsuransTemplate} className="flex items-center gap-2 px-4 py-2.5 bg-blue-100 text-blue-700 rounded-xl font-bold hover:bg-blue-200 transition-colors text-xs"><FileText className="w-4 h-4" /> Jana Template Insurans</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {templates.map((tpl, idx) => {
                            const IconComp = ICON_MAP[tpl.icon as keyof typeof ICON_MAP] || FileText;

                            const colorVal = tpl.color || 'blue';
                            const colorClasses = getColorStyles(colorVal);

                            return (
                                <div key={tpl.id} className="group relative bg-white  rounded-[2rem] border-2 border-slate-100  p-6 transition-colors hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10 cursor-default">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group- ${colorClasses}`}>
                                            <IconComp className="w-7 h-7" />
                                        </div>
                                        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-colors bg-white/90  rounded-lg p-1 shadow-sm  z-10">
                                            <button onClick={(e) => { e.stopPropagation(); moveTemplate(idx, 'prev'); }} disabled={idx === 0} className="p-1.5 hover:bg-slate-100  rounded disabled:opacity-30 text-slate-500"><ArrowLeft className="w-3.5 h-3.5" /></button>
                                            <button onClick={(e) => { e.stopPropagation(); moveTemplate(idx, 'next'); }} disabled={idx === templates.length - 1} className="p-1.5 hover:bg-slate-100  rounded disabled:opacity-30 text-slate-500"><ArrowRight className="w-3.5 h-3.5" /></button>
                                            <div className="w-px h-4 bg-slate-200  mx-1"></div>
                                            <button onClick={() => openEditTemplateModal(tpl)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50  rounded-xl transition-colors"><Edit2 className="w-4 h-4" /></button>
                                            <button onClick={() => initiateDelete('TEMPLATE', tpl.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50  rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                    <h4 className="font-bold text-slate-800  text-lg">{tpl.title}</h4>
                                    <p className="text-xs text-slate-500  mt-1">{tpl.subtitle}</p>
                                    <div className="mt-4 flex items-center gap-2">
                                        <span className="px-2 py-0.5 bg-slate-100  text-slate-500 text-[10px] font-bold rounded uppercase tracking-wider">{(tpl.bills || []).length} BIL NO.</span>
                                        <span className="text-[10px] text-slate-400 font-mono">#{tpl.key}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Existing Pustaka BQ section */}
                <div className="xl:col-span-2 bg-white/95  border border-white/10 shadow-xl rounded-3xl p-8 border border-white/20  shadow-xl">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                                <Package className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900">Pengurusan Pustaka BQ</h3>
                                <p className="text-sm text-slate-500">Edit kategori, item, and harga preset BQ. Tahap 3 (Variants) akan diparentkan di bawah Item.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="group relative">
                                <HelpCircle className="w-5 h-5 text-slate-400 hover:text-indigo-500 cursor-help transition-colors" />
                                <div className="absolute right-0 bottom-full mb-2 w-72 p-4 bg-slate-800 text-white text-[10px] rounded-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-2xl z-50">
                                    <p className="font-bold mb-1 border-b border-white/20 pb-1">Panduan Hierarki:</p>
                                    <ul className="space-y-1 mt-1">
                                        <li><strong>L0 (Group):</strong> X3, KERJA PENGOREKAN (Huruf Besar)</li>
                                        <li><strong>L1 (Item):</strong> Jika ada Varian, Penerangan Item menjadi sub-header (cth: 1.1 ITEM BARU)</li>
                                        <li><strong>L2 (Variant):</strong> Item sebenar dengan kiraan (cth: i) dengan kaki)</li>
                                    </ul>
                                </div>
                            </div>
                            {isSavingLibrary && <div className="flex items-center gap-2 text-xs font-bold text-blue-600"><Save className="w-4 h-4" /> Menyimpan...</div>}
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">
                        {/* Left: Category & Group List */}
                        <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between px-2 mb-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kategori</label>
                                    <button onClick={() => setIsAddingCategory(!isAddingCategory)} className={`p-1 rounded transition-colors ${isAddingCategory ? 'text-red-500 hover:bg-red-50' : 'text-indigo-600 hover:bg-indigo-50'}`}>{isAddingCategory ? <X className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}</button>
                                </div>

                                {isAddingCategory && (
                                    <div className="px-2 mb-3 animate-slide-up">
                                        <div className="flex gap-1">
                                            <input
                                                type="text"
                                                value={newCategoryName}
                                                onChange={e => setNewCategoryName(e.target.value)}
                                                className="flex-1 text-xs px-3 py-2 rounded-lg bg-white  border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="Nama kategori..."
                                                autoFocus
                                            />
                                            <button onClick={handleAddCategory} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm"><Check className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-1.5 bg-slate-50  p-2 rounded-2xl border border-slate-100">
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => { setSelectedCategory(cat); setActiveGroupId(null); }}
                                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${selectedCategory === cat ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-white'}`}
                                        >

                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col gap-2">
                                <div className="flex items-center justify-between px-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kumpulan (L0 Header)</label>
                                    <button onClick={() => handleAddGroup(selectedCategory || 'Umum')} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"><PlusCircle className="w-4 h-4" /></button>
                                </div>
                                <div className="space-y-1 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">
                                    {currentCategoryGroups.map(group => (
                                        <div
                                            key={group.id}
                                            onClick={() => setActiveGroupId(group.id)}
                                            className={`group flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer ${activeGroupId === group.id ? 'bg-indigo-50 border-indigo-200 text-indigo-900' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}
                                        >

                                            <span className="text-xs font-bold truncate pr-4">{group.title}</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); initiateDelete('PRESET_GROUP', group.id); }}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50  rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right: Group Editor */}
                        <div className="flex-1 bg-white  rounded-[2.5rem] border border-slate-200  overflow-hidden flex flex-col shadow-inner">
                            {activeGroup ? (
                                <>
                                    <div className="p-6 bg-slate-50/80  border-b border-slate-200">
                                        <div className="flex flex-col gap-4">
                                            <div>
                                                <label className={labelClass}>Tajuk Kumpulan (Auto L0 - Section)</label>
                                                <input
                                                    value={activeGroup.title}
                                                    onChange={(e) => handleUpdateGroup(activeGroup.id, { title: e.target.value.toUpperCase() })}
                                                    className="text-lg font-black bg-transparent outline-none w-full border-b-2 border-indigo-500/20 focus:border-indigo-500 transition-colors"
                                                    placeholder="CONTOH: KERJA PENGOREKAN"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Items: {activeGroup.items.length}</span>
                                                <button onClick={() => handleAddItem(activeGroup.id)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-colors"><Plus className="w-4 h-4" /> Tambah Item</button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 p-6 overflow-y-auto space-y-10 custom-scrollbar">
                                        {activeGroup.items.map((item, idx) => (
                                            <div key={item.id} className="relative p-5 rounded-3xl border-2 border-slate-100  bg-slate-50/30  hover:border-indigo-100 transition-colors group/item">
                                                <div className="absolute -top-3 left-6 px-3 py-0.5 bg-indigo-600 text-white text-[9px] font-black rounded-full uppercase tracking-widest shadow-sm">Item {idx + 1}</div>
                                                <button onClick={() => handleDeleteItem(activeGroup.id, item.id)} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-colors"><Trash2 className="w-4 h-4" /></button>

                                                <div className="flex flex-col gap-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                                        <div className="md:col-span-8">
                                                            <label className={labelClass}>Penerangan Item (Auto L1 Header jika ada Varian)</label>
                                                            <textarea
                                                                value={item.description}
                                                                onChange={(e) => handleUpdateItem(activeGroup.id, item.id, { description: e.target.value })}
                                                                className="w-full bg-white  rounded-xl border border-slate-200  p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                                                rows={2}
                                                                placeholder="CONTOH: ITEM BARU"
                                                            />
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <label className={labelClass}>Unit</label>
                                                            <input value={item.unit} onChange={(e) => handleUpdateItem(activeGroup.id, item.id, { unit: e.target.value })} className={inputClass} />
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <label className={labelClass}>Kadar (RM)</label>
                                                            <input type="number" value={item.rate || ''} onChange={(e) => handleUpdateItem(activeGroup.id, item.id, { rate: parseFloat(e.target.value) })} className={inputClass} placeholder="0.00" />
                                                        </div>
                                                    </div>

                                                    {/* Variants Section - INDENTED */}
                                                    <div className="ml-4 md:ml-8 pl-4 border-l-4 border-indigo-500/20 space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex flex-col">
                                                                <h5 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-2"><Layers className="w-3.5 h-3.5" /> Varian & Pakej (L2 Sub-Items)</h5>
                                                                <p className="text-[9px] text-slate-400 italic">Gunakan varian untuk memaksakan"ITEM BARU" menjadi Level 1 Header.</p>
                                                            </div>
                                                            <button onClick={() => handleAddVariant(activeGroup.id, item.id)} className="text-[10px] font-bold text-white bg-indigo-500 hover:bg-indigo-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg shadow-sm transition-colors"><PlusCircle className="w-3 h-3" /> Tambah Varian</button>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {item.variants?.map((v, vIdx) => (
                                                                <div key={v.id} className="flex flex-col md:flex-row gap-3 bg-white  p-3 rounded-2xl border border-slate-200  shadow-sm relative group/var">
                                                                    <span className="absolute -left-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-300">{toRoman(vIdx + 1)})</span>
                                                                    <input
                                                                        value={v.label}
                                                                        onChange={(e) => handleUpdateVariant(activeGroup.id, item.id, v.id, { label: e.target.value })}
                                                                        className="flex-1 bg-transparent text-xs font-bold outline-none border-b border-dashed border-slate-100 hover:border-indigo-400 transition-colors"
                                                                        placeholder="cth: dengan kaki / dengan tangan..."
                                                                    />
                                                                    <div className="flex items-center gap-2 w-full md:w-auto">
                                                                        <div className="flex-1 md:w-24"><input type="number" value={v.rate} onChange={(e) => handleUpdateVariant(activeGroup.id, item.id, v.id, { rate: parseFloat(e.target.value) })} className="w-full bg-slate-50  border border-slate-100 rounded px-2 py-1 text-[10px] text-right font-mono font-bold text-blue-600" placeholder="Rate" /></div>
                                                                        <div className="flex-1 md:w-16"><input value={v.unit} onChange={(e) => handleUpdateVariant(activeGroup.id, item.id, v.id, { unit: e.target.value })} className="w-full bg-slate-50  border border-slate-100 rounded px-2 py-1 text-[10px] uppercase font-bold text-center" placeholder="Unit" /></div>
                                                                        <button onClick={() => handleDeleteVariant(activeGroup.id, item.id, v.id)} className="p-1.5 text-slate-300 hover:text-red-500 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {(!item.variants || item.variants.length === 0) && <div className="text-[10px] text-slate-400 italic text-center py-2 bg-white/50  rounded-xl border border-dashed border-slate-200">Tiada varian. Item akan diparentkan terus ke Kumpulan.</div>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 space-y-4">
                                    <List className="w-16 h-16 opacity-10" />
                                    <p className="text-sm font-medium">Pilih kumpulan dari sebelah kiri atau tambah kategori baru untuk mula mengedit item preset.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Companies Manager */}
                <div className="bg-white/95 border border-white/10 shadow-xl rounded-3xl p-8 border border-white/20 shadow-xl">
                    <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600"><Building2 className="w-6 h-6" /></div><div><h3 className="text-xl font-bold text-slate-900">Senarai Syarikat ({selectedYear})</h3><p className="text-xs text-slate-500 mt-1">Susun keutamaan paparan syarikat.</p></div></div>
                    <div className="flex gap-2 mb-6"><input type="text" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} className="flex-1 px-4 py-3 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Tambah Syarikat Baru..." /><button onClick={handleAddCompany} className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"><Plus className="w-5 h-5" /></button></div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {companyOrder.map((company, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <button
                                        onClick={() => jumpToRank(idx)}
                                        className="w-8 h-8 shrink-0 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:shadow-sm transition-all group/rank"
                                        title="Klik untuk ubah kedudukan"
                                    >
                                        <span className="group-hover/rank:hidden">{idx + 1}</span>
                                        <Hash className="w-3 h-3 hidden group-hover/rank:block" />
                                    </button>
                                    <span className="font-medium text-slate-700 truncate pr-2">{company}</span>
                                </div>
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-colors">
                                    <button onClick={() => moveCompany(idx, 'top')} disabled={idx === 0} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-30" title="Ke Atas Sekali"><ChevronsUp className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => moveCompany(idx, 'up')} disabled={idx === 0} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-30" title="Naik Satu"><ArrowUp className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => moveCompany(idx, 'down')} disabled={idx === companyOrder.length - 1} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-30" title="Turun Satu"><ArrowDown className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => moveCompany(idx, 'bottom')} disabled={idx === companyOrder.length - 1} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-30" title="Ke Bawah Sekali"><ChevronsDown className="w-3.5 h-3.5" /></button>
                                    <div className="w-px h-4 bg-slate-200 mx-1"></div>
                                    <button onClick={() => openCompanyModal(company)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Maklumat"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => initiateDelete('COMPANY', company)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Padam"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Vote Numbers Manager */}
                <div className="bg-white/95 border border-white/10 shadow-xl rounded-3xl p-8 border border-white/20 shadow-xl">
                    <div className="flex items-center justify-between mb-6"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600"><FileDigit className="w-6 h-6" /></div><h3 className="text-xl font-bold text-slate-900">Senarai No. Vot ({selectedYear})</h3></div><button onClick={() => openVoteModal()} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-bold"><Plus className="w-4 h-4" /> Tambah Vot</button></div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm"><thead className="text-xs font-bold text-slate-500 uppercase bg-slate-50 border-b border-slate-200"><tr><th className="px-4 py-3 text-left">No. Vot</th><th className="px-4 py-3 text-left">Nama Vot</th><th className="px-4 py-3 text-right">Peruntukan (RM)</th><th className="px-4 py-3 w-20"></th></tr></thead>
                            <tbody className="divide-y divide-slate-100">
                                {votes.map((vote) => (
                                    <tr key={vote.code} className="group hover:bg-slate-50"><td className="px-4 py-3 font-mono font-bold text-slate-700">{vote.code}</td><td className="px-4 py-3 text-slate-600">{vote.name || '-'}</td><td className="px-4 py-3 text-right font-mono text-blue-600">{new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(vote.allocation || 0)}</td><td className="px-4 py-3 text-right"><div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-colors"><button onClick={() => openVoteModal(vote)} className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button><button onClick={() => initiateDelete('VOTE', vote.code)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button></div></td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Edit Template Modal */}
            {isEditTemplateModalOpen && editingTemplate && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60  animate-fade-in" onClick={() => setIsEditTemplateModalOpen(false)}>
                    <div className="bg-white  rounded-3xl shadow-2xl max-w-2xl w-full p-8 border border-slate-200  transform scale-100 transition-colors animate-slide-up relative overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                        <div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-bold text-slate-900  flex items-center gap-2"><Edit3 className="w-7 h-7 text-blue-600" />Kemaskini Template</h3><button onClick={() => setIsEditTemplateModalOpen(false)} className="text-slate-400 hover:text-slate-600  p-1 rounded-full hover:bg-slate-100  transition-colors"><X className="w-6 h-6" /></button></div>

                        <div className="overflow-y-auto max-h-[70vh] pr-2 custom-scrollbar">
                            <form onSubmit={(e) => { e.preventDefault(); handleSaveTemplate(editingTemplate); }} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div><label className={labelClass}>Tajuk Template</label><input type="text" value={editingTemplate.title} onChange={e => setEditingTemplate({ ...editingTemplate, title: e.target.value.toUpperCase() })} className={inputClass} required /></div>
                                    <div><label className={labelClass}>Keterangan (Subtitle)</label><input type="text" value={editingTemplate.subtitle} onChange={e => setEditingTemplate({ ...editingTemplate, subtitle: e.target.value })} className={inputClass} /></div>
                                </div>

                                {/* Icon Selection */}
                                <div>
                                    <label className={labelClass}>Pilih Ikon</label>
                                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        {ICON_MAP_KEYS.map((iconKey) => {
                                            const Icon = ICON_MAP[iconKey];
                                            return (
                                                <button
                                                    key={iconKey}
                                                    type="button"
                                                    onClick={() => setEditingTemplate({ ...editingTemplate, icon: iconKey as any })}
                                                    className={`p-3 rounded-xl transition-all flex items-center justify-center ${editingTemplate.icon === iconKey ? 'bg-blue-600 text-white shadow-lg scale-110' : 'bg-white text-slate-400 hover:bg-blue-50 hover:text-blue-600'}`}
                                                >
                                                    <Icon className="w-5 h-5" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Color Selection */}
                                <div>
                                    <label className={labelClass}>Pilih Warna</label>
                                    <div className="grid grid-cols-6 sm:grid-cols-9 gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        {COLOR_LIST.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setEditingTemplate({ ...editingTemplate, color: color as any })}
                                                className={`w-full aspect-square rounded-full transition-all border-4 flex items-center justify-center ${editingTemplate.color === color ? 'border-white ring-2 ring-blue-500 scale-110 shadow-md' : 'border-transparent'}`}
                                                style={{ backgroundColor: `var(--${color}-500, ${color})` }}
                                                title={color}
                                            >
                                                {editingTemplate.color === color && <Check className="w-4 h-4 text-white" />}
                                                <div className={`w-full h-full rounded-full ${getColorStyles(color).split(' ')[0]}`}></div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3"><button type="button" onClick={() => setIsEditTemplateModalOpen(false)} className="flex-1 py-4 bg-slate-100  text-slate-600  font-bold rounded-2xl hover:bg-slate-200  transition-colors text-lg">Batal</button><button type="submit" className="flex-[2] py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 text-lg"><Save className="w-5 h-5" /> Simpan Perubahan</button></div>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfig.isOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50  animate-fade-in" onClick={() => setDeleteConfig({ ...deleteConfig, isOpen: false })}>
                    <div className="bg-white  rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200  transform scale-100 transition-colors animate-slide-up relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setDeleteConfig({ ...deleteConfig, isOpen: false })} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600  transition-colors p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button>
                        <div className="flex flex-col items-center text-center pt-2"><div className="w-20 h-20 bg-red-50  rounded-full flex items-center justify-center mb-6 text-red-500"><div className="w-14 h-14 bg-red-100  rounded-full flex items-center justify-center"><AlertTriangle className="w-8 h-8 stroke-[1.5]" /></div></div><h3 className="text-xl font-bold text-slate-900  mb-2 font-jakarta">Padam Item?</h3><p className="text-slate-500  mb-8 text-sm leading-relaxed px-4">Adakah anda pasti mahu memadam <br /><span className="font-bold text-slate-900  block mt-1 p-2 bg-slate-50  rounded-lg border border-slate-200  break-all">{deleteConfig.value}</span><span className="mt-2 block text-xs text-red-500 font-medium">Tindakan ini tidak boleh dikembalikan.</span></p><div className="flex gap-3 w-full"><button onClick={() => setDeleteConfig({ ...deleteConfig, isOpen: false })} className="flex-1 py-3.5 px-4 bg-white  text-slate-700  rounded-xl font-bold hover:bg-slate-50  transition-colors border border-slate-200  shadow-sm hover:shadow-md">Batal</button><button onClick={confirmDelete} className="flex-1 py-3.5 px-4 rounded-xl font-bold text-white transition-colors flex items-center justify-center gap-2 shadow-lg bg-red-600 hover:bg-red-700 shadow-red-600/30 hover:-translate-y-0.5"><Trash2 className="w-4 h-4" /><span>Pasti</span></button></div></div>
                    </div>
                </div>,
                document.body
            )}

            {/* Edit Company Details Modal */}
            {isCompanyModalOpen && companyToEdit && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60  animate-fade-in" onClick={() => setIsCompanyModalOpen(false)}>
                    <div className="bg-white  rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200  transform scale-100 transition-colors animate-slide-up relative" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-slate-900  flex items-center gap-2"><Building2 className="w-6 h-6 text-blue-600" />Maklumat Syarikat</h3><button onClick={() => setIsCompanyModalOpen(false)} className="text-slate-400 hover:text-slate-600  p-1 rounded-full hover:bg-slate-100  transition-colors"><X className="w-6 h-6" /></button></div>
                        <form onSubmit={handleSaveCompanyDetails} className="space-y-4">
                            <div><label className={labelClass}>Nama Syarikat</label><input type="text" value={companyToEdit.name} onChange={e => setCompanyToEdit({ ...companyToEdit, name: e.target.value })} className={inputClass} required /></div>
                            <div><label className={labelClass}>Nombor Pendaftaran (MOF/CIDB)</label><input type="text" value={companyToEdit.registrationNumber || ''} onChange={e => setCompanyToEdit({ ...companyToEdit, registrationNumber: e.target.value })} className={inputClass} placeholder="cth: 1961008-SL008245" /></div>
                            <div><label className={labelClass}>Alamat Lengkap</label><textarea value={companyToEdit.address} onChange={e => setCompanyToEdit({ ...companyToEdit, address: e.target.value })} className={`${inputClass} min-h-[80px] resize-none`} placeholder="No. Jalan, Taman, Poskod..." /></div>
                            <div className="grid grid-cols-2 gap-4"><div><label className={labelClass}>Nama Pemilik</label><input type="text" value={companyToEdit.ownerName} onChange={e => setCompanyToEdit({ ...companyToEdit, ownerName: e.target.value })} className={inputClass} /></div><div><label className={labelClass}>Gred CIDB</label><input type="text" value={companyToEdit.gred} onChange={e => setCompanyToEdit({ ...companyToEdit, gred: e.target.value })} className={inputClass} placeholder="cth: G1" /></div></div>
                            <div><label className={labelClass}>Had Kerja</label><input type="number" value={companyToEdit.limit || ''} onChange={e => setCompanyToEdit({ ...companyToEdit, limit: parseFloat(e.target.value) })} className={inputClass} placeholder="0.00" /></div>
                            <div className="grid grid-cols-2 gap-4"><div><label className={labelClass}>No. Telefon</label><input type="text" value={companyToEdit.phone} onChange={e => setCompanyToEdit({ ...companyToEdit, phone: e.target.value })} className={inputClass} /></div><div><label className={labelClass}>No. Tel Alternatif</label><input type="text" value={companyToEdit.phoneAlt || ''} onChange={e => setCompanyToEdit({ ...companyToEdit, phoneAlt: e.target.value })} className={inputClass} /></div></div>
                            <div><label className={labelClass}>Emel</label><input type="email" value={companyToEdit.email} onChange={e => setCompanyToEdit({ ...companyToEdit, email: e.target.value })} className={inputClass} /></div>
                            <div className="pt-4 flex gap-3"><button type="button" onClick={() => setIsCompanyModalOpen(false)} className="flex-1 py-3 bg-slate-100  text-slate-600  font-bold rounded-xl hover:bg-slate-200  transition-colors">Batal</button><button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Simpan</button></div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Edit Vote Modal */}
            {isVoteModalOpen && editingVote && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60  animate-fade-in" onClick={() => setIsVoteModalOpen(false)}>
                    <div className="bg-white  rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200  transform scale-100 transition-colors animate-slide-up relative" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-slate-900  flex items-center gap-2"><FileDigit className="w-6 h-6 text-indigo-600" />{editingVote.code ? 'Kemaskini Vot' : 'Tambah Vot Baru'}</h3><button onClick={() => setIsVoteModalOpen(false)} className="text-slate-400 hover:text-slate-600  p-1 rounded-full hover:bg-slate-100  transition-colors"><X className="w-6 h-6" /></button></div>
                        <form onSubmit={handleSaveVote} className="space-y-4">
                            <div><label className={labelClass}>No. Vot</label><input type="text" value={editingVote.code} onChange={e => setEditingVote({ ...editingVote, code: e.target.value })} className={inputClass} required placeholder="e.g. P.04.123" /></div>
                            <div><label className={labelClass}>Nama Vot</label><input type="text" value={editingVote.name} onChange={e => setEditingVote({ ...editingVote, name: e.target.value })} className={inputClass} required placeholder="e.g. Penyelenggaraan Jalan" /></div>
                            <div><label className={labelClass}>Peruntukan (RM)</label><input type="number" value={editingVote.allocation || ''} onChange={e => setEditingVote({ ...editingVote, allocation: parseFloat(e.target.value) })} className={inputClass} placeholder="0.00" /></div>
                            <div className="pt-4 flex gap-3"><button type="button" onClick={() => setIsVoteModalOpen(false)} className="flex-1 py-3 bg-slate-100  text-slate-600  font-bold rounded-xl hover:bg-slate-200  transition-colors">Batal</button><button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Simpan</button></div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default AdminSettings;