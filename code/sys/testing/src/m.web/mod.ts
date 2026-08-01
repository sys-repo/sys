/**
 * @module
 * Test fixtures for Web Standards runtime primitives.
 */
import type { t } from './common.ts';
import { Fetch } from './m.Fetch/mod.ts';
import { WebSocket } from './m.WebSocket/mod.ts';

/** Test fixtures for Web Standards runtime primitives. */
export const WebFixture: t.WebFixture.Lib = {
  Fetch,
  WebSocket,
};
