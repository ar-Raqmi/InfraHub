import React from 'react';
import { ProjectStatus, getStatusColor, getStatusLabel } from '../../types';

const dotClass = (status: ProjectStatus) =>
  status === ProjectStatus.DALAM_PROSES ? 'bg-blue-500' : status === ProjectStatus.SIAP ? 'bg-emerald-500' : 'bg-yellow-500';

export const StatusChip: React.FC<{ status: ProjectStatus }> = ({ status }) => (
  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border shadow-sm ${getStatusColor(status)}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${dotClass(status)}`}></span>
    {getStatusLabel(status)}
  </span>
);

export const NoticeChip: React.FC<{ notice: string }> = ({ notice }) => (
  <span className="text-[10px] font-black text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg whitespace-nowrap animate-pulse">
    {notice}
  </span>
);
