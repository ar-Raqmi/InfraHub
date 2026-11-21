
import React, { useState, useEffect } from 'react';
import { Project, User, formatDateMalay } from '../types';
import { apiService } from '../services/apiService';
import { CPCPDFExporter } from '../services/pdf/CPCPDFExporter';
import CertificateModal from '../components/CertificateModal';
import { dlpPeriod } from '../services/finance';
import { useOrgDocs } from '../components/org/orgDocs';
import { EXTRA_POLICY_KEYS } from '../components/org/orgDefaults';

const T = 'doc.cpc';

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

    const { docs: org, ready } = useOrgDocs(project);
    const tarikhSiap = project.tarikhSiapSebenar ? project.tarikhSiapSebenar : '';
    const { start: dlpStart, end: dlpEnd } = dlpPeriod(tarikhSiap, org.number(EXTRA_POLICY_KEYS.dlpMonths, tarikhSiap));
    const dash = '...................';
    const bodyTokens = org.tokens(T, 'body', {
        tarikh_siap: tarikhSiap ? formatDateMalay(tarikhSiap) : dash,
        tarikh_mula_dlp: dlpStart ? formatDateMalay(dlpStart) : dash,
        tarikh_tamat_dlp: dlpEnd ? formatDateMalay(dlpEnd) : dash,
    });

    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            await CPCPDFExporter.export(project, pjaUser, companyDetails, ready ? org : undefined);
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
                            <h2 className="text-[11pt] font-bold uppercase tracking-wide">{org.text(T, 'heading1')}</h2>
                            <h1 className="text-[13pt] font-bold uppercase tracking-wide mb-4" data-testid="cpc-org-heading">{org.text(T, 'heading2')}</h1>
                            
                            <p className="text-[10pt] uppercase">{org.text(T, 'title')}</p>
                            <p className="text-[9pt] italic">{org.text(T, 'subtitle')}</p>
                        </div>

                        <div className="flex justify-between items-start mb-6 text-[9pt]">
                            <div className="w-[50%]">
                                <p>Rujukan : {project.noFail || ''} ( &nbsp;&nbsp; )</p>
                            </div>
                            <div className="w-[45%]">
                                <p className="font-bold">{org.profile.name}</p>
                                {org.profile.addressLines.map((line, i) => <p key={i}>{line}</p>)}
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
                            <p className="mb-1">{org.text(T, 'cidb', { gred: companyDetails?.gred || 'G1' })}</p>
                            <p>No. Sebutharga : {project.noSebutharga || '.........................'}</p>
                        </div>

                        <div className="mb-6 text-[9pt] flex items-start">
                            <span className="font-normal w-[35mm] shrink-0">{org.text(T, 'sebuthargaLabel')}</span> 
                            <span className="font-bold uppercase text-justify leading-snug">{project.namaProjek}</span>
                        </div>

                        <div className="text-[9pt] text-justify leading-relaxed mb-12">
                            <p data-testid="cpc-body">
                                {bodyTokens.map((t, i) => (t.bold ? <span key={i} className="font-bold">{t.text}</span> : <React.Fragment key={i}>{t.text}</React.Fragment>))}
                            </p>
                        </div>

                        <div className="flex justify-between items-end mt-auto text-[9pt] font-bold">
                            <div className="w-[45%]">
                                <p className="mb-12">{org.text(T, 'signLeft')}</p>
                                <div className="border-b border-black border-dashed mb-1 w-full"></div>
                                <p>{org.text(T, 'signLeftRole')}</p>
                                <p>Nama Penuh : {pjaUser?.fullName?.toUpperCase() || ''}</p>
                                <p>Jawatan : {pjaUser?.jawatan || ''}</p>
                            </div>

                            <div className="w-[45%]">
                                <p className="mb-12">{org.text(T, 'signRight')}</p>
                                <div className="border-b border-black border-dashed mb-1 w-full"></div>
                                <p>{org.text(T, 'signRightRole')}</p>
                                <p>Nama Penuh :</p>
                                <p>Jawatan :</p>
                            </div>
                        </div>

                    </div>
        </CertificateModal>
    );
};

export default CPCCertificate;
