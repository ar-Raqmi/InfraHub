import React from 'react';
import { ArrowUpRight, Building2, ChevronDown } from 'lucide-react';
import { Project, ProjectStatus, User, formatCurrency, formatDate, getStatusLabel } from '../../types';
import { IconButton, StatusPill } from '../ui';
import type { CompanyGroupData, CostViewMode } from './CompanyCard';

interface CompanyGroupPanelProps {
  index: number;
  group: CompanyGroupData;
  expanded: boolean;
  onToggle: () => void;
  costViewMode: CostViewMode;
  canQuickEdit: boolean;
  getPjaUser: (id: number) => User | undefined;
  getVoteName: (code: string) => string;
  getHargaAkhir: (p: Project) => number;
  onOpenProject: (p: Project) => void;
  onUpdateProject: (id: number, updates: Partial<Project>) => void;
  capSlot?: React.ReactNode;
}

const th = 'ih-eyebrow text-muted px-4 py-3 border-b border-line whitespace-nowrap';

const Totals: React.FC<{ mode: CostViewMode; contract: number; akhir: number }> = ({ mode, contract, akhir }) => (
  <span className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
    {mode !== 'actual' && <span>Harga kontrak <b className="text-emerald-deep ih-num">{formatCurrency(contract)}</b></span>}
    {mode !== 'contract' && <span>Harga akhir <b className="text-teal-deep ih-num">{formatCurrency(akhir)}</b></span>}
  </span>
);

