import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, GitCompare, PlayCircle } from 'lucide-react';
import { Button, Card, Chip, Field, Select, Timeline } from '../ui';
import { useRateBookVersions } from '../../hooks/useRateBook';
import { useChangeLog } from '../../hooks/useChangeLog';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../../services/apiService';
import type { ChangeLogEntry, RateBookVersion } from '../../types';
import DiffViewer from './DiffViewer';
import { SOURCE_LABEL, stamp } from './format';
import { CardTitle } from './bits';
import { cx } from '../ui/cx';

interface Props {
  contractId: string;
  onBrowse: (v: RateBookVersion) => void;
  onResume: (v: RateBookVersion) => void;
}

const ACTION_LABEL: Record<string, string> = { create: 'cipta', clone: 'salin', update: 'kemas kini', status: 'status', panel: 'panel', import: 'import', match: 'padanan', publish: 'terbit', edit: 'suntingan' };

// Officers decide matches one by one; show a run of decisions on the same version as one line.
function collapseMatches(entries: ChangeLogEntry[]): ChangeLogEntry[] {
  const out: ChangeLogEntry[] = [];
  for (const e of entries) {
    const prev = out[out.length - 1];
    if (prev && e.action === 'match' && prev.action === 'match' && prev.entityId === e.entityId && prev.userId === e.userId) {
      const n = (Number(prev.message?.match(/^\d+/)?.[0]) || 0) + (Number(e.message?.match(/^\d+/)?.[0]) || 0);
      out[out.length - 1] = { ...prev, at: prev.at, message: `${n} keputusan padanan` };
    } else out.push(e);
  }
  return out;
}

type DiffStats = { unchanged: number; rateChanged: number; wordingChanged: number; added: number; removed: number };

function statsLine(v: RateBookVersion): string {
  const s = (v.stats ?? {}) as { diff?: DiffStats; match?: { pending: number }; groups?: number; parse?: { pricedRows: number } };
  if (s.diff) return `${s.diff.rateChanged} kadar berubah · ${s.diff.wordingChanged} perkataan · +${s.diff.added} / −${s.diff.removed} · ${s.diff.unchanged} sama`;
  if (v.status === 'DRAF' && s.match) return `${s.parse?.pricedRows ?? '?'} baris diimport · ${s.match.pending} padanan menunggu keputusan`;
  if (s.groups) return `${s.groups} kumpulan`;
  return '';
}

