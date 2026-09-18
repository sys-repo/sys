/**
 * @module
 * Test fixtures for Cmd<T> transports.
 */
import type { t } from './common.ts';
import { localTransport } from './m.localTransport.ts';

/** Test fixtures for Cmd<T> transports. */
export const CmdFixture: t.CmdFixture.Lib = Object.freeze({
  localTransport,
});
