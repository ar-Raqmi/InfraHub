import React, { useState } from 'react';
import { Copy, FilePlus2 } from 'lucide-react';
import { Button, Field, Input, Select, Sheet } from '../ui';
import type { ContractInputBody } from '../../services/apiService';
import type { Contract } from '../../types';
import { Notice } from './bits';
import { useAction } from './useAction';
import { cx } from '../ui/cx';

interface Props {
  open: boolean;
  contracts: Contract[];
  /** Pre-selected source when the officer chose "Salin …". Mount the sheet per opening so the form starts fresh. */
  cloneFrom?: Contract;
  onClose: () => void;
  onSubmit: (body: ContractInputBody & { clone_from?: string }) => Promise<Contract>;
  onCreated: (c: Contract) => void;
}

type Form = { mode: 'blank' | 'clone'; source: string; code: string; title: string; kind: Contract['kind']; validFrom: string; validTo: string; cap: string; meetingNumber: string; meetingDate: string; notes: string };

const empty = (source?: Contract): Form => ({
  mode: source ? 'clone' : 'blank', source: source?.id ?? '', code: '', title: '', kind: source?.kind ?? 'PANEL',
  validFrom: '', validTo: '', cap: String(source?.companyCap ?? 200000), meetingNumber: '', meetingDate: '', notes: '',
});

function validate(f: Form): Partial<Record<keyof Form, string>> {
  const e: Partial<Record<keyof Form, string>> = {};
  if (!f.code.trim()) e.code = 'Masukkan No. sebutharga, contohnya MPS/SH/118/26.';
  if (!f.title.trim()) e.title = 'Beri tajuk yang mudah dicari, contohnya "Panel Longkang 2027".';
  if (f.mode === 'clone' && !f.source) e.source = 'Pilih kontrak yang hendak disalin.';
  if (f.validFrom && f.validTo && f.validTo < f.validFrom) e.validTo = 'Tarikh tamat mesti selepas tarikh mula.';
  if (f.cap && !(Number(f.cap) > 0)) e.cap = 'Had syarikat mesti nombor lebih besar daripada 0.';
  return e;
}

const toBody = (f: Form): ContractInputBody & { clone_from?: string } => ({
  code: f.code.trim(), title: f.title.trim(), kind: f.kind,
  valid_from: f.validFrom || null, valid_to: f.validTo || null,
  company_cap: f.cap ? Number(f.cap) : null,
  meeting_number: f.meetingNumber.trim() || null, meeting_date: f.meetingDate || null, notes: f.notes.trim() || null,
  ...(f.mode === 'clone' ? { clone_from: f.source } : {}),
});

