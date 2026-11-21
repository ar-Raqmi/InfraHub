import { Project, User } from '../../types';
import { PDFBaseHelper } from './PDFBaseHelper';
import { Formatter } from '../Formatter';
import { calculateLADDailyRate, ladPolicyDate } from '../finance';
import { loadOrgDocs, type OrgDocs } from '../../components/org/orgDocs';

const U = 'doc.notis_umum';
const K = 'doc.kerja_tidak_siap';

type NoticeType = 'PEMBERITAHUAN' | 'PERINGATAN_1' | 'KERJA_TIDAK_SIAP' | 'PERINGATAN_2' | 'PERINGATAN_3';

export class NotisPDFExporter {
    static async export(project: Project, pjaUser: User | undefined, companyDetails: any, options: {
        noticeType: NoticeType;
        startDate: string;
        endDate: string;
        letterMonthYear: string;
        selectedJuruteraId: number | string;
        juruteraList: User[];
    }, orgDocs?: OrgDocs): Promise<void> {
        const { noticeType } = options;
        const org = (orgDocs ?? await loadOrgDocs()).forProject(project);

        const jsPDF = PDFBaseHelper.getJsPDF();
        const doc = new jsPDF('p', 'mm', 'a4');
        if (noticeType !== 'KERJA_TIDAK_SIAP') await PDFBaseHelper.drawLetterhead(doc, org);

        if (noticeType === 'PEMBERITAHUAN') {
            await this.generatePemberitahuanPDF(org, doc, project, pjaUser, options);
        } else if (noticeType === 'PERINGATAN_1') {
            await this.generatePeringatanPertamaPDF(org, doc, project, pjaUser, companyDetails, options);
        } else if (noticeType === 'PERINGATAN_2') {
            await this.generatePeringatanKeduaPDF(org, doc, project, pjaUser, companyDetails, options);
        } else if (noticeType === 'PERINGATAN_3') {
            await this.generatePeringatanKetigaPDF(org, doc, project, pjaUser, companyDetails, options);
        } else if (noticeType === 'KERJA_TIDAK_SIAP') {
            await this.generateKerjaTidakSiapPDF(org, doc, project, companyDetails);
        }
    }

    private static formatMalayDateLong(isoDate: string): string {
        return Formatter.formatDateMalayTitleCase(isoDate);
    }

    private static calculateLAD(project: Project, org: OrgDocs): number {
        return calculateLADDailyRate(project.kosProjek, org.ladPolicy(ladPolicyDate(project)));
    }

    private static italic(tokens: { text: string; bold: boolean }[]): { text: string; bold: boolean; italic: boolean }[] {
        return tokens.map((t) => ({ ...t, italic: true }));
    }

    private static dateRangeVars(project: Project): { tarikh_mula: string; tarikh_tamat: string } {
        const dmy = (iso?: string) => (iso ? iso.split('-').reverse().join('/') : '...');
        return { tarikh_mula: dmy(project.tarikhMulaKontrak), tarikh_tamat: dmy(project.tarikhTamatKontrak) };
    }

