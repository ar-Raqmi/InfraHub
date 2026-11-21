import { Project, formatDate } from '../../types';
import { PDFBaseHelper } from './PDFBaseHelper';
import { locPolicyDate } from '../finance';
import { loadOrgDocs, type OrgDocs } from '../../components/org/orgDocs';
import { locTextVars } from '../../components/org/documentVars';

const T = 'doc.loc';

export class LoCPDFExporter {
    static async export(project: Project, orgDocs?: OrgDocs): Promise<void> {
        const org = (orgDocs ?? await loadOrgDocs()).forProject(project);
        const policy = org.locPolicy(locPolicyDate(project));
        const locDays = project.locDays || 0;
        const totalLoC = project.locAmount || 0;
        const fmt = PDFBaseHelper.formatNumber2dp;
        const vars = locTextVars(policy);

        const jsPDF = PDFBaseHelper.getJsPDF();
        const doc = new jsPDF('p', 'mm', 'a4');
        
        const margin = 20;
        const pageWidth = 210;
        const contentWidth = pageWidth - (margin * 2); // 170mm
        let y = 20;

        // --- TITLE ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        
        doc.text("TAJUK KERJA :", margin, y);
        
        doc.setFontSize(9);
        // Project Name wraps if too long
        const titleLines = doc.splitTextToSize(project.namaProjek.toUpperCase(), contentWidth - 30);
        doc.text(titleLines, margin + 30, y);
        y += (titleLines.length * 5) + 8; // Adjust spacing based on lines

        doc.setFontSize(10);
        const subTitle = org.text(T, 'title');
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
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.text(label, labelX, y);
            doc.text(":", colonX, y);
            
            doc.setFont("helvetica", bold ? "bold" : "normal");
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
        drawRow("NO FAIL", project.noFail || '-');
        drawRow("ADUN/ ZON", `${project.bp || ''} / ${project.zon || ''}`);
        
        y += 5; // Spacer

        // --- DATES SECTION ---
        drawRow("TARIKH SIAP KERJA SEBENAR", formatDate(project.tarikhSiapSebenar));
        drawRow("TARIKH TUNTUTAN BAYARAN", formatDate(project.tarikhTuntutanBayaran));
        
        y += 5;

        // CALCULATION LOGIC EXPLANATION
        doc.setFont("helvetica", "bold");
        doc.text(org.text(T, 'heading'), margin, y);
        y += 8;

        doc.setFont("helvetica", "normal");
        const logicText = ['rule1', 'rule2', 'rule3'].map((field) => org.text(T, field, vars));
        
        logicText.forEach(line => {
            doc.text(line, margin, y);
            y += 6;
        });
        
        y += 10;

        // --- CALCULATION BOX ---
        const boxTopY = y;
        const boxPadding = 5;
        let boxY = y + boxPadding + 5;

        // DAY CALCULATION
        doc.setFont("helvetica", "bold");
        doc.text("BILANGAN HARI LEWAT:", margin + boxPadding, boxY);
        boxY += 8;

        const calcStr = `( ${formatDate(project.tarikhTuntutanBayaran)} - ${formatDate(project.tarikhSiapSebenar)} ) - ${policy.graceDays} HARI`;
        doc.setFont("helvetica", "normal");
        doc.text(calcStr, margin + boxPadding + 10, boxY);
        boxY += 8;

        doc.setFont("helvetica", "bold");
        doc.text(`= ${locDays} HARI`, margin + boxPadding + 10, boxY);
        boxY += 15;

        // TOTAL CALCULATION
        doc.text("JUMLAH DENDA (LoC):", margin + boxPadding, boxY);
        boxY += 8;
        
        doc.setFont("helvetica", "normal");
        doc.text(`${locDays} HARI  x  RM ${fmt(policy.dailyRate)}`, margin + boxPadding + 10, boxY);
        boxY += 8;

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(`= RM ${fmt(totalLoC)}`, margin + boxPadding + 10, boxY);

        boxY += 10;
        
        // Draw Box Border
        doc.setLineWidth(0.5);
        doc.rect(margin, boxTopY, contentWidth, boxY - boxTopY);

        // Save
        doc.save(`Perakuan_LoC_${project.noFail || 'Draft'}.pdf`);
    }
}
