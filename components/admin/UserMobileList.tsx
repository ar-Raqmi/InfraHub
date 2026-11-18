import React from 'react';
import { ChevronRight } from 'lucide-react';
import { User, Role } from '../../types';
import UserAvatar from './UserAvatar';

const ROLE_GROUPS: { role: Role; label: string }[] = [
  { role: Role.ADMIN, label: 'Admin' },
  { role: Role.JURUTERA, label: 'Jurutera' },
  { role: Role.PJA, label: 'PJA' },
];

interface UserMobileListProps {
  users: User[];
  onSelect: (user: User) => void;
}

const UserMobileList: React.FC<UserMobileListProps> = ({ users, onSelect }) => (
  <div className="md:hidden space-y-5">
    {ROLE_GROUPS.map(({ role, label }) => {
      const members = users.filter(u => u.role === role);
      if (members.length === 0) return null;
      return (
        <section key={role}>
          <h2 className="px-1 mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">{label} · {members.length}</h2>
          <ul className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {members.map(u => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => onSelect(u)}
                  className="w-full min-h-[68px] flex items-center gap-3 px-4 py-3 text-left active:bg-slate-50"
                >
                  <UserAvatar user={u} className="w-11 h-11 rounded-xl" />
                  <span className="flex-1 min-w-0">
                    <span className="block font-bold text-slate-900 leading-snug break-words clamp-2">{u.fullName}</span>
                    <span className="block text-sm text-slate-500 break-words">@{u.username}{u.jawatan ? ` · ${u.jawatan}` : ''}</span>
                  </span>
                  <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      );
    })}
  </div>
);

export default UserMobileList;
