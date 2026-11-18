import { RefObject, useLayoutEffect } from 'react';

// Grows a textarea to fit its text, so a long title or lokasi is read without an
// inner scroll. `field-sizing: content` would do this in CSS, but iOS Safari lacks it.
export const useAutosize = (ref: RefObject<HTMLTextAreaElement | null>, value: string, enabled: boolean) => {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!enabled) {
      el.style.height = '';
      return;
    }
    const fit = () => {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el.parentElement ?? el);
    return () => observer.disconnect();
  }, [ref, value, enabled]);
};
