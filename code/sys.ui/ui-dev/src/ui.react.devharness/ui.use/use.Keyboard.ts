import { useEffect } from 'react';
import { Keyboard, type t } from './common.ts';
import { KeyboardNav } from './use.Keyboard.nav.ts';

const D = { enabled: true } as const;

/**
 * Hook: Keyboard controller.
 */
export const useKeyboard: t.UseDevKeyboard = (options) => {
  useEffect(() => {
    if (!(options?.enabled ?? D.enabled)) return;
    return listen(options).dispose;
  }, []);
};

/**
 * Keyboard listener command wiring.
 */
export function listen(options: t.UseDevKeyboardOptions = {}) {
  const keyboard = Keyboard.until(options.until);
  if (!(options.enabled ?? D.enabled)) return keyboard;

  const dbl = keyboard.dbl();
  const nav = KeyboardNav.create();

  /**
   * Nav: DevHarness.
   */
  keyboard.on('CMD + Enter', (e) => {
    e.consume();
    nav.openIndex();
  });

  /**
   * Nav: move one level up through DevHarness routes.
   */
  keyboard.on('CMD + SHIFT + Enter', (e) => {
    e.consume();
    nav.up();
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
    if (options.cancelSave ?? true) e.preventDefault();
  });

  /**
   * ACTION: Cancel "print" HTML page (default browser action).
   */
  keyboard.on('CMD + KeyP', (e) => {
    if (options.cancelPrint ?? true) e.preventDefault();
  });

  // Finish up.
  return keyboard;
}
