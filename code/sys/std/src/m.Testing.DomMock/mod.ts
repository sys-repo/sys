/**
 * @module
 * Mocking helpers for working with the DOM in unit-tests on the server.
 *
 * @example
 * ```ts
 * import { DomMock, beforeEach, afterEach } from '@sys/std/testing/server';
 *
 * beforeEach(DomMock.polyfill);
 * afterEach(DomMock.unpolyfill);
 * ```
 */
import type { t } from './common.ts';

import { Fake } from './m.Fake.ts';
import { Keyboard } from './m.Keyboard.ts';
import { polyfill, unpolyfill } from './u.polyfill.ts';
import { init } from './u.init.ts';

/**
 * Helpers for testing DOM related action in unit-tests.
 */
export const DomMock: t.DomMockLib = {
  Fake,
  Keyboard,
  init,
  polyfill,
  unpolyfill,
  get isPolyfilled() {
    return (globalThis as any).__SYS_BROWSER_MOCK__ === true;
  },
};
