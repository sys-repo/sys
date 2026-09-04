import type { t } from '../common.ts';
import { client } from './m.client.ts';
import { handle } from './m.handle.ts';
import { handler } from './m.handler.ts';

/**
 * HTTP JSON transport for unary Cmd request/response calls.
 */
export const HttpCmd: t.HttpCmd.Lib = Object.freeze({
  handler,
  handle,
  client,
});
