import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { VoteDefinition } from '../../../types';
import { formatRM } from './format';

interface VoteListMobileProps {
  votes: VoteDefinition[];
  onEdit: (vote: VoteDefinition) => void;
  onDelete: (code: string) => void;
}

const iconButton = 'w-11 h-11 shrink-0 rounded-xl border border-slate-200 bg-white flex items-center justify-center';

const VoteListMobile: React.FC<VoteListMobileProps> = ({ votes, onEdit, onDelete }) => (
  <ul className="md:hidden divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden bg-white">
    {votes.map(vote => (
      <li key={vote.code} className="flex items-start gap-2 px-4 py-3">
        <div className="flex-1 min-w-0">
          <p className="font-mono font-bold text-slate-700 break-all">{vote.code}</p>
          <p className="text-sm text-slate-600 break-words">{vote.name || '-'}</p>
          <p className="mt-1 font-mono text-emerald-600">{formatRM(vote.allocation)}</p>
        </div>
        <button type="button" onClick={() => onEdit(vote)} className={`${iconButton} text-slate-500 active:bg-indigo-50`} aria-label="Edit"><Edit2 className="w-4 h-4" /></button>
        <button type="button" onClick={() => onDelete(vote.code)} className={`${iconButton} text-red-500 active:bg-red-50`} aria-label="Padam"><Trash2 className="w-4 h-4" /></button>
      </li>
    ))}
  </ul>
);

export default VoteListMobile;
