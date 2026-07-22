
import React, { useState } from 'react';
import { Project, User, formatCurrency, formatDate } from '../types';
import { LADPDFExporter } from '../services/pdf/LADPDFExporter';
import CertificateModal from '../components/CertificateModal';

interface LADCertificateProps {
    project: Project;
    pjaUser?: User;
    onClose: () => void;
}

const LADCertificate: React.FC<LADCertificateProps> = ({ project, pjaUser, onClose }) => {
    const [isGenerating, setIsGenerating] = useState(false);

    // --- Calculation Logic ---
    const contractSum = project.kosProjek || 0;
    const isSmallProject = contractSum < 20000;
    
    // BLR Constants based on image (6.65 - 0.25 = 6.4)
    const BLR = 6.65;
    const treasuryRate = 0.25;
    const effectiveRate = BLR - treasuryRate; // 6.4

    // Daily Rate
    let dailyRate = 0;
    if (isSmallProject) {
        dailyRate = 20.00;
    } else {
        dailyRate = Math.round(((contractSum * (effectiveRate / 100)) / 365 + Number.EPSILON) * 100) / 100;
    }

    // Days
    const daysLate = project.ladDays || 0;
    const totalLAD = Math.round((dailyRate * daysLate + Number.EPSILON) * 100) / 100;

    // Helper to format number to 2 decimals
    const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            await LADPDFExporter.export(project);
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

    return (
        <CertificateModal
            title="Pratonton Perakuan LAD"
            onClose={onClose}
            onDownload={handleDownload}
            isGenerating={isGenerating}
        >
                    <div className="w-[210mm] min-h-[297mm] bg-white p-[20mm] shadow-lg text-black font-sans leading-snug relative box-border">
                        
                        {/* Title */}
                        <div className="mb-8">
                            <div className="flex items-start text-[11px] font-bold mb-4">
                                <span className="w-[90px] shrink-0 uppercase">TAJUK KERJA :</span>
                                <span className="uppercase leading-tight">{project.namaProjek}</span>
                            </div>
                            <div className="underline font-bold text-[12px] uppercase mb-6">
                                DENDA KELEWATAN MENYIAPKAN KERJA
                            </div>
                        </div>

                        {/* Section 1: Info */}
                        <div className="mb-8">
                            <LabelRow label="KONTRAKTOR" value={project.namaSyarikat || '-'} boldValue />
                            <LabelRow label="KOS PROJEK" value={<span className="border border-black px-2 py-0.5 inline-block min-w-[100px]">{formatCurrency(contractSum)}</span>} />
                            <LabelRow label="NO FAIL" value={project.noFail} />
                            <LabelRow label="ADUN/ ZON" value={`${project.bp || ''} / ${project.zon || ''}`} />
                            <LabelRow label="MUKIM" value={project.mukim || '-'} />
                        </div>

                        {/* Section 2: Dates */}
                        <div className="mb-12">
                            <LabelRow label="TARIKH MILIK TAPAK BINA" value={formatDate(project.tarikhSerahTapak)} />
                            <LabelRow label="TARIKH SIAP KERJA" value={formatDate(project.tarikhTamatKontrak)} />
                            <LabelRow label="TEMPOH KERJA" value={<div className="flex items-center gap-2"><span className="border border-black px-4 py-0.5 inline-block">{project.tempohKontrak?.replace(/\D/g,'') || '0'}</span> <span>MINGGU</span></div>} />
                            <br/>
                            <LabelRow label="TARIKH SURAT PERMOHONAN EOT" value="-" />
                            <LabelRow label="NO RUJUKAN" value="-" />
                            <br/>
                            <LabelRow label="TAMBAHAN TEMPOH EOT" value={<div className="flex items-center gap-2"><span className="border border-black px-4 py-0.5 inline-block min-w-[60px] h-[22px]"></span> <span>MINGGU/HARI</span></div>} />
                            <br/><br/>
                            <LabelRow label="TARIKH TAMAT TEMPOH EOT" value="-" />
                            <br/>
                            <LabelRow label="TARIKH MULA L.A.D" value={project.tarikhTamatKontrak ? formatDate(project.tarikhTamatKontrak) : '-'} />
                            <LabelRow label="TARIKH SIAP KERJA SEBENAR DI TAPAK" value={project.tarikhSiapSebenar ? formatDate(project.tarikhSiapSebenar) : '-'} />
                            <LabelRow label="TEMPOH KELEWATAN KERJA SELEPAS EOT" value={<div className="flex items-center gap-2"><span className="border border-black px-4 py-0.5 inline-block min-w-[60px] text-center">{Math.max(0, daysLate)}</span> <span>HARI</span></div>} />
                        </div>

                        {/* Section 3: Calculation Box */}
                        <div className="border-2 border-black p-6 font-bold text-[12px] mb-8">
                            <div className="mb-6 italic font-normal">
                                {isSmallProject 
                                    ?"Bagi Kontrak bernilai kurang RM 20,000.00, kadar Denda (LAD) adalah RM 20.00/hari rata."
                                    : `BLR ${BLR} ( Maklumat daripada Bahagian Perolehan )`
                                }
                            </div>

                            {/* Formula Display */}
                            {!isSmallProject && (
                                <div className="flex items-center justify-center gap-4 mb-8 text-[14px]">
                                    <div className="flex flex-col items-center">
                                        <div className="border-b border-black w-full text-center px-2">{effectiveRate.toFixed(1)}</div>
                                        <div>365</div>
                                    </div>
                                    <div>=</div>
                                    <div>{Number((effectiveRate / 365).toFixed(6))}</div>
                                </div>
                            )}

                            {/* The Calculation Line */}
                            {!isSmallProject ? (
                                <div className="flex flex-wrap items-center gap-4 mb-8 justify-center">
                                    <div className="flex flex-col items-center">
                                        <div className="border-b border-black w-full text-center px-2">{Number((effectiveRate/365/100).toFixed(6))}</div>
                                        <div>100</div>
                                    </div>
                                    <div>X</div>
                                    <div>RM</div>
                                    <div className="border border-black px-2 py-1 min-w-[100px] text-right">{fmt(contractSum)}</div>
                                    <div>=</div>
                                    <div>RM</div>
                                    <div className="w-[80px] text-right">{fmt(dailyRate)}</div>
                                    <div>/ HARI</div>
                                </div>
                            ) : (
                                <div className="text-center mb-8">
                                    KADAR DENDA (LAD) = RM 20.00 / HARI
                                </div>
                            )}

                            {/* Final Total Line */}
                            <div className="flex items-center justify-center gap-6 text-[14px]">
                                <div className="border border-black px-4 py-2 min-w-[80px] text-center bg-white">{daysLate}</div>
                                <div>HARI</div>
                                <div>X</div>
                                <div>RM</div>
                                <div className="text-right">{fmt(dailyRate)} / HARI</div>
                            </div>

                            <div className="mt-8 flex items-center gap-8 pl-10 text-[16px]">
                                <div>RM</div>
                                <div className="font-black text-[18px]">{fmt(totalLAD)}</div>
                            </div>
                        </div>

                    </div>
        </CertificateModal>
    );
};

export default LADCertificate;
