import { Project, User, formatCurrency, formatDate } from '../../types';
import { PDFBaseHelper } from './PDFBaseHelper';

export class ProjectsListPDFExporter {
    static async exportRotasi(
        selectedYear: string | number,
        companyOrder: string[],
        projects: Project[],
        companyDetails: any,
        setGenerationProgress: (progress: number) => void
    ): Promise<void> {
        const jsPDF = PDFBaseHelper.getJsPDF();
        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for more columns

        const pageWidth = doc.internal.pageSize.getWidth();
        const marginX = 10;
        let currentY = 15;

        // Header
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text(`JADUAL PENGILIRAN KONTRAKTOR PANEL INFRASTRUKTUR JABATAN KEJURUTERAAN TAHUN ${selectedYear}`, pageWidth / 2, currentY, { align: "center" });
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

                const dateToUse = p.tarikhLantikan || p.tarikhBuka;
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
    }

    static async exportSenarai(
        selectedYear: string | number,
        groupedProjects: any[],
        exportBilMesyuarat: string,
        financialSummary: any,
        manualFinancials: any,
        getPjaUser: (id: number) => User | undefined,
        getStatusLabel: (status: string) => string,
        getVoteName: (vote: string) => string,
        setGenerationProgress: (progress: number) => void
    ): Promise<void> {
        const jsPDF = PDFBaseHelper.getJsPDF();
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

            let billCounter = 1;
            const companyProjects = [...group.projects].sort((a, b) => {
                const dateA = new Date(a.tarikhMulaKontrak || a.tarikhLantikan || '9999-12-31').getTime();
                const dateB = new Date(b.tarikhMulaKontrak || b.tarikhLantikan || '9999-12-31').getTime();
                return dateA - dateB;
            });

            const tableBody = companyProjects.map((p) => {
                const pjaUser = getPjaUser(p.pjaId);
                const pjaName = pjaUser ? pjaUser.username.toUpperCase() : '-';

                const toTitleCase = (str: string) => {
                    if (!str) return '';
                    return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
                };

                const formattedStatus = getStatusLabel(p.status);
                const progress = p.peratusSiap !== undefined && p.peratusSiap !== null ? p.peratusSiap : 0;

                const formattedLokasi = (p.lokasi || '-')
                    .split(/,|\n/)
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

            summaryTableBody.push([
                { content: 'JUMLAH', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold', fillColor: [240, 240, 240] } } as any,
                { content: '', styles: { fillColor: [240, 240, 240] } } as any,
                { content: formatCurrency(group.totalCost).replace('RM', '').trim(), styles: { halign: 'right', fontStyle: 'bold', fillColor: [240, 240, 240] } } as any
            ]);

            if (currentY > pageHeight - 30) {
                doc.addPage();
                currentY = printHeader(doc.getNumberOfPages());
            }

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
                tableWidth: 140
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
    }
}
