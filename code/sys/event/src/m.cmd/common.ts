import { type t, slug } from '../common.ts';
export * from '../common.ts';

/**
 * Simple id generator
 */
export function createId(): t.CmdReqId {
  return `req-${slug()}`;
}
