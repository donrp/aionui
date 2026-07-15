/** Google Analytics (gtag) — same property as www.supernodes.ai */

export const GOOGLE_ANALYTICS_ID = 'G-CYFC2R93HP';

let scriptRequested = false;
let configured = false;

function isWebBrowser(): boolean {
  return typeof window !== 'undefined' && !window.electronAPI;
}

function ensureGtagStub(): void {
  window.dataLayer = window.dataLayer ?? [];
  if (typeof window.gtag !== 'function') {
    window.gtag = (...args: unknown[]) => {
      window.dataLayer?.push(args);
    };
  }
}

function loadGtagScript(): void {
  if (scriptRequested || typeof document === 'undefined') return;
  scriptRequested = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`;
  document.head.appendChild(script);
}

export function initGoogleAnalytics(): void {
  if (!isWebBrowser() || configured) return;

  ensureGtagStub();
  loadGtagScript();

  window.gtag?.('js', new Date());
  window.gtag?.('config', GOOGLE_ANALYTICS_ID);
  configured = true;
}

export function trackGooglePageView(pageTitle: string, pagePath?: string): void {
  if (!isWebBrowser()) return;

  initGoogleAnalytics();

  const path = pagePath ?? `${window.location.pathname}${window.location.hash}`;

  window.gtag?.('config', GOOGLE_ANALYTICS_ID, {
    page_title: pageTitle,
    page_path: path,
    page_location: window.location.href,
  });
}
