import { Project, User, ProjectLocation, BQItem, formatCurrency } from '../../types';
import { apiService } from '../apiService';
import { PDFBaseHelper } from './PDFBaseHelper';

const toRoman = (num: number): string => {
  const lookup: { [key: string]: number } = { m: 1000, cm: 900, d: 500, cd: 400, c: 100, xc: 90, l: 50, xl: 40, x: 10, ix: 9, v: 5, iv: 4, i: 1 };
  let roman = '';
  for (let i in lookup) {
    while (num >= lookup[i]) {
      roman += i;
      num -= lookup[i];
    }
  }
  return roman;
};

const getItemLevel = (item: BQItem): 0 | 1 | 2 => {
  if (item.type === 'HEADER') {
    const isUppercase = item.description === item.description.toUpperCase() && /[A-Z]/.test(item.description);
    return isUppercase ? 0 : 1;
  }
  return 2;
};

const getAutoNumber = (items: BQItem[], currentIndex: number) => {
  let sectionIndex = 0;
  let itemIndex = 0;
  let variantIndex = 0;
  let lastHeaderType: 'NONE' | 'SECTION' | 'ITEM_PARENT' = 'NONE';

  for (let i = 0; i <= currentIndex; i++) {
    const item = items[i];
    const level = getItemLevel(item);

    if (level === 0) {
      sectionIndex++;
      itemIndex = 0;
      variantIndex = 0;
      lastHeaderType = 'SECTION';
    } else if (level === 1) {
      itemIndex++;
      variantIndex = 0;
      lastHeaderType = 'ITEM_PARENT';
    } else {
      if (lastHeaderType === 'ITEM_PARENT') {
        variantIndex++;
      } else {
        itemIndex++;
      }
    }
  }

  const currentItem = items[currentIndex];
  const level = getItemLevel(currentItem);

  if (level === 0) return `${sectionIndex}.0`;
  if (level === 1) return `${sectionIndex}.${itemIndex}`;

  if (lastHeaderType === 'ITEM_PARENT') {
    return `${toRoman(variantIndex)})`;
  } else {
    return `${sectionIndex}.${itemIndex}`;
  }
};



