import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';

const isTextField = (el: Element | null) => !!el && (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && (el as HTMLInputElement).type !== 'checkbox'));

interface PinnedAddButtonProps {
    label: string;
    onClick: () => void;
    // Only pin while this editor is on screen.
    containerRef: React.RefObject<HTMLElement | null>;
    hidden: boolean;
    className: string;
}

// Phone "Tambah Item" pinned above the bottom tab bar. It steps aside while the
// keyboard is up (a text field has focus) or the editor is scrolled out of view.
const PinnedAddButton: React.FC<PinnedAddButtonProps> = ({ label, onClick, containerRef, hidden, className }) => {
    const [typing, setTyping] = useState(false);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const onFocusIn = () => setTyping(isTextField(document.activeElement));
        const onFocusOut = () => setTyping(false);
        document.addEventListener('focusin', onFocusIn);
        document.addEventListener('focusout', onFocusOut);
        return () => {
            document.removeEventListener('focusin', onFocusIn);
            document.removeEventListener('focusout', onFocusOut);
        };
    }, []);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
        observer.observe(el);
        return () => observer.disconnect();
    }, [containerRef]);

    if (hidden || typing || !inView) return null;
    return (
        <div className="md:hidden fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 px-3 pb-2 pointer-events-none">
            <button type="button" data-bq-pinned-add onClick={onClick} className={`pointer-events-auto w-full min-h-[52px] rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 ${className}`}>
                <Plus className="w-5 h-5" /> {label}
            </button>
        </div>
    );
};

export default PinnedAddButton;
