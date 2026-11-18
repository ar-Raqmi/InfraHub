import React, { useState } from 'react';
import { ArrowDown, ArrowUp, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { CompanyDetail } from '../../../types';
import BottomSheet from '../../BottomSheet';
import { formatRM } from './format';

interface CompanyListMobileProps {
  companies: string[];
  details: Record<string, CompanyDetail>;
  onMove: (index: number, direction: 'up' | 'down') => void;
  onJumpToRank: (index: number) => void;
  onEdit: (name: string) => void;
  onDelete: (name: string) => void;
}

function companyMeta(detail?: CompanyDetail): string {
  if (!detail) return '';
  return [detail.gred, detail.limit ? `Had ${formatRM(detail.limit)}` : '', detail.registrationNumber].filter(Boolean).join(' · ');
}

const rankClass = 'w-11 h-11 shrink-0 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xs font-black text-slate-500';
const stepClass = 'w-11 h-11 shrink-0 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 active:bg-blue-50 disabled:opacity-30';

const CompanyListMobile: React.FC<CompanyListMobileProps> = ({ companies, details, onMove, onJumpToRank, onEdit, onDelete }) => {
  const [isSorting, setIsSorting] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const detail = selected ? details[selected] : undefined;

  return (
    <div className="md:hidden">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-sm text-slate-500">{isSorting ? 'Ketik nombor untuk ubah kedudukan terus.' : `${companies.length} syarikat`}</p>
        <button
          type="button"
          onClick={() => setIsSorting(v => !v)}
          className={`min-h-[44px] px-4 rounded-xl font-bold text-sm border ${isSorting ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-700 border-blue-200'}`}
        >
          {isSorting ? 'Selesai' : 'Susun'}
        </button>
      </div>

      <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden bg-white">
        {companies.map((company, idx) => (
          <li key={company} className="flex items-center gap-2 px-3 py-2 min-h-[64px]">
            {isSorting ? (
              <>
                <button type="button" onClick={() => onJumpToRank(idx)} className={rankClass} aria-label={`Kedudukan ${idx + 1}`}>{idx + 1}</button>
                <span className="flex-1 min-w-0 font-medium text-slate-800 break-words clamp-2">{company}</span>
                <button type="button" onClick={() => onMove(idx, 'up')} disabled={idx === 0} className={stepClass} aria-label="Naik Satu"><ArrowUp className="w-4 h-4" /></button>
                <button type="button" onClick={() => onMove(idx, 'down')} disabled={idx === companies.length - 1} className={stepClass} aria-label="Turun Satu"><ArrowDown className="w-4 h-4" /></button>
              </>
            ) : (
              <button type="button" onClick={() => setSelected(company)} className="flex-1 min-w-0 min-h-[48px] flex items-center gap-3 text-left">
                <span className="w-8 shrink-0 text-center text-xs font-black text-slate-400">{idx + 1}</span>
                <span className="flex-1 min-w-0">
                  <span className="block font-medium text-slate-800 break-words clamp-2">{company}</span>
                  {companyMeta(details[company]) && <span className="block text-xs text-slate-500 break-words">{companyMeta(details[company])}</span>}
                </span>
                <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
              </button>
            )}
          </li>
        ))}
      </ul>

      <BottomSheet
        open={selected !== null}
        title={selected || ''}
        onClose={() => setSelected(null)}
        footer={selected && (
          <div className="flex gap-3">
            <button type="button" onClick={() => { onDelete(selected); setSelected(null); }} className="min-h-[48px] px-5 flex items-center justify-center gap-2 rounded-xl border border-red-200 text-red-600 font-bold active:bg-red-50">
              <Trash2 className="w-4 h-4" /> Padam
            </button>
            <button type="button" onClick={() => { onEdit(selected); setSelected(null); }} className="flex-1 min-h-[48px] flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white font-bold active:bg-blue-700">
              <Edit2 className="w-4 h-4" /> Edit Maklumat
            </button>
          </div>
        )}
      >
        <dl className="divide-y divide-slate-100 text-sm">
          {[
            ['Gred CIDB', detail?.gred],
            ['Had Kerja', detail?.limit ? formatRM(detail.limit) : ''],
            ['Nombor Pendaftaran (MOF/CIDB)', detail?.registrationNumber],
            ['Alamat Lengkap', detail?.address],
            ['Nama Pemilik', detail?.ownerName],
            ['No. Telefon', detail?.phone],
            ['Emel', detail?.email],
          ].map(([label, value]) => (
            <div key={label} className="py-2.5">
              <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</dt>
              <dd className="mt-0.5 text-slate-800 font-medium break-words">{value || '-'}</dd>
            </div>
          ))}
        </dl>
      </BottomSheet>
    </div>
  );
};

export default CompanyListMobile;
