import { type t, slug } from '../common.ts';

export * from '../common.ts';
export {
  CrdtIs,
  CrdtUrl,
  toAutomergeHandle,
  toAutomergeRepo,
  toRepo,
  whenReady,
} from '../m.Crdt/mod.ts';

export function createPeerId() {
  return `crdt-peer-${slug()}` as t.PeerId;
}
