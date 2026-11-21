import React from 'react';
import { Trash2 } from 'lucide-react';
import { BulletinItem, User, formatDate } from '../../types';
import { IconButton } from '../ui';

export const REACTION_EMOJIS = ['👍', '😊', '😠', '❤️', '🔥', '👏'];

/** Avatar initial or photo for a bulletin author ("Nama (PT)" / "Nama (JR)"). */
export const BulletinAvatar: React.FC<{ author: string; user?: User; className?: string }> = ({ author, user, className = 'w-6 h-6 text-[10px]' }) => (
  <span className={`rounded-ih-sm bg-paper-deep border border-line inline-flex items-center justify-center font-bold text-muted overflow-hidden shrink-0 ${className}`}>
    {user?.avatarUrl ? <img src={user.avatarUrl} alt={author} className="w-full h-full object-cover" /> : author.charAt(0)}
  </span>
);

interface BulletinCardProps {
  item: BulletinItem;
  author?: User;
  userId: number;
  isAdmin: boolean;
  onRead: () => void;
  onDelete: () => void;
  onToggleReaction: (emoji: string) => void;
}

/** Desktop bulletin card for the Pusat kawalan side column. */
const BulletinCard: React.FC<BulletinCardProps> = ({ item, author, userId, isAdmin, onRead, onDelete, onToggleReaction }) => {
  const isRead = item.readBy?.includes(userId) || false;
  const reacted = REACTION_EMOJIS.filter(e => (item.reactions?.[e]?.length || 0) > 0);
  return (
    <article className={`bg-surface border rounded-ih-lg p-4 flex flex-col gap-3 ${isRead ? 'border-line' : 'border-danger-line'}`}>
      <header className="flex items-center gap-2">
        {!isRead && <span className="w-2 h-2 rounded-full bg-danger shrink-0" aria-label="Belum dibaca" />}
        <span className={`ih-eyebrow ih-num ${isRead ? 'text-muted' : 'text-danger'}`}>{formatDate(item.date)}</span>
        {isAdmin && <IconButton icon={Trash2} label="Padam buletin" onClick={onDelete} className="ml-auto -my-2 -mr-2" />}
      </header>
      <div
        className="text-sm text-ink leading-relaxed line-clamp-4 bulletin-content"
        dangerouslySetInnerHTML={{ __html: item.content || '<span class="text-muted italic">Tiada kandungan.</span>' }}
      />
      {reacted.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {reacted.map(emoji => (
            <button
              key={emoji}
              type="button"
              onClick={() => onToggleReaction(emoji)}
              className={`h-8 px-2.5 rounded-full border text-xs inline-flex items-center gap-1 ${item.reactions?.[emoji]?.includes(userId) ? 'bg-emerald-tint border-emerald-200 text-emerald-deep' : 'bg-surface border-line text-muted'}`}
            >
              <span className="text-sm">{emoji}</span>
              <span className="font-bold ih-num">{item.reactions?.[emoji]?.length}</span>
            </button>
          ))}
        </div>
      )}
      <footer className="flex items-center gap-2 pt-3 border-t border-line">
        <BulletinAvatar author={item.author} user={author} />
        <span className="text-xs font-bold text-muted truncate">{item.author}</span>
        <button
          type="button"
          onClick={onRead}
          className={`ml-auto min-h-9 px-3 rounded-ih-sm text-xs font-bold border ${isRead ? 'bg-surface border-line text-ink' : 'bg-ink border-ink text-paper'}`}
        >
          {isRead ? 'Lihat' : 'Baca penuh'}
        </button>
      </footer>
    </article>
  );
};

export default BulletinCard;
