import React from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Trash2, X } from 'lucide-react';
import { BulletinItem, User, formatDate } from '../../types';
import { Button, IconButton } from '../ui';
import { BulletinAvatar, REACTION_EMOJIS } from './BulletinCard';

const Backdrop: React.FC<{ onClose: () => void; children: React.ReactNode; z: string }> = ({ onClose, children, z }) =>
  createPortal(
    <div className={`fixed inset-0 ${z} flex items-center justify-center p-4 bg-ink/60 animate-fade-in`} onClick={onClose}>
      <div className="bg-surface border border-line rounded-ih-xl max-w-xl w-full max-h-[90vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>,
    document.body,
  );

interface DetailProps {
  item: BulletinItem;
  author?: User;
  userId: number;
  onClose: () => void;
  onToggleReaction: (emoji: string) => void;
}

/** Full bulletin with reactions (opened from a card; marks it read in the parent). */
export const BulletinDetail: React.FC<DetailProps> = ({ item, author, userId, onClose, onToggleReaction }) => (
  <Backdrop onClose={onClose} z="z-[9999]">
    <div className="p-6 md:p-8 space-y-5">
      <header className="flex items-center justify-between gap-3">
        <h3 className="font-display text-display-m text-ink">Buletin</h3>
        <IconButton icon={X} label="Tutup" onClick={onClose} />
      </header>
      <div className="flex flex-wrap gap-2 text-xs font-bold text-muted">
        <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-line bg-paper ih-num"><Calendar className="w-3.5 h-3.5" /> {formatDate(item.date)}</span>
        <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-line bg-paper"><BulletinAvatar author={item.author} user={author} className="w-5 h-5 text-[9px]" /> {item.author}</span>
      </div>
      <div className="bg-paper border border-line rounded-ih-lg p-5 text-ink leading-relaxed text-lg whitespace-pre-wrap bulletin-content" dangerouslySetInnerHTML={{ __html: item.content }} />
      <div className="flex flex-wrap gap-2">
        {REACTION_EMOJIS.map(emoji => {
          const count = item.reactions?.[emoji]?.length || 0;
          const mine = item.reactions?.[emoji]?.includes(userId);
          return (
            <button key={emoji} type="button" onClick={() => onToggleReaction(emoji)} className={`h-11 px-4 rounded-full border text-lg inline-flex items-center gap-2 ${mine ? 'bg-emerald-tint border-emerald' : 'bg-surface border-line'}`}>
              <span>{emoji}</span>{count > 0 && <span className="text-sm font-bold ih-num">{count}</span>}
            </button>
          );
        })}
      </div>
      <Button variant="ink" block onClick={onClose}>Tutup paparan</Button>
    </div>
  </Backdrop>
);

/** Confirm before a bulletin is removed for everyone. */
export const BulletinDeleteDialog: React.FC<{ onCancel: () => void; onConfirm: () => void }> = ({ onCancel, onConfirm }) => (
  <Backdrop onClose={onCancel} z="z-[10000]">
    <div className="p-6 md:p-8 text-center">
      <span className="w-14 h-14 mx-auto mb-4 rounded-full bg-danger-tint border border-danger-line inline-flex items-center justify-center text-danger"><Trash2 className="w-6 h-6" /></span>
      <h3 className="font-display text-display-m text-ink mb-2">Padam buletin?</h3>
      <p className="text-muted text-sm mb-6">Buletin ini akan dibuang daripada papan pemuka semua pengguna dan tidak boleh dipulihkan.</p>
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onCancel}>Batal</Button>
        <Button variant="danger" icon={Trash2} className="flex-1" onClick={onConfirm}>Ya, padam</Button>
      </div>
    </div>
  </Backdrop>
);
