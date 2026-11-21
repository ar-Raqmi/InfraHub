import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import { Button, Sheet } from '../ui';
import type { Contract, ContractStatus } from '../../types';
import { plural } from './format';
import { Notice } from './bits';
import { useAction } from './useAction';

interface Props {
  open: boolean;
  contract: Contract;
  target: ContractStatus | null;
  contracts: Contract[];
  drafProjects: number;
  onClose: () => void;
  onConfirm: (status: ContractStatus) => Promise<unknown>;
}

const Bullet: React.FC<{ tone?: 'amber' | 'ink'; children: React.ReactNode }> = ({ tone = 'ink', children }) => (
  <li className="flex gap-2.5 text-[15px] text-ink">
    {tone === 'amber' ? <AlertTriangle className="w-5 h-5 text-amber shrink-0 mt-0.5" aria-hidden /> : <CheckCircle2 className="w-5 h-5 text-muted shrink-0 mt-0.5" aria-hidden />}
    <span>{children}</span>
  </li>
);

function activateLines(c: Contract, others: Contract[]): React.ReactNode[] {
  const lines: React.ReactNode[] = [];
  if (!c.stats?.currentVersion) lines.push(<Bullet key="nobook" tone="amber">Kontrak ini belum ada buku kadar yang diterbitkan. Import dan terbitkan BQ dahulu; pelayan akan menolak pengaktifan.</Bullet>);
  else lines.push(<Bullet key="book">Buku kadar v{c.stats.currentVersion} menjadi harga rasmi. Perubahan selepas ini menjadi versi baharu dalam log.</Bullet>);
  if (c.kind === 'PANEL') lines.push(<Bullet key="default">Projek baharu akan memakai <b>{c.code}</b> secara lalai kerana ia kontrak panel yang paling baru diaktifkan. PJA masih boleh memilih kontrak lain.</Bullet>);
  else lines.push(<Bullet key="standalone">Kontrak berasingan tidak menjadi lalai untuk projek baharu; ia dipilih secara manual pada projek berkenaan.</Bullet>);
  if (others.length) lines.push(<Bullet key="others" tone="amber">{others.map(o => o.code).join(', ')} kekal AKTIF. Tutup kontrak lama secara berasingan apabila tempohnya tamat.</Bullet>);
  return lines;
}

function closeLines(c: Contract, others: Contract[], draf: number): React.ReactNode[] {
  const total = c.stats?.projects ?? 0;
  const lines: React.ReactNode[] = [
    <Bullet key="draf" tone={draf ? 'amber' : 'ink'}>{draf ? <><b>{plural(draf, 'projek draf')}</b> di bawah kontrak ini akan ditanda <b>Perlu harga semula</b>. Kadar mereka tidak diubah secara senyap; PJA memilih kontrak baharu dan menyemak harga.</> : 'Tiada projek draf di bawah kontrak ini.'}</Bullet>,
    <Bullet key="kept">{plural(Math.max(0, total - draf), 'projek')} yang sudah dilantik kekal dengan kadar asal dan dokumen mereka tidak berubah.</Bullet>,
    <Bullet key="final">Kontrak yang ditutup tidak boleh dipilih untuk projek baharu dan tidak boleh dibuka semula. Buku kadarnya kekal boleh dibaca.</Bullet>,
  ];
  if (c.kind === 'PANEL' && !others.some(o => o.kind === 'PANEL')) lines.push(<Bullet key="none" tone="amber">Tiada kontrak panel AKTIF lain. Projek baharu tidak akan mempunyai kontrak lalai sehingga pengganti diaktifkan.</Bullet>);
  return lines;
}

const StatusActionSheet: React.FC<Props> = ({ open, contract, target, contracts, drafProjects, onClose, onConfirm }) => {
  const [ack, setAck] = useState(false);
  const { busy, error, run } = useAction();
  if (!target) return null;

  const others = contracts.filter(o => o.id !== contract.id && o.status === 'AKTIF');
  const closing = target === 'DITUTUP';
  const lines = closing ? closeLines(contract, others, drafProjects) : activateLines(contract, others);

  const confirm = async () => {
    if (await run(async () => { await onConfirm(target); return true; })) onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={closing ? `Tutup ${contract.code}?` : `Aktifkan ${contract.code}?`}
      footer={
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Batal</Button>
          <Button variant={closing ? 'danger' : 'primary'} icon={closing ? Lock : CheckCircle2} onClick={confirm} disabled={busy || (closing && !ack)} className="flex-[2]" data-testid="status-confirm">
            {busy ? 'Menyimpan…' : closing ? 'Tutup kontrak' : 'Aktifkan kontrak'}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-muted mb-3">Apa yang berlaku selepas ini:</p>
      <ul className="space-y-3">{lines}</ul>
      {closing && (
        <label className="mt-4 flex items-start gap-3 min-h-11 cursor-pointer">
          <input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} className="mt-1 w-5 h-5 accent-[#B42318]" />
          <span className="text-[15px] text-ink">Saya faham kontrak ini tidak boleh dibuka semula.</span>
        </label>
      )}
      <p className="mt-4 text-[13px] text-muted">Keputusan direkod dalam log perubahan dengan nama dan masa anda.</p>
      {error && <Notice tone="error" className="mt-3">{error}</Notice>}
    </Sheet>
  );
};

export default StatusActionSheet;
