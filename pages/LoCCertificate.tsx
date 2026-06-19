
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Project, User, formatCurrency, formatDate } from '../types';
import { Download, Loader2, X } from 'lucide-react';
import { LoCPDFExporter } from '../services/pdf/LoCPDFExporter';

interface LoCCertificateProps {
    project: Project;
    pjaUser?: User;
    onClose: () => void;
}

const LoCCertificate: React.FC<LoCCertificateProps> = ({ project, pjaUser, onClose }) => {
    const [isGenerating, setIsGenerating] = useState(false);

    // --- Calculation Logic ---
    const locDays = project.locDays || 0;
    const locRate = 100;
    const totalLoC = project.locAmount || 0;

    // Helper to format number to 2 decimals
    const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            await LoCPDFExporter.export(project);
        } catch (e) {
            console.error("PDF Generation Error", e);
            alert("Ralat menjana PDF.");
        } finally {
            setIsGenerating(false);
        }
    };

    const LabelRow = ({ label, value, boldValue = false }: { label: string, value: string | React.ReactNode, boldValue?: boolean }) => (
        <div className="flex text-[11px] mb-1.5 items-start">
            <div className="w-[260px] shrink-0 uppercase">{label}</div>
            <div className="w-[10px] shrink-0 text-center">:</div>
            <div className={`flex-1 uppercase ${boldValue ? 'font-bold' : ''}`}>{value}</div>
        </div>
    );

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60  animate-fade-in" style={{ zIndex: 9999 }}>
            <div className="bg-white  w-full max-w-[230mm] h-[95vh] rounded-3xl flex flex-col shadow-2xl overflow-hidden relative animate-slide-up">
                
                {/* Modal Header */}
                <div className="p-4 border-b border-slate-200  flex justify-between items-center bg-white  shrink-0">
                    <h3 className="font-bold text-slate-800">Pratonton Perakuan LoC</h3>
                    <div className="flex gap-2">
                        <button 
                            onClick={handleDownload}
                            disabled={isGenerating}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                        >
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4"/>}
                            PDF
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100  rounded-lg text-slate-500">
                            <X className="w-5 h-5"/>
                        </button>
                    </div>
                </div>

                {/* Preview Area (Visual Only, Matches jsPDF logic visually) */}
                <div className="flex-1 overflow-y-auto bg-gray-100 p-8 flex justify-center">
                    <div className="w-[210mm] min-h-[297mm] bg-white p-[20mm] shadow-lg text-black font-sans leading-snug relative box-border">
                        
                        {/* Title */}
                        <div className="mb-8">
                            <div className="flex items-start text-[11px] font-bold mb-4">
                                <span className="w-[90px] shrink-0 uppercase">TAJUK KERJA :</span>
                                <span className="uppercase leading-tight">{project.namaProjek}</span>
                            </div>
                            <div className="underline font-bold text-[12px] uppercase mb-6">
                                DENDA LEWAT TUNTUTAN (LoC)
                            </div>
                        </div>

                        {/* Section 1: Info */}
                        <div className="mb-8">
                            <LabelRow label="KONTRAKTOR" value={project.namaSyarikat || '-'} boldValue />
                            <LabelRow label="NO FAIL" value={project.noFail} />
                            <LabelRow label="ADUN/ ZON" value={`${project.bp || ''} / ${project.zon || ''}`} />
                        </div>

                        {/* Section 2: Dates */}
                        <div className="mb-8">
                            <LabelRow label="TARIKH SIAP KERJA SEBENAR" value={formatDate(project.tarikhSiapSebenar)} />
                            <LabelRow label="TARIKH TUNTUTAN BAYARAN" value={formatDate(project.tarikhTuntutanBayaran)} />
                        </div>

                        {/* Section 3: Logic */}
                        <div className="mb-8 text-[12px]">
                            <p className="font-bold mb-2">PENGIRAAN DENDA LEWAT TUNTUTAN</p>
                            <ol className="list-decimal pl-4 space-y-1">
                                <li>Tempoh liabiliti untuk tuntutan bayaran adalah 14 hari selepas Tarikh Siap Sebenar.</li>
                                <li>Denda dikenakan bermula hari ke-15 selepas Tarikh Siap Sebenar.</li>
                                <li>Kadar denda adalah RM 100.00 / Hari.</li>
                            </ol>
                        </div>

                        {/* Section 4: Calculation Box */}
                        <div className="border-2 border-black p-6 font-bold text-[12px] mb-8">
                            <div className="mb-6">
                                <div className="mb-2">BILANGAN HARI LEWAT:</div>
                                <div className="pl-4 font-normal mb-2">
                                    ( {formatDate(project.tarikhTuntutanBayaran)} - {formatDate(project.tarikhSiapSebenar)} ) - 14 HARI
                                </div>
                                <div className="pl-4 font-bold text-[14px] mb-4">
                                    = {locDays} HARI
                                </div>
                            </div>

                            <div>
                                <div className="mb-2">JUMLAH DENDA (LoC):</div>
                                <div className="pl-4 font-normal mb-2">
                                    {locDays} HARI x RM 100.00
                                </div>
                                <div className="pl-4 font-black text-[18px]">
                                    = RM {fmt(totalLoC)}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default LoCCertificate;
