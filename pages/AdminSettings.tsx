import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { mockService } from '../services/mockService';
import { Trash2, Plus, Building2, FileDigit, ShieldAlert, Calendar, Info, Edit2, X, Save, FileText, AlertTriangle, ArrowUp, ArrowDown, Package, Layers, PlusCircle, MinusCircle, ChevronRight, ChevronDown, List, HelpCircle, LayoutTemplate, FileInput, Edit3, Grid2x2, Check, GripVertical } from 'lucide-react';
import { User, Role, CompanyDetail, VoteDefinition, PresetGroup, PresetItem, PresetVariant, BQTemplateDefinition, BQTemplateBillDefinition, BQTemplateItemRef } from '../types';

interface AdminSettingsProps {
  user: User;
  selectedYear: number;
}

// Icon Map for Template Cards
const ICON_MAP = {
    file: FileInput,
    edit: Edit3,
    layout: LayoutTemplate,
    plus: Plus
};

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
        return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`;
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
        return `${parseInt(d)} ${months[mInt-1]} ${y}`;
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

    const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const iso = e.target.value;
        if (iso) {
            onChange(isoToMalay(iso));
        }
    };

    return (
        <div className="relative flex items-center w-full px-4 py-3 rounded-lg bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700/50 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-slate-200 shadow-sm dark:shadow-inner h-14">
            <input 
                type="text" 
                value={text}
                onChange={handleTextChange}
                placeholder={placeholder || "DD/MM/YYYY"}
                className="w-full h-full bg-transparent border-none outline-none p-0 text-inherit placeholder-slate-400 font-bold"
            />
            <div className="relative ml-2 w-5 h-5 shrink-0 group">
                <Calendar className="w-5 h-5 pointer-events-none text-slate-400 group-hover:text-emerald-500 transition-colors" />
                <input 
                    type="date" 
                    value={malayToIso(value)}
                    onChange={handlePickerChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    tabIndex={-1}
                />
            </div>
        </div>
    );
};

const AdminSettings: React.FC<AdminSettingsProps> = ({ user, selectedYear }) => {
  const [companies, setCompanies] = useState<string[]>([]);
  const [companyOrder, setCompanyOrder] = useState<string[]>([]);
  const [votes, setVotes] = useState<VoteDefinition[]>([]);
  const [sebuthargaNumbers, setSebuthargaNumbers] = useState<string[]>([]);
  const [newCompany, setNewCompany] = useState('');
  const [editingVote, setEditingVote] = useState<VoteDefinition | null>(null);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [newSebutharga, setNewSebutharga] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<CompanyDetail | null>(null);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [deleteConfig, setDeleteConfig] = useState<{ isOpen: boolean; type: 'COMPANY' | 'VOTE' | 'SEBUTHARGA' | 'PRESET_GROUP' | 'TEMPLATE' | null; value: string; }>( { isOpen: false, type: null, value: '' } );

  // --- BQ LIBRARY MANAGEMENT STATES ---
  const [libraryGroups, setLibraryGroups] = useState<PresetGroup[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [isSavingLibrary, setIsSavingLibrary] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // --- BQ TEMPLATE MANAGEMENT STATES ---
  const [templates, setTemplates] = useState<BQTemplateDefinition[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<BQTemplateDefinition | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [activeTemplateBillId, setActiveTemplateBillId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const loadData = () => {
    const loadedCompanies = mockService.getCompanies(selectedYear);
    const loadedOrder = mockService.getCompanyOrder(selectedYear);
    setCompanies(loadedCompanies);
    const combinedOrder = Array.from(new Set([...loadedOrder, ...loadedCompanies])).filter(c => loadedCompanies.includes(c));
    setCompanyOrder(combinedOrder);
    setVotes(mockService.getVotes(selectedYear));
    setSebuthargaNumbers(mockService.getSebuthargaNumbers(selectedYear));
    const settings = mockService.getSettings(selectedYear);
    setMeetingDate(settings.meetingDate || '');

    const library = mockService.getLibraryGroups();
    setLibraryGroups(library);
    const categories = Array.from(new Set(library.map(g => g.category)));
    if (categories.length > 0 && !selectedCategory) setSelectedCategory(categories[0]);

    setTemplates(mockService.getTemplates());
  };

  const handleAddCompany = () => {
    if (newCompany.trim()) {
      mockService.addCompany(selectedYear, newCompany.trim());
      setNewCompany('');
      loadData();
    }
  };

  const moveCompany = async (index: number, direction: 'up' | 'down') => {
      if (direction === 'up' && index === 0) return;
      if (direction === 'down' && index === companyOrder.length - 1) return;
      const newOrder = [...companyOrder];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      const temp = newOrder[index];
      newOrder[index] = newOrder[targetIndex];
      newOrder[targetIndex] = temp;
      setCompanyOrder(newOrder);
      await mockService.saveCompanyOrder(selectedYear, newOrder);
  };

  const initiateDelete = (type: 'COMPANY' | 'VOTE' | 'SEBUTHARGA' | 'PRESET_GROUP' | 'TEMPLATE', value: string) => {
      setDeleteConfig({ isOpen: true, type, value });
  };

  const confirmDelete = async () => {
      const { type, value } = deleteConfig;
      if (type === 'COMPANY') {
          await mockService.deleteCompany(selectedYear, value);
      } else if (type === 'VOTE') {
          await mockService.deleteVoteNumber(selectedYear, value);
      } else if (type === 'SEBUTHARGA') {
          await mockService.deleteSebuthargaNumber(selectedYear, value);
      } else if (type === 'PRESET_GROUP') {
          const newGroups = libraryGroups.filter(g => g.id !== value);
          setLibraryGroups(newGroups);
          await mockService.saveLibraryGroups(newGroups);
      } else if (type === 'TEMPLATE') {
          const newTemplates = templates.filter(t => t.id !== value);
          setTemplates(newTemplates);
          await mockService.saveTemplates(newTemplates);
      }
      setDeleteConfig({ isOpen: false, type: null, value: '' });
      loadData();
  };

  const openCompanyModal = (name: string) => {
      const details = mockService.getCompanyDetails(selectedYear, name);
      setCompanyToEdit(details || { name: name, address: '', ownerName: '', phone: '', email: '', gred: 'G1', phoneAlt: '', registrationNumber: '' });
      setIsCompanyModalOpen(true);
  };

  const handleSaveCompanyDetails = async (e: React.FormEvent) => {
      e.preventDefault();
      if (companyToEdit) {
          await mockService.saveCompanyDetails(selectedYear, companyToEdit);
          setIsCompanyModalOpen(false);
          setCompanyToEdit(null);
          loadData();
      }
  };

  const openVoteModal = (vote?: VoteDefinition) => {
      setEditingVote(vote ? { ...vote } : { code: '', name: '', allocation: 0 });
      setIsVoteModalOpen(true);
  };

  const handleSaveVote = async (e: React.FormEvent) => {
      e.preventDefault();
      if (editingVote) {
          await mockService.saveVote(selectedYear, editingVote);
          setIsVoteModalOpen(false);
          setEditingVote(null);
          loadData();
      }
  };

  const handleAddSebutharga = () => {
    if (newSebutharga.trim()) {
      mockService.addSebuthargaNumber(selectedYear, newSebutharga.trim());
      setNewSebutharga('');
      loadData();
    }
  };

  const handleSaveSettings = async () => {
      setIsSavingSettings(true);
      await mockService.updateSettings(selectedYear, { meetingDate });
      setTimeout(() => setIsSavingSettings(false), 500);
  };

  const saveLibraryState = async (newGroups: PresetGroup[]) => {
      setIsSavingLibrary(true);
      setLibraryGroups(newGroups);
      await mockService.saveLibraryGroups(newGroups);
      setTimeout(() => setIsSavingLibrary(false), 300);
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
          return { ...g, items: g.items.map(item => {
                  if (item.id !== itemId) return item;
                  return { ...item, variants: (item.variants || []).filter(v => v.id !== varId) };
              })
          };
      });
      saveLibraryState(newGroups);
  };

  // --- TEMPLATE LOGIC ---
  const openTemplateModal = (template?: BQTemplateDefinition) => {
      setEditingTemplate(template || {
          id: `t-${Date.now()}`,
          key: 'CUSTOM',
          title: 'TEMPLATE BARU',
          subtitle: 'Keterangan Template',
          icon: 'file',
          color: 'blue',
          bills: [],
          groupRefs: []
      });
      if (template?.bills && template.bills.length > 0) {
          setActiveTemplateBillId(template.bills[0].id);
      } else {
          setActiveTemplateBillId(null);
      }
      setIsTemplateModalOpen(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (editingTemplate) {
          const index = templates.findIndex(t => t.id === editingTemplate.id);
          let newTemplates = [...templates];
          if (index >= 0) newTemplates[index] = editingTemplate;
          else newTemplates.push(editingTemplate);
          
          setTemplates(newTemplates);
          await mockService.saveTemplates(newTemplates);
          setIsTemplateModalOpen(false);
          setEditingTemplate(null);
      }
  };

  const handleAddBillToTemplate = () => {
      if (!editingTemplate) return;
      const newBill: BQTemplateBillDefinition = {
          id: `bill-${Date.now()}`,
          title: 'BUTIRAN BARU',
          items: []
      };
      setEditingTemplate({
          ...editingTemplate,
          bills: [...(editingTemplate.bills || []), newBill]
      });
      setActiveTemplateBillId(newBill.id);
  };

  const handleUpdateBillTitle = (billId: string, title: string) => {
      if (!editingTemplate) return;
      setEditingTemplate({
          ...editingTemplate,
          bills: editingTemplate.bills.map(b => b.id === billId ? { ...b, title } : b)
      });
  };

  const handleDeleteBillFromTemplate = (billId: string) => {
      if (!editingTemplate) return;
      const newBills = editingTemplate.bills.filter(b => b.id !== billId);
      setEditingTemplate({ ...editingTemplate, bills: newBills });
      if (activeTemplateBillId === billId) {
          setActiveTemplateBillId(newBills.length > 0 ? newBills[0].id : null);
      }
  };

  const handleAddItemToTemplateBill = (billId: string, groupId: string, itemId: string, variantId?: string) => {
      if (!editingTemplate) return;
      const newRef: BQTemplateItemRef = { groupId, itemId, variantId };
      setEditingTemplate({
          ...editingTemplate,
          bills: editingTemplate.bills.map(b => {
              if (b.id !== billId) return b;
              return { ...b, items: [...b.items, newRef] };
          })
      });
  };

  const handleDeleteItemFromTemplateBill = (billId: string, itemIdx: number) => {
      if (!editingTemplate) return;
      setEditingTemplate({
          ...editingTemplate,
          bills: editingTemplate.bills.map(b => {
              if (b.id !== billId) return b;
              const newItems = [...b.items];
              newItems.splice(itemIdx, 1);
              return { ...b, items: newItems };
          })
      });
  };

  const getLibraryItemName = (ref: BQTemplateItemRef) => {
      const group = libraryGroups.find(g => g.id === ref.groupId);
      if (!group) return 'Unknown Group';
      const item = group.items.find(i => i.id === ref.itemId);
      if (!item) return 'Unknown Item';
      
      let name = item.description;
      if (ref.variantId) {
          const v = item.variants?.find(v => v.id === ref.variantId);
          if (v) name += ` (${v.label})`;
      }
      return name;
  };

  if (user.role !== Role.ADMIN) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500">
        <ShieldAlert className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Akses Ditolak</h2>
        <p>Hanya Admin boleh mengakses tetapan ini.</p>
      </div>
    );
  }

  const categories = Array.from(new Set(libraryGroups.map(g => g.category)));
  const currentCategoryGroups = libraryGroups.filter(g => g.category === selectedCategory);
  const activeGroup = libraryGroups.find(g => g.id === activeGroupId);
  const activeTemplateBill = editingTemplate?.bills.find(b => b.id === activeTemplateBillId);

  const inputClass = "w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-blue-500 text-sm";
  const labelClass = "block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1";

  return (
    <div className="space-y-8 animate-fade-in-up pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Tetapan Sistem</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Uruskan data utama bagi tahun <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedYear}</span>.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Meeting Settings */}
        <div className="glass-effect rounded-3xl p-8 border border-white/20 dark:border-white/5 shadow-xl xl:col-span-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 dark:bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none opacity-50"></div>
            <div className="flex items-center gap-4 mb-8 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-sm border border-orange-100 dark:border-orange-800/30">
                    <Calendar className="w-7 h-7" />
                </div>
                <div><h3 className="text-xl font-bold text-slate-900 dark:text-white">Tetapan Mesyuarat</h3><div className="flex items-center gap-2 mt-1"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800/50">Tahun {selectedYear}</span></div></div>
            </div>
            <div className="relative z-10 mt-2">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 font-jakarta pl-1">Tarikh Sidang Jawatankuasa Sebutharga</label>
                <div className="flex flex-col md:flex-row gap-4 items-stretch"><div className="flex-1"><DatePickerInput value={meetingDate} onChange={setMeetingDate} placeholder="DD/MM/YYYY" /></div><button onClick={handleSaveSettings} disabled={isSavingSettings} className="h-14 px-8 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-lg transition-all font-bold shadow-lg shadow-orange-500/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0 md:w-auto w-full text-base">{isSavingSettings ? 'Menyimpan...' : 'Simpan Tetapan'}</button></div>
                <p className="text-[11px] text-slate-400 mt-3 pl-1 italic flex items-center gap-1.5"><Info className="w-3.5 h-3.5" />Tarikh ini akan dipaparkan dalam dokumen "Ulasan Pengarah".</p>
            </div>
        </div>

        {/* --- BQ TEMPLATE MANAGER --- */}
        <div className="xl:col-span-2 glass-effect rounded-3xl p-8 border border-white/20 dark:border-white/5 shadow-xl">
             <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-4">
                     <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                         <Grid2x2 className="w-7 h-7" />
                     </div>
                     <div>
                         <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Pengurusan Template BQ</h3>
                         <p className="text-sm text-slate-500 dark:text-slate-400">Konfigurasikan BIL NO. and item automatik bagi setiap fasa projek.</p>
                     </div>
                 </div>
                 <button onClick={() => openTemplateModal()} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg hover:bg-emerald-700 transition-all active:scale-95"><Plus className="w-5 h-5" /> Template Baru</button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {templates.map(tpl => {
                    const IconComp = ICON_MAP[tpl.icon as keyof typeof ICON_MAP] || FileText;
                    const colorStyles = {
                        blue: "bg-blue-100 text-blue-600 border-blue-200",
                        indigo: "bg-indigo-100 text-indigo-600 border-indigo-200",
                        emerald: "bg-emerald-100 text-emerald-600 border-emerald-200",
                        slate: "bg-slate-100 text-slate-600 border-slate-200",
                    };
                    const colorVal = tpl.color || 'blue';

                    return (
                        <div key={tpl.id} className="group relative bg-white dark:bg-slate-800 rounded-[2rem] border-2 border-slate-100 dark:border-slate-700/50 p-6 transition-all hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-500/10 cursor-default">
                             <div className="flex justify-between items-start mb-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${colorStyles[colorVal as keyof typeof colorStyles]}`}>
                                    <IconComp className="w-7 h-7" />
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button onClick={() => openTemplateModal(tpl)} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => initiateDelete('TEMPLATE', tpl.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                                </div>
                             </div>
                             <h4 className="font-bold text-slate-800 dark:text-white text-lg">{tpl.title}</h4>
                             <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{tpl.subtitle}</p>
                             <div className="mt-4 flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 text-[10px] font-bold rounded uppercase tracking-wider">{(tpl.bills || []).length} BIL NO.</span>
                                <span className="text-[10px] text-slate-400 font-mono">#{tpl.key}</span>
                             </div>
                        </div>
                    );
                })}
             </div>
        </div>

        {/* Existing Pustaka BQ section */}
        <div className="xl:col-span-2 glass-effect rounded-3xl p-8 border border-white/20 dark:border-white/5 shadow-xl">
             <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-4">
                     <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                         <Package className="w-7 h-7" />
                     </div>
                     <div>
                         <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Pengurusan Pustaka BQ</h3>
                         <p className="text-sm text-slate-500 dark:text-slate-400">Edit kategori, item, and harga preset BQ. Tahap 3 (Variants) akan diparentkan di bawah Item.</p>
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
                    {isSavingLibrary && <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 animate-pulse"><Save className="w-4 h-4" /> Menyimpan...</div>}
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
                             <div className="px-2 mb-3 animate-slide-down">
                                 <div className="flex gap-1">
                                     <input 
                                        type="text" 
                                        value={newCategoryName} 
                                        onChange={e => setNewCategoryName(e.target.value)} 
                                        className="flex-1 text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-500" 
                                        placeholder="Nama kategori..." 
                                        autoFocus
                                     />
                                     <button onClick={handleAddCategory} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm"><Check className="w-4 h-4" /></button>
                                 </div>
                             </div>
                         )}

                         <div className="flex flex-wrap gap-1.5 bg-slate-50 dark:bg-black/20 p-2 rounded-2xl border border-slate-100 dark:border-white/5">
                             {categories.map(cat => (
                                 <button 
                                     key={cat} 
                                     onClick={() => { setSelectedCategory(cat); setActiveGroupId(null); }}
                                     className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${selectedCategory === cat ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-white dark:hover:bg-slate-800'}`}
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
                                    className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${activeGroupId === group.id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 hover:border-indigo-300'}`}
                                 >
                                     <span className="text-xs font-bold truncate pr-4">{group.title}</span>
                                     <button 
                                        onClick={(e) => { e.stopPropagation(); initiateDelete('PRESET_GROUP', group.id); }}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                     >
                                         <Trash2 className="w-3.5 h-3.5" />
                                     </button>
                                 </div>
                             ))}
                         </div>
                     </div>
                 </div>

                 {/* Right: Group Editor */}
                 <div className="flex-1 bg-white dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col shadow-inner">
                     {activeGroup ? (
                         <>
                             <div className="p-6 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 backdrop-blur-sm">
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
                                         <button onClick={() => handleAddItem(activeGroup.id)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all"><Plus className="w-4 h-4" /> Tambah Item</button>
                                     </div>
                                 </div>
                             </div>
                             
                             <div className="flex-1 p-6 overflow-y-auto space-y-10 custom-scrollbar">
                                 {activeGroup.items.map((item, idx) => (
                                     <div key={item.id} className="relative p-5 rounded-3xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-black/5 hover:border-indigo-100 transition-all group/item">
                                         <div className="absolute -top-3 left-6 px-3 py-0.5 bg-indigo-600 text-white text-[9px] font-black rounded-full uppercase tracking-widest shadow-sm">Item {idx + 1}</div>
                                         <button onClick={() => handleDeleteItem(activeGroup.id, item.id)} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                                         
                                         <div className="flex flex-col gap-4">
                                             <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                                 <div className="md:col-span-8">
                                                     <label className={labelClass}>Penerangan Item (Auto L1 Header jika ada Varian)</label>
                                                     <textarea 
                                                        value={item.description}
                                                        onChange={(e) => handleUpdateItem(activeGroup.id, item.id, { description: e.target.value })}
                                                        className="w-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
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
                                                         <p className="text-[9px] text-slate-400 italic">Gunakan varian untuk memaksakan "ITEM BARU" menjadi Level 1 Header.</p>
                                                     </div>
                                                     <button onClick={() => handleAddVariant(activeGroup.id, item.id)} className="text-[10px] font-bold text-white bg-indigo-500 hover:bg-indigo-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg shadow-sm transition-colors"><PlusCircle className="w-3 h-3" /> Tambah Varian</button>
                                                 </div>
                                                 <div className="space-y-2">
                                                     {item.variants?.map((v, vIdx) => (
                                                         <div key={v.id} className="flex flex-col md:flex-row gap-3 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative group/var">
                                                             <span className="absolute -left-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-300">{toRoman(vIdx+1)})</span>
                                                             <input 
                                                                value={v.label} 
                                                                onChange={(e) => handleUpdateVariant(activeGroup.id, item.id, v.id, { label: e.target.value })}
                                                                className="flex-1 bg-transparent text-xs font-bold outline-none border-b border-dashed border-slate-100 hover:border-indigo-400 transition-colors"
                                                                placeholder="cth: dengan kaki / dengan tangan..."
                                                             />
                                                             <div className="flex items-center gap-2 w-full md:w-auto">
                                                                 <div className="flex-1 md:w-24"><input type="number" value={v.rate} onChange={(e) => handleUpdateVariant(activeGroup.id, item.id, v.id, { rate: parseFloat(e.target.value) })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 rounded px-2 py-1 text-[10px] text-right font-mono font-bold text-emerald-600" placeholder="Rate" /></div>
                                                                 <div className="flex-1 md:w-16"><input value={v.unit} onChange={(e) => handleUpdateVariant(activeGroup.id, item.id, v.id, { unit: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 rounded px-2 py-1 text-[10px] uppercase font-bold text-center" placeholder="Unit" /></div>
                                                                 <button onClick={() => handleDeleteVariant(activeGroup.id, item.id, v.id)} className="p-1.5 text-slate-300 hover:text-red-500 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                                             </div>
                                                         </div>
                                                     ))}
                                                     {(!item.variants || item.variants.length === 0) && <div className="text-[10px] text-slate-400 italic text-center py-2 bg-white/50 dark:bg-black/10 rounded-xl border border-dashed border-slate-200">Tiada varian. Item akan diparentkan terus ke Kumpulan.</div>}
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
        <div className="glass-effect rounded-3xl p-8 border border-white/20 dark:border-white/5 shadow-xl">
          <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600"><Building2 className="w-6 h-6" /></div><div><h3 className="text-xl font-bold text-slate-900 dark:text-white">Senarai Syarikat ({selectedYear})</h3><p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Susun keutamaan paparan untuk senarai projek.</p></div></div>
          <div className="flex gap-2 mb-6"><input type="text" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Tambah Syarikat Baru..." /><button onClick={handleAddCompany} className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"><Plus className="w-5 h-5" /></button></div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {companyOrder.map((company, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group"><span className="font-medium text-slate-700 dark:text-slate-300 truncate pr-2 flex-1">{company}</span><div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all"><button onClick={() => moveCompany(idx, 'up')} disabled={idx === 0} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button><button onClick={() => moveCompany(idx, 'down')} disabled={idx === companyOrder.length - 1} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button><div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div><button onClick={() => openCompanyModal(company)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Edit Maklumat"><Edit2 className="w-4 h-4" /></button><button onClick={() => initiateDelete('COMPANY', company)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Padam"><Trash2 className="w-4 h-4" /></button></div></div>
            ))}
          </div>
        </div>

        {/* Vote Numbers Manager */}
        <div className="glass-effect rounded-3xl p-8 border border-white/20 dark:border-white/5 shadow-xl">
          <div className="flex items-center justify-between mb-6"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600"><FileDigit className="w-6 h-6" /></div><h3 className="text-xl font-bold text-slate-900 dark:text-white">Senarai No. Vot ({selectedYear})</h3></div><button onClick={() => openVoteModal()} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-bold"><Plus className="w-4 h-4" /> Tambah Vot</button></div>
          <div className="overflow-x-auto">
              <table className="w-full text-sm"><thead className="text-xs font-bold text-slate-500 uppercase bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700"><tr><th className="px-4 py-3 text-left">No. Vot</th><th className="px-4 py-3 text-left">Nama Vot</th><th className="px-4 py-3 text-right">Peruntukan (RM)</th><th className="px-4 py-3 w-20"></th></tr></thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {votes.map((vote) => (
                          <tr key={vote.code} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50"><td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">{vote.code}</td><td className="px-4 py-3 text-slate-600 dark:text-slate-400">{vote.name || '-'}</td><td className="px-4 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400">{new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(vote.allocation || 0)}</td><td className="px-4 py-3 text-right"><div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all"><button onClick={() => openVoteModal(vote)} className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button><button onClick={() => initiateDelete('VOTE', vote.code)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button></div></td></tr>
                      ))}
                  </tbody>
              </table>
          </div>
        </div>
      </div>

      {/* Edit Template Modal (UPGRADED) */}
      {isTemplateModalOpen && editingTemplate && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsTemplateModalOpen(false)}>
              <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl max-w-6xl w-full h-[90vh] p-8 border border-slate-200 dark:border-slate-700 transform scale-100 transition-all animate-slide-up relative overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-8 shrink-0">
                      <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-${editingTemplate.color}-100 text-${editingTemplate.color}-600`}>
                              {editingTemplate.icon === 'file' && <FileInput className="w-7 h-7" />}
                              {editingTemplate.icon === 'edit' && <Edit3 className="w-7 h-7" />}
                              {editingTemplate.icon === 'layout' && <LayoutTemplate className="w-7 h-7" />}
                              {editingTemplate.icon === 'plus' && <Plus className="w-7 h-7" />}
                          </div>
                          <div>
                              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Editor Konfigurasi Template</h3>
                              <p className="text-sm text-slate-500">Tentukan BIL NO. and pilih item/varian khusus dari pustaka.</p>
                          </div>
                      </div>
                      <button onClick={() => setIsTemplateModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"><X className="w-7 h-7" /></button>
                  </div>
                  
                  <div className="flex-1 flex flex-col lg:flex-row gap-8 overflow-hidden">
                      {/* Left: General Info & Bills Navigation */}
                      <div className="w-full lg:w-72 flex flex-col gap-6 shrink-0 overflow-y-auto custom-scrollbar pr-2">
                           <div className="space-y-4">
                               <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Maklumat Visual</h5>
                               <div><label className={labelClass}>Tajuk</label><input value={editingTemplate.title} onChange={e => setEditingTemplate({...editingTemplate, title: e.target.value})} className={inputClass} /></div>
                               <div><label className={labelClass}>Key (Logic)</label><select value={editingTemplate.key} onChange={e => setEditingTemplate({...editingTemplate, key: e.target.value as any})} className={inputClass}><option value="PERMULAAN_BASIC">PERMULAAN_BASIC</option><option value="PERMULAAN_EMPTY">PERMULAAN_EMPTY</option><option value="LONGKANG">LONGKANG</option><option value="EMPTY">EMPTY</option><option value="CUSTOM">CUSTOM</option></select></div>
                           </div>

                           <div className="flex-1 flex flex-col gap-2">
                               <div className="flex items-center justify-between px-1">
                                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Struktur BIL NO.</label>
                                   <button onClick={handleAddBillToTemplate} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"><PlusCircle className="w-4 h-4" /></button>
                               </div>
                               <div className="space-y-1">
                                   {(editingTemplate.bills || []).map((bill, bIdx) => (
                                       <div 
                                          key={bill.id} 
                                          onClick={() => setActiveTemplateBillId(bill.id)}
                                          className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${activeTemplateBillId === bill.id ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 text-emerald-900 dark:text-emerald-100' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 hover:border-emerald-300'}`}
                                       >
                                           <div className="min-w-0">
                                               <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">BIL {bIdx + 1}</p>
                                               <p className="text-xs font-bold truncate">{bill.title}</p>
                                           </div>
                                           <button 
                                              onClick={(e) => { e.stopPropagation(); handleDeleteBillFromTemplate(bill.id); }}
                                              className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                           >
                                               <Trash2 className="w-3.5 h-3.5" />
                                           </button>
                                       </div>
                                   ))}
                               </div>
                           </div>
                      </div>

                      {/* Right: Bill Editor */}
                      <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col shadow-inner">
                          {activeTemplateBill ? (
                              <>
                                  <div className="p-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                      <label className={labelClass}>Tajuk Butiran BIL</label>
                                      <input 
                                          value={activeTemplateBill.title} 
                                          onChange={e => handleUpdateBillTitle(activeTemplateBill.id, e.target.value.toUpperCase())}
                                          className="text-xl font-black bg-transparent outline-none w-full border-b border-emerald-500/20 focus:border-emerald-500 transition-colors"
                                          placeholder="BUTIRAN KERJA-KERJA..."
                                      />
                                  </div>
                                  
                                  <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                                      <div className="flex items-center justify-between mb-4">
                                          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Senarai Item Pustaka (Urutan Paparan)</h5>
                                          <div className="flex items-center gap-2">
                                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded">{activeTemplateBill.items.length} Item</span>
                                          </div>
                                      </div>

                                      <div className="space-y-2 mb-8">
                                          {activeTemplateBill.items.map((ref, iIdx) => (
                                              <div key={iIdx} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm group">
                                                  <GripVertical className="w-4 h-4 text-slate-300" />
                                                  <div className="flex-1 min-w-0">
                                                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{getLibraryItemName(ref)}</p>
                                                      <p className="text-[9px] text-slate-400 font-mono">GID: {ref.groupId} | IID: {ref.itemId}</p>
                                                  </div>
                                                  <button onClick={() => handleDeleteItemFromTemplateBill(activeTemplateBill.id, iIdx)} className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg"><X className="w-4 h-4" /></button>
                                              </div>
                                          ))}
                                          {activeTemplateBill.items.length === 0 && (
                                              <div className="py-12 flex flex-col items-center justify-center text-slate-400 bg-white/50 dark:bg-black/10 rounded-2xl border border-dashed border-slate-200">
                                                  <Layers className="w-10 h-10 mb-2 opacity-20" />
                                                  <p className="text-sm">Tiada item ditambah. Pilih dari senarai di bawah.</p>
                                              </div>
                                          )}
                                      </div>

                                      {/* Quick Item Picker */}
                                      <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                                          <h6 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Pilih Item dari Pustaka</h6>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              {libraryGroups.map(group => (
                                                  <div key={group.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                                      <div className="bg-slate-50 dark:bg-slate-700 px-3 py-2 border-b border-slate-200 dark:border-slate-600 font-bold text-[10px] uppercase text-slate-500 dark:text-slate-300">{group.title}</div>
                                                      <div className="p-2 space-y-1">
                                                          {group.items.map(item => (
                                                              <div key={item.id} className="space-y-1 border-b border-slate-50 dark:border-slate-700 last:border-0 pb-1 mb-1">
                                                                  <p className="text-[10px] font-medium text-slate-600 dark:text-slate-400 pl-1">{item.description.substring(0, 60)}...</p>
                                                                  <div className="flex flex-wrap gap-1">
                                                                      {(!item.variants || item.variants.length === 0) ? (
                                                                          <button onClick={() => handleAddItemToTemplateBill(activeTemplateBill.id, group.id, item.id)} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-emerald-500 hover:text-white rounded text-[9px] font-bold transition-all">Pilih Standard</button>
                                                                      ) : (
                                                                          item.variants.map(v => (
                                                                              <button key={v.id} onClick={() => handleAddItemToTemplateBill(activeTemplateBill.id, group.id, item.id, v.id)} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-emerald-500 hover:text-white rounded text-[9px] font-bold transition-all">{v.label}</button>
                                                                          ))
                                                                      )}
                                                                  </div>
                                                              </div>
                                                          ))}
                                                      </div>
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                  </div>
                              </>
                          ) : (
                              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 space-y-4">
                                  <Layers className="w-16 h-16 opacity-10" />
                                  <p className="text-sm font-medium">Tambah atau pilih BIL NO. di sebelah kiri.</p>
                              </div>
                          )}
                      </div>
                  </div>

                  <div className="pt-8 border-t border-slate-100 dark:border-slate-700 flex gap-4 shrink-0">
                      <button type="button" onClick={() => setIsTemplateModalOpen(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 transition-colors">Batal</button>
                      <button onClick={handleSaveTemplate} className="flex-1 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"><Save className="w-5 h-5" /> Simpan Template</button>
                  </div>
              </div>
          </div>,
          document.body
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfig.isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setDeleteConfig({ ...deleteConfig, isOpen: false })}>
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 transform scale-100 transition-all animate-slide-up relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => setDeleteConfig({ ...deleteConfig, isOpen: false })} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><X className="w-5 h-5" /></button>
                <div className="flex flex-col items-center text-center pt-2"><div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6 text-red-500 animate-pulse-slow"><div className="w-14 h-14 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center"><AlertTriangle className="w-8 h-8 stroke-[1.5]" /></div></div><h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 font-jakarta">Padam Item?</h3><p className="text-slate-500 dark:text-slate-400 mb-8 text-sm leading-relaxed px-4">Adakah anda pasti mahu memadam <br/><span className="font-bold text-slate-900 dark:text-white block mt-1 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 break-all">{deleteConfig.value}</span><span className="mt-2 block text-xs text-red-500 font-medium">Tindakan ini tidak boleh dikembalikan.</span></p><div className="flex gap-3 w-full"><button onClick={() => setDeleteConfig({ ...deleteConfig, isOpen: false })} className="flex-1 py-3.5 px-4 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-600 transition-all border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md">Batal</button><button onClick={confirmDelete} className="flex-1 py-3.5 px-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg bg-red-600 hover:bg-red-700 shadow-red-600/30 hover:-translate-y-0.5"><Trash2 className="w-4 h-4" /><span>Pasti</span></button></div></div>
            </div>
        </div>,
        document.body
      )}

      {/* Edit Company Details Modal */}
      {isCompanyModalOpen && companyToEdit && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsCompanyModalOpen(false)}>
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700 transform scale-100 transition-all animate-slide-up relative" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><Building2 className="w-6 h-6 text-blue-600" />Maklumat Syarikat</h3><button onClick={() => setIsCompanyModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"><X className="w-6 h-6" /></button></div>
                  <form onSubmit={handleSaveCompanyDetails} className="space-y-4">
                      <div><label className={labelClass}>Nama Syarikat</label><input type="text" value={companyToEdit.name} onChange={e => setCompanyToEdit({...companyToEdit, name: e.target.value})} className={inputClass} required /></div>
                      <div><label className={labelClass}>Nombor Pendaftaran (MOF/CIDB)</label><input type="text" value={companyToEdit.registrationNumber || ''} onChange={e => setCompanyToEdit({...companyToEdit, registrationNumber: e.target.value})} className={inputClass} placeholder="cth: 1961008-SL008245" /></div>
                      <div><label className={labelClass}>Alamat Lengkap</label><textarea value={companyToEdit.address} onChange={e => setCompanyToEdit({...companyToEdit, address: e.target.value})} className={`${inputClass} min-h-[80px] resize-none`} placeholder="No. Jalan, Taman, Poskod..." /></div>
                      <div className="grid grid-cols-2 gap-4"><div><label className={labelClass}>Nama Pemilik</label><input type="text" value={companyToEdit.ownerName} onChange={e => setCompanyToEdit({...companyToEdit, ownerName: e.target.value})} className={inputClass} /></div><div><label className={labelClass}>Gred CIDB</label><input type="text" value={companyToEdit.gred} onChange={e => setCompanyToEdit({...companyToEdit, gred: e.target.value})} className={inputClass} placeholder="cth: G1" /></div></div>
                      <div className="grid grid-cols-2 gap-4"><div><label className={labelClass}>No. Telefon</label><input type="text" value={companyToEdit.phone} onChange={e => setCompanyToEdit({...companyToEdit, phone: e.target.value})} className={inputClass} /></div><div><label className={labelClass}>No. Tel Alternatif</label><input type="text" value={companyToEdit.phoneAlt || ''} onChange={e => setCompanyToEdit({...companyToEdit, phoneAlt: e.target.value})} className={inputClass} /></div></div>
                      <div><label className={labelClass}>Emel</label><input type="email" value={companyToEdit.email} onChange={e => setCompanyToEdit({...companyToEdit, email: e.target.value})} className={inputClass} /></div>
                      <div className="pt-4 flex gap-3"><button type="button" onClick={() => setIsCompanyModalOpen(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Batal</button><button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Simpan</button></div>
                  </form>
              </div>
          </div>,
          document.body
      )}

      {/* Edit Vote Modal */}
      {isVoteModalOpen && editingVote && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsVoteModalOpen(false)}>
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 transform scale-100 transition-all animate-slide-up relative" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><FileDigit className="w-6 h-6 text-indigo-600" />{editingVote.code ? 'Kemaskini Vot' : 'Tambah Vot Baru'}</h3><button onClick={() => setIsVoteModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"><X className="w-6 h-6" /></button></div>
                  <form onSubmit={handleSaveVote} className="space-y-4">
                      <div><label className={labelClass}>No. Vot</label><input type="text" value={editingVote.code} onChange={e => setEditingVote({...editingVote, code: e.target.value})} className={inputClass} required placeholder="e.g. P.04.123" /></div>
                      <div><label className={labelClass}>Nama Vot</label><input type="text" value={editingVote.name} onChange={e => setEditingVote({...editingVote, name: e.target.value})} className={inputClass} required placeholder="e.g. Penyelenggaraan Jalan" /></div>
                      <div><label className={labelClass}>Peruntukan (RM)</label><input type="number" value={editingVote.allocation || ''} onChange={e => setEditingVote({...editingVote, allocation: parseFloat(e.target.value)})} className={inputClass} placeholder="0.00" /></div>
                      <div className="pt-4 flex gap-3"><button type="button" onClick={() => setIsVoteModalOpen(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Batal</button><button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Simpan</button></div>
                  </form>
              </div>
          </div>,
          document.body
      )}
    </div>
  );
};

// Global toRoman helper for UI
function toRoman(num: number): string {
    const lookup: { [key: string]: number } = {m:1000,cm:900,d:500,cd:400,c:100,xc:90,l:50,xl:40,x:10,ix:9,v:5,iv:4,i:1};
    let roman = '';
    for (let i in lookup ) {
      while ( num >= lookup[i] ) {
        roman += i;
        num -= lookup[i];
      }
    }
    return roman;
}

export default AdminSettings;