import type { t } from '../common.ts';
import { Keyboard } from './m.Keyboard.ts';
import { Window } from 'happy-dom';

const g = globalThis as any;
let _window: Window | undefined;
const ORIGINAL = {
  window: globalThis.window,
  document: globalThis.document,
} as const;

/**
 * Helpers for testing keyboard events in unit-tests.
 */
export const Mock: t.DomMockLib = {
  Keyboard,

  polyfill() {
    const window = _window || (_window = new Window());
    g.window = window;
    g.document = window.document;
    return Mock;
  },

  unpolyfill() {
    g.window = ORIGINAL.window;
    g.document = ORIGINAL.document;
    return Mock;
  },
};