    // --- PDF GENERATOR 1: NOTIS PEMBERITAHUAN ---
    private static async generatePemberitahuanPDF(
        org: OrgDocs,
        doc: any,
        project: Project,
        pjaUser: User | undefined,
        options: {
            startDate: string;
            endDate: string;
            selectedJuruteraId: number | string;
            juruteraList: User[];
        }
    ): Promise<void> {
        const { startDate, endDate, selectedJuruteraId, juruteraList } = options;
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 25;
        const contentWidth = pageWidth - (margin * 2);
        let y = 55; // Headroom for Letterhead

        // Header
        doc.setFont("helvetica","normal");
        doc.setFontSize(10);
        const refNo = `${project.noFail || '................'} (   )`;
        doc.text(refNo, pageWidth - margin, y, { align: 'right' });
        y += 5;
        
        const dateObj = startDate ? new Date(startDate) : new Date();
        const safeDate = isNaN(dateObj.getTime()) ? new Date() : dateObj;
        const dateStr = `${Formatter.MALAY_MONTHS_TITLE[safeDate.getMonth()]} ${safeDate.getFullYear()}`;
        doc.text(dateStr, pageWidth - margin, y, { align: 'right' });
        
        y += 15;

        // Title
        doc.setFont("helvetica","bold");
        doc.setFontSize(14);
        doc.text(org.text('doc.notis_pemberitahuan', 'title'), pageWidth / 2, y, { align: 'center' });
        y += 15;

        // Project Title
        doc.setFontSize(12);
        const title = project.namaProjek ? project.namaProjek.toUpperCase() : "TAJUK PROJEK...";
        const splitTitle = doc.splitTextToSize(title, contentWidth);
        doc.text(splitTitle, margin, y, { align: 'justify', maxWidth: contentWidth });
        y += (splitTitle.length * 5) + 8;

        // Body
        doc.setFont("helvetica","normal");
        const startStr = this.formatMalayDateLong(startDate);
        const endStr = this.formatMalayDateLong(endDate);
        const fullPara2 = org.text('doc.notis_pemberitahuan', 'para1', { tarikh_mula: startStr, tarikh_tamat: endStr });
        const splitPara2 = doc.splitTextToSize(fullPara2, contentWidth);
        doc.text(splitPara2, margin, y, { align: 'justify', maxWidth: contentWidth });
        y += (splitPara2.length * 5) + 6;

        const para3 = org.text('doc.notis_pemberitahuan', 'para2');
        const splitPara3 = doc.splitTextToSize(para3, contentWidth);
        doc.text(splitPara3, margin, y, { align: 'justify', maxWidth: contentWidth });
        y += (splitPara3.length * 5) + 6;

        const para4 = org.text('doc.notis_pemberitahuan', 'para3');
        const splitPara4 = doc.splitTextToSize(para4, contentWidth);
        doc.text(splitPara4, margin, y, { align: 'justify', maxWidth: contentWidth });
        y += (splitPara4.length * 5) + 8;

        // Closing
        doc.text(org.text('doc.notis_pemberitahuan', 'closing'), margin, y);
        y += 15;

        // Slogans
        y = PDFBaseHelper.drawGovernmentSlogans(doc, margin, y, 5, 12, org.profile.slogans);

        // Signature
        doc.setFont("helvetica","normal");
        doc.setFontSize(11);
        doc.text(org.text(U, 'signOff'), margin, y); y += 22;

        const jr = juruteraList.find(u => u.id == selectedJuruteraId);
        const signerName = jr ? jr.fullName.toUpperCase() : "NAMA JURUTERA...";
        
        doc.setFont("helvetica","bold");
        doc.text(`(${signerName})`, margin, y); y += 5;
        doc.setFont("helvetica","normal");
        doc.text(jr?.jawatan || org.text(U, 'signerRole'), margin, y); y += 5;
        doc.text(jr?.bahagian || org.profile.department, margin, y); y += 5;
        doc.text(org.profile.name, margin, y);
        
        // Footer
        y += 4;
        doc.setFontSize(6);
        doc.setFont("helvetica","italic");
        const pjaName = pjaUser ? pjaUser.username.toUpperCase() : "PJA";
        const footerYear = startDate ? new Date(startDate).getFullYear() : 2025;
        doc.text(org.text(U, 'footer', { tahun: footerYear, pja: pjaName }), margin, y);

        doc.save(`Notis_Pemberitahuan_${project.noFail}.pdf`);
    }

