import React from 'react';
import { createPortal } from 'react-dom';
import { Edit3, X, Save } from 'lucide-react';

interface BulkEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectionCount: number;
    unit: string;
    rate: string;
    rateMode: 'set' | 'adjust';
    onUnitChange: (value: string) => void;
    onRateChange: (value: string) => void;
    onRateModeChange: (mode: 'set' | 'adjust') => void;
    onApply: () => void;
}

const BulkEditModal: React.FC<BulkEditModalProps> = ({
    isOpen,
    onClose,
    selectionCount,
    unit,
    rate,
    rateMode,
    onUnitChange,
    onRateChange,
    onRateModeChange,
    onApply
}) => {
    if (!isOpen) return null;

    const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1";
    const inputClass = "w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 text-sm";

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-slide-up relative overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
                <div className="flex justify-between items-center mb-6 pt-2">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Edit3 className="w-6 h-6 text-indigo-600" />
                        Kemaskini Pukal
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <p className="text-xs text-slate-500 mb-5 -mt-3">
                    Gunakan kepada {selectionCount} item yang dipilih. Biarkan kosong untuk tidak ubah medan tersebut.
                </p>

                <div className="space-y-5">
                    <div>
                        <label className={labelClass}>Unit Baru</label>
                        <input
                            type="text"
                            value={unit}
                            onChange={e => onUnitChange(e.target.value)}
                            className={inputClass}
                            placeholder="cth: Nos, m, LS (kosong = tak ubah)"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Unit akan turut dikemaskini pada semua varian item.</p>
                    </div>

                    <div>
                        <label className={labelClass}>Kadar (RM)</label>
                        <div className="flex gap-2 mb-2">
                            <button
                                onClick={() => onRateModeChange('set')}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${rateMode === 'set' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                            >
                                Tetap Nilai
                            </button>
                            <button
                                onClick={() => onRateModeChange('adjust')}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${rateMode === 'adjust' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                            >
                                Laras (%)
                            </button>
                        </div>
                        <input
                            type="number"
                            value={rate}
                            onChange={e => onRateChange(e.target.value)}
                            className={inputClass}
                            placeholder={rateMode === 'set' ? 'Nilai tetap, cth: 250 (kosong = tak ubah)' : 'Peratus larasan, cth: 10 atau -5 (kosong = tak ubah)'}
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                            {rateMode === 'set' ? 'Semua kadar akan ditetapkan kepada nilai ini.' : 'Kadar akan dilaras mengikut peratus. Contoh: 10 = tambah 10%, -5 = tolak 5%.'}
                        </p>
                    </div>
                </div>

                <div className="pt-6 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onApply}
                        className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Gunakan
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default BulkEditModal;