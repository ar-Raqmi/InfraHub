import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { User, Role } from '../../types';
import BottomSheet from '../BottomSheet';
import UserAvatar from './UserAvatar';

interface UserDetailSheetProps {
  user: User | null;
  canManage: boolean;
  canDelete: boolean;
  onClose: () => void;
  onEdit: (user: User) => void;
  onDelete: (id: number) => void;
}

const DetailRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="py-2.5">
    <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</dt>
    <dd className="mt-0.5 text-slate-800 font-medium break-words">{children}</dd>
  </div>
);

const UserDetailSheet: React.FC<UserDetailSheetProps> = ({ user, canManage, canDelete, onClose, onEdit, onDelete }) => {
  if (!user) return null;

  const footer = canManage ? (
    <div className="flex gap-3">
      {canDelete && (
        <button
          type="button"
          onClick={() => onDelete(user.id)}
          className="min-h-[48px] px-5 flex items-center justify-center gap-2 rounded-xl border border-red-200 text-red-600 font-bold active:bg-red-50"
        >
          <Trash2 className="w-4 h-4" /> Padam
        </button>
      )}
      <button
        type="button"
        onClick={() => onEdit(user)}
        className="flex-1 min-h-[48px] flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white font-bold active:bg-emerald-700"
      >
        <Edit2 className="w-4 h-4" /> Edit Pengguna
      </button>
    </div>
  ) : undefined;

  return (
    <BottomSheet open title={user.fullName} onClose={onClose} footer={footer}>
      <div className="flex items-center gap-3 mb-2">
        <UserAvatar user={user} className="w-14 h-14 rounded-2xl" />
        <div className="min-w-0">
          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${user.role === Role.ADMIN ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'}`}>{user.role}</span>
          <p className="text-sm text-slate-500 mt-1">@{user.username}</p>
        </div>
      </div>
      <dl className="divide-y divide-slate-100">
        <DetailRow label="Jawatan">{user.jawatan || '-'}</DetailRow>
        <DetailRow label="Jabatan">{user.bahagian || '-'}</DetailRow>
        <DetailRow label="Unit">{user.unit || '-'}</DetailRow>
        <DetailRow label="Emel">
          {user.email ? <a href={`mailto:${user.email}`} className="inline-flex min-h-[44px] items-center text-emerald-700 underline break-all">{user.email}</a> : '-'}
        </DetailRow>
        <DetailRow label="No. Telefon">
          {user.phone ? <a href={`tel:${user.phone}`} className="inline-flex min-h-[44px] items-center text-emerald-700 underline">{user.phone}</a> : '-'}
        </DetailRow>
        <DetailRow label="ID">{user.id}</DetailRow>
      </dl>
    </BottomSheet>
  );
};

export default UserDetailSheet;
