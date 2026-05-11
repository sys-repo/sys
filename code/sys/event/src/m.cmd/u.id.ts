import { type t, slug } from './common.ts';

/**
 * Create a command request id.
 */
export function createId(): t.CmdReqId {
  return `req-${slug()}`;
}
