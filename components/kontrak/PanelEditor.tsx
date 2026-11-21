import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowUp, Plus, Save, Trash2, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Chip, EmptyState, IconButton, Input } from '../ui';
import { useContractCompanies, useContracts } from '../../hooks/useContracts';
import { apiService } from '../../services/apiService';
import type { Contract, ContractCompany } from '../../types';
import { errorText, money } from './format';
import { cx } from '../ui/cx';
import { Notice } from './bits';

interface Props {
  contract: Contract;
  valueByCompany: Map<string, number>;
  readOnly: boolean;
}

type Row = Pick<ContractCompany, 'name' | 'cap' | 'details'>;

/** Every company name on any contract's panel, for the "add" suggestions. */
function useKnownCompanies(contracts: Contract[]) {
  return useQuery({
    queryKey: ['kontrak', 'known-companies', contracts.map(c => c.id).join(',')],
    queryFn: async () => {
      const panels = await Promise.all(contracts.map(c => apiService.getContractCompanies(c.id).catch(() => [] as ContractCompany[])));
      return [...new Set(panels.flat().map(p => p.name))].sort((a, b) => a.localeCompare(b));
    },
    enabled: contracts.length > 0,
    staleTime: 300_000,
  });
}

const CapMeter: React.FC<{ used: number; cap: number }> = ({ used, cap }) => {
  if (!cap) return <p className="text-[13px] text-muted ih-num">{money(used)} · tiada had ditetapkan</p>;
  const pct = cap > 0 ? Math.min(100, (used / cap) * 100) : 0;
  const over = used > cap;
  return (
    <div className="min-w-0">
      <div className="h-1.5 rounded-full bg-paper-deep overflow-hidden" aria-hidden>
        <div className={cx('h-full rounded-full', over ? 'bg-amber' : pct > 85 ? 'bg-amber/70' : 'bg-emerald-bright')} style={{ width: `${pct}%` }} />
      </div>
      <p className={cx('text-[13px] mt-1 ih-num', over ? 'text-amber font-bold' : 'text-muted')}>
        {money(used)} / {money(cap)}{over && ' · melebihi had'}
      </p>
    </div>
  );
};

