import { type t, slug } from './common.ts';

/**
 * Creates a network peer identifier.
 *
 * The returned string is self-describing for inspection only; its shape is
 * not a semantic contract. Do not rely on the prefix or structure for any
 * programmatic meaning — only the uniqueness. The format may change without
 * notice.
 */
export function createPeerId() {
  return `repo-peer-${slug()}` as t.PeerId;
}
