import React, { useRef, useState } from 'react';
import { Megaphone } from 'lucide-react';
import { User, Role, formatDate } from '../../types';
import { Button, Card } from '../ui';

interface BulletinComposerProps {
  user: User;
  onCancel: () => void;
  onPublish: (html: string) => Promise<void>;
}

const COLOURS = [
  { value: '#ef4444', label: 'Merah', cls: 'bg-red-500' },
  { value: '#3b82f6', label: 'Biru', cls: 'bg-blue-500' },
  { value: '#10b981', label: 'Hijau', cls: 'bg-emerald-500' },
  { value: '#000000', label: 'Hitam', cls: 'bg-black' },
];

const toolClass = 'min-w-11 h-11 px-3 inline-flex items-center justify-center bg-surface border border-line-strong rounded-ih-sm text-sm font-bold text-ink hover:border-ink';

export const authorLabel = (user: User) => `${user.fullName.split(' ')[0]} (${user.role === Role.ADMIN ? 'PT' : 'JR'})`;

/** Rich-text bulletin editor for PT/Jurutera (same execCommand formatting as before the re-skin). */
const BulletinComposer: React.FC<BulletinComposerProps> = ({ user, onCancel, onPublish }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState('');

  const format = (command: string, value?: string) => {
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(command, false, value);
    if (editorRef.current) setHtml(editorRef.current.innerHTML);
  };

  const empty = !html || html === '<br>';

  return (
    <Card padding="lg" className="animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <p className="ih-eyebrow text-emerald-deep">Buletin baharu</p>
          <h3 className="font-display text-title text-ink">Kepada semua pengguna</h3>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 bg-paper p-1.5 rounded-ih-md border border-line">
          <button type="button" onClick={() => format('bold')} className={toolClass} title="Tebal">B</button>
          <button type="button" onClick={() => format('italic')} className={`${toolClass} italic`} title="Condong">I</button>
          <button type="button" onClick={() => format('fontSize', '5')} className={toolClass}>Besar</button>
          <button type="button" onClick={() => format('fontSize', '3')} className={toolClass}>Kecil</button>
          {COLOURS.map(c => (
            <button key={c.value} type="button" onClick={() => format('foreColor', c.value)} title={c.label} aria-label={`Warna ${c.label}`} className="w-11 h-11 inline-flex items-center justify-center">
              <span className={`w-6 h-6 rounded-full border-2 border-surface ring-1 ring-line-strong ${c.cls}`} />
            </button>
          ))}
        </div>
      </div>
      <div className="relative bg-surface border border-line-strong rounded-ih-md focus-within:border-emerald">
        <div
          ref={editorRef}
          contentEditable
          onInput={(e) => setHtml(e.currentTarget.innerHTML)}
          className="min-h-[150px] p-4 outline-none text-ink leading-relaxed text-base bulletin-content"
          aria-label="Kandungan buletin"
        />
        {empty && <p className="absolute top-4 left-4 pointer-events-none text-muted-faint">Taip maklumat di sini. Gunakan butang di atas untuk format teks.</p>}
        <p className="flex justify-between px-4 py-2 border-t border-line text-xs text-muted">
          <span className="font-bold">{authorLabel(user)}</span>
          <span className="ih-num">{formatDate(new Date().toISOString())}</span>
        </p>
      </div>
      <div className="flex gap-3 mt-4">
        <Button variant="outline" onClick={onCancel} className="flex-1">Batal</Button>
        <Button variant="primary" icon={Megaphone} disabled={empty} onClick={() => onPublish(html)} className="flex-[2]">
          Siarkan sekarang
        </Button>
      </div>
    </Card>
  );
};

export default BulletinComposer;
