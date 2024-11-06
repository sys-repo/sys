import { useEffect } from 'react';
import { Keyboard, DEFAULTS } from './common.ts';

export function useKeyboard(args: { enabled: boolean; onEnter?: () => void }) {
  const { onEnter } = args;
  const enabled = args.enabled || typeof onEnter === 'function';

  useEffect(() => {
    const keys = Keyboard.on({
      /**
       * ENTER Key: Default entry redirect to the "dev" view.
       */
      Enter() {
        if (!enabled) return;
        if (onEnter) return onEnter(); // NB: Custom handler.

        /**
         * Adjust URL to show default <CmdHost> view.
         */
        const url = new URL(location.href);
        const params = url.searchParams;
        const dev = params.get(DEFAULTS.qs.dev);

        if (dev) params.set(DEFAULTS.qs.selected, dev);
        params.set(DEFAULTS.qs.dev, true.toString());
        location.href = url.href;
      },
    });

    return () => {
      keys.dispose();
    };
  }, [enabled]);
}
