import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton } from '../ui';

interface MobilePagerProps {
  page: number;
  totalPages: number;
  from: number;
  to: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

// pb-24: the floating Tambah Projek button sits above the tab bar and would cover the pager at scroll end.
const MobilePager: React.FC<MobilePagerProps> = ({ page, totalPages, from, to, total, onPrev, onNext }) => (
  <div className="flex items-center justify-between gap-3 pb-24" data-testid="dash-pager">
    <span className="text-sm font-bold text-muted ih-num">
      <span className="text-ink">{from}–{to}</span> daripada {total}
    </span>
    {totalPages > 1 && (
      <div className="flex items-center gap-2">
        <IconButton icon={ChevronLeft} label="Halaman sebelum" variant="outline" disabled={page === 1} onClick={onPrev} />
        <span className="text-sm font-bold text-ink min-w-[48px] text-center ih-num">{page} / {totalPages}</span>
        <IconButton icon={ChevronRight} label="Halaman seterusnya" variant="outline" disabled={page === totalPages} onClick={onNext} />
      </div>
    )}
  </div>
);

export default MobilePager;
