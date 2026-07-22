import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Project } from '../types';
import { apiService } from '../services/apiService';
import { Download, Loader2, X, Star, Save, AlertCircle } from 'lucide-react';
import { PrestasiPDFExporter } from '../services/pdf/PrestasiPDFExporter';

interface PrestasiCertificateProps {
    project: Project;
    onClose: () => void;
    onPersist?: (updates: Partial<Project>) => Promise<void>;
}

const PrestasiCertificate: React.FC<PrestasiCertificateProps> = ({ project, onClose, onPersist }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
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

    const validateForm = (): boolean => {
        const hasInvoiceError = !project.noInbois?.trim();
        const hasSkopError = !localSkop;
        const hasScoreErrors = localScores.some(score => score === 0);

        if (hasInvoiceError || hasSkopError || hasScoreErrors) {
            setShowErrors(true);
            if (hasSkopError) {
                skopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (hasScoreErrors) {
                const firstScoreErrorIdx = localScores.findIndex(score => score === 0);
                if (firstScoreErrorIdx !== -1) {
                    scoreRefs.current[firstScoreErrorIdx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
            return false;
        }
        return true;
    };

    const buildUpdates = (): Partial<Project> => ({
        prestasiScores: localScores,
        prestasi: `${percentage}%`,
        skop: (localSkop as any) || 'BEKALAN',
        noInbois: project.noInbois || '',
    });

    const handleSaveAndClose = async () => {
        if (!validateForm()) return;
        setIsSaving(true);
        try {
            if (onPersist) await onPersist(buildUpdates());
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
            onClose();
        }
    };

    const handlePDF = async () => {
        if (!validateForm()) return;
        setIsSaving(true);
        try {
            if (onPersist) await onPersist(buildUpdates());
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
        setIsGenerating(true);
        try {
            await PrestasiPDFExporter.export(project, localScores, localSkop, companyDetails);
        } catch (e) {
            console.error(e);
            alert("Ralat menjana PDF");
            return;
        } finally {
            setIsGenerating(false);
        }
        onClose();
    };

    const updateScore = (index: number, score: number) => {
        const newArr = [...localScores];
        newArr[index] = score;
        setLocalScores(newArr);
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60  animate-fade-in" style={{ zIndex: 9999 }}>
            <div className="bg-white  w-full rounded-3xl max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden relative animate-slide-up">

                <div className="p-4 border-b border-slate-200  flex justify-between items-center bg-white  shrink-0">
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-slate-800  flex items-center gap-2">
                            <Star className="w-5 h-5 text-violet-500" /> Penilaian Prestasi
                        </h3>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSaveAndClose}
                            disabled={isSaving}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold transition-colors text-sm shadow-md disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Simpan & Tutup
                        </button>
                        <button
                            onClick={handlePDF}
                            disabled={isSaving || isGenerating}
                            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors text-sm disabled:opacity-50"
                        >
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            PDF
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100  rounded-lg text-slate-500">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-gray-50  p-6 flex flex-col items-center">
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
                                    <span className="text-3xl font-black text-emerald-600">{percentage}%</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white  p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h4 className="font-bold text-slate-900  mb-4 text-sm uppercase tracking-wide">Maklumat Tambahan</h4>
                            <div className="space-y-4">
                                {showErrors && !project.noInbois?.trim() && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-xs font-bold animate-pulse">
                                        <AlertCircle className="w-4 h-4" />
                                        Sila masukkan No. Inbois di bahagian maklumat projek sebelum menyimpan.
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
                </div>
            </div>
        </div>,
        document.body
    );
};

export default PrestasiCertificate;
