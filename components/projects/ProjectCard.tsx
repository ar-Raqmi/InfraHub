import React from 'react';
import { Building2, Trash2 } from 'lucide-react';
import { Project, User, formatDate, getStatusColor, getStatusLabel } from '../../types';
import ExpandableText from '../ExpandableText';
import PjaAvatar from './PjaAvatar';

interface ProjectCardProps {
    project: Project;
    pja?: User;
    canDelete: boolean;
    onOpen: (project: Project) => void;
    onDelete: (project: Project) => void;
}

const splitAduan = (noAduan?: string) => (noAduan || '').split(/[,;\n]/).map(a => a.trim()).filter(Boolean);

const ProjectCard: React.FC<ProjectCardProps> = ({ project, pja, canDelete, onOpen, onDelete }) => {
    const aduan = splitAduan(project.noAduan);

    return (
        <article onClick={() => onOpen(project)} className="bg-white rounded-2xl border border-slate-200 px-4 pt-3 pb-3 cursor-pointer active:bg-slate-50">
            <div className="flex items-center gap-2 min-h-[44px]">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusColor(project.status)}`}>
                    {getStatusLabel(project.status)} · {Math.round(project.peratusSiap || 0)}%
                </span>
                <span className="text-xs font-mono text-slate-400">{formatDate(project.tarikhBuka)}</span>
                {canDelete && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(project); }}
                        aria-label="Padam"
                        title="Padam"
                        className="ml-auto -mr-2 w-11 h-11 shrink-0 flex items-center justify-center rounded-xl text-red-400 active:bg-red-50 active:text-red-600"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                )}
            </div>
            {project.noFail && <div className="font-extrabold text-slate-900 text-[15px] mt-1 break-words">{project.noFail}</div>}
            <ExpandableText text={project.namaProjek || ''} lines={3} className="mt-1 text-sm leading-5 font-medium text-slate-800" />
            <div className="mt-1 pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                    <PjaAvatar pja={pja} className="w-5 h-5 text-[9px]" />
                    <span className="font-bold text-slate-600 shrink-0">{pja?.username?.toUpperCase() || '-'}</span>
                    <span className="text-slate-300">·</span>
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {project.namaSyarikat
                        ? <span className="font-bold text-slate-700 truncate">{project.namaSyarikat}</span>
                        : <span className="text-slate-400 italic">Belum Lantik</span>}
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                    <span className="font-bold text-slate-400">Aduan</span>
                    {aduan.length > 0 ? (
                        <>
                            <span className="truncate">{aduan[0]}</span>
                            {aduan.length > 1 && <span className="px-1.5 rounded bg-slate-100 font-bold text-slate-600 shrink-0">+{aduan.length - 1}</span>}
                        </>
                    ) : <span className="text-slate-400">-</span>}
                </div>
            </div>
        </article>
    );
};

export default ProjectCard;