const QuickEdit: React.FC<{ p: Project; onUpdate: CompanyGroupPanelProps['onUpdateProject'] }> = ({ p, onUpdate }) => (
  <div className="flex flex-col items-center gap-1.5">
    <label className="inline-flex items-center gap-1 text-xs font-bold text-ink">
      <input
        type="number" min="0" max="100" aria-label={`Peratus siap ${p.noFail || ''}`}
        value={p.peratusSiap ?? 0}
        onChange={e => onUpdate(p.id, { peratusSiap: parseInt(e.target.value) || 0 })}
        className="w-14 h-9 text-center bg-surface border border-line-strong rounded-ih-sm ih-num outline-none focus:border-emerald"
      />%
    </label>
    <select
      value={p.status}
      aria-label={`Status ${p.noFail || ''}`}
      onChange={e => onUpdate(p.id, { status: e.target.value as ProjectStatus })}
      className="h-9 px-2 bg-surface border border-line-strong rounded-ih-sm text-xs font-bold text-ink outline-none focus:border-emerald"
    >
      {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
    </select>
  </div>
);

/** Desktop company group of the Syarikat view: totals, cap usage, and the projects by vote. */
const CompanyGroupPanel: React.FC<CompanyGroupPanelProps> = (props) => {
  const { index, group, expanded, onToggle, costViewMode, canQuickEdit, getPjaUser, getVoteName, getHargaAkhir, onOpenProject, onUpdateProject, capSlot } = props;
  return (
    <section className="hidden md:block bg-surface border border-line rounded-ih-lg overflow-hidden" data-company={group.company}>
      <button type="button" onClick={onToggle} aria-expanded={expanded} className="w-full text-left p-5 flex items-center gap-4 hover:bg-paper transition-colors">
        <span className="w-11 h-11 rounded-ih-md bg-paper-deep border border-line inline-flex items-center justify-center text-ink shrink-0"><Building2 className="w-5 h-5" aria-hidden /></span>
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-3">
            <span className="font-display text-title text-ink truncate">{index + 1}. {group.company}</span>
            <span className="shrink-0 h-6 px-2 inline-flex items-center rounded-full bg-paper-deep border border-line text-xs font-bold text-ink ih-num">{group.count > 0 ? `${group.count} fail` : 'Tiada projek'}</span>
          </span>
          <span className="block mt-1"><Totals mode={costViewMode} contract={group.totalCost} akhir={group.totalHargaAkhir} /></span>
        </span>
        <ChevronDown className={`w-5 h-5 text-muted transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {capSlot && <div className="px-5 pb-4 -mt-1 pl-20">{capSlot}</div>}

      {expanded && group.count === 0 && <p className="p-8 text-center text-muted italic text-sm border-t border-line">Tiada projek untuk syarikat ini.</p>}
      {expanded && group.count > 0 && (
        <div className="border-t border-line overflow-x-auto">
          {Object.keys(group.projectsByVote).sort().map(voteCode => {
            const v = group.projectsByVote[voteCode];
            return (
              <div key={voteCode} className="border-b border-line last:border-b-0">
                <p className="px-5 py-2 bg-paper-deep ih-eyebrow text-muted flex items-center gap-2">
                  <span className="bg-surface border border-line px-2 py-0.5 rounded-ih-sm text-ink">{voteCode}</span>{getVoteName(voteCode)}
                </p>
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-paper">
                    <tr>
                      <th className={`${th} text-center w-12`}>Bil</th><th className={`${th} text-left`}>No. Fail / Tajuk projek</th>
                      <th className={`${th} text-center`}>Bulan</th><th className={`${th} text-center`}>PJA</th><th className={`${th} text-left`}>Lokasi</th>
                      <th className={`${th} text-center`}>Mula – Tamat</th><th className={`${th} text-right`}>Kos</th><th className={`${th} text-center`}>Status</th><th className={th} />
                    </tr>
                  </thead>
                  <tbody>
                    {v.projects.map((p, i) => (
                      <tr key={p.id} className="border-b border-line align-top">
                        <td className="px-4 py-3 text-center text-xs font-bold text-muted ih-num">{i + 1}</td>
                        <td className="px-4 py-3 min-w-[280px]"><div className="font-bold text-ink text-[13px] ih-num">{p.noFail}</div><div className="text-[13px] text-ink-soft leading-relaxed whitespace-pre-wrap">{p.namaProjek}</div></td>
                        <td className="px-4 py-3 text-center text-xs font-bold text-ink">{p.bulan || '-'}</td>
                        <td className="px-4 py-3 text-center text-xs font-bold text-ink-soft">{getPjaUser(p.pjaId)?.username.toUpperCase() || '-'}</td>
                        <td className="px-4 py-3 text-xs text-muted max-w-[200px] whitespace-pre-wrap">{p.lokasi || '-'}</td>
                        <td className="px-4 py-3 text-center text-xs text-muted ih-num whitespace-nowrap">{formatDate(p.tarikhMulaKontrak)}<br />{formatDate(p.tarikhTamatKontrak)}</td>
                        <td className="px-4 py-3 text-right text-[13px] font-bold ih-num whitespace-nowrap">
                          {costViewMode !== 'actual' && <div className="text-emerald-deep">{formatCurrency(p.kosProjek)}</div>}
                          {costViewMode !== 'contract' && <div className="text-teal-deep">{formatCurrency(getHargaAkhir(p))}</div>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {canQuickEdit ? <QuickEdit p={p} onUpdate={onUpdateProject} /> : <div className="flex flex-col items-center gap-1"><StatusPill status={p.status} /><span className="text-xs font-bold ih-num">{p.peratusSiap}%</span></div>}
                        </td>
                        <td className="px-2 py-2 text-right"><IconButton icon={ArrowUpRight} label="Buka projek" onClick={() => onOpenProject(p)} /></td>
                      </tr>
                    ))}
                    <tr className="bg-paper font-bold">
                      <td colSpan={6} className="px-4 py-3 text-right ih-eyebrow text-muted">Jumlah</td>
                      <td className="px-4 py-3 text-right text-[13px] text-ink ih-num whitespace-nowrap">
                        {costViewMode !== 'actual' && <div>{formatCurrency(v.subtotalContract)}</div>}
                        {costViewMode !== 'contract' && <div className={costViewMode === 'both' ? 'text-xs text-muted' : ''}>{formatCurrency(v.subtotalAkhir)}</div>}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
          <div className="px-5 py-4 bg-emerald-tint border-t border-emerald-200 flex items-center justify-end gap-6">
            <span className="mr-auto text-sm text-muted">Bilangan projek <b className="text-ink ih-num">{group.count}</b></span>
            <span className="ih-eyebrow text-emerald-deep">Jumlah keseluruhan ({group.company})</span>
            <span className="font-bold ih-num text-emerald-deep">{formatCurrency(costViewMode === 'actual' ? group.totalHargaAkhir : group.totalCost)}</span>
          </div>
        </div>
      )}
    </section>
  );
};

export default CompanyGroupPanel;
