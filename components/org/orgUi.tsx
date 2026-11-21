import React from 'react';
import { History, Save } from 'lucide-react';
import { Button, Card, Timeline } from '../ui';
import { cx } from '../ui/cx';
import { useChangeLog } from '../../hooks/useChangeLog';
import type { ChangeLogEntry } from '../../types';

// Same control styling as components/ui Field inputs (16px on phones, 48px tall), for multi-line text.
export const TEXTAREA = 'w-full bg-surface border border-line-strong rounded-ih-md px-3.5 py-3 text-base md:text-[15px] leading-relaxed text-ink placeholder:text-muted-faint focus:outline-none focus:border-emerald focus:ring-2 focus:ring-emerald/25';

export const dmy = (iso: string): string => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '-');

export const isoDay = (offsetDays = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const stamp = (at: string): string =>
  new Date(at).toLocaleString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

interface SectionCardProps {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({ id, eyebrow, title, description, children, className }) => (
  <Card as="section" padding="lg" aria-labelledby={`${id}-title`} className={cx('space-y-5', className)}>
    <header className="space-y-1">
      <p className="ih-eyebrow text-muted">{eyebrow}</p>
      <h2 id={`${id}-title`} className="text-title md:text-display-m font-display text-ink">{title}</h2>
      <p className="text-[15px] text-muted max-w-2xl">{description}</p>
    </header>
    {children}
  </Card>
);

interface SaveBarProps {
  dirty: boolean;
  saving: boolean;
  savedAt: string | null;
  error: string | null;
  onSave: () => void;
  label?: string;
  testId?: string;
}

/** One primary action per section; the status line says whether the change is recorded yet. */
export const SaveBar: React.FC<SaveBarProps> = ({ dirty, saving, savedAt, error, onSave, label = 'Simpan', testId }) => (
  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-line pt-4">
    <p role="status" className={cx('text-sm', error ? 'text-danger font-bold' : dirty ? 'text-amber font-bold' : 'text-muted')}>
      {error ?? (dirty ? 'Ada perubahan belum disimpan.' : savedAt ? `Disimpan ${savedAt}. Direkod dalam log perubahan.` : 'Tiada perubahan.')}
    </p>
    <Button variant="primary" icon={Save} onClick={onSave} disabled={!dirty || saving} data-testid={testId}>
      {saving ? 'Menyimpan…' : label}
    </Button>
  </div>
);

const toItem = (e: ChangeLogEntry) => ({
  id: String(e.id),
  at: stamp(e.at),
  title: e.message ?? e.action,
  actor: e.userName ?? undefined,
  tone: 'emerald' as const,
});

interface SectionHistoryProps {
  entity: ChangeLogEntry['entity'];
  entityId?: string;
  limit?: number;
}

/** The last few recorded changes to this section, newest first. */
export const SectionHistory: React.FC<SectionHistoryProps> = ({ entity, entityId, limit = 5 }) => {
  const { data, isLoading } = useChangeLog({ entity, entityId, limit });
  return (
    <div className="rounded-ih-md border border-line bg-paper p-4" data-testid={`history-${entityId ?? entity}`}>
      <p className="ih-eyebrow text-muted flex items-center gap-1.5 mb-3"><History className="w-4 h-4" aria-hidden /> Sejarah perubahan</p>
      {isLoading ? <p className="text-sm text-muted">Memuat…</p>
        : data && data.length > 0 ? <Timeline items={data.map(toItem)} />
          : <p className="text-sm text-muted">Belum ada perubahan direkod. Nilai semasa ialah nilai asal sistem.</p>}
    </div>
  );
};

/** Wraps a save call with the status the SaveBar shows. */
export function useSaveState() {
  const [saving, setSaving] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const run = async (fn: () => Promise<unknown>) => {
    setSaving(true);
    setError(null);
    try {
      await fn();
      setSavedAt(new Date().toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan. Cuba lagi.');
    } finally {
      setSaving(false);
    }
  };
  return { saving, savedAt, error, run };
}
