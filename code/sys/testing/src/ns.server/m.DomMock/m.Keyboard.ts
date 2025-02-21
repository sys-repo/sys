import type { t } from '../common.ts';

/**
 * Helpers for testing keyboard events in unit-tests.
 */
export const Keyboard: t.DomMockKeyboardLib = {
  event(type: string, key = 'z', keyCode = 90, code?: string) {
    code = code ?? `Key${key.toUpperCase()}`;
    return new globalThis.window.KeyboardEvent(type, { key, keyCode, code });
  },
  keydownEvent(key = 'z', keyCode = 90) {
    return Keyboard.event('keydown', key, keyCode);
  },
  keyupEvent(key = 'z', keyCode = 90) {
    return Keyboard.event('keyup', key, keyCode);
  },

  fire(event?: KeyboardEvent) {
    const e = event ?? Keyboard.keydownEvent();
    globalThis.document.dispatchEvent(e);
  },
} as const;
