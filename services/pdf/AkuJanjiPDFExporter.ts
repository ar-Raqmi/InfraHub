import { Project } from '../../types';
import { PDFBaseHelper } from './PDFBaseHelper';
import { loadOrgDocs, type OrgDocs } from '../../components/org/orgDocs';

const T = 'doc.aku_janji';

export class AkuJanjiPDFExporter {
    static async export(project: Project, options: {
        currentMonth: string;
        selectedYear: string;
        pjaName: string;
        companyName: string;
        formattedSerahTapak: string;
        formattedAduan: string;
    }, orgDocs?: OrgDocs): Promise<void> {
        const org = (orgDocs ?? await loadOrgDocs()).forProject(project);
        const { currentMonth, selectedYear, pjaName, companyName, formattedSerahTapak, formattedAduan } = options;

        const jsPDF = PDFBaseHelper.getJsPDF();
        const doc = new jsPDF('p', 'mm', 'a4');
        
        const pageWidth = doc.internal.pageSize.getWidth(); // 210
        const pageHeight = doc.internal.pageSize.getHeight(); // 297
        const margin = 25; // Standard margin
        const contentWidth = pageWidth - (margin * 2);
        
        // --- DOCUMENT HEADER ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);

        // Ref No & Date (Top Right)
        const refNo = `${project.noFail || '................'} (   )`;
        const dateStr = `${currentMonth} ${selectedYear}`;
        
        doc.text(refNo, pageWidth - margin, 30, { align: 'right' });
        doc.text(dateStr, pageWidth - margin, 35, { align: 'right' });

        // Recipient (Top Left)
        let yPos = 50;
        const lineHeight = 5;
        org.text(T, 'recipient').split('\n').forEach((line, i) => {
            if (i > 0) yPos += lineHeight;
            doc.text(line, margin, yPos);
        });

        // Title "AKU JANJI"
        yPos += 25;
        doc.setFontSize(16);
        doc.text(org.text(T, 'title'), pageWidth / 2, yPos, { align: 'center' });

        // --- BODY ---
        yPos += 20;
        doc.setFontSize(11);
        
        const title = project.namaProjek ? project.namaProjek.toUpperCase() : "TAJUK PROJEK...";
        const splitTitle = doc.splitTextToSize(title, contentWidth);
        doc.text(splitTitle, margin, yPos, { align: 'justify', maxWidth: contentWidth });
        
        const titleHeight = doc.getTextDimensions(splitTitle).h;
        yPos += titleHeight + 10;

        doc.setFont("helvetica", "normal");
        const para1 = org.text(T, 'para1', { tarikh_serah_tapak: formattedSerahTapak });
        const splitPara1 = doc.splitTextToSize(para1, contentWidth);
        doc.text(splitPara1, margin, yPos, { align: 'justify', maxWidth: contentWidth });
        
        const para1Height = doc.getTextDimensions(splitPara1).h;
        yPos += para1Height + 10;

        const para2 = org.text(T, 'para2');
        const splitPara2 = doc.splitTextToSize(para2, contentWidth);
        doc.text(splitPara2, margin, yPos, { align: 'justify', maxWidth: contentWidth });
        
        const para2Height = doc.getTextDimensions(splitPara2).h;
        yPos += para2Height + 10;

        doc.text(org.text(T, 'closing'), margin, yPos);
        yPos += 30;

        // --- SIGNATURES ---
        const sigStartY = yPos;
        doc.text(org.text(T, 'signLeft'), margin, sigStartY);
        const rightColX = pageWidth / 2 + 10;
        doc.text(org.text(T, 'signRight'), rightColX, sigStartY);

        const lineY = sigStartY + 15;
        doc.setLineDash([1, 1], 0); 
        doc.line(margin, lineY, margin + 80, lineY); 
        doc.line(rightColX, lineY, rightColX + 80, lineY); 
        doc.setLineDash([]); 

        const detailStartY = lineY + 8;
        const labelWidth = 25;
        doc.text("Pengurus", margin, detailStartY);
        doc.text(":", margin + labelWidth, detailStartY);
        doc.text("Nama", rightColX, detailStartY);
        doc.text(":", rightColX + labelWidth, detailStartY);

        doc.text("Cop", margin, detailStartY + 5);
        doc.text(":", margin + labelWidth, detailStartY + 5);
        doc.text("Jawatan", rightColX, detailStartY + 5);
        doc.text(":", rightColX + labelWidth, detailStartY + 5);

        doc.text("Tarikh", margin, detailStartY + 10);
        doc.text(":", margin + labelWidth, detailStartY + 10);
        doc.text("Tarikh", rightColX, detailStartY + 10);
        doc.text(":", rightColX + labelWidth, detailStartY + 10);

        // --- FOOTER ---
        const footerY = pageHeight - 25;
        doc.setFont("helvetica", "bolditalic");
        doc.setFontSize(6);
        
        const footerText = `${project.akuJanjiPanelTitle || 'KONTRAKTOR PANEL'} ${selectedYear} ${pjaName} - ${companyName}`;
        doc.text(footerText, margin, footerY);
        
        doc.setFont("helvetica", "bold"); 
        doc.text(`ADUAN: ${formattedAduan}`, margin, footerY + 5);

        doc.save(`Aku_Janji_${project.noFail || 'Dokumen'}.pdf`);
    }
}
