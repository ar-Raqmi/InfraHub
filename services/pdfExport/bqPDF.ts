import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project, BQGroup, BQItem, formatCurrency } from '../../types';

/**
 * Generate BQ PDF matching the bqReference format
 * Includes:
 * - Project header with title and location
 * - Table with columns: BIL | KETERANGAN | UNIT | KUANTITI | KADAR HARGA (RM) | JUMLAH (RM)
 * - Hierarchical numbering (BIL NO. 1, 1.0, 2.0, etc.)
 * - Calculation formulas in description
 * - "TO COLLECTION" subtotals for each group
 * - Grand total at bottom
 * - Signature section with contract period info
 */
export const generateBQPDF = (project: Project) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  let yPosition = 15;

  // ===== HEADER =====
  // Title: "CADANGAN KERJA-KERJA ..." (ALL CAPS for first letter style)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');

  const title = project.namaProjek.toUpperCase();
  const titleLines = doc.splitTextToSize(title, pageWidth - 30);
  titleLines.forEach((line: string) => {
    doc.text(line, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;
  });

  // Location (if available from first BQ group or aduanList)
  const location = project.aduanList && project.aduanList.length > 0
    ? project.aduanList[0].lokasi
    : (project.lokasi || project.bqData?.[0]?.location || '');

  if (location) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(location, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;
  } else {
    yPosition += 3;
  }

  // ===== BQ TABLE =====
  const tableData: any[] = [];
  let grandTotal = 0;
  let itemCounter = 1;

  // Process each BQ Group
  if (project.bqData && project.bqData.length > 0) {
    project.bqData.forEach((group: BQGroup, groupIndex: number) => {
      let groupTotal = 0;

      // Group header row (BIL NO. X - TITLE)
      const groupTitle = group.bilNo
        ? `${group.bilNo} - ${group.title}`
        : `BIL NO. ${groupIndex + 1} - ${group.title}`;

      tableData.push([
        { content: groupTitle, colSpan: 6, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }
      ]);

      // Group items
      group.items.forEach((item: BQItem) => {
        if (item.isHeader) {
          // Header item (bold, no values)
          tableData.push([
            '',
            { content: item.description, styles: { fontStyle: 'bold' } },
            '',
            '',
            '',
            ''
          ]);
        } else {
          // Regular item
          const qty = Number(item.qty) || 0;
          const rate = Number(item.rate) || 0;
          const amount = Number(item.amount) || 0;

          groupTotal += amount;

          // Build description with formula if available
          let description = item.description;
          if (item.calculationFormula) {
            description = `${description}\n${item.calculationFormula}`;
          }

          tableData.push([
            itemCounter.toString(),
            description,
            item.unit || '',
            qty > 0 ? qty.toFixed(2) : '',
            rate > 0 ? rate.toFixed(2) : '',
            amount > 0 ? amount.toFixed(2) : ''
          ]);

          itemCounter++;
        }
      });

      // TO COLLECTION row for this group
      tableData.push([
        '',
        { content: 'TO COLLECTION', styles: { fontStyle: 'bold', halign: 'right' } },
        '',
        '',
        '',
        { content: groupTotal.toFixed(2), styles: { fontStyle: 'bold' } }
      ]);

      grandTotal += groupTotal;

      // Add spacing between groups
      if (groupIndex < project.bqData!.length - 1) {
        tableData.push([
          { content: '', colSpan: 6, styles: { fillColor: [255, 255, 255], minCellHeight: 3 } }
        ]);
      }
    });

    // Grand Total
    tableData.push([
      '',
      { content: 'JUMLAH KESELURUHAN (RM)', styles: { fontStyle: 'bold', halign: 'right', fillColor: [230, 230, 230] } },
      '',
      '',
      '',
      { content: grandTotal.toFixed(2), styles: { fontStyle: 'bold', fillColor: [230, 230, 230] } }
    ]);
  }

  // Generate table
  autoTable(doc, {
    head: [['BIL', 'KETERANGAN', 'UNIT', 'KUANTITI', 'KADAR HARGA (RM)', 'JUMLAH (RM)']],
    body: tableData,
    startY: yPosition,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 2,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
      lineWidth: 0.5,
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },  // BIL
      1: { cellWidth: 80 },                     // KETERANGAN
      2: { cellWidth: 20, halign: 'center' },   // UNIT
      3: { cellWidth: 22, halign: 'center' },   // KUANTITI
      4: { cellWidth: 28, halign: 'right' },    // KADAR HARGA
      5: { cellWidth: 28, halign: 'right' },    // JUMLAH
    },
    margin: { left: 10, right: 10 },
    didDrawPage: (data) => {
      // Page number footer
      const pageNum = doc.getCurrentPageInfo().pageNumber;
      doc.setFontSize(8);
      doc.text(`Muka surat ${pageNum}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
  });

  // ===== SIGNATURE SECTION =====
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Check if we need a new page for signature section
  if (finalY > pageHeight - 60) {
    doc.addPage();
    yPosition = 20;
  } else {
    yPosition = finalY;
  }

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  // Project value range info
  doc.text('Nilai Projek: RM ' + (grandTotal || project.kosProjek || 0).toFixed(2), 15, yPosition);
  yPosition += 6;

  // Contract period (if available)
  if (project.tempohKontrak) {
    const unitLabel = project.tempohKontrakUnit === 'HARI' ? 'Hari'
      : project.tempohKontrakUnit === 'MINGGU' ? 'Minggu'
      : 'Bulan';
    doc.text(`Tempoh Kontrak: ${project.tempohKontrak} ${unitLabel}`, 15, yPosition);
    yPosition += 10;
  } else {
    yPosition += 6;
  }

  // Signature section
  doc.setFont('helvetica', 'bold');
  doc.text('Disediakan oleh:', 15, yPosition);
  doc.text('Disemak oleh:', 110, yPosition);
  yPosition += 20;

  // Signature lines
  doc.setFont('helvetica', 'normal');
  doc.line(15, yPosition, 85, yPosition);
  doc.line(110, yPosition, 180, yPosition);
  yPosition += 5;

  // Names and dates
  doc.setFontSize(8);
  doc.text('Nama:', 15, yPosition);
  doc.text('Nama:', 110, yPosition);
  yPosition += 5;
  doc.text('Tarikh:', 15, yPosition);
  doc.text('Tarikh:', 110, yPosition);

  // Save the PDF
  const filename = `BQ_${project.noFail.replace(/\//g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};
