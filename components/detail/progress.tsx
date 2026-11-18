import React from 'react';
import { ProjectStatus } from '../../types';

const SEGMENTS = [
  { color: '#0059B2', start: 0, end: 33.33 },
  { color: '#EF4444', start: 33.33, end: 66.66 },
  { color: '#008C4A', start: 66.66, end: 100 }
];

export const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: ProjectStatus.FASA_DRAF, label: 'Fasa Draf' },
  { value: ProjectStatus.MENUNGGU_LANTIKAN, label: 'Menunggu Lantikan' },
  { value: ProjectStatus.DALAM_PROSES, label: 'Dalam Proses' },
  { value: ProjectStatus.PEMERIKSAAN_TAPAK, label: 'Pemeriksaan Tapak' },
  { value: ProjectStatus.TUNTUTAN_BAYARAN, label: 'Tuntutan Bayaran' },
  { value: ProjectStatus.SIAP, label: 'Siap' }
];

export const parseProgress = (raw: string): number => {
  const val = parseFloat(raw.replace(/[^0-9.]/g, ''));
  if (isNaN(val)) return 0;
  return Math.min(val, 100);
};

interface TriColourBarProps {
  progress: number;
  className: string;
  segmentClassName: string;
}

export const TriColourBar: React.FC<TriColourBarProps> = ({ progress, className, segmentClassName }) => {
  const p = Math.min(100, Math.max(0, Number(progress) || 0));
  return (
    <div className={className}>
      {SEGMENTS.map((seg, i) => {
        const width = Math.max(0, Math.min(100, ((p - seg.start) / (seg.end - seg.start)) * 100));
        return (
          <div key={i} className={segmentClassName}>
            <div className="h-full transition-all duration-1000 ease-out" style={{ width: `${width}%`, backgroundColor: seg.color }} />
          </div>
        );
      })}
    </div>
  );
};
