import React from 'react';
import { Building2, Trash2 } from 'lucide-react';
import { Contract, Project, User, formatDate } from '../../types';
import ExpandableText from '../ExpandableText';
import { IconButton, StatusPill } from '../ui';
import PjaAvatar from './PjaAvatar';
import ContractCell from './ContractCell';

interface ProjectCardProps {
    project: Project;
    pja?: User;
    contract?: Contract;
    repriceReason: string | null;
    canDelete: boolean;
    onOpen: (project: Project) => void;
    onDelete: (project: Project) => void;
}

const splitAduan = (noAduan?: string) => (noAduan || '').split(/[,;\n]/).map(a => a.trim()).filter(Boolean);

/** Phone row of the Senarai Projek list. */
const ProjectCard: React.FC<ProjectCardProps> = ({ project, pja, contract, repriceReason, canDelete, onOpen, onDelete }) => {
    const aduan = splitAduan(project.noAduan);

    return (
        <article onClick={() => onOpen(project)} className="bg-surface rounded-ih-lg border border-line px-4 pt-3 pb-3 cursor-pointer active:bg-paper" data-project-id={project.id}>
            <div className="flex items-center gap-2 min-h-11">
                <StatusPill status={project.status} />
                <span className="text-xs text-muted ih-num">{Math.round(project.peratusSiap || 0)}% · {formatDate(project.tarikhBuka)}</span>
                {canDelete && (
                    <IconButton
                        icon={Trash2}
                        label="Padam"
                        onClick={(e) => { e.stopPropagation(); onDelete(project); }}
                        className="ml-auto -mr-2 text-danger hover:text-danger"
                    />
                )}
            </div>
            {project.noFail && <div className="font-bold text-ink text-[15px] mt-1 break-words ih-num">{project.noFail}</div>}
            <ExpandableText text={project.namaProjek || ''} lines={3} className="mt-1 text-sm leading-5 text-ink-soft" />
            <div className="mt-2 pt-2 border-t border-line space-y-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                    <PjaAvatar pja={pja} className="w-5 h-5 text-[9px]" />
                    <span className="font-bold text-ink-soft shrink-0">{pja?.username?.toUpperCase() || '-'}</span>
                    <span className="text-muted-faint" aria-hidden>·</span>
                    <Building2 className="w-3.5 h-3.5 text-muted shrink-0" aria-hidden />
                    {project.namaSyarikat
                        ? <span className="font-bold text-ink truncate">{project.namaSyarikat}</span>
                        : <span className="text-muted italic">Belum dilantik</span>}
                </div>
                <div className="flex items-center gap-2 text-muted min-w-0">
                    <span className="font-bold">Aduan</span>
                    {aduan.length > 0 ? (
                        <>
                            <span className="truncate">{aduan[0]}</span>
                            {aduan.length > 1 && <span className="px-1.5 rounded-ih-sm bg-paper-deep font-bold text-ink-soft shrink-0">+{aduan.length - 1}</span>}
                        </>
                    ) : <span>-</span>}
                </div>
                <ContractCell contract={contract} repriceReason={repriceReason} project={project} />
            </div>
        </article>
    );
};

export default ProjectCard;
