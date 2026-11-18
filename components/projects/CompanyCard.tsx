import React from 'react';
import { ArrowUpRight, Building2, ChevronDown } from 'lucide-react';
import { Project, ProjectStatus, User, formatCurrency, formatDate, getStatusColor, getStatusLabel } from '../../types';
import ExpandableText from '../ExpandableText';
import PjaAvatar from './PjaAvatar';

export interface CompanyGroupData {
    company: string;
    projects: Project[];
    totalCost: number;
    totalHargaAkhir: number;
    count: number;
    // Group projects by Vote Code for display
    projectsByVote: Record<string, {
        projects: Project[];
        subtotalContract: number;
        subtotalAkhir: number;
    }>;
}

export type CostViewMode = 'contract' | 'actual' | 'both';

interface GroupProjectRowProps {
    project: Project;
    bil: number;
    pja?: User;
    hargaAkhir: number;
    costViewMode: CostViewMode;
    canQuickEdit: boolean;
    onOpen: (project: Project) => void;
    onUpdate: (id: number, updates: Partial<Project>) => void;
}

const GroupProjectRow: React.FC<GroupProjectRowProps> = ({ project: p, bil, pja, hargaAkhir, costViewMode, canQuickEdit, onOpen, onUpdate }) => (
    <div className="px-4 py-3 border-t border-slate-100">
        <button onClick={() => onOpen(p)} className="w-full min-h-[44px] flex items-center gap-2 text-left">
            <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-extrabold text-slate-500 shrink-0">{bil}</span>
            <span className="font-mono font-extrabold text-slate-800 text-[13px] break-all">{p.noFail || '-'}</span>
            <span className="ml-auto px-2 py-0.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 shrink-0">{p.bulan || '-'}</span>
            <ArrowUpRight className="w-5 h-5 text-emerald-600 shrink-0" />
        </button>
        <ExpandableText text={p.namaProjek || ''} lines={2} className="text-[13px] leading-[18px] font-medium text-slate-700" />
        {p.lokasi && <ExpandableText text={p.lokasi} lines={2} className="text-xs text-slate-500 whitespace-pre-wrap" />}
        <div className="flex items-center gap-2 mt-1 text-xs font-bold text-slate-500">
            <PjaAvatar pja={pja} className="w-5 h-5 text-[9px]" />
            <span>{pja?.username.toUpperCase() || '-'}</span>
            <span className="font-mono font-normal text-[11px] text-slate-400">{formatDate(p.tarikhMulaKontrak)} - {formatDate(p.tarikhTamatKontrak)}</span>
        </div>
        <div className="mt-1 text-right font-mono font-bold text-[13px]">
            {costViewMode !== 'actual' && <div className="text-emerald-600">{formatCurrency(p.kosProjek)}</div>}
            {costViewMode !== 'contract' && <div className="text-blue-600">{formatCurrency(hargaAkhir)}</div>}
        </div>
        {canQuickEdit ? (
            <div className="grid grid-cols-[1fr_88px] gap-2 mt-2">
                <select
                    value={p.status}
                    onChange={(e) => onUpdate(p.id, { status: e.target.value as ProjectStatus })}
                    aria-label="Status"
                    className={`h-11 px-3 rounded-xl border text-base font-bold outline-none ${getStatusColor(p.status)}`}
                >
                    {Object.values(ProjectStatus).map(status => (
                        <option key={status} value={status}>{getStatusLabel(status)}</option>
                    ))}
                </select>
                <label className="h-11 rounded-xl border border-emerald-200 bg-white flex items-center justify-center gap-1 text-emerald-600 font-bold">
                    <input
                        type="number"
                        min="0"
                        max="100"
                        inputMode="numeric"
                        aria-label="Peratus siap"
                        value={p.peratusSiap ?? 0}
                        onChange={(e) => onUpdate(p.id, { peratusSiap: parseInt(e.target.value) || 0 })}
                        className="w-12 h-full text-center text-base bg-transparent outline-none"
                    />
                    %
                </label>
            </div>
        ) : (
            <div className="flex items-center gap-2 mt-2">
                <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold border ${getStatusColor(p.status)}`}>{getStatusLabel(p.status)}</span>
                <span className="text-xs font-bold text-emerald-600">{p.peratusSiap}%</span>
            </div>
        )}
    </div>
);

interface CompanyCardProps {
    index: number;
    group: CompanyGroupData;
    expanded: boolean;
    onToggle: () => void;
    costViewMode: CostViewMode;
    canQuickEdit: boolean;
    getPjaUser: (id: number) => User | undefined;
    getVoteName: (code: string) => string;
    getHargaAkhir: (p: Project) => number;
    onOpenProject: (project: Project) => void;
    onUpdateProject: (id: number, updates: Partial<Project>) => void;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ index, group, expanded, onToggle, costViewMode, canQuickEdit, getPjaUser, getVoteName, getHargaAkhir, onOpenProject, onUpdateProject }) => (
    <section className="md:hidden bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <button onClick={onToggle} aria-expanded={expanded} className="w-full text-left px-4 py-3 flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shrink-0"><Building2 className="w-5 h-5" /></span>
            <span className="flex-1 min-w-0">
                <span className="block text-[15px] font-extrabold text-slate-900 leading-5 break-words">{index + 1}. {group.company}</span>
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-xs font-semibold text-slate-500">
                    {group.count > 0
                        ? <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-extrabold uppercase tracking-wider">{group.count} Fail</span>
                        : <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider italic">Tiada Projek</span>}
                    {costViewMode !== 'actual' && <span>Harga Kontrak: <b className="text-emerald-700 font-mono">{formatCurrency(group.totalCost)}</b></span>}
                    {costViewMode !== 'contract' && <span>Harga Akhir: <b className="text-blue-700 font-mono">{formatCurrency(group.totalHargaAkhir)}</b></span>}
                </span>
            </span>
            <ChevronDown className={`w-5 h-5 mt-2.5 text-slate-400 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>

        {expanded && group.count === 0 && <div className="p-6 text-center text-slate-400 italic text-sm border-t border-slate-100">Tiada projek untuk syarikat ini.</div>}

        {expanded && group.count > 0 && (
            <div className="border-t border-slate-100">
                {Object.keys(group.projectsByVote).sort().map(voteCode => {
                    const voteData = group.projectsByVote[voteCode];
                    return (
                        <div key={voteCode}>
                            <div className="px-4 py-2 bg-slate-100/70 text-[11px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <span className="bg-slate-200 px-2 py-0.5 rounded text-slate-700 shrink-0">{voteCode}</span>
                                <span className="min-w-0 break-words">{getVoteName(voteCode)}</span>
                            </div>
                            {voteData.projects.map((p, pIdx) => (
                                <GroupProjectRow
                                    key={p.id}
                                    project={p}
                                    bil={pIdx + 1}
                                    pja={getPjaUser(p.pjaId)}
                                    hargaAkhir={getHargaAkhir(p)}
                                    costViewMode={costViewMode}
                                    canQuickEdit={canQuickEdit}
                                    onOpen={onOpenProject}
                                    onUpdate={onUpdateProject}
                                />
                            ))}
                            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-start justify-between gap-3 font-bold">
                                <span className="text-[10px] uppercase text-slate-500 tracking-wider pt-0.5">Jumlah</span>
                                <span className="text-right font-mono text-xs text-slate-800">
                                    {costViewMode !== 'actual' && <div>{formatCurrency(voteData.subtotalContract)}</div>}
                                    {costViewMode !== 'contract' && <div className={costViewMode === 'both' ? 'text-[10px] opacity-60' : ''}>{formatCurrency(voteData.subtotalAkhir)}</div>}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div className="px-4 py-3 bg-emerald-50/50 border-t border-emerald-100 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-bold uppercase text-emerald-600 tracking-wider break-words min-w-0">Jumlah Keseluruhan ({group.company})</span>
                    <span className="text-sm font-black font-mono text-emerald-700 shrink-0">{costViewMode === 'actual' ? formatCurrency(group.totalHargaAkhir) : formatCurrency(group.totalCost)}</span>
                </div>
            </div>
        )}
    </section>
);

export default CompanyCard;
