import { useEffect } from 'react';
import { type t, Keyboard } from './common.ts';

/**
 * Hook: Keyboard controller.
 */
export const useKeyboard: t.UseKeyboardFactory = (state) => {
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
