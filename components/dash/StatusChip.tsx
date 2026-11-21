import React from 'react';

/** A contract notice that is due and not yet recorded (Notis Pertama … Kerja Tidak Siap). */
export const NoticeChip: React.FC<{ notice: string }> = ({ notice }) => (
  <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border bg-danger-tint border-danger-line text-danger text-xs font-bold whitespace-nowrap">
    <span className="w-1.5 h-1.5 rounded-full bg-danger" aria-hidden />
    {notice}
  </span>
);
