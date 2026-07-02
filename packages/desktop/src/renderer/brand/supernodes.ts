/**
 * Supernodes product overrides on top of the AionUI fork.
 * Keep fork-specific UI toggles here so upstream merges touch fewer files.
 */
export const SUPERDNODES_BRAND = {
  /** Full wordmark in the sidebar header (supernodes.ai/assets/supernodes.svg). */
  sidebarWordmark: true,
  /** Hide the Guid page agent pill bar; Hermes is selected by default. */
  showAgentPillBar: false,
  /** Hide the titlebar "Report issue" feedback button. */
  showFeedbackButton: false,
  /** Hide built-in Aion CLI from the agent list. */
  hideAionCliAgent: true,
  /** Rename the Hermes backend row to this label in the agent picker/API. */
  soleAgentDisplayName: 'Supernodes',
  /** Hide the Guid page bottom quick-action icons (bug report, GitHub, WebUI). */
  showGuidQuickActions: false,
  /** Hide Settings → Appearance / theme customization. */
  showAppearanceSettings: false,
  /** Hide Settings → About (upstream AionUI product details). */
  showAboutSettings: false,
  /** Hide Settings → System. */
  showSystemSettings: false,
  /** Hide Settings → Agents. */
  showAgentSettings: false,
  /** Login page: hide footer tagline rows. */
  loginHideFooter: true,
  /** Login page: hide language selector. */
  loginHideLanguageSelector: true,
  /** Force English UI (ignore saved/browser language). */
  forceEnglishLocale: true,
} as const;

const BRAND_FAVICON_VERSION = 'supernodes';

/** Ensure tab favicon links point at Supernodes assets (works around stale /favicon.ico cache). */
export function ensureBrandFavicon(): void {
  if (typeof document === 'undefined') return;

  const base = new URL('./', window.location.href);
  const upsert = (rel: string, href: string, sizes?: string, type?: string) => {
    const selector = `link[rel="${rel}"][data-supernodes-icon]`;
    let link = document.querySelector(selector) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = rel;
      link.dataset.supernodesIcon = 'true';
      document.head.appendChild(link);
    }
    link.href = href;
    if (sizes) link.sizes = sizes;
    else link.removeAttribute('sizes');
    if (type) link.type = type;
    else link.removeAttribute('type');
  };

  upsert('icon', new URL(`favicon.ico?v=${BRAND_FAVICON_VERSION}`, base).href, 'any');
  upsert(
    'icon',
    new URL(`pwa/icon-192.png?v=${BRAND_FAVICON_VERSION}`, base).href,
    '192x192',
    'image/png'
  );
  upsert('apple-touch-icon', new URL(`pwa/icon-180.png?v=${BRAND_FAVICON_VERSION}`, base).href);
}

/** Built-in settings tab order (matches sidebar routes). */
export const SETTINGS_TAB_ORDER = [
  'agent',
  'model',
  'assistants',
  'capabilities',
  'appearance',
  'webui',
  'pet',
  'system',
  'about',
] as const;

/** Which built-in settings sidebar tabs are visible for this product build. */
export function isVisibleSettingsTab(tabId: string, isDesktop: boolean): boolean {
  if (!isDesktop && tabId === 'pet') return false;
  if (!SUPERDNODES_BRAND.showAppearanceSettings && tabId === 'appearance') return false;
  if (!SUPERDNODES_BRAND.showAboutSettings && tabId === 'about') return false;
  if (!SUPERDNODES_BRAND.showSystemSettings && tabId === 'system') return false;
  if (!SUPERDNODES_BRAND.showAgentSettings && tabId === 'agent') return false;
  return true;
}

/** First visible settings route; used when redirecting away from hidden tabs. */
export function getDefaultSettingsPath(isDesktop: boolean): string {
  const tabId = SETTINGS_TAB_ORDER.find((id) => isVisibleSettingsTab(id, isDesktop));
  return tabId ? `/settings/${tabId}` : '/settings/model';
}