const VersionLog: React.FC<Props> = ({ contractId, onBrowse, onResume }) => {
  const { data: versions = [], isLoading } = useRateBookVersions(contractId);
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => apiService.getUsers(), staleTime: 300_000 });
  const nameOf = (id?: number | null) => users.find(u => u.id === id)?.fullName ?? (id ? `Pengguna #${id}` : 'Sistem');
  const published = useMemo(() => versions.filter(v => v.status === 'TERBIT'), [versions]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [compare, setCompare] = useState<{ from: string; to: string } | null>(null);

  useEffect(() => {
    if (published.length >= 2 && !from && !to) { setFrom(published[1].id); setTo(published[0].id); }
  }, [published, from, to]);

  const compareWithPrevious = (v: RateBookVersion) => {
    const base = ((v.stats ?? {}) as { baseVersionId?: string }).baseVersionId ?? versions.find(o => o.versionNo < v.versionNo && o.status === 'TERBIT')?.id;
    if (!base) return;
    setFrom(base); setTo(v.id); setCompare({ from: base, to: v.id });
  };

  const contractLog = useChangeLog({ entity: 'contract', entityId: contractId, limit: 30 });
  const bookLog = useChangeLog({ entity: 'rate_book', limit: 200 });
  const log = useMemo(() => {
    const ids = new Set(versions.map(v => v.id));
    const all = [...(contractLog.data ?? []), ...(bookLog.data ?? []).filter(e => e.entityId && ids.has(e.entityId))]
      .sort((a, b) => b.at.localeCompare(a.at));
    return collapseMatches(all).slice(0, 30);
  }, [contractLog.data, bookLog.data, versions]);

  if (isLoading) return <p className="text-muted">Memuatkan log versi…</p>;

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-6">
        <Card padding="none" className="overflow-hidden">
          <header className="px-4 md:px-5 py-3 border-b border-line flex items-center justify-between gap-3">
            <CardTitle>Versi buku kadar</CardTitle>
            <span className="text-sm text-muted ih-num">{versions.length} komit</span>
          </header>
          <ol data-testid="version-log">
            {versions.map(v => (
              <li key={v.id} data-testid="version-row" data-version={v.versionNo} className="px-4 md:px-5 py-4 border-b border-line last:border-b-0 flex gap-3 md:gap-4">
                <span className={cx('shrink-0 h-8 min-w-11 px-2 inline-flex items-center justify-center rounded-ih-sm border text-sm font-bold ih-num',
                  v.status === 'TERBIT' ? 'bg-kontrak-tint text-kontrak border-kontrak-line' : 'ih-hatch bg-surface text-kontrak border-dashed border-kontrak-soft')}>v{v.versionNo}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-ink text-[15px] break-words">{v.message || (v.status === 'DRAF' ? 'Import dalam semakan (belum diterbitkan)' : 'Tiada mesej')}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-muted">
                    <Chip tone={v.status === 'TERBIT' ? 'kontrak' : 'amber'}>{v.status}</Chip>
                    {v.source && <Chip tone="neutral">{SOURCE_LABEL[v.source]}</Chip>}
                    <span className="ih-num">{stamp(v.publishedAt ?? v.createdAt)} · {nameOf(v.publishedBy ?? v.createdBy)}</span>
                  </div>
                  {v.sourceFile && <p className="text-[13px] text-muted mt-1 break-all">Fail: {v.sourceFile}{v.rateColumn ? ` · lajur ${v.rateColumn}` : ''}</p>}
                  {statsLine(v) && <p className="text-sm text-ink-soft mt-1 ih-num" data-testid="version-stats">{statsLine(v)}</p>}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {v.status === 'DRAF'
                      ? <Button size="sm" variant="kontrak" icon={PlayCircle} onClick={() => onResume(v)}>Sambung semakan</Button>
                      : <Button size="sm" variant="ghost" icon={BookOpen} onClick={() => onBrowse(v)}>Lihat buku</Button>}
                    {v.status === 'TERBIT' && v.versionNo > 1 && <Button size="sm" variant="ghost" icon={GitCompare} onClick={() => compareWithPrevious(v)}>Banding dengan sebelumnya</Button>}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      <Card className="min-w-0 self-start max-h-[40rem] overflow-y-auto">
        <CardTitle className="mb-3">Log kontrak</CardTitle>
        {log.length
          ? <Timeline items={log.map(e => ({ id: `${e.entity}-${e.id}`, at: stamp(e.at), title: e.message ?? e.action, actor: e.userName ?? undefined, tone: e.entity === 'rate_book' || e.action === 'status' ? 'kontrak' : 'neutral', tag: ACTION_LABEL[e.action] ?? e.action }))} />
          : <p className="text-muted text-sm">Belum ada perubahan direkod untuk kontrak ini.</p>}
      </Card>
      </div>

        <Card>
          <CardTitle className="mb-3">Banding dua versi</CardTitle>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <Field label="Dari" htmlFor="diff-from">
              <Select id="diff-from" value={from} onChange={e => setFrom(e.target.value)}>
                <option value="">Pilih versi…</option>
                {versions.map(v => <option key={v.id} value={v.id}>v{v.versionNo} · {v.status}</option>)}
              </Select>
            </Field>
            <Field label="Kepada" htmlFor="diff-to">
              <Select id="diff-to" value={to} onChange={e => setTo(e.target.value)}>
                <option value="">Pilih versi…</option>
                {versions.map(v => <option key={v.id} value={v.id}>v{v.versionNo} · {v.status}</option>)}
              </Select>
            </Field>
            <Button variant="ink" icon={GitCompare} disabled={!from || !to || from === to} onClick={() => setCompare({ from, to })} data-testid="diff-run">Banding</Button>
          </div>
          {compare && <div className="mt-4"><DiffViewer from={compare.from} to={compare.to} /></div>}
        </Card>
    </div>
  );
};

export default VersionLog;
