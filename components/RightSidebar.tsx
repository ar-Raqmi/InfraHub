import React from 'react';
import { Project, ProjectStatus, formatCurrency } from '../types';
import { Bookmark, Check, Minus, ListChecks, Star, Zap, Info, Send, Paperclip } from 'lucide-react';

interface RightSidebarProps {
  projects: Project[];
}

const RightSidebar: React.FC<RightSidebarProps> = ({ projects }) => {
  const activeValue = projects
    .filter(p => p.status === ProjectStatus.DALAM_PROSES)
    .reduce((sum, p) => sum + (p.kosProjek || 0), 0);

  return (
    <>
      {/* Orange Card - Summary */}
      <div className="rounded-3xl p-4 md:p-5 bg-orange-500 dark:bg-orange-600 text-white shadow-lg shadow-orange-500/20">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg tracking-tight font-semibold font-geist">Ringkasan Projek</h3>
            <p className="text-sm text-white/80 mt-1 font-geist">Status kewangan semasa</p>
          </div>
          <button className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors">
            <Bookmark className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2 bg-white/15 p-1 rounded-full">
          <div className="flex-1 px-3 py-1.5 rounded-full text-sm bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-geist text-center font-medium shadow-sm">
            Aktif
          </div>
          <div className="flex-1 px-3 py-1.5 rounded-full text-sm text-white/90 font-geist text-center hover:bg-white/10 transition-colors cursor-pointer">
            Selesai
          </div>
        </div>

        <div className="mt-5">
          <div className="text-xs uppercase tracking-wide text-white/70 font-geist">Nilai Projek Aktif</div>
          <div className="mt-1 text-3xl tracking-tight font-jakarta font-light">
            {formatCurrency(activeValue).replace('RM', '')} <span className="text-lg">RM</span>
          </div>
        </div>

        <ul className="mt-4 space-y-2">
          <li className="flex items-center gap-2">
            <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center">
              <Check className="h-3.5 w-3.5" />
            </span>
            <span className="text-sm font-geist">Prestasi Cemerlang</span>
          </li>
          <li className="flex items-center gap-2">
             <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center">
               <Minus className="h-3.5 w-3.5" />
             </span>
             <span className="text-sm font-geist">Risiko Minima</span>
          </li>
        </ul>
      </div>

      {/* Cyan Card - Tasks */}
      <div className="rounded-3xl p-4 md:p-5 bg-cyan-400 dark:bg-cyan-500 text-zinc-900 shadow-lg shadow-cyan-400/20">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg tracking-tight font-semibold font-geist">Tugasan</h3>
            <p className="text-sm text-zinc-700 dark:text-zinc-900 mt-1 font-geist">Tindakan perlu diambil</p>
          </div>
          <ListChecks className="h-5 w-5" />
        </div>

        <div className="mt-4 rounded-2xl bg-white/80 dark:bg-white/90 p-3 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-geist font-medium">Semakan BQ</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-600 font-geist">Due</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-zinc-900 text-white font-geist">Hari Ini</span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-xs uppercase tracking-wide text-zinc-700 dark:text-zinc-900 font-geist mb-2">Status Kelulusan</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-white/80 dark:bg-white/90 p-3 backdrop-blur-sm">
              <div className="text-sm font-medium font-geist">Dalaman</div>
              <ul className="mt-1 text-xs text-zinc-700 space-y-1">
                <li className="flex items-center gap-1.5 font-geist">
                  <Star className="h-3.5 w-3.5 fill-current text-orange-400" /> 
                  Lulus
                </li>
              </ul>
            </div>
            <div className="rounded-2xl bg-white/80 dark:bg-white/90 p-3 backdrop-blur-sm">
              <div className="text-sm font-medium font-geist">Luaran</div>
              <ul className="mt-1 text-xs text-zinc-700 space-y-1">
                <li className="flex items-center gap-1.5 font-geist">
                  <Info className="h-3.5 w-3.5 text-zinc-400" /> 
                  Menunggu
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button className="flex-1 flex gap-2 hover:opacity-95 text-white bg-zinc-900 rounded-2xl pt-3 pr-4 pb-3 pl-4 shadow-lg items-center justify-center transition-all active:scale-95">
            <Send className="h-4 w-4" />
            <span className="text-sm font-geist font-medium">Hantar</span>
          </button>
          <button className="h-12 w-12 rounded-full bg-white text-zinc-900 flex items-center justify-center hover:bg-white/90 transition-colors shadow-sm">
            <Paperclip className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Inspiration Image */}
      <div className="rounded-3xl overflow-hidden shadow-md h-40 relative group border border-zinc-100 dark:border-zinc-800">
        <img 
          src="https://hoirqrkdgbmvpwutwuwj-all.supabase.co/storage/v1/object/public/assets/assets/256139c9-e118-4ca1-b76d-9cb35137e5c0_800w.jpg" 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
          alt="Inspiration" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
          <p className="text-white text-sm font-medium font-geist">Projek Zon 3</p>
        </div>
      </div>
    </>
  );
};

export default RightSidebar;