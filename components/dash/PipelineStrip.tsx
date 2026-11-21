import React from 'react';
import { ProjectStatus, getStatusLabel } from '../../types';
import { StatTile, STATUS_ORDER } from '../ui';
import type { Tone } from '../ui';

export interface PipelineHint {
  text: string;
  tone: Tone;
}

interface PipelineStripProps {
  counts: Record<ProjectStatus, number>;
  hints: Partial<Record<ProjectStatus, PipelineHint>>;
  active: ProjectStatus | 'ALL';
  onToggle: (status: ProjectStatus) => void;
}

/** The six workflow statuses as one strip of counters; a tile filters the project list below it. */
const PipelineStrip: React.FC<PipelineStripProps> = ({ counts, hints, active, onToggle }) => (
  <ol className="grid grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3" aria-label="Aliran projek mengikut status">
    {STATUS_ORDER.map((status, i) => {
      const hint = hints[status];
      const pressed = active === status;
      return (
        <li key={status} className="relative min-w-0" data-status={status}>
          <StatTile
            value={<span data-testid={`pipeline-count-${status}`}>{counts[status]}</span>}
            label={`${i + 1}. ${getStatusLabel(status)}`}
            hint={hint?.text}
            tone={hint?.tone ?? 'neutral'}
            onClick={() => onToggle(status)}
            className={`w-full h-full max-md:min-h-[96px] max-md:p-3 ${pressed ? 'border-ink ring-2 ring-ink/15' : ''}`}
          />
          {pressed && <span className="sr-only">Ditapis</span>}
        </li>
      );
    })}
  </ol>
);

export default PipelineStrip;
