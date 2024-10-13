/**
 * @module
 * Test HTTP server tools.
 */

import type { t } from '../common.ts';
import { Testing as Base } from '../m.Testing/mod.ts';
import { TestHttpServer as HttpServer } from './m.HttpServer.ts';

export { describe, expect, it } from '../m.Testing/mod.ts';

/**
 * Testing helpers including light-weight HTTP server helpers (Deno).
 */
export const Testing: t.TestingHttpLib = {
  ...Base,
  HttpServer,
};
