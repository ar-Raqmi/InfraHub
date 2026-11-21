import React from 'react';
import { Trash2, ChevronDown } from 'lucide-react';
import { BulletinItem, formatDate } from '../../types';

interface MobileBulletinsProps {
  bulletins: BulletinItem[];
  userId: number;
  isAdmin: boolean;
  onRead: (item: BulletinItem) => void;
  onDelete: (item: BulletinItem) => void;
}

// Bulletins are pasted rich HTML with inline font sizes; the phone excerpt shows
// plain text only and the full HTML stays in the existing detail modal. A space
// goes before each block/line break so "<h3>Tajuk</h3>Isi" doesn't read "TajukIsi".
const plainText = (html: string) => {
  const spaced = (html || '').replace(/<(br|\/p|\/div|\/h[1-6]|\/li)\b/gi, ' <$1');
  return (new DOMParser().parseFromString(spaced, 'text/html').body.textContent || '').replace(/\s+/g, ' ').trim();
};

const Byline: React.FC<{ item: BulletinItem; unread: boolean }> = ({ item, unread }) => (
  <p className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${unread ? 'text-danger' : 'text-muted'}`}>
    {unread && <span className="w-2 h-2 rounded-full bg-danger shrink-0" />}
    <span>{formatDate(item.date)}</span>
    <span aria-hidden>·</span>
    <span className="truncate">{item.author}</span>
  </p>
);

const reactionSummary = (item: BulletinItem) =>
  Object.entries(item.reactions || {}).filter(([, ids]) => ids.length > 0).map(([emoji, ids]) => `${emoji} ${ids.length}`).join('  ');

const MobileBulletins: React.FC<MobileBulletinsProps> = ({ bulletins, userId, isAdmin, onRead, onDelete }) => {
  const [latest, ...others] = bulletins;
  const isUnread = (item: BulletinItem) => !item.readBy?.includes(userId);

  return (
    <div className={`md:hidden bg-surface rounded-ih-lg border p-4 ${isUnread(latest) ? 'border-danger-line' : 'border-line'}`}>
      <div className="flex items-start justify-between gap-2">
        <Byline item={latest} unread={isUnread(latest)} />
        {isAdmin && (
          <button onClick={() => onDelete(latest)} aria-label="Padam buletin" className="w-11 h-11 -mt-3 -mr-2 shrink-0 flex items-center justify-center rounded-ih-md text-muted active:bg-danger-tint active:text-danger">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      <p className="clamp-3 text-sm text-ink leading-relaxed break-words">{plainText(latest.content) || 'Tiada kandungan...'}</p>
      <div className="flex items-center justify-between gap-3 mt-3">
        <span className="text-xs text-muted min-w-0 truncate">{reactionSummary(latest) || 'Tiada reaksi'}</span>
        <button onClick={() => onRead(latest)} className={`h-11 px-4 shrink-0 rounded-ih-md text-sm font-bold border ${isUnread(latest) ? 'bg-ink text-paper border-ink' : 'bg-surface text-ink border-line-strong'}`}>
          {isUnread(latest) ? 'Baca penuh' : 'Lihat'}
        </button>
      </div>

      {others.length > 0 && (
        <details className="group mt-3 border-t border-line">
          <summary className="list-none flex items-center justify-between min-h-[44px] text-sm font-bold text-ink cursor-pointer">
            Buletin lain ({others.length})
            <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="divide-y divide-line">
            {others.map(item => (
              <button key={item.id} onClick={() => onRead(item)} className="w-full text-left py-3 min-h-[44px]">
                <Byline item={item} unread={isUnread(item)} />
                <p className="clamp-2 text-sm text-ink-soft mt-1 break-words">{plainText(item.content) || 'Tiada kandungan...'}</p>
              </button>
            ))}
          </div>
        </details>
      )}
    </div>
  );
};

export default MobileBulletins;
