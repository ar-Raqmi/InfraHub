import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { Button, Card, Field, Input } from '../ui';
import { useContracts } from '../../hooks/useContracts';
import type { Contract } from '../../types';
import { errorText, shortDate } from './format';
import { Notice } from './bits';

type Form = { title: string; validFrom: string; validTo: string; cap: string; meetingNumber: string; meetingDate: string; notes: string };

const fromContract = (c: Contract): Form => ({
  title: c.title, validFrom: c.validFrom ?? '', validTo: c.validTo ?? '', cap: c.companyCap != null ? String(c.companyCap) : '',
  meetingNumber: c.meetingNumber ?? '', meetingDate: c.meetingDate ?? '', notes: c.notes ?? '',
});

/** Editable contract fields (PATCH /contracts/:id); every save is logged with a before/after diff. */
const ContractDetailsForm: React.FC<{ contract: Contract; readOnly: boolean }> = ({ contract, readOnly }) => {
  const { updateContract } = useContracts();
  // null until the officer edits, so a background refetch never overwrites typing.
  const [edited, setEdited] = useState<Form | null>(null);
  const f = edited ?? fromContract(contract);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setEdited({ ...f, [k]: e.target.value });
  const invalidDates = !!(f.validFrom && f.validTo && f.validTo < f.validFrom);

  const save = async () => {
    if (!f.title.trim()) { setMsg({ ok: false, text: 'Tajuk tidak boleh kosong.' }); return; }
    if (invalidDates) return;
    try {
      await updateContract.mutateAsync({ id: contract.id, body: {
        title: f.title.trim(), valid_from: f.validFrom || null, valid_to: f.validTo || null, company_cap: f.cap ? Number(f.cap) : null,
        meeting_number: f.meetingNumber.trim() || null, meeting_date: f.meetingDate || null, notes: f.notes.trim() || null,
      } });
      setEdited(null);
      setMsg({ ok: true, text: 'Butiran disimpan dan direkod dalam log kontrak.' });
    } catch (err) {
      setMsg({ ok: false, text: errorText(err) });
    }
  };

  return (
    <Card className="max-w-3xl space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="No. sebutharga" htmlFor="cd-code" hint="Kod tidak boleh diubah selepas dicipta."><Input id="cd-code" value={contract.code} disabled /></Field>
        <Field label="Tajuk" htmlFor="cd-title" required><Input id="cd-title" value={f.title} onChange={set('title')} disabled={readOnly} /></Field>
        <Field label="Sah dari" htmlFor="cd-from"><Input id="cd-from" type="date" value={f.validFrom} onChange={set('validFrom')} disabled={readOnly} /></Field>
        <Field label="Sah hingga" htmlFor="cd-to" error={invalidDates ? 'Tarikh tamat mesti selepas tarikh mula.' : undefined}><Input id="cd-to" type="date" value={f.validTo} onChange={set('validTo')} disabled={readOnly} invalid={invalidDates} /></Field>
        <Field label="Had nilai kerja setiap syarikat" htmlFor="cd-cap" hint="Amaran sahaja."><Input id="cd-cap" inputMode="decimal" suffix="RM" value={f.cap} onChange={set('cap')} disabled={readOnly} /></Field>
        <Field label="Bil. mesyuarat" htmlFor="cd-meet"><Input id="cd-meet" value={f.meetingNumber} onChange={set('meetingNumber')} disabled={readOnly} /></Field>
        <Field label="Tarikh mesyuarat" htmlFor="cd-meetd" hint={f.meetingDate && !/^\d{4}-\d{2}-\d{2}$/.test(f.meetingDate) ? `Rekod lama: ${f.meetingDate}` : undefined}>
          <Input id="cd-meetd" type="date" value={/^\d{4}-\d{2}-\d{2}$/.test(f.meetingDate) ? f.meetingDate : ''} onChange={set('meetingDate')} disabled={readOnly} />
        </Field>
      </div>
      <Field label="Catatan" htmlFor="cd-notes">
        <textarea id="cd-notes" value={f.notes} onChange={set('notes')} disabled={readOnly} rows={3} className="w-full rounded-ih-md border border-line-strong bg-surface px-3.5 py-2.5 text-base md:text-[15px] text-ink disabled:bg-paper-deep" />
      </Field>
      <p className="text-[13px] text-muted ih-num">Dicipta {shortDate(contract.createdAt)}{contract.activatedAt && ` · diaktifkan ${shortDate(contract.activatedAt)}`}{contract.closedAt && ` · ditutup ${shortDate(contract.closedAt)}`}</p>
      {msg && <Notice tone={msg.ok ? 'ok' : 'error'}>{msg.text}</Notice>}
      {!readOnly && <Button icon={Save} onClick={save} disabled={updateContract.isPending}>{updateContract.isPending ? 'Menyimpan…' : 'Simpan butiran'}</Button>}
    </Card>
  );
};

export default ContractDetailsForm;
