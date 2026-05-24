
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Project, ProjectStatus, formatCurrency, getStatusColor, getStatusLabel, formatDate, User, BP_OPTIONS, ZON_OPTIONS, MUKIM_OPTIONS, VoteDefinition, formatDateMalay, Role } from '../types';
import { apiService } from '../services/apiService';
import { useUsers } from '../hooks/useUsers';
import { useProjects } from '../hooks/useProjects';
import { useSettings } from '../hooks/useSettings';
import { Search, Plus, List, Grid, Filter, Download, Trash2, AlertTriangle, X, ChevronDown, Check, SlidersHorizontal, ArrowUpRight, RotateCcw, Settings2, Eye, EyeOff, Layout, DollarSign, Calculator, Save, Building2, Briefcase, FileText, Loader2, Calendar, FileImage, ChevronLeft, ChevronRight, Recycle, ArrowUpDown, ArrowUp, ArrowDown, CalendarX } from 'lucide-react';
import StrictDateInput from '../components/StrictDateInput';

interface ProjectsListProps {
    projects: Project[];
    selectedYear: number;
    onAddProject: () => void;
    onEditProject: (project: Project) => void;
    onDeleteProject: (project: Project) => void;
    user: User;
}

interface CompanyGroupData {
    company: string;
    projects: Project[];
    totalCost: number;
    totalHargaAkhir: number;
    count: number;
    // Group projects by Vote Code for display
    projectsByVote: Record<string, {
        projects: Project[];
        subtotalContract: number;
        subtotalAkhir: number;
    }>;
}

// Circular Progress Component
const CircularProgress = ({ value, size = 36, strokeWidth = 3 }: { value: number, size?: number, strokeWidth?: number }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    const colorClass = "text-blue-500";
    const strokeClass = "stroke-blue-500";

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90 w-full h-full">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    className="stroke-slate-200  fill-none"
                    strokeWidth={strokeWidth}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    className={`${strokeClass} fill-none transition-colors duration-1000 ease-out`}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                />
            </svg>
            <span className={`absolute text-[9px] font-bold ${colorClass}`}>{Math.round(value)}%</span>
        </div>
    );
};

