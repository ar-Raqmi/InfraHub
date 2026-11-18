import React from 'react';
import { Info } from 'lucide-react';
import { formatCurrency } from '../../types';

interface PelarasanPriceNoticesProps {
    extraPrice: number;
    reductionPrice: number;
    // The desktop sidebar keeps its pulse; the phone sheet stays still.
    pulseClass: string;
}

const PelarasanPriceNotices: React.FC<PelarasanPriceNoticesProps> = ({ extraPrice, reductionPrice, pulseClass }) => (
    <>
        {extraPrice > 0 && (
            <div className={`bg-blue-50  p-3 rounded-xl border border-blue-200 ${pulseClass}`}>
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                    <Info className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Lebihan Harga</span>
                </div>
                <div className="text-sm font-black text-blue-700 font-mono">
                    +{formatCurrency(extraPrice)}
                </div>
                <p className="text-[9px] text-blue-500 mt-1 leading-tight">
                    Harga akhir akan dihadkan mengikut Harga Kontrak.
                </p>
            </div>
        )}

        {reductionPrice > 0 && (
            <div className={`bg-red-50 p-3 rounded-xl border border-red-200 ${pulseClass}`}>
                <div className="flex items-center gap-2 text-red-600 mb-1">
                    <Info className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Pengurangan Harga</span>
                </div>
                <div className="text-sm font-black text-red-700 font-mono">
                    -{formatCurrency(reductionPrice)}
                </div>
                <p className="text-[9px] text-red-500 mt-1 leading-tight">
                    Harga akhir lebih rendah mengikut pelarasan semasa.
                </p>
            </div>
        )}
    </>
);

export default PelarasanPriceNotices;
