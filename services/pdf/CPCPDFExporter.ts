import { Project, User, formatDateMalay } from '../../types';
import { PDFBaseHelper } from './PDFBaseHelper';

export class CPCPDFExporter {
    static async export(project: Project, pjaUser?: User, companyDetails?: any): Promise<void> {
        const tarikhSiap = project.tarikhSiapSebenar ? project.tarikhSiapSebenar : '';
        
        const getDLPStart = (dateStr: string) => {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            d.setDate(d.getDate() + 1);
            return d.toISOString().split('T')[0];
        };
        const dlpStart = getDLPStart(tarikhSiap);

        const getDLPEnd = (dateStr: string) => {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            d.setMonth(d.getMonth() + 6);
            return d.toISOString().split('T')[0];
        };
        const dlpEnd = getDLPEnd(dlpStart);

        const jsPDF = PDFBaseHelper.getJsPDF();
        const doc = new jsPDF('p', 'mm', 'a4');
        
        const pageWidth = doc.internal.pageSize.getWidth(); 
        const margin = 25; 
        const contentWidth = pageWidth - (margin * 2);
        let currentY = 20;

        doc.setFont("helvetica","bold");
        doc.setFontSize(12);
        doc.text("KERAJAAN MALAYSIA", pageWidth / 2, currentY, { align:"center" });
        currentY += 6;
        
        doc.setFontSize(12);
        doc.text("MAJLIS PERBANDARAN SELAYANG", pageWidth / 2, currentY, { align:"center" });
        currentY += 8;

        doc.setFont("helvetica","normal");
        doc.setFontSize(11);
        doc.text("PERAKUAN SIAP KERJA", pageWidth / 2, currentY, { align:"center" });
        currentY += 5;

        doc.setFont("helvetica","italic");
        doc.setFontSize(9);
        doc.text("(CERTIFICATE OF PRACTICAL COMPLETION)", pageWidth / 2, currentY, { align:"center" });
        currentY += 15;

        doc.setFont("helvetica","normal");
        doc.setFontSize(11);

        const leftColX = margin;
        const rightColX = pageWidth / 2 + 10; 

        doc.text(`Rujukan : ${project.noFail || ''} (   )`, leftColX, currentY);
        
        doc.setFont("helvetica","bold");
        doc.text("Majlis Perbandaran Selayang", rightColX, currentY);
        currentY += 4;
        doc.setFont("helvetica","normal");
        doc.text("Persiaran 3, Bandar Baru Selayang,", rightColX, currentY);
        currentY += 4;
        doc.text("68100 Batu Caves,", rightColX, currentY);
        currentY += 4;
        doc.text("Selangor Darul Ehsan", rightColX, currentY);
        
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
        doc.text(`Berdaftar dengan CIDB dalam Gred" ${companyDetails?.gred || 'G1'}"`, leftColX, currentY);
        currentY += 5;
        doc.text(`No. Sebutharga : ${project.noSebutharga || '.........................'}`, leftColX, currentY);
        currentY += 10;

        doc.setFont("helvetica","normal");
        const labelSebutharga ="Sebutharga Untuk :";
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

        const tokens = [
            { text:"Menurut Syarat-Syarat Kontrak, dan tertakluk kepada penyiapan berkaitan dengan pembaikan apa-apa kecacatan, ketidaksempurnaan, kesusutan atau apa-apa dan yang mungkin terzahir dalam Tempoh Tanggungan Kecacatan maka adalah dengan ini di perakui bahawa seluruh Kerja yang tersebut telah siap sejajar dengan syarat-syarat dalam Dokumen Sebut Harga pada ", bold: false },
            { text: date1, bold: true },
            { text:" dan diambil milik pada ", bold: false },
            { text: date2, bold: true },
            { text:" dan dengan itu Tempoh Tanggungan Kecacatan untuk kerja kerja tersebut bermula pada ", bold: false },
            { text: date2, bold: true },
            { text:" dan berakhir pada ", bold: false },
            { text: date3, bold: true },
            { text:".", bold: false }
        ];

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
        
        doc.text("Diperakui di tapak,", sigLeftX, currentY);
        doc.text("Disahkan,", sigRightX, currentY);
        currentY += 25; 

        doc.setLineDash([1, 1], 0);
        doc.line(sigLeftX, currentY, sigLeftX + 80, currentY);
        doc.line(sigRightX, currentY, sigRightX + 80, currentY);
        doc.setLineDash([]); 
        currentY += 5;

        const pjaName = pjaUser?.fullName?.toUpperCase() || '';
        const pjaRole = pjaUser?.jawatan || ''; 
        
        const sigStartY = currentY;

        doc.text(`(Penolong Jurutera/Penyelia Tapak)`, sigLeftX, currentY);
        currentY += 5;
        
        const maxLeftWidth = sigRightX - sigLeftX - 10; 
        
        const splitName = doc.splitTextToSize(`Nama Penuh : `, maxLeftWidth);
        doc.text(splitName, sigLeftX, currentY);
        currentY += (splitName.length * 5); 

        const splitRole = doc.splitTextToSize(`Jawatan : `, maxLeftWidth);
        doc.text(splitRole, sigLeftX, currentY);

        let rightY = sigStartY;
        
        doc.text(`(Jurutera)`, sigRightX, rightY);
        rightY += 5;
        doc.text(`Nama Penuh :`, sigRightX, rightY);
        rightY += 5;
        doc.text(`Jawatan :`, sigRightX, rightY);

        doc.save(`CPC_${project.noFail || 'Cert'}.pdf`);
    }
}
