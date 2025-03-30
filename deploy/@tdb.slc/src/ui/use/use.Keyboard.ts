import { useEffect } from 'react';
import { type t, Keyboard, rx } from './common.ts';

/**
 * Hook: Keyboard controller.
 */
export const useKeyboard: t.UseKeyboardFactory = (app) => {
  useEffect(() => {
    const life = rx.disposable();
    const keyboard = Keyboard.until(life.dispose$);

    const getUrl = () => {
      const url = new URL(window.location.href);
      const query = url.searchParams;
      return { url, query };
    };

    const is = {
      get dev() {
        return getUrl().query.has('dev');
      },
    } as const;

    /**
     * GOTO: DevHarness.
     */
    keyboard.on('CMD + Enter', () => {
      if (!is.dev) {
        const { url, query } = getUrl();
        query.set('dev', 'true');
        window.location.href = url.href;
      }
    });

    /**
     * GOTO: Root
     */
    keyboard.on('CMD + Escape', () => {
      const { url, query } = getUrl();

      if (is.dev) {
        const current = query.get('dev');
        if (current === 'true') query.delete('dev'); // ← goto Root screen.
        else query.set('dev', 'true'); //               ← goto DevHarness index.
        window.location.href = url.href;
      }
    });

    /**
     * 🐷 START/STOP player
     */
    keyboard.on('Space', () => {
      /**
       * TODO 🐷
       */
      console.log('🐷 START/STOP player');
    });

    return life.dispose;
  }, [app]);

  /**
   * API
   */
  return {};
};
