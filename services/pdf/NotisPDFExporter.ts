import { Project, User } from '../../types';
import { PDFBaseHelper } from './PDFBaseHelper';

type NoticeType = 'PEMBERITAHUAN' | 'PERINGATAN_1' | 'KERJA_TIDAK_SIAP' | 'PERINGATAN_2' | 'PERINGATAN_3';

const MONTHS = ["Januari","Februari","Mac","April","Mei","Jun","Julai","Ogos","September","Oktober","November","Disember"];

export class NotisPDFExporter {
    static async export(project: Project, pjaUser: User | undefined, companyDetails: any, options: {
        noticeType: NoticeType;
        startDate: string;
        endDate: string;
        letterMonthYear: string;
        selectedJuruteraId: number | string;
        juruteraList: User[];
    }): Promise<void> {
        const { noticeType, startDate, endDate, letterMonthYear, selectedJuruteraId, juruteraList } = options;

        const jsPDF = PDFBaseHelper.getJsPDF();
        const doc = new jsPDF('p', 'mm', 'a4');

        const formatMalayDateLong = (isoDate: string) => {
            if (!isoDate) return '.............';
            const d = new Date(isoDate);
            if (isNaN(d.getTime())) return '.............';
            return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
        };

        const calculateLAD = () => {
            const contractSum = project.kosProjek || 0;
            let dailyRate = 0;
            
            // 2025 Standard Logic
            if (contractSum < 20000) {
                dailyRate = 20.00;
            } else {
                // BLR 6.65 - 0.25 = 6.4 (Standard treasury rate logic)
                dailyRate = (contractSum * 0.064) / 365;
            }
            return Math.round((dailyRate + Number.EPSILON) * 100) / 100;
        };

        // --- PDF GENERATOR 1: NOTIS PEMBERITAHUAN ---
        const generatePemberitahuanPDF = async (doc: any) => {
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
            const dateStr = `${MONTHS[safeDate.getMonth()]} ${safeDate.getFullYear()}`;
            doc.text(dateStr, pageWidth - margin, y, { align: 'right' });
            
            y += 15;

            // Title
            doc.setFont("helvetica","bold");
            doc.setFontSize(14);
            doc.text("NOTIS PEMBERITAHUAN", pageWidth / 2, y, { align: 'center' });
            y += 15;

            // Project Title
            doc.setFontSize(12);
            const title = project.namaProjek ? project.namaProjek.toUpperCase() : "TAJUK PROJEK...";
            const splitTitle = doc.splitTextToSize(title, contentWidth);
            doc.text(splitTitle, margin, y, { align: 'justify', maxWidth: contentWidth });
            y += (splitTitle.length * 5) + 8;

            // Body
            doc.setFont("helvetica","normal");
            const startStr = formatMalayDateLong(startDate);
            const endStr = formatMalayDateLong(endDate);
            const boldDateStr = `${startStr} sehingga ${endStr}`;
            const para2Part1 = "Adalah dimaklumkan bahawa pihak Majlis Perbandaran Selayang akan melaksanakan kerja-kerja berkaitan di kawasan berkenaan. Kerja-kerja tersebut akan dilaksanakan pada ";
            const fullPara2 = `${para2Part1}${boldDateStr}.`;
            const splitPara2 = doc.splitTextToSize(fullPara2, contentWidth);
            doc.text(splitPara2, margin, y, { align: 'justify', maxWidth: contentWidth });
            y += (splitPara2.length * 5) + 6;

            const para3 = "Sehubungan dengan itu, pihak tuan/puan diminta memberikan kerjasama sepanjang kerja-kerja dijalankan seperti mengalihkan kenderaan dan harta benda tuan/puan di kawasan tersebut.";
            const splitPara3 = doc.splitTextToSize(para3, contentWidth);
            doc.text(splitPara3, margin, y, { align: 'justify', maxWidth: contentWidth });
            y += (splitPara3.length * 5) + 6;

            const para4 = "Kegagalan pihak tuan/puan untuk memberi kerjasama akan menjejaskan perlaksanaan projek kerajaan. Untuk sebarang pertanyaan, sila hubungi Jabatan Kejuruteraan, Majlis Perbandaran Selayang di talian 03-61265896.";
            const splitPara4 = doc.splitTextToSize(para4, contentWidth);
            doc.text(splitPara4, margin, y, { align: 'justify', maxWidth: contentWidth });
            y += (splitPara4.length * 5) + 8;

            // Closing
            doc.text("Sekian, dimaklumkan.", margin, y);
            y += 15;

            // Slogans
            doc.setFont("helvetica","bold");
            doc.setFontSize(9);
            doc.text("“KITASELANGOR MAJU BERSAMA”", margin, y); y += 5;
            doc.text("“MALAYSIA MADANI”", margin, y); y += 5;
            doc.text("“BERKHIDMAT UNTUK NEGARA”", margin, y); y += 5;
            doc.text("“MAMPAN PROGRESIF SEJAHTERA”", margin, y); y += 12;

            // Signature
            doc.setFont("helvetica","normal");
            doc.setFontSize(11);
            doc.text("Saya yang menjalankan amanah,", margin, y); y += 22;

            const jr = juruteraList.find(u => u.id == selectedJuruteraId);
            const signerName = jr ? jr.fullName.toUpperCase() : "NAMA JURUTERA...";
            
            doc.setFont("helvetica","bold");
            doc.text(`(${signerName})`, margin, y); y += 5;
            doc.setFont("helvetica","normal");
            doc.text(jr?.jawatan || "Jurutera Awam", margin, y); y += 5;
            doc.text(jr?.bahagian || "Jabatan Kejuruteraan", margin, y); y += 5;
            doc.text("Majlis Perbandaran Selayang", margin, y);
            
            // Footer
            y += 4;
            doc.setFontSize(6);
            doc.setFont("helvetica","italic");
            const pjaName = pjaUser ? pjaUser.username.toUpperCase() : "PJA";
            const footerYear = startDate ? new Date(startDate).getFullYear() : 2025;
            doc.text(`PANEL ${footerYear}-PJA ${pjaName}`, margin, y);

            doc.save(`Notis_Pemberitahuan_${project.noFail}.pdf`);
        };

        // --- PDF GENERATOR 2: NOTIS PERINGATAN PERTAMA ---
        const generatePeringatanPertamaPDF = async (doc: any) => {
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
            doc.text("PERINGATAN PERTAMA", pageWidth / 2, y, { align: 'center' });
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
            doc.text("Tuan,", margin, y);
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
            doc.text("Saya dengan segala hormatnya merujuk kepada perkara di atas.", margin, y);
            y += 6;

            // Para 2 (SST Reference)
            const sstDate = project.tarikhMulaKontrak ? formatMalayDateLong(project.tarikhMulaKontrak) : '................';
            const para2 = `2. Berdasarkan surat setuju terima yang telah ditandatangani pada ${sstDate}, semakan jabatan mendapati pihak tuan perlu mematuhi perkara-perkara seperti berikut :`;
            const splitPara2 = doc.splitTextToSize(para2, contentWidth);
            doc.text(splitPara2, margin, y, { align: 'justify', maxWidth: contentWidth });
            y += (splitPara2.length * 5) + 4;

            // List
            const listIndent = margin + 15;
            
            doc.text("i)", margin + 5, y);
            doc.text("Menyiapkan kerja mengikut jadual yang ditetapkan", listIndent, y);
            y += 5;
            
            doc.setFont("helvetica","bold");
            const dateRange = `(Tarikh mula kerja : ${project.tarikhMulaKontrak ? project.tarikhMulaKontrak.split('-').reverse().join('/') : '...'} - ${project.tarikhTamatKontrak ? project.tarikhTamatKontrak.split('-').reverse().join('/') : '...'})`;
            doc.text(dateRange, listIndent, y);
            y += 6;

            doc.setFont("helvetica","normal");
            doc.text("ii)", margin + 5, y);
            doc.text("Menyiapkan kerja di tapak dengan kadar segera", listIndent, y);
            y += 8;

            // Para 3 (Deadline)
            const para3 = "3. Oleh yang demikian, pihak tuan dikehendaki untuk mematuhi perkara di atas dan dikehendaki untuk menyerahkan tuntutan dalam tempoh tujuh (7) hari daripada tarikh surat ini dikeluarkan.";
            const splitPara3 = doc.splitTextToSize(para3, contentWidth);
            doc.text(splitPara3, margin, y, { align: 'justify', maxWidth: contentWidth });
            y += (splitPara3.length * 5) + 4;

            // --- Para 4 (LAD Warning) ---
            const ladRate = calculateLAD();
            const ladRateStr = `RM${ladRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

            const para4Part1 = "4. Kelewatan pihak tuan berbuat demikian akan mengakibatkan laporan prestasi kerja syarikat tuan terjejas dan denda kelewatan (LAD) sebanyak";
            const para4Part2 = "/hari akan dikenakan.";

            const lineHeight = 5;
            let currentX = margin;
            let currentY = y;

            const printStyledText = (text: string, isBold: boolean) => {
                doc.setFont("helvetica", isBold ? "bold" : "normal");
                const words = text.split("");
                
                words.forEach((word, index) => {
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

            printStyledText(para4Part1, false);
            printStyledText(ladRateStr, true);
            printStyledText(para4Part2, false);

            y = currentY + (lineHeight + 5);

            // Closing
            doc.text("Sekian dimaklumkan, terima kasih.", margin, y);
            y += 10;

            // Slogans
            doc.setFont("helvetica","bold");
            doc.setFontSize(9);
            doc.text("“KITASELANGOR MAJU BERSAMA”", margin, y); y += 4;
            doc.text("“MALAYSIA MADANI”", margin, y); y += 4;
            doc.text("“BERKHIDMAT UNTUK NEGARA”", margin, y); y += 4;
            doc.text("“MAMPAN PROGRESIF SEJAHTERA”", margin, y); y += 8;

            // Signature
            doc.setFont("helvetica","normal");
            doc.setFontSize(11);
            doc.text("Saya yang menjalankan amanah,", margin, y); 
            y += 18;

            const jr = juruteraList.find(u => u.id == selectedJuruteraId);
            const signerName = jr ? jr.fullName.toUpperCase() : "NAMA JURUTERA...";
            
            doc.setFont("helvetica","bold");
            doc.text(`(${signerName})`, margin, y); y += 5;
            doc.setFont("helvetica","normal");
            doc.text(jr?.jawatan || "Jurutera Awam", margin, y); y += 5;
            doc.text(jr?.bahagian || "Jabatan Kejuruteraan", margin, y); y += 5;
            doc.text("Majlis Perbandaran Selayang", margin, y);

            // Footer
            y += 4;
            doc.setFontSize(6);
            doc.setFont("helvetica","italic"); 
            const pjaName = pjaUser ? pjaUser.username.toUpperCase() : "PJA";
            const footerYear = new Date().getFullYear(); 
            doc.text(`PANEL ${footerYear}-PJA ${pjaName}`, margin, y);

            doc.save(`Notis_Peringatan_1_${project.noFail}.pdf`);
        };

        // --- PDF GENERATOR 3: NOTIS PERINGATAN KEDUA ---
        const generatePeringatanKeduaPDF = async (doc: any) => {
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
            doc.text("PERINGATAN KEDUA", pageWidth / 2, y, { align: 'center' });
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
            doc.text("Tuan,", margin, y);
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
            doc.text("Saya dengan segala hormatnya merujuk kepada perkara di atas.", margin, y);
            y += 6;

            // Para 2
            const sstDate = project.tarikhMulaKontrak ? formatMalayDateLong(project.tarikhMulaKontrak) : '................';
            const para2 = `2. Berdasarkan surat setuju terima yang telah ditandatangani pada ${sstDate}, didapati pihak tuan masih gagal melaksanakan perkara-perkara seperti berikut:`;
            const splitPara2 = doc.splitTextToSize(para2, contentWidth);
            doc.text(splitPara2, margin, y, { align: 'justify', maxWidth: contentWidth });
            y += (splitPara2.length * 5) + 4;

            // List
            const listIndent = margin + 15;
            
            doc.text("i)", margin + 5, y);
            doc.text("Menyiapkan kerja mengikut jadual yang ditetapkan", listIndent, y);
            y += 5;
            doc.setFont("helvetica","bold");
            const dateRange = `(Tarikh mula kerja : ${project.tarikhMulaKontrak ? project.tarikhMulaKontrak.split('-').reverse().join('/') : '...'} - ${project.tarikhTamatKontrak ? project.tarikhTamatKontrak.split('-').reverse().join('/') : '...'})`;
            doc.text(dateRange, listIndent, y);
            y += 6;

            doc.setFont("helvetica","normal");
            doc.text("ii)", margin + 5, y);
            doc.text("Menyiapkan kerja di tapak dengan kadar segera", listIndent, y);
            y += 8;

            // Para 3
            const para3 = "3. Oleh yang demikian, pihak tuan dikehendaki memberi penjelasan secara bertulis di atas kegagalan pihak tuan mematuhi perkara di atas.";
            const splitPara3 = doc.splitTextToSize(para3, contentWidth);
            doc.text(splitPara3, margin, y, { align: 'justify', maxWidth: contentWidth });
            y += (splitPara3.length * 5) + 4;

            // --- Para 4 (LAD HAS BEEN CHARGED) ---
            const ladRate = calculateLAD();
            const ladRateStr = `RM${ladRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

            const segments = [
                { text:"4. Sehubungan dengan itu, pihak tuan dikehendaki menyerahkan tuntutan dengan kadar segera dan pihak tuan juga telah dikenakan denda lewat LAD sebanyak", bold: false },
                { text: ladRateStr, bold: true },
                { text:"/hari dari tarikh tamat kontrak tersebut serta penilaian prestasi syarikat tuan telah terjejas.", bold: false }
            ];

            const lineHeight = 5;
            let currentX = margin;
            let currentY = y;

            segments.forEach(segment => {
                doc.setFont("helvetica", segment.bold ? "bold" : "normal");
                const words = segment.text.split("");
                
                words.forEach((word, index) => {
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
            doc.text("Sekian dimaklumkan, terima kasih.", margin, y);
            y += 10;

            // Slogans
            doc.setFont("helvetica","bold");
            doc.setFontSize(9);
            doc.text("“KITASELANGOR MAJU BERSAMA”", margin, y); y += 4;
            doc.text("“MALAYSIA MADANI”", margin, y); y += 4;
            doc.text("“BERKHIDMAT UNTUK NEGARA”", margin, y); y += 4;
            doc.text("“MAMPAN PROGRESIF SEJAHTERA”", margin, y); y += 8;

            // Signature
            doc.setFont("helvetica","normal");
            doc.setFontSize(11);
            doc.text("Saya yang menjalankan amanah,", margin, y); 
            y += 18;

            const jr = juruteraList.find(u => u.id == selectedJuruteraId);
            const signerName = jr ? jr.fullName.toUpperCase() : "NAMA JURUTERA...";
            
            doc.setFont("helvetica","bold");
            doc.text(`(${signerName})`, margin, y); y += 5;
            doc.setFont("helvetica","normal");
            doc.text(jr?.jawatan || "Jurutera Awam", margin, y); y += 5;
            doc.text(jr?.bahagian || "Jabatan Kejuruteraan", margin, y); y += 5;
            doc.text("Majlis Perbandaran Selayang", margin, y);

            // Footer
            y += 4;
            doc.setFontSize(6);
            doc.setFont("helvetica","italic"); 
            const pjaName = pjaUser ? pjaUser.username.toUpperCase() : "PJA";
            const footerYear = new Date().getFullYear(); 
            doc.text(`PANEL ${footerYear}-PJA ${pjaName}`, margin, y);

            doc.save(`Notis_Peringatan_2_${project.noFail}.pdf`);
        };

        // --- PDF GENERATOR 4: NOTIS PERINGATAN KETIGA ---
        const generatePeringatanKetigaPDF = async (doc: any) => {
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
            doc.text("PERINGATAN KETIGA", pageWidth / 2, y, { align: 'center' });
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
            doc.text("Tuan,", margin, y);
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
            doc.text("Saya dengan segala hormatnya merujuk kepada perkara di atas.", margin, y);
            y += 7;

            // Para 2
            const sstDate = project.tarikhMulaKontrak ? formatMalayDateLong(project.tarikhMulaKontrak) : '................';
            const para2 = `2. Berdasarkan surat setuju terima yang telah ditandatangani pada ${sstDate}, didapati pihak tuan masih lagi gagal melaksanakan perkara-perkara seperti berikut:`;
            const splitPara2 = doc.splitTextToSize(para2, contentWidth);
            doc.text(splitPara2, margin, y, { align: 'justify', maxWidth: contentWidth });
            y += (splitPara2.length * 5) + 4;

            // List
            const listIndent = margin + 15;
            
            doc.text("i)", margin + 5, y);
            doc.text("Menyiapkan kerja mengikut jadual yang ditetapkan", listIndent, y);
            y += 5;
            doc.setFont("helvetica","bold");
            const startDisp = project.tarikhMulaKontrak ? project.tarikhMulaKontrak.split('-').reverse().join('/') : '...';
            const endDisp = project.tarikhTamatKontrak ? project.tarikhTamatKontrak.split('-').reverse().join('/') : '...';
            const dateRange = `(Tarikh mula kerja : ${startDisp}- ${endDisp})`;
            doc.text(dateRange, listIndent, y);
            y += 6;

            doc.setFont("helvetica","normal");
            doc.text("ii)", margin + 5, y);
            doc.text("Menyiapkan kerja di tapak dengan kadar segera", listIndent, y);
            y += 8;

            // Para 3
            const para3 = "3. Oleh yang demikian, pihak tuan dikehendaki memberi penjelasan secara bertulis di atas kegagalan pihak tuan mematuhi perkara di atas.";
            const splitPara3 = doc.splitTextToSize(para3, contentWidth);
            doc.text(splitPara3, margin, y, { align: 'justify', maxWidth: contentWidth });
            y += (splitPara3.length * 5) + 5;

            // Para 4
            const para4Start = "4. Sehubungan dengan itu, pihak tuan dikehendaki menyerahkan tuntutan dalam tempoh";
            const para4Bold = "tujuh (7) hari";
            const para4End = " daripada tarikh surat ini dikeluarkan atau tuan akan dikenakan denda lewat LAD. Kegagalan pihak tuan berbuat demikian akan menjejaskan penilaian prestasi syarikat tuan.";
            
            const fullPara4Text = `${para4Start}${para4Bold}${para4End}`;
            const splitPara4 = doc.splitTextToSize(fullPara4Text, contentWidth);
            
            doc.text(splitPara4, margin, y, { align: 'justify', maxWidth: contentWidth });
            y += (splitPara4.length * 5) + 8;

            // Closing
            doc.text("Sekian dimaklumkan, terima kasih.", margin, y);
            y += 12;

            // Slogans
            doc.setFont("helvetica","bold");
            doc.setFontSize(9);
            doc.text("“KITASELANGOR MAJU BERSAMA”", margin, y); y += 4;
            doc.text("“MALAYSIA MADANI”", margin, y); y += 4;
            doc.text("“BERKHIDMAT UNTUK NEGARA”", margin, y); y += 4;
            doc.text("“MAMPAN PROGRESIF SEJAHTERA”", margin, y); y += 10;

            // Signature
            doc.setFont("helvetica","normal");
            doc.setFontSize(11);
            doc.text("Saya yang menjalankan amanah,", margin, y); 
            y += 15;

            const jr = juruteraList.find(u => u.id == selectedJuruteraId);
            const signerName = jr ? jr.fullName.toUpperCase() : "NAMA JURUTERA...";
            
            doc.setFont("helvetica","bold");
            doc.text(`(${signerName})`, margin, y); y += 5;
            doc.setFont("helvetica","normal");
            doc.text(jr?.jawatan || "Jurutera Awam", margin, y); y += 5;
            doc.text(jr?.bahagian || "Jabatan Kejuruteraan", margin, y); y += 5;
            doc.text("Majlis Perbandaran Selayang", margin, y);

            // Footer
            y += 4;
            doc.setFontSize(6);
            doc.setFont("helvetica","italic"); 
            const pjaName = pjaUser ? pjaUser.username.toUpperCase() : "PJA";
            const footerYear = new Date().getFullYear(); 
            doc.text(`PANEL ${footerYear}-PJA ${pjaName}`, margin, y);

            doc.save(`Notis_Peringatan_3_${project.noFail}.pdf`);
        };

        // --- PDF GENERATOR 5: PERAKUAN KERJA TIDAK SIAP ---
        const generateKerjaTidakSiapPDF = async (doc: any) => {
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
            doc.text("KERAJAAN MALAYSIA", pageWidth / 2, y, { align:"center" });
            y += 5;
            doc.text("MAJLIS PERBANDARAN SELAYANG", pageWidth / 2, y, { align:"center" });
            y += 5;
            doc.text("JABATAN KEJURUTERAAN", pageWidth / 2, y, { align:"center" });
            y += 10;

            doc.setFontSize(12);
            doc.text("PERAKUAN KERJA TIDAK SIAP", pageWidth / 2, y, { align:"center" });
            y += 5;
            doc.setFont("helvetica","italic");
            doc.setFontSize(11);
            doc.text("(CERTIFICATE OF NON-COMPLETION)", pageWidth / 2, y, { align:"center" });
            y += 15;

            const refNo = `${project.noFail || ''} (   )`;
            const addressData = [
                [
                    `Rujukan : ${refNo}`,
                    {
                        content: `Pejabat : Majlis Perbandaran Selayang\nPersiaran 3, Bandar Baru Selayang,\n68100 Batu Caves,\nSelangor Darul Ehsan.\nTarikh...................................................`,
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

            doc.text(`Berdaftar dengan C.I.D.B. dalam Gred"${companyDetails?.gred || 'G1'}"`, margin, y);
            y += 6;

            doc.setFont("helvetica","bold");
            doc.text(`No. Sebutharga : ${project.noSebutharga || ''}`, margin, y);
            y += 10;

            const title = project.namaProjek ? project.namaProjek.toUpperCase() : "TAJUK PROJEK...";
            const splitTitle = doc.splitTextToSize(title, contentWidth);
            doc.text(splitTitle, margin, y, { align: 'justify', maxWidth: contentWidth });
            y += (splitTitle.length * 5) + 10;

            const completionDate = project.tarikhTamatKontrak ? formatMalayDateLong(project.tarikhTamatKontrak) : '................................';

            const malayParts1 = [
                { text:"Dengan ini adalah diperakui bahawa tuan telah gagal menyiapkan Kerja / Sebahagian daripada Kerja* yang tersebut di atas pada \"Tarikh Siap\" yang dinyatakan dalam Lampiran kepada Syarat-Syarat Kontrak ataupun dalam tempoh lanjutan masa yang telah dibenarkan di bawah Klausa 43 Syarat-Syarat Kontrak, iaitu pada " },
                { text: completionDate, bold: true },
                { text:" dan mengikut pendapat saya Kerja / Sebahagian daripada Kerja* tersebut itu sepatutnya telah disiapkan pada tarikh ini." }
            ];

            const englishParts1 = [
                { text:"It is hereby certified that you have failed to complete the Works / Section of the Works* as mentioned above by the \"Date for Completion\" stated in the Appendix to the Conditions of Contract or within any extended time approved under Clause 43 of the Conditions of Contract, i.e. on ", italic: true },
                { text: completionDate, bold: true, italic: true },
                { text:" and in my opinion the said Works / Section of the Works* ought to have been completed.", italic: true }
            ];

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

            const ladRate = calculateLAD();
            const ladStr = `RM${ladRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

            doc.setFont("helvetica","normal");
            doc.text("2.", margin, y);

            const malayParts2 = [
                { text:"Menurut Klausa 40 Syarat-Syarat Kontrak, tuan adalah dengan ini diberitahu bahawa tuan kenalah membayar atau membenarkan kepada Kerajaan sejumlah wang yang dikira atas kadar yang dinyatakan dalam Lampiran kepada Syarat-Syarat Kontrak, iaitu " },
                { text: ladStr, bold: true },
                { text:" setiap hari sebagai Ganti Rugi Tertentu dan Ditetapkan banyaknya sepanjang tempoh yang Kerja / Sebahagian daripada Kerja* tersebut itu tidak disiapkan sepenuhnya dan saya akan memperakukan supaya potongan sewajarnya dibuat dari apa-apa wang yang kena dibayar atau yang akan kena dibayar kepada tuan di bawah Kontrak ini." }
            ];

            const englishParts2 = [
                { text:"In accordance with Clause 40 of the Conditions of Contract, you are hereby informed that you are liable to pay or allow to the Government a sum calculated at the rate stated in the Appendix to the Conditions of Contract, i.e.", italic: true },
                { text: ladStr, bold: true, italic: true },
                { text:" per day as Liquidated and Ascertained Damages for the period during which the said Works / Section of the Works* shall so remain and have remain incomplete and I shall certify for deduction such damages from any money due or which may become due to you under this Contract.", italic: true }
            ];

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
            doc.text("Wakil Pegawai Penguasa", sigStartX + 15, y);
            y += 5;
            doc.setFont("helvetica","italic");
            doc.text("(Deputy Superintending Officer)", sigStartX + 12, y);
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
            doc.text("* Potong jika tidak berkenaan.", margin + 10, footerY + 5);
            doc.setFont("helvetica","italic");
            doc.text("        Delete if not applicable.", margin + 10, footerY + 10);

            doc.setFont("helvetica","normal");
            doc.text("2", pageWidth / 2, pageHeight - 15, { align: 'center' });

            doc.save(`Perakuan_Kerja_Tidak_Siap_${project.noFail}.pdf`);
        };

        if (noticeType === 'PEMBERITAHUAN') {
            await generatePemberitahuanPDF(doc);
        } else if (noticeType === 'PERINGATAN_1') {
            await generatePeringatanPertamaPDF(doc);
        } else if (noticeType === 'PERINGATAN_2') {
            await generatePeringatanKeduaPDF(doc);
        } else if (noticeType === 'PERINGATAN_3') {
            await generatePeringatanKetigaPDF(doc);
        } else if (noticeType === 'KERJA_TIDAK_SIAP') {
            await generateKerjaTidakSiapPDF(doc);
        }
    }
}
