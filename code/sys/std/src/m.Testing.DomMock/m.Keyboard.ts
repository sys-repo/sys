import { Is, type t } from './common.ts';

type Init = t.DomMock.Keyboard.EventInit;

const KEY_CODES: Readonly<Record<string, number | undefined>> = {
  Backspace: 8,
  Tab: 9,
  Enter: 13,
  Shift: 16,
  Control: 17,
  Alt: 18,
  Pause: 19,
  CapsLock: 20,
  Escape: 27,
  Space: 32,
  PageUp: 33,
  PageDown: 34,
  End: 35,
  Home: 36,
  ArrowLeft: 37,
  ArrowUp: 38,
  ArrowRight: 39,
  ArrowDown: 40,
  Insert: 45,
  Delete: 46,
  Meta: 91,
};

/**
 * Helpers for testing keyboard events in unit-tests.
 */
export const Keyboard: t.DomMock.Keyboard.Lib = {
  event(type, key = 'z', keyCode, code, init) {
    const args = wrangle.event(key, keyCode, code, init);
    return new globalThis.window.KeyboardEvent(type, args);
  },
  keydownEvent(key = 'z', keyCode, init) {
    return Keyboard.event('keydown', key, keyCode, init);
  },
  keyupEvent(key = 'z', keyCode, init) {
    return Keyboard.event('keyup', key, keyCode, init);
  },

  fire(event?: KeyboardEvent) {
    const e = event ?? Keyboard.keydownEvent();
    globalThis.document.dispatchEvent(e);
  },
} as const;

/**
 * Helpers:
 */
const wrangle = {
  event(key: string, keyCode?: number | Init, code?: string | Init, init?: Init): Init {
    const next = {
      ...wrangle.init(keyCode),
      ...wrangle.init(code),
      ...init,
    };

    const eventKey = next.key ?? key;
    const eventCode = next.code ?? (Is.string(code) ? code : wrangle.code(eventKey));
    const eventKeyCode = next.keyCode ?? (Is.number(keyCode) ? keyCode : wrangle.keyCode(eventKey));
    return { ...next, key: eventKey, code: eventCode, keyCode: eventKeyCode };
  },

  init(input?: number | string | Init): Init {
    return Is.object(input) ? input : {};
  },

  code(key: string) {
    if (/^[a-z]$/i.test(key)) return `Key${key.toUpperCase()}`;
    if (/^[0-9]$/.test(key)) return `Digit${key}`;
    if (key === ' ') return 'Space';
    return key;
  },

  keyCode(key: string) {
    if (/^[a-z]$/i.test(key)) return key.toUpperCase().charCodeAt(0);
    if (/^[0-9]$/.test(key)) return key.charCodeAt(0);
    if (key === ' ') return KEY_CODES.Space;
    return KEY_CODES[key] ?? 0;
  },
} as const;