    // --- PDF GENERATOR 2: NOTIS PERINGATAN PERTAMA ---
    private static async generatePeringatanPertamaPDF(
        org: OrgDocs,
        doc: any,
        project: Project,
        pjaUser: User | undefined,
        companyDetails: any,
        options: {
            letterMonthYear: string;
            selectedJuruteraId: number | string;
            juruteraList: User[];
        }
    ): Promise<void> {
        const { letterMonthYear, selectedJuruteraId, juruteraList } = options;
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 25;
        const contentWidth = pageWidth - (margin * 2);
        let y = 55;

        // Ref & Date
        doc.setFont("helvetica","normal");
        doc.setFontSize(10);
        const refNo = `${project.noFail || '................'} (   )`;
        doc.text(refNo, pageWidth - margin, y, { align: 'right' });
        y += 5;
        doc.text(letterMonthYear, pageWidth - margin, y, { align: 'right' });
        y += 8;

        // Title
        doc.setFont("helvetica","bold");
        doc.setFontSize(12);
        doc.text(org.text('doc.notis_peringatan_1', 'title'), pageWidth / 2, y, { align: 'center' });
        y += 8;

        // Recipient (Company)
        doc.setFontSize(11);
        doc.setFont("helvetica","bold");
        doc.text(project.namaSyarikat?.toUpperCase() || 'NAMA SYARIKAT', margin, y);
        y += 5;
        doc.setFont("helvetica","normal");
        if (companyDetails?.address) {
            const splitAddr = doc.splitTextToSize(companyDetails.address, 90);
            doc.text(splitAddr, margin, y);
            y += (splitAddr.length * 5) + 3;
        } else {
            doc.text("ALAMAT SYARIKAT...", margin, y);
            y += 8;
        }

        // Salutation
        doc.text(org.text(U, 'salutation'), margin, y);
        y += 6;

        // Project Title
        doc.setFont("helvetica","bold");
        doc.setFontSize(11);
        const title = project.namaProjek ? project.namaProjek.toUpperCase() : "TAJUK PROJEK...";
        const splitTitle = doc.splitTextToSize(title, contentWidth);
        doc.text(splitTitle, margin, y, { align: 'justify', maxWidth: contentWidth });
        y += (splitTitle.length * 5) + 4;

        // Para 1
        doc.setFont("helvetica","normal");
        doc.setFontSize(11);
        doc.text(org.text(U, 'reference'), margin, y);
        y += 6;

        // Para 2 (SST Reference)
        const sstDate = project.tarikhMulaKontrak ? this.formatMalayDateLong(project.tarikhMulaKontrak) : '................';
        const para2 = org.text('doc.notis_peringatan_1', 'para2', { tarikh_sst: sstDate });
        const splitPara2 = doc.splitTextToSize(para2, contentWidth);
        doc.text(splitPara2, margin, y, { align: 'justify', maxWidth: contentWidth });
        y += (splitPara2.length * 5) + 4;

        // List
        const listIndent = margin + 15;
        
        doc.text("i)", margin + 5, y);
        doc.text(org.text(U, 'item1'), listIndent, y);
        y += 5;
        
        doc.setFont("helvetica","bold");
        const dateRange = org.text('doc.notis_peringatan_1', 'dateRange', this.dateRangeVars(project));
        doc.text(dateRange, listIndent, y);
        y += 6;

        doc.setFont("helvetica","normal");
        doc.text("ii)", margin + 5, y);
        doc.text(org.text(U, 'item2'), listIndent, y);
        y += 8;

        // Para 3 (Deadline)
        const para3 = org.text('doc.notis_peringatan_1', 'para3');
        const splitPara3 = doc.splitTextToSize(para3, contentWidth);
        doc.text(splitPara3, margin, y, { align: 'justify', maxWidth: contentWidth });
        y += (splitPara3.length * 5) + 4;

        // --- Para 4 (LAD Warning) ---
        const ladRate = this.calculateLAD(project, org);
        const ladRateStr = `RM${PDFBaseHelper.formatNumber2dp(ladRate)}`;


        const lineHeight = 5;
        let currentX = margin;
        let currentY = y;

        const printStyledText = (text: string, isBold: boolean) => {
            doc.setFont("helvetica", isBold ? "bold" : "normal");
            const words = text.split("");
            
            words.forEach((word) => {
                const wordToPrint = word;
                const wordWidth = doc.getTextWidth(wordToPrint);

                if (currentX + wordWidth > margin + contentWidth) {
                    currentX = margin;
                    currentY += lineHeight;
                }

                doc.text(wordToPrint, currentX, currentY);
                currentX += wordWidth;
            });
        };

        org.tokens('doc.notis_peringatan_1', 'para4', { kadar_lad: ladRateStr }).forEach((t) => printStyledText(t.text, t.bold));

        y = currentY + (lineHeight + 5);

        // Closing
        doc.text(org.text(U, 'closing'), margin, y);
        y += 10;

        // Slogans
        y = PDFBaseHelper.drawGovernmentSlogans(doc, margin, y, 4, 8, org.profile.slogans);

        // Signature
        doc.setFont("helvetica","normal");
        doc.setFontSize(11);
        doc.text(org.text(U, 'signOff'), margin, y); 
        y += 18;

        const jr = juruteraList.find(u => u.id == selectedJuruteraId);
        const signerName = jr ? jr.fullName.toUpperCase() : "NAMA JURUTERA...";
        
        doc.setFont("helvetica","bold");
        doc.text(`(${signerName})`, margin, y); y += 5;
        doc.setFont("helvetica","normal");
        doc.text(jr?.jawatan || org.text(U, 'signerRole'), margin, y); y += 5;
        doc.text(jr?.bahagian || org.profile.department, margin, y); y += 5;
        doc.text(org.profile.name, margin, y);

        // Footer
        y += 4;
        doc.setFontSize(6);
        doc.setFont("helvetica","italic"); 
        const pjaName = pjaUser ? pjaUser.username.toUpperCase() : "PJA";
        const footerYear = new Date().getFullYear(); 
        doc.text(org.text(U, 'footer', { tahun: footerYear, pja: pjaName }), margin, y);

        doc.save(`Notis_Peringatan_1_${project.noFail}.pdf`);
    }

