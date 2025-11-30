import React, { useState, useEffect } from 'react';
import { Project, User } from '../types';
import { Download, Loader2, FilePenLine } from 'lucide-react';

interface AkuJanjiEditorProps {
    project: Project;
    selectedYear: number;
    pjaUser?: User;
    onUpdate: (updates: Partial<Project>) => void;
    isPrintView?: boolean;
}

const MONTHS = [
    "Januari", "Februari", "Mac", "April", "Mei", "Jun", 
    "Julai", "Ogos", "September", "Oktober", "November", "Disember"
];

const AkuJanjiEditor: React.FC<AkuJanjiEditorProps> = ({ project, selectedYear, pjaUser, onUpdate, isPrintView }) => {
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    
    // Initial Defaults
    useEffect(() => {
        if (!project.akuJanjiMonth) {
            const currentMonthIndex = new Date().getMonth(); // 0-11
            onUpdate({ akuJanjiMonth: MONTHS[currentMonthIndex] });
        }
        if (!project.akuJanjiPanelTitle) {
            onUpdate({ akuJanjiPanelTitle: "Kontraktor Panel" });
        }
    }, []);

    const handleDownloadPDF = async () => {
        setIsGeneratingPdf(true);
        setTimeout(async () => {
            const element = document.getElementById('aku-janji-doc');
            if (element) {
                const opt = {
                    margin: 0,
                    filename: `Aku_Janji_${project.noFail || 'Projek'}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true, scrollY: 0 }, 
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };

                try {
                    // @ts-ignore
                    await window.html2pdf().set(opt).from(element).save();
                } catch (err) {
                    console.error(err);
                    alert("Ralat menjana PDF.");
                } finally {
                    setIsGeneratingPdf(false);
                }
            } else {
                setIsGeneratingPdf(false);
            }
        }, 100);
    };

    const currentMonth = project.akuJanjiMonth || MONTHS[new Date().getMonth()];
    
    // Dynamic Footer Values
    // Update: PJA uses username (ID) instead of full name
    const pjaName = pjaUser ? `PJA ${pjaUser.username.toUpperCase()}` : "PJA";
    const companyName = project.namaSyarikat ? project.namaSyarikat.toUpperCase() : "NAMA SYARIKAT";

    // Date formatting for body
    const formattedSerahTapak = project.tarikhSerahTapak 
        ? project.tarikhSerahTapak.split('-').reverse().join('/') 
        : '...................';

    // Format Aduan: Join with commas if multiple lines
    const formattedAduan = project.noAduan 
        ? project.noAduan.split('\n')
            .map(s => s.trim())
            .filter(s => s.length > 0)
            .join(', ')
        : 'MPS.XXXXXX';

    return (
        <div className="flex flex-col gap-6">
            
            {/* EDITOR CONTROLS (Hidden in Print View) */}
            {!isPrintView && (
                <div className="glass-effect p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm animate-fade-in-up">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                             <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                <FilePenLine className="w-5 h-5" />
                             </div>
                             <h3 className="font-bold text-slate-800 dark:text-white">Tetapan Dokumen</h3>
                        </div>
                        <button 
                            type="button" 
                            onClick={handleDownloadPDF} 
                            disabled={isGeneratingPdf} 
                            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 text-sm"
                        >
                            {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            <span>Muat Turun PDF</span>
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                             <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Bulan (Surat)</label>
                             <select 
                                value={project.akuJanjiMonth || ''}
                                onChange={(e) => onUpdate({ akuJanjiMonth: e.target.value })}
                                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
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
                                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                                placeholder="Kontraktor Panel"
                             />
                         </div>
                    </div>
                </div>
            )}

            {/* DOCUMENT PREVIEW */}
            <div className="flex justify-center bg-gray-100 py-4 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                
                {/* A4 PAGE CONTAINER */}
                <div 
                    id="aku-janji-doc" 
                    className="w-[210mm] min-h-[297mm] bg-white text-black p-[25mm] shadow-xl relative box-border mx-auto font-sans leading-relaxed"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                >
                    {/* HEADER */}
                    <div className="flex flex-col items-end text-[13px] mb-8 font-bold">
                         <div className="text-right">
                             <p>Bil ( ) dlm.MPS {project.noFail}</p>
                             <p className="mt-1">{currentMonth} {selectedYear}</p>
                         </div>
                    </div>

                    <div className="mb-10 text-[13px] font-bold">
                        <p>Pengarah,</p>
                        <p>Jabatan Kejuruteraan,</p>
                        <p>Majlis Perbandaran Selayang.</p>
                    </div>

                    {/* TITLE */}
                    <div className="text-center mb-10">
                        <h1 className="text-[22px] font-bold uppercase tracking-wide">AKU JANJI</h1>
                    </div>

                    {/* BODY */}
                    <div className="text-justify text-[13px] leading-[1.6]">
                        {/* Title strictly project name only */}
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

                    {/* SIGNATURES */}
                    <div className="flex justify-between items-start mt-12 text-[13px]">
                        
                        {/* LEFT SIGNATURE */}
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

                        {/* RIGHT SIGNATURE */}
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

                    {/* FOOTER */}
                    <div className="mt-32 pt-4 border-t border-transparent text-[10px] font-bold uppercase italic">
                         <div className="flex justify-between items-end">
                             <div>
                                 {project.akuJanjiPanelTitle} {selectedYear} {pjaName} - {companyName}
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
