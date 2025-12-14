
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Project, formatCurrency, formatDate } from '../types';
import { mockService } from '../services/mockService';
import { Download, Loader2, X, Star, Save, Eye, ArrowLeft } from 'lucide-react';

interface PrestasiCertificateProps {
    project: Project;
    onClose: () => void;
    onUpdate?: (newScores: number[], percentage: number, skop: 'BEKALAN'|'PERKHIDMATAN'|'KERJA') => void;
}

const PrestasiCertificate: React.FC<PrestasiCertificateProps> = ({ project, onClose, onUpdate }) => {
    const [view, setView] = useState<'FORM' | 'PREVIEW'>('FORM');
    const [isGenerating, setIsGenerating] = useState(false);
    const [companyDetails, setCompanyDetails] = useState<any>(null);
    
    // Local State for Editing
    const [localScores, setLocalScores] = useState<number[]>(project.prestasiScores || [0,0,0,0,0,0]);
    const [localSkop, setLocalSkop] = useState<'BEKALAN'|'PERKHIDMATAN'|'KERJA'>(project.skop || 'BEKALAN');

    useEffect(() => {
        if (project.namaSyarikat) {
            const year = new Date(project.tarikhBuka).getFullYear();
            const details = mockService.getCompanyDetails(year, project.namaSyarikat);
            setCompanyDetails(details);
        }
    }, [project]);

    // Calculate Final Score
    const totalScore = localScores.reduce((a, b) => a + b, 0);
    const percentage = Math.ceil((totalScore / 60) * 100);

    const handleSave = () => {
        if (onUpdate) {
            onUpdate(localScores, percentage, localSkop);
        }
    };

    const handleDownload = async () => {
        setIsGenerating(true);
        setTimeout(async () => {
            const pages = document.querySelectorAll('.pdf-page');
            if (pages.length > 0) {
                const opt = {
                    margin: 0,
                    filename: `Borang_Prestasi_${project.noFail || 'Draft'}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };

                try {
                    // @ts-ignore
                    let worker = window.html2pdf().set(opt).from(pages[0]).toPdf();
                    // Add Page 2
                    if (pages[1]) {
                        worker = worker.get('pdf').then((pdf: any) => {
                            pdf.addPage();
                        }).from(pages[1]).toContainer().toCanvas().toPdf();
                    }
                    await worker.save();
                } catch (e) {
                    console.error(e);
                    alert("Ralat menjana PDF");
                } finally {
                    setIsGenerating(false);
                }
            }
        }, 100);
    };

    const updateScore = (index: number, score: number) => {
        const newArr = [...localScores];
        newArr[index] = score;
        setLocalScores(newArr);
    };

    // Helper to render the 1-10 grid
    const RatingGrid = ({ selected, onSelect }: { selected: number, onSelect?: (v: number) => void }) => {
        return (
            <div className="grid grid-cols-5 w-full border border-black text-center text-[11px] text-black dark:text-black">
                {[
                    { label: "Amat Lemah", vals: [1, 2] },
                    { label: "Lemah", vals: [3, 4] },
                    { label: "Sederhana", vals: [5, 6] },
                    { label: "Baik", vals: [7, 8] },
                    { label: "Amat Baik", vals: [9, 10] },
                ].map((group, idx) => (
                    <div key={idx} className="flex flex-col border-r border-black last:border-r-0">
                        <div className="bg-transparent py-1 border-b border-black font-semibold text-black dark:text-black">
                            {group.label}
                        </div>
                        <div className="flex h-8">
                            {group.vals.map((val, vIdx) => (
                                <div 
                                    key={val} 
                                    onClick={() => onSelect && onSelect(val)}
                                    className={`flex-1 flex items-center justify-center border-r border-black last:border-r-0 cursor-pointer hover:bg-gray-100 ${val === selected ? 'font-black bg-gray-200 text-[14px]' : ''}`}
                                >
                                    <span className="text-black dark:text-black">{val}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // Header Component
    const Header = () => (
        <div className="flex flex-col items-center mb-6 text-black dark:text-black">
            <img 
                src="https://upload.wikimedia.org/wikipedia/commons/6/6e/Selayang_Seal.png" 
                alt="MPS Logo" 
                className="h-[80px] object-contain mb-2"
            />
            <h1 className="text-[16px] font-bold uppercase font-sans text-center leading-tight text-black dark:text-black">
                BORANG PRESTASI KONTRAKTOR / PEMBEKAL
            </h1>
        </div>
    );

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" style={{ zIndex: 9999 }}>
            <div className={`bg-white dark:bg-slate-900 w-full rounded-3xl flex flex-col shadow-2xl overflow-hidden relative animate-slide-up transition-all duration-300 ${view === 'PREVIEW' ? 'max-w-[230mm] h-[95vh]' : 'max-w-4xl h-[90vh]'}`}>
                
                {/* Modal Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
                    <div className="flex items-center gap-3">
                        {view === 'PREVIEW' && (
                            <button onClick={() => setView('FORM')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300"/>
                            </button>
                        )}
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            {view === 'FORM' ? <><Star className="w-5 h-5 text-violet-500" /> Penilaian Prestasi</> : 'Pratonton Borang'}
                        </h3>
                    </div>
                    <div className="flex gap-2">
                        {view === 'FORM' ? (
                            <>
                                <button 
                                    onClick={() => { handleSave(); setView('PREVIEW'); }}
                                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold transition-all text-sm shadow-md"
                                >
                                    <Eye className="w-4 h-4"/>
                                    Pratonton
                                </button>
                                <button 
                                    onClick={() => { handleSave(); onClose(); }}
                                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold transition-all text-sm shadow-md"
                                >
                                    <Save className="w-4 h-4"/>
                                    Simpan & Tutup
                                </button>
                            </>
                        ) : (
                            <button 
                                onClick={handleDownload}
                                disabled={isGenerating}
                                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-all text-sm disabled:opacity-50"
                            >
                                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4"/>}
                                Muat Turun PDF
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500">
                            <X className="w-5 h-5"/>
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900/50 p-6 flex flex-col items-center">
                    
                    {/* FORM VIEW */}
                    {view === 'FORM' && (
                        <div className="w-full max-w-3xl space-y-6">
                            
                            {/* Header Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Skor Semasa</div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black text-violet-600 dark:text-violet-400">{totalScore}</span>
                                        <span className="text-slate-400 font-bold">/ 60</span>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Prestasi (%)</div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{percentage}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Scope Selector */}
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                                <h4 className="font-bold text-slate-900 dark:text-white mb-4 text-sm uppercase tracking-wide">Skop Perkhidmatan</h4>
                                <div className="flex flex-wrap gap-4">
                                    {['BEKALAN', 'PERKHIDMATAN', 'KERJA'].map((scope) => (
                                        <label key={scope} className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${localSkop === scope ? 'bg-violet-50 border-violet-500 ring-1 ring-violet-500 dark:bg-violet-900/20' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                            <input 
                                                type="radio" 
                                                name="skop" 
                                                value={scope} 
                                                checked={localSkop === scope}
                                                onChange={() => setLocalSkop(scope as any)}
                                                className="hidden"
                                            />
                                            <span className={`font-bold text-sm ${localSkop === scope ? 'text-violet-700 dark:text-violet-300' : 'text-slate-600 dark:text-slate-400'}`}>{scope}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Questions */}
                            <div className="space-y-4">
                                {[
                                    "Keupayaan kontraktor/ pembekal memenuhi permintaan dari segi harga berbanding kontraktor/ pembekal lain.",
                                    "Keupayaan kontraktor/ pembekal untuk membekalkan barangan /perkhidmatan/kerja mengikut spesifikasi yang ditetapkan.",
                                    "Keupayaan kontraktor/ pembekal untuk membekalkan barangan/ perkhidmatan dalam jangkamasa yang ditetapkan.",
                                    "Keupayaan kontraktor/ pembekal untuk membuat tindakan pembetulan sekiranya barangan/ perkhidmatan yang dibekalkan tidak memenuhi spesifikasi yang ditetapkan.",
                                    "Penilaian terhadap kontraktor/pembekal dari segi sikap dan kerjasama yang ditunjukkan oleh kontraktor/pembekal.",
                                    "Kekemasan dan kebersihan semasa dan selepas melaksanakan kerja / penghantaran bekalan."
                                ].map((q, idx) => (
                                    <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                                        <div className="flex gap-4 mb-4">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 shrink-0">{idx + 1}</div>
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed pt-1">{q}</p>
                                        </div>
                                        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                                            {[1,2,3,4,5,6,7,8,9,10].map(score => (
                                                <button
                                                    key={score}
                                                    onClick={() => updateScore(idx, score)}
                                                    className={`h-10 rounded-lg font-bold text-sm transition-all border ${
                                                        localScores[idx] === score 
                                                        ? 'bg-violet-600 text-white border-violet-600 shadow-lg transform scale-110' 
                                                        : 'bg-slate-50 dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-violet-300'
                                                    }`}
                                                >
                                                    {score}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PREVIEW VIEW */}
                    {view === 'PREVIEW' && (
                        <div className="flex flex-col items-center gap-8 animate-fade-in">
                            {/* PAGE 1 */}
                            <div className="w-[210mm] h-[296mm] bg-white p-[20mm] shadow-lg text-black dark:text-black font-sans leading-snug relative box-border pdf-page overflow-hidden">
                                <Header />

                                {/* A. MAKLUMAT AM */}
                                <div className="mb-6">
                                    <h3 className="font-bold text-[12px] uppercase mb-2 text-black dark:text-black">A. MAKLUMAT AM</h3>
                                    <table className="w-full border-collapse border border-black text-[11px] text-black dark:text-black">
                                        <tbody>
                                            <tr>
                                                <td className="border border-black p-2 w-[30%]">Nama Pembekal/Kontraktor :</td>
                                                <td className="border border-black p-2 font-bold uppercase text-[12px] text-black dark:text-black">{project.namaSyarikat}</td>
                                            </tr>
                                            <tr>
                                                <td className="border border-black p-2">Nombor Pembekal / Kontraktor :</td>
                                                <td className="border border-black p-2 uppercase text-black dark:text-black">{companyDetails?.registrationNumber || ''}</td>
                                            </tr>
                                            <tr>
                                                <td className="border border-black p-2">Skop Pembekal/Kontraktor :</td>
                                                <td className="border border-black p-2 uppercase text-black dark:text-black">
                                                    <span className={localSkop === 'BEKALAN' ? 'font-bold underline' : ''}>BEKALAN</span> / &nbsp;
                                                    <span className={localSkop === 'PERKHIDMATAN' ? 'font-bold underline' : ''}>PERKHIDMATAN</span> / &nbsp;
                                                    <span className={localSkop === 'KERJA' ? 'font-bold underline' : ''}>KERJA</span>
                                                    <span className="float-right italic text-[10px] lowercase">(Potong yang tidak berkenaan)</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="border border-black p-2 align-top">Tajuk Tawaran:</td>
                                                <td className="border border-black p-2 uppercase text-justify leading-tight text-black dark:text-black">{project.namaProjek}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    <table className="w-full border-collapse border-x border-b border-black text-[11px] text-black dark:text-black">
                                        <tbody>
                                            <tr>
                                                <td className="border border-black p-2 w-[30%]">No. Pesanan Rasmi :</td>
                                                <td className="border border-black p-2 w-[25%] uppercase text-black dark:text-black">{project.noInden || '-'}</td>
                                                <td className="border border-black p-2 w-[20%]">Kos (RM) :</td>
                                                <td className="border border-black p-2 w-[25%] text-black dark:text-black">{project.kosProjek ? formatCurrency(project.kosProjek).replace('RM', '') : ''}</td>
                                            </tr>
                                            <tr>
                                                <td className="border border-black p-2">Tarikh Mula Kerja /Pesanan :</td>
                                                <td className="border border-black p-2 text-black dark:text-black">{project.tarikhMulaKerja ? formatDate(project.tarikhMulaKerja) : ''}</td>
                                                <td className="border border-black p-2">Tarikh siap kerja / Terima Pesanan :</td>
                                                <td className="border border-black p-2 text-black dark:text-black">{project.tarikhSiapSebenar ? formatDate(project.tarikhSiapSebenar) : ''}</td>
                                            </tr>
                                            <tr>
                                                <td className="border border-black p-2">Lanjutan Masa (Sehingga) :</td>
                                                <td className="border border-black p-2">-</td>
                                                <td className="border border-black p-2">No. Inbois :</td>
                                                <td className="border border-black p-2 uppercase text-black dark:text-black">{project.noBpp || ''}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* B. MAKLUMAT PENILAIAN PRESTASI (1-4) */}
                                <div>
                                    <h3 className="font-bold text-[12px] uppercase mb-4 text-black dark:text-black">B. MAKLUMAT PENILAIAN PRESTASI</h3>
                                    <div className="border border-black p-4 space-y-6">
                                        <div className="flex gap-4">
                                            <div className="text-[12px] w-[15px] text-black dark:text-black">1.</div>
                                            <div className="flex-1">
                                                <p className="text-[11px] mb-2 leading-tight text-justify text-black dark:text-black">Keupayaan kontraktor/ pembekal memenuhi permintaan dari segi harga berbanding kontraktor/ pembekal lain.</p>
                                                <RatingGrid selected={localScores[0]} />
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="text-[12px] w-[15px] text-black dark:text-black">2.</div>
                                            <div className="flex-1">
                                                <p className="text-[11px] mb-2 leading-tight text-justify text-black dark:text-black">Keupayaan kontraktor/ pembekal untuk membekalkan barangan /perkhidmatan/kerja mengikut spesifikasi yang ditetapkan.</p>
                                                <RatingGrid selected={localScores[1]} />
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="text-[12px] w-[15px] text-black dark:text-black">3.</div>
                                            <div className="flex-1">
                                                <p className="text-[11px] mb-2 leading-tight text-justify text-black dark:text-black">Keupayaan kontraktor/ pembekal untuk membekalkan barangan/ perkhidmatan dalam jangkamasa yang ditetapkan.</p>
                                                <RatingGrid selected={localScores[2]} />
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="text-[12px] w-[15px] text-black dark:text-black">4.</div>
                                            <div className="flex-1">
                                                <p className="text-[11px] mb-2 leading-tight text-justify text-black dark:text-black">Keupayaan kontraktor/ pembekal untuk membuat tindakan pembetulan sekiranya barangan/ perkhidmatan yang dibekalkan tidak memenuhi spesifikasi yang ditetapkan.</p>
                                                <RatingGrid selected={localScores[3]} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* PAGE 2 */}
                            <div className="w-[210mm] h-[296mm] bg-white p-[20mm] shadow-lg text-black dark:text-black font-sans leading-snug relative box-border pdf-page overflow-hidden">
                                <div className="mb-6">
                                    <div className="border border-black p-4 space-y-6">
                                        <div className="flex gap-4">
                                            <div className="text-[12px] w-[15px] text-black dark:text-black">5.</div>
                                            <div className="flex-1">
                                                <p className="text-[11px] mb-2 leading-tight text-justify text-black dark:text-black">Penilaian terhadap kontraktor/pembekal dari segi sikap dan kerjasama yang ditunjukkan oleh kontraktor/pembekal.</p>
                                                <RatingGrid selected={localScores[4]} />
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="text-[12px] w-[15px] text-black dark:text-black">6.</div>
                                            <div className="flex-1">
                                                <p className="text-[11px] mb-2 leading-tight text-justify text-black dark:text-black">Kekemasan dan kebersihan semasa dan selepas melaksanakan kerja / penghantaran bekalan.</p>
                                                <RatingGrid selected={localScores[5]} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-8">
                                    <h3 className="font-bold text-[12px] uppercase mb-2 text-black dark:text-black">C. MARKAH PRESTASI KONTRAKTOR DAN PEMBEKAL</h3>
                                    <div className="border border-black p-4 flex gap-8 items-start text-[12px] text-black dark:text-black">
                                        <div className="flex-1">
                                            <p className="font-bold mb-4">Purata Prestasi Kontraktor/Pembekal</p>
                                            <div className="flex items-center gap-2 text-[14px]">
                                                <span>=</span>
                                                <div className="flex flex-col items-center">
                                                    <div className="border-b border-black w-full text-center px-2">{totalScore}</div>
                                                    <div>60</div>
                                                </div>
                                                <span>X 100% =</span>
                                                <div className="font-bold underline text-[16px] px-4">{percentage}</div>
                                                <span>%</span>
                                            </div>
                                        </div>
                                        <div className="w-[45%]">
                                            <p className="font-bold mb-2">Skala Penilaian:-</p>
                                            <div className="grid grid-cols-[80px_20px_1fr] gap-y-1">
                                                <div className="text-right">0 - 20%</div><div className="text-center">=</div><div>Amat Lemah</div>
                                                <div className="text-right">21 - 40%</div><div className="text-center">=</div><div>Lemah</div>
                                                <div className="text-right">41 - 60%</div><div className="text-center">=</div><div>Sederhana</div>
                                                <div className="text-right">61 - 80%</div><div className="text-center">=</div><div>Baik</div>
                                                <div className="text-right">81 - 100%</div><div className="text-center">=</div><div>Amat Baik</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 text-[12px] text-black dark:text-black">
                                    <div>
                                        <div className="bg-gray-200 border border-black p-1 text-center font-bold uppercase mb-8 text-black dark:text-black">PENGESAHAN PEGAWAI PENYELIA TAPAK / PENERIMA BEKALAN</div>
                                        <div className="px-4"><p className="mb-8">Tandatangan:</p><p>Tarikh:</p></div>
                                    </div>
                                    <div>
                                        <div className="bg-gray-200 border border-black p-1 text-center font-bold uppercase mb-8 text-black dark:text-black">PENGESAHAN PEGAWAI / JURUTERA</div>
                                        <div className="px-4"><p className="mb-8">Tandatangan:</p><p>Tarikh:</p></div>
                                    </div>
                                    <div>
                                        <div className="bg-gray-200 border border-black p-1 text-center font-bold uppercase mb-8 text-black dark:text-black">PERAKUAN PENGARAH JABATAN - <span className="normal-case italic font-normal">Maklumat telah dikemaskini di dalam sistem.</span></div>
                                        <div className="px-4"><p className="mb-8">Tandatangan:</p><p>Tarikh:</p></div>
                                    </div>
                                </div>

                                <div className="mt-auto pt-4 border-t-4 border-black text-[10px] text-black dark:text-black">
                                    Sila hantar salinan borang ini ke : &nbsp;&nbsp; Bahagian Perolehan, Majlis Perbandaran selayang
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default PrestasiCertificate;
