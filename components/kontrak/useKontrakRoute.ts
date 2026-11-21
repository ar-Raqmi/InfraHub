import { useCallback, useEffect, useState } from 'react';

export type DetailTab = 'buku' | 'versi' | 'panel' | 'butiran';

/** Where the officer is inside kontrak.html, kept in the URL so Back and shared links work. */
export interface KontrakRoute {
  contractId: string | null;
  tab: DetailTab;
  /** Import wizard: 'baru' = upload steps, otherwise the DRAF version under review. */
  importId: string | null;
}

const TABS: DetailTab[] = ['buku', 'versi', 'panel', 'butiran'];

function read(): KontrakRoute {
  const q = new URLSearchParams(window.location.search);
  const tab = q.get('tab') as DetailTab | null;
  return { contractId: q.get('c'), tab: tab && TABS.includes(tab) ? tab : 'buku', importId: q.get('import') };
}

function write(route: KontrakRoute): string {
  const q = new URLSearchParams();
  if (route.contractId) q.set('c', route.contractId);
  if (route.contractId && route.tab !== 'buku') q.set('tab', route.tab);
  if (route.importId) q.set('import', route.importId);
  const s = q.toString();
  return `${window.location.pathname}${s ? `?${s}` : ''}`;
}

export function useKontrakRoute() {
  const [route, setRoute] = useState<KontrakRoute>(read);

  useEffect(() => {
    const onPop = () => setRoute(read());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const go = useCallback((next: Partial<KontrakRoute>, replace = false) => {
    const merged = { ...read(), ...next };
    if (replace) window.history.replaceState(null, '', write(merged));
    else window.history.pushState(null, '', write(merged));
    window.scrollTo({ top: 0 });
    setRoute(merged);
  }, []);

  return { route, go };
}
