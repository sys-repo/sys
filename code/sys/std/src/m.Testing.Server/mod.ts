/**
 * @module
 * Test HTTP server tools.
 */

import type { t } from '../common.ts';
import { Testing as Base } from '../m.Testing/mod.ts';
import { TestHttpServer as Http } from './m.HttpServer.ts';

export {
  afterAll,
  afterEach,
  Bdd,
  beforeAll,
  beforeEach,
  describe,
  expect,
  expectError,
  it,
} from '../m.Testing/mod.ts';

/**
 * Testing helpers including light-weight HTTP server helpers (Deno).
 */
export const Testing: t.TestingHttpLib = {
  ...Base,
  Http,
};
