import React from 'react';
import { Download, FileText, FileUp, Loader2, Recycle } from 'lucide-react';
import BottomSheet from '../BottomSheet';

interface ProjectActionsSheetProps {
    open: boolean;
    onClose: () => void;
    isGroupView: boolean;
    isGeneratingPdf: boolean;
    canImportInden: boolean;
    onExportCsv: () => void;
    onOpenReport: () => void;
    onExportRotasi: () => Promise<void>;
    onOpenImportInden: () => void;
}

const rowClass = "w-full min-h-[52px] px-3 rounded-ih-md flex items-center gap-3 text-left text-[15px] font-bold text-ink active:bg-paper-deep disabled:opacity-60";

const ProjectActionsSheet: React.FC<ProjectActionsSheetProps> = ({ open, onClose, isGroupView, isGeneratingPdf, canImportInden, onExportCsv, onOpenReport, onExportRotasi, onOpenImportInden }) => {
    const thenClose = (action: () => void) => () => { onClose(); action(); };

    // Rotasi keeps the sheet open so its spinner is the progress feedback.
    const exportRotasi = async () => {
        await onExportRotasi();
        onClose();
    };

    return (
        <BottomSheet open={open} title="Tindakan" onClose={onClose}>
            <div className="flex flex-col gap-1 pb-[env(safe-area-inset-bottom)]">
                {isGroupView ? (
                    <button onClick={thenClose(onOpenReport)} className={rowClass}>
                        <FileText className="w-5 h-5" /> Jana laporan panel (PDF)
                    </button>
                ) : (
                    <button onClick={thenClose(onExportCsv)} className={rowClass}>
                        <Download className="w-5 h-5" /> Eksport CSV
                    </button>
                )}
                <button onClick={exportRotasi} disabled={isGeneratingPdf} className={rowClass}>
                    {isGeneratingPdf ? <Loader2 className="w-5 h-5 animate-spin" /> : <Recycle className="w-5 h-5" />} Jadual rotasi (PDF)
                </button>
                {canImportInden && (
                    <button onClick={thenClose(onOpenImportInden)} className={rowClass}>
                        <FileUp className="w-5 h-5" /> Import No. Inden
                    </button>
                )}
            </div>
        </BottomSheet>
    );
};

export default ProjectActionsSheet;
