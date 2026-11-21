import React, { useState, useEffect } from 'react';
import { Project, User } from '../types';
import { Download, Loader2, FilePenLine } from 'lucide-react';
import { AkuJanjiPDFExporter } from '../services/pdf/AkuJanjiPDFExporter';
import FitToWidth from '../components/detail/FitToWidth';
import { useOrgDocs } from '../components/org/orgDocs';

const T = 'doc.aku_janji';

// 210 mm at 96 dpi: the preview page's CSS width.
const A4_WIDTH_PX = 794;

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
    const { docs: org, ready } = useOrgDocs(project);
    
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
    const pjaName = pjaUser ? `PJA ${pjaUser.username.toUpperCase()}` :"PJA";
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
            await AkuJanjiPDFExporter.export(project, {
                currentMonth,
                selectedYear: String(selectedYear),
                pjaName,
                companyName,
                formattedSerahTapak,
                formattedAduan
            }, ready ? org : undefined);
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
                <div className={`bg-white/95  border border-white/10 shadow-xl p-6 max-md:p-4 rounded-2xl border border-slate-200  shadow-sm animate-fade-in ${readOnly ? 'bg-slate-50/50' : ''}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
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
                            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 text-sm max-md:order-last max-md:w-full max-md:h-12 max-md:justify-center"
                        >
                            {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            <span>PDF</span>
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                             <label className="block text-[10px] max-md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Bulan (Surat)</label>
                             <select 
                                value={project.akuJanjiMonth || ''}
                                onChange={(e) => onUpdate({ akuJanjiMonth: e.target.value })}
                                disabled={readOnly}
                                className="w-full p-2 rounded-lg border border-slate-300  bg-white  text-sm max-md:text-base max-md:min-h-[48px] disabled:cursor-not-allowed"
                             >
                                 {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                             </select>
                         </div>
                         <div>
                             <label className="block text-[10px] max-md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Tajuk Panel</label>
                             <input 
                                type="text"
                                value={project.akuJanjiPanelTitle || ''}
                                onChange={(e) => onUpdate({ akuJanjiPanelTitle: e.target.value })}
                                disabled={readOnly}
                                className="w-full p-2 rounded-lg border border-slate-300  bg-white  text-sm max-md:text-base max-md:min-h-[48px] disabled:cursor-not-allowed"
                                placeholder="Kontraktor Panel"
                             />
                         </div>
                    </div>
                </div>
            )}

            <div className="flex justify-center bg-gray-100 py-4 max-md:px-3 overflow-auto rounded-2xl border border-slate-200">
                <FitToWidth contentWidth={A4_WIDTH_PX}>
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
                        {org.text(T, 'recipient').split('\n').map((line, i) => <p key={i}>{line}</p>)}
                    </div>

                    <div className="text-center mb-10">
                        <h1 className="text-[22px] font-bold uppercase tracking-wide">{org.text(T, 'title')}</h1>
                    </div>

                    <div className="text-justify text-[13px] leading-[1.6]">
                        <p className="mb-8 font-bold uppercase">
                            {project.namaProjek}
                        </p>
                        <p className="mb-8">
                            {org.text(T, 'para1', { tarikh_serah_tapak: formattedSerahTapak })}
                        </p>
                        <p className="mb-8">
                            {org.text(T, 'para2')}
                        </p>
                        <p className="mb-16">
                            {org.text(T, 'closing')}
                        </p>
                    </div>

                    <div className="flex justify-between items-start mt-12 text-[13px]">
                        <div className="w-[45%]">
                            <p className="mb-16">{org.text(T, 'signLeft')}</p>
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
                            <p className="mb-16">{org.text(T, 'signRight')}</p>
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
                                 {project.akuJanjiPanelTitle} {selectedYear} {pjaName} - {companyName}
                             </div>
                         </div>
                         <div className="mt-2">
                             ADUAN: {formattedAduan}
                         </div>
                    </div>
                </div>
                </FitToWidth>
            </div>
        </div>
    );
};

export default AkuJanjiEditor;
