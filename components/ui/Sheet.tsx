import React from 'react';
import BottomSheet from '../BottomSheet';

export interface SheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  /** Status line above the content, e.g. an <Indicator>. */
  lead?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/** The design-system name for BottomSheet: same portal, Esc and 44 px close, plus an optional lead line. */
const Sheet: React.FC<SheetProps> = ({ lead, children, ...sheet }) => (
  <BottomSheet {...sheet}>
    {lead && <div className="mb-3">{lead}</div>}
    {children}
  </BottomSheet>
);

export default Sheet;
