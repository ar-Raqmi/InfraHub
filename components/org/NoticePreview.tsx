import React from 'react';
import type { Project } from '../../types';
import { Formatter } from '../../services/Formatter';
import type { OrgDocs } from './orgDocs';

export type NoticeKind = 'PEMBERITAHUAN' | 'PERINGATAN_1' | 'KERJA_TIDAK_SIAP' | 'PERINGATAN_2' | 'PERINGATAN_3';

const GROUP: Record<NoticeKind, string> = {
  PEMBERITAHUAN: 'doc.notis_pemberitahuan',
  PERINGATAN_1: 'doc.notis_peringatan_1',
  PERINGATAN_2: 'doc.notis_peringatan_2',
  PERINGATAN_3: 'doc.notis_peringatan_3',
  KERJA_TIDAK_SIAP: 'doc.kerja_tidak_siap',
};

const FIELDS: Record<NoticeKind, string[]> = {
  PEMBERITAHUAN: ['para1', 'para2', 'para3'],
  PERINGATAN_1: ['para2', 'para3', 'para4'],
  PERINGATAN_2: ['para2', 'para3', 'para4'],
  PERINGATAN_3: ['para2', 'para3', 'para4'],
  KERJA_TIDAK_SIAP: ['para1', 'para2'],
};

const longDate = (iso?: string) => (iso ? Formatter.formatDateMalayTitleCase(iso) : '................');

interface NoticePreviewProps {
  org: OrgDocs;
  kind: NoticeKind;
  project: Project;
  startDate: string;
  endDate: string;
  ladRate: string;
}

/** The letter's wording as it will print, so the officer reads it before downloading. */
const NoticePreview: React.FC<NoticePreviewProps> = ({ org, kind, project, startDate, endDate, ladRate }) => {
  const group = GROUP[kind];
  const vars = {
    tarikh_mula: longDate(startDate), tarikh_tamat: longDate(endDate), tarikh_sst: longDate(project.tarikhMulaKontrak),
    tarikh_siap_kontrak: longDate(project.tarikhTamatKontrak), kadar_lad: ladRate,
  };
  return (
    <section aria-label="Pratonton teks notis" data-testid="notis-preview" className="rounded-ih-md border border-line bg-paper p-4 space-y-2">
      <p className="ih-eyebrow text-muted">Pratonton teks</p>
      <p className="font-bold text-sm text-ink">{org.text(group, 'title')}</p>
      <div className="max-h-48 overflow-y-auto space-y-2 text-sm leading-relaxed text-ink-soft">
        {FIELDS[kind].map((field) => <p key={field}>{org.text(group, field, vars)}</p>)}
      </div>
      <p className="text-xs text-muted">Teks ini boleh diubah oleh pentadbir di Tetapan Organisasi → Teks dokumen.</p>
    </section>
  );
};

export default NoticePreview;
