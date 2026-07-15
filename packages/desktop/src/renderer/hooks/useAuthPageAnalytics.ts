import { useEffect } from 'react';
import { trackGooglePageView } from '@renderer/utils/googleAnalytics';

/** Load gtag and send a page view — login / register WebUI pages only. */
export function useAuthPageAnalytics(pageTitle: string, pageHash: '#/login' | '#/register'): void {
  useEffect(() => {
    trackGooglePageView(pageTitle, pageHash);
  }, [pageHash, pageTitle]);
}
