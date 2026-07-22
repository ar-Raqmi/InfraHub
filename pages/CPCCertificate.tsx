
import React, { useState, useEffect } from 'react';
import { Project, User, formatDateMalay } from '../types';
import { apiService } from '../services/apiService';
import { CPCPDFExporter } from '../services/pdf/CPCPDFExporter';
import CertificateModal from '../components/CertificateModal';

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
                    const details = await apiService.getCompanyDetails(year, project.namaSyarikat);
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
            await CPCPDFExporter.export(project, pjaUser, companyDetails);
        } catch (e) {
            console.error(e);
            alert("Ralat menjana PDF.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <CertificateModal
            title="Pratonton CPC (Perakuan Siap Kerja)"
            onClose={onClose}
            onDownload={handleDownload}
            isGenerating={isGenerating}
        >
                    <div id="cpc-cert-container" className="w-[210mm] min-h-[297mm] bg-white px-[25mm] pt-[20mm] pb-[20mm] shadow-lg text-black relative box-border flex flex-col leading-snug" style={{ fontFamily: 'Arial, sans-serif' }}>
                        
                        <div className="text-center mb-6">
                            <h2 className="text-[11pt] font-bold uppercase tracking-wide">KERAJAAN MALAYSIA</h2>
                            <h1 className="text-[13pt] font-bold uppercase tracking-wide mb-4">MAJLIS PERBANDARAN SELAYANG</h1>
                            
                            <p className="text-[10pt] uppercase">PERAKUAN SIAP KERJA</p>
                            <p className="text-[9pt] italic">(CERTIFICATE OF PRACTICAL COMPLETION)</p>
                        </div>

                        <div className="flex justify-between items-start mb-6 text-[9pt]">
                            <div className="w-[50%]">
                                <p>Rujukan : {project.noFail || ''} ( &nbsp;&nbsp; )</p>
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
        </CertificateModal>
    );
};

export default CPCCertificate;
