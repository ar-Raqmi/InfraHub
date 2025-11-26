import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project, BQGroup, BQItem } from '../../types';

/**
 * Generate BQ Pelarasan PDF with original vs adjusted comparison
 * Includes:
 * - Side-by-side comparison table
 * - Original BQ columns (left)
 * - Adjusted columns (right)
 * - Variance column (difference)
 * - Summary section with totals and variance
 * - Notes/remarks if any
 */
export const generateBQPelarasanPDF = (project: Project) => {
  const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for wider table
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  let yPosition = 15;

  // ===== HEADER =====
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('BQ PELARASAN / VARIATION ORDER', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const titleLines = doc.splitTextToSize(project.namaProjek.toUpperCase(), pageWidth - 40);
  titleLines.forEach((line: string) => {
    doc.text(line, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;
  });

  // Project details
  doc.setFontSize(9);
  doc.text(`No. Fail: ${project.noFail}`, 15, yPosition);
  doc.text(`Kontraktor: ${project.namaSyarikat || '-'}`, pageWidth - 15, yPosition, { align: 'right' });
  yPosition += 10;

  // ===== COMPARISON TABLE =====
  const tableData: any[] = [];
  let originalTotal = 0;
  let adjustedTotal = 0;

  // Calculate original BQ total
  if (project.bqData && project.bqData.length > 0) {
    project.bqData.forEach((group: BQGroup) => {
      group.items.forEach((item: BQItem) => {
        if (!item.isHeader) {
          originalTotal += Number(item.amount) || 0;
        }
      });
    });
  }

  // Calculate adjusted BQ total
  if (project.bqPelarasanData && project.bqPelarasanData.length > 0) {
    project.bqPelarasanData.forEach((group: BQGroup) => {
      group.items.forEach((item: BQItem) => {
        if (!item.isHeader) {
          adjustedTotal += Number(item.amount) || 0;
        }
      });
    });
  }

  const variance = adjustedTotal - originalTotal;
  const variancePercent = originalTotal > 0 ? ((variance / originalTotal) * 100).toFixed(2) : '0.00';

  // ===== SUMMARY SECTION (Top) =====
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('RINGKASAN:', 15, yPosition);
  yPosition += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`BQ Asal: RM ${originalTotal.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}`, 20, yPosition);
  doc.text(`BQ Pelarasan: RM ${adjustedTotal.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}`, 90, yPosition);

  // Variance with color indicator
  const varianceText = `Perbezaan: RM ${Math.abs(variance).toLocaleString('ms-MY', { minimumFractionDigits: 2 })} (${variancePercent}%)`;
  if (variance > 0) {
    doc.setTextColor(220, 38, 38); // Red for increase
    doc.text(`${varianceText} ▲`, 170, yPosition);
  } else if (variance < 0) {
    doc.setTextColor(22, 163, 74); // Green for savings
    doc.text(`${varianceText} ▼`, 170, yPosition);
  } else {
    doc.text(varianceText, 170, yPosition);
  }
  doc.setTextColor(0, 0, 0); // Reset color
  yPosition += 10;

  // ===== DETAILED COMPARISON TABLE =====
  // Process each group and compare original vs adjusted
  let itemCounter = 1;

  if (project.bqPelarasanData && project.bqPelarasanData.length > 0) {
    project.bqPelarasanData.forEach((adjustedGroup: BQGroup, groupIndex: number) => {
      // Find matching original group
      const originalGroup = project.bqData?.[groupIndex];

      // Group header
      const groupTitle = adjustedGroup.bilNo
        ? `${adjustedGroup.bilNo} - ${adjustedGroup.title}`
        : `BIL NO. ${groupIndex + 1} - ${adjustedGroup.title}`;

      tableData.push([
        { content: groupTitle, colSpan: 10, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }
      ]);

      // Compare items
      adjustedGroup.items.forEach((adjustedItem: BQItem, itemIndex: number) => {
        const originalItem = originalGroup?.items?.[itemIndex];

        if (adjustedItem.isHeader) {
          // Header row
          tableData.push([
            '',
            { content: adjustedItem.description, colSpan: 9, styles: { fontStyle: 'bold' } }
          ]);
        } else {
          // Regular item - show comparison
          const origQty = Number(originalItem?.qty) || 0;
          const origRate = Number(originalItem?.rate) || 0;
          const origAmount = Number(originalItem?.amount) || 0;

          const adjQty = Number(adjustedItem.qty) || 0;
          const adjRate = Number(adjustedItem.rate) || 0;
          const adjAmount = Number(adjustedItem.amount) || 0;

          const amountVariance = adjAmount - origAmount;

          // Determine fill color based on variance
          let fillColor: number[] | undefined;
          if (amountVariance > 0) {
            fillColor = [254, 226, 226]; // Light red for increase
          } else if (amountVariance < 0) {
            fillColor = [220, 252, 231]; // Light green for savings
          }

          tableData.push([
            itemCounter.toString(),
            adjustedItem.description,
            adjustedItem.unit || '',
            // Original columns
            origQty > 0 ? origQty.toFixed(2) : '',
            origRate > 0 ? origRate.toFixed(2) : '',
            origAmount > 0 ? origAmount.toFixed(2) : '',
            // Adjusted columns
            adjQty > 0 ? adjQty.toFixed(2) : '',
            adjRate > 0 ? adjRate.toFixed(2) : '',
            adjAmount > 0 ? adjAmount.toFixed(2) : '',
            // Variance
            {
              content: amountVariance !== 0 ? amountVariance.toFixed(2) : '-',
              styles: {
                fontStyle: 'bold',
                fillColor: fillColor,
                textColor: amountVariance > 0 ? [185, 28, 28] : (amountVariance < 0 ? [21, 128, 61] : [0, 0, 0])
              }
            }
          ]);

          itemCounter++;
        }
      });

      // Group spacing
      if (groupIndex < project.bqPelarasanData!.length - 1) {
        tableData.push([
          { content: '', colSpan: 10, styles: { fillColor: [255, 255, 255], minCellHeight: 2 } }
        ]);
      }
    });
  }

  // Generate comparison table
  autoTable(doc, {
    head: [[
      'BIL',
      'KETERANGAN',
      'UNIT',
      { content: 'ASAL', colSpan: 3, styles: { halign: 'center', fillColor: [229, 231, 235] } }
    ], [
      '',
      '',
      '',
      'QTY',
      'RATE (RM)',
      'AMOUNT (RM)',
      'QTY',
      'RATE (RM)',
      'AMOUNT (RM)',
      'VARIANCE (RM)'
    ]],
    body: tableData,
    startY: yPosition,
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      lineWidth: 0.3,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },   // BIL
      1: { cellWidth: 70 },                     // KETERANGAN
      2: { cellWidth: 15, halign: 'center' },   // UNIT
      // Original columns (gray background)
      3: { cellWidth: 18, halign: 'center', fillColor: [249, 250, 251] },  // Orig QTY
      4: { cellWidth: 20, halign: 'right', fillColor: [249, 250, 251] },   // Orig RATE
      5: { cellWidth: 22, halign: 'right', fillColor: [249, 250, 251] },   // Orig AMOUNT
      // Adjusted columns (blue background)
      6: { cellWidth: 18, halign: 'center', fillColor: [239, 246, 255] },  // Adj QTY
      7: { cellWidth: 20, halign: 'right', fillColor: [239, 246, 255] },   // Adj RATE
      8: { cellWidth: 22, halign: 'right', fillColor: [239, 246, 255] },   // Adj AMOUNT
      // Variance column
      9: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },  // VARIANCE
    },
    margin: { left: 10, right: 10 },
    didDrawPage: (data) => {
      // Page number footer
      const pageNum = doc.getCurrentPageInfo().pageNumber;
      doc.setFontSize(8);
      doc.text(`Muka surat ${pageNum}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
  });

  // ===== FINAL SUMMARY =====
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  if (finalY < pageHeight - 40) {
    yPosition = finalY;
  } else {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('RUMUSAN KESELURUHAN:', 15, yPosition);
  yPosition += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  // Summary table
  const summaryData = [
    ['BQ Asal', `RM ${originalTotal.toFixed(2)}`],
    ['BQ Pelarasan', `RM ${adjustedTotal.toFixed(2)}`],
    [
      'Perbezaan',
      {
        content: `RM ${variance.toFixed(2)} (${variancePercent}%)`,
        styles: {
          fontStyle: 'bold',
          textColor: variance > 0 ? [185, 28, 28] : (variance < 0 ? [21, 128, 61] : [0, 0, 0])
        }
      }
    ]
  ];

  autoTable(doc, {
    body: summaryData,
    startY: yPosition,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold' },
      1: { cellWidth: 60, halign: 'right' }
    },
    margin: { left: 15 }
  });

  // Save the PDF
  const filename = `BQ_Pelarasan_${project.noFail.replace(/\//g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};
