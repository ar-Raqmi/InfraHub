
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Project, User, Role, formatDateMalay, formatCurrency } from '../types';
import { apiService } from '../services/apiService';
import { Download, Loader2, X, FileText, Calendar, User as UserIcon, Settings } from 'lucide-react';
import StrictDateInput from '../components/StrictDateInput';

interface NotisGeneratorProps {
    project: Project;
    pjaUser?: User; // Passed for footer reference
    onClose: () => void;
}

type NoticeType = 'PEMBERITAHUAN' | 'PERINGATAN_1' | 'KERJA_TIDAK_SIAP' | 'PERINGATAN_2' | 'PERINGATAN_3';

const MONTHS = ["Januari","Februari","Mac","April","Mei","Jun","Julai","Ogos","September","Oktober","November","Disember"];

const NotisGenerator: React.FC<NotisGeneratorProps> = ({ project, pjaUser, onClose }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [noticeType, setNoticeType] = useState<NoticeType>('PEMBERITAHUAN');
    
    const [startDate, setStartDate] = useState(project.tarikhMulaKerja || '');
    const [endDate, setEndDate] = useState(project.tarikhTamatKontrak || '');

    const [letterMonthYear, setLetterMonthYear] = useState(''); 
    
    const [juruteraList, setJuruteraList] = useState<User[]>([]);
    const [selectedJuruteraId, setSelectedJuruteraId] = useState<number | string>('');
    const [companyDetails, setCompanyDetails] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const users = await apiService.getUsers();
                const jrs = users.filter(u => u.role === Role.JURUTERA);
                setJuruteraList(jrs);
                if (jrs.length > 0) {
                    setSelectedJuruteraId(jrs[0].id);
                }

                if (project.namaSyarikat) {
                    const year = project.tarikhBuka ? new Date(project.tarikhBuka).getFullYear() : new Date().getFullYear();
                    const details = await apiService.getCompanyDetails(year, project.namaSyarikat);
                    setCompanyDetails(details);
                }
            } catch (err) {
                console.error('Failed to load notis generator data:', err);
            }
        };
        fetchData();
    }, [project]);

    // Date Logic Handling based on Notice Type
    useEffect(() => {
        if (project.tarikhTamatKontrak) {
            const d = new Date(project.tarikhTamatKontrak);
            if (!isNaN(d.getTime())) {
                if (noticeType === 'PERINGATAN_2') {
                    // 1 Week AFTER End Date for Peringatan Kedua
                    d.setDate(d.getDate() + 7);
                } else if (noticeType === 'PERINGATAN_3') {
                    // 2 Weeks AFTER End Date for Peringatan Ketiga
                    d.setDate(d.getDate() + 14);
                } else {
                    // 1 Week BEFORE End Date for others (Default)
                    d.setDate(d.getDate() - 7);
                }
                setLetterMonthYear(`${MONTHS[d.getMonth()]} ${d.getFullYear()}`);
            }
        } else {
            // Default to current date if no project end date
            const d = new Date();
            setLetterMonthYear(`${MONTHS[d.getMonth()]} ${d.getFullYear()}`);
        }
    }, [project.tarikhTamatKontrak, noticeType]);

    // Helper for Selects
    const getMonthYearParts = (str: string) => {
        const parts = str.split(' ');
        const now = new Date();
        if (parts.length >= 2) {
            return { month: parts[0], year: parseInt(parts[1]) || now.getFullYear() };
        }
        return { month: MONTHS[now.getMonth()], year: now.getFullYear() };
    };

    const { month: currentMonth, year: currentYear } = getMonthYearParts(letterMonthYear);
    const yearsList = Array.from({length: 6}, (_, i) => new Date().getFullYear() - 2 + i);

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLetterMonthYear(`${e.target.value} ${currentYear}`);
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLetterMonthYear(`${currentMonth} ${e.target.value}`);
    };

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
        return dailyRate;
    };

    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            // @ts-ignore
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');
            
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

        } catch (e) {
            console.error(e);
            alert("Ralat menjana PDF Notis.");
        } finally {
            setIsGenerating(false);
        }
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
        const title = project.namaProjek ? project.namaProjek.toUpperCase() :"TAJUK PROJEK...";
        const splitTitle = doc.splitTextToSize(title, contentWidth);
        doc.text(splitTitle, margin, y, { align: 'justify', maxWidth: contentWidth });
        y += (splitTitle.length * 5) + 8;

        // Body
        doc.setFont("helvetica","normal");
        const startStr = formatMalayDateLong(startDate);
        const endStr = formatMalayDateLong(endDate);
        const boldDateStr = `${startStr} sehingga ${endStr}`;
        const para2Part1 ="Adalah dimaklumkan bahawa pihak Majlis Perbandaran Selayang akan melaksanakan kerja-kerja berkaitan di kawasan berkenaan. Kerja-kerja tersebut akan dilaksanakan pada ";
        const fullPara2 = `${para2Part1}${boldDateStr}.`;
        const splitPara2 = doc.splitTextToSize(fullPara2, contentWidth);
        doc.text(splitPara2, margin, y, { align: 'justify', maxWidth: contentWidth });
        y += (splitPara2.length * 5) + 6;

        const para3 ="Sehubungan dengan itu, pihak tuan/puan diminta memberikan kerjasama sepanjang kerja-kerja dijalankan seperti mengalihkan kenderaan dan harta benda tuan/puan di kawasan tersebut.";
        const splitPara3 = doc.splitTextToSize(para3, contentWidth);
        doc.text(splitPara3, margin, y, { align: 'justify', maxWidth: contentWidth });
        y += (splitPara3.length * 5) + 6;

        const para4 ="Kegagalan pihak tuan/puan untuk memberi kerjasama akan menjejaskan perlaksanaan projek kerajaan. Untuk sebarang pertanyaan, sila hubungi Jabatan Kejuruteraan, Majlis Perbandaran Selayang di talian 03-61265896.";
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
        const signerName = jr ? jr.fullName.toUpperCase() :"NAMA JURUTERA...";
        
        doc.setFont("helvetica","bold");
        doc.text(`(${signerName})`, margin, y); y += 5;
        doc.setFont("helvetica","normal");
        doc.text(jr?.jawatan ||"Jurutera Awam", margin, y); y += 5;
        doc.text(jr?.bahagian ||"Jabatan Kejuruteraan", margin, y); y += 5;
        doc.text("Majlis Perbandaran Selayang", margin, y);
        
        // Footer
        y += 4;
        doc.setFontSize(6);
        doc.setFont("helvetica","italic");
        const pjeName = pjaUser ? pjaUser.username.toUpperCase() :"PJE";
        const footerYear = startDate ? new Date(startDate).getFullYear() : 2025;
        doc.text(`PANEL ${footerYear}-PJE ${pjeName}`, margin, y);

        doc.save(`Notis_Pemberitahuan_${project.noFail}.pdf`);
    };

    // --- PDF GENERATOR 2: NOTIS PERINGATAN PERTAMA ---
    const generatePeringatanPertamaPDF = async (doc: any) => {
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 25;
        const contentWidth = pageWidth - (margin * 2);
        let y = 55; // Reduced Letterhead spacing from 50 to 45

        // Ref & Date
        doc.setFont("helvetica","normal");
        doc.setFontSize(10);
        const refNo = `${project.noFail || '................'} (   )`;
        doc.text(refNo, pageWidth - margin, y, { align: 'right' });
        y += 5;
        doc.text(letterMonthYear, pageWidth - margin, y, { align: 'right' });
        y += 8; // Gap after date (Reduced from 10)

        // Title
        doc.setFont("helvetica","bold");
        doc.setFontSize(12);
        doc.text("PERINGATAN PERTAMA", pageWidth / 2, y, { align: 'center' });
        y += 8; // Gap after title (Reduced from 10)

        // Recipient (Company)
        doc.setFontSize(11);
        doc.setFont("helvetica","bold");
        doc.text(project.namaSyarikat?.toUpperCase() || 'NAMA SYARIKAT', margin, y);
        y += 5;
        doc.setFont("helvetica","normal");
        if (companyDetails?.address) {
            const splitAddr = doc.splitTextToSize(companyDetails.address, 90);
            doc.text(splitAddr, margin, y);
            y += (splitAddr.length * 5) + 3; // Reduced buffer from 5
        } else {
            doc.text("ALAMAT SYARIKAT...", margin, y);
            y += 8;
        }

        // Salutation
        doc.text("Tuan,", margin, y);
        y += 6; // Reduced from 8

        // Project Title
        doc.setFont("helvetica","bold");
        doc.setFontSize(11);
        const title = project.namaProjek ? project.namaProjek.toUpperCase() :"TAJUK PROJEK...";
        const splitTitle = doc.splitTextToSize(title, contentWidth);
        doc.text(splitTitle, margin, y, { align: 'justify', maxWidth: contentWidth });
        y += (splitTitle.length * 5) + 4; // Gap after project title (Reduced from 5)

        // Para 1
        doc.setFont("helvetica","normal");
        doc.setFontSize(11);
        doc.text("Saya dengan segala hormatnya merujuk kepada perkara di atas.", margin, y);
        y += 6; // Gap between Para 1 & 2 (Reduced from 8)

        // Para 2 (SST Reference)
        // Use Tarikh Mula Kerja as requested if available, else SST date if captured, else generic
        const sstDate = project.tarikhMulaKontrak ? formatMalayDateLong(project.tarikhMulaKontrak) : '................';
        const para2 = `2. Berdasarkan surat setuju terima yang telah ditandatangani pada ${sstDate}, semakan jabatan mendapati pihak tuan perlu mematuhi perkara-perkara seperti berikut :`;
        const splitPara2 = doc.splitTextToSize(para2, contentWidth);
        doc.text(splitPara2, margin, y, { align: 'justify', maxWidth: contentWidth });
        y += (splitPara2.length * 5) + 4; // Gap before List (Reduced from 5)

        // List
        const listIndent = margin + 15;
        const listWidth = contentWidth - 15;
        
        doc.text("i)", margin + 5, y);
        doc.text("Menyiapkan kerja mengikut jadual yang ditetapkan", listIndent, y);
        y += 5;
        
        doc.setFont("helvetica","bold");
        const dateRange = `(Tarikh mula kerja : ${project.tarikhMulaKontrak ? project.tarikhMulaKontrak.split('-').reverse().join('/') : '...'} - ${project.tarikhTamatKontrak ? project.tarikhTamatKontrak.split('-').reverse().join('/') : '...'})`;
        doc.text(dateRange, listIndent, y);
        y += 6; // Gap within list (Reduced from 8)

        doc.setFont("helvetica","normal");
        doc.text("ii)", margin + 5, y);
        doc.text("Menyiapkan kerja di tapak dengan kadar segera", listIndent, y);
        y += 8; // Gap after list (Reduced from 10)

        // Para 3 (Deadline)
        const para3 ="3. Oleh yang demikian, pihak tuan dikehendaki untuk mematuhi perkara di atas dan dikehendaki untuk menyerahkan tuntutan dalam tempoh tujuh (7) hari daripada tarikh surat ini dikeluarkan.";
        const splitPara3 = doc.splitTextToSize(para3, contentWidth);
        doc.text(splitPara3, margin, y, { align: 'justify', maxWidth: contentWidth });
        y += (splitPara3.length * 5) + 4; // Gap (Reduced from 5)

        // --- Para 4 (LAD Warning) ---
        const ladRate = calculateLAD();
        const ladRateStr = `RM${ladRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        const para4Part1 ="4. Kelewatan pihak tuan berbuat demikian akan mengakibatkan laporan prestasi kerja syarikat tuan terjejas dan denda kelewatan (LAD) sebanyak";
        const para4Part2 ="/hari akan dikenakan.";

        const lineHeight = 5;
        let currentX = margin;
        let currentY = y;

        // Function to print text and wrap it manually
        const printStyledText = (text, isBold) => {
            doc.setFont("helvetica", isBold ?"bold" :"normal");
            const words = text.split("");
            
            words.forEach((word, index) => {
                // Add a space back to the word unless it's the very last word of a segment
                const wordToPrint = word + (index === words.length - 1 ?"" :"");
                const wordWidth = doc.getTextWidth(wordToPrint);

                // Check if we need to wrap to a new line
                if (currentX + wordWidth > margin + contentWidth) {
                    currentX = margin;
                    currentY += lineHeight;
                }

                doc.text(wordToPrint, currentX, currentY);
                currentX += wordWidth;
            });
        };

        // Execute printing for each segment
        printStyledText(para4Part1, false); // Normal text
        printStyledText(ladRateStr, true);   // Bold LAD Rate
        printStyledText(para4Part2, false); // Normal text (end)

        // Update global Y for the next section
        y = currentY + (lineHeight + 5); // Gap before Closing (Reduced from 8)

        // Closing
        doc.text("Sekian dimaklumkan, terima kasih.", margin, y);
        y += 10; // Gap before Slogans (Reduced from 12)

        // Slogans
        doc.setFont("helvetica","bold");
        doc.setFontSize(9);
        doc.text("“KITASELANGOR MAJU BERSAMA”", margin, y); y += 4; // Reduced from 5
        doc.text("“MALAYSIA MADANI”", margin, y); y += 4; // Reduced from 5
        doc.text("“BERKHIDMAT UNTUK NEGARA”", margin, y); y += 4; // Reduced from 5
        doc.text("“MAMPAN PROGRESIF SEJAHTERA”", margin, y); y += 8; // Gap before Signature Intro (Reduced from 12)

        // Signature
        doc.setFont("helvetica","normal");
        doc.setFontSize(11);
        doc.text("Saya yang menjalankan amanah,", margin, y); 
        
        // --- GAP CONTROL: SIGNATURE SPACE ---
        // Change this value to adjust spacing between 'Saya yang...' and Signer Name
        y += 18; // Reduced from 22 to tighten the signature space

        const jr = juruteraList.find(u => u.id == selectedJuruteraId);
        const signerName = jr ? jr.fullName.toUpperCase() :"NAMA JURUTERA...";
        
        doc.setFont("helvetica","bold");
        doc.text(`(${signerName})`, margin, y); y += 5;
        doc.setFont("helvetica","normal");
        doc.text(jr?.jawatan ||"Jurutera Awam", margin, y); y += 5;
        doc.text(jr?.bahagian ||"Jabatan Kejuruteraan", margin, y); y += 5;
        doc.text("Majlis Perbandaran Selayang", margin, y);

        // Footer - Positioned relatively after signature
        y += 4;
        doc.setFontSize(6);
        doc.setFont("helvetica","italic"); 
        const pjeName = pjaUser ? pjaUser.username.toUpperCase() :"PJE";
        const footerYear = new Date().getFullYear(); 
        doc.text(`PANEL ${footerYear}-PJE ${pjeName}`, margin, y);

        doc.save(`Notis_Peringatan_1_${project.noFail}.pdf`);
    };

    // --- PDF GENERATOR 3: NOTIS PERINGATAN KEDUA (MATCH IMAGE EXACTLY) ---
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
        const title = project.namaProjek ? project.namaProjek.toUpperCase() :"TAJUK PROJEK...";
        const splitTitle = doc.splitTextToSize(title, contentWidth);
        doc.text(splitTitle, margin, y, { align: 'justify', maxWidth: contentWidth });
        y += (splitTitle.length * 5) + 4;

        // Para 1
        doc.setFont("helvetica","normal");
        doc.setFontSize(11);
        doc.text("Saya dengan segala hormatnya merujuk kepada perkara di atas.", margin, y);
        y += 6;

        // Para 2 (Differs from Peringatan 1)
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

        // Para 3 (Different from Peringatan 1 - asks for written explanation)
        const para3 ="3. Oleh yang demikian, pihak tuan dikehendaki memberi penjelasan secara bertulis di atas kegagalan pihak tuan mematuhi perkara di atas.";
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
            // Switch font based on segment requirement
            doc.setFont("helvetica", segment.bold ?"bold" :"normal");
            
            // Split segment into words to handle wrapping
            const words = segment.text.split("");
            
            words.forEach((word, index) => {
                // Add space unless it's the last word of the segment
                const textToPrint = word + (index === words.length - 1 ?"" :"");
                const wordWidth = doc.getTextWidth(textToPrint);

                // Check if we need to wrap to a new line
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
        const signerName = jr ? jr.fullName.toUpperCase() :"NAMA JURUTERA...";
        
        doc.setFont("helvetica","bold");
        doc.text(`(${signerName})`, margin, y); y += 5;
        doc.setFont("helvetica","normal");
        doc.text(jr?.jawatan ||"Jurutera Awam", margin, y); y += 5;
        doc.text(jr?.bahagian ||"Jabatan Kejuruteraan", margin, y); y += 5;
        doc.text("Majlis Perbandaran Selayang", margin, y);

        // Footer
        y += 4;
        doc.setFontSize(6);
        doc.setFont("helvetica","italic"); 
        const pjeName = pjaUser ? pjaUser.username.toUpperCase() :"PJE";
        const footerYear = new Date().getFullYear(); 
        doc.text(`PANEL ${footerYear}-PJE ${pjeName}`, margin, y);

        doc.save(`Notis_Peringatan_2_${project.noFail}.pdf`);
    };

    // --- PDF GENERATOR 4: NOTIS PERINGATAN KETIGA (MATCH IMAGE 3 EXACTLY) ---
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

        // Project Title (MATCH IMAGE: ALL CAPS, BOLD, JUSTIFIED)
        doc.setFont("helvetica","bold");
        doc.setFontSize(11);
        const title = project.namaProjek ? project.namaProjek.toUpperCase() :"TAJUK PROJEK...";
        const splitTitle = doc.splitTextToSize(title, contentWidth);
        doc.text(splitTitle, margin, y, { align: 'justify', maxWidth: contentWidth });
        y += (splitTitle.length * 5) + 5;

        // Para 1
        doc.setFont("helvetica","normal");
        doc.setFontSize(11);
        doc.text("Saya dengan segala hormatnya merujuk kepada perkara di atas.", margin, y);
        y += 7;

        // Para 2 (Strict Image Wording)
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

        // Para 3 (Strict Image Wording)
        const para3 ="3. Oleh yang demikian, pihak tuan dikehendaki memberi penjelasan secara bertulis di atas kegagalan pihak tuan mematuhi perkara di atas.";
        const splitPara3 = doc.splitTextToSize(para3, contentWidth);
        doc.text(splitPara3, margin, y, { align: 'justify', maxWidth: contentWidth });
        y += (splitPara3.length * 5) + 5;

        // Para 4 (Strict Image Wording - Bolt 'tujuh (7) hari')
        const para4Start ="4. Sehubungan dengan itu, pihak tuan dikehendaki menyerahkan tuntutan dalam tempoh";
        const para4Bold ="tujuh (7) hari";
        const para4End =" daripada tarikh surat ini dikeluarkan atau tuan akan dikenakan denda lewat LAD. Kegagalan pihak tuan berbuat demikian akan menjejaskan penilaian prestasi syarikat tuan.";
        
        const fullPara4Text = `${para4Start}${para4Bold}${para4End}`;
        const splitPara4 = doc.splitTextToSize(fullPara4Text, contentWidth);
        
        // Handling bold within justified text in jsPDF is tricky without external plugins, 
        // using standard text wrapping but specifically highlighting the instruction wording.
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
        const signerName = jr ? jr.fullName.toUpperCase() :"NAMA JURUTERA...";
        
        doc.setFont("helvetica","bold");
        doc.text(`(${signerName})`, margin, y); y += 5;
        doc.setFont("helvetica","normal");
        doc.text(jr?.jawatan ||"Jurutera Awam", margin, y); y += 5;
        doc.text(jr?.bahagian ||"Jabatan Kejuruteraan", margin, y); y += 5;
        doc.text("Majlis Perbandaran Selayang", margin, y);

        // Footer
        y += 4;
        doc.setFontSize(6);
        doc.setFont("helvetica","italic"); 
        const pjeName = pjaUser ? pjaUser.username.toUpperCase() :"PJE";
        const footerYear = new Date().getFullYear(); 
        doc.text(`PANEL ${footerYear}-PJE ${pjeName}`, margin, y);

        doc.save(`Notis_Peringatan_3_${project.noFail}.pdf`);
    };

    // --- PDF GENERATOR 5: PERAKUAN KERJA TIDAK SIAP (FIXED WRAP & INDENT) ---
    const generateKerjaTidakSiapPDF = async (doc: any) => {
        const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
        const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
        const margin = 25;
        const contentWidth = pageWidth - (margin * 2);
        let y = 30;

        // Helper updated to accept maxWidth to handle indents correctly
        const getStyledLines = (parts: { text: string, bold?: boolean, italic?: boolean }[], maxWidth = contentWidth) => {
            const lines: { text: string, bold?: boolean, italic?: boolean }[][] = [];
            let currentLine: { text: string, bold?: boolean, italic?: boolean }[] = [];
            let currentLineWidth = 0;

            parts.forEach(part => {
                const style = part.bold ? (part.italic ?"bolditalic" :"bold") : (part.italic ?"italic" :"normal");
                doc.setFont("helvetica", style);

                const words = part.text.split(/(\s+)/).filter(w => w.length > 0);

                words.forEach((word) => {
                    const wordWidth = doc.getTextWidth(word);

                    // Use the passed maxWidth for calculation
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

        y = doc.lastAutoTable.finalY + 10;

        doc.setFont("helvetica","normal");
        doc.setFontSize(11);
        doc.text("Kepada:", margin, y);

        const recipientX = margin + 20;
        doc.setFont("helvetica","bold");
        doc.text(project.namaSyarikat?.toUpperCase() || 'NAMA SYARIKAT', recipientX, y);
        y += 5;

        doc.setFont("helvetica","normal");
        const addr = companyDetails?.address ||"ALAMAT SYARIKAT...";
        const splitAddr = doc.splitTextToSize(addr, 80);
        doc.text(splitAddr, recipientX, y);
        y += (splitAddr.length * 4) + 8;

        doc.text(`Berdaftar dengan C.I.D.B. dalam Gred"${companyDetails?.gred || 'G1'}"`, margin, y);
        y += 6;

        doc.setFont("helvetica","bold");
        doc.text(`No. Sebutharga : ${project.noSebutharga || ''}`, margin, y);
        y += 10;

        const title = project.namaProjek ? project.namaProjek.toUpperCase() :"TAJUK PROJEK...";
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
        const linesM1 = getStyledLines(malayParts1, contentWidth); // No indent here
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
                    doc.setFont("helvetica", chunk.bold ?"bold" :"normal");
                    doc.text(chunk.text, x, y);
                    x += doc.getTextWidth(chunk.text);
                });
            }
            if (linesE1[i]) {
                let x = margin;
                linesE1[i].forEach(chunk => {
                    doc.setFont("helvetica", chunk.bold ? (chunk.italic ?"bolditalic" :"bold") :"italic");
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
        const para2Width = contentWidth - indent; // FIX: Calculate width minus the indent

        const ladRate = calculateLAD();
        const ladStr = `RM${ladRate.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

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

        // Pass para2Width so wrap logic knows there is less space
        const linesM2 = getStyledLines(malayParts2, para2Width);
        const linesE2 = getStyledLines(englishParts2, para2Width);
        const count2 = Math.max(linesM2.length, linesE2.length);

        for (let i = 0; i < count2; i++) {
            if (y > pageHeight - 100) { doc.addPage(); y = 30; }

            if (linesM2[i]) {
                let x = margin + indent;
                linesM2[i].forEach(chunk => {
                    doc.setFont("helvetica", chunk.bold ?"bold" :"normal");
                    doc.text(chunk.text, x, y);
                    x += doc.getTextWidth(chunk.text);
                });
            }

            if (linesE2[i]) {
                let x = margin + indent;
                linesE2[i].forEach(chunk => {
                    doc.setFont("helvetica", chunk.bold ? (chunk.italic ?"bolditalic" :"bold") :"italic");
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

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60  animate-fade-in" style={{ zIndex: 9999 }}>
            <div className="bg-white  w-full max-w-lg rounded-3xl flex flex-col shadow-2xl overflow-hidden relative animate-slide-up">
                
                {/* Header */}
                <div className="p-5 border-b border-slate-200  flex justify-between items-center bg-white  shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900  text-lg">Jana Notis</h3>
                            <p className="text-xs text-slate-500">Pilih jenis notis untuk dijana</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100  rounded-full text-slate-500 transition-colors">
                        <X className="w-5 h-5"/>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    
                    {/* Notice Type Selector */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Jenis Notis</label>
                        <select 
                            value={noticeType} 
                            onChange={(e) => setNoticeType(e.target.value as NoticeType)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50  border border-slate-200  outline-none focus:ring-2 focus:ring-red-500 text-sm font-bold text-slate-700  cursor-pointer"
                        >
                            <option value="PEMBERITAHUAN">Notis Pemberitahuan (Awam)</option>
                            <option value="PERINGATAN_1">Notis Peringatan Pertama</option>
                            <option value="PERINGATAN_2">Notis Peringatan Kedua</option>
                            <option value="PERINGATAN_3">Notis Peringatan Ketiga</option>
                            <option value="KERJA_TIDAK_SIAP">Perakuan Kerja Tidak Siap</option>
                        </select>
                    </div>

                    {/* Dynamic Content based on Type */}
                    {noticeType === 'PEMBERITAHUAN' && (
                        <div className="space-y-3 animate-fade-in">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Tetapan Tarikh
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700  mb-1">Tarikh Mula</label>
                                    <StrictDateInput 
                                        name="startDate"
                                        value={startDate} 
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-slate-50  border border-slate-200  outline-none focus:ring-2 focus:ring-red-500 text-sm font-bold text-slate-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700  mb-1">Tarikh Tamat</label>
                                    <StrictDateInput 
                                        name="endDate"
                                        value={endDate} 
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-slate-50  border border-slate-200  outline-none focus:ring-2 focus:ring-red-500 text-sm font-bold text-slate-700"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {(noticeType === 'PERINGATAN_1' || noticeType === 'PERINGATAN_2' || noticeType === 'PERINGATAN_3' || noticeType === 'KERJA_TIDAK_SIAP') && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-yellow-50  p-3 rounded-xl border border-yellow-200">
                                <h4 className="text-xs font-bold text-yellow-700  uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Settings className="w-3 h-3" /> Info Peringatan
                                </h4>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Kadar LAD:</span>
                                        <span className="font-mono font-bold text-slate-700">RM {calculateLAD().toFixed(2)}/hari</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Tarikh Mula (SST):</span>
                                        <span className="font-mono font-bold text-slate-700">{project.tarikhMulaKerja ? project.tarikhMulaKerja.split('-').reverse().join('/') : '-'}</span>
                                    </div>
                                    {noticeType === 'KERJA_TIDAK_SIAP' && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Tarikh Tamat Kontrak:</span>
                                            <span className="font-mono font-bold text-red-600">{project.tarikhTamatKontrak ? project.tarikhTamatKontrak.split('-').reverse().join('/') : '-'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {noticeType !== 'KERJA_TIDAK_SIAP' && (
                                <div>
                                    <label className="block text-xs font-medium text-slate-700  mb-1">Bulan & Tahun Surat</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <select
                                            value={currentMonth}
                                            onChange={handleMonthChange}
                                            className="w-full px-3 py-2 rounded-xl bg-slate-50  border border-slate-200  outline-none focus:ring-2 focus:ring-red-500 text-sm font-bold text-slate-700  cursor-pointer"
                                        >
                                            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                        <select
                                            value={currentYear}
                                            onChange={handleYearChange}
                                            className="w-full px-3 py-2 rounded-xl bg-slate-50  border border-slate-200  outline-none focus:ring-2 focus:ring-red-500 text-sm font-bold text-slate-700  cursor-pointer"
                                        >
                                            {yearsList.map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                    <p className="text-[10px] text-slate-400 italic mt-1">
                                        {noticeType === 'PERINGATAN_2' 
                                            ? '*Tarikh default adalah 1 minggu SELEPAS tamat kontrak.' 
                                            : noticeType === 'PERINGATAN_3'
                                            ? '*Tarikh default adalah 2 minggu SELEPAS tamat kontrak.'
                                            : '*Tarikh default adalah 1 minggu SEBELUM tamat kontrak.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Signer Selection */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <UserIcon className="w-4 h-4" /> Penandatangan (Jurutera)
                        </h4>
                        <select 
                            value={selectedJuruteraId} 
                            onChange={(e) => setSelectedJuruteraId(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50  border border-slate-200  outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium text-slate-700  appearance-none cursor-pointer"
                        >
                            {juruteraList.length === 0 && <option value="">Tiada Data Jurutera</option>}
                            {juruteraList.map(jr => (
                                <option key={jr.id} value={jr.id}>{jr.fullName}</option>
                            ))}
                        </select>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-5 border-t border-slate-200  bg-gray-50  flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200  transition-colors text-sm"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={handleDownload}
                        disabled={isGenerating || !selectedJuruteraId}
                        className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        PDF
                    </button>
                </div>

            </div>
        </div>,
        document.body
    );
};

export default NotisGenerator;
