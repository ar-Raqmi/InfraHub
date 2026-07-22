
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Project, User, Role, formatDateMalay, formatCurrency, calculateLADDailyRate } from '../types';
import { apiService } from '../services/apiService';
import { Download, Loader2, X, FileText, Calendar, User as UserIcon, Settings } from 'lucide-react';
import StrictDateInput from '../components/StrictDateInput';
import { NotisPDFExporter } from '../services/pdf/NotisPDFExporter';

interface NotisGeneratorProps {
    project: Project;
    pjaUser?: User; // Passed for footer reference
    onClose: () => void;
}

type NoticeType = 'PEMBERITAHUAN' | 'PERINGATAN_1' | 'KERJA_TIDAK_SIAP' | 'PERINGATAN_2' | 'PERINGATAN_3';

const MONTHS = ["Januari","Februari","Mac","April","Mei","Jun","Julai","Ogos","September","Oktober","November","Disember"];

const NotisGenerator: React.FC<NotisGeneratorProps> = ({ project, pjaUser, onClose }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [noticeType, setNoticeType] = useState<NoticeType>('PEMBERITAHUAN');
    
    const [startDate, setStartDate] = useState(project.tarikhMulaKerja || '');
    const [endDate, setEndDate] = useState(project.tarikhTamatKontrak || '');

    const [letterMonthYear, setLetterMonthYear] = useState(''); 
    
    const [juruteraList, setJuruteraList] = useState<User[]>([]);
    const [selectedJuruteraId, setSelectedJuruteraId] = useState<number | string>('');
    const [companyDetails, setCompanyDetails] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const users = await apiService.getUsers();
                const jrs = users.filter(u => u.role === Role.JURUTERA);
                setJuruteraList(jrs);
                if (jrs.length > 0) {
                    setSelectedJuruteraId(jrs[0].id);
                }

                if (project.namaSyarikat) {
                    const year = project.tarikhBuka ? new Date(project.tarikhBuka).getFullYear() : new Date().getFullYear();
                    const details = await apiService.getCompanyDetails(year, project.namaSyarikat);
                    setCompanyDetails(details);
                }
            } catch (err) {
                console.error('Failed to load notis generator data:', err);
            }
        };
        fetchData();
    }, [project]);

    // Date Logic Handling based on Notice Type
    useEffect(() => {
        if (project.tarikhTamatKontrak) {
            const d = new Date(project.tarikhTamatKontrak);
            if (!isNaN(d.getTime())) {
                if (noticeType === 'PERINGATAN_2') {
                    // 1 Week AFTER End Date for Peringatan Kedua
                    d.setDate(d.getDate() + 7);
                } else if (noticeType === 'PERINGATAN_3') {
                    // 2 Weeks AFTER End Date for Peringatan Ketiga
                    d.setDate(d.getDate() + 14);
                } else {
                    // 1 Week BEFORE End Date for others (Default)
                    d.setDate(d.getDate() - 7);
                }
                setLetterMonthYear(`${MONTHS[d.getMonth()]} ${d.getFullYear()}`);
            }
        } else {
            // Default to current date if no project end date
            const d = new Date();
            setLetterMonthYear(`${MONTHS[d.getMonth()]} ${d.getFullYear()}`);
        }
    }, [project.tarikhTamatKontrak, noticeType]);

    // Helper for Selects
    const getMonthYearParts = (str: string) => {
        const parts = str.split(' ');
        const now = new Date();
        if (parts.length >= 2) {
            return { month: parts[0], year: parseInt(parts[1]) || now.getFullYear() };
        }
        return { month: MONTHS[now.getMonth()], year: now.getFullYear() };
    };

    const { month: currentMonth, year: currentYear } = getMonthYearParts(letterMonthYear);
    const yearsList = Array.from({length: 6}, (_, i) => new Date().getFullYear() - 2 + i);

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLetterMonthYear(`${e.target.value} ${currentYear}`);
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLetterMonthYear(`${currentMonth} ${e.target.value}`);
    };

    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            await NotisPDFExporter.export(project, pjaUser, companyDetails, {
                noticeType,
                startDate,
                endDate,
                letterMonthYear,
                selectedJuruteraId,
                juruteraList
            });
        } catch (e) {
            console.error(e);
            alert("Ralat menjana PDF Notis.");
        } finally {
            setIsGenerating(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60  animate-fade-in" style={{ zIndex: 9999 }}>
            <div className="bg-white  w-full max-w-lg rounded-3xl flex flex-col shadow-2xl overflow-hidden relative animate-slide-up">
                
                {/* Header */}
                <div className="p-5 border-b border-slate-200  flex justify-between items-center bg-white  shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900  text-lg">Jana Notis</h3>
                            <p className="text-xs text-slate-500">Pilih jenis notis untuk dijana</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100  rounded-full text-slate-500 transition-colors">
                        <X className="w-5 h-5"/>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    
                    {/* Notice Type Selector */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Jenis Notis</label>
                        <select 
                            value={noticeType} 
                            onChange={(e) => setNoticeType(e.target.value as NoticeType)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50  border border-slate-200  outline-none focus:ring-2 focus:ring-red-500 text-sm font-bold text-slate-700  cursor-pointer"
                        >
                            <option value="PEMBERITAHUAN">Notis Pemberitahuan (Awam)</option>
                            <option value="PERINGATAN_1">Notis Peringatan Pertama</option>
                            <option value="PERINGATAN_2">Notis Peringatan Kedua</option>
                            <option value="PERINGATAN_3">Notis Peringatan Ketiga</option>
                            <option value="KERJA_TIDAK_SIAP">Perakuan Kerja Tidak Siap</option>
                        </select>
                    </div>

                    {/* Dynamic Content based on Type */}
                    {noticeType === 'PEMBERITAHUAN' && (
                        <div className="space-y-3 animate-fade-in">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Tetapan Tarikh
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700  mb-1">Tarikh Mula</label>
                                    <StrictDateInput 
                                        name="startDate"
                                        value={startDate} 
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-slate-50  border border-slate-200  outline-none focus:ring-2 focus:ring-red-500 text-sm font-bold text-slate-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700  mb-1">Tarikh Tamat</label>
                                    <StrictDateInput 
                                        name="endDate"
                                        value={endDate} 
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-slate-50  border border-slate-200  outline-none focus:ring-2 focus:ring-red-500 text-sm font-bold text-slate-700"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {(noticeType === 'PERINGATAN_1' || noticeType === 'PERINGATAN_2' || noticeType === 'PERINGATAN_3' || noticeType === 'KERJA_TIDAK_SIAP') && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-yellow-50  p-3 rounded-xl border border-yellow-200">
                                <h4 className="text-xs font-bold text-yellow-700  uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Settings className="w-3 h-3" /> Info Peringatan
                                </h4>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Kadar LAD:</span>
                                        <span className="font-mono font-bold text-slate-700">RM {calculateLADDailyRate(project.kosProjek).toFixed(2)}/hari</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Tarikh Mula (SST):</span>
                                        <span className="font-mono font-bold text-slate-700">{project.tarikhMulaKerja ? project.tarikhMulaKerja.split('-').reverse().join('/') : '-'}</span>
                                    </div>
                                    {noticeType === 'KERJA_TIDAK_SIAP' && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Tarikh Tamat Kontrak:</span>
                                            <span className="font-mono font-bold text-red-600">{project.tarikhTamatKontrak ? project.tarikhTamatKontrak.split('-').reverse().join('/') : '-'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {noticeType !== 'KERJA_TIDAK_SIAP' && (
                                <div>
                                    <label className="block text-xs font-medium text-slate-700  mb-1">Bulan & Tahun Surat</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <select
                                            value={currentMonth}
                                            onChange={handleMonthChange}
                                            className="w-full px-3 py-2 rounded-xl bg-slate-50  border border-slate-200  outline-none focus:ring-2 focus:ring-red-500 text-sm font-bold text-slate-700  cursor-pointer"
                                        >
                                            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                        <select
                                            value={currentYear}
                                            onChange={handleYearChange}
                                            className="w-full px-3 py-2 rounded-xl bg-slate-50  border border-slate-200  outline-none focus:ring-2 focus:ring-red-500 text-sm font-bold text-slate-700  cursor-pointer"
                                        >
                                            {yearsList.map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                    <p className="text-[10px] text-slate-400 italic mt-1">
                                        {noticeType === 'PERINGATAN_2' 
                                            ? '*Tarikh default adalah 1 minggu SELEPAS tamat kontrak.' 
                                            : noticeType === 'PERINGATAN_3'
                                            ? '*Tarikh default adalah 2 minggu SELEPAS tamat kontrak.'
                                            : '*Tarikh default adalah 1 minggu SEBELUM tamat kontrak.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Signer Selection */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <UserIcon className="w-4 h-4" /> Penandatangan (Jurutera)
                        </h4>
                        <select 
                            value={selectedJuruteraId} 
                            onChange={(e) => setSelectedJuruteraId(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50  border border-slate-200  outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium text-slate-700  appearance-none cursor-pointer"
                        >
                            {juruteraList.length === 0 && <option value="">Tiada Data Jurutera</option>}
                            {juruteraList.map(jr => (
                                <option key={jr.id} value={jr.id}>{jr.fullName}</option>
                            ))}
                        </select>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-5 border-t border-slate-200  bg-gray-50  flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200  transition-colors text-sm"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={handleDownload}
                        disabled={isGenerating || !selectedJuruteraId}
                        className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        PDF
                    </button>
                </div>

            </div>
        </div>,
        document.body
    );
};

export default NotisGenerator;
