import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Project, ProjectStatus, formatCurrency, getStatusColor, formatDate, User, BP_OPTIONS, ZON_OPTIONS, VoteDefinition, formatDateMalay } from '../types';
import { mockService } from '../services/mockService';
import { Search, Plus, List, Grid, Filter, Download, Trash2, AlertTriangle, X, ChevronDown, Check, SlidersHorizontal, ArrowUpRight, RotateCcw, Settings2, Eye, EyeOff, Layout, DollarSign, Calculator, Save, Building2, Briefcase, FileText, Loader2, Calendar, FileImage } from 'lucide-react';

interface ProjectsListProps {
  projects: Project[];
  selectedYear: number;
  onAddProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
}

interface CompanyGroupData {
  company: string;
  projects: Project[];
  totalCost: number;
  totalActualCost: number;
  count: number;
  // Group projects by Vote Code for display
  projectsByVote: Record<string, {
      projects: Project[];
      subtotalContract: number;
      subtotalActual: number;
  }>;
}

// Circular Progress Component
const CircularProgress = ({ value, size = 36, strokeWidth = 3 }: { value: number, size?: number, strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  
  const colorClass = "text-emerald-500";
  const strokeClass = "stroke-emerald-500";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-slate-200 dark:stroke-slate-700 fill-none"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={`${strokeClass} fill-none transition-all duration-1000 ease-out`}
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

const ProjectsList: React.FC<ProjectsListProps> = ({ projects, selectedYear, onAddProject, onEditProject, onDeleteProject }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [votesList, setVotesList] = useState<VoteDefinition[]>([]);
  
  // View & Data States
  const [viewMode, setViewMode] = useState<'list' | 'group'>('list');
  const [expandedCompanies, setExpandedCompanies] = useState<Record<string, boolean>>({});
  const [companyOrder, setCompanyOrder] = useState<string[]>([]); // Custom Sort Order
  const [costViewMode, setCostViewMode] = useState<'contract' | 'actual' | 'both'>('contract'); // Toggle for financial view
  
  // New States for Syarikat View
  const [showSiap, setShowSiap] = useState(true); // Toggle for Siap projects in Group view

  // Manual Financials for Summary Footer
  const [manualFinancials, setManualFinancials] = useState<{ outsource: number, ydp: number }>({ outsource: 0, ydp: 0 });
  const [isSavingFinancials, setIsSavingFinancials] = useState(false);
  
  // Filter States
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'ALL'>('ALL');
  const [filterPja, setFilterPja] = useState<string>('ALL');
  const [filterZon, setFilterZon] = useState<string>('ALL');
  const [filterBp, setFilterBp] = useState<string>('ALL');
  const [filterVote, setFilterVote] = useState<string>('ALL'); // New Filter State
  
  // UI States
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleteCountdown, setDeleteCountdown] = useState(0);

  // PDF Export State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportBilMesyuarat, setExportBilMesyuarat] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Load Data based on Selected Year Prop
  useEffect(() => {
    setUsers(mockService.getUsers());
    // Directly fetch votes and manuals for the explicit year, regardless of project list content
    setVotesList(mockService.getVotes(selectedYear));
    setCompanyOrder(mockService.getCompanyOrder(selectedYear));
    setManualFinancials(mockService.getManualFinancials(selectedYear));
  }, [selectedYear]);

  // Column Definitions
  const columnDefs = [
    { id: 'noFail', label: 'No. Fail', group: 'Asas', default: true },
    { id: 'namaProjek', label: 'Nama Projek', group: 'Asas', default: true },
    { id: 'pjaId', label: 'PJA', group: 'Asas', default: true },
    { id: 'noAduan', label: 'Aduan', group: 'Asas', default: true },
    { id: 'lokasi', label: 'Lokasi', group: 'Asas', default: false },
    { id: 'bp', label: 'BP', group: 'Asas', default: false },
    { id: 'zon', label: 'Zon', group: 'Asas', default: false },
    { id: 'tarikhBuka', label: 'Tarikh Buka', group: 'Asas', default: false },
    { id: 'namaSyarikat', label: 'Nama Syarikat', group: 'Kontrak', default: true },
    { id: 'noVote', label: 'No. Vot', group: 'Kontrak', default: false },
    { id: 'noSebutharga', label: 'No. Sebutharga', group: 'Kontrak', default: false },
    { id: 'noInden', label: 'No. Inden', group: 'Kontrak', default: false },
    { id: 'noBpp', label: 'No. BPP', group: 'Kontrak', default: false },
    { id: 'tempohKontrak', label: 'Tempoh', group: 'Kontrak', default: false },
    { id: 'status', label: 'Status & Progress', group: 'Status', default: true },
    { id: 'kosProjek', label: 'Kos Projek', group: 'Kewangan', default: false },
    { id: 'kosSebenar', label: 'Kos Sebenar', group: 'Kewangan', default: false },
    { id: 'wangTahanan', label: 'Wang Tahanan', group: 'Kewangan', default: false },
    { id: 'ladAmount', label: 'LAD (RM)', group: 'Kewangan', default: false },
    { id: 'ladDays', label: 'Hari LAD', group: 'Kewangan', default: false },
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
      await mockService.saveManualFinancials(selectedYear, manualFinancials);
      setTimeout(() => setIsSavingFinancials(false), 500);
  };

  // Filter Logic
  const resetAllFilters = () => {
    setFilterStatus('ALL');
    setFilterPja('ALL');
    setFilterZon('ALL');
    setFilterBp('ALL');
    setFilterVote('ALL'); // Reset New Filter
    setSearchTerm('');
    setShowSiap(true);
    handleResetColumns();
  };

  const activeFilterCount = [
    filterStatus !== 'ALL',
    filterPja !== 'ALL',
    filterZon !== 'ALL',
    filterBp !== 'ALL',
    filterVote !== 'ALL' // Count New Filter
  ].filter(Boolean).length;

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = 
        p.noFail.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.namaProjek.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.namaSyarikat || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;
      const matchesPja = filterPja === 'ALL' || p.pjaId === Number(filterPja);
      const matchesZon = filterZon === 'ALL' || p.zon === filterZon;
      const matchesBp = filterBp === 'ALL' || p.bp === filterBp;
      const matchesVote = filterVote === 'ALL' || p.noVote === filterVote; // New Filter logic
      
      return matchesSearch && matchesStatus && matchesPja && matchesZon && matchesBp && matchesVote;
    });
  }, [projects, searchTerm, filterStatus, filterPja, filterZon, filterBp, filterVote]);

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
        return a.localeCompare(b);
    });

    sortedCompanies.forEach(compName => {
        let compProjects = filteredProjects.filter(p => p.namaSyarikat === compName);

        if (!showSiap) {
            compProjects = compProjects.filter(p => p.status !== ProjectStatus.SIAP);
        }

        const group: CompanyGroupData = {
            company: compName,
            projects: compProjects,
            totalCost: 0,
            totalActualCost: 0,
            count: 0,
            projectsByVote: {}
        };

        compProjects.forEach(p => {
            group.totalCost += (p.kosProjek || 0);
            group.totalActualCost += (p.kosSebenar || 0);
            group.count += 1;

            const voteCode = p.noVote || 'TIADA VOT';
            if (!group.projectsByVote[voteCode]) {
                group.projectsByVote[voteCode] = { projects: [], subtotalContract: 0, subtotalActual: 0 };
            }
            group.projectsByVote[voteCode].projects.push(p);
            group.projectsByVote[voteCode].subtotalContract += (p.kosProjek || 0);
            group.projectsByVote[voteCode].subtotalActual += (p.kosSebenar || 0);
        });

        grouped.push(group);
    });
    
    return grouped;
  }, [filteredProjects, companyOrder, showSiap]);

  const exportToExcel = () => {
    // 1. Build Headers
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

    // 2. Build Rows
    const rows = filteredProjects.map(p => {
        return activeCols.map(c => {
             if (c.id === 'status') {
                 const statusText = p.status ? p.status.replace(/_/g, ' ') : '';
                 const progressText = p.peratusSiap !== undefined ? p.peratusSiap : 0;
                 return `"${statusText}","${progressText}"`;
             }

             // @ts-ignore
             let val = p[c.id];
             
             if (c.id === 'pjaId') {
                 const u = users.find(u => u.id === val);
                 val = u ? u.username : '';
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
      const summary: Record<string, { allocated: number; used: number }> = {};
      
      // Init with all vote definitions
      votesList.forEach(v => {
          summary[v.code] = { allocated: v.allocation, used: 0 };
      });

      // Sum usage from filtered projects based on TOGGLE STATE
      filteredProjects.forEach(p => {
          if (p.noVote) {
              if (!summary[p.noVote]) {
                  summary[p.noVote] = { allocated: 0, used: 0 };
              }
              
              let costToAdd = 0;
              if (costViewMode === 'contract') {
                  costToAdd = p.kosProjek || 0;
              } else if (costViewMode === 'actual') {
                  costToAdd = p.kosSebenar || 0;
              } else {
                  // Both/Default: Use actual if available as it represents truer spending, else contract
                  costToAdd = p.kosSebenar || p.kosProjek || 0;
              }

              summary[p.noVote].used += costToAdd;
          }
      });

      return summary;
  }, [filteredProjects, votesList, costViewMode]);

  // --- Handle "REAL" PDF Generation using jsPDF + AutoTable ---
  const handleExportRealPDF = async () => {
      if (!exportBilMesyuarat) {
          alert('Sila masukkan Bil. Mesyuarat.');
          return;
      }
      setIsGeneratingPdf(true);
      setGenerationProgress(10); // Start progress

      try {
          // @ts-ignore
          const { jsPDF } = window.jspdf;
          const doc = new jsPDF('p', 'mm', 'a4');
          
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          const marginX = 10;
          let currentY = 10;

          // Helper: Header
          const printHeader = (pageNum: number) => {
              if (pageNum === 1) {
                  // Logo Placeholder (Using text if image fails or complicated)
                  // If you have a base64 logo, use: doc.addImage(imgData, 'PNG', x, y, w, h);
                  // Using the one from index.html if possible, or just text for reliability
                  
                  // Title
                  doc.setFont("helvetica", "bold");
                  doc.setFontSize(10);
                  doc.text(`SENARAI KONTRAKTOR PANEL YANG TELAH DILANTIK`, pageWidth / 2, 20, { align: "center" });
                  doc.text(`UNTUK KERJA INFRASTRUKTUR BAGI TAHUN ${selectedYear}`, pageWidth / 2, 25, { align: "center" });
                  
                  // Metadata
                  doc.setFont("helvetica", "normal");
                  doc.setFontSize(8);
                  doc.text(`Tarikh Kemaskini: ${new Date().toLocaleDateString('en-GB')}`, marginX, 35);
                  doc.text(`Kertas Mesyuarat. Bil. ${exportBilMesyuarat}`, pageWidth - marginX, 35, { align: "right" });
                  
                  doc.setLineWidth(0.5);
                  doc.line(marginX, 38, pageWidth - marginX, 38);
                  return 45; // New Y
              }
              return 15; // Standard Y for subsequent pages
          };

          currentY = printHeader(1);

          // Iterate Groups
          let totalItemsProcessed = 0;
          const totalItems = groupedProjects.reduce((acc, g) => acc + g.projects.length, 0);

          for (const group of groupedProjects) {
              if (group.projects.length === 0) continue;

              // Check space for header
              if (currentY > pageHeight - 40) {
                  doc.addPage();
                  currentY = printHeader(doc.getNumberOfPages());
              }

              // Company Header
              doc.setFillColor(230, 230, 230); // Light Gray
              doc.rect(marginX, currentY, pageWidth - (marginX * 2), 7, 'F');
              doc.rect(marginX, currentY, pageWidth - (marginX * 2), 7, 'S'); // Border
              doc.setFont("helvetica", "bold");
              doc.setFontSize(9);
              doc.setTextColor(0, 0, 0);
              doc.text(group.company, marginX + 2, currentY + 5);
              currentY += 10;

              // Sort Projects
              const sortedProjects = [...group.projects].sort((a, b) => {
                  const dateA = new Date(a.tarikhMulaKontrak || '9999-12-31').getTime();
                  const dateB = new Date(b.tarikhMulaKontrak || '9999-12-31').getTime();
                  return dateA - dateB;
              });

              // Prepare Table Data
              const tableBody = sortedProjects.map((p, idx) => {
                  const cost = costViewMode === 'actual' ? p.kosSebenar : p.kosProjek;
                  const displayCost = formatCurrency(cost).replace('RM', '').trim();
                  
                  let dateStr = '';
                  if (p.tarikhMulaKontrak) dateStr += `Mula: ${formatDate(p.tarikhMulaKontrak)}\n`;
                  if (p.tarikhTamatKontrak) dateStr += `Tamat: ${formatDate(p.tarikhTamatKontrak)}`;

                  return [
                      idx + 1,
                      `${p.namaProjek}\n\n${p.lokasi}\n${dateStr}`,
                      `${p.status.replace(/_/g, ' ')}\n(${p.peratusSiap}%)`,
                      `${p.noVote || '-'}\n${getVoteName(p.noVote || '')}`,
                      displayCost
                  ];
              });

              // Render Project Table
              // @ts-ignore
              doc.autoTable({
                  startY: currentY,
                  head: [['Bil', 'Tajuk Projek & Lokasi', 'Status', 'Vot', 'Kos (RM)']],
                  body: tableBody,
                  theme: 'grid',
                  styles: { fontSize: 8, cellPadding: 2, lineColor: [0,0,0], lineWidth: 0.1, textColor: 0 },
                  headStyles: { fillColor: [245, 245, 245], textColor: 0, fontStyle: 'bold', halign: 'center' },
                  columnStyles: {
                      0: { cellWidth: 10, halign: 'center' },
                      1: { cellWidth: 100 }, // Main content width
                      2: { cellWidth: 25, halign: 'center' },
                      3: { cellWidth: 25, halign: 'center', fontSize: 7 },
                      4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
                  },
                  margin: { left: marginX, right: marginX },
                  rowPageBreak: 'avoid',
                  didDrawPage: (data: any) => {
                      // currentY = data.cursor.y; // Update Y not needed here as autoTable returns finalY
                  }
              });

              // @ts-ignore
              currentY = doc.lastAutoTable.finalY + 5;
              totalItemsProcessed += group.projects.length;
              setGenerationProgress(10 + Math.round((totalItemsProcessed / totalItems) * 80));

              // Vote Summary Table (Right Aligned)
              const voteSummaryBody = Object.keys(group.projectsByVote).sort().map(voteCode => {
                  const vData = group.projectsByVote[voteCode];
                  const vCost = costViewMode === 'actual' ? vData.subtotalActual : vData.subtotalContract;
                  return [voteCode, getVoteName(voteCode), formatCurrency(vCost).replace('RM', '').trim()];
              });
              voteSummaryBody.push(['', 'JUMLAH BESAR', formatCurrency(costViewMode === 'actual' ? group.totalActualCost : group.totalCost).replace('RM', '').trim()]);

              // Check space for summary
              const summaryHeight = (voteSummaryBody.length + 2) * 6; // Approx
              if (currentY + summaryHeight > pageHeight - 15) {
                  doc.addPage();
                  currentY = 15;
              }

              // @ts-ignore
              doc.autoTable({
                  startY: currentY,
                  head: [['Vot', 'Butiran', 'Jum (RM)']],
                  body: voteSummaryBody,
                  theme: 'grid',
                  styles: { fontSize: 7, cellPadding: 1, lineColor: [0,0,0], lineWidth: 0.1, textColor: 0 },
                  headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold', halign: 'center' },
                  columnStyles: {
                      0: { cellWidth: 20, halign: 'center' },
                      1: { cellWidth: 50 },
                      2: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }
                  },
                  margin: { left: pageWidth - 105 }, // Align right (Width approx 95 + margin)
                  tableWidth: 95,
              });

              // @ts-ignore
              currentY = doc.lastAutoTable.finalY + 10;
          }

          // --- GLOBAL FINANCIAL SUMMARY ---
          doc.addPage();
          currentY = 20;
          
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text(`RUMUSAN KEWANGAN KESELURUHAN (${selectedYear})`, marginX, currentY);
          currentY += 5;

          const globalSummaryBody = Object.entries(financialSummary).map(([voteCode, data]) => {
              return [
                  voteCode,
                  getVoteName(voteCode),
                  formatCurrency(data.allocated).replace('RM',''),
                  formatCurrency(data.used).replace('RM',''),
                  formatCurrency(data.allocated - data.used).replace('RM','')
              ];
          });

          // Add Total Row
          const totalAlloc = Object.values(financialSummary).reduce((a,b) => a + b.allocated, 0);
          const totalUsed = Object.values(financialSummary).reduce((a,b) => a + b.used, 0);
          const totalBal = totalAlloc - totalUsed;

          // @ts-ignore
          doc.autoTable({
              startY: currentY,
              head: [['KOD VOT', 'BUTIRAN', 'PERUNTUKAN', 'BELANJA', 'BAKI']],
              body: [
                  ...globalSummaryBody,
                  [
                      { content: 'JUMLAH BESAR', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } },
                      { content: formatCurrency(totalAlloc).replace('RM',''), styles: { halign: 'right', fontStyle: 'bold' } },
                      { content: formatCurrency(totalUsed).replace('RM',''), styles: { halign: 'right', fontStyle: 'bold', textColor: [200, 0, 0] } },
                      { content: formatCurrency(totalBal).replace('RM',''), styles: { halign: 'right', fontStyle: 'bold' } }
                  ]
              ],
              theme: 'grid',
              styles: { fontSize: 8, cellPadding: 1.7, lineColor: [0,0,0], lineWidth: 0.1, textColor: 0 },
              headStyles: { fillColor: [230, 230, 230], textColor: 0, fontStyle: 'bold', halign: 'center' },
              columnStyles: {
                  0: { cellWidth: 20, halign: 'center' },
                  1: { cellWidth: 'auto' },
                  2: { cellWidth: 35, halign: 'right' },
                  3: { cellWidth: 35, halign: 'right' },
                  4: { cellWidth: 35, halign: 'right' }
              },
              margin: { left: marginX, right: marginX }
          });

          // @ts-ignore
          currentY = doc.lastAutoTable.finalY + 10;

          // Manual Deductions Summary
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
              styles: { fontSize: 9, cellPadding: 1, textColor: 0 },
              columnStyles: {
                  0: { cellWidth: 100, halign: 'right', fontStyle: 'bold' },
                  1: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
              },
              margin: { left: pageWidth - 150 }
          });

          // Save
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
    <div className="space-y-6 animate-fade-in-up pb-40">
      
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Senarai Projek</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            <span className="font-bold text-emerald-600">{filteredProjects.length}</span> projek dijumpai
          </p>
        </div>
        <button 
          onClick={onAddProject}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40 hover:scale-105 transition-all duration-300 w-full md:w-auto justify-center"
        >
          <Plus className="h-5 w-5" />
          <span>Tambah Projek</span>
        </button>
      </div>

      {/* Advanced Filter Bar */}
      <div className="glass-effect p-5 rounded-3xl shadow-xl border border-white/20 dark:border-white/5 space-y-4 relative z-30">
          {/* Top Row: Search & View Toggle */}
          <div className="flex flex-col lg:flex-row gap-4">
              {viewMode === 'list' && (
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Cari No. Fail, Projek, Syarikat..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-transparent focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400 font-medium"
                    />
                  </div>
              )}
              {viewMode === 'group' && <div className="flex-1"></div>}
              
              <div className="flex flex-wrap gap-2">
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`px-3 md:px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        title="Pandangan Senarai"
                    >
                        <List className="w-4 h-4" /> <span className="hidden md:inline">Senarai</span>
                    </button>
                    <button 
                        onClick={() => setViewMode('group')}
                        className={`px-3 md:px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'group' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        title="Pandangan Kumpulan Syarikat"
                    >
                        <Grid className="w-4 h-4" /> <span className="hidden md:inline">Syarikat</span>
                    </button>
                  </div>

                  {/* Toggle Unified Filter Panel */}
                  <button 
                    onClick={() => setShowFilterPanel(!showFilterPanel)}
                    className={`h-full px-4 rounded-xl border flex items-center gap-2 text-sm font-bold transition-all relative ${showFilterPanel || activeFilterCount > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-200 ring-2 ring-emerald-500/20' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50'}`}
                  >
                      <Filter className="w-4 h-4" />
                      <span>Filter</span>
                      {activeFilterCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-600 text-white text-[10px] flex items-center justify-center rounded-full shadow-sm">
                              {activeFilterCount}
                          </span>
                      )}
                  </button>

                  <button 
                    onClick={viewMode === 'group' ? () => setIsExportModalOpen(true) : exportToExcel}
                    className="h-full px-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 flex items-center gap-2 transition-colors font-bold text-sm"
                    title={viewMode === 'group' ? "Jana Laporan Panel" : "Export CSV"}
                  >
                      {viewMode === 'group' ? <FileText className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                      <span className="hidden sm:inline">{viewMode === 'group' ? 'Laporan PDF' : 'CSV'}</span>
                  </button>
              </div>
          </div>

          {/* Unified Filter Panel (Collapsible) */}
          {showFilterPanel && (
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 animate-slide-down">
                <div className="flex items-center justify-between mb-6">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Settings2 className="w-4 h-4 text-emerald-500" />
                        Tetapan Data & Paparan
                    </h4>
                    <button 
                        onClick={resetAllFilters}
                        className="text-[11px] font-bold flex items-center gap-1.5 text-slate-500 hover:text-red-500 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <RotateCcw className="w-3 h-3" /> Reset Semua
                    </button>
                </div>

                <div className="mb-6">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Tapisan Data (Row Filters)</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                            </div>
                            <select 
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as any)}
                                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 appearance-none focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-colors"
                            >
                                <option value="ALL">Semua Status</option>
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
                            <select value={filterPja} onChange={(e) => setFilterPja(e.target.value)} className="w-full pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 appearance-none focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-colors">
                                <option value="ALL">Semua PJA</option>
                                {users.filter(u => u.role === 'PJA').map(u => <option key={u.id} value={u.id}>{u.username.toUpperCase()}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><Filter className="w-4 h-4 text-slate-400" /></div>
                            <select value={filterZon} onChange={(e) => setFilterZon(e.target.value)} className="w-full pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 appearance-none focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-colors">
                                <option value="ALL">Semua Zon</option>
                                {ZON_OPTIONS.map(z => <option key={z} value={z}>{z}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><Filter className="w-4 h-4 text-slate-400" /></div>
                            <select value={filterBp} onChange={(e) => setFilterBp(e.target.value)} className="w-full pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 appearance-none focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-colors">
                                <option value="ALL">Semua BP</option>
                                {BP_OPTIONS.map(bp => <option key={bp} value={bp}>{bp}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><Filter className="w-4 h-4 text-slate-400" /></div>
                            <select 
                                value={filterVote} 
                                onChange={(e) => setFilterVote(e.target.value)} 
                                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 appearance-none focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-colors"
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

                <div className="border-t border-slate-100 dark:border-slate-800 my-6"></div>

                {viewMode === 'list' && (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Paparan Kolum</div>
                            <div className="flex gap-2">
                                <button onClick={handleSelectAllColumns} className="text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1"><Eye className="w-3 h-3" /> Semua</button>
                                <button onClick={handleDeselectAllColumns} className="text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1"><EyeOff className="w-3 h-3" /> Kosong</button>
                                <button onClick={handleResetColumns} className="text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1"><Layout className="w-3 h-3" /> Asal</button>
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {columnDefs.map(col => (
                                    <label key={col.id} className="flex items-center gap-2 cursor-pointer group p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors select-none">
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${visibleColumns[col.id] ? 'bg-emerald-500 border-emerald-500' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 group-hover:border-emerald-400'}`}>
                                            {visibleColumns[col.id] && <Check className="w-3 h-3 text-white stroke-[3]" />}
                                        </div>
                                        <input type="checkbox" className="hidden" checked={visibleColumns[col.id]} onChange={() => setVisibleColumns(prev => ({ ...prev, [col.id]: !prev[col.id] }))} />
                                        <span className={`text-[11px] font-bold truncate ${visibleColumns[col.id] ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}`}>{col.label}</span>
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
                            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                                <button onClick={() => setCostViewMode('contract')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${costViewMode === 'contract' ? 'bg-white shadow text-emerald-600' : 'text-slate-500'}`}>Harga Projek</button>
                                <button onClick={() => setCostViewMode('actual')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${costViewMode === 'actual' ? 'bg-white shadow text-emerald-600' : 'text-slate-500'}`}>Kos Sebenar</button>
                                <button onClick={() => setCostViewMode('both')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${costViewMode === 'both' ? 'bg-white shadow text-emerald-600' : 'text-slate-500'}`}>Semua</button>
                            </div>
                        </div>
                        <div className="flex gap-4 items-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tapis Projek:</span>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <div className={`w-10 h-5 rounded-full p-1 transition-colors ${showSiap ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}><div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${showSiap ? 'translate-x-5' : ''}`}></div></div>
                                <input type="checkbox" className="hidden" checked={showSiap} onChange={() => setShowSiap(!showSiap)} />
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Tunjuk Projek Siap</span>
                            </label>
                        </div>
                    </div>
                )}
            </div>
          )}
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="glass-effect rounded-3xl shadow-xl border border-white/20 dark:border-white/5 overflow-hidden min-h-[400px]">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm sticky top-0 z-20 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            {columnDefs.filter(c => visibleColumns[c.id]).map(col => (
                                <th key={col.id} className="px-6 py-4 text-left text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{col.label}</th>
                            ))}
                            <th className="px-6 py-4 w-16"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredProjects.map((project) => (
                            <tr key={project.id} onClick={() => onEditProject(project)} className="group hover:bg-slate-50/80 dark:hover:bg-white/5 transition-all duration-200 cursor-pointer">
                                {visibleColumns.noFail && <td className="px-6 py-4 whitespace-nowrap"><div className="font-bold text-slate-900 dark:text-white text-sm">{project.noFail}</div><div className="text-[10px] text-slate-400 font-mono mt-0.5">{formatDate(project.tarikhBuka)}</div></td>}
                                {visibleColumns.namaProjek && <td className="px-6 py-4 min-w-[300px]"><div className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{project.namaProjek}</div></td>}
                                {visibleColumns.pjaId && <td className="px-6 py-4 whitespace-nowrap">
                                    {(() => {
                                        const pja = getPjaUser(project.pjaId);
                                        return (
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-black text-white shrink-0 overflow-hidden shadow-sm">
                                                    {pja?.avatarUrl ? (
                                                        <img src={pja.avatarUrl} alt={pja.username} className="w-full h-full object-cover" />
                                                    ) : (
                                                        pja?.username?.charAt(0).toUpperCase() || 'P'
                                                    )}
                                                </div>
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{pja?.username?.toUpperCase() || '-'}</span>
                                            </div>
                                        );
                                    })()}
                                </td>}
                                {visibleColumns.noAduan && <td className="px-6 py-4"><div className="flex flex-col gap-1 max-h-[100px] overflow-y-auto custom-scrollbar">{project.noAduan ? project.noAduan.split(/[,;\n]/).map((aduan, idx) => { const cleanAduan = aduan.trim(); if (!cleanAduan) return null; return <div key={idx} className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">{cleanAduan}</div>; }) : <span className="text-xs text-slate-400">-</span>}</div></td>}
                                {visibleColumns.lokasi && <td className="px-6 py-4"><div className="flex flex-col gap-1 max-h-[150px] overflow-y-auto custom-scrollbar min-w-[200px]">{project.lokasi ? project.lokasi.split('\n').map((loc, idx) => { const cleanLoc = loc.trim(); if (!cleanLoc) return null; return <div key={idx} className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight mb-1 whitespace-pre-wrap">{cleanLoc}</div>; }) : <span className="text-xs text-slate-400">-</span>}</div></td>}
                                {visibleColumns.bp && <td className="px-6 py-4 text-xs text-slate-500">{project.bp}</td>}
                                {visibleColumns.zon && <td className="px-6 py-4 text-xs text-slate-500">{project.zon}</td>}
                                {visibleColumns.tarikhBuka && <td className="px-6 py-4 text-xs text-slate-500">{formatDate(project.tarikhBuka)}</td>}
                                {visibleColumns.namaSyarikat && <td className="px-6 py-4 min-w-[200px]"><div className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed">{project.namaSyarikat || <span className="text-slate-400 italic font-normal">Belum Lantik</span>}</div></td>}
                                {visibleColumns.noVote && <td className="px-6 py-4 text-xs text-slate-500">{project.noVote}</td>}
                                {visibleColumns.noSebutharga && <td className="px-6 py-4 text-xs text-slate-500">{project.noSebutharga}</td>}
                                {visibleColumns.noInden && <td className="px-6 py-4 text-xs text-slate-500">{project.noInden}</td>}
                                {visibleColumns.noBpp && <td className="px-6 py-4 text-xs text-slate-500">{project.noBpp}</td>}
                                {visibleColumns.tempohKontrak && <td className="px-6 py-4 text-xs text-slate-500">{project.tempohKontrak}</td>}
                                {visibleColumns.status && <td className="px-6 py-4 whitespace-nowrap text-center"><div className="flex flex-col items-center justify-center gap-2"><CircularProgress value={project.peratusSiap || 0} size={34} strokeWidth={3} /><span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border shadow-sm ${getStatusColor(project.status)} ${project.status === ProjectStatus.DALAM_PROSES ? 'animate-pulse' : ''}`}><span className={`w-1.5 h-1.5 rounded-full ${project.status === ProjectStatus.DALAM_PROSES ? 'bg-blue-500' : project.status === ProjectStatus.SIAP ? 'bg-emerald-500' : 'bg-yellow-500'}`}></span>{project.status.replace(/_/g, ' ')}</span></div></td>}
                                {visibleColumns.kosProjek && <td className="px-6 py-4 text-right text-xs font-bold text-emerald-600">{formatCurrency(project.kosProjek)}</td>}
                                {visibleColumns.kosSebenar && <td className="px-6 py-4 text-right text-xs font-bold text-slate-600">{formatCurrency(project.kosSebenar)}</td>}
                                {visibleColumns.wangTahanan && <td className="px-6 py-4 text-right text-xs font-bold text-slate-600">{formatCurrency(project.wangTahanan)}</td>}
                                {visibleColumns.ladAmount && <td className="px-6 py-4 text-right text-xs font-bold text-red-500">{formatCurrency(project.ladAmount)}</td>}
                                {visibleColumns.ladDays && <td className="px-6 py-4 text-center text-xs text-slate-500">{project.ladDays || 0}</td>}
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
                                        <button onClick={(e) => { e.stopPropagation(); onEditProject(project); }} className="p-2 bg-white dark:bg-slate-700 rounded-lg text-emerald-600 hover:bg-emerald-50 shadow-sm border border-slate-100 dark:border-slate-600"><ArrowUpRight className="w-4 h-4" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(project); }} className="p-2 bg-white dark:bg-slate-700 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 shadow-sm border border-slate-100 dark:border-slate-600"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* Group View */}
      {viewMode === 'group' && (
          <div className="space-y-6">
             {groupedProjects.map((group) => {
                const votesInGroup = Object.keys(group.projectsByVote).sort();
                return (
                <div key={group.company} className="relative overflow-hidden rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-sm transition-all hover:shadow-md">
                   <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors gap-4" onClick={() => toggleCompany(group.company)}>
                      <div className="flex items-center gap-4 flex-1">
                         <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0"><Building2 className="w-6 h-6" /></div>
                         <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate flex items-center gap-3">{group.company} {group.count > 0 ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">{group.count} Fail</span> : <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider italic">Tiada Projek</span>}</h3>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                                <div className="flex gap-4 border-l border-slate-200 dark:border-slate-700 pl-4 ml-2">
                                    {(costViewMode === 'contract' || costViewMode === 'both') && <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div><span className="opacity-80">Kontrak:</span> <strong className="text-emerald-700 dark:text-emerald-400 font-mono text-sm">{formatCurrency(group.totalCost)}</strong></span>}
                                    {(costViewMode === 'actual' || costViewMode === 'both') && <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div><span className="opacity-80">Sebenar:</span><strong className="text-blue-700 dark:text-blue-400 font-mono text-sm">{formatCurrency(group.totalActualCost)}</strong></span>}
                                </div>
                            </div>
                         </div>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${expandedCompanies[group.company] ? 'rotate-180' : ''}`} />
                   </div>

                   {/* Inner Table - Grouped by Vote */}
                   {expandedCompanies[group.company] && group.count > 0 && (
                      <div className="border-t border-slate-100 dark:border-white/5 animate-slide-down bg-slate-50/30 dark:bg-black/10 overflow-x-auto">
                         <div className="w-full">
                            {votesInGroup.map(voteCode => {
                                const voteData = group.projectsByVote[voteCode];
                                return (
                                    <div key={voteCode} className="border-b border-slate-200 dark:border-slate-800 last:border-b-0">
                                        <div className="px-6 py-2 bg-slate-100/50 dark:bg-slate-800/50 flex items-center justify-between">
                                            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2"><span className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">{voteCode}</span><span>{getVoteName(voteCode)}</span></div>
                                        </div>
                                        <table className="w-full text-sm">
                                            <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-white/5">
                                                <tr>
                                                    <th className="px-6 py-3 text-left font-extrabold w-[350px]">No. Fail / Tajuk Projek</th>
                                                    <th className="px-6 py-3 text-center font-extrabold w-[100px]">Bulan</th>
                                                    <th className="px-6 py-3 text-left font-extrabold">Lokasi</th>
                                                    <th className="px-6 py-3 text-center font-extrabold">Tarikh (Mula - Tamat)</th>
                                                    <th className="px-6 py-3 text-right font-extrabold">Kos</th>
                                                    <th className="px-6 py-3 text-center font-extrabold">Status</th>
                                                    <th className="px-6 py-3"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                                {voteData.projects.map(p => (
                                                    <tr key={p.id} className="hover:bg-white/60 dark:hover:bg-white/5 cursor-pointer transition-colors group/row" onClick={() => onEditProject(p)}>
                                                        <td className="px-6 py-3 align-top"><div className="font-mono font-bold text-xs text-slate-600 dark:text-slate-300 mb-1">{p.noFail}</div><div className="font-medium text-slate-800 dark:text-white leading-relaxed text-[11px] opacity-80 whitespace-pre-wrap">{p.namaProjek}</div></td>
                                                        <td className="px-6 py-3 text-center align-top"><span className="px-3 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 shadow-sm">{p.bulan || '-'}</span></td>
                                                        <td className="px-6 py-3 text-xs max-w-[200px] align-top"><div className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap" title={p.lokasi}>{p.lokasi ? p.lokasi : '-'}</div></td>
                                                        <td className="px-6 py-3 text-center text-[10px] font-mono text-slate-500 align-top">{formatDate(p.tarikhMulaKontrak)}<br/>-<br/>{formatDate(p.tarikhTamatKontrak)}</td>
                                                        <td className="px-6 py-3 text-right font-mono font-bold text-xs align-top"><div className={costViewMode === 'actual' ? 'hidden' : 'text-emerald-600 dark:text-emerald-400'}>{formatCurrency(p.kosProjek)}</div><div className={costViewMode === 'contract' ? 'hidden' : 'text-blue-600 dark:text-blue-400'}>{formatCurrency(p.kosSebenar)}</div></td>
                                                        <td className="px-6 py-3 text-center align-top"><div className="flex flex-col items-center gap-1"><span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{p.peratusSiap}%</span><span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border shadow-sm ${getStatusColor(p.status)}`}>{p.status.replace(/_/g, ' ')}</span></div></td>
                                                        <td className="px-6 py-3 text-right align-top"><button className="p-2 rounded-lg bg-white dark:bg-slate-800 text-emerald-600 shadow-sm opacity-0 group-hover/row:opacity-100 transition-all hover:scale-110"><ArrowUpRight className="w-4 h-4" /></button></td>
                                                    </tr>
                                                ))}
                                                <tr className="bg-slate-50 dark:bg-slate-800/30 font-bold border-t border-slate-200 dark:border-slate-700">
                                                    <td colSpan={4} className="px-6 py-3 text-right text-[10px] uppercase text-slate-500 tracking-wider">Jumlah</td>
                                                    <td className="px-6 py-3 text-right font-mono text-xs text-slate-800 dark:text-white">
                                                        {costViewMode === 'contract' ? formatCurrency(voteData.subtotalContract) : costViewMode === 'actual' ? formatCurrency(voteData.subtotalActual) : (<div><div>{formatCurrency(voteData.subtotalContract)}</div><div className="text-[10px] opacity-60">{formatCurrency(voteData.subtotalActual)}</div></div>)}
                                                    </td>
                                                    <td colSpan={2}></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })}
                            <div className="px-6 py-4 bg-emerald-50/50 dark:bg-emerald-900/10 flex justify-end items-center gap-6 border-t border-emerald-100 dark:border-emerald-800/30">
                                <span className="text-[11px] font-bold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Jumlah Keseluruhan ({group.company})</span>
                                <span className="text-sm font-black font-mono text-emerald-700 dark:text-emerald-300">{costViewMode === 'actual' ? formatCurrency(group.totalActualCost) : formatCurrency(group.totalCost)}</span>
                            </div>
                         </div>
                      </div>
                   )}
                   {expandedCompanies[group.company] && group.count === 0 && <div className="p-8 text-center text-slate-400 italic text-sm bg-slate-50/30 dark:bg-black/10 border-t border-slate-100 dark:border-white/5">Tiada projek untuk syarikat ini.</div>}
                </div>
             );})}
             
             {/* Integrated Summary Card (Vertical) */}
             {groupedProjects.length > 0 && (
                <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-6 mt-8 w-full mx-auto">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800"><div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl shadow-sm text-emerald-600 dark:text-emerald-400"><Calculator className="w-5 h-5" /></div><h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-widest">Rumusan Kewangan ({selectedYear})</h4></div>
                    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                        <table className="w-full text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-800">
                                <tr><th className="py-3 px-4 text-left font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-20">Kod Vot</th><th className="py-3 px-4 text-left font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Butiran</th><th className="py-3 px-4 text-right font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Peruntukan</th><th className="py-3 px-4 text-right font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Belanja</th><th className="py-3 px-4 text-right font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Baki</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {Object.entries(financialSummary).map(([voteCode, data]) => (
                                    <tr key={voteCode} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="py-3 px-4 font-mono font-bold text-slate-600 dark:text-slate-300">{voteCode}</td><td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-200">{getVoteName(voteCode)}</td><td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400">{formatCurrency(data.allocated)}</td><td className="py-3 px-4 text-right font-mono text-red-500">-{formatCurrency(data.used)}</td><td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(data.allocated - data.used)}</td>
                                    </tr>
                                ))}
                                <tr className="bg-slate-50 dark:bg-slate-800/50 font-bold border-t-2 border-slate-200 dark:border-slate-700"><td colSpan={2} className="py-3 px-4 text-right uppercase text-[10px] text-slate-500 tracking-wider">Jumlah Besar</td><td className="py-3 px-4 text-right font-mono text-slate-800 dark:text-white">{formatCurrency(Object.values(financialSummary).reduce((a, b) => a + b.allocated, 0))}</td><td className="py-3 px-4 text-right font-mono text-red-500">-{formatCurrency(Object.values(financialSummary).reduce((a, b) => a + b.used, 0))}</td><td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(Object.values(financialSummary).reduce((a, b) => a + (b.allocated - b.used), 0))}</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                        <div className="flex items-center justify-between text-xs"><span className="font-bold text-slate-500 uppercase">Tolak Lain-lain (Sebutharga)</span><div className="flex items-center gap-2"><span className="text-slate-400 font-bold">RM</span><input type="number" value={manualFinancials.outsource || ''} onChange={e => setManualFinancials(prev => ({ ...prev, outsource: parseFloat(e.target.value) }))} className="w-24 text-right bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 outline-none font-mono font-bold" placeholder="0.00" /></div></div>
                        <div className="flex items-center justify-between text-xs"><span className="font-bold text-slate-500 uppercase">Tolak Lantikan YDP/TYDP</span><div className="flex items-center gap-2"><span className="text-slate-400 font-bold">RM</span><input type="number" value={manualFinancials.ydp || ''} onChange={e => setManualFinancials(prev => ({ ...prev, ydp: parseFloat(e.target.value) }))} className="w-24 text-right bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 outline-none font-mono font-bold" placeholder="0.00" /></div></div>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700 bg-emerald-50/50 dark:bg-emerald-900/10 -mx-6 px-6 py-4 -mb-6 rounded-b-3xl">
                            <div className="flex items-center gap-3"><button onClick={saveManualFinancials} disabled={isSavingFinancials} className="px-4 py-2 bg-slate-800 dark:bg-white text-white dark:text-slate-900 rounded-lg text-[10px] font-bold shadow-md flex items-center gap-1 disabled:opacity-70"><Save className="w-3 h-3" /> Simpan</button></div>
                            <div className="text-right"><div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Baki Bersih</div><div className="font-mono font-black text-xl text-emerald-600 dark:text-emerald-400 leading-none">{formatCurrency(Object.values(financialSummary).reduce((a, b) => a + (b.allocated - b.used), 0) - (manualFinancials.outsource || 0) - (manualFinancials.ydp || 0))}</div></div>
                        </div>
                    </div>
                </div>
             )}

             {groupedProjects.length === 0 && <div className="text-center text-slate-400 italic py-12 glass-effect rounded-3xl">Tiada data syarikat untuk dipaparkan.</div>}
          </div>
      )}

      {/* Delete Modal */}
      {projectToDelete && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={cancelDelete}>
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 transform scale-100 transition-all animate-slide-up relative" onClick={e => e.stopPropagation()}>
                <button onClick={cancelDelete} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><X className="w-5 h-5" /></button>
                <div className="flex flex-col items-center text-center pt-2">
                   <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6 text-red-500 animate-pulse-slow"><div className="w-14 h-14 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center"><AlertTriangle className="w-8 h-8 stroke-[1.5]" /></div></div>
                   <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 font-jakarta">Padam Projek?</h3>
                   <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm leading-relaxed px-4">Adakah anda pasti mahu memadam <span className="font-bold text-slate-900 dark:text-white block mt-1 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 break-words">{projectToDelete.noFail}</span></p>
                   <div className="flex gap-3 w-full">
                      <button onClick={cancelDelete} className="flex-1 py-3.5 px-4 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-600 transition-all border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md">Batal</button>
                      <button onClick={confirmDelete} disabled={deleteCountdown > 0} className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg ${deleteCountdown > 0 ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 shadow-red-600/30 hover:-translate-y-0.5'}`}>
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
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsExportModalOpen(false)}>
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 transform scale-100 transition-all animate-slide-up relative" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <FileText className="w-6 h-6 text-emerald-600" />
                          Laporan Panel Kontraktor
                      </h3>
                      <button onClick={() => setIsExportModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                          <X className="w-6 h-6" />
                      </button>
                  </div>
                  
                  <div className="space-y-4">
                      {isGeneratingPdf ? (
                          <div className="flex flex-col items-center justify-center py-4">
                              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
                              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Menjana PDF... {generationProgress}%</p>
                              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                                  <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${generationProgress}%` }}></div>
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
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                    placeholder="cth: 01/01/2025"
                                    autoFocus
                                />
                            </div>
                            
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={handleExportRealPDF}
                                    disabled={isGeneratingPdf}
                                    className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 disabled:opacity-70 group"
                                >
                                    <FileText className="w-4 h-4"/>
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