import React, { useLayoutEffect, useRef } from 'react';

type AutoGrowTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { value: string };

// Grows with its content so long specifications are read in full, not in a 2-row box.
const AutoGrowTextarea: React.FC<AutoGrowTextareaProps> = ({ value, className = '', ...rest }) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);

  return <textarea ref={ref} value={value} rows={1} className={`resize-none overflow-hidden ${className}`} {...rest} />;
};

export default AutoGrowTextarea;
