import React, { useState } from 'react';
import { FileSignature } from 'lucide-react';
import { EmptyState } from '../../components/ui';
import { useContract, useContracts } from '../../hooks/useContracts';
import type { Contract } from '../../types';
import ContractRegister from '../../components/kontrak/ContractRegister';
import ContractDetail from '../../components/kontrak/ContractDetail';
import CreateContractSheet from '../../components/kontrak/CreateContractSheet';
import ImportWizard from '../../components/kontrak/import/ImportWizard';
import { useKontrakRoute } from '../../components/kontrak/useKontrakRoute';
import { TextButton } from '../../components/kontrak/bits';

/** Tetapan → Kontrak & buku kadar: register, one contract, or the import wizard, chosen by the URL. */
const KontrakPage: React.FC = () => {
  const { route, go } = useKontrakRoute();
  const { contracts, isLoading, createContract } = useContracts();
  const current = useContract(route.contractId);
  const [creating, setCreating] = useState<{ cloneFrom?: Contract } | null>(null);

  const body = (() => {
    if (!route.contractId) {
      return <ContractRegister contracts={contracts} isLoading={isLoading} onOpen={c => go({ contractId: c.id, tab: 'buku', importId: null })} onCreate={cloneFrom => setCreating({ cloneFrom })} />;
    }
    if (current.isLoading) return <p className="text-muted">Memuatkan kontrak…</p>;
    if (!current.data) {
      return <EmptyState icon={FileSignature} title="Kontrak tidak dijumpai" body="Pautan ini mungkin lama atau kontrak telah dipadam." action={<TextButton onClick={() => go({ contractId: null, importId: null })}>Kembali ke senarai</TextButton>} />;
    }
    const c = current.data;
    if (route.importId) {
      return <ImportWizard key={route.importId} contract={c} importId={route.importId}
        onExit={() => go({ importId: null })} onReview={vid => go({ importId: vid }, true)} onVersions={() => go({ importId: null, tab: 'versi' })} />;
    }
    return <ContractDetail contract={c} tab={route.tab} onTab={tab => go({ tab }, true)} onBack={() => go({ contractId: null, importId: null })}
      onImport={vid => go({ importId: vid ?? 'baru' })} />;
  })();

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-7xl mx-auto">
      {body}
      {creating && <CreateContractSheet open cloneFrom={creating?.cloneFrom} contracts={contracts} onClose={() => setCreating(null)}
        onSubmit={b => createContract.mutateAsync(b)}
        onCreated={c => { setCreating(null); go({ contractId: c.id, tab: 'buku', importId: null }); }} />}
    </div>
  );
};

export default KontrakPage;
