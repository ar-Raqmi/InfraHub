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

export function navigate(url: string): void {
  scheduleIndicator();
  window.location.href = url;
}

export function navigateReplace(url: string): void {
  scheduleIndicator();
  window.location.replace(url);
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const anchor = (e.target as HTMLElement | null)?.closest?.('a');
    if (!anchor) return;
    if (!isInternalNavigation(anchor)) return;
    scheduleIndicator();
  });

  window.addEventListener('pagehide', () => {
    clearTimer();
    const el = document.getElementById(OVERLAY_ID);
    if (el) el.remove();
  });
}