const ProjectsList: React.FC<ProjectsListProps> = ({ projects, selectedYear, onAddProject, onEditProject, onDeleteProject, user }) => {
    const { users } = useUsers();
    const { updateProject } = useProjects();
    const {
        votes: votesList,
        companyOrder,
        manualFinancials: hookManualFinancials,
        companyDetails,
        updateSettings,
        isSyncing: isSettingsSyncing
    } = useSettings(selectedYear);

    const canQuickEdit = user.role === Role.ADMIN || user.role === Role.JURUTERA;

    const [manualFinancials, setManualFinancials] = useState(hookManualFinancials);

    useEffect(() => {
        setManualFinancials(hookManualFinancials);
    }, [hookManualFinancials]);

    const [viewMode, setViewMode] = useState<'list' | 'group'>('list');
    const [expandedCompanies, setExpandedCompanies] = useState<Record<string, boolean>>({});
    const [costViewMode, setCostViewMode] = useState<'contract' | 'actual' | 'both'>('contract');

    const [showSiap, setShowSiap] = useState(true);
    const [showTuntutan, setShowTuntutan] = useState(true);

    const [isSavingFinancials, setIsSavingFinancials] = useState(false);

    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'ALL'>('ALL');
    const [filterPja, setFilterPja] = useState<string>('ALL');
    const [filterZon, setFilterZon] = useState<string>('ALL');
    const [filterBp, setFilterBp] = useState<string>('ALL');
    const [filterMukim, setFilterMukim] = useState<string>('ALL');
    const [filterVote, setFilterVote] = useState<string>('ALL');
    const [filterLoC, setFilterLoC] = useState(false);
    const [filterDateType, setFilterDateType] = useState<string>('tarikhBuka');
    const [filterDateStart, setFilterDateStart] = useState<string | null>(null);
    const [filterDateEnd, setFilterDateEnd] = useState<string | null>(null);

    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [deleteCountdown, setDeleteCountdown] = useState(0);

    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportBilMesyuarat, setExportBilMesyuarat] = useState('');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [pageInput, setPageInput] = useState('1');

    const [sortKey, setSortKey] = useState<string>('tarikhBuka');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    // Long press detection refs
    const longPressTimer = React.useRef<any>(null);
    const isLongPress = React.useRef(false);

    const handleMouseDown = () => {
        isLongPress.current = false;
        longPressTimer.current = setTimeout(() => {
            isLongPress.current = true;
        }, 500);
    };

    const handleMouseUp = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
    };

    const handleMouseLeave = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
    };

    const handleProjectClick = (project: Project) => {
        if (!isLongPress.current) {
            onEditProject(project);
        }
    };

    const handleExportRotasiPDF = async () => {
        setIsGeneratingPdf(true);
        setGenerationProgress(10);

        try {
            // @ts-ignore
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for more columns

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const marginX = 10;
            let currentY = 15;

            // Header
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.text(`JADUAL PENGILIRAN KONTRAKTOR PANEL INFRASTRUKTUR JABATAN KEJURUTERAAN TAHUN ${selectedYear}`, pageWidth / 2, currentY, { align: "center" });
            doc.setFontSize(8);
            currentY += 7;

            const months = ["JAN", "FEB", "MAC", "APR", "MEI", "JUN", "JUL", "OGO", "SEP", "OKT", "NOV", "DIS"];

            const companies = companyOrder.length > 0 ? companyOrder : Array.from(new Set(projects.map(p => p.namaSyarikat).filter(Boolean))) as string[];

            let grandTotalCount = 0;
            let grandTotalContract = 0;
            let grandTotalLimit = 0;
            let grandTotalBalance = 0;
            const grandTotalMonths = Array(12).fill(0);

            const tableBody = companies.map((compName, idx) => {
                const compProjects = projects.filter(p => p.namaSyarikat === compName);
                const compDetail = companyDetails[compName] || {};
                const limit = compDetail.limit || 0; // Threshold

                const monthCounts = Array(12).fill(0);
                let totalContract = 0;

                compProjects.forEach(p => {
                    totalContract += (p.kosProjek || 0);

                    let dateToUse = p.tarikhLantikan || p.tarikhBuka;
                    if (p.bulan) {
                        const mIdx = ["JANUARI", "FEBRUARI", "MAC", "APRIL", "MEI", "JUN", "JULAI", "OGOS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DISEMBER"].indexOf(p.bulan.toUpperCase());
                        if (mIdx !== -1) {
                            monthCounts[mIdx]++;
                            return;
                        }
                    }

                    if (dateToUse) {
                        const d = new Date(dateToUse);
                        if (!isNaN(d.getTime())) {
                            monthCounts[d.getMonth()]++;
                        }
                    }
                });

                monthCounts.forEach((count, mIdx) => {
                    grandTotalMonths[mIdx] += count;
                });

                const balance = limit - totalContract;
                const totalCount = monthCounts.reduce((a, b) => a + b, 0);

                grandTotalCount += totalCount;
                grandTotalContract += totalContract;
                grandTotalLimit += limit;
                grandTotalBalance += balance;

                return [
                    idx + 1,
                    compName,
                    ...monthCounts.map(c => c > 0 ? c.toString() : ''),
                    totalCount,
                    formatCurrency(totalContract).replace('RM', '').trim(),
                    formatCurrency(balance).replace('RM', '').trim()
                ];
            });

            const summaryRow = [
                '',
                'JUMLAH KESELURUHAN',
                ...grandTotalMonths.map(c => c > 0 ? c.toString() : ''),
                grandTotalCount,
                formatCurrency(grandTotalContract).replace('RM', '').trim(),
                formatCurrency(grandTotalBalance).replace('RM', '').trim()
            ];

            tableBody.push(summaryRow);

            const head = [
                [
                    { content: 'BIL', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                    { content: 'NAMA KONTRAKTOR', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                    { content: 'BULAN', colSpan: 12, styles: { halign: 'center' } },
                    { content: 'JUMLAH FAIL', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }, // Total Count
                    { content: 'JUMLAH KONTRAK', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                    { content: 'BAKI', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }
                ],
                [
                    ...months
                ]
            ];

            // @ts-ignore
            doc.autoTable({
                startY: currentY,
                head: head,
                body: tableBody,
                theme: 'grid',
                styles: { fontSize: 7, cellPadding: 1, lineColor: [0, 0, 0], lineWidth: 0.1, textColor: 0 },
                headStyles: { fillColor: [230, 230, 230], textColor: 0, fontStyle: 'bold', halign: 'center', lineWidth: 0.1, lineColor: [0, 0, 0] },
                columnStyles: {
                    0: { cellWidth: 10, halign: 'center' }, // BIL
                    1: { cellWidth: 'auto' }, // NAMA
                    // Months 2-13 (indices 2 to 13)
                    2: { cellWidth: 8, halign: 'center' },
                    3: { cellWidth: 8, halign: 'center' },
                    4: { cellWidth: 8, halign: 'center' },
                    5: { cellWidth: 8, halign: 'center' },
                    6: { cellWidth: 8, halign: 'center' },
                    7: { cellWidth: 8, halign: 'center' },
                    8: { cellWidth: 8, halign: 'center' },
                    9: { cellWidth: 8, halign: 'center' },
                    10: { cellWidth: 8, halign: 'center' },
                    11: { cellWidth: 8, halign: 'center' },
                    12: { cellWidth: 8, halign: 'center' },
                    13: { cellWidth: 8, halign: 'center' },
                    // Stats
                    14: { cellWidth: 12, halign: 'center', fontStyle: 'bold' }, // Total Count
                    15: { cellWidth: 25, halign: 'right' }, // Total Contract
                    16: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }  // Balance
                },
                margin: { left: marginX, right: marginX },
                didParseCell: (data: any) => {
                    if (data.row.index === tableBody.length - 1) {
                        data.cell.styles.fontStyle = 'bold';
                        data.cell.styles.fillColor = [240, 240, 240];
                    }
                }
            });

            setGenerationProgress(100);
            doc.save(`Rotasi_Kontraktor_${selectedYear}.pdf`);

        } catch (e) {
            console.error("Rotasi PDF Error", e);
            alert("Gagal menjana PDF Rotasi.");
        } finally {
            setIsGeneratingPdf(false);
            setGenerationProgress(0);
        }
    };

    // Column Definitions
    const columnDefs = [
        { id: 'noFail', label: 'No. Fail', group: 'Asas', default: true },
        { id: 'namaProjek', label: 'Nama Projek', group: 'Asas', default: true },
        { id: 'pjaId', label: 'PJA', group: 'Asas', default: true },
        { id: 'noAduan', label: 'Aduan', group: 'Asas', default: true },
        { id: 'lokasi', label: 'Lokasi', group: 'Asas', default: false },
        { id: 'bp', label: 'BP', group: 'Asas', default: false },
        { id: 'zon', label: 'Zon', group: 'Asas', default: false },
        { id: 'mukim', label: 'Mukim', group: 'Asas', default: false },
        { id: 'tarikhBuka', label: 'Tarikh Buka', group: 'Asas', default: false },
        { id: 'namaSyarikat', label: 'Nama Syarikat', group: 'Kontrak', default: true },
        { id: 'noVote', label: 'No. Vot', group: 'Kontrak', default: false },
        { id: 'noSebutharga', label: 'No. Sebutharga', group: 'Kontrak', default: false },
        { id: 'noInden', label: 'No. Inden', group: 'Kontrak', default: false },
        { id: 'noBpp', label: 'No. BPP', group: 'Kontrak', default: false },
        { id: 'tempohKontrak', label: 'Tempoh', group: 'Kontrak', default: false },
        { id: 'status', label: 'Status & Progress', group: 'Status', default: true },
        { id: 'prestasi', label: 'Prestasi', group: 'Status', default: false },
        { id: 'kosProjek', label: 'Harga Kontrak', group: 'Kewangan', default: false },
        { id: 'kosSebenar', label: 'Harga Akhir', group: 'Kewangan', default: false },
        { id: 'wangTahanan', label: 'Wang Tahanan', group: 'Kewangan', default: false },
        { id: 'ladAmount', label: 'LAD (RM)', group: 'Kewangan', default: false },
        { id: 'ladDays', label: 'Hari LAD', group: 'Kewangan', default: false },
        { id: 'locAmount', label: 'LOC (RM)', group: 'Kewangan', default: false },
        { id: 'locDays', label: 'Hari LOC', group: 'Kewangan', default: false },
        { id: 'tarikhLantikan', label: 'T. Lantikan', group: 'Tarikh', default: false },
        { id: 'tarikhCetakanBpp', label: 'T. BPP', group: 'Tarikh', default: false },
        { id: 'tarikhMulaKontrak', label: 'Mula Kontrak', group: 'Tarikh', default: false },
        { id: 'tarikhTamatKontrak', label: 'Tamat Kontrak', group: 'Tarikh', default: false },
        { id: 'tarikhSerahTapak', label: 'Serah Tapak', group: 'Tarikh', default: false },
        { id: 'tarikhMulaKerja', label: 'Mula Kerja', group: 'Tarikh', default: false },
        { id: 'tarikhSiapSebenar', label: 'Siap Sebenar', group: 'Tarikh', default: false },
        { id: 'tarikhTuntutanBayaran', label: 'T. Tuntutan', group: 'Penutup', default: false },
        { id: 'tarikhHantarKewangan', label: 'Hantar Kewangan', group: 'Penutup', default: false },
        { id: 'tarikhPadanan', label: 'Padanan', group: 'Penutup', default: false },
        { id: 'iso', label: 'ISO', group: 'Penutup', default: false },
    ];

    const getInitialColumns = () => {
        const initial: Record<string, boolean> = {};
        columnDefs.forEach(col => {
            initial[col.id] = col.default;
        });
        return initial;
    };

    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(getInitialColumns);

    // Column Actions
    const handleSelectAllColumns = () => {
        const all: Record<string, boolean> = {};
        columnDefs.forEach(c => all[c.id] = true);
        setVisibleColumns(all);
    };

    const handleDeselectAllColumns = () => {
        const none: Record<string, boolean> = {};
        columnDefs.forEach(c => none[c.id] = false);
        setVisibleColumns(none);
    };

    const handleResetColumns = () => {
        setVisibleColumns(getInitialColumns());
    };

    // Delete Logic
    useEffect(() => {
        let timer: any;
        if (projectToDelete) {
            setDeleteCountdown(5);
            timer = setInterval(() => {
                setDeleteCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [projectToDelete]);

    const handleDeleteClick = (project: Project) => setProjectToDelete(project);
    const confirmDelete = () => { if (projectToDelete) { onDeleteProject(projectToDelete); setProjectToDelete(null); } };
    const cancelDelete = () => setProjectToDelete(null);

    // Grouping Logic
    const toggleCompany = (company: string) => {
        setExpandedCompanies(prev => ({ ...prev, [company]: !prev[company] }));
    };

    const saveManualFinancials = async () => {
        setIsSavingFinancials(true);
        try {
            await updateSettings({ manual_financials: manualFinancials });
        } catch (err) {
            console.error('Failed to save financials:', err);
        } finally {
            setIsSavingFinancials(false);
        }
    };

    // Filter Logic
    const resetAllFilters = () => {
        setFilterStatus('ALL');
        setFilterPja('ALL');
        setFilterZon('ALL');
        setFilterBp('ALL');
        setFilterMukim('ALL');
        setFilterVote('ALL');
        setSearchTerm('');
        setShowSiap(true);
        setShowTuntutan(true);
        setFilterLoC(false);
        setFilterDateType('tarikhBuka');
        setFilterDateStart(null);
        setFilterDateEnd(null);
        setSortKey('tarikhBuka');
        setSortDirection('desc');
        handleResetColumns();
    };

    const activeFilterCount = [
        filterStatus !== 'ALL',
        filterPja !== 'ALL',
        filterZon !== 'ALL',
        filterBp !== 'ALL',
        filterMukim !== 'ALL',
        filterVote !== 'ALL',
        showSiap === false,
        filterDateStart !== null,
        filterDateEnd !== null
    ].filter(Boolean).length;

    const filteredProjects = useMemo(() => {
        const filtered = projects.filter(p => {
            const matchesSearch =
                (p.noFail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.namaProjek || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.noAduan || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.namaSyarikat || '').toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;
            const matchesPja = filterPja === 'ALL' || p.pjaId === Number(filterPja);
            const matchesZon = filterZon === 'ALL' || (p.zon && p.zon.includes(filterZon));
            const matchesBp = filterBp === 'ALL' || p.bp === filterBp;
            const matchesMukim = filterMukim === 'ALL' || p.mukim === filterMukim;
            const matchesVote = filterVote === 'ALL' || p.noVote === filterVote;

            const rawDateVal = p[filterDateType as keyof Project] as string | undefined;
            const dateVal = rawDateVal ? rawDateVal.split('T')[0] : '';
            const matchesDate = (!filterDateStart || (dateVal && dateVal >= filterDateStart)) &&
                (!filterDateEnd || (dateVal && dateVal <= filterDateEnd));

            return matchesSearch && matchesStatus && matchesPja && matchesZon && matchesBp && matchesMukim && matchesVote && matchesDate;
        });

        return filtered.sort((a, b) => {
            const getVal = (p: Project, key: string) => {
                // @ts-ignore
                let val = p[key];
                if (key === 'kosSebenar') val = getHargaAkhir(p);
                return val;
            };

            const valA = getVal(a, sortKey);
            const valB = getVal(b, sortKey);

            // --- Rule: Empty values always at the bottom ---
            const isEmptyA = valA === undefined || valA === null || valA === '';
            const isEmptyB = valB === undefined || valB === null || valB === '';

            if (isEmptyA && !isEmptyB) return 1;
            if (!isEmptyA && isEmptyB) return -1;
            if (isEmptyA && isEmptyB) {
                // If both are empty for the current sort key, fallback to date desc
                const dateA = new Date(a.tarikhBuka || 0).getTime();
                const dateB = new Date(b.tarikhBuka || 0).getTime();
                return dateB - dateA;
            }

            let comparison = 0;
            if (sortKey === 'noFail') {
                // Natural sort for file numbers (e.g., 2 comes before 10)
                comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
                if (comparison === 0) {
                    // Secondary sort: Latest date on top
                    const dateA = new Date(a.tarikhBuka || 0).getTime();
                    const dateB = new Date(b.tarikhBuka || 0).getTime();
                    return dateB - dateA;
                }
            } else if (typeof valA === 'string') {
                comparison = valA.localeCompare(valB as string);
            } else if (typeof valA === 'number') {
                comparison = valA - (valB as number);
            } else if (valA instanceof Date || (typeof valA === 'string' && !isNaN(Date.parse(valA)))) {
                comparison = new Date(valA as string).getTime() - new Date(valB as string).getTime();
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [projects, searchTerm, filterStatus, filterPja, filterZon, filterBp, filterMukim, filterVote, sortKey, sortDirection, filterDateType, filterDateStart, filterDateEnd]);

    // Reset pagination when filter changes
    useEffect(() => {
        setCurrentPage(1);
        setPageInput('1');
    }, [filteredProjects.length]);

    const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

    const paginatedProjects = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredProjects.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredProjects, currentPage]);

    const handlePageChange = (page: number) => {
        const p = Math.max(1, Math.min(page, totalPages));
        setCurrentPage(p);
        setPageInput(p.toString());
    };

    const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPageInput(e.target.value);
    };

    const handlePageInputBlur = () => {
        let p = parseInt(pageInput);
        if (isNaN(p) || p < 1) p = 1;
        if (p > totalPages) p = totalPages;
        handlePageChange(p);
    };

    const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handlePageInputBlur();
            e.currentTarget.blur();
        }
    };

    /**
     * getHargaAkhir (The Single Source of Truth for Final Net Cost)
     * This includes BQ Pelarasan total minus LAD and Wang Tahanan.
     */
    const getHargaAkhir = (p: Project) => {
        // If we are in Phase 3 (Tuntutan) or Phase 4 (Siap), we use the computed net final total.
        const isPostPelarasan = [ProjectStatus.TUNTUTAN_BAYARAN, ProjectStatus.SIAP].includes(p.status);

        if (!isPostPelarasan) {
            return p.kosProjek ?? 0;
        }

        // If kosSebenar is already pre-calculated in ProjectDetail saving logic, use it.
        // Otherwise, we calculate it on the fly: BQ Pelarasan Sum - LAD - Wang Tahanan.
        if (p.kosSebenar !== undefined && p.kosSebenar !== null) {
            return p.kosSebenar;
        }

        const pelarasanSum = p.bqDataPelarasan?.reduce((acc, group) => {
            return acc + group.items.reduce((itemSum, item) => itemSum + (item.amount || 0), 0);
        }, 0) || (p.kosProjek ?? 0);

        const netTotal = pelarasanSum - (p.ladAmount || 0) - (p.wangTahanan || 0);
        return Math.max(0, netTotal);
    };

    // Grouped Projects with Custom Sorting and Vote Breakdown
    const groupedProjects = useMemo(() => {
        const grouped: CompanyGroupData[] = [];
        const companiesSet = new Set(companyOrder);

        filteredProjects.forEach(p => {
            if (p.namaSyarikat) companiesSet.add(p.namaSyarikat);
        });

        const sortedCompanies = Array.from(companiesSet).sort((a, b) => {
            const indexA = companyOrder.indexOf(a);
            const indexB = companyOrder.indexOf(b);

            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return (a as string).localeCompare(b as string);
        });

        sortedCompanies.forEach(compName => {
            let compProjects = filteredProjects.filter(p => p.namaSyarikat === compName);

            if (!showSiap) {
                compProjects = compProjects.filter(p => p.status !== ProjectStatus.SIAP);
            }

            if (!showTuntutan) {
                compProjects = compProjects.filter(p => p.status !== ProjectStatus.TUNTUTAN_BAYARAN);
            }

            if (filterLoC) {
                compProjects = compProjects.filter(p => (p.locAmount || 0) > 0 || (p.locDays || 0) > 0);
            }

            const group: CompanyGroupData = {
                company: compName as string,
                projects: compProjects,
                totalCost: 0,
                totalHargaAkhir: 0,
                count: 0,
                projectsByVote: {}
            };

            compProjects.forEach(p => {
                const contractVal = p.kosProjek || 0;
                const akhirVal = getHargaAkhir(p);

                group.totalCost += contractVal;
                group.totalHargaAkhir += akhirVal;
                group.count += 1;

                const voteCode = p.noVote || 'TIADA VOT';
                if (!group.projectsByVote[voteCode]) {
                    group.projectsByVote[voteCode] = { projects: [], subtotalContract: 0, subtotalAkhir: 0 };
                }
                group.projectsByVote[voteCode].projects.push(p);
                group.projectsByVote[voteCode].subtotalContract += contractVal;
                group.projectsByVote[voteCode].subtotalAkhir += akhirVal;
            });

            grouped.push(group);
        });

        return grouped;
    }, [filteredProjects, companyOrder, showSiap, showTuntutan, filterLoC]);

    const exportToExcel = () => {
        const activeCols = columnDefs.filter(c => visibleColumns[c.id]);
        const headers: string[] = [];

        activeCols.forEach(col => {
            if (col.id === 'status') {
                headers.push('"Status"');
                headers.push('"Progress (%)"');
            } else {
                headers.push(`"${col.label}"`);
            }
        });

        const rows = filteredProjects.map(p => {
            return activeCols.map(c => {
                if (c.id === 'status') {
                    const statusText = p.status ? getStatusLabel(p.status) : '';
                    const progressText = p.peratusSiap !== undefined ? p.peratusSiap : 0;
                    return `"${statusText}","${progressText}"`;
                }

                // @ts-ignore
                let val = p[c.id];

                if (c.id === 'pjaId') {
                    const u = users.find(u => u.id === val);
                    val = u ? u.username : '';
                }

                if (c.id === 'kosSebenar') {
                    val = getHargaAkhir(p);
                }

                if (val === undefined || val === null) return '""';

                if (typeof val === 'string') {
                    return `"${val.replace(/"/g, '""')}"`;
                }
                return `"${val}"`;
            }).join(",");
        });

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Senarai_Projek_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getPjaUser = (id: number) => {
        return users.find(user => user.id === id);
    };

    const getVoteName = (code: string) => {
        const vote = votesList.find(v => v.code === code);
        return vote ? vote.name : code;
    };

    // --- Financial Summary Logic ---
    const financialSummary = useMemo(() => {
        const summary: Record<string, { allocated: number; used: number; projectCount: number }> = {};

        votesList.forEach(v => {
            summary[v.code] = { allocated: v.allocation, used: 0, projectCount: 0 };
        });

        filteredProjects.forEach(p => {
            if (p.noVote) {
                if (!summary[p.noVote]) {
                    summary[p.noVote] = { allocated: 0, used: 0, projectCount: 0 };
                }

                let costToAdd = 0;
                if (costViewMode === 'contract') {
                    costToAdd = p.kosProjek || 0;
                } else {
                    // actual (Harga Akhir) or both - uses unified actual cost logic
                    costToAdd = getHargaAkhir(p);
                }

                summary[p.noVote].used += costToAdd;
                summary[p.noVote].projectCount += 1;
            }
        });

        return summary;
    }, [filteredProjects, votesList, costViewMode]);
    const handleExportRealPDF = async () => {
        if (!exportBilMesyuarat) {
            alert('Sila masukkan Bil. Mesyuarat.');
            return;
        }
        setIsGeneratingPdf(true);
        setGenerationProgress(10);

        try {
            // @ts-ignore
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const marginX = 10;
            let currentY = 10;

            const printHeader = (pageNum: number) => {
                if (pageNum === 1) {
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(8);
                    doc.text(`SENARAI KONTRAKTOR PANEL YANG TELAH DILANTIK`, pageWidth / 2, 20, { align: "center" });
                    doc.text(`UNTUK KERJA INFRASTRUKTUR BAGI TAHUN ${selectedYear}`, pageWidth / 2, 25, { align: "center" });

                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(8);
                    doc.text(`Tarikh Kemaskini: ${new Date().toLocaleDateString('en-GB')}`, marginX, 35);
                    doc.text(`Kertas Mesyuarat. Bil. ${exportBilMesyuarat}`, pageWidth - marginX, 35, { align: "right" });

                    doc.setLineWidth(0.5);
                    doc.line(marginX, 38, pageWidth - marginX, 38);
                    return 45;
                }
                return 15;
            };

            currentY = printHeader(1);

            let totalItemsProcessed = 0;
            const totalItems = groupedProjects.reduce((acc, g) => acc + g.projects.length, 0);

            let companyCounter = 1;
            for (const group of groupedProjects) {
                if (group.projects.length === 0) continue;

                // Check if company header needs a new page
                if (currentY > pageHeight - 50) {
                    doc.addPage();
                    currentY = printHeader(doc.getNumberOfPages());
                }

                // Company Header
                doc.setFillColor(230, 230, 230);
                doc.rect(marginX, currentY, pageWidth - (marginX * 2), 7, 'F');
                doc.rect(marginX, currentY, pageWidth - (marginX * 2), 7, 'S');
                doc.setFont("helvetica", "bold");
                doc.setFontSize(8);
                doc.setTextColor(0, 0, 0);
                doc.text(`${companyCounter++}. ${group.company.toUpperCase()}`, marginX + 2, currentY + 5);
                currentY += 10;

                // Prepare consolidated table body for the company
                let billCounter = 1;
                const companyProjects = [...group.projects].sort((a, b) => {
                    const dateA = new Date(a.tarikhMulaKontrak || a.tarikhLantikan || '9999-12-31').getTime();
                    const dateB = new Date(b.tarikhMulaKontrak || b.tarikhLantikan || '9999-12-31').getTime();
                    return dateA - dateB;
                });

                const tableBody = companyProjects.map((p) => {
                    const pjaUser = getPjaUser(p.pjaId);
                    const pjaName = pjaUser ? pjaUser.username.toUpperCase() : '-';

                    // Title Case Helper
                    const toTitleCase = (str: string) => {
                        if (!str) return '';
                        return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
                    };

                    // Format Status: First letter caps (e.g. Dalam Proses)
                    const formattedStatus = getStatusLabel(p.status);

                    const progress = p.peratusSiap !== undefined && p.peratusSiap !== null ? p.peratusSiap : 0;

                    // Format Lokasi: Title case and join with comma
                    const formattedLokasi = (p.lokasi || '-')
                        .split(/,|\n/) // Split by comma OR newline
                        .map(part => part.trim())
                        .filter(part => part.length > 0)
                        .map(part => toTitleCase(part))
                        .join(', ');

                    const failDanLokasi = `${p.noFail}\n${formattedLokasi}`;
                    const tarikhGabung = `${formatDate(p.tarikhMulaKontrak)} ${formatDate(p.tarikhTamatKontrak)}`;
                    const votGabung = `${p.noVote || 'TIADA VOT'}\n${getVoteName(p.noVote || '')}`;
                    const formattedZon = (p.zon || '-').replace(/Zon /g, '');

                    return [
                        billCounter++,
                        failDanLokasi,
                        tarikhGabung,
                        pjaName,
                        formattedZon,
                        `${formattedStatus}\n(${progress}%)`,
                        votGabung,
                        formatCurrency(p.kosProjek || 0).replace('RM', '').trim()
                    ];
                });

                // @ts-ignore
                doc.autoTable({
                    startY: currentY,
                    head: [['BIL', 'NO. FAIL / LOKASI', 'TARIKH', 'PJA', 'ZON', 'STATUS', 'VOT', 'HARGA (RM)']],
                    body: tableBody,
                    theme: 'grid',
                    styles: { fontSize: 6.5, cellPadding: 0.5, lineColor: [0, 0, 0], lineWidth: 0.1, textColor: 0, valign: 'middle' },
                    headStyles: { fillColor: [245, 245, 245], textColor: 0, fontStyle: 'bold', halign: 'center', valign: 'middle' },
                    columnStyles: {
                        0: { cellWidth: 6, halign: 'center' },
                        1: { cellWidth: 70 },
                        2: { cellWidth: 15, halign: 'center' },
                        3: { cellWidth: 14, halign: 'center' },
                        4: { cellWidth: 12, halign: 'center' },
                        5: { cellWidth: 23, halign: 'center' },
                        6: { cellWidth: 27 },
                        7: { cellWidth: 23, halign: 'right', fontStyle: 'bold' }
                    },
                    margin: { left: marginX, right: marginX },
                    rowPageBreak: 'avoid',
                    didParseCell: (data: any) => {
                        if (data.section === 'body' && data.column.index === 1) {
                            data.cell.styles.fontSize = 6;
                        }
                    }
                });

                // @ts-ignore
                currentY = doc.lastAutoTable.finalY + 3;

                // Budget Summary for this company
                const votesInGroup = Object.keys(group.projectsByVote).sort();
                const summaryTableBody = votesInGroup.map(voteCode => {
                    const voteData = group.projectsByVote[voteCode];
                    return [
                        voteCode,
                        getVoteName(voteCode),
                        voteData.projects.length,
                        formatCurrency(voteData.subtotalContract).replace('RM', '').trim()
                    ];
                });

                // Add Grand Total for company
                summaryTableBody.push([
                    { content: 'JUMLAH', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold', fillColor: [240, 240, 240] } } as any,
                    { content: '', styles: { fillColor: [240, 240, 240] } } as any,
                    { content: formatCurrency(group.totalCost).replace('RM', '').trim(), styles: { halign: 'right', fontStyle: 'bold', fillColor: [240, 240, 240] } } as any
                ]);

                // Check space for summary table
                if (currentY > pageHeight - 30) {
                    doc.addPage();
                    currentY = printHeader(doc.getNumberOfPages());
                }

                doc.setFont("helvetica", "bold");
                doc.setFontSize(7);
                // doc.text(`RINGKASAN BAJET: ${group.company}`, marginX, currentY + 4);
                currentY += 0;

                // @ts-ignore
                doc.autoTable({
                    startY: currentY,
                    head: [['VOT', 'PERUNTUKAN', 'BIL. PROJEK', 'JUMLAH (RM)']],
                    body: summaryTableBody,
                    theme: 'grid',
                    styles: { fontSize: 6.5, cellPadding: 0.5, lineColor: [0, 0, 0], lineWidth: 0.1, textColor: 0 },
                    headStyles: { fillColor: [245, 245, 245], textColor: 0, fontStyle: 'bold', halign: 'center' },
                    columnStyles: {
                        0: { cellWidth: 20, halign: 'center' },
                        1: { cellWidth: 'auto' },
                        2: { cellWidth: 20, halign: 'center' },
                        3: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
                    },
                    margin: { left: marginX, right: marginX },
                    tableWidth: 140 // Slightly wider to accommodate new column
                });

                // @ts-ignore
                currentY = doc.lastAutoTable.finalY + 10;

                totalItemsProcessed += group.projects.length;
                setGenerationProgress(10 + Math.round((totalItemsProcessed / totalItems) * 80));
            }

            // FINAL GLOBAL SUMMARY PAGE
            doc.addPage();
            currentY = 20;
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.text(`RUMUSAN (${selectedYear})`, marginX, currentY);
            currentY += 5;

            const globalSummaryBody = Object.entries(financialSummary).map(([voteCode, data]) => {
                return [
                    voteCode,
                    getVoteName(voteCode),
                    (data as any).projectCount,
                    formatCurrency((data as any).allocated).replace('RM', ''),
                    formatCurrency((data as any).used).replace('RM', ''),
                    formatCurrency((data as any).allocated - (data as any).used).replace('RM', '')
                ];
            });

            const totalAlloc = (Object.values(financialSummary) as any[]).reduce((a, b) => a + b.allocated, 0);
            const totalUsed = (Object.values(financialSummary) as any[]).reduce((a, b) => a + b.used, 0);
            const totalProjectCount = (Object.values(financialSummary) as any[]).reduce((a, b) => a + b.projectCount, 0);
            const totalBal = totalAlloc - totalUsed;

            // @ts-ignore
            doc.autoTable({
                startY: currentY,
                head: [['VOT', 'PERUNTUKAN', 'PROJEK', 'JUMLAH', 'PERBELANJAAN', 'BAKI']],
                body: [
                    ...globalSummaryBody,
                    [
                        { content: 'JUMLAH', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } },
                        { content: `${totalProjectCount}`, styles: { halign: 'center', fontStyle: 'bold' } },
                        { content: formatCurrency(totalAlloc).replace('RM', ''), styles: { halign: 'right', fontStyle: 'bold' } },
                        { content: formatCurrency(totalUsed).replace('RM', ''), styles: { halign: 'right', fontStyle: 'bold', textColor: [200, 0, 0] } },
                        { content: formatCurrency(totalBal).replace('RM', ''), styles: { halign: 'right', fontStyle: 'bold' } }
                    ]
                ],
                theme: 'grid',
                styles: { fontSize: 7.5, cellPadding: 1.4, lineColor: [0, 0, 0], lineWidth: 0.1, textColor: 0 },
                headStyles: { fillColor: [230, 230, 230], textColor: 0, fontStyle: 'bold', halign: 'center' },
                columnStyles: {
                    0: { cellWidth: 20, halign: 'center' },
                    1: { cellWidth: 'auto' },
                    2: { cellWidth: 15, halign: 'center' },
                    3: { cellWidth: 35, halign: 'right' },
                    4: { cellWidth: 35, halign: 'right' },
                    5: { cellWidth: 35, halign: 'right' }
                },
                margin: { left: marginX, right: marginX }
            });

            // @ts-ignore
            currentY = doc.lastAutoTable.finalY + 10;

            const netBalance = totalBal - (manualFinancials.outsource || 0) - (manualFinancials.ydp || 0);
            const deductionData = [
                ['TOLAK LAIN-LAIN (SEBUTHARGA)', formatCurrency(manualFinancials.outsource || 0)],
                ['TOLAK LANTIKAN YDP/TYDP', formatCurrency(manualFinancials.ydp || 0)],
                ['BAKI BERSIH', formatCurrency(netBalance)]
            ];

            // @ts-ignore
            doc.autoTable({
                startY: currentY,
                body: deductionData,
                theme: 'plain',
                styles: { fontSize: 8, cellPadding: 1, textColor: 0 },
                columnStyles: {
                    0: { cellWidth: 100, halign: 'right', fontStyle: 'bold' },
                    1: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
                },
                margin: { left: pageWidth - 150 }
            });

            setGenerationProgress(100);
            doc.save(`Senarai_Kontraktor_Panel_${selectedYear}.pdf`);
            setIsExportModalOpen(false);

        } catch (e) {
            console.error("Real PDF Generation Error", e);
            alert("Gagal menjana PDF. Sila guna 'Backup (Imej)'.");
        } finally {
            setIsGeneratingPdf(false);
            setGenerationProgress(0);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-40">

            {/* Header Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold gradient-text">Senarai Projek</h1>
                    <p className="text-slate-500  mt-1">
                        <span className="font-bold text-blue-600">{filteredProjects.length}</span> projek dijumpai
                    </p>
                </div>
                <button
                    onClick={onAddProject}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40  transition-colors duration-300 w-full md:w-auto justify-center"
                >
                    <Plus className="h-5 w-5" />
                    <span>Tambah Projek</span>
                </button>
            </div>

            {/* Advanced Filter Bar */}
            <div className="bg-white/95  border border-white/10 shadow-xl p-5 rounded-3xl shadow-xl border border-white/20  space-y-4 relative z-30">
                <div className="flex flex-col lg:flex-row gap-4">
                    {viewMode === 'list' && (
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari No. Fail, Aduan, Projek, Syarikat..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50  border-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-colors text-slate-900  placeholder-slate-400 font-medium"
                            />
                        </div>
                    )}
                    {viewMode === 'group' && <div className="flex-1"></div>}

                    <div className="flex flex-wrap gap-2">
                        <div className="flex bg-slate-100  p-1 rounded-xl shrink-0">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-3 md:px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${viewMode === 'list' ? 'bg-white  text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                title="Pandangan Senarai"
                            >
                                <List className="w-4 h-4" /> <span className="hidden md:inline">Senarai</span>
                            </button>
                            <button
                                onClick={() => setViewMode('group')}
                                className={`px-3 md:px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${viewMode === 'group' ? 'bg-white  text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                title="Pandangan Kumpulan Syarikat"
                            >
                                <Grid className="w-4 h-4" /> <span className="hidden md:inline">Syarikat</span>
                            </button>
                        </div>

                        <button
                            onClick={() => setShowFilterPanel(!showFilterPanel)}
                            className={`h-full px-4 rounded-xl border flex items-center gap-2 text-sm font-bold transition-colors relative ${showFilterPanel || activeFilterCount > 0 ? 'bg-blue-50  text-blue-600 border-blue-200 ring-2 ring-blue-500/20' : 'bg-white  border-slate-200  text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Filter className="w-4 h-4" />
                            <span>Filter</span>
                            {activeFilterCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 text-white text-[10px] flex items-center justify-center rounded-full shadow-sm">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={viewMode === 'group' ? () => setIsExportModalOpen(true) : exportToExcel}
                            className="h-full px-4 rounded-xl bg-blue-50  text-blue-600  hover:bg-blue-100  flex items-center gap-2 transition-colors font-bold text-sm"
                            title={viewMode === 'group' ? "Jana Laporan Panel" : "Export CSV"}
                        >
                            {viewMode === 'group' ? <FileText className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                            {viewMode === 'group' ? 'Laporan' : 'CSV'}
                        </button>
                        <button
                            onClick={handleExportRotasiPDF}
                            className="h-full px-4 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 flex items-center gap-2 transition-colors font-bold text-sm"
                            title=""
                            disabled={isGeneratingPdf}
                        >
                            {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Recycle className="w-4 h-4" />}
                            <span className="hidden sm:inline">Rotasi</span>
                        </button>
                    </div>
                </div>

                {showFilterPanel && (
                    <div className="pt-6 border-t border-slate-100  animate-slide-up">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-sm font-bold text-slate-800  flex items-center gap-2">
                                <Settings2 className="w-4 h-4 text-blue-500" />
                                Tetapan Data & Paparan
                            </h4>
                            <button
                                onClick={resetAllFilters}
                                className="text-[11px] font-bold flex items-center gap-1.5 text-slate-500 hover:text-red-500 bg-slate-100  hover:bg-red-50  px-3 py-1.5 rounded-lg transition-colors"
                            >
                                <RotateCcw className="w-3 h-3" /> Reset Semua
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Tapisan Data (Row Filters)</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                        <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value as any)}
                                        className="w-full pl-10 pr-8 py-2.5 bg-slate-50  border border-slate-200  rounded-xl text-xs font-bold text-slate-600  appearance-none focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:bg-white  transition-colors"
                                    >
                                        <option value="ALL">Semua Status</option>
                                        <option value={ProjectStatus.FASA_DRAF}>Fasa Draf</option>
                                        <option value={ProjectStatus.MENUNGGU_LANTIKAN}>Menunggu Lantikan</option>
                                        <option value={ProjectStatus.DALAM_PROSES}>Dalam Proses</option>
                                        <option value={ProjectStatus.PEMERIKSAAN_TAPAK}>Pemeriksaan Tapak</option>
                                        <option value={ProjectStatus.TUNTUTAN_BAYARAN}>Tuntutan Bayaran</option>
                                        <option value={ProjectStatus.SIAP}>Siap</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><Filter className="w-4 h-4 text-slate-400" /></div>
                                    <select value={filterPja} onChange={(e) => setFilterPja(e.target.value)} className="w-full pl-10 pr-8 py-2.5 bg-slate-50  border border-slate-200  rounded-xl text-xs font-bold text-slate-600  appearance-none focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:bg-white  transition-colors">
                                        <option value="ALL">Semua PJA</option>
                                        {users.filter(u => u.role === 'PJA').map(u => <option key={u.id} value={u.id}>{u.username.toUpperCase()}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><Filter className="w-4 h-4 text-slate-400" /></div>
                                    <select value={filterZon} onChange={(e) => setFilterZon(e.target.value)} className="w-full pl-10 pr-8 py-2.5 bg-slate-50  border border-slate-200  rounded-xl text-xs font-bold text-slate-600  appearance-none focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:bg-white  transition-colors">
                                        <option value="ALL">Semua Zon</option>
                                        {ZON_OPTIONS.map(z => <option key={z} value={z}>{z}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><Filter className="w-4 h-4 text-slate-400" /></div>
                                    <select value={filterBp} onChange={(e) => setFilterBp(e.target.value)} className="w-full pl-10 pr-8 py-2.5 bg-slate-50  border border-slate-200  rounded-xl text-xs font-bold text-slate-600  appearance-none focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:bg-white  transition-colors">
                                        <option value="ALL">Semua BP</option>
                                        {BP_OPTIONS.map(bp => <option key={bp} value={bp}>{bp}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><Filter className="w-4 h-4 text-slate-400" /></div>
                                    <select value={filterMukim} onChange={(e) => setFilterMukim(e.target.value)} className="w-full pl-10 pr-8 py-2.5 bg-slate-50  border border-slate-200  rounded-xl text-xs font-bold text-slate-600  appearance-none focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:bg-white  transition-colors">
                                        <option value="ALL">Semua Mukim</option>
                                        {MUKIM_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><Filter className="w-4 h-4 text-slate-400" /></div>
                                    <select
                                        value={filterVote}
                                        onChange={(e) => setFilterVote(e.target.value)}
                                        className="w-full pl-10 pr-8 py-2.5 bg-slate-50  border border-slate-200  rounded-xl text-xs font-bold text-slate-600  appearance-none focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:bg-white  transition-colors"
                                    >
                                        <option value="ALL">Semua Vot</option>
                                        {votesList.map(v => (
                                            <option key={v.code} value={v.code}>{v.code} - {v.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="mb-6 pt-6 border-t border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Penapisan Tarikh (Date Range)</div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <select
                                        value={filterDateType}
                                        onChange={(e) => setFilterDateType(e.target.value)}
                                        className="w-full pl-10 pr-8 py-2.5 bg-slate-50  border border-slate-200  rounded-xl text-xs font-bold text-slate-600  appearance-none focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:bg-white  transition-colors"
                                    >
                                        <option value="tarikhBuka">Tarikh Buka</option>
                                        <option value="tarikhLantikan">Tarikh Lantikan</option>
                                        <option value="tarikhMulaKontrak">Tarikh Mula Kontrak</option>
                                        <option value="tarikhTamatKontrak">Tarikh Tamat Kontrak</option>
                                        <option value="tarikhSiapSebenar">Tarikh Siap Sebenar</option>
                                        <option value="tarikhTuntutanBayaran">Tarikh Tuntutan</option>
                                        <option value="tarikhHantarKewangan">Tarikh Hantar Kewangan</option>
                                        <option value="tarikhPadanan">Tarikh Padanan</option>
                                        <option value="tarikhSerahTapak">Tarikh Serah Tapak</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <StrictDateInput
                                            name="filterDateStart"
                                            value={filterDateStart || ''}
                                            onChange={(e) => setFilterDateStart(e.target.value)}
                                            placeholder="Dari (DD/MM/YYYY)"
                                            className="w-full px-4 py-2.5 bg-slate-50  border border-slate-200  rounded-xl text-xs font-bold text-slate-600  outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    {(filterDateStart || filterDateEnd) && (
                                        <button
                                            onClick={() => { setFilterDateStart(null); setFilterDateEnd(null); }}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                            title="Kosongkan Tarikh"
                                        >
                                            <CalendarX className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <StrictDateInput
                                        name="filterDateEnd"
                                        value={filterDateEnd || ''}
                                        onChange={(e) => setFilterDateEnd(e.target.value)}
                                        placeholder="Hingga (DD/MM/YYYY)"
                                        className="w-full px-4 py-2.5 bg-slate-50  border border-slate-200  rounded-xl text-xs font-bold text-slate-600  outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-100  my-6"></div>

                        {viewMode === 'list' && (
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Paparan Kolum</div>
                                    <div className="flex gap-2">
                                        <button onClick={handleSelectAllColumns} className="text-[10px] font-bold px-2 py-1 bg-slate-100  rounded hover:bg-slate-200  text-slate-600  flex items-center gap-1"><Eye className="w-3 h-3" /> Semua</button>
                                        <button onClick={handleDeselectAllColumns} className="text-[10px] font-bold px-2 py-1 bg-slate-100  rounded hover:bg-slate-200  text-slate-600  flex items-center gap-1"><EyeOff className="w-3 h-3" /> Kosong</button>
                                        <button onClick={handleResetColumns} className="text-[10px] font-bold px-2 py-1 bg-slate-100  rounded hover:bg-slate-200  text-slate-600  flex items-center gap-1"><Layout className="w-3 h-3" /> Asal</button>
                                    </div>
                                </div>
                                <div className="bg-slate-50  p-4 rounded-2xl border border-slate-200">
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                        {columnDefs.map(col => (
                                            <label key={col.id} className="flex items-center gap-2 cursor-pointer group p-1.5 rounded-lg hover:bg-white  transition-colors select-none">
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${visibleColumns[col.id] ? 'bg-blue-500 border-blue-500' : 'bg-white  border-slate-300  group-hover:border-blue-400'}`}>
                                                    {visibleColumns[col.id] && <Check className="w-3 h-3 text-white stroke-[3]" />}
                                                </div>
                                                <input type="checkbox" className="hidden" checked={visibleColumns[col.id]} onChange={() => setVisibleColumns(prev => ({ ...prev, [col.id]: !prev[col.id] }))} />
                                                <span className={`text-[11px] font-bold truncate ${visibleColumns[col.id] ? 'text-slate-700' : 'text-slate-400'}`}>{col.label}</span>

                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {viewMode === 'group' && (
                            <div className="flex flex-col gap-4">
                                <div className="flex gap-4 items-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Paparan Kos:</span>
                                    <div className="flex bg-slate-100  rounded-lg p-1">
                                        <button onClick={() => setCostViewMode('contract')} className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${costViewMode === 'contract' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Harga Kontrak</button>
                                        <button onClick={() => setCostViewMode('actual')} className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${costViewMode === 'actual' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Harga Akhir</button>
                                        <button onClick={() => setCostViewMode('both')} className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${costViewMode === 'both' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Semua</button>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tapis Projek:</span>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <div className={`w-10 h-5 rounded-full p-1 transition-colors ${showSiap ? 'bg-blue-500' : 'bg-slate-300'}`}>
                                            <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${showSiap ? 'translate-x-5' : ''}`}></div>
                                        </div>
                                        <input type="checkbox" className="hidden" checked={showSiap} onChange={() => setShowSiap(!showSiap)} />

                                        <span className="text-xs font-bold text-slate-600">Tunjuk Projek Siap</span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <div className={`w-10 h-5 rounded-full p-1 transition-colors ${showTuntutan ? 'bg-blue-500' : 'bg-slate-300'}`}>
                                            <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${showTuntutan ? 'translate-x-5' : ''}`}></div>
                                        </div>
                                        <input type="checkbox" className="hidden" checked={showTuntutan} onChange={() => setShowTuntutan(!showTuntutan)} />

                                        <span className="text-xs font-bold text-slate-600">Tunjuk Tuntutan Bayaran</span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* List View with Pagination */}
            {viewMode === 'list' && (
                <div className="bg-white/95  border border-white/10 shadow-xl rounded-3xl shadow-xl border border-white/20  overflow-hidden min-h-[400px] flex flex-col">

                    {/* Top Pagination Controls */}
                    {filteredProjects.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b border-slate-200 bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="text-xs font-medium text-slate-500">
                                    Paparan <span className="font-bold text-slate-700">{Math.min(filteredProjects.length, (currentPage - 1) * itemsPerPage + 1)}</span> hingga <span className="font-bold text-slate-700">{Math.min(filteredProjects.length, currentPage * itemsPerPage)}</span> dari <span className="font-bold text-slate-700">{filteredProjects.length}</span> projek
                                </div>

                                {(sortKey !== 'tarikhBuka' || sortDirection !== 'desc') && (
                                    <button
                                        onClick={() => {
                                            setSortKey('tarikhBuka');
                                            setSortDirection('desc');
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                        Reset Susunan
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border border-slate-200  hover:bg-white  disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                                </button>

                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500">Muka</span>
                                    <input
                                        type="number"
                                        value={pageInput}
                                        onChange={handlePageInputChange}
                                        onBlur={handlePageInputBlur}
                                        onKeyDown={handlePageInputKeyDown}
                                        className="w-12 px-2 py-1.5 text-center text-xs font-bold bg-white  border border-slate-200  rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 shadow-sm"
                                    />
                                    <span className="text-xs text-slate-500">dari {totalPages}</span>
                                </div>

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg border border-slate-200  hover:bg-white  disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4 text-slate-600" />
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto flex-1">
                        <table className="w-full">
                            <thead className="bg-slate-50/80   sticky top-0 z-20 border-b border-slate-200">
                                <tr>
                                    {columnDefs.filter(c => visibleColumns[c.id]).map(col => {
                                        const isSorted = sortKey === col.id;
                                        return (
                                            <th
                                                key={col.id}
                                                onClick={() => {
                                                    if (isSorted) {
                                                        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                                                    } else {
                                                        setSortKey(col.id);
                                                        setSortDirection('asc');
                                                    }
                                                }}
                                                className="px-6 py-4 text-left text-xs font-extrabold text-slate-500 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-slate-100/50 transition-colors group"
                                            >
                                                <div className="flex items-center gap-2">
                                                    {col.label}
                                                    <div className={`transition-opacity ${isSorted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                        {isSorted ? (
                                                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                                                        ) : (
                                                            <ArrowUpDown className="w-3 h-3 text-slate-300" />
                                                        )}
                                                    </div>
                                                </div>
                                            </th>
                                        );
                                    })}
                                    <th className="px-6 py-4 w-16 bg-slate-50/80"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedProjects.length > 0 ? (
                                    paginatedProjects.map((project) => (
                                        <tr
                                            key={project.id}
                                            onMouseDown={handleMouseDown}
                                            onMouseUp={handleMouseUp}
                                            onMouseLeave={handleMouseLeave}
                                            onClick={() => handleProjectClick(project)}
                                            className="group hover:bg-slate-50/80  transition-colors duration-200 cursor-pointer"
                                        >
                                            {visibleColumns.noFail && <td className="px-6 py-4 whitespace-nowrap"><div className="font-bold text-slate-900  text-sm">{project.noFail}</div><div className="text-[10px] text-slate-400 font-mono mt-0.5">{formatDate(project.tarikhBuka)}</div></td>}
                                            {visibleColumns.namaProjek && <td className="px-6 py-4 min-w-[300px]"><div className="text-sm font-medium text-slate-800  leading-relaxed whitespace-pre-wrap">{project.namaProjek}</div></td>}
                                            {visibleColumns.pjaId && <td className="px-6 py-4 whitespace-nowrap">
                                                {(() => {
                                                    const pja = getPjaUser(project.pjaId);
                                                    return (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-black text-white shrink-0 overflow-hidden shadow-sm">
                                                                {pja?.avatarUrl ? (
                                                                    <img src={pja.avatarUrl} alt={pja.username} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    pja?.username?.charAt(0).toUpperCase() || 'P'
                                                                )}
                                                            </div>
                                                            <span className="text-xs font-bold text-slate-600">{pja?.username?.toUpperCase() || '-'}</span>
                                                        </div>
                                                    );
                                                })()}
                                            </td>}
                                            {visibleColumns.noAduan && <td className="px-6 py-4"><div className="flex flex-col gap-1 max-h-[100px] overflow-y-auto custom-scrollbar">{project.noAduan ? project.noAduan.split(/[,;\n]/).map((aduan, idx) => { const cleanAduan = aduan.trim(); if (!cleanAduan) return null; return <div key={idx} className="text-[11px] text-slate-600  leading-tight">{cleanAduan}</div>; }) : <span className="text-xs text-slate-400">-</span>}</div></td>}
                                            {visibleColumns.lokasi && <td className="px-6 py-4"><div className="flex flex-col gap-1 max-h-[150px] overflow-y-auto custom-scrollbar min-w-[200px]">{project.lokasi ? project.lokasi.split('\n').map((loc, idx) => { const cleanLoc = loc.trim(); if (!cleanLoc) return null; return <div key={idx} className="text-[11px] text-slate-600  leading-tight mb-1 whitespace-pre-wrap">{cleanLoc}</div>; }) : <span className="text-xs text-slate-400">-</span>}</div></td>}
                                            {visibleColumns.bp && <td className="px-6 py-4 text-xs text-slate-500">{project.bp}</td>}
                                            {visibleColumns.zon && <td className="px-6 py-4 text-xs text-slate-500">{project.zon}</td>}
                                            {visibleColumns.mukim && <td className="px-6 py-4 text-xs text-slate-500">{project.mukim}</td>}
                                            {visibleColumns.tarikhBuka && <td className="px-6 py-4 text-xs text-slate-500">{formatDate(project.tarikhBuka)}</td>}
                                            {visibleColumns.namaSyarikat && <td className="px-6 py-4 min-w-[200px]"><div className="text-xs font-bold text-slate-700  leading-relaxed">{project.namaSyarikat || <span className="text-slate-400 italic font-normal">Belum Lantik</span>}</div></td>}
                                            {visibleColumns.noVote && <td className="px-6 py-4 text-xs text-slate-500">{project.noVote}</td>}
                                            {visibleColumns.noSebutharga && <td className="px-6 py-4 text-xs text-slate-500">{project.noSebutharga}</td>}
                                            {visibleColumns.noInden && <td className="px-6 py-4 text-xs text-slate-500">{project.noInden}</td>}
                                            {visibleColumns.noBpp && <td className="px-6 py-4 text-xs text-slate-500">{project.noBpp}</td>}
                                            {visibleColumns.tempohKontrak && <td className="px-6 py-4 text-xs text-slate-500">{project.tempohKontrak}</td>}
                                            {visibleColumns.status && <td className="px-6 py-4 whitespace-nowrap text-center"><div className="flex flex-col items-center justify-center gap-2"><CircularProgress value={project.peratusSiap || 0} size={34} strokeWidth={3} /><span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border shadow-sm ${getStatusColor(project.status)} ${project.status === ProjectStatus.DALAM_PROSES ? '' : ''}`}><span className={`w-1.5 h-1.5 rounded-full ${project.status === ProjectStatus.DALAM_PROSES ? 'bg-blue-500' : project.status === ProjectStatus.SIAP ? 'bg-blue-500' : 'bg-yellow-500'}`}></span>{getStatusLabel(project.status)}</span></div></td>}
                                            {visibleColumns.prestasi && <td className="px-6 py-4 text-center font-bold text-slate-700">{project.prestasi || '-'}</td>}
                                            {visibleColumns.kosProjek && <td className="px-6 py-4 text-right text-xs font-bold text-blue-600">{formatCurrency(project.kosProjek)}</td>}
                                            {visibleColumns.kosSebenar && <td className="px-6 py-4 text-right text-xs font-bold text-slate-600">{formatCurrency(getHargaAkhir(project))}</td>}
                                            {visibleColumns.wangTahanan && <td className="px-6 py-4 text-right text-xs font-bold text-slate-600">{formatCurrency(project.wangTahanan)}</td>}
                                            {visibleColumns.ladAmount && <td className="px-6 py-4 text-right text-xs font-bold text-red-500">{formatCurrency(project.ladAmount)}</td>}
                                            {visibleColumns.ladDays && <td className="px-6 py-4 text-center text-xs text-slate-500">{project.ladDays || 0}</td>}
                                            {visibleColumns.locAmount && <td className="px-6 py-4 text-right text-xs font-bold text-amber-500">{formatCurrency(project.locAmount)}</td>}
                                            {visibleColumns.locDays && <td className="px-6 py-4 text-center text-xs text-slate-500">{project.locDays || 0}</td>}
                                            {visibleColumns.tarikhLantikan && <td className="px-6 py-4 text-xs text-slate-500">{formatDate(project.tarikhLantikan)}</td>}
                                            {visibleColumns.tarikhCetakanBpp && <td className="px-6 py-4 text-xs text-slate-500">{formatDate(project.tarikhCetakanBpp)}</td>}
                                            {visibleColumns.tarikhMulaKontrak && <td className="px-6 py-4 text-xs text-slate-500">{formatDate(project.tarikhMulaKontrak)}</td>}
                                            {visibleColumns.tarikhTamatKontrak && <td className="px-6 py-4 text-xs text-slate-500">{formatDate(project.tarikhTamatKontrak)}</td>}
                                            {visibleColumns.tarikhSerahTapak && <td className="px-6 py-4 text-xs text-slate-500">{formatDate(project.tarikhSerahTapak)}</td>}
                                            {visibleColumns.tarikhMulaKerja && <td className="px-6 py-4 text-xs text-slate-500">{formatDate(project.tarikhMulaKerja)}</td>}
                                            {visibleColumns.tarikhSiapSebenar && <td className="px-6 py-4 text-xs text-slate-500">{formatDate(project.tarikhSiapSebenar)}</td>}
                                            {visibleColumns.tarikhTuntutanBayaran && <td className="px-6 py-4 text-xs text-slate-500">{formatDate(project.tarikhTuntutanBayaran)}</td>}
                                            {visibleColumns.tarikhHantarKewangan && <td className="px-6 py-4 text-xs text-slate-500">{formatDate(project.tarikhHantarKewangan)}</td>}
                                            {visibleColumns.tarikhPadanan && <td className="px-6 py-4 text-xs text-slate-500">{formatDate(project.tarikhPadanan)}</td>}
                                            {visibleColumns.iso && <td className="px-6 py-4 text-xs text-slate-500">{project.iso}</td>}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={(e) => { e.stopPropagation(); onEditProject(project); }} className="p-2 bg-white  rounded-lg text-blue-600 hover:bg-blue-50 shadow-sm border border-slate-100"><ArrowUpRight className="w-4 h-4" /></button>
                                                    {user.role !== 'PJA' && (
                                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(project); }} className="p-2 bg-white  rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 shadow-sm border border-slate-100"><Trash2 className="w-4 h-4" /></button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={Object.values(visibleColumns).filter(Boolean).length + 1} className="px-6 py-12 text-center text-slate-400">
                                            Tiada projek dijumpai.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Group View */}
            {viewMode === 'group' && (
                <div className="space-y-6">
                    {groupedProjects.map((group, idx) => {
                        const votesInGroup = Object.keys(group.projectsByVote).sort();
                        return (
                            <div key={group.company} className="relative overflow-hidden rounded-3xl bg-white/60   border border-white/20  shadow-sm transition-colors hover:shadow-md">
                                <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between cursor-pointer hover:bg-slate-50  transition-colors gap-4" onClick={() => toggleCompany(group.company)}>
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0"><Building2 className="w-6 h-6" /></div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-bold text-slate-900  truncate flex items-center gap-3">{idx + 1}. {group.company} {group.count > 0 ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200  text-slate-600  font-bold uppercase tracking-wider">{group.count} Fail</span> : <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200  text-slate-400  font-bold uppercase tracking-wider italic">Tiada Projek</span>}</h3>
                                            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-1.5 text-xs font-medium text-slate-500">
                                                <div className="flex gap-4 border-l border-slate-200  pl-4 ml-2">
                                                    {(costViewMode === 'contract' || costViewMode === 'both') && <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div><span className="opacity-80">Harga Kontrak:</span> <strong className="text-blue-700  font-mono text-sm">{formatCurrency(group.totalCost)}</strong></span>}
                                                    {(costViewMode === 'actual' || costViewMode === 'both') && <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div><span className="opacity-80">Harga Akhir:</span><strong className="text-blue-700  font-mono text-sm">{formatCurrency(group.totalHargaAkhir)}</strong></span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${expandedCompanies[group.company] ? 'rotate-180' : ''}`} />
                                </div>

                                {expandedCompanies[group.company] && group.count > 0 && (
                                    <div className="border-t border-slate-100  animate-slide-up bg-slate-50/30  overflow-x-auto">
                                        <div className="w-full">
                                            {votesInGroup.map(voteCode => {
                                                const voteData = group.projectsByVote[voteCode];
                                                return (
                                                    <div key={voteCode} className="border-b border-slate-200  last:border-b-0">
                                                        <div className="px-6 py-2 bg-slate-100/50  flex items-center justify-between">
                                                            <div className="text-[11px] font-bold text-slate-500  uppercase tracking-widest flex items-center gap-2"><span className="bg-slate-200  px-2 py-0.5 rounded text-slate-700">{voteCode}</span><span>{getVoteName(voteCode)}</span></div>
                                                        </div>
                                                        <table className="w-full text-sm">
                                                            <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                                                                <tr>
                                                                    <th className="px-6 py-3 text-center font-extrabold w-[40px]">Bil</th>
                                                                    <th className="px-6 py-3 text-left font-extrabold w-[350px]">No. Fail / Tajuk Projek</th>
                                                                    <th className="px-6 py-3 text-center font-extrabold w-[100px]">Bulan</th>
                                                                    <th className="px-6 py-3 text-center font-extrabold w-[80px]">PJA</th>
                                                                    <th className="px-6 py-3 text-left font-extrabold">Lokasi</th>
                                                                    <th className="px-6 py-3 text-center font-extrabold">Tarikh (Mula - Tamat)</th>
                                                                    <th className="px-6 py-3 text-right font-extrabold">Kos</th>
                                                                    <th className="px-6 py-3 text-center font-extrabold">Status</th>
                                                                    <th className="px-6 py-3"></th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100">
                                                                {voteData.projects.map((p, pIdx) => {
                                                                    const pjaUser = getPjaUser(p.pjaId);
                                                                    const hargaAkhir = getHargaAkhir(p);

                                                                    return (
                                                                        <tr
                                                                            key={p.id}
                                                                            className="hover:bg-white/60 transition-colors group/row"
                                                                        >
                                                                            <td className="px-6 py-3 text-center align-top text-xs font-bold text-slate-400">{pIdx + 1}</td>
                                                                            <td className="px-6 py-3 align-top"><div className="font-mono font-bold text-xs text-slate-600  mb-1">{p.noFail}</div><div className="font-medium text-slate-800  leading-relaxed text-[11px] opacity-80 whitespace-pre-wrap">{p.namaProjek}</div></td>
                                                                            <td className="px-6 py-3 text-center align-top"><span className="px-3 py-1 rounded-lg bg-white  border border-slate-200  text-xs font-bold text-slate-600  shadow-sm">{p.bulan || '-'}</span></td>
                                                                            <td className="px-6 py-3 text-center align-top"><span className="text-[10px] font-black text-slate-500  bg-slate-100  px-2 py-0.5 rounded shadow-sm">{pjaUser?.username.toUpperCase() || '-'}</span></td>
                                                                            <td className="px-6 py-3 text-xs max-w-[200px] align-top"><div className="text-slate-600  whitespace-pre-wrap" title={p.lokasi}>{p.lokasi ? p.lokasi : '-'}</div></td>
                                                                            <td className="px-6 py-3 text-center text-[10px] font-mono text-slate-500 align-top">{formatDate(p.tarikhMulaKontrak)}<br />-<br />{formatDate(p.tarikhTamatKontrak)}</td>
                                                                            <td className="px-6 py-3 text-right font-mono font-bold text-xs align-top">
                                                                                <div className={costViewMode === 'actual' ? 'hidden' : 'text-blue-600'}>{formatCurrency(p.kosProjek)}</div>
                                                                                <div className={costViewMode === 'contract' ? 'hidden' : 'text-blue-600'}>{formatCurrency(getHargaAkhir(p))}</div>
                                                                            </td>
                                                                            <td className="px-6 py-3 text-center align-top">
                                                                                <div className="flex flex-col items-center gap-1">
                                                                                    {canQuickEdit ? (
                                                                                        <>
                                                                                            <div className="flex items-center gap-1">
                                                                                                <input
                                                                                                    type="number"
                                                                                                    min="0"
                                                                                                    max="100"
                                                                                                    value={p.peratusSiap ?? 0}
                                                                                                    onChange={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                        updateProject({ id: p.id, updates: { peratusSiap: parseInt(e.target.value) || 0 } });
                                                                                                    }}
                                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                                    className="w-12 text-center text-[10px] font-bold text-blue-600 bg-white border border-blue-200 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-blue-500 transition-shadow"
                                                                                                />
                                                                                                <span className="text-[10px] font-bold text-blue-600">%</span>
                                                                                            </div>
                                                                                            <select
                                                                                                value={p.status}
                                                                                                onChange={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    updateProject({ id: p.id, updates: { status: e.target.value as ProjectStatus } });
                                                                                                }}
                                                                                                onClick={(e) => e.stopPropagation()}
                                                                                                className={`text-[9px] px-1 py-0.5 rounded-full font-bold uppercase tracking-wider border shadow-sm outline-none cursor-pointer ${getStatusColor(p.status)}`}
                                                                                            >
                                                                                                {Object.values(ProjectStatus).map(status => (
                                                                                                    <option key={status} value={status}>{getStatusLabel(status)}</option>
                                                                                                ))}
                                                                                            </select>
                                                                                        </>
                                                                                    ) : (
                                                                                        <>
                                                                                            <span className="text-[10px] font-bold text-blue-600">{p.peratusSiap}%</span>
                                                                                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border shadow-sm ${getStatusColor(p.status)}`}>{getStatusLabel(p.status)}</span>
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-6 py-3 text-right align-top">
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); onEditProject(p); }}
                                                                                    className="p-2 rounded-lg bg-white  text-blue-600 shadow-sm opacity-0 group-hover/row:opacity-100 transition-colors"
                                                                                >
                                                                                    <ArrowUpRight className="w-4 h-4" />
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                                <tr className="bg-slate-50  font-bold border-t border-slate-200">
                                                                    <td colSpan={6} className="px-6 py-3 text-right text-[10px] uppercase text-slate-500 tracking-wider">Jumlah</td>
                                                                    <td className="px-6 py-3 text-right font-mono text-xs text-slate-800">
                                                                        {costViewMode === 'contract' ? formatCurrency(voteData.subtotalContract) : costViewMode === 'actual' ? formatCurrency(voteData.subtotalAkhir) : (<div><div>{formatCurrency(voteData.subtotalContract)}</div><div className="text-[10px] opacity-60">{formatCurrency(voteData.subtotalAkhir)}</div></div>)}
                                                                    </td>
                                                                    <td colSpan={2}></td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                );
                                            })}
                                            <div className="px-6 py-4 bg-blue-50/50  flex justify-end items-center gap-6 border-t border-blue-100">
                                                <div className="flex items-center gap-2 mr-auto">
                                                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                                                        :</span>
                                                    <span className="text-xs font-black text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm">{group.count}</span>
                                                </div>
                                                <span className="text-[11px] font-bold uppercase text-blue-600  tracking-wider">Jumlah Keseluruhan ({group.company})</span>
                                                <span className="text-sm font-black font-mono text-blue-700">{costViewMode === 'actual' ? formatCurrency(group.totalHargaAkhir) : formatCurrency(group.totalCost)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {expandedCompanies[group.company] && group.count === 0 && <div className="p-8 text-center text-slate-400 italic text-sm bg-slate-50/30  border-t border-slate-100">Tiada projek untuk syarikat ini.</div>}
                            </div>
                        );
                    })}

                    {/* Integrated Summary Card (Vertical) */}
                    {groupedProjects.length > 0 && (
                        <div className="relative overflow-hidden rounded-3xl bg-white  border border-slate-200  shadow-xl p-6 mt-8 w-full mx-auto">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100"><div className="p-3 bg-slate-100  rounded-xl shadow-sm text-blue-600"><Calculator className="w-5 h-5" /></div><h4 className="text-sm font-bold text-slate-800  uppercase tracking-widest">Rumusan Kewangan ({selectedYear})</h4></div>
                            <div className="overflow-hidden rounded-xl border border-slate-200">
                                <table className="w-full text-xs">
                                    <thead className="bg-slate-50">
                                        <tr><th className="py-3 px-4 text-left font-extrabold text-slate-500  uppercase tracking-wider w-20">Kod Vot</th><th className="py-3 px-4 text-left font-extrabold text-slate-500  uppercase tracking-wider">Butiran</th><th className="py-3 px-4 text-center font-extrabold text-slate-500  uppercase tracking-wider">Bil. Projek</th><th className="py-3 px-4 text-right font-extrabold text-slate-500  uppercase tracking-wider">Peruntukan</th><th className="py-3 px-4 text-right font-extrabold text-slate-500  uppercase tracking-wider">Belanja</th><th className="py-3 px-4 text-right font-extrabold text-slate-500  uppercase tracking-wider">Baki</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {Object.entries(financialSummary).map(([voteCode, data]) => (
                                            <tr key={voteCode} className="hover:bg-slate-50">
                                                <td className="py-3 px-4 font-mono font-bold text-slate-600">{voteCode}</td><td className="py-3 px-4 font-medium text-slate-700">{getVoteName(voteCode)}</td><td className="py-3 px-4 text-center font-bold text-slate-600">{data.projectCount}</td><td className="py-3 px-4 text-right font-mono text-slate-600">{formatCurrency((data as any).allocated)}</td><td className="py-3 px-4 text-right font-mono text-red-500">-{formatCurrency((data as any).used)}</td><td className="py-3 px-4 text-right font-mono font-bold text-blue-600">{formatCurrency((data as any).allocated - (data as any).used)}</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-slate-50  font-bold border-t-2 border-slate-200"><td colSpan={2} className="py-3 px-4 text-right uppercase text-[10px] text-slate-500 tracking-wider">Jumlah Besar</td><td className="py-3 px-4 text-center font-bold text-slate-800">{(Object.values(financialSummary) as any[]).reduce((a, b) => a + b.projectCount, 0)}</td><td className="py-3 px-4 text-right font-mono text-slate-800">{formatCurrency((Object.values(financialSummary) as any[]).reduce((a, b) => a + b.allocated, 0))}</td><td className="py-3 px-4 text-right font-mono text-red-500">-{formatCurrency((Object.values(financialSummary) as any[]).reduce((a, b) => a + b.used, 0))}</td><td className="py-3 px-4 text-right font-mono text-blue-600">{formatCurrency((Object.values(financialSummary) as any[]).reduce((a, b) => a + (b.allocated - b.used), 0))}</td></tr>
                                        <tr className="bg-blue-50/30  font-bold border-t border-blue-100">
                                            <td colSpan={4} className="py-3 px-4 text-right uppercase text-[10px] text-blue-600 tracking-wider">Jumlah Projek Keseluruhan</td>
                                            <td colSpan={2} className="py-3 px-4 text-right font-mono text-blue-700">{filteredProjects.length} Projek</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>                            <div className="mt-6 flex flex-col gap-4 border-t border-slate-200  pt-4">
                                <div className="flex items-center justify-between text-xs"><span className="font-bold text-slate-500 uppercase">Tolak Lain-lain (Sebutharga)</span><div className="flex items-center gap-2"><span className="text-slate-400 font-bold">RM</span><input type="number" value={manualFinancials.outsource || ''} onChange={e => setManualFinancials(prev => ({ ...prev, outsource: parseFloat(e.target.value) }))} className="w-24 text-right bg-slate-50  border border-slate-200  rounded px-2 py-1 outline-none font-mono font-bold" placeholder="0.00" /></div></div>
                                <div className="flex items-center justify-between text-xs"><span className="font-bold text-slate-500 uppercase">Tolak Lantikan YDP/TYDP</span><div className="flex items-center gap-2"><span className="text-slate-400 font-bold">RM</span><input type="number" value={manualFinancials.ydp || ''} onChange={e => setManualFinancials(prev => ({ ...prev, ydp: parseFloat(e.target.value) }))} className="w-24 text-right bg-slate-50  border border-slate-200  rounded px-2 py-1 outline-none font-mono font-bold" placeholder="0.00" /></div></div>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-200  bg-blue-50/50  -mx-6 px-6 py-4 -mb-6 rounded-b-3xl">
                                    <div className="flex items-center gap-3"><button onClick={saveManualFinancials} disabled={isSavingFinancials} className="px-4 py-2 bg-slate-800  text-white  rounded-lg text-[10px] font-bold shadow-md flex items-center gap-1 disabled:opacity-70"><Save className="w-3 h-3" /> Simpan</button></div>
                                    <div className="text-right"><div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Baki Bersih</div><div className="font-mono font-black text-xl text-blue-600  leading-none">{formatCurrency((Object.values(financialSummary) as any[]).reduce((a, b) => a + (b.allocated - b.used), 0) - (manualFinancials.outsource || 0) - (manualFinancials.ydp || 0))}</div></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {groupedProjects.length === 0 && <div className="text-center text-slate-400 italic py-12 bg-white/95  border border-white/10 shadow-xl rounded-3xl">Tiada data syarikat untuk dipaparkan.</div>}
                </div>
            )}

            {/* Delete Modal */}
            {projectToDelete && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50  animate-fade-in" onClick={cancelDelete}>
                    <div className="bg-white  rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200  transform scale-100 transition-colors animate-slide-up relative" onClick={e => e.stopPropagation()}>
                        <button onClick={cancelDelete} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600  transition-colors p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button>
                        <div className="flex flex-col items-center text-center pt-2">
                            <div className="w-20 h-20 bg-red-50  rounded-full flex items-center justify-center mb-6 text-red-500"><div className="w-14 h-14 bg-red-100  rounded-full flex items-center justify-center"><AlertTriangle className="w-8 h-8 stroke-[1.5]" /></div></div>
                            <h3 className="text-xl font-bold text-slate-900  mb-2 font-jakarta">Padam Projek?</h3>
                            <p className="text-slate-500  mb-8 text-sm leading-relaxed px-4">Adakah anda pasti mahu memadam <span className="font-bold text-slate-900  block mt-1 p-2 bg-slate-50  rounded-lg border border-slate-200  break-words">{projectToDelete.noFail}</span></p>
                            <div className="flex gap-3 w-full">
                                <button onClick={cancelDelete} className="flex-1 py-3.5 px-4 bg-white  text-slate-700  rounded-xl font-bold hover:bg-slate-50  transition-colors border border-slate-200  shadow-sm hover:shadow-md">Batal</button>
                                <button onClick={confirmDelete} disabled={deleteCountdown > 0} className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-white transition-colors flex items-center justify-center gap-2 shadow-lg ${deleteCountdown > 0 ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 shadow-red-600/30 hover:-translate-y-0.5'}`}>
                                    <Trash2 className="w-4 h-4" />
                                    <span>{deleteCountdown > 0 ? `Tunggu (${deleteCountdown})` : 'Ya, Padam'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* PDF Export Modal with Progress */}
            {isExportModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60  animate-fade-in" onClick={() => setIsExportModalOpen(false)}>
                    <div className="bg-white  rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200  transform scale-100 transition-colors animate-slide-up relative" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900  flex items-center gap-2">
                                <FileText className="w-6 h-6 text-blue-600" />
                                Laporan Panel Kontraktor
                            </h3>
                            <button onClick={() => setIsExportModalOpen(false)} className="text-slate-400 hover:text-slate-600  p-1 rounded-full hover:bg-slate-100  transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {isGeneratingPdf ? (
                                <div className="flex flex-col items-center justify-center py-4">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                                    <p className="text-sm font-bold text-slate-700">Menjana PDF... {generationProgress}%</p>
                                    <div className="w-full bg-slate-100  h-2 rounded-full mt-2 overflow-hidden">
                                        <div className="bg-blue-500 h-full transition-colors duration-300" style={{ width: `${generationProgress}%` }}></div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 font-jakarta pl-1">
                                            Bilangan Mesyuarat
                                        </label>
                                        <input
                                            type="text"
                                            value={exportBilMesyuarat}
                                            onChange={e => setExportBilMesyuarat(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50  border border-slate-200  outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                            placeholder="cth: 01/01/2025"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={handleExportRealPDF}
                                            disabled={isGeneratingPdf}
                                            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 disabled:opacity-70 group"
                                        >
                                            <FileText className="w-4 h-4" />
                                            PDF
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default ProjectsList;
