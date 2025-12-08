import React from 'react';
import { Mail, Star, Search, Archive, Trash, MoreHorizontal } from 'lucide-react';

const Inbox = () => {
  const emails = [
    { id: 1, sender: 'Pengarah Jabatan', subject: 'Mesyuarat Penyelarasan Projek Zon 1', time: '10:30 AM', unread: true },
    { id: 2, sender: 'Syarikat Binaan Jaya', subject: 'Penyerahan Tuntutan Bayaran No. 2', time: 'Semalam', unread: true },
    { id: 3, sender: 'Unit Kewangan', subject: 'Status Pembayaran Projek Lampu Jalan', time: 'Semalam', unread: false },
    { id: 4, sender: 'Khairul (PJA)', subject: 'Laporan Kemajuan Tapak - Mingguan', time: '12 Okt', unread: false },
  ];

  const handleAction = (action: string) => {
    alert(`Tindakan '${action}' telah dilaksanakan!`);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6 animate-fade-in-up">
      {/* Sidebar List */}
      <div className="w-full md:w-1/3 glass-effect rounded-3xl shadow-xl border border-white/20 dark:border-white/5 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 dark:border-white/5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Cari emel..." className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-0 text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {emails.map(email => (
            <div key={email.id} className={`p-4 border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors ${email.unread ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}>
              <div className="flex justify-between items-start mb-1">
                <h4 className={`text-sm ${email.unread ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>{email.sender}</h4>
                <span className="text-xs text-slate-400">{email.time}</span>
              </div>
              <p className={`text-sm truncate ${email.unread ? 'text-slate-800 dark:text-slate-200 font-semibold' : 'text-slate-500'}`}>{email.subject}</p>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">Lorem ipsum dolor sit amet consectetur adipisicing elit. Nesciunt...</p>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="hidden md:flex flex-1 glass-effect rounded-3xl shadow-xl border border-white/20 dark:border-white/5 flex-col">
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
          <div className="flex gap-2">
            <button onClick={() => handleAction('Arkib')} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl text-slate-500 transition-colors"><Archive className="w-5 h-5"/></button>
            <button onClick={() => handleAction('Padam')} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl text-slate-500 transition-colors"><Trash className="w-5 h-5"/></button>
            <button onClick={() => handleAction('Bintang')} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl text-slate-500 transition-colors"><Star className="w-5 h-5"/></button>
          </div>
          <button onClick={() => handleAction('Lagi')} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl text-slate-500 transition-colors"><MoreHorizontal className="w-5 h-5"/></button>
        </div>
        <div className="p-8 flex-1 overflow-y-auto">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Mesyuarat Penyelarasan Projek Zon 1</h2>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">PJ</div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Pengarah Jabatan <span className="text-slate-400 font-normal text-sm">&lt;pengarah@mps.gov.my&gt;</span></p>
              <p className="text-xs text-slate-400">Kepada: saya, Khairul, Fatimah</p>
            </div>
          </div>
          <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
            <p>Assalamualaikum dan Salam Sejahtera,</p>
            <p>Merujuk kepada perkara di atas, sukacita dimaklumkan bahawa mesyuarat tersebut akan diadakan seperti ketetapan berikut:</p>
            <ul className="list-disc pl-5 space-y-2 my-4">
              <li><strong>Tarikh:</strong> 20 Oktober 2024</li>
              <li><strong>Masa:</strong> 9.30 Pagi</li>
              <li><strong>Tempat:</strong> Bilik Mesyuarat Utama, Tingkat 3</li>
            </ul>
            <p>Sila bawa bersama laporan kemajuan terkini bagi projek di bawah seliaan masing-masing.</p>
            <p className="mt-8">Sekian, terima kasih.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inbox;