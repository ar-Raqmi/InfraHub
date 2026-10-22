import React, { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, FileUp, Loader2, AlertTriangle, ChevronDown, ChevronRight, CheckCircle2, ArrowRight, Save } from 'lucide-react';
import { apiService } from '../services/apiService';
import { useProjects } from '../hooks/useProjects';
import { parseIndenFile } from '../services/indenPdfLoader';
import { matchIndenRows, isSelectedByDefault, INDEN_FLAG_LABEL, IndenMatch, IndenProject, IndenStatus } from '../services/indenMatcher';
import { formatCurrency } from '../types';

interface ImportIndenModalProps {
    onClose: () => void;
    projects: IndenProject[];
}

type Phase = 'pick' | 'parsing' | 'review' | 'saving' | 'done';
type IndexedMatch = IndenMatch & { index: number };

interface SaveFailure {
    noFail: string;
    message: string;
}

const SAVE_BATCH_SIZE = 5;

const FlagIcon: React.FC<{ match: IndenMatch }> = ({ match }) => {
    if (match.flags.length === 0) return null;
    const tip = match.flags.map(f => INDEN_FLAG_LABEL[f]).join('\n');
    return <span title={tip} className="text-amber-500 shrink-0"><AlertTriangle className="w-4 h-4" /></span>;
};

const MatchRow: React.FC<{
    match: IndexedMatch;
    checked?: boolean;
    onToggle?: (index: number) => void;
}> = ({ match, checked, onToggle }) => {
    const { row, project, status } = match;
    const differs = status === 'berbeza';
    return (
        <label className={`flex items-center gap-3 px-4 py-2.5 text-sm border-b border-slate-100 last:border-0 ${differs ? 'bg-amber-50' : ''} ${onToggle ? 'cursor-pointer hover:bg-slate-50' : ''}`}>
            {onToggle && (
                <input type="checkbox" checked={!!checked} onChange={() => onToggle(match.index)} className="w-4 h-4 accent-emerald-600 shrink-0" />
            )}
            <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-800 truncate">{row.noFail}</div>
                <div className="text-xs text-slate-500 truncate">{project?.namaProjek || row.supplier}</div>
            </div>
            <div className="text-right shrink-0 text-xs">
                <div className="text-slate-500">{row.supplier}</div>
                <div className="text-slate-400">{formatCurrency(row.amount)}</div>
            </div>
            <div className="shrink-0 w-48 text-right font-mono text-sm">
                {differs ? (
                    <span className="inline-flex items-center gap-1.5">
                        <span className="text-slate-400 line-through">{project?.noInden}</span>
                        <ArrowRight className="w-3 h-3 text-amber-600" />
                        <span className="font-bold text-amber-700">{row.noPesanan}</span>
                    </span>
                ) : (
                    <span className="font-bold text-emerald-700">{row.noPesanan}</span>
                )}
            </div>
            <div className="w-4 shrink-0"><FlagIcon match={match} /></div>
        </label>
    );
};

const GroupHeader: React.FC<{
    title: string;
    count: number;
    tone: string;
    open: boolean;
    onToggleOpen: () => void;
    selectAll?: { checked: boolean; onChange: () => void };
    hint?: string;
}> = ({ title, count, tone, open, onToggleOpen, selectAll, hint }) => (
    <div className={`flex items-center gap-3 px-4 py-3 ${tone}`}>
        {selectAll && (
            <input type="checkbox" checked={selectAll.checked} onChange={selectAll.onChange} className="w-4 h-4 accent-emerald-600" title="Pilih semua" />
        )}
        <button type="button" onClick={onToggleOpen} className="flex items-center gap-2 flex-1 text-left font-bold text-sm">
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            {title} <span className="font-normal opacity-70">({count})</span>
            {hint && <span className="font-normal text-xs opacity-70 ml-2">{hint}</span>}
        </button>
    </div>
);

