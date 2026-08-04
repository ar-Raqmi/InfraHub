const SHOW_DELAY_MS = 300;
const OVERLAY_ID = 'infrahub-nav-overlay';

let overlayTimer: ReturnType<typeof setTimeout> | null = null;

function buildOverlay(): HTMLElement {
  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.className = 'infrahub-nav-overlay';
  overlay.innerHTML =
    '<div class="infrahub-nav-card">' +
    '<div class="infrahub-nav-spinner"></div>' +
    '<div class="infrahub-nav-text">Memuatkan...</div>' +
    '</div>';
  return overlay;
}

function showOverlay(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(OVERLAY_ID)) return;
  document.body.appendChild(buildOverlay());
}

function clearTimer(): void {
  if (overlayTimer !== null) {
    clearTimeout(overlayTimer);
    overlayTimer = null;
  }
}

// Only reveal the overlay if navigation takes longer than SHOW_DELAY_MS.
// On fast connections the page swaps before this fires, so nothing flashes.
function scheduleIndicator(): void {
  clearTimer();
  overlayTimer = setTimeout(showOverlay, SHOW_DELAY_MS);
}

function isInternalNavigation(anchor: HTMLAnchorElement): boolean {
  const href = anchor.getAttribute('href');
  if (!href) return false;
  if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
  if (anchor.target === '_blank') return false;
  if (anchor.hasAttribute('download')) return false;
  try {
    const url = new URL(anchor.href, window.location.href);
    return url.origin === window.location.origin;
  } catch {
    return false;
  }
}

type NavigationGuard = () => boolean;
let activeGuard: NavigationGuard | null = null;
let bypassGuard = false;

export function setNavigationGuard(guard: NavigationGuard | null): void {
  activeGuard = guard;
}

function showLeaveConfirmDialog(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 animate-fade-in';
    overlay.innerHTML =
      '<div class="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 relative animate-slide-up">' +
        '<div class="flex flex-col items-center text-center pt-2">' +
          '<div class="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 text-amber-500">' +
            '<div class="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center">' +
              '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>' +
            '</div>' +
          '</div>' +
          '<h3 class="text-xl font-bold text-slate-900 mb-2">Perubahan Belum Disimpan</h3>' +
          '<p class="text-slate-500 mb-8 text-sm leading-relaxed px-4">Anda ada perubahan pada <strong class="text-slate-800">Pustaka BQ</strong> yang belum disimpan. Jika anda meninggalkan halaman ini, perubahan tersebut akan hilang.</p>' +
          '<div class="flex gap-3 w-full">' +
            '<button type="button" data-guard-action="cancel" class="flex-1 py-3.5 px-4 bg-white text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors border border-slate-200 shadow-sm hover:shadow-md">Batal</button>' +
            '<button type="button" data-guard-action="leave" class="flex-1 py-3.5 px-4 rounded-xl font-bold text-white transition-colors flex items-center justify-center gap-2 shadow-lg bg-red-600 hover:bg-red-700 shadow-red-600/30">Tinggalkan Halaman</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    const cleanup = (result: boolean) => {
      overlay.remove();
      document.removeEventListener('keydown', onKey);
      resolve(result);
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') cleanup(false);
    };

    overlay.addEventListener('click', (ev) => {
      const target = ev.target as HTMLElement;
      const action = target.closest('[data-guard-action]')?.getAttribute('data-guard-action');
      if (action === 'cancel') cleanup(false);
      else if (action === 'leave') cleanup(true);
      else if (target === overlay) cleanup(false);
    });
    document.addEventListener('keydown', onKey);

    document.body.appendChild(overlay);
  });
}

export function navigate(url: string): void {
  scheduleIndicator();
  window.location.href = url;
}

export function navigateReplace(url: string): void {
  scheduleIndicator();
  window.location.replace(url);
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', async (e) => {
    if (e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const anchor = (e.target as HTMLElement | null)?.closest?.('a');
    if (!anchor) return;
    if (!isInternalNavigation(anchor)) return;
    if (activeGuard && !bypassGuard && activeGuard()) {
      e.preventDefault();
      const confirmed = await showLeaveConfirmDialog();
      if (!confirmed) return;
      bypassGuard = true;
      scheduleIndicator();
      window.location.href = anchor.href;
      return;
    }
    scheduleIndicator();
  });

  window.addEventListener('beforeunload', (e) => {
    if (activeGuard && !bypassGuard && activeGuard()) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  window.addEventListener('pagehide', () => {
    clearTimer();
    const el = document.getElementById(OVERLAY_ID);
    if (el) el.remove();
  });
}
