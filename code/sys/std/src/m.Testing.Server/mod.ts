/**
 * Test HTTP server tools.
 * @module
 */
import type { TestingHttpLib } from './t.ts';

import { Testing as Base } from '../m.Testing/mod.ts';
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

import { TestHttpServer as Http } from './m.HttpServer.ts';
export { DomMock } from '../m.Testing.DomMock/mod.ts';

/**
 * Testing helpers including light-weight HTTP server helpers (Deno).
 */
export const Testing: TestingHttpLib = {
  ...Base,
  Http,
};
