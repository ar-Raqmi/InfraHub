import React, { useRef } from 'react';
import { useAutosize } from './useAutosize';

interface LokasiTextareaProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  className: string;
}

// Phone version of the lokasi input: wraps long addresses onto more lines instead of
// cutting them off. Newlines are stripped because each row is one lokasi in the PDFs.
const LokasiTextarea: React.FC<LokasiTextareaProps> = ({ value, onChange, disabled, className }) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  useAutosize(ref, value, true);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\s*\n\s*/g, ' '))}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}
      disabled={disabled}
      className={`${className} resize-none overflow-hidden block`}
      placeholder="Lokasi"
      required
    />
  );
};

export default LokasiTextarea;
