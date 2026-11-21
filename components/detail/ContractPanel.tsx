// Contract binding on the project page: which sebutharga prices this BQ, its lock, the swap action and the
// "Perlu harga semula" banner for draf projects left on a closed contract.
import React, { useState } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { Button, ContractChip } from '../ui';
import { useContracts } from '../../hooks/useContracts';
import type { Project } from '../../types';
import { needsRepricing } from '../../domain/repricing';
import ContractSwapSheet from './ContractSwapSheet';

interface ContractPanelProps {
  project: Partial<Project>;
  /** Saved project id; unsaved projects cannot swap yet. */
  savedId?: number;
  readOnly: boolean;
  hasUnsavedChanges: boolean;
  onApplied: (project: Project) => void;
  /** Saves the form first: the re-price works on the saved BQ, so unsaved edits must not be lost. */
  onSaveFirst: () => Promise<void>;
}

function metaLine(project: Partial<Project>, savedId: number | undefined, locked: boolean): string {
  if (!savedId) return 'Projek baharu memakai sebutharga AKTIF';
  if (locked) return `Dikunci: No. Inden ${project.noInden} telah dikeluarkan`;
  return 'Boleh ditukar selagi No. Inden belum dikeluarkan';
}

const ContractPanel: React.FC<ContractPanelProps> = ({ project, savedId, readOnly, hasUnsavedChanges, onApplied, onSaveFirst }) => {
  const { contracts, activeContract } = useContracts();
  const [open, setOpen] = useState(false);
  const contract = contracts.find((c) => c.id === project.contractId) ?? (project.contractId ? undefined : activeContract);
  if (!contract) return null;

  const locked = !!(project.noInden ?? '').trim();
  const version = contract.stats?.currentVersion;
  const needsReprice = needsRepricing(project, contract.status);
  const canSwap = !!savedId && !readOnly;
  const startSwap = async () => {
    if (hasUnsavedChanges) await onSaveFirst();
    setOpen(true);
  };

  return (
    <div className="mb-4 flex flex-col gap-2" data-testid="contract-panel">
      {needsReprice && (
        <div className="flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-ih-lg border border-amber-line bg-amber-tint" data-testid="reprice-banner">
          <AlertTriangle className="w-5 h-5 text-amber shrink-0 max-md:hidden" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-ink">Perlu harga semula</p>
            <p className="text-[14px] text-ink">Sebutharga {contract.code} telah ditutup, tetapi projek draf ini masih memakai kadarnya. Pilih sebutharga AKTIF dan semak perbezaan setiap baris.</p>
          </div>
          {canSwap && <Button variant="kontrak" icon={RefreshCw} onClick={startSwap}>Harga semula</Button>}
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
        <ContractChip size="lg" className="flex-1 min-w-0" code={contract.code} status={contract.status}
          book={version ? `Kadar versi ${version}` : undefined} meta={metaLine(project, savedId, locked)} locked={locked} />
        {canSwap && !needsReprice && (
          <Button variant="outline" icon={RefreshCw} onClick={startSwap} data-testid="swap-open" className="md:self-stretch">Tukar sebutharga</Button>
        )}
      </div>
      {savedId && (
        <ContractSwapSheet open={open} project={{ ...project, id: savedId }} currentContract={contract}
          onClose={() => setOpen(false)} onApplied={(p) => { setOpen(false); onApplied(p); }} />
      )}
    </div>
  );
};

export default ContractPanel;
