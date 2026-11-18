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
  <p className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${unread ? 'text-red-600' : 'text-slate-400'}`}>
    {unread && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />}
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
    <div className={`md:hidden bg-white rounded-2xl border p-4 ${isUnread(latest) ? 'border-red-200' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between gap-2">
        <Byline item={latest} unread={isUnread(latest)} />
        {isAdmin && (
          <button onClick={() => onDelete(latest)} aria-label="Padam buletin" className="w-11 h-11 -mt-3 -mr-2 shrink-0 flex items-center justify-center rounded-xl text-slate-400 active:bg-red-50 active:text-red-500">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      <p className="clamp-3 text-sm font-medium text-slate-700 leading-relaxed break-words">{plainText(latest.content) || 'Tiada kandungan...'}</p>
      <div className="flex items-center justify-between gap-3 mt-3">
        <span className="text-xs text-slate-500 min-w-0 truncate">{reactionSummary(latest) || 'Tiada reaksi'}</span>
        <button onClick={() => onRead(latest)} className={`h-11 px-4 shrink-0 rounded-xl text-sm font-bold border ${isUnread(latest) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200'}`}>
          {isUnread(latest) ? 'Baca Penuh' : 'Lihat'}
        </button>
      </div>

      {others.length > 0 && (
        <details className="group mt-3 border-t border-slate-100">
          <summary className="list-none flex items-center justify-between min-h-[44px] text-sm font-bold text-slate-600 cursor-pointer">
            Buletin lain ({others.length})
            <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="divide-y divide-slate-100">
            {others.map(item => (
              <button key={item.id} onClick={() => onRead(item)} className="w-full text-left py-3 min-h-[44px]">
                <Byline item={item} unread={isUnread(item)} />
                <p className="clamp-2 text-sm text-slate-700 mt-1 break-words">{plainText(item.content) || 'Tiada kandungan...'}</p>
              </button>
            ))}
          </div>
        </details>
      )}
    </div>
  );
};

export default MobileBulletins;
