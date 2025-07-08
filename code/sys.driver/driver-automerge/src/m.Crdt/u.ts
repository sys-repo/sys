import { toAutomergeHandle } from '../m.Crdt.ref/u.toAutomergeHandle.ts';
import { type t } from './common.ts';

export async function whenReady(doc?: t.Crdt.Ref) {
  const handle = toAutomergeHandle(doc);
  if (handle?.isDeleted()) return;
  await handle?.whenReady();
}
