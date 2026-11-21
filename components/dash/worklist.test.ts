import { describe, expect, it } from 'vitest';
import { Contract, Project, ProjectStatus } from '../../types';
import { buildWorklist, medianPaperworkDays, paperworkWait, pendingNotice, repriceReason, statusCounts } from './worklist';

const contract = (id: string, status: Contract['status']): Contract => ({ id, code: id.toUpperCase(), title: id, kind: 'PANEL', status });
const project = (over: Partial<Project>): Project => ({ id: 1, status: ProjectStatus.FASA_DRAF, tarikhBuka: '2026-01-10', ...over } as Project);
const byId = new Map([contract('a', 'AKTIF'), contract('c', 'DITUTUP'), contract('d', 'DRAF')].map(c => [c.id, c]));

describe('repriceReason', () => {
  it('flags pre-award projects on a closed, draft, missing or unknown sebutharga', () => {
    expect(repriceReason(project({ contractId: 'c' }), byId)).toBe('Sebutharga sudah ditutup');
    expect(repriceReason(project({ contractId: 'd', status: ProjectStatus.MENUNGGU_LANTIKAN }), byId)).toBe('Sebutharga masih draf');
    expect(repriceReason(project({ contractId: null }), byId)).toBe('Tiada sebutharga');
    expect(repriceReason(project({ contractId: 'x' }), byId)).toBe('Sebutharga tidak dijumpai');
  });
  it('leaves AKTIF-bound and already-awarded projects alone', () => {
    expect(repriceReason(project({ contractId: 'a' }), byId)).toBeNull();
    expect(repriceReason(project({ contractId: 'c', status: ProjectStatus.DALAM_PROSES }), byId)).toBeNull();
  });
  it('treats an issued No. Inden as locked to its sebutharga', () => {
    expect(repriceReason(project({ contractId: 'c', status: ProjectStatus.MENUNGGU_LANTIKAN, noInden: 'A0012345' }), byId)).toBeNull();
  });
});

describe('paperworkWait', () => {
  it('counts days since Siap Sebenar while the claim is missing', () => {
    expect(paperworkWait(project({ status: ProjectStatus.PEMERIKSAAN_TAPAK, tarikhSiapSebenar: '2026-03-01' }), '2026-03-31'))
      .toEqual({ stage: 'TUNTUTAN', since: '2026-03-01', days: 30 });
  });
  it('then counts days since the claim until it reaches Kewangan', () => {
    const p = project({ status: ProjectStatus.TUNTUTAN_BAYARAN, tarikhSiapSebenar: '2026-03-01', tarikhTuntutanBayaran: '2026-03-21' });
    expect(paperworkWait(p, '2026-03-31')).toEqual({ stage: 'KEWANGAN', since: '2026-03-21', days: 10 });
  });
  it('is null before site completion, after hand-over, and for SIAP', () => {
    expect(paperworkWait(project({ status: ProjectStatus.DALAM_PROSES }), '2026-03-31')).toBeNull();
    expect(paperworkWait(project({ status: ProjectStatus.TUNTUTAN_BAYARAN, tarikhSiapSebenar: '2026-03-01', tarikhTuntutanBayaran: '2026-03-02', tarikhHantarKewangan: '2026-03-03' }), '2026-03-31')).toBeNull();
    expect(paperworkWait(project({ status: ProjectStatus.SIAP, tarikhSiapSebenar: '2026-03-01' }), '2026-03-31')).toBeNull();
  });
});

describe('pendingNotice (same rules as the old Dashboard)', () => {
  const base = { status: ProjectStatus.DALAM_PROSES, tarikhTamatKontrak: '2026-05-20' };
  it('escalates with the days past the contract end', () => {
    expect(pendingNotice(project(base), '2026-05-12')).toBeNull();
    expect(pendingNotice(project(base), '2026-05-13')).toBe('Notis Pertama');
    expect(pendingNotice(project(base), '2026-05-20')).toBe('Kerja Tidak Siap');
    expect(pendingNotice(project(base), '2026-05-27')).toBe('Notis Kedua');
    expect(pendingNotice(project(base), '2026-06-03')).toBe('Notis Ketiga');
  });
  it('uses Tarikh Pemeriksaan as "today" when set, and skips issued notices', () => {
    expect(pendingNotice(project({ ...base, tarikhPemeriksaan: '2026-05-01' }), '2026-09-01')).toBeNull();
    expect(pendingNotice(project({ ...base, notisPeringatan1Status: 'SENT' }), '2026-05-14')).toBeNull();
  });
});

describe('buildWorklist / statusCounts / medianPaperworkDays', () => {
  const list = [
    project({ id: 1, contractId: 'c' }),
    project({ id: 2, status: ProjectStatus.PEMERIKSAAN_TAPAK, contractId: 'a', tarikhSiapSebenar: '2026-03-01' }),
    project({ id: 3, status: ProjectStatus.TUNTUTAN_BAYARAN, contractId: 'a', tarikhSiapSebenar: '2026-02-01', tarikhTuntutanBayaran: '2026-02-11' }),
    project({ id: 4, status: ProjectStatus.SIAP, contractId: 'a', tarikhSiapSebenar: '2026-01-01', tarikhPadanan: '2026-03-02' }),
    project({ id: 5, status: ProjectStatus.SIAP, contractId: 'a', tarikhSiapSebenar: '2026-01-01', tarikhPadanan: '2026-01-31' }),
  ];
  it('groups by what has to happen, longest wait first', () => {
    const w = buildWorklist(list, [...byId.values()], '2026-03-31');
    expect(w.reprice.map(i => i.project.id)).toEqual([1]);
    expect(w.reprice[0].contract?.status).toBe('DITUTUP');
    expect(w.paperwork.map(i => [i.project.id, i.days])).toEqual([[3, 48], [2, 30]]);
  });
  it('counts every status, zeros included', () => {
    expect(statusCounts(list)).toEqual({ FASA_DRAF: 1, MENUNGGU_LANTIKAN: 0, DALAM_PROSES: 0, PEMERIKSAAN_TAPAK: 1, TUNTUTAN_BAYARAN: 1, SIAP: 2 });
  });
  it('medians Siap Sebenar -> Padanan over SIAP projects', () => {
    expect(medianPaperworkDays(list)).toBe(45);
  });
});
