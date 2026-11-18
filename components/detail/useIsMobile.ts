import { useEffect, useState } from 'react';

// Matches Tailwind's `md` breakpoint: below it the page uses its phone layout.
const QUERY = '(max-width: 767px)';

export const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(QUERY).matches);

  useEffect(() => {
    const media = window.matchMedia(QUERY);
    const onChange = () => setIsMobile(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return isMobile;
};
