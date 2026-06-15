import { Project, formatDate, formatCurrency } from '../../types';

export class LADPDFExporter {
    static async export(project: Project): Promise<void> {
        // --- Calculation Logic ---
        const contractSum = project.kosProjek || 0;
        const isSmallProject = contractSum < 20000;
        
        // BLR Constants based on image (6.65 - 0.25 = 6.4)
        const BLR = 6.65;
        const treasuryRate = 0.25;
        const effectiveRate = BLR - treasuryRate; // 6.4

        // Daily Rate
        let dailyRate = 0;
        if (isSmallProject) {
            dailyRate = 20.00;
        } else {
            dailyRate = Math.round(((contractSum * (effectiveRate / 100)) / 365 + Number.EPSILON) * 100) / 100;
        }

        // Days
        const daysLate = project.ladDays || 0;
        const totalLAD = Math.round((dailyRate * daysLate + Number.EPSILON) * 100) / 100;

        // Helper to format number to 2 decimals
        const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        // @ts-ignore
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        const margin = 20;
        const pageWidth = 210;
        const contentWidth = pageWidth - (margin * 2); // 170mm
        let y = 20;

        // --- TITLE ---
        doc.setFont("helvetica","bold");
        doc.setFontSize(9);
        
        doc.text("TAJUK KERJA :", margin, y);
        
        doc.setFontSize(9);
        // Project Name wraps if too long
        const titleLines = doc.splitTextToSize(project.namaProjek.toUpperCase(), contentWidth - 30);
        doc.text(titleLines, margin + 30, y);
        y += (titleLines.length * 5) + 8; // Adjust spacing based on lines

        doc.setFontSize(10);
        const subTitle ="DENDA KELEWATAN MENYIAPKAN KERJA";
        doc.text(subTitle, margin, y);
        const textWidth = doc.getTextWidth(subTitle);
        doc.setLineWidth(0.3);
        doc.line(margin, y + 1, margin + textWidth, y + 1); // Underline
        y += 12;

        // --- INFO SECTION ---
        const labelX = margin;
        const colonX = margin + 80; // Increased width for long labels
        const valueX = margin + 83; // Adjusted value start
        const lineHeight = 7; // Increased line height for spacing

        const drawRow = (label: string, value: string, bold = false, boxed = false) => {
            doc.setFont("helvetica","normal");
            doc.setFontSize(9);
            doc.text(label, labelX, y);
            doc.text(":", colonX, y);
            
            doc.setFont("helvetica", bold ?"bold" :"normal");
            if (boxed) {
                const w = doc.getTextWidth(value) + 6;
                doc.setDrawColor(0);
                doc.setLineWidth(0.1);
                doc.rect(valueX, y - 4, w, 5.5);
                doc.text(value, valueX + 3, y);
            } else {
                const lines = doc.splitTextToSize(value, pageWidth - valueX - margin);
                doc.text(lines, valueX, y);
                if (lines.length > 1) {
                    y += (lines.length - 1) * 5;
                }
            }
            y += lineHeight;
        };

        drawRow("KONTRAKTOR", project.namaSyarikat?.toUpperCase() || '-', true);
        drawRow("KOS PROJEK", formatCurrency(contractSum), false, true);
        drawRow("NO FAIL", project.noFail || '-');
        drawRow("ADUN/ ZON", `${project.bp || ''} / ${project.zon || ''}`);
        drawRow("MUKIM", project.mukim || '-');
        
        y += 5; // Spacer

        // --- DATES SECTION ---
        drawRow("TARIKH MILIK TAPAK BINA", formatDate(project.tarikhSerahTapak));
        drawRow("TARIKH SIAP KERJA", formatDate(project.tarikhTamatKontrak));
        
        // TEMPOH KERJA (Custom Layout)
        const tempohNum = project.tempohKontrak?.replace(/\D/g,'') || '0';
        doc.setFont("helvetica","normal");
        doc.text("TEMPOH KERJA", labelX, y);
        doc.text(":", colonX, y);
        const tW = doc.getTextWidth(tempohNum) + 10;
        doc.setLineWidth(0.1);
        doc.rect(valueX, y - 4, tW, 5.5);
        doc.text(tempohNum, valueX + 5, y, { align: 'center' }); // Centered in box
        doc.text("MINGGU", valueX + tW + 3, y);
        y += lineHeight;

        y += 2;
        drawRow("TARIKH SURAT PERMOHONAN EOT","-");
        drawRow("NO RUJUKAN","-");
        y += 2;

        // EOT (Empty Box)
        doc.setFont("helvetica","normal");
        doc.text("TAMBAHAN TEMPOH EOT", labelX, y);
        doc.text(":", colonX, y);
        doc.rect(valueX, y - 4, 20, 5.5); // Empty box
        doc.text("MINGGU/HARI", valueX + 23, y);
        y += lineHeight + 3;

        drawRow("TARIKH TAMAT TEMPOH EOT","-");
        y += 2;
        drawRow("TARIKH MULA L.A.D", project.tarikhTamatKontrak ? formatDate(project.tarikhTamatKontrak) : '-');
        drawRow("TARIKH SIAP KERJA SEBENAR DI TAPAK", project.tarikhSiapSebenar ? formatDate(project.tarikhSiapSebenar) : '-');
        
        // KELEWATAN
        const lateDays = Math.max(0, daysLate).toString();
        doc.setFont("helvetica","normal");
        doc.text("TEMPOH KELEWATAN KERJA SELEPAS EOT", labelX, y);
        doc.text(":", colonX, y);
        const lW = doc.getTextWidth(lateDays) + 10;
        doc.rect(valueX, y - 4, lW, 5.5);
        doc.text(lateDays, valueX + (lW/2), y, { align: 'center' });
        doc.text("HARI", valueX + lW + 3, y);
        y += lineHeight + 8;

        // --- CALCULATION BOX ---
        const boxTopY = y;
        const boxPadding = 5;
        let boxY = y + boxPadding + 3;

        doc.setFontSize(9);
        doc.setFont("helvetica","normal");

        const note = isSmallProject 
            ? "Bagi Kontrak bernilai kurang RM 20,000.00, kadar Denda (LAD) adalah RM 20.00/hari rata."
            : `BLR ${BLR} ( Maklumat daripada Bahagian Perolehan )`;
        doc.text(note, margin + boxPadding, boxY);
        boxY += 12;

        const centerX = pageWidth / 2;

        if (!isSmallProject) {
            // Formula: Rate / 365
            const rateStr = effectiveRate.toFixed(1);
            // Center the formula roughly
            const fX = centerX - 30;
            
            doc.text(rateStr, fX, boxY);
            doc.setLineWidth(0.2);
            const rW = doc.getTextWidth(rateStr);
            doc.line(fX - 2, boxY + 1, fX + rW + 2, boxY + 1); // Divider
            doc.text("365", fX, boxY + 5);
            
            doc.text("=", fX + 15, boxY + 3);
            doc.text(Number((effectiveRate / 365).toFixed(6)).toString(), fX + 20, boxY + 3);
            
            boxY += 15;

            // Big Calc Line
            const factorStr = Number((effectiveRate/365/100).toFixed(6)).toString();
            const factorW = doc.getTextWidth(factorStr);
            
            let cX = margin + boxPadding + 10;
            
            // Fraction
            doc.text(factorStr, cX, boxY);
            doc.line(cX - 1, boxY + 1, cX + factorW + 1, boxY + 1);
            doc.text("100", cX + (factorW/2) - 3, boxY + 5);
            
            cX += factorW + 10;
            doc.text("X", cX, boxY + 3);
            cX += 8;
            doc.text("RM", cX, boxY + 3);
            cX += 8;
            
            const cSum = fmt(contractSum);
            const csW = doc.getTextWidth(cSum) + 4;
            doc.setLineWidth(0.1);
            doc.rect(cX, boxY - 4, csW, 6);
            doc.text(cSum, cX + 2, boxY);
            
            cX += csW + 5;
            doc.text("=", cX, boxY + 3);
            cX += 8;
            doc.text("RM", cX, boxY + 3);
            cX += 8;
            const dRate = fmt(dailyRate);
            doc.text(dRate, cX, boxY + 3);
            cX += doc.getTextWidth(dRate) + 3;
            doc.text("/ HARI", cX, boxY + 3);

            boxY += 15;
        } else {
            doc.setFont("helvetica","bold");
            doc.text("KADAR DENDA (LAD) = RM 20.00 / HARI", centerX, boxY, { align: 'center' });
            boxY += 15;
        }

        // Final Calculation: Days x Rate = Total
        const dStr = daysLate.toString();
        const dW = doc.getTextWidth(dStr) + 10;
        
        // Estimate total width to center
        const rateTxt = fmt(dailyRate) + " / HARI";
        const estWidth = dW + 3 + 10 + 5 + 5 + 8 + doc.getTextWidth(rateTxt);
        let startX = (pageWidth - estWidth) / 2;

        doc.setFont("helvetica","bold");
        doc.setLineWidth(0.1);
        doc.rect(startX, boxY - 4, dW, 6);
        doc.text(dStr, startX + (dW/2), boxY, { align: 'center' });
        
        startX += dW + 3;
        doc.text("HARI", startX, boxY);
        startX += 15;
        doc.text("X", startX, boxY);
        startX += 8;
        doc.text("RM", startX, boxY);
        startX += 8;
        doc.text(rateTxt, startX, boxY);
        
        boxY += 15;

        // TOTAL LAD
        doc.setFontSize(14);
        doc.setFont("helvetica","bold");
        const finalRM = "RM";
        const finalVal = fmt(totalLAD);
        
        doc.text(finalRM, margin + 20, boxY);
        doc.text(finalVal, margin + 35, boxY);
        
        boxY += 8; // Padding bottom

        // Draw Box Border
        doc.setLineWidth(0.5);
        doc.rect(margin, boxTopY, contentWidth, boxY - boxTopY);

        // Save
        doc.save(`Perakuan_LAD_${project.noFail || 'Draft'}.pdf`);
    }
}
