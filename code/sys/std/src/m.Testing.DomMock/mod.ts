/**
 * @module
 * Mocking helpers for working with the DOM in unit-tests on the server.
 *
 * @example
 * For granular controler before/after each.
 * ```ts
 * import { DomMock, beforeEach, afterEach } from '@sys/std/testing/server';
 *
 * beforeEach(DomMock.polyfill);
 * afterEach(DomMock.unpolyfill);
 * ```
 *
 * Or more commonly before/after all tests in the suite:
 * ```ts
 * import { DomMock, beforeEach, beforeAll, afterAll } from '@sys/std/testing/server';
 *
 * DomMock.init({ beforeAll, afterAll });
 * ```
 *
 *
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
