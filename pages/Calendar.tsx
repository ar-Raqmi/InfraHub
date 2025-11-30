import React, { useState, useMemo } from 'react';
import { Project } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info } from 'lucide-react';

interface CalendarProps {
  projects: Project[];
}

const Calendar: React.FC<CalendarProps> = ({ projects }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Generate events from projects
  const events = useMemo(() => {
    const allEvents: { date: string; title: string; type: 'start' | 'end' | 'visit'; color: string }[] = [];
    
    projects.forEach(p => {
      if (p.tarikhMulaKontrak) {
        allEvents.push({ date: p.tarikhMulaKontrak, title: `Mula: ${p.noFail}`, type: 'start', color: 'bg-blue-500' });
      }
      if (p.tarikhTamatKontrak) {
        allEvents.push({ date: p.tarikhTamatKontrak, title: `Tamat: ${p.noFail}`, type: 'end', color: 'bg-red-500' });
      }
      if (p.tarikhSerahTapak) {
        allEvents.push({ date: p.tarikhSerahTapak, title: `Serah Tapak: ${p.noFail}`, type: 'visit', color: 'bg-emerald-500' });
      }
    });
    return allEvents;
  }, [projects]);

  // Calendar Logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  // Adjust for Monday start (0 = Sunday, 1 = Monday)
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthNames = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"];

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Kalendar Projek</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Jadual pelaksanaan projek dan tarikh penting</p>
        </div>
        <div className="flex items-center gap-4 bg-white/50 dark:bg-slate-800/50 p-2 rounded-2xl shadow-sm border border-white/20">
          <button onClick={prevMonth} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all">
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <span className="text-lg font-bold text-slate-800 dark:text-white min-w-[150px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all">
            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
        </div>
      </div>

      <div className="glass-effect rounded-3xl shadow-xl border border-white/20 dark:border-white/5 overflow-hidden p-6">
        
        {/* Days Header */}
        <div className="grid grid-cols-7 mb-4">
          {['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu', 'Ahad'].map(day => (
            <div key={day} className="text-center text-sm font-bold text-slate-400 uppercase tracking-wider py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 md:gap-4">
          
          {/* Empty slots for previous month */}
          {Array.from({ length: startDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-32 md:h-40 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-transparent"></div>
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvents = getEventsForDay(day);
            const isToday = 
              day === new Date().getDate() && 
              currentDate.getMonth() === new Date().getMonth() && 
              currentDate.getFullYear() === new Date().getFullYear();

            return (
              <div key={day} className={`h-32 md:h-40 rounded-2xl p-3 border transition-all hover:shadow-md flex flex-col overflow-hidden ${isToday ? 'bg-white dark:bg-slate-800 border-emerald-500 shadow-emerald-500/20 ring-2 ring-emerald-500/20' : 'bg-white/60 dark:bg-slate-800/60 border-white/20 dark:border-white/5 hover:bg-white dark:hover:bg-slate-800'}`}>
                <span className={`text-sm font-bold mb-2 w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-emerald-600 text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                  {day}
                </span>
                
                <div className="flex-1 overflow-y-auto space-y-1 scrollbar-hide">
                  {dayEvents.map((ev, idx) => (
                    <div key={idx} className={`${ev.color} text-white text-[10px] px-2 py-1 rounded-lg truncate shadow-sm font-medium`} title={ev.title}>
                      {ev.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex gap-6 justify-center flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-sm text-slate-600 dark:text-slate-300">Mula Kontrak</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-sm text-slate-600 dark:text-slate-300">Tamat Kontrak</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span className="text-sm text-slate-600 dark:text-slate-300">Serah Tapak</span>
        </div>
      </div>
    </div>
  );
};

export default Calendar;