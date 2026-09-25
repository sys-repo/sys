/**
 * @module
 * Web Standards runtime fixtures and their exact own-property transaction substrate.
 */
import type { t } from './common.ts';
import { Fetch } from './m.Fetch/mod.ts';
import { Property } from './m.Property/mod.ts';
import { WebSocket } from './m.WebSocket/mod.ts';

/** Web Standards runtime fixtures and their exact own-property transaction substrate. */
export const WebFixture: t.WebFixture.Lib = Object.freeze({
  Fetch,
  Property,
  WebSocket,
});
