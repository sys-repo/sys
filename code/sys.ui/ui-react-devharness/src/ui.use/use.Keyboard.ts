import { useEffect } from 'react';
import { type t, Keyboard } from './common.ts';

/**
 * Hook: Keyboard controller.
 */
export const useKeyboard: t.UseDevKeyboard = (options) => {
  useEffect(() => listen(options).dispose, []);
};

/**
 * Pure keyboard listener function.
 */
export function listen(options: t.UseDevKeyboardOptions = {}) {
  const keyboard = Keyboard.until(options.dispose$);
  const dbl = keyboard.dbl();

  const is = {
    get dev() {
      return getUrl().query.has('dev');
    },
  } as const;

  /**
   * Nav: DevHarness.
   */
  keyboard.on('CMD + Enter', () => {
    if (!is.dev) {
      const { url, query } = getUrl();
      query.set('dev', 'true');
      window.location.href = url.href;
    }
  });

  /**
   * Nav: Root
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
   * Clear debug console.
   */
  dbl.on('CMD + KeyK', () => {
    if (!(options.clearConsole ?? true)) return; // NB: not handled so other ['CMD+K' → clear] handlers will run.
    console.clear();
  });

  /**
   * ACTION: Cancel "save" HTML page (default browser action).
   */
  keyboard.on('CMD + KeyS', (e) => {
    if (options.cancelSave ?? true) e.handled();
  });

  /**
   * ACTION: Cancel "print" HTML page (default browser action).
   */
  keyboard.on('CMD + KeyP', (e) => {
    if (options.cancelPrint ?? true) e.handled();
  });

  // Finish up.
  return keyboard;
}

/**
 * Helpers:
 */
const getUrl = () => {
  const url = new URL(window.location.href);
  const query = url.searchParams;
  return { url, query };
};
