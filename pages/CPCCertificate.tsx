
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Project, User, formatDateMalay } from '../types';
import { mockService } from '../services/mockService';
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
        if (project.namaSyarikat) {
            const year = new Date(project.tarikhBuka).getFullYear();
            const details = mockService.getCompanyDetails(year, project.namaSyarikat);
            setCompanyDetails(details);
        }
    }, [project]);

    // --- Dates Logic ---
    const tarikhSiap = project.tarikhSiapSebenar ? project.tarikhSiapSebenar : '';
    
    // Add 1 day to Tarikh Siap for Defect Start
    const getDLPStart = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    };
    const dlpStart = getDLPStart(tarikhSiap);

    // Add 6 months to DLP Start for DLP End
    const getDLPEnd = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        d.setMonth(d.getMonth() + 6);
        return d.toISOString().split('T')[0];
    };
    const dlpEnd = getDLPEnd(dlpStart);

    const handleDownload = async () => {
        setIsGenerating(true);
        setTimeout(async () => {
            const element = document.getElementById('cpc-cert-container');
            if (element) {
                const opt = {
                    margin: 0,
                    filename: `CPC_${project.noFail || 'Cert'}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };

                try {
                    // @ts-ignore
                    await window.html2pdf().set(opt).from(element).save();
                } catch (e) {
                    console.error(e);
                    alert("Ralat menjana PDF");
                } finally {
                    setIsGenerating(false);
                }
            }
        }, 100);
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" style={{ zIndex: 9999 }}>
            <div className="bg-white dark:bg-slate-900 w-full max-w-[230mm] h-[95vh] rounded-3xl flex flex-col shadow-2xl overflow-hidden relative animate-slide-up">
                
                {/* Modal Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
                    <h3 className="font-bold text-slate-800 dark:text-white">Pratonton CPC (Perakuan Siap Kerja)</h3>
                    <div className="flex gap-2">
                        <button 
                            onClick={handleDownload}
                            disabled={isGenerating}
                            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-all text-sm disabled:opacity-50"
                        >
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4"/>}
                            Muat Turun PDF
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500">
                            <X className="w-5 h-5"/>
                        </button>
                    </div>
                </div>

                {/* Preview Area */}
                <div className="flex-1 overflow-y-auto bg-gray-100 p-8 flex justify-center">
                    <div id="cpc-cert-container" className="w-[210mm] min-h-[297mm] bg-white px-[20mm] pt-[10mm] pb-[20mm] shadow-lg text-black relative box-border flex flex-col" style={{ fontFamily: 'Arial, sans-serif' }}>
                        
                        {/* HEADER */}
                        <div className="text-center mb-8">
                            <h2 className="text-[14px] font-bold uppercase tracking-wide">KERAJAAN MALAYSIA</h2>
                            <h1 className="text-[16px] font-bold uppercase tracking-wide mb-6">MAJLIS PERBANDARAN SELAYANG</h1>
                            
                            <p className="text-[13px] uppercase">PERAKUAN SIAP KERJA</p>
                            <p className="text-[13px] italic">(CERTIFICATE OF PRACTICAL COMPLETION)</p>
                        </div>

                        {/* REF & ADDRESSES */}
                        <div className="flex justify-between items-start mb-8 text-[12px]">
                            <div className="w-[50%]">
                                <p>Rujukan : Bil ( &nbsp;&nbsp; ) {project.noFail}</p>
                            </div>
                            <div className="w-[45%]">
                                <p className="font-bold">Majlis Perbandaran Selayang</p>
                                <p>Persiaran 3,Bandar Baru Selayang,</p>
                                <p>68100 Batu Caves,</p>
                                <p>Selangor Darul Ehsan</p>
                            </div>
                        </div>

                        {/* RECIPIENT */}
                        <div className="flex justify-between items-start mb-6 text-[12px]">
                            <div className="w-[55%]">
                                <div className="flex">
                                    <span className="w-[60px]">Kepada :</span>
                                    <div>
                                        <p className="font-bold uppercase">{project.namaSyarikat || 'NAMA SYARIKAT'}</p>
                                        <p className="whitespace-pre-line">{companyDetails?.address || 'ALAMAT SYARIKAT...'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="w-[40%] font-bold uppercase">
                                {tarikhSiap ? formatDateMalay(tarikhSiap) : '.........................'}
                            </div>
                        </div>

                        {/* CIDB Info */}
                        <div className="mb-8 text-[12px] font-bold">
                            <p>Berdaftar dengan CIDB dalam Gred " {companyDetails?.gred || 'G1'} "</p>
                            <p>No. Sebutharga : {project.noSebutharga || '.........................'}</p>
                        </div>

                        {/* PROJECT TITLE */}
                        <div className="mb-8 text-[12px] text-justify leading-relaxed">
                            <span className="font-normal">Sebutharga Untuk :</span> <span className="font-bold uppercase">{project.namaProjek}</span>
                        </div>

                        {/* BODY */}
                        <div className="text-[12px] text-justify leading-relaxed mb-16">
                            <p className="mb-2">
                                Menurut Syarat-Syarat Kontrak, dan tertakluk kepada penyiapan berkaitan dengan pembaikan apa-apa kecacatan, ketidaksempurnaan, kesusutan atau apa-apa dan yang mungkin terzahir dalam Tempoh Tanggungan Kecacatan maka adalah dengan ini di perakui bahawa seluruh Kerja yang tersebut telah siap sejajar dengan syarat-syarat dalam Dokumen Sebut Harga pada &nbsp;
                                <span className="font-bold">{tarikhSiap ? formatDateMalay(tarikhSiap) : '...................'}</span>
                                &nbsp; dan diambil milik pada &nbsp;
                                <span className="font-bold">{dlpStart ? formatDateMalay(dlpStart) : '...................'}</span>
                                &nbsp; dan dengan itu Tempoh Tanggungan Kecacatan untuk kerja kerja tersebut bermula pada &nbsp;
                                <span className="font-bold">{dlpStart ? formatDateMalay(dlpStart) : '...................'}</span>
                                &nbsp; dan berakhir pada &nbsp;
                                <span className="font-bold">{dlpEnd ? formatDateMalay(dlpEnd) : '...................'}</span>
                            </p>
                        </div>

                        {/* SIGNATURES */}
                        <div className="flex justify-between items-end mt-auto text-[12px] font-bold">
                            <div className="w-[45%]">
                                <p className="mb-16">Diperakui di tapak,</p>
                                <div className="border-b border-black border-dashed mb-1"></div>
                                <p>(Penolong Jurutera/Penyelia Tapak)</p>
                                <p>Nama Penuh : {pjaUser?.fullName?.toUpperCase() || ''}</p>
                                <p>Jawatan : {pjaUser?.jawatan || ''}</p>
                            </div>

                            <div className="w-[45%]">
                                <p className="mb-16">Disahkan,</p>
                                <div className="border-b border-black border-dashed mb-1"></div>
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