    // --- PDF GENERATOR 3: NOTIS PERINGATAN KEDUA ---
    private static async generatePeringatanKeduaPDF(
        org: OrgDocs,
        doc: any,
        project: Project,
        pjaUser: User | undefined,
        companyDetails: any,
        options: {
            letterMonthYear: string;
            selectedJuruteraId: number | string;
            juruteraList: User[];
        }
    ): Promise<void> {
        const { letterMonthYear, selectedJuruteraId, juruteraList } = options;
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 25;
        const contentWidth = pageWidth - (margin * 2);
        let y = 55;

        // Ref & Date
        doc.setFont("helvetica","normal");
        doc.setFontSize(10);
        const refNo = `${project.noFail || '................'} (   )`;
        doc.text(refNo, pageWidth - margin, y, { align: 'right' });
        y += 5;
        doc.text(letterMonthYear, pageWidth - margin, y, { align: 'right' });
        y += 10;

        // Title
        doc.setFont("helvetica","bold");
        doc.setFontSize(12);
        doc.text(org.text('doc.notis_peringatan_2', 'title'), pageWidth / 2, y, { align: 'center' });
        y += 12;

        // Recipient (Company)
        doc.setFontSize(11);
        doc.setFont("helvetica","bold");
        doc.text(project.namaSyarikat?.toUpperCase() || 'NAMA SYARIKAT', margin, y);
        y += 5;
        doc.setFont("helvetica","normal");
        if (companyDetails?.address) {
            const splitAddr = doc.splitTextToSize(companyDetails.address, 90);
            doc.text(splitAddr, margin, y);
            y += (splitAddr.length * 5) + 3;
        } else {
            doc.text("ALAMAT SYARIKAT...", margin, y);
            y += 8;
        }

        // Salutation
        doc.text(org.text(U, 'salutation'), margin, y);
        y += 6;

        // Project Title
        doc.setFont("helvetica","bold");
        doc.setFontSize(11);
        const title = project.namaProjek ? project.namaProjek.toUpperCase() : "TAJUK PROJEK...";
        const splitTitle = doc.splitTextToSize(title, contentWidth);
        doc.text(splitTitle, margin, y, { align: 'justify', maxWidth: contentWidth });
        y += (splitTitle.length * 5) + 4;

        // Para 1
        doc.setFont("helvetica","normal");
        doc.setFontSize(11);
        doc.text(org.text(U, 'reference'), margin, y);
        y += 6;

        // Para 2
        const sstDate = project.tarikhMulaKontrak ? this.formatMalayDateLong(project.tarikhMulaKontrak) : '................';
        const para2 = org.text('doc.notis_peringatan_2', 'para2', { tarikh_sst: sstDate });
        const splitPara2 = doc.splitTextToSize(para2, contentWidth);
        doc.text(splitPara2, margin, y, { align: 'justify', maxWidth: contentWidth });
        y += (splitPara2.length * 5) + 4;

        // List
        const listIndent = margin + 15;
        
        doc.text("i)", margin + 5, y);
        doc.text(org.text(U, 'item1'), listIndent, y);
        y += 5;
        doc.setFont("helvetica","bold");
        const dateRange = org.text('doc.notis_peringatan_2', 'dateRange', this.dateRangeVars(project));
        doc.text(dateRange, listIndent, y);
        y += 6;

        doc.setFont("helvetica","normal");
        doc.text("ii)", margin + 5, y);
        doc.text(org.text(U, 'item2'), listIndent, y);
        y += 8;

        // Para 3
        const para3 = org.text('doc.notis_peringatan_2', 'para3');
        const splitPara3 = doc.splitTextToSize(para3, contentWidth);
        doc.text(splitPara3, margin, y, { align: 'justify', maxWidth: contentWidth });
        y += (splitPara3.length * 5) + 4;

        // --- Para 4 (LAD HAS BEEN CHARGED) ---
        const ladRate = this.calculateLAD(project, org);
        const ladRateStr = `RM${PDFBaseHelper.formatNumber2dp(ladRate)}`;

        const segments = org.tokens('doc.notis_peringatan_2', 'para4', { kadar_lad: ladRateStr });

        const lineHeight = 5;
        let currentX = margin;
        let currentY = y;

        segments.forEach(segment => {
            doc.setFont("helvetica", segment.bold ? "bold" : "normal");
            const words = segment.text.split("");
            
            words.forEach((word) => {
                const textToPrint = word;
                const wordWidth = doc.getTextWidth(textToPrint);

                if (currentX + wordWidth > margin + contentWidth) {
                    currentX = margin;
                    currentY += lineHeight;
                }

                doc.text(textToPrint, currentX, currentY);
                currentX += wordWidth;
            });
        });

        y = currentY + 10;

        // Closing
        doc.text(org.text(U, 'closing'), margin, y);
        y += 10;

        // Slogans
        y = PDFBaseHelper.drawGovernmentSlogans(doc, margin, y, 4, 8, org.profile.slogans);

        // Signature
        doc.setFont("helvetica","normal");
        doc.setFontSize(11);
        doc.text(org.text(U, 'signOff'), margin, y); 
        y += 18;

        const jr = juruteraList.find(u => u.id == selectedJuruteraId);
        const signerName = jr ? jr.fullName.toUpperCase() : "NAMA JURUTERA...";
        
        doc.setFont("helvetica","bold");
        doc.text(`(${signerName})`, margin, y); y += 5;
        doc.setFont("helvetica","normal");
        doc.text(jr?.jawatan || org.text(U, 'signerRole'), margin, y); y += 5;
        doc.text(jr?.bahagian || org.profile.department, margin, y); y += 5;
        doc.text(org.profile.name, margin, y);

        // Footer
        y += 4;
        doc.setFontSize(6);
        doc.setFont("helvetica","italic"); 
        const pjaName = pjaUser ? pjaUser.username.toUpperCase() : "PJA";
        const footerYear = new Date().getFullYear(); 
        doc.text(org.text(U, 'footer', { tahun: footerYear, pja: pjaName }), margin, y);

        doc.save(`Notis_Peringatan_2_${project.noFail}.pdf`);
    }

