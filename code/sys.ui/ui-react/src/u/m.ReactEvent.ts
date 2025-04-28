import type { t } from './common.ts';

/**
 * Helpers for working with React generated events.
 */
export const ReactEvent: t.ReactEventLib = {
  /**
   * Returns the keyboard-modifier flags for either a React synthetic event
   * or a native browser event (Mouse/Keyboard/Pointer).
   */
  modifiers(e) {
    const has = (k: 'shiftKey' | 'ctrlKey' | 'altKey' | 'metaKey') => Boolean((e as any)?.[k]);
    return {
      shift: has('shiftKey'),
      ctrl: has('ctrlKey'),
      alt: has('altKey'),
      meta: has('metaKey'),
    };
  },
} as const;
