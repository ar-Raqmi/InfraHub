import React, { useState } from 'react';
import { CalendarClock, Plus } from 'lucide-react';
import { Button, Chip, Field, Input, Select } from '../ui';
import type { PolicyRuleRecord } from '../../types';
import { ALL_DEFAULT_POLICY_RULES, POLICY_META, type PolicyMeta } from './orgDefaults';
import { SaveBar, SectionCard, SectionHistory, dmy, isoDay, useSaveState } from './orgUi';
import type { OrgDocs } from './orgDocs';
import { calculateLADDailyRate } from '../../services/finance';
import { money2 } from './documentVars';

export interface NewPolicy {
  key: string;
  effective_from: string;
  value: number;
  note?: string;
}

interface Timeline {
  current: PolicyRuleRecord | null;
  upcoming: PolicyRuleRecord[];
  history: PolicyRuleRecord[];
  recorded: boolean;
}

// Splits one key's rules around today: in force now, scheduled, and everything ever recorded (newest first).
function timelineFor(key: string, records: PolicyRuleRecord[], today: string): Timeline {
  const own = records.filter((r) => r.key === key);
  const rules = own.length ? own : ALL_DEFAULT_POLICY_RULES.filter((r) => r.key === key)
    .map((r) => ({ key: r.key, effectiveFrom: r.effective_from, value: r.value, note: r.note }));
  const sorted = [...rules].sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
  return {
    current: sorted.find((r) => r.effectiveFrom <= today) ?? sorted[sorted.length - 1] ?? null,
    upcoming: sorted.filter((r) => r.effectiveFrom > today).reverse(),
    history: sorted,
    recorded: own.length > 0,
  };
}

const show = (value: unknown, meta: PolicyMeta) => {
  const n = Number(value);
  const text = Number.isFinite(n) ? n.toLocaleString('en-US', { maximumFractionDigits: 4 }) : String(value);
  return meta.unit === 'RM' ? `RM ${text}` : meta.unit.startsWith('RM/') ? `RM ${text}/${meta.unit.slice(3)}` : `${text} ${meta.unit}`;
};

const PolicyCard: React.FC<{ meta: PolicyMeta; line: Timeline }> = ({ meta, line }) => (
  <article className="rounded-ih-md border border-line bg-surface p-4 space-y-3" data-testid={`policy-${meta.key}`}>
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
        <h4 className="font-bold text-ink">{meta.label}</h4>
        <p className="text-[13px] text-muted">{meta.help}</p>
      </div>
      {!line.recorded && <Chip tone="amber">Nilai asal sistem, belum direkod</Chip>}
    </div>
    {line.current && (
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-display text-display-m ih-num text-ink" data-testid="policy-current">{show(line.current.value, meta)}</span>
        <span className="text-sm text-muted">berkuat kuasa sejak {dmy(line.current.effectiveFrom)}</span>
      </p>
    )}
    {line.upcoming.map((r) => (
      <p key={r.effectiveFrom} className="flex items-center gap-2 text-sm text-ink font-bold">
        <CalendarClock className="w-4 h-4" aria-hidden /> Mulai {dmy(r.effectiveFrom)}: {show(r.value, meta)}
      </p>
    ))}
    {line.history.length > 1 && (
      <details className="text-sm">
        <summary className="cursor-pointer min-h-11 flex items-center text-ink-soft font-bold">Sejarah nilai ({line.history.length})</summary>
        <ol className="mt-1 space-y-1 border-l-2 border-line pl-3">
          {line.history.map((r) => (
            <li key={r.effectiveFrom} className="ih-num"><span className="font-bold">{dmy(r.effectiveFrom)}</span> → {show(r.value, meta)}{r.note ? <span className="text-muted"> · {r.note}</span> : null}</li>
          ))}
        </ol>
      </details>
    )}
  </article>
);

