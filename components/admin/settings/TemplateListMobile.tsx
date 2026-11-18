import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Edit2, FileText, MoreHorizontal, Trash2 } from 'lucide-react';
import { BQTemplateDefinition } from '../../../types';
import BottomSheet from '../../BottomSheet';

interface TemplateListMobileProps {
  templates: BQTemplateDefinition[];
  iconFor: (icon: string) => React.ElementType;
  colorClassesFor: (color: string) => string;
  onEdit: (template: BQTemplateDefinition) => void;
  onMove: (index: number, direction: 'prev' | 'next') => void;
  onDelete: (template: BQTemplateDefinition) => void;
}

const actionClass = 'w-full min-h-[48px] flex items-center gap-3 px-2 rounded-xl font-bold text-slate-700 active:bg-slate-100 disabled:opacity-30';

const TemplateListMobile: React.FC<TemplateListMobileProps> = ({ templates, iconFor, colorClassesFor, onEdit, onMove, onDelete }) => {
  const [menuIndex, setMenuIndex] = useState<number | null>(null);
  const menuTemplate = menuIndex !== null ? templates[menuIndex] : null;
  const close = () => setMenuIndex(null);

  return (
    <div className="md:hidden">
      <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden bg-white">
        {templates.map((tpl, idx) => {
          const Icon = iconFor(tpl.icon) || FileText;
          return (
            <li key={tpl.id} className="flex items-center gap-1 pl-3 pr-1">
              <button type="button" onClick={() => onEdit(tpl)} className="flex-1 min-w-0 min-h-[72px] py-3 flex items-center gap-3 text-left">
                <span className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${colorClassesFor(tpl.color || 'blue')}`}><Icon className="w-5 h-5" /></span>
                <span className="flex-1 min-w-0">
                  <span className="block font-bold text-slate-800 break-words">{tpl.title}</span>
                  <span className="block text-sm text-slate-500 break-words">{tpl.subtitle}</span>
                  <span className="block text-xs text-slate-400 font-mono break-all">{(tpl.bills || []).length} BIL NO. · #{tpl.key}</span>
                </span>
              </button>
              <button type="button" onClick={() => setMenuIndex(idx)} className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-slate-500 active:bg-slate-100" aria-label={`Tindakan ${tpl.title}`}>
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </li>
          );
        })}
      </ul>

      <BottomSheet open={menuTemplate !== null} title={menuTemplate ? `${menuTemplate.title} · ${menuTemplate.subtitle}` : ''} onClose={close}>
        {menuTemplate && menuIndex !== null && (
          <div className="space-y-1">
            <button type="button" onClick={() => { close(); onEdit(menuTemplate); }} className={actionClass}><Edit2 className="w-5 h-5 text-emerald-600" /> Edit</button>
            <button type="button" onClick={() => { onMove(menuIndex, 'prev'); setMenuIndex(menuIndex - 1); }} disabled={menuIndex === 0} className={actionClass}><ArrowUp className="w-5 h-5" /> Naik</button>
            <button type="button" onClick={() => { onMove(menuIndex, 'next'); setMenuIndex(menuIndex + 1); }} disabled={menuIndex === templates.length - 1} className={actionClass}><ArrowDown className="w-5 h-5" /> Turun</button>
            <button type="button" onClick={() => { close(); onDelete(menuTemplate); }} className={`${actionClass} text-red-600`}><Trash2 className="w-5 h-5" /> Padam</button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};

export default TemplateListMobile;