const CreateContractSheet: React.FC<Props> = ({ open, contracts, cloneFrom, onClose, onSubmit, onCreated }) => {
  const [form, setForm] = useState<Form>(() => empty(cloneFrom));
  const [touched, setTouched] = useState(false);
  const { busy, error: serverError, run } = useAction();

  const errors = validate(form);
  const shownErrors = touched ? errors : {};
  const set = <K extends keyof Form>(k: K) => (v: Form[K]) => setForm(f => ({ ...f, [k]: v }));
  const source = contracts.find(c => c.id === form.source);

  const submit = async () => {
    setTouched(true);
    if (Object.keys(errors).length) return;
    const created = await run(() => onSubmit(toBody(form)));
    if (created) onCreated(created);
  };

  const footer = (
    <div className="flex gap-2">
      <Button variant="outline" onClick={onClose} className="flex-1">Batal</Button>
      <Button variant="kontrak" icon={form.mode === 'clone' ? Copy : FilePlus2} onClick={submit} disabled={busy} className="flex-[2]" data-testid="create-submit">
        {busy ? 'Mencipta…' : form.mode === 'clone' ? 'Salin sebagai draf' : 'Cipta draf'}
      </Button>
    </div>
  );

  return (
    <Sheet open={open} title="Kontrak baharu" onClose={onClose} footer={footer}>
      <div className="space-y-4">
        <div role="radiogroup" aria-label="Cara mula" className="grid grid-cols-2 gap-2">
          {(['blank', 'clone'] as const).map(m => (
            <button key={m} type="button" role="radio" aria-checked={form.mode === m} onClick={() => set('mode')(m)}
              className={cx('min-h-14 rounded-ih-md border px-3 py-2 text-left', form.mode === m ? 'border-kontrak bg-kontrak-tint text-kontrak' : 'border-line-strong bg-surface text-ink')}>
              <span className="block font-bold text-[15px]">{m === 'blank' ? 'Kosong' : 'Salin daripada kontrak'}</span>
              <span className="block text-[13px] text-muted">{m === 'blank' ? 'Import BQ Excel selepas ini' : 'Buku kadar + panel disalin'}</span>
            </button>
          ))}
        </div>
        {form.mode === 'clone' && (
          <Field label="Salin daripada" htmlFor="ct-source" required error={shownErrors.source}
            hint={source ? `Buku kadar v${source.stats?.currentVersion ?? '-'} dan ${source.stats?.panelSize ?? 0} syarikat panel akan disalin sebagai versi 1.` : undefined}>
            <Select id="ct-source" value={form.source} onChange={e => set('source')(e.target.value)} invalid={!!shownErrors.source}>
              <option value="">Pilih kontrak…</option>
              {contracts.map(c => <option key={c.id} value={c.id}>{c.code} · {c.status}</option>)}
            </Select>
          </Field>
        )}
        <Field label="No. sebutharga" htmlFor="ct-code" required error={shownErrors.code}>
          <Input id="ct-code" value={form.code} onChange={e => set('code')(e.target.value)} invalid={!!shownErrors.code} autoComplete="off" placeholder="MPS/SH/118/26" />
        </Field>
        <Field label="Tajuk" htmlFor="ct-title" required error={shownErrors.title}>
          <Input id="ct-title" value={form.title} onChange={e => set('title')(e.target.value)} invalid={!!shownErrors.title} placeholder="Panel Longkang 2027" />
        </Field>
        <Field label="Jenis" htmlFor="ct-kind" hint={form.kind === 'PANEL' ? 'Kontrak panel: banyak syarikat, banyak projek.' : 'Kontrak berasingan: kadar sendiri, panel kecil, biasanya satu projek.'}>
          <Select id="ct-kind" value={form.kind} onChange={e => set('kind')(e.target.value as Contract['kind'])}>
            <option value="PANEL">Panel</option>
            <option value="STANDALONE">Berasingan (standalone)</option>
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sah dari" htmlFor="ct-from"><Input id="ct-from" type="date" value={form.validFrom} onChange={e => set('validFrom')(e.target.value)} /></Field>
          <Field label="Sah hingga" htmlFor="ct-to" error={shownErrors.validTo}><Input id="ct-to" type="date" value={form.validTo} onChange={e => set('validTo')(e.target.value)} invalid={!!shownErrors.validTo} /></Field>
        </div>
        <Field label="Had nilai kerja setiap syarikat" htmlFor="ct-cap" error={shownErrors.cap} hint="Amaran sahaja, tidak menyekat lantikan.">
          <Input id="ct-cap" inputMode="decimal" value={form.cap} onChange={e => set('cap')(e.target.value)} invalid={!!shownErrors.cap} suffix="RM" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Bil. mesyuarat" htmlFor="ct-meet"><Input id="ct-meet" value={form.meetingNumber} onChange={e => set('meetingNumber')(e.target.value)} placeholder="Bil. 9/2026" /></Field>
          <Field label="Tarikh mesyuarat" htmlFor="ct-meetd"><Input id="ct-meetd" type="date" value={form.meetingDate} onChange={e => set('meetingDate')(e.target.value)} /></Field>
        </div>
        <p className="text-[13px] text-muted">Kontrak baharu bermula sebagai <b>DRAF</b>. Ia tidak boleh dipilih untuk projek sehingga buku kadarnya diterbitkan dan kontrak diaktifkan.</p>
        {serverError && <Notice tone="error" testId="create-error">{serverError}</Notice>}
      </div>
    </Sheet>
  );
};

export default CreateContractSheet;
