
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Project, User, formatDateMalay } from '../types';
import { supabaseService } from '../services/supabaseService';
import { Download, Loader2, X } from 'lucide-react';

interface CPCCertificateProps {
    project: Project;
    pjaUser?: User;
    onClose: () => void;
}

const CPCCertificate: React.FC<CPCCertificateProps> = ({ project, pjaUser, onClose }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [companyDetails, setCompanyDetails] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (project.namaSyarikat) {
                try {
                    const year = new Date(project.tarikhBuka).getFullYear();
                    const details = await supabaseService.getCompanyDetails(year, project.namaSyarikat);
                    setCompanyDetails(details);
                } catch (err) {
                    console.error('Failed to load company details:', err);
                }
            }
        };
        fetchData();
    }, [project]);

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

    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            // @ts-ignore
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');
            
            const pageWidth = doc.internal.pageSize.getWidth(); 
            const margin = 25; 
            const contentWidth = pageWidth - (margin * 2);
            let currentY = 20;

            doc.setFont("helvetica","bold");
            doc.setFontSize(11);
            doc.text("KERAJAAN MALAYSIA", pageWidth / 2, currentY, { align:"center" });
            currentY += 6;
            
            doc.setFontSize(13);
            doc.text("MAJLIS PERBANDARAN SELAYANG", pageWidth / 2, currentY, { align:"center" });
            currentY += 8;

            doc.setFont("helvetica","normal");
            doc.setFontSize(10);
            doc.text("PERAKUAN SIAP KERJA", pageWidth / 2, currentY, { align:"center" });
            currentY += 5;

            doc.setFont("helvetica","italic");
            doc.setFontSize(9);
            doc.text("(CERTIFICATE OF PRACTICAL COMPLETION)", pageWidth / 2, currentY, { align:"center" });
            currentY += 15;

            doc.setFont("helvetica","normal");
            doc.setFontSize(9);

            const leftColX = margin;
            const rightColX = pageWidth / 2 + 10; 

            doc.text(`Rujukan : Bil (   ) ${project.noFail || ''}`, leftColX, currentY);
            
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
            doc.setFontSize(9); 
            
            const date1 = tarikhSiap ? formatDateMalay(tarikhSiap) : '...................';
            const date2 = dlpStart ? formatDateMalay(dlpStart) : '...................';
            const date3 = dlpEnd ? formatDateMalay(dlpEnd) : '...................';

            const tokens = [
                { text:"Menurut Syarat-Syarat Kontrak, dan tertakluk kepada penyiapan berkaitan dengan pembaikan apa-apa kecacatan, ketidaksempurnaan, kesusutan atau apa-apa dan yang mungkin terzahir dalam Tempoh Tanggungan Kecacatan maka adalah dengan ini di perakui bahawa seluruh Kerja yang tersebut telah siap sejajar dengan syarat-syarat dalam Dokumen Sebut Harga pada", bold: false },
                { text: date1, bold: true },
                { text:" dan diambil milik pada", bold: false },
                { text: date2, bold: true },
                { text:" dan dengan itu Tempoh Tanggungan Kecacatan untuk kerja kerja tersebut bermula pada", bold: false },
                { text: date2, bold: true },
                { text:" dan berakhir pada", bold: false },
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
            doc.setFontSize(9);
            
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
            
            const splitName = doc.splitTextToSize(`Nama Penuh : ${pjaName}`, maxLeftWidth);
            doc.text(splitName, sigLeftX, currentY);
            currentY += (splitName.length * 5); 

            const splitRole = doc.splitTextToSize(`Jawatan : ${pjaRole}`, maxLeftWidth);
            doc.text(splitRole, sigLeftX, currentY);

            let rightY = sigStartY;
            
            doc.text(`(Jurutera)`, sigRightX, rightY);
            rightY += 5;
            doc.text(`Nama Penuh :`, sigRightX, rightY);
            rightY += 5;
            doc.text(`Jawatan :`, sigRightX, rightY);

            doc.save(`CPC_${project.noFail || 'Cert'}.pdf`);

        } catch (e) {
            console.error(e);
            alert("Ralat menjana PDF.");
        } finally {
            setIsGenerating(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60  animate-fade-in" style={{ zIndex: 9999 }}>
            <div className="bg-white  w-full max-w-[230mm] h-[95vh] rounded-3xl flex flex-col shadow-2xl overflow-hidden relative animate-slide-up">
                
                <div className="p-4 border-b border-slate-200  flex justify-between items-center bg-white  shrink-0">
                    <h3 className="font-bold text-slate-800">Pratonton CPC (Perakuan Siap Kerja)</h3>
                    <div className="flex gap-2">
                        <button 
                            onClick={handleDownload}
                            disabled={isGenerating}
                            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors text-sm disabled:opacity-50"
                        >
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4"/>}
                            PDF
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100  rounded-lg text-slate-500">
                            <X className="w-5 h-5"/>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-gray-100 p-8 flex justify-center">
                    <div id="cpc-cert-container" className="w-[210mm] min-h-[297mm] bg-white px-[25mm] pt-[20mm] pb-[20mm] shadow-lg text-black relative box-border flex flex-col leading-snug" style={{ fontFamily: 'Arial, sans-serif' }}>
                        
                        <div className="text-center mb-6">
                            <h2 className="text-[11pt] font-bold uppercase tracking-wide">KERAJAAN MALAYSIA</h2>
                            <h1 className="text-[13pt] font-bold uppercase tracking-wide mb-4">MAJLIS PERBANDARAN SELAYANG</h1>
                            
                            <p className="text-[10pt] uppercase">PERAKUAN SIAP KERJA</p>
                            <p className="text-[9pt] italic">(CERTIFICATE OF PRACTICAL COMPLETION)</p>
                        </div>

                        <div className="flex justify-between items-start mb-6 text-[9pt]">
                            <div className="w-[50%]">
                                <p>Rujukan : Bil ( &nbsp;&nbsp; ) {project.noFail}</p>
                            </div>
                            <div className="w-[45%]">
                                <p className="font-bold">Majlis Perbandaran Selayang</p>
                                <p>Persiaran 3, Bandar Baru Selayang,</p>
                                <p>68100 Batu Caves,</p>
                                <p>Selangor Darul Ehsan</p>
                            </div>
                        </div>

                        <div className="flex justify-between items-start mb-6 text-[9pt]">
                            <div className="w-[60%] flex items-start">
                                <span className="w-[25mm] shrink-0">Kepada :</span>
                                <div>
                                    <p className="font-bold uppercase">{project.namaSyarikat || 'NAMA SYARIKAT'}</p>
                                    <p className="whitespace-pre-line leading-tight">{companyDetails?.address || 'ALAMAT SYARIKAT...'}</p>
                                </div>
                            </div>
                            <div className="w-[40%] font-bold uppercase text-right pr-[5mm]">
                                {tarikhSiap ? formatDateMalay(tarikhSiap) : '.........................'}
                            </div>
                        </div>

                        <div className="mb-6 text-[9pt] font-bold">
                            <p className="mb-1">Berdaftar dengan CIDB dalam Gred" {companyDetails?.gred || 'G1'}"</p>
                            <p>No. Sebutharga : {project.noSebutharga || '.........................'}</p>
                        </div>

                        <div className="mb-6 text-[9pt] flex items-start">
                            <span className="font-normal w-[35mm] shrink-0">Sebutharga Untuk :</span> 
                            <span className="font-bold uppercase text-justify leading-snug">{project.namaProjek}</span>
                        </div>

                        <div className="text-[9pt] text-justify leading-relaxed mb-12">
                            <p>
                                Menurut Syarat-Syarat Kontrak, dan tertakluk kepada penyiapan berkaitan dengan pembaikan apa-apa kecacatan, ketidaksempurnaan, kesusutan atau apa-apa dan yang mungkin terzahir dalam Tempoh Tanggungan Kecacatan maka adalah dengan ini di perakui bahawa seluruh Kerja yang tersebut telah siap sejajar dengan syarat-syarat dalam Dokumen Sebut Harga pada &nbsp;
                                <span className="font-bold">{tarikhSiap ? formatDateMalay(tarikhSiap) : '...................'}</span>
                                &nbsp; dan diambil milik pada &nbsp;
                                <span className="font-bold">{dlpStart ? formatDateMalay(dlpStart) : '...................'}</span>
                                &nbsp; dan dengan itu Tempoh Tanggungan Kecacatan untuk kerja kerja tersebut bermula pada &nbsp;
                                <span className="font-bold">{dlpStart ? formatDateMalay(dlpStart) : '...................'}</span>
                                &nbsp; dan berakhir pada &nbsp;
                                <span className="font-bold">{dlpEnd ? formatDateMalay(dlpEnd) : '...................'}</span>.
                            </p>
                        </div>

                        <div className="flex justify-between items-end mt-auto text-[9pt] font-bold">
                            <div className="w-[45%]">
                                <p className="mb-12">Diperakui di tapak,</p>
                                <div className="border-b border-black border-dashed mb-1 w-full"></div>
                                <p>(Penolong Jurutera/Penyelia Tapak)</p>
                                <p>Nama Penuh : {pjaUser?.fullName?.toUpperCase() || ''}</p>
                                <p>Jawatan : {pjaUser?.jawatan || ''}</p>
                            </div>

                            <div className="w-[45%]">
                                <p className="mb-12">Disahkan,</p>
                                <div className="border-b border-black border-dashed mb-1 w-full"></div>
                                <p>(Jurutera)</p>
                                <p>Nama Penuh :</p>
                                <p>Jawatan :</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CPCCertificate;
