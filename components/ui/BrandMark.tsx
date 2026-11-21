import React from 'react';

/** The InfraHub product mark: the official app icon, framed as a tile so its white square sits cleanly on paper. */
const LOGO_SRC = '/icons/apple-touch-icon-180.png';

export interface BrandMarkProps {
  size?: number;
  className?: string;
}

const BrandMark: React.FC<BrandMarkProps> = ({ size = 44, className = '' }) => (
  <img
    src={LOGO_SRC}
    alt="InfraHub"
    width={size}
    height={size}
    draggable={false}
    className={`shrink-0 bg-white rounded-ih-md ring-1 ring-line object-contain select-none ${className}`}
    style={{ width: size, height: size }}
  />
);

export default BrandMark;