    // --- PDF GENERATOR 4: NOTIS PERINGATAN KETIGA ---
    private static async generatePeringatanKetigaPDF(
        org: OrgDocs,
        doc: any,
        project: Project,
        pjaUser: User | undefined,
        companyDetails: any,
        options: {
            letterMonthYear: string;
            selectedJuruteraId: number | string;
            juruteraList: User[];
        }
    ): Promise<void> {
        const { letterMonthYear, selectedJuruteraId, juruteraList } = options;
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 25;
        const contentWidth = pageWidth - (margin * 2);
        let y = 55;

        // Ref & Date
        doc.setFont("helvetica","normal");
        doc.setFontSize(10);
        const refNo = `${project.noFail || '................'} (   )`;
        doc.text(refNo, pageWidth - margin, y, { align: 'right' });
        y += 5;
        doc.text(letterMonthYear, pageWidth - margin, y, { align: 'right' });
        y += 10;

        // Title
        doc.setFont("helvetica","bold");
        doc.setFontSize(12);
        doc.text(org.text('doc.notis_peringatan_3', 'title'), pageWidth / 2, y, { align: 'center' });
        y += 12;

        // Recipient (Company)
        doc.setFontSize(11);
        doc.setFont("helvetica","bold");
        doc.text(project.namaSyarikat?.toUpperCase() || 'NAMA SYARIKAT', margin, y);
        y += 5;
        doc.setFont("helvetica","normal");
        if (companyDetails?.address) {
            const splitAddr = doc.splitTextToSize(companyDetails.address, 90);
            doc.text(splitAddr, margin, y);
            y += (splitAddr.length * 5) + 3;
        } else {
            doc.text("ALAMAT SYARIKAT...", margin, y);
            y += 8;
        }

        // Salutation
        doc.text(org.text(U, 'salutation'), margin, y);
        y += 6;

        // Project Title
        doc.setFont("helvetica","bold");
        doc.setFontSize(11);
        const title = project.namaProjek ? project.namaProjek.toUpperCase() : "TAJUK PROJEK...";
        const splitTitle = doc.splitTextToSize(title, contentWidth);
        doc.text(splitTitle, margin, y, { align: 'justify', maxWidth: contentWidth });
        y += (splitTitle.length * 5) + 5;

        // Para 1
        doc.setFont("helvetica","normal");
        doc.setFontSize(11);
        doc.text(org.text(U, 'reference'), margin, y);
        y += 7;

        // Para 2
        const sstDate = project.tarikhMulaKontrak ? this.formatMalayDateLong(project.tarikhMulaKontrak) : '................';
        const para2 = org.text('doc.notis_peringatan_3', 'para2', { tarikh_sst: sstDate });
        const splitPara2 = doc.splitTextToSize(para2, contentWidth);
        doc.text(splitPara2, margin, y, { align: 'justify', maxWidth: contentWidth });
        y += (splitPara2.length * 5) + 4;

        // List
        const listIndent = margin + 15;
        
        doc.text("i)", margin + 5, y);
        doc.text(org.text(U, 'item1'), listIndent, y);
        y += 5;
        doc.setFont("helvetica","bold");
const dateRange = org.text('doc.notis_peringatan_3', 'dateRange', this.dateRangeVars(project));
        doc.text(dateRange, listIndent, y);
        y += 6;

        doc.setFont("helvetica","normal");
        doc.text("ii)", margin + 5, y);
        doc.text(org.text(U, 'item2'), listIndent, y);
        y += 8;

        // Para 3
        const para3 = org.text('doc.notis_peringatan_3', 'para3');
        const splitPara3 = doc.splitTextToSize(para3, contentWidth);
        doc.text(splitPara3, margin, y, { align: 'justify', maxWidth: contentWidth });
        y += (splitPara3.length * 5) + 5;

        // Para 4
        const fullPara4Text = org.text('doc.notis_peringatan_3', 'para4');
        const splitPara4 = doc.splitTextToSize(fullPara4Text, contentWidth);
        
        doc.text(splitPara4, margin, y, { align: 'justify', maxWidth: contentWidth });
        y += (splitPara4.length * 5) + 8;

        // Closing
        doc.text(org.text(U, 'closing'), margin, y);
        y += 12;

        // Slogans
        y = PDFBaseHelper.drawGovernmentSlogans(doc, margin, y, 4, 10, org.profile.slogans);

        // Signature
        doc.setFont("helvetica","normal");
        doc.setFontSize(11);
        doc.text(org.text(U, 'signOff'), margin, y); 
        y += 15;

        const jr = juruteraList.find(u => u.id == selectedJuruteraId);
        const signerName = jr ? jr.fullName.toUpperCase() : "NAMA JURUTERA...";
        
        doc.setFont("helvetica","bold");
        doc.text(`(${signerName})`, margin, y); y += 5;
        doc.setFont("helvetica","normal");
        doc.text(jr?.jawatan || org.text(U, 'signerRole'), margin, y); y += 5;
        doc.text(jr?.bahagian || org.profile.department, margin, y); y += 5;
        doc.text(org.profile.name, margin, y);

        // Footer
        y += 4;
        doc.setFontSize(6);
        doc.setFont("helvetica","italic"); 
        const pjaName = pjaUser ? pjaUser.username.toUpperCase() : "PJA";
        const footerYear = new Date().getFullYear(); 
        doc.text(org.text(U, 'footer', { tahun: footerYear, pja: pjaName }), margin, y);

        doc.save(`Notis_Peringatan_3_${project.noFail}.pdf`);
    }