/** Lets the admin see which rate a project dated X would get, before and after a scheduled change. */
const LadCheck: React.FC<{ org: OrgDocs }> = ({ org }) => {
  const [sum, setSum] = useState('50000');
  const [date, setDate] = useState(isoDay());
  const policy = org.ladPolicy(date);
  const rate = calculateLADDailyRate(Number(sum) || 0, policy);
  return (
    <div className="rounded-ih-md border border-line bg-surface p-4 space-y-3" data-testid="lad-check">
      <h3 className="text-title font-display text-ink">Semak kadar LAD pada sesuatu tarikh</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nilai kontrak" htmlFor="lad-sum"><Input id="lad-sum" inputMode="decimal" suffix="RM" value={sum} onChange={(e) => setSum(e.target.value)} /></Field>
        <Field label="Tarikh kontrak" htmlFor="lad-date"><Input id="lad-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      </div>
      <p className="text-[15px] text-ink">
        Kadar LAD: <b className="ih-num" data-testid="lad-check-rate">RM {money2(rate)}</b> sehari
        <span className="text-muted"> (BLR {policy.blrPct}% − {Number((policy.blrPct - policy.annualRatePct).toFixed(4))}%, had kontrak kecil RM {money2(policy.smallProjectThreshold)})</span>
      </p>
    </div>
  );
};

interface PoliciesSectionProps {
  org: OrgDocs;
  policies: PolicyRuleRecord[];
  onAdd: (rule: NewPolicy) => Promise<unknown>;
}

const GROUPS: PolicyMeta['group'][] = ['LAD', 'LoC', 'Notis', 'Kontrak'];

const PoliciesSection: React.FC<PoliciesSectionProps> = ({ org, policies, onAdd }) => {
  const today = isoDay();
  const [key, setKey] = useState(POLICY_META[0].key);
  const [value, setValue] = useState('');
  const [from, setFrom] = useState(isoDay(1));
  const [note, setNote] = useState('');
  const save = useSaveState();
  const meta = POLICY_META.find((m) => m.key === key) ?? POLICY_META[0];
  const line = timelineFor(key, policies, today);
  const taken = policies.some((p) => p.key === key && p.effectiveFrom === from);
  const n = Number(value);
  const valid = value.trim() !== '' && Number.isFinite(n) && /^\d{4}-\d{2}-\d{2}$/.test(from) && !taken;

  const submit = () => save.run(async () => {
    await onAdd({ key, effective_from: from, value: n, note: note.trim() || undefined });
    setValue('');
    setNote('');
  });

  return (
    <SectionCard id="peraturan" eyebrow="Peraturan" title="Peraturan bertarikh"
      description="Kadar LAD, LoC, tarikh notis dan tempoh kontrak. Nilai baharu ditambah dengan tarikh kuat kuasa; nilai lama tidak pernah diubah, jadi projek lama dikira dengan kadar pada tarikhnya.">
      <div className="rounded-ih-md border border-line bg-paper p-4 space-y-4" data-testid="policy-form">
        <h3 className="text-title font-display text-ink flex items-center gap-2"><Plus className="w-5 h-5" aria-hidden /> Tambah nilai baharu</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Peraturan" htmlFor="pol-key">
            <Select id="pol-key" value={key} onChange={(e) => setKey(e.target.value)}>
              {POLICY_META.map((m) => <option key={m.key} value={m.key}>{m.group}: {m.label}</option>)}
            </Select>
          </Field>
          <Field label={`Nilai (${meta.unit})`} htmlFor="pol-value" hint={line.current ? `Semasa: ${show(line.current.value, meta)}` : undefined}>
            <Input id="pol-value" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} />
          </Field>
          <Field label="Berkuat kuasa mulai" htmlFor="pol-from" error={taken ? `Sudah ada nilai bermula ${dmy(from)}. Sejarah tidak diubah; pilih tarikh lain.` : undefined}>
            <Input id="pol-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="Nota / rujukan" htmlFor="pol-note" hint="Cth. no. pekeliling.">
            <Input id="pol-note" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </div>
        {valid && (
          <p className="text-sm text-ink-soft">
            Mulai <b>{dmy(from)}</b>, {meta.label} = <b>{show(n, meta)}</b>.{line.current && <> Projek bertarikh sebelum itu kekal {show(line.current.value, meta)}.</>}
          </p>
        )}
        <SaveBar dirty={valid} saving={save.saving} savedAt={save.savedAt} error={save.error} onSave={submit} label="Tambah nilai" testId="save-policy" />
      </div>
      <LadCheck org={org} />
      {GROUPS.map((group) => (
        <div key={group} className="space-y-3">
          <h3 className="ih-eyebrow text-muted">{group}</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {POLICY_META.filter((m) => m.group === group).map((m) => <PolicyCard key={m.key} meta={m} line={timelineFor(m.key, policies, today)} />)}
          </div>
        </div>
      ))}
      <SectionHistory entity="policy" limit={8} />
    </SectionCard>
  );
};

export default PoliciesSection;
