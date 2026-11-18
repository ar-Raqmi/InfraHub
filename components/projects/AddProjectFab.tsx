import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus } from 'lucide-react';

// Portalled: AppShell's animate-slide-up wrapper keeps a transform, which would
// make a `fixed` child scroll with the page instead of staying on screen.
const AddProjectFab: React.FC<{ onClick: () => void }> = ({ onClick }) => {
    const [compact, setCompact] = useState(false);

    useEffect(() => {
        const onScroll = () => setCompact(window.scrollY > 120);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return createPortal(
        <button
            onClick={onClick}
            aria-label="Tambah Projek"
            className={`md:hidden fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 h-14 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center gap-2 border border-emerald-700 active:bg-emerald-700 ${compact ? 'w-14' : 'px-5'}`}
        >
            <Plus className="w-6 h-6 shrink-0" />
            {!compact && <span>Tambah Projek</span>}
        </button>,
        document.body
    );
};

export default AddProjectFab;