    // --- PDF GENERATOR 5: PERAKUAN KERJA TIDAK SIAP ---
    private static async generateKerjaTidakSiapPDF(
        org: OrgDocs,
        doc: any,
        project: Project,
        companyDetails: any
    ): Promise<void> {
        const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
        const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
        const margin = 25;
        const contentWidth = pageWidth - (margin * 2);
        let y = 30;

        const getStyledLines = (parts: { text: string, bold?: boolean, italic?: boolean }[], maxWidth = contentWidth) => {
            const lines: { text: string, bold?: boolean, italic?: boolean }[][] = [];
            let currentLine: { text: string, bold?: boolean, italic?: boolean }[] = [];
            let currentLineWidth = 0;

            parts.forEach(part => {
                const style = part.bold ? (part.italic ? "bolditalic" : "bold") : (part.italic ? "italic" : "normal");
                doc.setFont("helvetica", style);

                const words = part.text.split(/(\s+)/).filter(w => w.length > 0);

                words.forEach((word) => {
                    const wordWidth = doc.getTextWidth(word);

                    if (currentLineWidth + wordWidth > maxWidth) {
                        lines.push(currentLine);
                        currentLine = [];
                        currentLineWidth = 0;
                        if (/^\s+$/.test(word)) return;
                    }

                    currentLine.push({ text: word, bold: part.bold, italic: part.italic });
                    currentLineWidth += wordWidth;
                });
            });
            if (currentLine.length > 0) lines.push(currentLine);
            return lines;
        };

        // --- PAGE 1 ---
        doc.setFont("helvetica","bold");
        doc.setFontSize(12);
        doc.text(org.text(K, 'heading1'), pageWidth / 2, y, { align:"center" });
        y += 5;
        doc.text(org.text(K, 'heading2'), pageWidth / 2, y, { align:"center" });
        y += 5;
        doc.text(org.text(K, 'heading3'), pageWidth / 2, y, { align:"center" });
        y += 10;

        doc.setFontSize(12);
        doc.text(org.text(K, 'title'), pageWidth / 2, y, { align:"center" });
        y += 5;
        doc.setFont("helvetica","italic");
        doc.setFontSize(11);
        doc.text(org.text(K, 'subtitle'), pageWidth / 2, y, { align:"center" });
        y += 15;

        const refNo = `${project.noFail || ''} (   )`;
        const addressData = [
            [
                `Rujukan : ${refNo}`,
                {
                    content: `Pejabat : ${org.profile.name}\n${org.profile.addressLines.join('\n')}.\nTarikh...................................................`,
                    styles: { halign: 'left' }
                }
            ]
        ];

        // @ts-ignore
        doc.autoTable({
            startY: y,
            body: addressData,
            theme: 'plain',
            styles: { fontSize: 11, cellPadding: 1, overflow: 'visible', font: 'helvetica' },
            columnStyles: {
                0: { cellWidth: contentWidth * 0.55 },
                1: { cellWidth: contentWidth * 0.45 }
            },
            margin: { left: margin, right: margin },
        });

        // @ts-ignore
        y = doc.lastAutoTable.finalY + 10;

        doc.setFont("helvetica","normal");
        doc.setFontSize(11);
        doc.text("Kepada:", margin, y);

        const recipientX = margin + 20;
        doc.setFont("helvetica","bold");
        doc.text(project.namaSyarikat?.toUpperCase() || 'NAMA SYARIKAT', recipientX, y);
        y += 5;

        doc.setFont("helvetica","normal");
        const addr = companyDetails?.address || "ALAMAT SYARIKAT...";
        const splitAddr = doc.splitTextToSize(addr, 80);
        doc.text(splitAddr, recipientX, y);
        y += (splitAddr.length * 4) + 8;

        doc.text(org.text(K, 'cidb', { gred: companyDetails?.gred || 'G1' }), margin, y);
        y += 6;

        doc.setFont("helvetica","bold");
        doc.text(`No. Sebutharga : ${project.noSebutharga || ''}`, margin, y);
        y += 10;

        const title = project.namaProjek ? project.namaProjek.toUpperCase() : "TAJUK PROJEK...";
        const splitTitle = doc.splitTextToSize(title, contentWidth);
        doc.text(splitTitle, margin, y, { align: 'justify', maxWidth: contentWidth });
        y += (splitTitle.length * 5) + 10;

        const completionDate = project.tarikhTamatKontrak ? this.formatMalayDateLong(project.tarikhTamatKontrak) : '................................';

        const malayParts1 = org.tokens(K, 'para1', { tarikh_siap_kontrak: completionDate });
        const englishParts1 = this.italic(org.tokens(K, 'para1En', { tarikh_siap_kontrak: completionDate }));

        doc.setFontSize(11);
        const linesM1 = getStyledLines(malayParts1, contentWidth);
        const linesE1 = getStyledLines(englishParts1, contentWidth);
        const count1 = Math.max(linesM1.length, linesE1.length);
        const lineHeightM = 4;
        const lineHeightE = 4;
        const gap = 3;

        for (let i = 0; i < count1; i++) {
            if (y > pageHeight - 30) { doc.addPage(); y = 20; }
            if (linesM1[i]) {
                let x = margin;
                linesM1[i].forEach(chunk => {
                    doc.setFont("helvetica", chunk.bold ? "bold" : "normal");
                    doc.text(chunk.text, x, y);
                    x += doc.getTextWidth(chunk.text);
                });
            }
            if (linesE1[i]) {
                let x = margin;
                linesE1[i].forEach(chunk => {
                    doc.setFont("helvetica", chunk.bold ? (chunk.italic ? "bolditalic" : "bold") : "italic");
                    doc.text(chunk.text, x, y + lineHeightM);
                    x += doc.getTextWidth(chunk.text);
                });
            }
            y += lineHeightM + lineHeightE + gap;
        }

        doc.setFont("helvetica","normal");
        doc.text("1", pageWidth / 2, pageHeight - 10, { align: 'center' });

        // --- PAGE 2 ---
        doc.addPage();
        y = 30;

        const indent = 10;
        const para2Width = contentWidth - indent;

        const ladRate = this.calculateLAD(project, org);
        const ladStr = `RM${PDFBaseHelper.formatNumber2dp(ladRate)}`;

        doc.setFont("helvetica","normal");
        doc.text("2.", margin, y);

        const malayParts2 = org.tokens(K, 'para2', { kadar_lad: ladStr });
        const englishParts2 = this.italic(org.tokens(K, 'para2En', { kadar_lad: ladStr }));

        const linesM2 = getStyledLines(malayParts2, para2Width);
        const linesE2 = getStyledLines(englishParts2, para2Width);
        const count2 = Math.max(linesM2.length, linesE2.length);

        for (let i = 0; i < count2; i++) {
            if (y > pageHeight - 100) { doc.addPage(); y = 30; }

            if (linesM2[i]) {
                let x = margin + indent;
                linesM2[i].forEach(chunk => {
                    doc.setFont("helvetica", chunk.bold ? "bold" : "normal");
                    doc.text(chunk.text, x, y);
                    x += doc.getTextWidth(chunk.text);
                });
            }

            if (linesE2[i]) {
                let x = margin + indent;
                linesE2[i].forEach(chunk => {
                    doc.setFont("helvetica", chunk.bold ? (chunk.italic ? "bolditalic" : "bold") : "italic");
                    doc.text(chunk.text, x, y + lineHeightM);
                    x += doc.getTextWidth(chunk.text);
                });
            }
            y += lineHeightM + lineHeightE + gap;
        }

        y += 30; 

        // Signature Section
        const sigStartX = pageWidth / 2 + 10;
        doc.setLineDash([1, 1], 0);
        doc.line(sigStartX, y, pageWidth - margin, y);
        doc.setLineDash([]);
        y += 5;

        doc.setFont("helvetica","normal");
        doc.text(org.text(K, 'signTitle'), sigStartX + 15, y);
        y += 5;
        doc.setFont("helvetica","italic");
        doc.text(org.text(K, 'signTitleEn'), sigStartX + 12, y);
        y += 15;

        const labelX = sigStartX;
        const valueX = sigStartX + 30;

        doc.setFont("helvetica","normal");
        doc.text("Nama Penuh", labelX, y);
        doc.setLineDash([1, 1], 0);
        doc.line(valueX, y, pageWidth - margin, y);
        doc.setLineDash([]);
        y += 4;
        doc.setFont("helvetica","italic");
        doc.text("Name in full", labelX, y);
        y += 10;

        doc.setFont("helvetica","normal");
        doc.text("Nama Jawatan", labelX, y);
        doc.setLineDash([1, 1], 0);
        doc.line(valueX, y, pageWidth - margin, y);
        doc.setLineDash([]);
        y += 4;
        doc.setFont("helvetica","italic");
        doc.text("Designation", labelX, y);

        const footerY = pageHeight - 30;
        doc.setLineWidth(0.5);
        doc.line(margin, footerY, pageWidth - margin, footerY);
        doc.setFontSize(9);
        doc.setFont("helvetica","normal");
        doc.text(org.text(K, 'footnote'), margin + 10, footerY + 5);
        doc.setFont("helvetica","italic");
        doc.text(`        ${org.text(K, 'footnoteEn')}`, margin + 10, footerY + 10);

        doc.setFont("helvetica","normal");
        doc.text("2", pageWidth / 2, pageHeight - 15, { align: 'center' });

        doc.save(`Perakuan_Kerja_Tidak_Siap_${project.noFail}.pdf`);
    }
}
