/**
 * @module
 * Mocking helpers for server-side DOM unit tests.
 *
 * @example
 * For granular setup and teardown around each test:
 * ```ts
 * import { afterEach, beforeEach } from '@sys/std/testing/server';
 * import { DomMock } from '@sys/std/testing/server/dom';
 *
 * beforeEach(DomMock.polyfill);
 * afterEach(DomMock.unpolyfill);
 * ```
 *
 * Or, more commonly, register one suite lifecycle:
 * ```ts
 * import { afterAll, beforeAll } from '@sys/std/testing/server';
 * import { DomMock } from '@sys/std/testing/server/dom';
 *
 * DomMock.init({ beforeAll, afterAll });
 * ```
 */
import type { t } from './common.ts';

import { Fake } from './m.Fake.ts';
import { Keyboard } from './m.Keyboard.ts';
import { Mouse } from './m.Mouse.ts';
import { polyfill, unpolyfill } from './u.polyfill.ts';
import { init } from './u.init.ts';

/**
 * Helpers for DOM-related actions in server-side unit tests.
 */
export const DomMock: t.DomMock.Lib = Object.freeze({
  Fake,
  Keyboard,
  Mouse,
  init,
  polyfill,
  unpolyfill,
  get isPolyfilled() {
    return (globalThis as any).__SYS_BROWSER_MOCK__ === true;
  },
});
