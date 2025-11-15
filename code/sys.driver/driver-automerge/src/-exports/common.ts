import { type t, slug } from '../common.ts';

export * from '../common.ts';
export {
  CrdtIs,
  CrdtUrl,
  CrdtWorker,
  toAutomergeHandle,
  toAutomergeRepo,
  toObject,
  toRepo,
  whenReady,
} from '../m.Crdt/mod.ts';

/**
 * Creates a peer identifier.
 *
 * The returned string is self-describing for inspection only; its shape is
 * not a semantic contract. Do not rely on the prefix or structure for any
 * programmatic meaning — only the uniqueness. The format may change without
 * notice.
 */
export function createPeerId() {
  return `repo-peer-${slug()}` as t.PeerId;
}
