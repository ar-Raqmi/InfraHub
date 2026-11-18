import React from 'react';

interface TouchIconButtonProps {
    label: string;
    onClick: () => void;
    children: React.ReactNode;
    disabled?: boolean;
    danger?: boolean;
    className?: string;
}

// 44 px icon button for phone layouts; always visible (no hover reveal).
const TouchIconButton: React.FC<TouchIconButtonProps> = ({ label, onClick, children, disabled, danger, className = '' }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        title={label}
        className={`w-11 h-11 shrink-0 flex items-center justify-center rounded-xl border border-slate-200 bg-white disabled:opacity-30 ${danger ? 'text-red-500 active:bg-red-50' : 'text-slate-500 active:bg-slate-100'} ${className}`}
    >
        {children}
    </button>
);

export default TouchIconButton;
