import { toAutomergeHandle } from '../m.Crdt.Ref/u.toAutomergeHandle.ts';
import { type t } from './common.ts';

export const whenReady: t.Crdt.Lib['whenReady'] = async (doc?: t.Crdt.Ref) => {
  const handle = toAutomergeHandle(doc);
  if (handle?.isDeleted()) return;
  await handle?.whenReady();
};
