import { Project, User, formatDateMalay } from '../../types';
import { PDFBaseHelper } from './PDFBaseHelper';
import { dlpPeriod } from '../finance';
import { loadOrgDocs, type OrgDocs } from '../../components/org/orgDocs';
import { EXTRA_POLICY_KEYS } from '../../components/org/orgDefaults';

const T = 'doc.cpc';

export class CPCPDFExporter {
    static async export(project: Project, pjaUser?: User, companyDetails?: any, orgDocs?: OrgDocs): Promise<void> {
        const org = (orgDocs ?? await loadOrgDocs()).forProject(project);
        const tarikhSiap = project.tarikhSiapSebenar ? project.tarikhSiapSebenar : '';
        const { start: dlpStart, end: dlpEnd } = dlpPeriod(tarikhSiap, org.number(EXTRA_POLICY_KEYS.dlpMonths, tarikhSiap));

        const jsPDF = PDFBaseHelper.getJsPDF();
        const doc = new jsPDF('p', 'mm', 'a4');
        
        const pageWidth = doc.internal.pageSize.getWidth(); 
        const margin = 25; 
        const contentWidth = pageWidth - (margin * 2);
        let currentY = 20;

        doc.setFont("helvetica","bold");
        doc.setFontSize(12);
        doc.text(org.text(T, 'heading1'), pageWidth / 2, currentY, { align:"center" });
        currentY += 6;
        
        doc.setFontSize(12);
        doc.text(org.text(T, 'heading2'), pageWidth / 2, currentY, { align:"center" });
        currentY += 8;

        doc.setFont("helvetica","normal");
        doc.setFontSize(11);
        doc.text(org.text(T, 'title'), pageWidth / 2, currentY, { align:"center" });
        currentY += 5;

        doc.setFont("helvetica","italic");
        doc.setFontSize(9);
        doc.text(org.text(T, 'subtitle'), pageWidth / 2, currentY, { align:"center" });
        currentY += 15;

        doc.setFont("helvetica","normal");
        doc.setFontSize(11);

        const leftColX = margin;
        const rightColX = pageWidth / 2 + 10; 

        doc.text(`Rujukan : ${project.noFail || ''} (   )`, leftColX, currentY);
        
        doc.setFont("helvetica","bold");
        doc.text(org.profile.name, rightColX, currentY);
        doc.setFont("helvetica","normal");
        for (const line of org.profile.addressLines) {
            currentY += 4;
            doc.text(line, rightColX, currentY);
        }
        
        currentY += 12; 

        doc.text("Kepada :", leftColX, currentY);
        
        const dateStr = tarikhSiap ? formatDateMalay(tarikhSiap) : '.........................';
        doc.setFont("helvetica","bold");
        doc.text(dateStr.toUpperCase(), rightColX, currentY);
        
        const indentX = leftColX + 25; 
        doc.setFont("helvetica","bold");
        doc.text(project.namaSyarikat?.toUpperCase() || 'NAMA SYARIKAT', indentX, currentY);
        
        currentY += 5;

        doc.setFont("helvetica","normal");
        const address = companyDetails?.address || 'ALAMAT SYARIKAT...';
        const splitAddress = doc.splitTextToSize(address, 90); 
        doc.text(splitAddress, indentX, currentY);
        currentY += (splitAddress.length * 4) + 8;

        doc.setFont("helvetica","bold");
        doc.text(org.text(T, 'cidb', { gred: companyDetails?.gred || 'G1' }), leftColX, currentY);
        currentY += 5;
        doc.text(`No. Sebutharga : ${project.noSebutharga || '.........................'}`, leftColX, currentY);
        currentY += 10;

        doc.setFont("helvetica","normal");
        const labelSebutharga = org.text(T, 'sebuthargaLabel');
        doc.text(labelSebutharga, leftColX, currentY);
        
        const labelWidth = doc.getTextWidth(labelSebutharga);
        const titleX = leftColX + labelWidth + 3; 
        
        doc.setFont("helvetica","bold");
        const title = project.namaProjek?.toUpperCase() || '';
        const maxTitleWidth = pageWidth - margin - titleX;
        const splitTitle = doc.splitTextToSize(title, maxTitleWidth);
        
        doc.text(splitTitle, titleX, currentY);
        currentY += (splitTitle.length * 5) + 10;

        doc.setFont("helvetica","normal");
        doc.setFontSize(11); 
        
        const date1 = tarikhSiap ? formatDateMalay(tarikhSiap) : '...................';
        const date2 = dlpStart ? formatDateMalay(dlpStart) : '...................';
        const date3 = dlpEnd ? formatDateMalay(dlpEnd) : '...................';

        const tokens = org.tokens(T, 'body', { tarikh_siap: date1, tarikh_mula_dlp: date2, tarikh_tamat_dlp: date3 });

        const lineHeight = 5; 
        let cursorX = leftColX;
        
        tokens.forEach(token => {
            doc.setFont("helvetica", token.bold ?"bold" :"normal");
            const words = token.text.split(/(\s+)/).filter(e => e.length > 0);
            
            words.forEach(word => {
                const wordWidth = doc.getTextWidth(word);
                if (cursorX + wordWidth > pageWidth - margin) {
                    cursorX = leftColX;
                    currentY += lineHeight;
                }
                doc.text(word, cursorX, currentY);
                cursorX += wordWidth;
            });
        });

        currentY += 30; 

        if (currentY > 260) {
            doc.addPage();
            currentY = 20;
        }

        const sigLeftX = margin;
        const sigRightX = pageWidth / 2 + 10;

        doc.setFont("helvetica","bold");
        doc.setFontSize(11);
        
        doc.text(org.text(T, 'signLeft'), sigLeftX, currentY);
        doc.text(org.text(T, 'signRight'), sigRightX, currentY);
        currentY += 25; 

        doc.setLineDash([1, 1], 0);
        doc.line(sigLeftX, currentY, sigLeftX + 80, currentY);
        doc.line(sigRightX, currentY, sigRightX + 80, currentY);
        doc.setLineDash([]); 
        currentY += 5;

        const pjaName = pjaUser?.fullName?.toUpperCase() || '';
        const pjaRole = pjaUser?.jawatan || ''; 
        
        const sigStartY = currentY;

        doc.text(org.text(T, 'signLeftRole'), sigLeftX, currentY);
        currentY += 5;
        
        const maxLeftWidth = sigRightX - sigLeftX - 10; 
        
        const splitName = doc.splitTextToSize(`Nama Penuh : `, maxLeftWidth);
        doc.text(splitName, sigLeftX, currentY);
        currentY += (splitName.length * 5); 

        const splitRole = doc.splitTextToSize(`Jawatan : `, maxLeftWidth);
        doc.text(splitRole, sigLeftX, currentY);

        let rightY = sigStartY;
        
        doc.text(org.text(T, 'signRightRole'), sigRightX, rightY);
        rightY += 5;
        doc.text(`Nama Penuh :`, sigRightX, rightY);
        rightY += 5;
        doc.text(`Jawatan :`, sigRightX, rightY);

        doc.save(`CPC_${project.noFail || 'Cert'}.pdf`);
    }
}
