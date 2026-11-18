import React from 'react';
import { Award, Building2, Calendar, ChevronRight, FileDigit, Grid2x2, Package } from 'lucide-react';
import { SettingsSection } from './useSettingsRoute';

export interface HubSummaries {
  meeting: string;
  sebutharga: string;
  template: string;
  pustaka: string;
  company: string;
  vote: string;
}

const GROUPS: { label: string; rows: { sec: SettingsSection; title: string; icon: React.ElementType; tint: string }[] }[] = [
  {
    label: 'Mesyuarat & Sebut Harga',
    rows: [
      { sec: 'meeting', title: 'Tetapan Mesyuarat', icon: Calendar, tint: 'bg-orange-100 text-orange-600' },
      { sec: 'sebutharga', title: 'No. Sebutharga', icon: Award, tint: 'bg-emerald-100 text-emerald-600' },
    ],
  },
  {
    label: 'BQ',
    rows: [
      { sec: 'template', title: 'Template BQ', icon: Grid2x2, tint: 'bg-teal-100 text-teal-700' },
      { sec: 'pustaka', title: 'Pustaka BQ', icon: Package, tint: 'bg-indigo-100 text-indigo-600' },
    ],
  },
  {
    label: 'Data Tahunan',
    rows: [
      { sec: 'company', title: 'Senarai Syarikat', icon: Building2, tint: 'bg-blue-100 text-blue-600' },
      { sec: 'vote', title: 'No. Vot', icon: FileDigit, tint: 'bg-indigo-100 text-indigo-600' },
    ],
  },
];

interface SettingsHubProps {
  summaries: HubSummaries;
  onOpen: (sec: SettingsSection) => void;
}

const SettingsHub: React.FC<SettingsHubProps> = ({ summaries, onOpen }) => (
  <div className="md:hidden space-y-5">
    {GROUPS.map(group => (
      <section key={group.label}>
        <h2 className="px-1 mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">{group.label}</h2>
        <ul className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          {group.rows.map(({ sec, title, icon: Icon, tint }) => (
            <li key={sec}>
              <button type="button" onClick={() => onOpen(sec)} className="w-full min-h-[64px] flex items-center gap-3 px-4 py-3 text-left active:bg-slate-50">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tint}`}><Icon className="w-5 h-5" /></span>
                <span className="flex-1 min-w-0">
                  <span className="block font-bold text-slate-900">{title}</span>
                  <span className="block text-sm text-slate-500 break-words">{summaries[sec]}</span>
                </span>
                <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    ))}
  </div>
);

export default SettingsHub;