const PanelEditor: React.FC<Props> = ({ contract, valueByCompany, readOnly }) => {
  const { data: saved = [], isLoading } = useContractCompanies(contract.id);
  const { contracts, savePanel } = useContracts();
  const known = useKnownCompanies(contracts);
  const [edited, setRows] = useState<Row[] | null>(null);
  const rows = useMemo<Row[]>(() => edited ?? saved.map(({ name, cap, details }) => ({ name, cap, details })), [edited, saved]);
  const [newName, setNewName] = useState('');
  const [msg, setMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  const dirty = useMemo(() => JSON.stringify(rows.map(r => [r.name, r.cap])) !== JSON.stringify(saved.map(r => [r.name, r.cap])), [rows, saved]);
  const defaultCap = contract.companyCap ?? 0;
  const overCount = rows.filter(r => (r.cap ?? defaultCap) > 0 && (valueByCompany.get(r.name) ?? 0) > (r.cap ?? defaultCap)).length;

  const change = (fn: (rs: Row[]) => Row[]) => setRows(fn(rows));
  const move = (i: number, d: -1 | 1) => change(rs => {
    const next = [...rs];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    return next;
  });
  const add = () => {
    const name = newName.trim();
    if (!name) return;
    if (rows.some(r => r.name.toLowerCase() === name.toLowerCase())) { setMsg({ tone: 'err', text: `${name} sudah ada dalam panel.` }); return; }
    change(rs => [...rs, { name, cap: null, details: null }]);
    setNewName('');
    setMsg(null);
  };
  const save = async () => {
    try {
      await savePanel.mutateAsync({ id: contract.id, companies: rows });
      setRows(null);
      setMsg({ tone: 'ok', text: `Panel disimpan: ${rows.length} syarikat. Perubahan direkod dalam log kontrak.` });
    } catch (err) {
      setMsg({ tone: 'err', text: errorText(err) });
    }
  };

  if (isLoading) return <p className="text-muted">Memuatkan panel…</p>;

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone="kontrak" icon={Users}>{rows.length} syarikat</Chip>
        <Chip tone="neutral">{defaultCap ? `Had lalai ${money(defaultCap)}` : 'Tiada had lalai (tetapkan di Butiran)'}</Chip>
        {overCount > 0 && <Chip tone="amber" icon={AlertTriangle}>{overCount} melebihi had</Chip>}
      </div>
      <p className="text-sm text-muted">Had nilai kerja hanya memberi amaran; ia tidak menyekat lantikan. Kosongkan had syarikat untuk memakai had lalai kontrak. Nilai kerja = jumlah kos projek kontrak ini bagi syarikat tersebut.</p>

      {!readOnly && (
        <div className="flex gap-2">
          <Input className="flex-1" aria-label="Nama syarikat baharu" list="kontrak-known-companies" placeholder="Tambah syarikat ke panel" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} />
          <datalist id="kontrak-known-companies">{(known.data ?? []).filter(n => !rows.some(r => r.name === n)).map(n => <option key={n} value={n} />)}</datalist>
          <Button variant="outline" icon={Plus} onClick={add}>Tambah</Button>
        </div>
      )}

      {rows.length === 0
        ? <EmptyState icon={Users} title="Panel masih kosong" body={contract.kind === 'STANDALONE' ? 'Kontrak berasingan biasanya mempunyai satu atau dua syarikat sahaja.' : 'Tambah syarikat yang dilantik ke panel sebutharga ini.'} />
        : (
          <Card padding="none" className="overflow-hidden">
            <ol>
              {rows.map((r, i) => {
                const cap = r.cap ?? defaultCap;
                return (
                  <li key={r.name} className="px-4 py-3 border-b border-line last:border-b-0 grid grid-cols-[2rem_minmax(0,1fr)] md:grid-cols-[2rem_minmax(0,1.3fr)_minmax(0,1fr)_9rem_auto] gap-x-3 gap-y-2 items-center">
                    <span className="text-sm font-bold text-muted ih-num">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-ink break-words">{r.name}</p>
                      {r.details?.gred && <p className="text-[13px] text-muted">Gred {r.details.gred}</p>}
                    </div>
                    <div className="col-start-2 md:col-start-auto"><CapMeter used={valueByCompany.get(r.name) ?? 0} cap={cap} /></div>
                    <div className="col-start-2 md:col-start-auto">
                      <Input aria-label={`Had ${r.name}`} inputMode="decimal" disabled={readOnly} placeholder={defaultCap ? String(defaultCap) : 'tiada had'} value={r.cap ?? ''} suffix="RM"
                        onChange={e => change(rs => rs.map((x, j) => (j === i ? { ...x, cap: e.target.value === '' ? null : Number(e.target.value) || 0 } : x)))} />
                    </div>
                    {!readOnly && (
                      <div className="col-start-2 md:col-start-auto flex gap-1">
                        <IconButton icon={ArrowUp} label="Naik" disabled={i === 0} onClick={() => move(i, -1)} />
                        <IconButton icon={ArrowDown} label="Turun" disabled={i === rows.length - 1} onClick={() => move(i, 1)} />
                        <IconButton icon={Trash2} label={`Buang ${r.name}`} onClick={() => change(rs => rs.filter((_, j) => j !== i))} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </Card>
        )}

      {msg && <Notice tone={msg.tone === 'err' ? 'error' : 'ok'}>{msg.text}</Notice>}
      {!readOnly && (
        <div className={cx('flex gap-2 bg-paper py-2', dirty && 'sticky bottom-20 md:bottom-4 border-t border-line')}>
          <Button variant="outline" disabled={!dirty} onClick={() => setRows(null)}>Buang perubahan</Button>
          <Button variant="primary" icon={Save} disabled={!dirty || savePanel.isPending} onClick={save}>{savePanel.isPending ? 'Menyimpan…' : 'Simpan panel'}</Button>
        </div>
      )}
    </div>
  );
};

export default PanelEditor;
