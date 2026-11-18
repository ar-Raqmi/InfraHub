import React from 'react';
import { createPortal } from 'react-dom';

// Portalled because the page wrapper is animated with a transform, which would
// make `fixed` relative to the page instead of the screen.
const MobileBottomBar: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) =>
  createPortal(
    <div className={`md:hidden fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 bg-white border-t border-slate-200 px-4 py-2 ${className}`}>
      {children}
    </div>,
    document.body
  );

export default MobileBottomBar;
