import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button, Field, Select } from '../ui';
import { cx } from '../ui/cx';
import type { OrgDocs } from './orgDocs';
import { DOC_TEXT_GROUPS, PLACEHOLDER_HELP, defaultDocTexts, type DocTextGroup, type DocTexts } from './orgDefaults';
import { SaveBar, SectionCard, SectionHistory, TEXTAREA, useSaveState } from './orgUi';
import { fillTemplate, placeholdersIn } from './template';

// Illustrative values for the live preview; real documents fill these from the project.
const SAMPLE: Record<string, string> = {
  gred: 'G1', tarikh_siap: '12 MAC 2026', tarikh_mula_dlp: '13 MAC 2026', tarikh_tamat_dlp: '13 SEPTEMBER 2026',
  tarikh_serah_tapak: '02/03/2026', tahun: '2026', pja: 'PJA01', tarikh_mula: '2 Mac 2026', tarikh_tamat: '20 Mac 2026',
  tarikh_sst: '2 Mac 2026', kadar_lad: 'RM20.00', tarikh_siap_kontrak: '30 April 2026', had_lad: '20,000.00',
  kadar_lad_rata: '20.00', blr: '6.65', hari_tangguh: '14', hari_mula_denda: '15', kadar_loc: '100.00',
  nama_syarikat: 'SYARIKAT 01 ENTERPRISE', no_sebutharga: 'SH/01/2026', no_fail: 'FAIL/700-6/1', nama_projek: 'KERJA-KERJA MEMBAIKI LONGKANG',
};

interface FieldEditorProps {
  group: DocTextGroup;
  field: { id: string; label: string; multiline?: boolean };
  value: string;
  onChange: (value: string) => void;
  vars: Record<string, string>;
  active: boolean;
  onFocus: () => void;
}

const FieldEditor: React.FC<FieldEditorProps> = ({ group, field, value, onChange, vars, active, onFocus }) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const original = defaultDocTexts(group.key)[field.id] ?? '';
  const unknown = placeholdersIn(value).filter((p) => !group.placeholders.includes(p));
  const id = `txt-${group.key}-${field.id}`.replace(/\./g, '-');

  // Grow with the text so a wrapped heading is never clipped on a phone. The runtime Tailwind styles land
  // after mount and change the width, so the height is re-measured whenever the box is resized too.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight + 2}px`;
    };
    fit();
    let lastWidth = el.clientWidth;
    const observer = new ResizeObserver(() => {
      if (el.clientWidth !== lastWidth) { lastWidth = el.clientWidth; fit(); }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  const insert = (slot: string) => {
    const el = ref.current;
    const token = `{{${slot}}}`;
    const at = el ? el.selectionStart : value.length;
    const end = el ? el.selectionEnd : value.length;
    onChange(value.slice(0, at) + token + value.slice(end));
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(at + token.length, at + token.length); });
  };

  return (
    <div className={cx('rounded-ih-md border p-4 space-y-3 bg-surface', active ? 'border-emerald' : 'border-line')}>
      <Field label={field.label} htmlFor={id} error={unknown.length ? `Ruang tidak dikenali: ${unknown.map((u) => `{{${u}}}`).join(', ')}. Ia akan dicetak seperti ditulis.` : undefined}>
        <textarea ref={ref} id={id} data-field={field.id} rows={field.multiline ? 3 : 1} value={value}
          className={cx(TEXTAREA, 'resize-none overflow-hidden', !field.multiline && 'min-h-12 py-2.5')} onFocus={onFocus} onChange={(e) => onChange(e.target.value)} />
      </Field>
      {active && <div className="flex flex-wrap gap-1.5" role="group" aria-label="Sisip ruang isian">
        {group.placeholders.map((slot) => (
          <button key={slot} type="button" title={PLACEHOLDER_HELP[slot]} onClick={() => insert(slot)}
            className="min-h-11 md:min-h-8 px-2.5 rounded-ih-sm border border-line-strong bg-paper text-[13px] font-mono text-ink-soft hover:border-ink">
            {`{{${slot}}}`}
          </button>
        ))}
      </div>}
      <div className="rounded-ih-sm bg-paper border border-line px-3 py-2">
        <p className="ih-eyebrow text-muted mb-1">Pratonton</p>
        <p className="text-sm text-ink whitespace-pre-line" data-testid={`preview-${field.id}`}>{fillTemplate(value, vars) || '—'}</p>
      </div>
      {value !== original && (
        <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => onChange(original)}>Pulihkan teks asal</Button>
      )}
    </div>
  );
};

interface TextsSectionProps {
  org: OrgDocs;
  onSave: (key: string, texts: DocTexts) => Promise<unknown>;
}

const currentTexts = (org: OrgDocs, group: DocTextGroup): DocTexts =>
  Object.fromEntries(group.fields.map((f) => [f.id, org.raw(group.key, f.id)]));

const TextsSection: React.FC<TextsSectionProps> = ({ org, onSave }) => {
  const [groupKey, setGroupKey] = useState(() => new URLSearchParams(window.location.search).get('dok') ?? DOC_TEXT_GROUPS[0].key);
  const group = DOC_TEXT_GROUPS.find((g) => g.key === groupKey) ?? DOC_TEXT_GROUPS[0];
  const saved = currentTexts(org, group);
  const savedJson = JSON.stringify(saved);
  const [draft, setDraft] = useState<DocTexts>(saved);
  const [activeField, setActiveField] = useState<string | null>(null);
  const save = useSaveState();
  const vars = useMemo(() => ({ ...SAMPLE, ...(org.orgVars() as Record<string, string>) }), [org]);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when the document or its saved texts change
  useEffect(() => setDraft(JSON.parse(savedJson)), [groupKey, savedJson]);

  const dirty = JSON.stringify(draft) !== savedJson;
  return (
    <SectionCard id="teks" eyebrow="Teks dokumen" title="Teks yang dicetak"
      description="Setiap tajuk dan perenggan boleh diubah. Ruang seperti {{nama_syarikat}} atau {{no_sebutharga}} diisi daripada projek semasa dicetak. Klik pada satu teks untuk melihat butang ruang yang boleh disisip.">
      <Field label="Dokumen" htmlFor="doc-group" hint={group.description}>
        <Select id="doc-group" value={group.key} onChange={(e) => setGroupKey(e.target.value)} data-testid="doc-group">
          {DOC_TEXT_GROUPS.map((g) => <option key={g.key} value={g.key}>{g.title}</option>)}
        </Select>
      </Field>
      <div className="space-y-3">
        {group.fields.map((field) => (
          <FieldEditor key={`${group.key}-${field.id}`} group={group} field={field} value={draft[field.id] ?? ''} vars={vars}
            active={activeField === field.id} onFocus={() => setActiveField(field.id)}
            onChange={(value) => setDraft({ ...draft, [field.id]: value })} />
        ))}
      </div>
      <SaveBar dirty={dirty} saving={save.saving} savedAt={save.savedAt} error={save.error}
        onSave={() => save.run(() => onSave(group.key, draft))} label="Simpan teks" testId="save-teks" />
      <SectionHistory entity="config" entityId={group.key} />
    </SectionCard>
  );
};

export default TextsSection;
