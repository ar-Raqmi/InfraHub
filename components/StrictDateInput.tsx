import React, { useState, useEffect, useRef } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { formatDate } from '../types';

interface StrictDateInputProps {
  name: string;
  value?: string;
  onChange: (e: any) => void;
  className?: string;
  readOnly?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const StrictDateInput: React.FC<StrictDateInputProps> = ({ name, value, onChange, className, readOnly, disabled, placeholder }) => {
  const [textValue, setTextValue] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (value) {
      const formatted = formatDate(value);
      setTextValue(formatted);
      setError(false);
    } else {
      if (!error) setTextValue('');
    }
  }, [value]);

  const validateAndParse = (input: string): string | null => {
    const parts = input.trim().split(/[\/\-\.]/);
    if (parts.length !== 3) return null;
    let d = parseInt(parts[0], 10);
    let m = parseInt(parts[1], 10);
    let y = parseInt(parts[2], 10);

    if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
    if (y < 100) { y += 2000; }
    if (m < 1 || m > 12) return null;
    if (d < 1 || d > 31) return null;

    const dateObj = new Date(y, m - 1, d);
    if (dateObj.getFullYear() !== y || dateObj.getMonth() !== m - 1 || dateObj.getDate() !== d) { return null; }

    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTextValue(val);
    if (error) setError(false);
  };

  const commitDate = () => {
    if (textValue.trim() === '') {
      setError(false);
      onChange({ target: { name, value: null } });
      return;
    }
    const isoDate = validateAndParse(textValue);
    if (isoDate) {
      setError(false);
      onChange({ target: { name, value: isoDate } });
      setTextValue(formatDate(isoDate));
    } else {
      setError(true);
      onChange({ target: { name, value: null } });
    }
  };

  const handleBlur = () => { commitDate(); };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.currentTarget.blur(); } };
  const pickerRef = useRef<HTMLInputElement>(null);

  const handleIconClick = () => {
    if (pickerRef.current) {
      if ('showPicker' in HTMLInputElement.prototype) {
        try {
          pickerRef.current.showPicker();
        } catch (err) {
          pickerRef.current.click();
        }
      } else {
        pickerRef.current.click();
      }
    }
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(false);
    const val = e.target.value;
    onChange({ target: { name, value: val || null } });
  };

  return (
    <div className="relative">
      <div className={`relative flex items-center ${className} ${error ? 'border-red-400 focus:border-red-500 ring-1 ring-red-100' : ''}`}>
        <input
          type="text"
          value={textValue}
          onChange={handleTextChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'DD/MM/YYYY'}
          readOnly={readOnly}
          disabled={disabled}
          className={`w-full h-full bg-transparent border-none outline-none p-0 text-inherit placeholder-slate-400 ${readOnly ? 'cursor-not-allowed' : ''}`}
        />

        <div
          className="relative ml-2 w-5 h-5 shrink-0 cursor-pointer hover:text-blue-500 transition-colors"
          onClick={handleIconClick}
        >
          <Calendar className={`w-5 h-5 pointer-events-none ${error ? 'text-red-400' : 'text-slate-400'}`} />
        </div>

        {!readOnly && !disabled && (
          <input
            type="date"
            ref={pickerRef}
            name={name}
            value={value || ''}
            onChange={handlePickerChange}
            className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
            tabIndex={-1}
          />
        )}
      </div>
      {error && (
        <div className="absolute -bottom-5 left-0 text-[10px] text-red-500 font-bold flex items-center gap-1 whitespace-nowrap z-10">
          <AlertCircle className="w-3 h-3" /> Tarikh tidak sah
        </div>
      )}
    </div>
  );
};

export default StrictDateInput;
