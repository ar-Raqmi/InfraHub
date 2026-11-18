import React, { useEffect, useRef, useState } from 'react';

interface ExpandableTextProps {
  text: string;
  lines?: 2 | 3 | 4;
  className?: string;
}

// "Lihat penuh" is offered only when the text is really cut, so short titles
// carry no extra control.
const ExpandableText: React.FC<ExpandableTextProps> = ({ text, lines = 3, className = '' }) => {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || expanded) return;
    const measure = () => setClamped(el.scrollHeight > el.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, expanded, lines]);

  return (
    <div>
      <p ref={ref} className={`break-words ${expanded ? '' : `clamp-${lines}`} ${className}`}>{text}</p>
      {(clamped || expanded) && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
          aria-expanded={expanded}
          className="min-h-[44px] pr-4 text-xs font-bold text-emerald-700 active:text-emerald-900"
        >
          {expanded ? 'Tutup ▴' : 'Lihat penuh ▾'}
        </button>
      )}
    </div>
  );
};

export default ExpandableText;
