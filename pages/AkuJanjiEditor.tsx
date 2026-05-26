
import React, { useState, useEffect } from 'react';
import { Project, User } from '../types';
import { Download, Loader2, FilePenLine } from 'lucide-react';

interface AkuJanjiEditorProps {
    project: Project;
    selectedYear: number;
    pjaUser?: User;
    onUpdate: (updates: Partial<Project>) => void;
    isPrintView?: boolean;
    readOnly?: boolean;
}

const MONTHS = [
 "Januari","Februari","Mac","April","Mei","Jun", 
 "Julai","Ogos","September","Oktober","November","Disember"
];

const AkuJanjiEditor: React.FC<AkuJanjiEditorProps> = ({ project, selectedYear, pjaUser, onUpdate, isPrintView, readOnly = false }) => {
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    
    // Initial Defaults
    useEffect(() => {
        if (!project.akuJanjiMonth) {
            const currentMonthIndex = new Date().getMonth(); // 0-11
            onUpdate({ akuJanjiMonth: MONTHS[currentMonthIndex] });
        }
        if (!project.akuJanjiPanelTitle) {
            onUpdate({ akuJanjiPanelTitle:"Kontraktor Panel" });
        }
    }, []);

    const currentMonth = project.akuJanjiMonth || MONTHS[new Date().getMonth()];
    
    // Dynamic Footer Values
    const pjeName = pjaUser ? `PJE ${pjaUser.username.toUpperCase()}` :"PJE";
    const companyName = project.namaSyarikat ? project.namaSyarikat.toUpperCase() :"NAMA SYARIKAT";

    // Date formatting for body
    const formattedSerahTapak = project.tarikhSerahTapak 
        ? project.tarikhSerahTapak.split('-').reverse().join('/') 
        : '...................';

    const formattedAduan = project.noAduan 
        ? project.noAduan.split('\n')
            .map(s => s.trim())
            .filter(s => s.length > 0)
            .join(', ')
        : '';

    const handleDownloadPDF = async () => {
        setIsGeneratingPdf(true);
        try {
            // @ts-ignore
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');
            
            const pageWidth = doc.internal.pageSize.getWidth(); // 210
            const pageHeight = doc.internal.pageSize.getHeight(); // 297
            const margin = 25; // Standard margin
            const contentWidth = pageWidth - (margin * 2);
            
            // --- DOCUMENT HEADER ---
            doc.setFont("helvetica","bold");
            doc.setFontSize(11);

            // Ref No & Date (Top Right)
            const refNo = `${project.noFail || '................'} (   )`;
            const dateStr = `${currentMonth} ${selectedYear}`;
            
            doc.text(refNo, pageWidth - margin, 30, { align: 'right' });
            doc.text(dateStr, pageWidth - margin, 35, { align: 'right' });

            // Recipient (Top Left)
            let yPos = 50;
            const lineHeight = 5;
            doc.text("Pengarah,", margin, yPos);
            yPos += lineHeight;
            doc.text("Jabatan Kejuruteraan,", margin, yPos);
            yPos += lineHeight;
            doc.text("Majlis Perbandaran Selayang.", margin, yPos);

            // Title"AKU JANJI"
            yPos += 25;
            doc.setFontSize(16);
            doc.text("AKU JANJI", pageWidth / 2, yPos, { align: 'center' });

            // --- BODY ---
            yPos += 20;
            doc.setFontSize(11);
            
            const title = project.namaProjek ? project.namaProjek.toUpperCase() :"TAJUK PROJEK...";
            const splitTitle = doc.splitTextToSize(title, contentWidth);
            doc.text(splitTitle, margin, yPos, { align: 'justify', maxWidth: contentWidth });
            
            const titleHeight = doc.getTextDimensions(splitTitle).h;
            yPos += titleHeight + 10;

            doc.setFont("helvetica","normal");
            const para1 = `Adalah dimaklumkan bahawa, saya memperakukan bahawa kerja-kerja di tapak akan dimulakan dalam tempoh lima (5) hari selepas tarikh penyerahan tapak iaitu pada ${formattedSerahTapak}`;
            const splitPara1 = doc.splitTextToSize(para1, contentWidth);
            doc.text(splitPara1, margin, yPos, { align: 'justify', maxWidth: contentWidth });
            
            const para1Height = doc.getTextDimensions(splitPara1).h;
            yPos += para1Height + 10;

            const para2 ="Sekiranya kerja-kerja tersebut gagal dimulakan dalam tempoh lima (5) hari, pihak MPS berhak menarik semula perlantikan syarikat saya dan melantik semula syarikat lain bagi kerja tersebut.";
            const splitPara2 = doc.splitTextToSize(para2, contentWidth);
            doc.text(splitPara2, margin, yPos, { align: 'justify', maxWidth: contentWidth });
            
            const para2Height = doc.getTextDimensions(splitPara2).h;
            yPos += para2Height + 10;

            doc.text("Sekian.", margin, yPos);
            yPos += 30;

            // --- SIGNATURES ---
            const sigStartY = yPos;
            doc.text("Saya yang berjanji", margin, sigStartY);
            const rightColX = pageWidth / 2 + 10;
            doc.text("Saksi", rightColX, sigStartY);

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
            doc.setFont("helvetica","bolditalic");
            doc.setFontSize(6);
            
            const footerText = `${project.akuJanjiPanelTitle || 'KONTRAKTOR PANEL'} ${selectedYear} ${pjeName} - ${companyName}`;
            doc.text(footerText, margin, footerY);
            
            doc.setFont("helvetica","bold"); 
            doc.text(`ADUAN: ${formattedAduan}`, margin, footerY + 5);

            doc.save(`Aku_Janji_${project.noFail || 'Dokumen'}.pdf`);
        } catch (e) {
            console.error(e);
            alert("Gagal menjana PDF. Sila cuba lagi.");
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {!isPrintView && (
                <div className={`bg-white/95  border border-white/10 shadow-xl p-6 rounded-2xl border border-slate-200  shadow-sm animate-fade-in ${readOnly ? 'bg-slate-50/50' : ''}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                             <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                <FilePenLine className="w-5 h-5" />
                             </div>
                             <h3 className="font-bold text-slate-800">Tetapan Dokumen</h3>
                        </div>
                        <button 
                            type="button" 
                            onClick={handleDownloadPDF} 
                            disabled={isGeneratingPdf} 
                            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 text-sm"
                        >
                            {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            <span>PDF</span>
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                             <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Bulan (Surat)</label>
                             <select 
                                value={project.akuJanjiMonth || ''}
                                onChange={(e) => onUpdate({ akuJanjiMonth: e.target.value })}
                                disabled={readOnly}
                                className="w-full p-2 rounded-lg border border-slate-300  bg-white  text-sm disabled:cursor-not-allowed"
                             >
                                 {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                             </select>
                         </div>
                         <div>
                             <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tajuk Panel</label>
                             <input 
                                type="text"
                                value={project.akuJanjiPanelTitle || ''}
                                onChange={(e) => onUpdate({ akuJanjiPanelTitle: e.target.value })}
                                disabled={readOnly}
                                className="w-full p-2 rounded-lg border border-slate-300  bg-white  text-sm disabled:cursor-not-allowed"
                                placeholder="Kontraktor Panel"
                             />
                         </div>
                    </div>
                </div>
            )}

            <div className="flex justify-center bg-gray-100 py-4 overflow-auto rounded-2xl border border-slate-200">
                <div 
                    id="aku-janji-doc" 
                    className="w-[210mm] min-h-[297mm] bg-white text-black  p-[25mm] shadow-xl relative box-border mx-auto font-sans leading-relaxed"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                >
                    <div className="flex flex-col items-end text-[13px] mb-8 font-bold">
                         <div className="text-right">
                             <p>{project.noFail} (&nbsp;&nbsp;&nbsp;)</p>
                             <p className="mt-1">{currentMonth} {selectedYear}</p>
                         </div>
                    </div>

                    <div className="mb-10 text-[13px] font-bold">
                        <p>Pengarah,</p>
                        <p>Jabatan Kejuruteraan,</p>
                        <p>Majlis Perbandaran Selayang.</p>
                    </div>

                    <div className="text-center mb-10">
                        <h1 className="text-[22px] font-bold uppercase tracking-wide">AKU JANJI</h1>
                    </div>

                    <div className="text-justify text-[13px] leading-[1.6]">
                        <p className="mb-8 font-bold uppercase">
                            {project.namaProjek}
                        </p>
                        <p className="mb-8">
                            Adalah dimaklumkan bahawa, saya memperakukan bahawa kerja-kerja di tapak akan dimulakan dalam tempoh lima (5) hari selepas tarikh penyerahan tapak iaitu pada {formattedSerahTapak}.
                        </p>
                        <p className="mb-8">
                            Sekiranya kerja-kerja tersebut gagal dimulakan dalam tempoh lima (5) hari, pihak MPS berhak menarik semula perlantikan syarikat saya dan melantik semula syarikat lain bagi kerja tersebut.
                        </p>
                        <p className="mb-16">
                            Sekian.
                        </p>
                    </div>

                    <div className="flex justify-between items-start mt-12 text-[13px]">
                        <div className="w-[45%]">
                            <p className="mb-16">Saya yang berjanji</p>
                            <div className="border-b border-black border-dashed mb-2"></div>
                            <div className="grid grid-cols-[80px_1fr] gap-1">
                                <div>Pengurus</div>
                                <div>:</div>
                                <div>Cop</div>
                                <div>:</div>
                                <div>Tarikh</div>
                                <div>:</div>
                            </div>
                        </div>
                        <div className="w-[45%]">
                            <p className="mb-16">Saksi</p>
                            <div className="border-b border-black border-dashed mb-2"></div>
                            <div className="grid grid-cols-[80px_1fr] gap-1">
                                <div>Nama</div>
                                <div>:</div>
                                <div>Jawatan</div>
                                <div>:</div>
                                <div>Tarikh</div>
                                <div>:</div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-32 pt-4 border-t border-transparent text-[10px] font-bold uppercase italic">
                         <div className="flex justify-between items-end">
                             <div>
                                 {project.akuJanjiPanelTitle} {selectedYear} {pjeName} - {companyName}
                             </div>
                         </div>
                         <div className="mt-2">
                             ADUAN: {formattedAduan}
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AkuJanjiEditor;
