/**
 * Mocking helpers for working with the DOM in unit-tests on the server.
 * @module
 *
 * @example
 * ```ts
 * import { DomMock } from '@sys/testing/server';
 * DomMock.polyfill();
 * ```
 */
import type { t } from './common.ts';

import { Keyboard } from './m.Keyboard.ts';
import { polyfill, unpolyfill } from './u.polyfill.ts';

/**
 * Helpers for testing DOM related action in unit-tests.
 */
export const DomMock: t.DomMockLib = {
  Keyboard,
  polyfill,
  unpolyfill,
  get isPolyfilled() {
    return (globalThis as any).__SYS_BROWSER_MOCK__ === true;
  },
};
