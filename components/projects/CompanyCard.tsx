import React from 'react';
import { ArrowUpRight, Building2, ChevronDown } from 'lucide-react';
import { Project, ProjectStatus, User, formatCurrency, formatDate, getStatusLabel } from '../../types';
import { StatusPill } from '../ui';
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
    <div className="px-4 py-3 border-t border-line">
        <button onClick={() => onOpen(p)} className="w-full min-h-[44px] flex items-center gap-2 text-left">
            <span className="w-6 h-6 rounded-ih-sm bg-paper-deep flex items-center justify-center text-xs font-bold text-muted shrink-0">{bil}</span>
            <span className="font-bold text-ink text-[13px] ih-num break-all">{p.noFail || '-'}</span>
            <span className="ml-auto px-2 py-0.5 rounded-ih-sm border border-line text-xs font-bold text-muted shrink-0">{p.bulan || '-'}</span>
            <ArrowUpRight className="w-5 h-5 text-ink shrink-0" />
        </button>
        <ExpandableText text={p.namaProjek || ''} lines={2} className="text-[13px] leading-[18px] text-ink-soft" />
        {p.lokasi && <ExpandableText text={p.lokasi} lines={2} className="text-xs text-muted whitespace-pre-wrap" />}
        <div className="flex items-center gap-2 mt-1 text-xs font-bold text-muted">
            <PjaAvatar pja={pja} className="w-5 h-5 text-[9px]" />
            <span>{pja?.username.toUpperCase() || '-'}</span>
            <span className="ih-num font-normal text-[11px] text-muted">{formatDate(p.tarikhMulaKontrak)} - {formatDate(p.tarikhTamatKontrak)}</span>
        </div>
        <div className="mt-1 text-right ih-num font-bold text-[13px]">
            {costViewMode !== 'actual' && <div className="text-emerald-deep">{formatCurrency(p.kosProjek)}</div>}
            {costViewMode !== 'contract' && <div className="text-teal-deep">{formatCurrency(hargaAkhir)}</div>}
        </div>
        {canQuickEdit ? (
            <div className="grid grid-cols-[1fr_88px] gap-2 mt-2">
                <select
                    value={p.status}
                    onChange={(e) => onUpdate(p.id, { status: e.target.value as ProjectStatus })}
                    aria-label="Status"
                    className="h-11 px-3 rounded-ih-md border border-line-strong bg-surface text-base font-bold text-ink outline-none"
                >
                    {Object.values(ProjectStatus).map(status => (
                        <option key={status} value={status}>{getStatusLabel(status)}</option>
                    ))}
                </select>
                <label className="h-11 rounded-ih-md border border-line-strong bg-surface flex items-center justify-center gap-1 text-ink font-bold">
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
                <StatusPill status={p.status} />
                <span className="text-xs font-bold text-ink ih-num">{p.peratusSiap}%</span>
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
    /** Company-cap usage per contract (warn only), rendered under the totals. */
    capSlot?: React.ReactNode;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ index, group, expanded, onToggle, costViewMode, canQuickEdit, getPjaUser, getVoteName, getHargaAkhir, onOpenProject, onUpdateProject, capSlot }) => (
    <section className="md:hidden bg-surface rounded-ih-lg border border-line overflow-hidden">
        <button onClick={onToggle} aria-expanded={expanded} className="w-full text-left px-4 py-3 flex items-start gap-3">
            <span className="w-10 h-10 rounded-ih-md bg-paper-deep border border-line flex items-center justify-center text-ink shrink-0"><Building2 className="w-5 h-5" /></span>
            <span className="flex-1 min-w-0">
                <span className="block text-[15px] font-bold text-ink leading-5 break-words">{index + 1}. {group.company}</span>
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-xs text-muted">
                    {group.count > 0
                        ? <span className="px-2 py-0.5 rounded-full bg-paper-deep border border-line text-ink text-[11px] font-bold ih-num">{group.count} fail</span>
                        : <span className="px-2 py-0.5 rounded-full bg-paper-deep border border-line text-muted text-[11px] font-bold italic">Tiada projek</span>}
                    {costViewMode !== 'actual' && <span>Harga Kontrak: <b className="text-emerald-deep ih-num">{formatCurrency(group.totalCost)}</b></span>}
                    {costViewMode !== 'contract' && <span>Harga Akhir: <b className="text-teal-deep ih-num">{formatCurrency(group.totalHargaAkhir)}</b></span>}
                </span>
            </span>
            <ChevronDown className={`w-5 h-5 mt-2.5 text-muted shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
        {capSlot && <div className="px-4 pb-3 -mt-1">{capSlot}</div>}

        {expanded && group.count === 0 && <div className="p-6 text-center text-muted italic text-sm border-t border-line">Tiada projek untuk syarikat ini.</div>}

        {expanded && group.count > 0 && (
            <div className="border-t border-line">
                {Object.keys(group.projectsByVote).sort().map(voteCode => {
                    const voteData = group.projectsByVote[voteCode];
                    return (
                        <div key={voteCode}>
                            <div className="px-4 py-2 bg-paper-deep ih-eyebrow text-muted flex items-center gap-2">
                                <span className="bg-surface border border-line px-2 py-0.5 rounded-ih-sm text-ink shrink-0">{voteCode}</span>
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
                            <div className="px-4 py-2.5 bg-paper border-t border-line flex items-start justify-between gap-3 font-bold">
                                <span className="ih-eyebrow text-muted pt-0.5">Jumlah</span>
                                <span className="text-right ih-num text-xs text-ink">
                                    {costViewMode !== 'actual' && <div>{formatCurrency(voteData.subtotalContract)}</div>}
                                    {costViewMode !== 'contract' && <div className={costViewMode === 'both' ? 'text-[10px] opacity-60' : ''}>{formatCurrency(voteData.subtotalAkhir)}</div>}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div className="px-4 py-3 bg-emerald-tint border-t border-emerald-200 flex items-center justify-between gap-3">
                    <span className="ih-eyebrow text-emerald-deep break-words min-w-0">Jumlah keseluruhan ({group.company})</span>
                    <span className="text-sm font-bold ih-num text-emerald-deep shrink-0">{costViewMode === 'actual' ? formatCurrency(group.totalHargaAkhir) : formatCurrency(group.totalCost)}</span>
                </div>
            </div>
        )}
    </section>
);

export default CompanyCard;
