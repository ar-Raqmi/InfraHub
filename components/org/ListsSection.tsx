import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react';
import { Button, Chip, Field, IconButton, Input, Tabs } from '../ui';
import { cx } from '../ui/cx';
import { useLookups } from '../../hooks/useOrgConfig';
import type { LookupValue } from '../../types';
import { LOOKUP_LISTS } from './orgDefaults';
import { SaveBar, SectionCard, SectionHistory, useSaveState } from './orgUi';

interface Row extends LookupValue {
  /** Not saved yet: the only rows that may be removed. Saved codes stay forever so old projects keep resolving. */
  isNew?: boolean;
}

const normalise = (rows: Row[]): LookupValue[] =>
  rows.map((r, i) => ({ code: r.code, label: r.label.trim() || r.code, sortIndex: i, active: r.active }));

interface ListEditorProps {
  list: string;
  onSave: (list: string, values: LookupValue[]) => Promise<unknown>;
}

const ListEditor: React.FC<ListEditorProps> = ({ list, onSave }) => {
  const { values, isLoading } = useLookups(list);
  const savedJson = JSON.stringify(normalise(values));
  const [rows, setRows] = useState<Row[]>(values);
  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');
  const save = useSaveState();

  // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when the saved list changes
  useEffect(() => setRows(JSON.parse(savedJson)), [savedJson]);

  const move = (i: number, by: number) => {
    const next = [...rows];
    [next[i], next[i + by]] = [next[i + by], next[i]];
    setRows(next);
  };
  const patchRow = (i: number, change: Partial<Row>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...change } : r)));
  const newCode = code.trim();
  const duplicate = rows.some((r) => r.code.toLowerCase() === newCode.toLowerCase());
  const add = () => {
    setRows([...rows, { code: newCode, label: label.trim() || newCode, sortIndex: rows.length, active: true, isNew: true }]);
    setCode('');
    setLabel('');
  };

  const dirty = JSON.stringify(normalise(rows)) !== savedJson;
  return (
    <div className="space-y-4">
      {isLoading ? <p className="text-muted">Memuat senarai…</p> : rows.length === 0 ? (
        <p className="rounded-ih-md border border-dashed border-line-strong p-4 text-muted">Senarai ini masih kosong. Tambah nilai pertama di bawah.</p>
      ) : (
        <ol className="divide-y divide-line rounded-ih-md border border-line bg-surface" data-testid={`lookup-${list}`}>
          {rows.map((row, i) => (
            <li key={row.code} className={cx('flex flex-wrap items-center gap-x-3 gap-y-2 p-3', !row.active && 'bg-paper')}>
              <span className="w-7 text-sm text-muted ih-num text-right">{i + 1}</span>
              <div className="min-w-0 flex-1 basis-56">
                <label htmlFor={`lk-${list}-${i}`} className="sr-only">Label untuk kod {row.code}</label>
                <Input id={`lk-${list}-${i}`} value={row.label} onChange={(e) => patchRow(i, { label: e.target.value })} />
                <p className="mt-1 text-[13px] text-muted">Kod <span className="font-mono text-ink-soft">{row.code}</span>{row.isNew && ' · baharu'}</p>
              </div>
              <div className="flex items-center gap-1 ml-auto">
                <button type="button" onClick={() => patchRow(i, { active: !row.active })} aria-pressed={row.active}
                  className="min-h-11 px-2 rounded-ih-sm hover:bg-paper-deep">
                  {row.active ? <Chip tone="emerald" dot>Aktif</Chip> : <Chip tone="neutral">Tidak aktif</Chip>}
                </button>
                <IconButton icon={ArrowUp} label={`Naikkan ${row.label}`} onClick={() => move(i, -1)} disabled={i === 0} />
                <IconButton icon={ArrowDown} label={`Turunkan ${row.label}`} onClick={() => move(i, 1)} disabled={i === rows.length - 1} />
                {row.isNew && <IconButton icon={X} label={`Buang ${row.code}`} onClick={() => setRows(rows.filter((_, j) => j !== i))} />}
              </div>
            </li>
          ))}
        </ol>
      )}
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] sm:items-end rounded-ih-md border border-line bg-paper p-4">
        <Field label="Kod baharu" htmlFor={`new-code-${list}`} hint="Kekal selama-lamanya; projek menyimpan kod ini." error={newCode && duplicate ? 'Kod ini sudah ada.' : undefined}>
          <Input id={`new-code-${list}`} value={code} onChange={(e) => setCode(e.target.value)} />
        </Field>
        <Field label="Label" htmlFor={`new-label-${list}`} hint="Teks yang dilihat pengguna; boleh diubah bila-bila.">
          <Input id={`new-label-${list}`} value={label} onChange={(e) => setLabel(e.target.value)} />
        </Field>
        <Button variant="outline" icon={Plus} onClick={add} disabled={!newCode || duplicate}>Tambah</Button>
      </div>
      <SaveBar dirty={dirty} saving={save.saving} savedAt={save.savedAt} error={save.error}
        onSave={() => save.run(() => onSave(list, normalise(rows)))} label="Simpan senarai" testId={`save-lookup-${list}`} />
      <SectionHistory entity="lookup" entityId={list} />
    </div>
  );
};

interface ListsSectionProps {
  onSave: (list: string, values: LookupValue[]) => Promise<unknown>;
}

const ListsSection: React.FC<ListsSectionProps> = ({ onSave }) => {
  const [list, setList] = useState(LOOKUP_LISTS[0].code);
  const meta = LOOKUP_LISTS.find((l) => l.code === list) ?? LOOKUP_LISTS[0];
  return (
    <SectionCard id="senarai" eyebrow="Senarai" title="Senarai pilihan"
      description="Nilai untuk menu BP, Zon, Mukim dan unit. Ubah label, susun semula atau nyahaktif; kod tidak berubah supaya projek lama kekal betul.">
      <Tabs label="Pilih senarai" value={list} onChange={setList} items={LOOKUP_LISTS.map((l) => ({ id: l.code, label: l.tab }))} />
      <div>
        <h3 className="text-title font-display text-ink">{meta.title}</h3>
        <p className="text-sm text-muted">{meta.help}</p>
      </div>
      <ListEditor key={list} list={list} onSave={onSave} />
    </SectionCard>
  );
};

export default ListsSection;
