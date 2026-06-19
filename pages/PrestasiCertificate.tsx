import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Project, formatCurrency, formatDate } from '../types';
import { apiService } from '../services/apiService';
import { Download, Loader2, X, Star, Save, Eye, ArrowLeft, AlertCircle } from 'lucide-react';
import { PrestasiPDFExporter } from '../services/pdf/PrestasiPDFExporter';

interface PrestasiCertificateProps {
    project: Project;
    onClose: () => void;
    onUpdate?: (newScores: number[], percentage: number, skop: 'BEKALAN' | 'PERKHIDMATAN' | 'KERJA', noInbois: string) => void;
}

const getBase64ImageFromURL = (url: string): Promise<string | null> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL("image/png"));
            } else {
                resolve(null);
            }
        };
        img.onerror = () => {
            resolve(null);
        };
        img.src = url;
    });
};

const PrestasiCertificate: React.FC<PrestasiCertificateProps> = ({ project, onClose, onUpdate }) => {
    const [view, setView] = useState<'FORM' | 'PREVIEW'>('FORM');
    const [isGenerating, setIsGenerating] = useState(false);
    const [companyDetails, setCompanyDetails] = useState<any>(null);

    const [localScores, setLocalScores] = useState<number[]>(project.prestasiScores || [0, 0, 0, 0, 0, 0]);
    const [localSkop, setLocalSkop] = useState<'BEKALAN' | 'PERKHIDMATAN' | 'KERJA' | null>((project.skop as any) || null);
    const [showErrors, setShowErrors] = useState(false);

    const skopRef = useRef<HTMLDivElement>(null);
    const scoreRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        scoreRefs.current = scoreRefs.current.slice(0, 6);
    }, []);


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

    const totalScore = localScores.reduce((a, b) => a + b, 0);
    const percentage = Math.ceil((totalScore / 60) * 100);

    const handleSave = () => {
        if (onUpdate) {
            onUpdate(localScores, percentage, (localSkop as any) || 'BEKALAN', project.noInbois || '');
        }
    };

    const handlePratonton = () => {
        const hasInvoiceError = !project.noInbois?.trim();
        const hasSkopError = !localSkop;
        const hasScoreErrors = localScores.some(score => score === 0);

        if (hasInvoiceError || hasSkopError || hasScoreErrors) {
            setShowErrors(true);

            // Auto-scroll to first error
            if (hasInvoiceError) {
                if (hasSkopError) {
                    skopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else if (hasScoreErrors) {
                    const firstScoreErrorIdx = localScores.findIndex(score => score === 0);
                    scoreRefs.current[firstScoreErrorIdx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            } else if (hasSkopError) {
                skopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                const firstScoreErrorIdx = localScores.findIndex(score => score === 0);
                if (firstScoreErrorIdx !== -1) {
                    scoreRefs.current[firstScoreErrorIdx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
            return;
        }

        handleSave();
        setView('PREVIEW');
    };

    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            await PrestasiPDFExporter.export(project, localScores, localSkop, companyDetails);
        } catch (e) {
            console.error(e);
            alert("Ralat menjana PDF");
        } finally {
            setIsGenerating(false);
        }
    };

    const updateScore = (index: number, score: number) => {
        const newArr = [...localScores];
        newArr[index] = score;
        setLocalScores(newArr);
    };

    const RatingGrid = ({ selected }: { selected: number }) => (
        <div className="flex w-full border border-black text-[10px] h-[35px]">
            {[
                { label: "Amat Lemah", vals: [1, 2] },
                { label: "Lemah", vals: [3, 4] },
                { label: "Sederhana", vals: [5, 6] },
                { label: "Baik", vals: [7, 8] },
                { label: "Amat Baik", vals: [9, 10] },
            ].map((group, idx) => (
                <div key={idx} className="flex-1 flex flex-col border-r border-black last:border-r-0">
                    <div className="text-center h-[18px] flex items-center justify-center border-b border-black leading-none pt-0.5">
                        {group.label}
                    </div>
                    <div className="flex-1 flex">
                        {group.vals.map((val) => (
                            <div
                                key={val}
                                className={`flex-1 flex items-center justify-center border-r border-black last:border-r-0 text-[11px] ${val === selected ? 'bg-black text-white font-bold' : ''}`}
                            >
                                {val}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );

    const QuestionRow = ({ num, text, score }: { num: number, text: string, score: number }) => (
        <div className="flex gap-4 mb-4">
            <div className="text-[12px] w-[15px] font-medium text-black">{num}.</div>
            <div className="flex-1">
                <p className="text-[11px] mb-1.5 leading-tight text-justify text-black">{text}</p>
                <RatingGrid selected={score} />
            </div>
        </div>
    );

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60  animate-fade-in" style={{ zIndex: 9999 }}>
            <div className={`bg-white  w-full rounded-3xl flex flex-col shadow-2xl overflow-hidden relative animate-slide-up transition-colors duration-300 ${view === 'PREVIEW' ? 'max-w-[230mm] h-[95vh]' : 'max-w-4xl h-[90vh]'}`}>

                <div className="p-4 border-b border-slate-200  flex justify-between items-center bg-white  shrink-0">
                    <div className="flex items-center gap-3">
                        {view === 'PREVIEW' && (
                            <button onClick={() => setView('FORM')} className="p-2 hover:bg-slate-100  rounded-full transition-colors">
                                <ArrowLeft className="w-5 h-5 text-slate-600" />
                            </button>
                        )}
                        <h3 className="font-bold text-slate-800  flex items-center gap-2">
                            {view === 'FORM' ? <><Star className="w-5 h-5 text-violet-500" /> Penilaian Prestasi</> : 'Pratonton Borang'}
                        </h3>
                    </div>
                    <div className="flex gap-2">
                        {view === 'FORM' ? (
                            <>
                                <button
                                    onClick={handlePratonton}
                                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold transition-colors text-sm shadow-md"
                                >
                                    <Eye className="w-4 h-4" />
                                    Pratonton
                                </button>
                                <button
                                    onClick={() => { handleSave(); onClose(); }}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition-colors text-sm shadow-md"
                                >
                                    <Save className="w-4 h-4" />
                                    Simpan & Tutup
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleDownload}
                                disabled={isGenerating}
                                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                            >
                                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                PDF
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-slate-100  rounded-lg text-slate-500">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-gray-50  p-6 flex flex-col items-center">

                    {view === 'FORM' && (
                        <div className="w-full max-w-3xl space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white  p-5 rounded-2xl shadow-sm border border-slate-200">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Skor Semasa</div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black text-violet-600">{totalScore}</span>
                                        <span className="text-slate-400 font-bold">/ 60</span>
                                    </div>
                                </div>
                                <div className="bg-white  p-5 rounded-2xl shadow-sm border border-slate-200">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Prestasi (%)</div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black text-blue-600">{percentage}%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white  p-6 rounded-2xl shadow-sm border border-slate-200">
                                <h4 className="font-bold text-slate-900  mb-4 text-sm uppercase tracking-wide">Maklumat Tambahan</h4>
                                <div className="space-y-4">
                                    {showErrors && !project.noInbois?.trim() && (
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-xs font-bold animate-pulse">
                                            <AlertCircle className="w-4 h-4" />
                                            Sila masukkan No. Inbois di bahagian maklumat projek sebelum pratonton.
                                        </div>
                                    )}

                                    <div ref={skopRef}>
                                        <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${showErrors && !localSkop ? 'text-red-500 animate-pulse' : 'text-slate-500'}`}>
                                            Skop Perkhidmatan {showErrors && !localSkop && <span className="text-red-500 ml-1">(Sila Pilih)</span>}
                                        </label>
                                        <div className="flex flex-wrap gap-4">
                                            {['BEKALAN', 'PERKHIDMATAN', 'KERJA'].map((scope) => (
                                                <label key={scope} className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${localSkop === scope ? 'bg-violet-50 border-violet-500 ring-2 ring-violet-500 shadow-md' : showErrors && !localSkop ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                                                    <input
                                                        type="radio"
                                                        name="skop"
                                                        value={scope}
                                                        checked={localSkop === scope}
                                                        onChange={() => {
                                                            setLocalSkop(scope as any);
                                                            if (showErrors) setShowErrors(false);
                                                        }}
                                                        className="hidden"
                                                    />
                                                    <span className={`font-bold text-sm ${localSkop === scope ? 'text-violet-700' : showErrors && !localSkop ? 'text-red-300' : 'text-slate-600'}`}>
                                                        {scope}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {[
                                    "Keupayaan kontraktor/ pembekal memenuhi permintaan dari segi harga berbanding kontraktor/ pembekal lain.",
                                    "Keupayaan kontraktor/ pembekal untuk membekalkan barangan /perkhidmatan/kerja mengikut spesifikasi yang ditetapkan.",
                                    "Keupayaan kontraktor/ pembekal untuk membekalkan barangan/ perkhidmatan dalam jangkamasa yang ditetapkan.",
                                    "Keupayaan kontraktor/ pembekal untuk membuat tindakan pembetulan sekiranya barangan/ perkhidmatan yang dibekalkan tidak memenuhi spesifikasi yang ditetapkan.",
                                    "Penilaian terhadap kontraktor/pembekal dari segi sikap dan kerjasama yang ditunjukkan oleh kontraktor/pembekal.",
                                    "Kekemasan dan kebersihan semasa dan selepas melaksanakan kerja / penghantaran bekalan."
                                ].map((q, idx) => (
                                    <div
                                        key={idx}
                                        ref={el => { scoreRefs.current[idx] = el; }}
                                        className={`bg-white p-6 rounded-2xl shadow-sm border transition-all ${showErrors && localScores[idx] === 0 ? 'border-red-500 ring-2 ring-red-50 shadow-md transform scale-[1.01]' : 'border-slate-200'}`}
                                    >
                                        <div className="flex gap-4 mb-4">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 transition-colors ${showErrors && localScores[idx] === 0 ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                                {idx + 1}
                                            </div>
                                            <p className={`text-sm font-medium leading-relaxed pt-1 ${showErrors && localScores[idx] === 0 ? 'text-red-600' : 'text-slate-800'}`}>{q}</p>
                                        </div>
                                        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                                                <button
                                                    key={score}
                                                    onClick={() => {
                                                        updateScore(idx, score);
                                                        // Optional: reset errors if all filled
                                                    }}
                                                    className={`h-10 rounded-lg font-bold text-sm transition-all border ${localScores[idx] === score
                                                        ? 'bg-violet-600 text-white border-violet-600 shadow-lg transform scale-110'
                                                        : showErrors && localScores[idx] === 0
                                                            ? 'bg-red-50 text-red-200 border-red-200 hover:border-red-400'
                                                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-violet-300'
                                                        }`}
                                                >
                                                    {score}
                                                </button>
                                            ))}
                                        </div>
                                        {showErrors && localScores[idx] === 0 && (
                                            <p className="text-[11px] text-red-500 mt-3 font-bold flex items-center gap-1">
                                                <X className="w-3 h-3" /> Sila berikan penilaian bagi kriteria ini
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {view === 'PREVIEW' && (
                        <div className="flex flex-col items-center gap-8 animate-fade-in pb-10">

                            <div className="w-[210mm] h-[296mm] bg-white p-[15mm] shadow-lg text-black font-sans leading-snug relative box-border pdf-page overflow-hidden flex flex-col">

                                <div className="flex flex-col items-center mb-6">
                                    <img
                                        src="https://upload.wikimedia.org/wikipedia/commons/6/6e/Selayang_Seal.png"
                                        alt="MPS Logo"
                                        className="h-[80px] object-contain mb-1"
                                    />
                                    <h1 className="text-[16px] font-bold uppercase font-sans text-center leading-tight text-black mt-2">
                                        BORANG PRESTASI KONTRAKTOR / PEMBEKAL
                                    </h1>
                                </div>

                                <div className="mb-6">
                                    <h3 className="font-bold text-[12px] uppercase mb-1.5 text-black">A. MAKLUMAT AM</h3>

                                    <table className="w-full border-collapse border border-black text-[11px] text-black">
                                        <tbody>
                                            <tr>
                                                <td className="border border-black p-1.5 w-[30%] align-top">Nama Pembekal/Kontraktor :</td>
                                                <td className="border border-black p-1.5 font-bold uppercase text-[12px] align-top">{project.namaSyarikat}</td>
                                            </tr>
                                            <tr>
                                                <td className="border border-black p-1.5 align-top">Nombor Pembekal / Kontraktor :</td>
                                                <td className="border border-black p-1.5 uppercase align-top">{companyDetails?.registrationNumber || ''}</td>
                                            </tr>
                                            <tr>
                                                <td className="border border-black p-1.5 align-top">Skop Pembekal/Kontraktor :</td>
                                                <td className="border border-black p-1.5 uppercase align-top">
                                                    <span className={localSkop === 'BEKALAN' ? 'font-bold' : ''}>BEKALAN</span> / &nbsp;
                                                    <span className={localSkop === 'PERKHIDMATAN' ? 'font-bold' : ''}>PERKHIDMATAN</span> / &nbsp;
                                                    <span className={localSkop === 'KERJA' ? 'font-bold' : ''}>KERJA</span>
                                                    <span className="float-right italic text-[10px] lowercase normal-case ml-4">(Potong yang tidak berkenaan)</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="border border-black p-1.5 align-top">Tajuk Tawaran:</td>
                                                <td className="border border-black p-1.5 uppercase text-justify leading-tight align-top">{project.namaProjek}</td>
                                            </tr>
                                        </tbody>
                                    </table>

                                    <table className="w-full border-collapse border-x border-b border-black text-[11px] text-black">
                                        <tbody>
                                            <tr>
                                                <td className="border border-black p-1.5 w-[30%]">No. Pesanan Rasmi :</td>
                                                <td className="border border-black p-1.5 w-[25%] uppercase">{project.noInden || '-'}</td>
                                                <td className="border border-black p-1.5 w-[20%]">Kos (RM) :</td>
                                                <td className="border border-black p-1.5 w-[25%]">{project.kosSebenar ? formatCurrency(project.kosSebenar).replace('RM', '') : ''}</td>
                                            </tr>
                                            <tr>
                                                <td className="border border-black p-1.5">Tarikh Mula Kerja /Pesanan :</td>
                                                <td className="border border-black p-1.5">{project.tarikhMulaKerja ? formatDate(project.tarikhMulaKerja) : ''}</td>
                                                <td className="border border-black p-1.5">Tarikh siap kerja / Terima Pesanan :</td>
                                                <td className="border border-black p-1.5">{project.tarikhSiapSebenar ? formatDate(project.tarikhSiapSebenar) : ''}</td>
                                            </tr>
                                            <tr>
                                                <td className="border border-black p-1.5">Lanjutan Masa (Sehingga) :</td>
                                                <td className="border border-black p-1.5">-</td>
                                                <td className="border border-black p-1.5">No. Inbois :</td>
                                                <td className="border border-black p-1.5 uppercase">{project.noInbois || ''}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div>
                                    <h3 className="font-bold text-[12px] uppercase mb-3 text-black">B. MAKLUMAT PENILAIAN PRESTASI</h3>

                                    <QuestionRow
                                        num={1}
                                        text="Keupayaan kontraktor/ pembekal memenuhi permintaan dari segi harga berbanding kontraktor/ pembekal lain."
                                        score={localScores[0]}
                                    />
                                    <QuestionRow
                                        num={2}
                                        text="Keupayaan kontraktor/ pembekal untuk membekalkan barangan /perkhidmatan/kerja mengikut spesifikasi yang ditetapkan."
                                        score={localScores[1]}
                                    />
                                    <QuestionRow
                                        num={3}
                                        text="Keupayaan kontraktor/ pembekal untuk membekalkan barangan/ perkhidmatan dalam jangkamasa yang ditetapkan."
                                        score={localScores[2]}
                                    />
                                    <QuestionRow
                                        num={4}
                                        text="Keupayaan kontraktor/ pembekal untuk membuat tindakan pembetulan sekiranya barangan/ perkhidmatan yang dibekalkan tidak memenuhi spesifikasi yang ditetapkan."
                                        score={localScores[3]}
                                    />
                                </div>
                            </div>

                            <div className="w-[210mm] h-[296mm] bg-white p-[15mm] shadow-lg text-black font-sans leading-snug relative box-border pdf-page overflow-hidden flex flex-col">

                                <div className="mb-6 border-b border-black/50 pb-4">
                                    <QuestionRow
                                        num={5}
                                        text="Penilaian terhadap kontraktor/pembekal dari segi sikap dan kerjasama yang ditunjukkan oleh kontraktor/pembekal."
                                        score={localScores[4]}
                                    />
                                    <QuestionRow
                                        num={6}
                                        text="Kekemasan dan kebersihan semasa dan selepas melaksanakan kerja / penghantaran bekalan."
                                        score={localScores[5]}
                                    />
                                </div>

                                <div className="mb-8">
                                    <h3 className="font-bold text-[12px] uppercase mb-2 text-black">C. MARKAH PRESTASI KONTRAKTOR DAN PEMBEKAL</h3>
                                    <div className="border border-black p-3 flex gap-4 items-start text-[12px]">
                                        <div className="flex-1">
                                            <p className="font-bold mb-6">Purata Prestasi Kontraktor/Pembekal</p>
                                            <div className="flex items-center gap-2 text-[14px]">
                                                <span className="text-[16px]">=</span>
                                                <div className="flex flex-col items-center">
                                                    <div className="border-b border-black w-full text-center px-2">{totalScore}</div>
                                                    <div>60</div>
                                                </div>
                                                <span className="text-[16px]">X 100% =</span>
                                                <div className="font-bold underline text-[16px] px-2">{percentage}</div>
                                                <span className="text-[16px]">%</span>
                                            </div>
                                        </div>

                                        <div className="w-[1px] bg-black self-stretch mx-2"></div>

                                        <div className="w-[45%]">
                                            <p className="font-bold mb-2">Skala Penilaian:-</p>
                                            <div className="grid grid-cols-[70px_15px_1fr] gap-y-1 text-[11px]">
                                                <div className="text-right">0 - 20%</div><div className="text-center">=</div><div>Amat Lemah</div>
                                                <div className="text-right">21 - 40%</div><div className="text-center">=</div><div>Lemah</div>
                                                <div className="text-right">41 - 60%</div><div className="text-center">=</div><div>Sederhana</div>
                                                <div className="text-right">61 - 80%</div><div className="text-center">=</div><div>Baik</div>
                                                <div className="text-right">81 - 100%</div><div className="text-center">=</div><div>Amat Baik</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 text-[11px] text-black">

                                    <div>
                                        <div className="bg-[#d1d5db] border border-black p-1 text-center font-bold uppercase mb-6 shadow-sm print:bg-gray-300">
                                            PENGESAHAN PEGAWAI PENYELIA TAPAK / PENERIMA BEKALAN
                                        </div>
                                        <div className="px-4">
                                            <p className="mb-8">Tandatangan:</p>
                                            <p>Tarikh:</p>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="bg-[#d1d5db] border border-black p-1 text-center font-bold uppercase mb-6 shadow-sm print:bg-gray-300">
                                            PENGESAHAN PEGAWAI / JURUTERA
                                        </div>
                                        <div className="px-4">
                                            <p className="mb-8">Tandatangan:</p>
                                            <p>Tarikh:</p>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="bg-[#d1d5db] border border-black p-1 text-center font-bold uppercase mb-6 shadow-sm print:bg-gray-300">
                                            PERAKUAN PENGARAH JABATAN - <span className="normal-case italic font-normal">Maklumat telah dikemaskini di dalam sistem.</span>
                                        </div>
                                        <div className="px-4">
                                            <p className="mb-8">Tandatangan:</p>
                                            <p>Tarikh:</p>
                                        </div>
                                    </div>

                                </div>

                                <div className="mt-auto pt-2 border-t-[3px] border-black text-[10px] text-black">
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