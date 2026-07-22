import React from 'react';
import { createPortal } from 'react-dom';
import { Download, Loader2, X } from 'lucide-react';

interface CertificateModalProps {
    title: string;
    onClose: () => void;
    onDownload: () => void;
    isGenerating: boolean;
    children: React.ReactNode;
    /** Tailwind classes for the scrollable preview area (defaults to the
     *  shared gray-100 layout). Override to preserve a page's exact styling. */
    bodyClassName?: string;
}

/**
 * Shared preview modal chrome for the certificate pages (CPC, LAD, LoC,
 * Prestasi): portal overlay, header with the PDF download + close buttons,
 * and a scrollable preview area. Each page passes its own inner page div as
 * children. Replaces the duplicated createPortal/header/handleDownload chrome.
 */
const CertificateModal: React.FC<CertificateModalProps> = ({
    title,
    onClose,
    onDownload,
    isGenerating,
    children,
    bodyClassName = 'flex-1 overflow-y-auto bg-gray-100 p-8 flex justify-center',
}) => {
    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60  animate-fade-in" style={{ zIndex: 9999 }}>
            <div className="bg-white  w-full max-w-[230mm] h-[95vh] rounded-3xl flex flex-col shadow-2xl overflow-hidden relative animate-slide-up">

                {/* Modal Header */}
                <div className="p-4 border-b border-slate-200  flex justify-between items-center bg-white  shrink-0">
                    <h3 className="font-bold text-slate-800">{title}</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={onDownload}
                            disabled={isGenerating}
                            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors text-sm disabled:opacity-50"
                        >
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            PDF
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100  rounded-lg text-slate-500">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Preview Area */}
                <div className={bodyClassName}>
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CertificateModal;
