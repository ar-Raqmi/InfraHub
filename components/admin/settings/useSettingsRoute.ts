import { useEffect, useState } from 'react';

export type SettingsSection = 'meeting' | 'sebutharga' | 'template' | 'pustaka' | 'company' | 'vote';

export interface SettingsRoute {
  sec?: SettingsSection;
  cat?: string;
  groupId?: string;
  itemId?: string;
}

const SECTIONS: SettingsSection[] = ['meeting', 'sebutharga', 'template', 'pustaka', 'company', 'vote'];

function parseHash(hash: string): SettingsRoute {
  const [sec, cat, groupId, itemId] = hash.replace(/^#/, '').split('/').map(decodeURIComponent);
  if (!SECTIONS.includes(sec as SettingsSection)) return {};
  return { sec: sec as SettingsSection, cat: cat || undefined, groupId: groupId || undefined, itemId: itemId || undefined };
}

function toHash(route: SettingsRoute): string {
  const parts = [route.sec, route.cat, route.groupId, route.itemId].filter(Boolean) as string[];
  return parts.length ? `#${parts.map(encodeURIComponent).join('/')}` : '';
}

function parentOf(route: SettingsRoute): SettingsRoute {
  if (route.itemId) return { ...route, itemId: undefined };
  if (route.groupId) return { ...route, groupId: undefined };
  if (route.cat) return { sec: route.sec };
  return {};
}

// The phone layout drills into one section at a time. Each level is a history
// entry, so the Android back button steps up a level instead of leaving the page.
export function useSettingsRoute() {
  const [route, setRoute] = useState<SettingsRoute>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onPop = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const write = (next: SettingsRoute, replace: boolean) => {
    const url = window.location.pathname + window.location.search + toHash(next);
    if (replace) window.history.replaceState({ settingsDepth: window.history.state?.settingsDepth ?? 0 }, '', url);
    else window.history.pushState({ settingsDepth: (window.history.state?.settingsDepth ?? 0) + 1 }, '', url);
    setRoute(next);
    window.scrollTo(0, 0);
  };

  const go = (next: SettingsRoute) => write(next, false);
  const replace = (next: SettingsRoute) => write(next, true);

  const back = () => {
    if ((window.history.state?.settingsDepth ?? 0) > 0) window.history.back();
    else write(parentOf(parseHash(window.location.hash)), true);
  };

  return { route, go, replace, back };
}
