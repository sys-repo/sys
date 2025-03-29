import { useEffect } from 'react';
import { type t, Keyboard, rx } from './common.ts';

export function useKeyboard(signals?: t.AppSignals) {
  useEffect(() => {
    const life = rx.disposable();
    const keyboard = Keyboard.until(life.dispose$);

    const is = {
      get dev() {
        const q = window.location.search;
        return q.includes('dev=') || q.includes('d=');
      },
    } as const;

    keyboard.on('CMD + Enter', () => {
      if (!is.dev) window.location.search = '?d';
    });

    /**
     * GODO: Root App (step out of DevHarness).
     */
    keyboard.on('CMD + Shift + Escape', (e) => {
      const url = new URL(window.location.href);
      const q = url.searchParams;
      q.delete('d');
      q.delete('dev');
      window.location.href = url.href;
    });

    /**
     * GOTO: DevHarness Root
     */
    keyboard.on('CMD + Escape', () => {
      if (is.dev) {
        const url = new URL(window.location.href);
        const q = url.searchParams;
        q.delete('d');
        q.set('dev', 'true');
        window.location.href = url.href;
      }
    });

    keyboard.on('Space', () => {
      /**
       * TODO 🐷
       */
      console.log('🐷 START/STOP player');
    });

    return life.dispose;
  }, [signals]);
}
