import React, { useLayoutEffect, useRef, useState } from 'react';

interface FitToWidthProps {
  contentWidth: number;
  children: React.ReactNode;
}

// Scales fixed-width content (an A4 page) down to the available width, so a phone
// sees the whole page without a sideways scroll. At full size it renders unscaled.
const FitToWidth: React.FC<FitToWidthProps> = ({ contentWidth, children }) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number>();

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const measure = () => {
      const next = Math.min(1, outer.clientWidth / contentWidth);
      setScale(next);
      setHeight(next < 1 ? inner.offsetHeight * next : undefined);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(outer);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [contentWidth]);

  const isScaled = scale < 1;
  return (
    <div ref={outerRef} className={`w-full ${isScaled ? 'overflow-hidden' : ''}`} style={{ height }}>
      <div ref={innerRef} style={isScaled ? { width: contentWidth, transform: `scale(${scale})`, transformOrigin: 'top left' } : undefined}>{children}</div>
    </div>
  );
};

export default FitToWidth;
