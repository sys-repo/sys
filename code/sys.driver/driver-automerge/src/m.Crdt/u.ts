import { type t } from './common.ts';
import { toAutomergeHandle } from '../m.Crdt.ref/u.toAutomergeHandle.ts';

export async function whenReady(doc?: t.Crdt.Ref) {
  const handle = toAutomergeHandle(doc);
  await handle?.whenReady();
}
