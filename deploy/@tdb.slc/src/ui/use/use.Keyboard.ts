import { useEffect } from 'react';
import { type t, Keyboard } from './common.ts';

import { useKeyboard as useDevKeyboard } from '@sys/ui-react-devharness';

/**
 * Hook: Keyboard controller.
 */
export const useKeyboard: t.UseKeyboardFactory = (state) => {
  useDevKeyboard();

  useEffect(() => {
    const keyboard = Keyboard.until();

    /**
     * 🐷 START/STOP player
     */
    keyboard.on('Space', () => {
      /**
       * TODO 🐷
       */
      console.log('🐷 START/STOP player');
    });

    return keyboard.dispose;
  }, [state]);
};
