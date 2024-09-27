/**
 * @module
 * Test HTTP server tools.
 */

import type { t } from '../common.ts';
import { Testing as Base } from '../u.Testing/mod.ts';
import { TestHttpServer as HttpServer } from './u.HttpServer.ts';

export { describe, expect, it } from '../u.Testing/mod.ts';

/**
 * Testing helpers including light-weight HTTP server helpers (Deno).
 */
export const Testing: t.TestingHttp = {
  ...Base,
  HttpServer,
};
