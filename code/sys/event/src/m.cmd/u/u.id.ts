import { slug, type t } from './common.ts';

/**
 * Create a command request id.
 */
export function createId(): t.Cmd.ReqId {
  return `req-${slug()}`;
}