export class BQPDFExporter {
  static async exportBQ(formData: any, users: User[], locationRows: ProjectLocation[]): Promise<void> {
    const jsPDF = PDFBaseHelper.getJsPDF();
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const sealsLogo = await PDFBaseHelper.getBase64ImageFromURL("https://upload.wikimedia.org/wikipedia/commons/6/6e/Selayang_Seal.png");
    const mpsLogo = await PDFBaseHelper.getBase64ImageFromURL("https://i.imgur.com/ZB7DFaV.png");
    const pjaUser = users.find(u => u.id === formData.pjaId);
    const year = formData.tarikhBuka ? new Date(formData.tarikhBuka).getFullYear() : new Date().getFullYear();
    const monthNames = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"];
    const dateObj = formData.tarikhBuka ? new Date(formData.tarikhBuka) : new Date();
    const formattedDate = `${monthNames[dateObj.getMonth()]} ${year}`;
    const settings: any = await apiService.getSettings(year);
    const meetingDate = settings.meeting_date || '.........................';
    const meetingNumber = settings.meeting_number || 'XXXX';

    // --- PAGE 1: COVER LETTER ---
    doc.setFont("helvetica", "bold");
    if (sealsLogo) doc.addImage(sealsLogo, 'PNG', 15, 15, 25, 20);
    if (mpsLogo) doc.addImage(mpsLogo, 'PNG', 170, 15, 25, 20);

    doc.setFontSize(12); doc.text("JABATAN KEJURUTERAAN", pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(14); doc.text("MAJLIS PERBANDARAN SELAYANG", pageWidth / 2, 25, { align: "center" });

    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.text("Persiaran 3, Bandar Baru Selayang", pageWidth / 2, 30, { align: "center" });
    doc.text("68100 Batu Caves, Selangor.", pageWidth / 2, 33.5, { align: "center" });
    doc.text("Tel. : 03-61204897/61311426 Fax. : 03-61204879", pageWidth / 2, 37, { align: "center" });

    doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.text("CADANGAN KERJA", pageWidth / 2, 46, { align: "center" });
    doc.setLineWidth(0.5); doc.line(pageWidth / 2 - 20, 47, pageWidth / 2 + 20, 47);

    let y = 56;
    const coverBody = [
      [{ content: 'Tarikh', styles: { fontStyle: 'bold' } }, { content: `         ${formattedDate}`, styles: { fontStyle: 'bold' } }],
      [{ content: 'Daripada', styles: { fontStyle: 'bold' } }, {
        content: `${pjaUser?.fullName.toUpperCase() || 'PJA'}
${pjaUser?.jawatan || ''}
${pjaUser?.bahagian || ''}
${pjaUser?.unit || ''}`
      }],
      [{ content: 'Kepada', styles: { fontStyle: 'bold' } }, {
        content: `Pengarah
Jabatan Kejuruteraan` }],
      [{ content: 'Tajuk', styles: { fontStyle: 'bold' } }, { content: formData.namaProjek?.toUpperCase() || '', styles: { fontStyle: 'bold' } }],
      [{ content: 'Blok Perancangan', styles: { fontStyle: 'bold' } }, { content: formData.bp || '' }],
      [{ content: 'Zon', styles: { fontStyle: 'bold' } }, { content: formData.zon || '' }],
    ];

    // @ts-ignore
    doc.autoTable({
      startY: y,
      body: coverBody,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 3, lineColor: 0, lineWidth: 0.1, textColor: 0 },
      columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 'auto' } },
      margin: { left: 20, right: 20 }
    });

    // @ts-ignore
    y = doc.lastAutoTable.finalY + 11;

    const marginBottom = 15;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Perkara di atas adalah dirujuk.", 20, y);
    y += 7;

    const p1 = `2.   ${(formData.namaProjek || '').toLowerCase().replace(/\b\w/g, char => char.toUpperCase())}`;
    doc.setFont("helvetica", "bold");
    doc.text(p1, 20, y, { maxWidth: 170, align: "justify" });
    const lineCount = doc.splitTextToSize(p1, 170).length;
    y += (lineCount * 5);

    doc.setFont("helvetica", "normal");
    doc.text("Bersama-sama ini dilampirkan pelan tapak, gambar lokasi aduan serta spesifikasi kerja (BQ)", 28, y);
    y += 8;
    doc.text("Sekian, terima kasih.", 20, y);
    y += 8;

    y = PDFBaseHelper.drawGovernmentSlogans(doc, 20, y, 4, 10);

    if (y + 40 > pageHeight - marginBottom) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Saya yang menjalankan amanah,", 20, y);

    y += 15;
    doc.text("..................................................................", 20, y);

    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text(`(${pjaUser?.fullName.toUpperCase() || 'NAMA PJA'})`, 20, y);

    y += 5;
    doc.setFont("helvetica", "normal");
    doc.text(pjaUser?.jawatan || '', 20, y);

    y += 4;
    doc.text(pjaUser?.bahagian || '', 20, y);

    y += 4;
    doc.text(pjaUser?.unit || '', 20, y);

    // --- PAGE 2: ULASAN ---
    doc.addPage(); doc.rect(20, 20, 170, 120); doc.rect(20, 145, 170, 120); y = 30; doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text("ULASAN JURUTERA", 25, y); y += 10;
    doc.setFontSize(10.5);
    const titleLines = doc.splitTextToSize(formData.namaProjek?.toUpperCase() || '', 160); doc.text(titleLines, 25, y); y += (titleLines.length * 5) + 10;
    doc.setFontSize(9);
    doc.text("Anggaran Kontrak", 25, y); doc.text(": ___________________________________________________________", 60, y); y += 8;
    doc.text("Tempoh Kontrak", 25, y); doc.text(": ___________________________________________________________", 60, y); y += 8;
    doc.text("Lantikan", 25, y); doc.text(": ___________________________________________________________", 60, y); y += 8;
    doc.text("________________________________________________________________________________", 25, y); y += 8;
    doc.text("________________________________________________________________________________", 25, y); y += 8;
    y = 125; doc.text("Tandatangan :", 25, y); y += 10; doc.text("Tarikh             :", 25, y);
    y = 155; doc.setFontSize(11); doc.text("ULASAN PENGARAH", 25, y); y += 10; doc.setFontSize(10.5); doc.setFont("helvetica", "normal");
    const ulasanText = `Rujuk kelulusan Jawatankuasa Sebutharga Majlis Perbandaran Selayang (MPS) Bil. ${meetingNumber} yang bersidang pada ${meetingDate} dengan rotasi bagi syarikat :-`;
    const splitUlasan = doc.splitTextToSize(ulasanText, 160); doc.text(splitUlasan, 25, y);
    y += 40; doc.line(25, y, 185, y); y += 15; doc.line(25, y, 185, y);
    y = 250; doc.text("Tandatangan :", 25, y); y += 10; doc.text("Tarikh             :", 25, y);

    // --- BQ DATA SECTION ---
    const bqData = formData.bqData || [];
    let bqSectionIdx = 0;

    for (const bill of bqData) {
      doc.addPage();
      const isPermulaan = bill.title.toUpperCase().includes('PERMULAAN') || bill.title.toUpperCase().includes('INSURANS');
      const billLocs = bill.locationIds || (bill.locationId ? [bill.locationId] : []);
      let locText = isPermulaan ? (locationRows || []).map(l => l.lokasi).join('\n') : ((locationRows || []).filter(l => billLocs.includes(l.id)).map(l => l.lokasi).join('\n') || 'TIADA LOKASI');
      let aduanText = isPermulaan ? (locationRows || []).map(l => l.aduan).join('\n') : ((locationRows || []).filter(l => billLocs.includes(l.id)).map(l => l.aduan).join('\n') || '');

      const tableBody = [];
      const sideOnlyBorder = { top: 0, right: 0.1, bottom: 0, left: 0.1 };
      const titleBorder = { top: 0.1, right: 0.1, bottom: 0, left: 0.1 };

      tableBody.push([{ content: bill.title, colSpan: 7, styles: { fontStyle: 'bold', halign: 'left', lineWidth: titleBorder, fillColor: [245, 245, 245] } }]);

      bill.items.forEach((item: BQItem, itemIndex: number) => {
        const autoNum = getAutoNumber(bill.items, itemIndex);
        const isHeader = item.type === 'HEADER';
        let descText = item.description;
        if (item.variant) descText += `\n${item.variant}`;

        const rawParts = (!isHeader && item.calculationParts) ? item.calculationParts : [];
        const activeParts = rawParts.filter(p =>
          (p.hasLength && typeof p.length === 'number') || (p.hasWidth && typeof p.width === 'number') || (p.hasDepth && typeof p.depth === 'number') || p.multiplier !== 1
        );

        let hideMainValues = activeParts.length > 0;
        let showSubRows = true;

        if (activeParts.length === 1) {
          const p = activeParts[0];
          const hasDimensions = (p.hasLength && typeof p.length === 'number') || (p.hasWidth && typeof p.width === 'number') || (p.hasDepth && typeof p.depth === 'number');

          if (!hasDimensions) {
            showSubRows = false;
            hideMainValues = false;

            let inlineText = '';
            if (p.label) inlineText += ` - ${p.label}`;
            if (p.multiplier !== 1) inlineText += ` x ${p.multiplier}`;
            if (inlineText) descText += inlineText;
          }
        }

        tableBody.push([
          { content: autoNum, styles: { halign: 'center', valign: 'top', lineWidth: sideOnlyBorder } },
          { content: descText, styles: { fontStyle: isHeader ? 'bold' : 'normal', lineWidth: sideOnlyBorder } },
          { content: hideMainValues ? '' : item.unit, styles: { halign: 'center', valign: 'top', lineWidth: sideOnlyBorder } },
          { content: hideMainValues ? '' : (item.qty || ''), styles: { halign: 'center', valign: 'top', lineWidth: sideOnlyBorder } },
          { content: hideMainValues ? '' : (item.rate ? formatCurrency(item.rate).replace('RM', '') : ''), styles: { halign: 'right', valign: 'top', lineWidth: sideOnlyBorder } },
          { content: hideMainValues ? '' : (item.amount ? formatCurrency(item.amount).replace('RM', '') : ''), styles: { halign: 'right', valign: 'top', lineWidth: sideOnlyBorder } }
        ]);

        if (showSubRows && activeParts.length > 0) {
          activeParts.forEach(p => {
            let product = 1;
            if (p.hasLength && typeof p.length === 'number') product *= p.length;
            if (p.hasWidth && typeof p.width === 'number') product *= p.width;
            if (p.hasDepth && typeof p.depth === 'number') product *= p.depth;
            const partQtyVal = product * p.multiplier;
            const partQty = partQtyVal % 1 === 0 ? partQtyVal : parseFloat(partQtyVal.toFixed(2));
            const partAmount = partQtyVal * item.rate;

            const partsStr = [];
            const hasDim = (p.hasLength && typeof p.length === 'number') || (p.hasWidth && typeof p.width === 'number') || (p.hasDepth && typeof p.depth === 'number');
            if (p.hasLength) partsStr.push(`${p.length}m(P)`);
            if (p.hasWidth) partsStr.push(`${p.width}m(L)`);
            if (p.hasDepth) partsStr.push(`${p.depth}m(T)`);

            let dimStr = partsStr.join(' x ');
            if (hasDim) {
              if (p.multiplier !== 1) dimStr += ` x ${p.multiplier}`;
              if (p.label) dimStr += ` - ${p.label}`;
            } else {
              dimStr = '';
              if (p.label) dimStr += `- ${p.label}`;
              if (p.multiplier !== 1) dimStr += ` x ${p.multiplier}`;
              dimStr = dimStr.trim().startsWith('- ') ? dimStr.trim().substring(2) : dimStr.trim();
            }

            tableBody.push([
              { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0, bottom: 0.5 } } },
              { content: dimStr, styles: { fontSize: 7, lineWidth: sideOnlyBorder, cellPadding: { top: 0, bottom: 0.5, left: 3, right: 1 } } },
              { content: item.unit, styles: { halign: 'center', fontSize: 7, lineWidth: sideOnlyBorder, cellPadding: { top: 0, bottom: 0.5 } } },
              { content: partQty.toString(), styles: { halign: 'center', fontSize: 7, lineWidth: sideOnlyBorder, cellPadding: { top: 0, bottom: 0.5 } } },
              { content: item.rate ? formatCurrency(item.rate).replace('RM', '') : '', styles: { halign: 'right', fontSize: 7, lineWidth: sideOnlyBorder, cellPadding: { top: 0, bottom: 0.5 } } },
              { content: formatCurrency(partAmount).replace('RM', ''), styles: { halign: 'right', fontSize: 7, lineWidth: sideOnlyBorder, cellPadding: { top: 0, bottom: 0.5 } } }
            ]);
          });
        }
      });

      const billTotal = bill.items.reduce((s: number, i: any) => s + (i.amount || 0), 0);

      let tableStartY = 15;
      if (bqSectionIdx === 0) {
        // @ts-ignore
        doc.autoTable({
          body: [[{ content: `${formData.namaProjek?.toUpperCase()}`, colSpan: 6, styles: { halign: 'center', fontStyle: 'bold', fontSize: 8 } }]],
          theme: 'grid', startY: 15, styles: { lineWidth: 0.1, lineColor: 0 }, margin: { left: 10, right: 10 }
        });
        // @ts-ignore
        tableStartY = doc.lastAutoTable.finalY;
      }

      const complexHead = [
        [{ content: 'LOKASI', colSpan: 4, styles: { halign: 'center', fontStyle: 'bold', fontSize: 7.5 } }, { content: 'ADUAN', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', fontSize: 7.5 } }],
        [{ content: locText, colSpan: 4, styles: { halign: 'center', fontSize: 7.5 } }, { content: aduanText, colSpan: 2, styles: { halign: 'center', fontSize: 7.5 } }],
        ['BIL', 'KETERANGAN', 'UNIT', 'KUANTITI', 'KADAR (RM)', 'JUMLAH (RM)']
      ];

      const footerHeight = 8;
      const distBottom = 20;
      const footerY = pageHeight - distBottom - footerHeight;

      // @ts-ignore
      doc.autoTable({
        head: complexHead,
        body: tableBody,
        theme: 'plain',
        startY: tableStartY,
        rowPageBreak: 'avoid',
        showHead: 'everyPage',
        showFoot: 'never',
        margin: { top: 20, left: 10, right: 10, bottom: distBottom + footerHeight + 5 },
        styles: { fontSize: 7.5, cellPadding: 1.4, textColor: 0 },
        headStyles: { fillColor: 255, textColor: 0, fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 13 }, 3: { cellWidth: 17 }, 4: { cellWidth: 25 }, 5: { cellWidth: 25 } },
        didDrawCell: (data: any) => {
          doc.setDrawColor(0);
          doc.setLineWidth(0.1);
          doc.line(data.cell.x, data.cell.y, data.cell.x, data.cell.y + data.cell.height);
          doc.line(data.cell.x + data.cell.width, data.cell.y, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
          if (data.section === 'head' || (data.section === 'body' && data.row.index === 0)) {
            doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
            doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
          }
        }
      });

      // @ts-ignore
      const finalY = doc.lastAutoTable.finalY;
      if (finalY < footerY) {
        const xPositions = [10, 20, 120, 133, 150, 175, 200];
        doc.setLineWidth(0.1);
        doc.setDrawColor(0);
        xPositions.forEach(x => {
          doc.line(x, finalY, x, footerY);
        });
      }

      // @ts-ignore
      doc.autoTable({
        body: [[
          { content: 'TO COLLECTION', styles: { fontStyle: 'bold', halign: 'right', lineWidth: 0.1 } },
          { content: formatCurrency(billTotal).replace('RM', ''), styles: { fontStyle: 'bold', halign: 'right', lineWidth: 0.1 } }
        ]],
        startY: footerY,
        theme: 'grid',
        styles: { fontSize: 7.5, cellPadding: 0.8, lineColor: 0, lineWidth: 0.1, textColor: 0 },
        columnStyles: { 0: { cellWidth: 165 }, 1: { cellWidth: 25 } },
        margin: { left: 10, right: 10 },
        showHead: false
      });
      bqSectionIdx++;
    }

    doc.addPage();
    const grandTotal = bqData.reduce((acc: number, g: any) => acc + g.items.reduce((s: number, i: any) => s + (i.amount || 0), 0), 0);
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("RINGKASAN", pageWidth / 2, 20, { align: "center" });

    const summaryBody = bqData.map((b: any) => [
      { content: b.title, styles: { fontStyle: 'bold' } },
      { content: formatCurrency(b.items.reduce((s: number, i: any) => s + (i.amount || 0), 0)).replace('RM', ''), styles: { halign: 'right', fontStyle: 'bold' } }
    ]);

    // @ts-ignore
    doc.autoTable({
      startY: 30,
      head: [['KETERANGAN', 'JUMLAH (RM)']],
      body: summaryBody,
      foot: [[{ content: 'TOTAL COLLECTION', styles: { halign: 'center' } }, { content: formatCurrency(grandTotal).replace('RM', ''), styles: { halign: 'right' } }]],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.0, lineColor: 0, lineWidth: 0.1 },
      headStyles: { fillColor: 240, textColor: 0, fontStyle: 'bold' },
      footStyles: { fillColor: 240, textColor: 0, fontStyle: 'bold' },
      margin: { left: 20, right: 20 }
    });

    y = doc.lastAutoTable.finalY + 15;
    const notes = "Sebelum kerja-kerja dimulakan pemborong dikehendaki melawat tapak bersama dengan Penolong Jurutera kawasan untuk mempastikan tempat dan menyelesaikan masalah berbangkit di tapak sebelum memulakan kerja. Kontraktor adalah dikecualikan daripada mengemukakkan Bon Perlaksanaan. Walaubagaimanapun, tempoh tanggungan kecacatan seperti di bawah juga dikenakan kepada kontraktor dan syarat ini hendaklah dinyatakan dalam surat tawaran.\n( Rujuk Kementerian Kewangan Surat Pekeliling Perbendaharaan Bil 3 Tahun 2007)";

    // @ts-ignore
    doc.autoTable({
      startY: y, margin: { left: 20, right: 20 }, body: [[notes]], theme: 'plain',
      styles: { fontSize: 9, font: "helvetica", halign: 'justify', cellPadding: 0 },
      columnStyles: { 0: { cellWidth: 170 } }
    });

    y = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text("Nilai Projek", 20, y); doc.text("Tempoh Tanggungan Kecacatan", 100, y);
    y += 5; doc.setFont("helvetica", "normal");
    doc.text("RM 10,000 - RM 100,000", 20, y); doc.text("6 Bulan dari tarikh kerja diperakukan siap", 100, y);
    y += 5; doc.text("Melebihi RM 100,000", 20, y); doc.text("12 bulan dari tarikh kerja diperakukan siap", 100, y);

    y = 250; doc.setFont("helvetica", "bold"); doc.text("Disediakan oleh", 20, y); doc.text("Disemak oleh,", 120, y);
    y += 20; doc.line(20, y, 80, y); doc.line(120, y, 180, y);

    doc.save(`BQ_${formData.lokasi || 'Draft'}.pdf`);
  }

  static async exportPelarasan(formData: any, locationRows: ProjectLocation[]): Promise<void> {
    const jsPDF = PDFBaseHelper.getJsPDF();
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const pelarasanData = formData.bqDataPelarasan || [];
    const originalData = formData.bqData || [];

    let pelSectionIdx = 0;

    for (const bill of pelarasanData) {
      if (pelSectionIdx > 0) doc.addPage();
      const originalBill = originalData.find((b: any) => b.id === bill.id);
      const isPermulaan = bill.title.toUpperCase().includes('PERMULAAN') || bill.title.toUpperCase().includes('INSURANS');
      const billLocs = bill.locationIds || (bill.locationId ? [bill.locationId] : []);
      let locText = isPermulaan ? (locationRows || []).map(l => l.lokasi).join('\n') : ((locationRows || []).filter(l => billLocs.includes(l.id)).map(l => l.lokasi).join('\n') || 'TIADA LOKASI');
      let aduanText = isPermulaan ? (locationRows || []).map(l => l.aduan).join('\n') : ((locationRows || []).filter(l => billLocs.includes(l.id)).map(l => l.aduan).join('\n') || '');

      const tableBody = [];
      const sideOnlyBorder = { top: 0, right: 0.1, bottom: 0, left: 0.1 };
      const titleBorder = { top: 0.1, right: 0.1, bottom: 0, left: 0.1 };

      tableBody.push([{ content: bill.title, colSpan: 7, styles: { fontStyle: 'bold', halign: 'left', lineWidth: titleBorder, fillColor: [245, 245, 245] } }]);

      bill.items.forEach((item: BQItem, itemIndex: number) => {
        const autoNum = getAutoNumber(bill.items, itemIndex);
        const isHeader = item.type === 'HEADER';
        const originalItem = originalBill?.items.find((i: any) => i.id === item.id);
        const isAddition = item.isAdjustment === true;

        let descText = item.description;
        if (item.variant) descText += `\n${item.variant}`;

        const rowFontStyle = isAddition ? 'bold' : (isHeader ? 'bold' : 'normal');
        const textColor = isAddition ? [0, 80, 200] : [0, 0, 0];

        const rawParts = (!isHeader && item.calculationParts) ? item.calculationParts : [];
        const activeParts = rawParts.filter(p => (p.hasLength && typeof p.length === 'number') || (p.hasWidth && typeof p.width === 'number') || (p.hasDepth && typeof p.depth === 'number') || p.multiplier !== 1 || (p.label && p.label.trim() !== ''));

        const rawOrigParts = (originalItem && !isHeader && originalItem.calculationParts) ? originalItem.calculationParts : [];
        const activeOrigParts = rawOrigParts.filter(p => (p.hasLength && typeof p.length === 'number') || (p.hasWidth && typeof p.width === 'number') || (p.hasDepth && typeof p.depth === 'number') || p.multiplier !== 1 || (p.label && p.label.trim() !== ''));

        const fmtQty = (val: number | undefined, forceZero: boolean = false) => {
          if (val === undefined || val === null || isNaN(val)) return '';
          if (val === 0 && !forceZero) return '';
          return val % 1 === 0 ? val.toString() : parseFloat(val.toFixed(2)).toString();
        };
        const fmtAmt = (val: number | undefined, allowZero: boolean = false) => {
          if (val === undefined || val === null || isNaN(val)) return '';
          if (val === 0 && !allowZero) return '';
          return formatCurrency(val).replace('RM', '');
        };

        const getDimStr = (p: any, includeItemDesc: boolean = false) => {
          if (!p) return includeItemDesc ? (item.description || '') : '';
          const partsStr = [];
          const hasDimensions = (p.hasLength && typeof p.length === 'number') || (p.hasWidth && typeof p.width === 'number') || (p.hasDepth && typeof p.depth === 'number');

          if (p.hasLength && typeof p.length === 'number') partsStr.push(`${p.length}m(P)`);
          if (p.hasWidth && typeof p.width === 'number') partsStr.push(`${p.width}m(L)`);
          if (p.hasDepth && typeof p.depth === 'number') partsStr.push(`${p.depth}m(T)`);

          let str = partsStr.join(' x ');

          if (hasDimensions) {
            if (p.multiplier !== 1) str += ` x ${p.multiplier}`;
            if (p.label) str += ` - ${p.label}`;
          } else {
            let base = includeItemDesc ? item.description : '';
            let inlineParts = [];
            if (p.label) inlineParts.push(`- ${p.label}`);
            if (p.multiplier !== 1) inlineParts.push(`x ${p.multiplier}`);

            let inline = inlineParts.join(' ');
            if (base && inline) str = `${base} ${inline}`;
            else if (base) str = base;
            else {
              str = inline.trim();
              if (str.startsWith('- ')) str = str.substring(2);
            }
          }
          return str.trim();
        };

        const hasPartChanged = (p: any, pOrig: any) => {
          if (!pOrig) return true;
          return p.length !== pOrig.length || p.width !== pOrig.width || p.depth !== pOrig.depth ||
            p.multiplier !== pOrig.multiplier || p.label !== pOrig.label;
        };

        const hasChanged = isAddition || (originalItem ? (
          item.qty !== originalItem.qty || item.amount !== originalItem.amount || item.rate !== originalItem.rate ||
          activeParts.length !== activeOrigParts.length ||
          activeParts.some((p, idx) => hasPartChanged(p, activeOrigParts[idx]))
        ) : false);

        const isInlineType = !isHeader && activeParts.length === 1 &&
          !(activeParts[0].hasLength || activeParts[0].hasWidth || activeParts[0].hasDepth);

        const showSubRows = (activeParts.length > 0 || activeOrigParts.length > 0) && !isInlineType;
        const isInlineChange = isInlineType && hasChanged;
        const hideMainValues = showSubRows || isInlineChange;

        if (isInlineType && !hasChanged) {
          const p = activeParts[0];
          let inlineParts = [];
          if (p.label) inlineParts.push(`- ${p.label}`);
          if (p.multiplier !== 1) inlineParts.push(`x ${p.multiplier}`);
          let inline = inlineParts.join(' ');
          if (inline) descText += ` ${inline}`;
        }

        const showZero = !!(originalItem && (originalItem.qty || 0) > 0);
        const cellTextColor = (item.qty === 0 && showZero) ? [200, 0, 0] : textColor;

        // 1. Push Main Item Row
        tableBody.push([
          { content: autoNum, styles: { halign: 'center', valign: 'top', lineWidth: sideOnlyBorder, fontStyle: rowFontStyle as any, textColor: textColor as any } },
          { content: isInlineChange ? '' : descText, styles: { fontStyle: rowFontStyle as any, lineWidth: sideOnlyBorder, textColor: textColor as any } },
          { content: (hideMainValues || isHeader) ? '' : item.unit, styles: { halign: 'center', valign: 'top', lineWidth: sideOnlyBorder, textColor: cellTextColor as any } },
          { content: (hideMainValues || isHeader) ? '' : fmtQty(item.qty, showZero), styles: { halign: 'center', valign: 'top', lineWidth: sideOnlyBorder, textColor: cellTextColor as any } },
          { content: (hideMainValues || isHeader) ? '' : (item.rate ? formatCurrency(item.rate).replace('RM', '') : ''), styles: { halign: 'right', valign: 'top', lineWidth: sideOnlyBorder, textColor: cellTextColor as any } },
          { content: (!hasChanged && !hideMainValues && !isHeader) ? fmtAmt(item.amount, showZero) : '', styles: { halign: 'right', valign: 'top', lineWidth: sideOnlyBorder, textColor: textColor as any } },
          { content: (hideMainValues || isHeader) ? '' : fmtAmt(item.amount, showZero), styles: { halign: 'right', valign: 'top', lineWidth: sideOnlyBorder, textColor: cellTextColor as any, fontStyle: rowFontStyle as any } }
        ]);

        // 2. Push Calculation Parts with Side-by-Side logic
        if (isInlineChange) {
          if (isAddition) {
            const pCurr = activeParts[0];
            tableBody.push([
              { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
              { content: getDimStr(pCurr, true), styles: { fontsize: 6.5, fontStyle: 'bold', textColor: [0, 80, 200], lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5, left: 3 } } },
              { content: item.unit, styles: { halign: 'center', fontsize: 6.5, textColor: [0, 80, 200], lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
              { content: fmtQty(item.qty), styles: { halign: 'center', fontsize: 6.5, textColor: [0, 80, 200], lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
              { content: item.rate ? formatCurrency(item.rate).replace('RM', '') : '', styles: { halign: 'right', fontsize: 6.5, textColor: [0, 80, 200], lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
              { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
              { content: fmtAmt(item.amount, true), styles: { halign: 'right', fontsize: 6.5, textColor: [0, 80, 200], fontStyle: 'bold', lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } }
            ]);
          } else if (originalItem) {
            const pOrig = activeOrigParts[0];
            const pCurr = activeParts[0];
            const partColor = item.amount < (originalItem.amount || 0) ? [200, 0, 0] : [0, 80, 200];

            // 1. Original Line (Black)
            tableBody.push([
              { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1 } } },
              { content: getDimStr(pOrig, true), styles: { fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1, left: 3 } } },
              { content: item.unit, styles: { halign: 'center', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1 } } },
              { content: fmtQty(originalItem.qty), styles: { halign: 'center', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1 } } },
              { content: originalItem.rate ? formatCurrency(originalItem.rate).replace('RM', '') : '', styles: { halign: 'right', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1 } } },
              { content: fmtAmt(originalItem.amount), styles: { halign: 'right', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1 } } },
              { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1 } } }
            ]);
            // 2. Adjusted Line (Colored)
            tableBody.push([
              { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
              { content: getDimStr(pCurr, true), styles: { fontsize: 6.5, fontStyle: 'bold', textColor: partColor as any, lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5, left: 3 } } },
              { content: item.unit, styles: { halign: 'center', fontsize: 6.5, textColor: partColor as any, lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
              { content: fmtQty(item.qty), styles: { halign: 'center', fontsize: 6.5, textColor: partColor as any, lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
              { content: item.rate ? formatCurrency(item.rate).replace('RM', '') : '', styles: { halign: 'right', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 }, textColor: partColor as any } },
              { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
              { content: fmtAmt(item.amount, true), styles: { halign: 'right', fontsize: 6.5, textColor: partColor as any, fontStyle: 'bold', lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } }
            ]);
          }
        } else if (!isHeader && showSubRows) {
          const processedOrigIds = new Set<string>();
          activeParts.forEach(p => {
            const pOrig = activeOrigParts.find(op => op.id === p.id);
            if (pOrig) processedOrigIds.add(pOrig.id);
            let product = 1;
            if (p.hasLength && typeof p.length === 'number') product *= p.length;
            if (p.hasWidth && typeof p.width === 'number') product *= p.width;
            if (p.hasDepth && typeof p.depth === 'number') product *= p.depth;
            const pQtyVal = product * p.multiplier;
            const pAmt = pQtyVal * item.rate;
            const hasDimensions = (p.hasLength && typeof p.length === 'number') || (p.hasWidth && typeof p.width === 'number') || (p.hasDepth && typeof p.depth === 'number');
            const isPartInlineType = !hasDimensions && activeParts.length === 1;
            const dimStr = getDimStr(p, isPartInlineType);

            if (isAddition) {
              tableBody.push([
                { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
                { content: dimStr, styles: { fontsize: 6.5, fontStyle: 'bold', textColor: [0, 80, 200], lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5, left: 3 } } },
                { content: item.unit, styles: { halign: 'center', fontsize: 6.5, textColor: [0, 80, 200], lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
                { content: fmtQty(pQtyVal), styles: { halign: 'center', fontsize: 6.5, textColor: [0, 80, 200], lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
                { content: item.rate ? formatCurrency(item.rate).replace('RM', '') : '', styles: { halign: 'right', fontsize: 6.5, textColor: [0, 80, 200], lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
                { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
                { content: fmtAmt(pAmt, true), styles: { halign: 'right', fontsize: 6.5, textColor: [0, 80, 200], fontStyle: 'bold', lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } }
              ]);
            } else if (!pOrig) {
              tableBody.push([
                { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
                { content: dimStr, styles: { fontsize: 6.5, fontStyle: 'bold', textColor: [0, 80, 200], lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5, left: 3 } } },
                { content: item.unit, styles: { halign: 'center', fontsize: 6.5, textColor: [0, 80, 200], lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
                { content: fmtQty(pQtyVal), styles: { halign: 'center', fontsize: 6.5, textColor: [0, 80, 200], lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
                { content: item.rate ? formatCurrency(item.rate).replace('RM', '') : '', styles: { halign: 'right', fontsize: 6.5, textColor: [0, 80, 200], lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
                { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
                { content: fmtAmt(pAmt, true), styles: { halign: 'right', fontsize: 6.5, textColor: [0, 80, 200], fontStyle: 'bold', lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } }
              ]);
            } else if (hasPartChanged(p, pOrig)) {
              let origProd = 1; if (pOrig.hasLength) origProd *= pOrig.length; if (pOrig.hasWidth) origProd *= pOrig.width; if (pOrig.hasDepth) origProd *= pOrig.depth;
              const pOrigAmt = (origProd * pOrig.multiplier) * (originalItem?.rate || 0);
              const partColor = pAmt < pOrigAmt ? [200, 0, 0] : [0, 80, 200];
              const dimStrOrig = getDimStr(pOrig, false);

              tableBody.push([
                { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1 } } },
                { content: dimStrOrig, styles: { fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1, left: 3 } } },
                { content: item.unit, styles: { halign: 'center', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1 } } },
                { content: fmtQty(origProd * pOrig.multiplier), styles: { halign: 'center', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1 } } },
                { content: originalItem?.rate ? formatCurrency(originalItem.rate).replace('RM', '') : '', styles: { halign: 'right', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1 } } },
                { content: fmtAmt(pOrigAmt), styles: { halign: 'right', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1 } } },
                { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1 } } }
              ]);
              tableBody.push([
                { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
                { content: dimStr, styles: { fontsize: 6.5, fontStyle: 'bold', textColor: partColor as any, lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5, left: 3 } } },
                { content: item.unit, styles: { halign: 'center', fontsize: 6.5, textColor: partColor as any, lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
                { content: fmtQty(pQtyVal), styles: { halign: 'center', fontsize: 6.5, textColor: partColor as any, lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
                { content: item.rate ? formatCurrency(item.rate).replace('RM', '') : '', styles: { halign: 'right', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 }, textColor: partColor as any } },
                { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
                { content: fmtAmt(pAmt, true), styles: { halign: 'right', fontsize: 6.5, textColor: partColor as any, fontStyle: 'bold', lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } }
              ]);
            } else {
              tableBody.push([
                { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0, bottom: 0.5 } } },
                { content: dimStr, styles: { fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0, bottom: 0.5, left: 3 } } },
                { content: item.unit, styles: { halign: 'center', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0, bottom: 0.5 } } },
                { content: fmtQty(pQtyVal), styles: { halign: 'center', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0, bottom: 0.5 } } },
                { content: item.rate ? formatCurrency(item.rate).replace('RM', '') : '', styles: { halign: 'right', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0, bottom: 0.5 } } },
                { content: fmtAmt(pAmt), styles: { halign: 'right', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0, bottom: 0.5 } } },
                { content: fmtAmt(pAmt), styles: { halign: 'right', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0, bottom: 0.5 } } }
              ]);
            }
          });
          activeOrigParts.forEach(pOrig => {
            if (!processedOrigIds.has(pOrig.id)) {
              let origProd = 1; if (pOrig.hasLength) origProd *= pOrig.length; if (pOrig.hasWidth) origProd *= pOrig.width; if (pOrig.hasDepth) origProd *= pOrig.depth;
              const pOrigAmt = (origProd * pOrig.multiplier) * (originalItem?.rate || 0);
              const dimStrOrig = getDimStr(pOrig, false);
              tableBody.push([
                { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1 } } },
                { content: dimStrOrig, styles: { fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1, left: 3 } } },
                { content: item.unit, styles: { halign: 'center', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1 } } },
                { content: fmtQty(origProd * pOrig.multiplier), styles: { halign: 'center', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1 } } },
                { content: originalItem?.rate ? formatCurrency(originalItem.rate).replace('RM', '') : '', styles: { halign: 'right', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1 } } },
                { content: fmtAmt(pOrigAmt), styles: { halign: 'right', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1 } } },
                { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0.2, bottom: 0.1 } } }
              ]);
              tableBody.push([
                { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
                { content: dimStrOrig, styles: { fontsize: 6.5, fontStyle: 'bold', textColor: [200, 0, 0], lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5, left: 3 } } },
                { content: item.unit, styles: { halign: 'center', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 }, textColor: [200, 0, 0] } },
                { content: '0', styles: { halign: 'center', fontsize: 6.5, textColor: [200, 0, 0], lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
                { content: item.rate ? formatCurrency(item.rate).replace('RM', '') : '', styles: { halign: 'right', fontsize: 6.5, lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 }, textColor: [200, 0, 0] } },
                { content: '', styles: { lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } },
                { content: '0.00', styles: { halign: 'right', fontsize: 6.5, textColor: [200, 0, 0], fontStyle: 'bold', lineWidth: sideOnlyBorder, cellPadding: { top: 0.1, bottom: 0.5 } } }
              ]);
            }
          });
        }
      });
      const billTotal = bill.items.reduce((s: number, i: any) => s + (i.amount || 0), 0);
      const originalBillTotal = originalBill?.items.reduce((s: number, i: any) => s + (i.amount || 0), 0) || 0;

      let tableStartY = 15;
      if (pelSectionIdx === 0) {
        // @ts-ignore
        doc.autoTable({
          body: [[{ content: `${formData.namaProjek?.toUpperCase()}`, colSpan: 7, styles: { halign: 'center', fontStyle: 'bold', fontSize: 8 } }]],
          theme: 'grid', startY: 15, styles: { lineWidth: 0.1, lineColor: 0 }, margin: { left: 10, right: 10 }
        });
        // @ts-ignore
        tableStartY = doc.lastAutoTable.finalY;
      }

      const complexHead = [
        [{ content: 'LOKASI', colSpan: 4, styles: { halign: 'center', fontStyle: 'bold', fontSize: 7 } }, { content: 'ADUAN', colSpan: 3, styles: { halign: 'center', fontStyle: 'bold', fontSize: 7.5 } }],
        [{ content: locText, colSpan: 4, styles: { halign: 'center', fontSize: 7 } }, { content: aduanText, colSpan: 3, styles: { halign: 'center', fontSize: 7.5 } }],
        ['BIL', 'KETERANGAN', 'UNIT', 'KUANTITI', 'KADAR (RM)', 'ASAL (RM)', 'JUMLAH (RM)']
      ];

      const footerHeight = 8; const distBottom = 20; const footerY = pageHeight - distBottom - footerHeight;

      // @ts-ignore
      doc.autoTable({
        head: complexHead, body: tableBody, theme: 'plain', startY: tableStartY, rowPageBreak: 'avoid', showHead: 'everyPage',
        margin: { top: 20, left: 10, right: 10, bottom: distBottom + footerHeight + 5 },
        styles: { fontSize: 6.3, cellPadding: 0.6, textColor: 0 },
        headStyles: { fillColor: 255, textColor: 0, fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 9 }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 10 }, 3: { cellWidth: 15 }, 4: { cellWidth: 15 }, 5: { cellWidth: 20 }, 6: { cellWidth: 20 } },
        didDrawCell: (data: any) => {
          doc.setDrawColor(0); doc.setLineWidth(0.1);
          doc.line(data.cell.x, data.cell.y, data.cell.x, data.cell.y + data.cell.height);
          doc.line(data.cell.x + data.cell.width, data.cell.y, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
          if (data.section === 'head' || (data.section === 'body' && data.row.index === 0)) {
            doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
            doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
          }
        }
      });

      // @ts-ignore
      const finalY = doc.lastAutoTable.finalY;
      if (finalY < footerY) {
        const xPositions = [10, 19, 120, 130, 145, 160, 180, 200];
        doc.setLineWidth(0.1); doc.setDrawColor(0);
        xPositions.forEach(x => { doc.line(x, finalY, x, footerY); });
      }

      // @ts-ignore
      doc.autoTable({
        body: [[
          { content: 'TO COLLECTION', styles: { fontStyle: 'bold', halign: 'right', lineWidth: 0.1 } },
          { content: originalBillTotal === 0 ? '' : formatCurrency(originalBillTotal).replace('RM', ''), styles: { fontStyle: 'bold', halign: 'right', lineWidth: 0.1 } },
          { content: billTotal === 0 ? '' : formatCurrency(billTotal).replace('RM', ''), styles: { fontStyle: 'bold', halign: 'right', lineWidth: 0.1 } }
        ]],
        startY: footerY, theme: 'grid', styles: { fontSize: 7, cellPadding: 0.8, lineColor: 0, lineWidth: 0.1, textColor: 0 },
        columnStyles: { 0: { cellWidth: 150 }, 1: { cellWidth: 20 }, 2: { cellWidth: 20 } },
        margin: { left: 10, right: 10 }, showHead: false
      });
      pelSectionIdx++;
    }

    // --- SUMMARY PAGE ---
    doc.addPage();
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("RINGKASAN", pageWidth / 2, 20, { align: "center" });

    const summaryBody = pelarasanData.map((b: any) => {
      const orig = originalData.find((ob: any) => ob.id === b.id)?.items.reduce((s: number, i: any) => s + (i.amount || 0), 0) || 0;
      const laras = b.items.reduce((s: number, i: any) => s + (i.amount || 0), 0);
      const diff = parseFloat((laras - orig).toFixed(2));
      return [
        { content: b.title, styles: { fontStyle: 'bold' } },
        { content: formatCurrency(orig).replace('RM', ''), styles: { halign: 'right' } },
        { content: formatCurrency(laras).replace('RM', ''), styles: { halign: 'right', fontStyle: 'bold' } },
        { content: Math.abs(diff) < 0.01 ? '-' : (diff > 0 ? '+' : '') + formatCurrency(diff).replace('RM', ''), styles: { halign: 'right', fontStyle: 'bold', textColor: diff > 0.01 ? [0, 80, 200] : (diff < -0.01 ? [200, 0, 0] : [0, 0, 0]) } }
      ];
    });

    const grandTotalOrig = originalData.reduce((acc: number, g: any) => acc + g.items.reduce((s: number, i: any) => s + (i.amount || 0), 0), 0);
    const grandTotalLaras = pelarasanData.reduce((acc: number, g: any) => acc + g.items.reduce((s: number, i: any) => s + (i.amount || 0), 0), 0);
    const grandTotalDiff = parseFloat((grandTotalLaras - grandTotalOrig).toFixed(2));

    // @ts-ignore
    doc.autoTable({
      startY: 30, head: [['KETERANGAN', 'ASAL (RM)', 'LARAS (RM)', 'BEZA (+/-)']], body: summaryBody,
      foot: [[
        { content: 'JUMLAH KESELURUHAN', styles: { halign: 'center' } },
        { content: formatCurrency(grandTotalOrig).replace('RM', ''), styles: { halign: 'right' } },
        { content: formatCurrency(grandTotalLaras).replace('RM', ''), styles: { halign: 'right' } },
        { content: Math.abs(grandTotalDiff) < 0.01 ? '-' : (grandTotalDiff > 0 ? '+' : '') + formatCurrency(grandTotalDiff).replace('RM', ''), styles: { halign: 'right' } }
      ]],
      theme: 'grid', styles: { fontSize: 8, cellPadding: 1.5, lineColor: 0, lineWidth: 0.1 },
      headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
      footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
      margin: { left: 15, right: 15 }
    });

    let y = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(0); doc.text("HARGA AKHIR", 20, y);
    const valBQAsal = Number(grandTotalOrig) || 0;
    const valBQLarasRaw = Number(grandTotalLaras) || 0;
    const valPotongan = valBQAsal - valBQLarasRaw;
    const valWT = Number(formData.wangTahanan) || 0;
    const valLAD = Number(formData.ladAmount) || 0;
    const valLoC = Number(formData.locAmount) || 0;
    const valBase = Math.min(valBQLarasRaw, valBQAsal);
    const finalPayment = valBase - valWT - valLAD - valLoC;

    const calculationData = [
      ["HARGA KONTRAK", formatCurrency(valBQAsal).replace('RM', '').trim()],
      ["POTONGAN", valPotongan > 0 ? formatCurrency(valPotongan).replace('RM', '').trim() : '-'],
      ["WANG TAHANAN", valWT > 0 ? `-${formatCurrency(valWT).replace('RM', '').trim()}` : '-'],
      ["LAD", valLAD > 0 ? `-${formatCurrency(valLAD).replace('RM', '').trim()}` : '-'],
      ["LOC", valLoC > 0 ? `-${formatCurrency(valLoC).replace('RM', '').trim()}` : '-'],
      [{ content: "JUMLAH DIBAYAR", styles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: 0 } }, { content: formatCurrency(finalPayment).replace('RM', '').trim(), styles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: 0 } }]
    ];

    // @ts-ignore
    doc.autoTable({
      startY: y + 5, body: calculationData, theme: 'grid', styles: { fontSize: 8, cellPadding: 1.2, lineColor: 0, lineWidth: 0.1, textColor: 0 },
      columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 40, halign: 'right' } }, margin: { left: 20, right: 20 }
    });

    y = doc.lastAutoTable.finalY + 15;
    const notes = "Sebelum kerja-kerja dimulakan pemborong dikehendaki melawat tapak bersama dengan Penolong Jurutera kawasan untuk mempastikan tempat dan menyelesaikan masalah berbangkit di tapak sebelum memulakan kerja. Kontraktor adalah dikecualikan daripada mengemukakkan Bon Perlaksanaan. Walaubagaimanapun, tempoh tanggungan kecacatan seperti di bawah juga dikenakan kepada kontraktor dan syarat ini hendaklah dinyatakan dalam surat tawaran.\n( Rujuk Kementerian Kewangan Surat Pekeliling Perbendaharaan Bil 3 Tahun 2007)";

    // @ts-ignore
    doc.autoTable({
      startY: y, margin: { left: 20, right: 20 }, body: [[notes]], theme: 'plain',
      styles: { fontSize: 9, font: "helvetica", halign: 'justify', cellPadding: 0 },
      columnStyles: { 0: { cellWidth: 170 } }
    });

    y = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text("Nilai Projek", 20, y); doc.text("Tempoh Tanggungan Kecacatan", 100, y);
    y += 5; doc.setFont("helvetica", "normal");
    doc.text("RM 10,000 - RM 100,000", 20, y); doc.text("6 Bulan dari tarikh kerja diperakukan siap", 100, y);
    y += 5; doc.text("Melebihi RM 100,000", 20, y); doc.text("12 bulan dari tarikh kerja diperakukan siap", 100, y);

    y = 250; doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("Disediakan oleh", 20, y); doc.text("Disemak oleh,", 120, y);
    y += 20; doc.line(20, y, 80, y); doc.line(120, y, 180, y);
    doc.save(`BQ_Pelarasan_${formData.noFail || 'Draft'}.pdf`);
  }
}
