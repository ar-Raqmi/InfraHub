import { useEffect, useState } from 'react';

// Same edge as Tailwind's `md:` (768px), so the JS branch and the CSS branch agree.
const MOBILE_QUERY = '(max-width: 767.98px)';

export const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);
    useEffect(() => {
        const mql = window.matchMedia(MOBILE_QUERY);
        const onChange = () => setIsMobile(mql.matches);
        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
    }, []);
    return isMobile;
};
