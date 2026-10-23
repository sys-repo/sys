/**
 * @module
 * Test HTTP server tools.
 */
import type { t } from '../common/mod.ts';

import { Testing as Base } from '../m.Testing/mod.ts';
export {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  expectError,
  it,
} from '../m.Testing/mod.ts';

import { TestHttpServer as Http } from './m.HttpServer.ts';

/**
 * Testing helpers including light-weight HTTP server helpers (Deno).
 */
export const Testing: t.Testing.Server.Lib = Object.freeze({
  ...Base,
  Http,
});
