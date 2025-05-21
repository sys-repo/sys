import { useEffect, useState } from 'react';
import { type t } from './common.ts';

/**
 *
 */
export function useMiniApp(): t.MiniAppHook {
  const [state, setState] = useState<t.MiniAppHook>({ isMiniApp: false });

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      // Fast bail-outs: SSR or not inside an iframe / RN WebView.
      if (typeof window === 'undefined') return;
      if (!wrangle.isLikelyIFrame()) return;

      // Dynamic-import the SDK.
      const { sdk } = await import('@farcaster/frame-sdk');

      // Ask the SDK to confirm the environment.
      if (await sdk.isInMiniApp()) {
        if (!cancelled) {
          await sdk.actions.ready(); // Dismiss splash screen (environment).
          setState({ isMiniApp: true, sdk });
          console.info(`Farcaster MiniApp: start | ⚡️ ready()`);
        }
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * API
   */
  return state;
}

/**
 * Helpers:
 */
const wrangle = {
  isLikelyIFrame() {
    try {
      return window.self !== window.top;
    } catch {
      // Cross-origin access throws → definitely inside an iframe.
      return true;
    }
  },
} as const;