const ImportIndenModal: React.FC<ImportIndenModalProps> = ({ onClose, projects }) => {
    const { refetchProjects } = useProjects();
    const fileInput = useRef<HTMLInputElement>(null);
    const [phase, setPhase] = useState<Phase>('pick');
    const [error, setError] = useState('');
    const [matches, setMatches] = useState<IndexedMatch[]>([]);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [open, setOpen] = useState<Record<IndenStatus, boolean>>({ baharu: true, berbeza: true, sama: false, tiada: false });
    const [progress, setProgress] = useState(0);
    const [savedCount, setSavedCount] = useState(0);
    const [failures, setFailures] = useState<SaveFailure[]>([]);

    const groups = useMemo(() => {
        const by: Record<IndenStatus, IndexedMatch[]> = { baharu: [], berbeza: [], sama: [], tiada: [] };
        matches.forEach(m => by[m.status].push(m));
        return by;
    }, [matches]);

    const handleFile = async (file?: File) => {
        if (!file) return;
        if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') {
            setError('Sila pilih fail PDF.');
            return;
        }
        setError('');
        setPhase('parsing');
        try {
            const rows = await parseIndenFile(file);
            if (rows.length === 0) throw new Error('Tiada baris No. Pesanan ditemui. Pastikan ini laporan YO140001.');
            const result = matchIndenRows(rows, projects).map((m, index) => ({ ...m, index }));
            setMatches(result);
            setSelected(new Set(result.filter(isSelectedByDefault).map(m => m.index)));
            setPhase('review');
        } catch (e: any) {
            setError(e?.message || 'Gagal memproses PDF.');
            setPhase('pick');
        }
    };

    const toggle = (index: number) => setSelected(prev => {
        const next = new Set(prev);
        if (!next.delete(index)) next.add(index);
        return next;
    });

    const toggleGroup = (items: IndexedMatch[]) => setSelected(prev => {
        const next = new Set(prev);
        const allOn = items.every(m => next.has(m.index));
        items.forEach(m => (allOn ? next.delete(m.index) : next.add(m.index)));
        return next;
    });

    const isGroupChecked = (items: IndexedMatch[]) => items.length > 0 && items.every(m => selected.has(m.index));

    const handleSave = async () => {
        const queue = matches.filter(m => selected.has(m.index));
        const failed: SaveFailure[] = [];
        let done = 0;
        setPhase('saving');
        setProgress(0);
        for (let i = 0; i < queue.length; i += SAVE_BATCH_SIZE) {
            const batch = queue.slice(i, i + SAVE_BATCH_SIZE);
            const results = await Promise.allSettled(batch.map(m => apiService.updateProject(m.project!.id, { noInden: m.row.noPesanan })));
            results.forEach((r, k) => {
                if (r.status === 'rejected') failed.push({ noFail: batch[k].row.noFail, message: r.reason?.message || 'Gagal disimpan' });
            });
            done += batch.length;
            setProgress(Math.round((done / queue.length) * 100));
        }
        setSavedCount(queue.length - failed.length);
        setFailures(failed);
        setPhase('done');
        refetchProjects();
    };

    const toggleOpen = (status: IndenStatus) => setOpen(prev => ({ ...prev, [status]: !prev[status] }));

    const renderGroup = (status: IndenStatus, title: string, tone: string, opts: { selectable?: boolean; hint?: string } = {}) => {
        const items = groups[status];
        if (items.length === 0) return null;
        return (
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <GroupHeader
                    title={title}
                    count={items.length}
                    tone={tone}
                    open={open[status]}
                    onToggleOpen={() => toggleOpen(status)}
                    hint={opts.hint}
                    selectAll={opts.selectable ? { checked: isGroupChecked(items), onChange: () => toggleGroup(items) } : undefined}
                />
                {open[status] && (
                    <div className={status === 'tiada' || status === 'sama' ? 'max-h-72 overflow-y-auto opacity-70' : ''}>
                        {items.map(m => (
                            <MatchRow key={m.index} match={m} checked={selected.has(m.index)} onToggle={opts.selectable ? toggle : undefined} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const close = () => {
        if (phase === 'saving') return;
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 animate-fade-in" onClick={close}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-200 animate-slide-up relative" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 pb-4">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <FileUp className="w-6 h-6 text-emerald-600" />
                        Import No. Inden (PDF)
                    </h3>
                    <button onClick={close} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="px-6 pb-6 overflow-y-auto flex-1 space-y-4">
                    {phase === 'pick' && (
                        <>
                            <div
                                onClick={() => fileInput.current?.click()}
                                onDragOver={e => e.preventDefault()}
                                onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                                className="border-2 border-dashed border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/40 rounded-2xl py-14 flex flex-col items-center gap-3 cursor-pointer transition-colors"
                            >
                                <FileUp className="w-10 h-10 text-slate-400" />
                                <p className="text-sm font-bold text-slate-700">Seret PDF ke sini atau klik untuk pilih fail</p>
                                <p className="text-xs text-slate-400">Laporan YO140001 - Senarai Pesanan Tempatan Sblm Kelulusan</p>
                                <input ref={fileInput} type="file" accept="application/pdf,.pdf" className="hidden" onChange={e => { handleFile(e.target.files?.[0]); e.target.value = ''; }} />
                            </div>
                            {error && <p className="text-sm font-bold text-red-600 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</p>}
                        </>
                    )}

                    {phase === 'parsing' && (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
                            <p className="text-sm font-bold text-slate-700">Memproses PDF...</p>
                        </div>
                    )}

                    {phase === 'review' && (
                        <>
                            <p className="text-xs text-slate-500">
                                {matches.length} baris dalam PDF, {matches.length - groups.tiada.length} sepadan dengan projek.
                            </p>
                            {renderGroup('baharu', 'Baharu', 'bg-emerald-50 text-emerald-800', { selectable: true })}
                            {renderGroup('berbeza', 'Berbeza', 'bg-amber-100 text-amber-900', { selectable: true, hint: 'Tandakan untuk menggantikan No. Inden sedia ada' })}
                            {renderGroup('sama', 'Sudah sama', 'bg-slate-100 text-slate-600')}
                            {renderGroup('tiada', 'Tiada padanan', 'bg-slate-100 text-slate-600', { hint: 'Untuk maklumat sahaja' })}
                            {groups.baharu.length + groups.berbeza.length === 0 && (
                                <p className="text-sm text-slate-500 text-center py-6">Tiada No. Inden baharu untuk disimpan.</p>
                            )}
                        </>
                    )}

                    {phase === 'saving' && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
                            <p className="text-sm font-bold text-slate-700">Menyimpan... {progress}%</p>
                            <div className="w-full max-w-sm bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
                                <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    )}

                    {phase === 'done' && (
                        <div className="py-6 space-y-4">
                            <div className="flex flex-col items-center text-center gap-2">
                                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                                <p className="text-lg font-bold text-slate-800">{savedCount} No. Inden berjaya disimpan</p>
                                {failures.length > 0 && <p className="text-sm font-bold text-red-600">{failures.length} gagal disimpan</p>}
                            </div>
                            {failures.length > 0 && (
                                <div className="border border-red-200 bg-red-50 rounded-2xl divide-y divide-red-100 max-h-60 overflow-y-auto">
                                    {failures.map((f, i) => (
                                        <div key={i} className="px-4 py-2 text-sm flex justify-between gap-4">
                                            <span className="font-bold text-red-800">{f.noFail}</span>
                                            <span className="text-red-600">{f.message}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between gap-3 p-6 pt-4 border-t border-slate-100">
                    {phase === 'review' ? (
                        <>
                            <span className="text-sm text-slate-500">{selected.size} dipilih</span>
                            <div className="flex gap-3">
                                <button onClick={close} className="py-2.5 px-5 bg-white text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors border border-slate-200">Batal</button>
                                <button
                                    onClick={handleSave}
                                    disabled={selected.size === 0}
                                    className="py-2.5 px-5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save className="w-4 h-4" />
                                    Simpan {selected.size} No. Inden
                                </button>
                            </div>
                        </>
                    ) : (
                        <button onClick={close} disabled={phase === 'saving'} className="ml-auto py-2.5 px-5 bg-white text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors border border-slate-200 disabled:opacity-50">
                            {phase === 'done' ? 'Tutup' : 'Batal'}
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ImportIndenModal;
