/** Shared colour roles. Emerald/teal = system and action, kontrak = anything that IS a contract,
 *  amber = warning / stale rate, danger = destructive / missing. */
export type Tone = 'neutral' | 'emerald' | 'teal' | 'kontrak' | 'amber' | 'danger';

interface ToneClasses {
  soft: string;
  dot: string;
  text: string;
}

export const TONES: Record<Tone, ToneClasses> = {
  neutral: { soft: 'bg-paper-deep text-ink-soft border-line', dot: 'bg-muted-faint', text: 'text-ink' },
  emerald: { soft: 'bg-emerald-tint text-emerald-deep border-emerald-200', dot: 'bg-emerald-bright', text: 'text-emerald-deep' },
  teal: { soft: 'bg-teal-tint text-teal-deep border-teal-200', dot: 'bg-teal', text: 'text-teal-deep' },
  kontrak: { soft: 'bg-kontrak-tint text-kontrak border-kontrak-line', dot: 'bg-kontrak', text: 'text-kontrak' },
  amber: { soft: 'bg-amber-tint text-amber border-amber-line', dot: 'bg-amber', text: 'text-amber' },
  danger: { soft: 'bg-danger-tint text-danger border-danger-line', dot: 'bg-danger', text: 'text-danger' },
};
