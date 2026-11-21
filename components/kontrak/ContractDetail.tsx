import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, FileSpreadsheet, Lock, Trash2 } from 'lucide-react';
import { Button, ContractChip, Sheet, StatTile, Tabs } from '../ui';
import { useContracts } from '../../hooks/useContracts';
import type { Contract, ContractStatus } from '../../types';
import BookBrowser from './BookBrowser';
import ContractDetailsForm from './ContractDetailsForm';
import PanelEditor from './PanelEditor';
import StatusActionSheet from './StatusActionSheet';
import VersionLog from './VersionLog';
import { KIND_LABEL, money, validity } from './format';
import type { DetailTab } from './useKontrakRoute';
import { useContractProjects } from './useContractProjects';

interface Props {
  contract: Contract;
  tab: DetailTab;
  onTab: (t: DetailTab) => void;
  onBack: () => void;
  onImport: (versionId?: string) => void;
}

const NEXT_STATUS: Partial<Record<ContractStatus, ContractStatus>> = { DRAF: 'AKTIF', AKTIF: 'DITUTUP' };

const ContractHeader: React.FC<{ c: Contract; draf: number; onBack: () => void; actions: React.ReactNode }> = ({ c, draf, onBack, actions }) => (
  <header className="rounded-ih-lg border border-kontrak-line bg-kontrak-tint p-4 md:p-6 space-y-4">
    <button type="button" onClick={onBack} className="min-h-11 -ml-1 inline-flex items-center gap-1.5 text-sm font-bold text-kontrak"><ArrowLeft className="w-4 h-4" aria-hidden /> Semua kontrak</button>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="ih-eyebrow text-kontrak">Kontrak {KIND_LABEL[c.kind].toLowerCase()} · sebutharga</p>
        <h1 className="font-display font-extrabold text-[2rem] md:text-display-xl text-kontrak leading-tight break-words ih-num" data-testid="contract-code">{c.code}</h1>
        <p className="text-[17px] text-ink mt-1 break-words">{c.title}</p>
      </div>
      <div className="flex flex-wrap gap-2">{actions}</div>
    </div>
    <ContractChip size="lg" code={c.code} status={c.status} book={c.stats?.currentVersion ? `buku v${c.stats.currentVersion}` : 'tiada buku diterbitkan'}
      meta={`${validity(c)} · had syarikat ${money(c.companyCap)}${c.meetingNumber ? ` · mesyuarat ${c.meetingNumber}` : ''}`} className="bg-surface" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatTile value={c.stats?.projects ?? 0} label="Projek" tone="kontrak" />
      <StatTile value={draf} label="Belum dilantik" tone={draf ? 'amber' : 'neutral'} />
      <StatTile value={c.stats?.panelSize ?? 0} label="Syarikat panel" />
      <StatTile value={c.stats?.currentVersion ? `v${c.stats.currentVersion}` : '—'} label={`${c.stats?.versions ?? 0} versi`} tone="kontrak" />
    </div>
  </header>
);

const ContractDetail: React.FC<Props> = ({ contract, tab, onTab, onBack, onImport }) => {
  const { contracts, setStatus, deleteContract } = useContracts();
  const { draf, valueByCompany } = useContractProjects(contract.id);
  const [statusTarget, setStatusTarget] = useState<ContractStatus | null>(null);
  const [browseVersion, setBrowseVersion] = useState<{ id: string; no: number } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const closed = contract.status === 'DITUTUP';
  const next = NEXT_STATUS[contract.status];
  const deletable = contract.status !== 'AKTIF' && (contract.stats?.projects ?? 0) === 0;

  const actions = (
    <>
      {!closed && <Button variant="kontrak" icon={FileSpreadsheet} onClick={() => onImport()} data-testid="open-import">Import BQ Excel</Button>}
      {next === 'AKTIF' && <Button variant="primary" icon={CheckCircle2} onClick={() => setStatusTarget('AKTIF')} data-testid="activate">Aktifkan</Button>}
      {next === 'DITUTUP' && <Button variant="danger" icon={Lock} onClick={() => setStatusTarget('DITUTUP')} data-testid="close-contract">Tutup</Button>}
      {deletable && <Button variant="outline" icon={Trash2} onClick={() => setConfirmDelete(true)} data-testid="delete-contract">Padam</Button>}
    </>
  );

  return (
    <div className="space-y-6">
      <ContractHeader c={contract} draf={draf} onBack={onBack} actions={actions} />
      <Tabs label="Bahagian kontrak" value={tab} onChange={id => onTab(id as DetailTab)} items={[
        { id: 'buku', label: 'Buku kadar' },
        { id: 'versi', label: 'Versi & log', count: contract.stats?.versions },
        { id: 'panel', label: 'Panel', count: contract.stats?.panelSize },
        { id: 'butiran', label: 'Butiran' },
      ]} />

      {tab === 'buku' && (
        <div className="space-y-3">
          {browseVersion && (
            <p className="text-sm rounded-ih-md border border-kontrak-line bg-kontrak-tint px-3 py-2 text-kontrak flex flex-wrap items-center gap-2">
              Anda melihat versi lama v{browseVersion.no}.
              <button type="button" className="font-bold underline min-h-11" onClick={() => setBrowseVersion(null)}>Kembali ke versi semasa</button>
            </p>
          )}
          <BookBrowser contractId={contract.id} version={browseVersion?.id}
            versionLabel={browseVersion ? `Versi v${browseVersion.no}` : contract.stats?.currentVersion ? `Versi semasa v${contract.stats.currentVersion}` : 'Tiada versi'}
            emptyAction={!closed ? <Button variant="kontrak" icon={FileSpreadsheet} onClick={() => onImport()}>Import BQ Excel</Button> : undefined} />
        </div>
      )}
      {tab === 'versi' && (
        <VersionLog contractId={contract.id}
          onBrowse={v => { setBrowseVersion({ id: v.id, no: v.versionNo }); onTab('buku'); }}
          onResume={v => onImport(v.id)} />
      )}
      {tab === 'panel' && <PanelEditor contract={contract} valueByCompany={valueByCompany} readOnly={closed} />}
      {tab === 'butiran' && <ContractDetailsForm contract={contract} readOnly={closed} />}

      {statusTarget && <StatusActionSheet open target={statusTarget} contract={contract} contracts={contracts} drafProjects={draf}
        onClose={() => setStatusTarget(null)} onConfirm={status => setStatus.mutateAsync({ id: contract.id, status })} />}

      <Sheet open={confirmDelete} title={`Padam ${contract.code}?`} onClose={() => setConfirmDelete(false)}
        footer={<div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setConfirmDelete(false)}>Batal</Button>
          <Button variant="danger" icon={Trash2} disabled={deleteContract.isPending} data-testid="confirm-delete-contract"
            onClick={async () => { await deleteContract.mutateAsync(contract.id); setConfirmDelete(false); onBack(); }}>Padam kontrak</Button>
        </div>}>
        <p className="text-[15px] text-ink">Tiada projek menggunakan kontrak ini. Semua versi buku kadar, panel dan padanan import akan dibuang. Tindakan ini direkod dalam log perubahan.</p>
        {deleteContract.error && <p className="mt-3 rounded-ih-md border border-danger-line bg-danger-tint px-3 py-2 text-sm font-bold text-danger" role="alert">{(deleteContract.error as Error).message}</p>}
      </Sheet>
    </div>
  );
};

export default ContractDetail;
