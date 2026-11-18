import React from 'react';
import { createPortal } from 'react-dom';
import { useIsMobile } from '../../lib/useIsMobile';

// The page sits inside the shell's z-10 stacking context, so a full-screen
// layer only covers the top bar and tab bar when it is moved to <body>.
const MobilePortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isMobile = useIsMobile();
  return isMobile ? createPortal(children, document.body) : <>{children}</>;
};

export default MobilePortal;
