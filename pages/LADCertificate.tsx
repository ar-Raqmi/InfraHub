
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Project, User, formatCurrency, formatDate } from '../types';
import { Download, Loader2, X } from 'lucide-react';

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
        dailyRate = (contractSum * (effectiveRate / 100)) / 365;
    }

    // Days
    const daysLate = project.ladDays || 0;
    const totalLAD = dailyRate * daysLate;

    // Helper to format number to 2 decimals
    const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            // @ts-ignore
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');
            
            const margin = 20;
            const pageWidth = 210;
            const contentWidth = pageWidth - (margin * 2); // 170mm
            let y = 20;

            // --- TITLE ---
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            
            doc.text("TAJUK KERJA :", margin, y);
            
            doc.setFontSize(9);
            // Project Name wraps if too long
            const titleLines = doc.splitTextToSize(project.namaProjek.toUpperCase(), contentWidth - 30);
            doc.text(titleLines, margin + 30, y);
            y += (titleLines.length * 5) + 8; // Adjust spacing based on lines

            doc.setFontSize(10);
            const subTitle = "DENDA KELEWATAN MENYIAPKAN KERJA";
            doc.text(subTitle, margin, y);
            const textWidth = doc.getTextWidth(subTitle);
            doc.setLineWidth(0.3);
            doc.line(margin, y + 1, margin + textWidth, y + 1); // Underline
            y += 12;

            // --- INFO SECTION ---
            const labelX = margin;
            const colonX = margin + 80; // Increased width for long labels
            const valueX = margin + 83; // Adjusted value start
            const lineHeight = 7; // Increased line height for spacing

            const drawRow = (label: string, value: string, bold = false, boxed = false) => {
                doc.setFont("helvetica", "normal");
                doc.setFontSize(9);
                doc.text(label, labelX, y);
                doc.text(":", colonX, y);
                
                doc.setFont("helvetica", bold ? "bold" : "normal");
                if (boxed) {
                    const w = doc.getTextWidth(value) + 6;
                    doc.setDrawColor(0);
                    doc.setLineWidth(0.1);
                    doc.rect(valueX, y - 4, w, 5.5);
                    doc.text(value, valueX + 3, y);
                } else {
                    const lines = doc.splitTextToSize(value, pageWidth - valueX - margin);
                    doc.text(lines, valueX, y);
                    if (lines.length > 1) {
                        y += (lines.length - 1) * 5;
                    }
                }
                y += lineHeight;
            };

            drawRow("KONTRAKTOR", project.namaSyarikat?.toUpperCase() || '-', true);
            drawRow("KOS PROJEK", formatCurrency(contractSum), false, true);
            drawRow("NO FAIL", project.noFail || '-');
            drawRow("ADUN/ ZON", `${project.bp || ''} / ${project.zon || ''}`);
            drawRow("MUKIM", "BATU");
            
            y += 5; // Spacer

            // --- DATES SECTION ---
            drawRow("TARIKH MILIK TAPAK BINA", formatDate(project.tarikhSerahTapak));
            drawRow("TARIKH SIAP KERJA", formatDate(project.tarikhTamatKontrak));
            
            // TEMPOH KERJA (Custom Layout)
            const tempohNum = project.tempohKontrak?.replace(/\D/g,'') || '0';
            doc.setFont("helvetica", "normal");
            doc.text("TEMPOH KERJA", labelX, y);
            doc.text(":", colonX, y);
            const tW = doc.getTextWidth(tempohNum) + 10;
            doc.setLineWidth(0.1);
            doc.rect(valueX, y - 4, tW, 5.5);
            doc.text(tempohNum, valueX + 5, y, { align: 'center' }); // Centered in box
            doc.text("MINGGU", valueX + tW + 3, y);
            y += lineHeight;

            y += 2;
            drawRow("TARIKH SURAT PERMOHONAN EOT", "-");
            drawRow("NO RUJUKAN", "-");
            y += 2;

            // EOT (Empty Box)
            doc.setFont("helvetica", "normal");
            doc.text("TAMBAHAN TEMPOH EOT", labelX, y);
            doc.text(":", colonX, y);
            doc.rect(valueX, y - 4, 20, 5.5); // Empty box
            doc.text("MINGGU/HARI", valueX + 23, y);
            y += lineHeight + 3;

            drawRow("TARIKH TAMAT TEMPOH EOT", "-");
            y += 2;
            drawRow("TARIKH MULA L.A.D", project.tarikhTamatKontrak ? formatDate(project.tarikhTamatKontrak) : '-');
            drawRow("TARIKH SIAP KERJA SEBENAR DI TAPAK", project.tarikhSiapSebenar ? formatDate(project.tarikhSiapSebenar) : '-');
            
            // KELEWATAN
            const lateDays = Math.max(0, daysLate).toString();
            doc.setFont("helvetica", "normal");
            doc.text("TEMPOH KELEWATAN KERJA SELEPAS EOT", labelX, y);
            doc.text(":", colonX, y);
            const lW = doc.getTextWidth(lateDays) + 10;
            doc.rect(valueX, y - 4, lW, 5.5);
            doc.text(lateDays, valueX + (lW/2), y, { align: 'center' });
            doc.text("HARI", valueX + lW + 3, y);
            y += lineHeight + 8;

            // --- CALCULATION BOX ---
            const boxTopY = y;
            const boxPadding = 5;
            let boxY = y + boxPadding + 3;

            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");

            const note = isSmallProject 
                ? "Bagi Kontrak bernilai kurang RM 20,000.00, kadar Denda (LAD) adalah RM 20.00/hari rata."
                : `BLR ${BLR} ( Maklumat daripada Bahagian Perolehan )`;
            doc.text(note, margin + boxPadding, boxY);
            boxY += 12;

            const centerX = pageWidth / 2;

            if (!isSmallProject) {
                // Formula: Rate / 365
                const rateStr = effectiveRate.toFixed(1);
                // Center the formula roughly
                const fX = centerX - 30;
                
                doc.text(rateStr, fX, boxY);
                doc.setLineWidth(0.2);
                const rW = doc.getTextWidth(rateStr);
                doc.line(fX - 2, boxY + 1, fX + rW + 2, boxY + 1); // Divider
                doc.text("365", fX, boxY + 5);
                
                doc.text("=", fX + 15, boxY + 3);
                doc.text(Number((effectiveRate / 365).toFixed(6)).toString(), fX + 20, boxY + 3);
                
                boxY += 15;

                // Big Calc Line
                const factorStr = Number((effectiveRate/365/100).toFixed(6)).toString();
                const factorW = doc.getTextWidth(factorStr);
                
                let cX = margin + boxPadding + 10;
                
                // Fraction
                doc.text(factorStr, cX, boxY);
                doc.line(cX - 1, boxY + 1, cX + factorW + 1, boxY + 1);
                doc.text("100", cX + (factorW/2) - 3, boxY + 5);
                
                cX += factorW + 10;
                doc.text("X", cX, boxY + 3);
                cX += 8;
                doc.text("RM", cX, boxY + 3);
                cX += 8;
                
                const cSum = fmt(contractSum);
                const csW = doc.getTextWidth(cSum) + 4;
                doc.setLineWidth(0.1);
                doc.rect(cX, boxY - 4, csW, 6);
                doc.text(cSum, cX + 2, boxY);
                
                cX += csW + 5;
                doc.text("=", cX, boxY + 3);
                cX += 8;
                doc.text("RM", cX, boxY + 3);
                cX += 8;
                const dRate = fmt(dailyRate);
                doc.text(dRate, cX, boxY + 3);
                cX += doc.getTextWidth(dRate) + 3;
                doc.text("/ HARI", cX, boxY + 3);

                boxY += 15;
            } else {
                doc.setFont("helvetica", "bold");
                doc.text("KADAR DENDA (LAD) = RM 20.00 / HARI", centerX, boxY, { align: 'center' });
                boxY += 15;
            }

            // Final Calculation: Days x Rate = Total
            // Center the final formula visually
            const dStr = daysLate.toString();
            const dW = doc.getTextWidth(dStr) + 10;
            
            // Estimate total width to center
            const rateTxt = fmt(dailyRate) + " / HARI";
            const estWidth = dW + 3 + 10 + 5 + 5 + 8 + doc.getTextWidth(rateTxt);
            let startX = (pageWidth - estWidth) / 2;

            doc.setFont("helvetica", "bold");
            doc.setLineWidth(0.1);
            doc.rect(startX, boxY - 4, dW, 6);
            doc.text(dStr, startX + (dW/2), boxY, { align: 'center' });
            
            startX += dW + 3;
            doc.text("HARI", startX, boxY);
            startX += 15;
            doc.text("X", startX, boxY);
            startX += 8;
            doc.text("RM", startX, boxY);
            startX += 8;
            doc.text(rateTxt, startX, boxY);
            
            boxY += 15;

            // TOTAL LAD
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            const finalRM = "RM";
            const finalVal = fmt(totalLAD);
            
            // Indent from left margin + padding
            doc.text(finalRM, margin + 20, boxY);
            doc.text(finalVal, margin + 35, boxY);
            
            boxY += 8; // Padding bottom

            // Draw Box Border
            doc.setLineWidth(0.5);
            doc.rect(margin, boxTopY, contentWidth, boxY - boxTopY);

            // Save
            doc.save(`Perakuan_LAD_${project.noFail || 'Draft'}.pdf`);

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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" style={{ zIndex: 9999 }}>
            <div className="bg-white dark:bg-slate-900 w-full max-w-[230mm] h-[95vh] rounded-3xl flex flex-col shadow-2xl overflow-hidden relative animate-slide-up">
                
                {/* Modal Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
                    <h3 className="font-bold text-slate-800 dark:text-white">Pratonton Perakuan LAD</h3>
                    <div className="flex gap-2">
                        <button 
                            onClick={handleDownload}
                            disabled={isGenerating}
                            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-all text-sm disabled:opacity-50"
                        >
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4"/>}
                            PDF
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500">
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
                                DENDA KELEWATAN MENYIAPKAN KERJA
                            </div>
                        </div>

                        {/* Section 1: Info */}
                        <div className="mb-8">
                            <LabelRow label="KONTRAKTOR" value={project.namaSyarikat || '-'} boldValue />
                            <LabelRow label="KOS PROJEK" value={<span className="border border-black px-2 py-0.5 inline-block min-w-[100px]">{formatCurrency(contractSum)}</span>} />
                            <LabelRow label="NO FAIL" value={project.noFail} />
                            <LabelRow label="ADUN/ ZON" value={`${project.bp || ''} / ${project.zon || ''}`} />
                            <LabelRow label="MUKIM" value="BATU" />
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
                                    ? "Bagi Kontrak bernilai kurang RM 20,000.00, kadar Denda (LAD) adalah RM 20.00/hari rata."
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
                </div>
            </div>
        </div>,
        document.body
    );
};

export default LADCertificate;
