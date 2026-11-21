import React from 'react';
import { Contract, Project } from '../../types';
import { Chip, ContractChip, Indicator } from '../ui';

interface ContractCellProps {
  contract?: Contract;
  /** Reason from repriceReason(); set when a not-yet-awarded project sits on a closed / draft sebutharga. */
  repriceReason: string | null;
  project: Project;
}

/** The project's sebutharga, plus a re-pricing indicator when it can no longer be awarded on it. */
const ContractCell: React.FC<ContractCellProps> = ({ contract, repriceReason, project }) => (
  <span className="inline-flex flex-col items-start gap-1.5" data-reprice={repriceReason ? 'yes' : 'no'} data-project-id={project.id}>
    {contract
      ? <ContractChip code={contract.code} status={contract.status} />
      : <Chip tone="neutral">{project.noSebutharga || 'Tiada sebutharga'}</Chip>}
    {repriceReason && (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber" title={repriceReason}>
        <Indicator state="KADAR_BERUBAH" variant="dot" detail={repriceReason} />
        Perlu harga semula
      </span>
    )}
  </span>
);

export default ContractCell;
