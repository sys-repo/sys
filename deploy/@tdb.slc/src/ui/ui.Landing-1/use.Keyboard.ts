import { useEffect } from 'react';
import { Keyboard, Rx } from './common.ts';

export function useKeyboard() {
  useEffect(() => {
    const life = Rx.lifecycle();
    const keyboard = Keyboard.until(life.dispose$);

    keyboard.on('Enter', () => {
      const s = window.location.search;
      const isDev = s.includes('dev=') || s.includes('d=');
      if (!isDev) window.location.search = '?d';
    });

    keyboard.on('Space', () => {
      /**
       * TODO 🐷
       */
      console.log('🐷 START/STOP player');
    });

    return life.dispose;
  });
}
