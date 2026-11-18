import { useEffect, useState, RefObject } from 'react';

export const useInView = (ref: RefObject<Element | null>) => {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return inView;
};
