import { isValidDocumentId } from '@automerge/automerge-repo';

import { type t, Obj } from './common.ts';
import { toAutomergeHandle } from '../m.Crdt.ref/u.toAutomergeHandle.ts';

type O = Record<string, unknown>;

export const CrdtIs: t.CrdtIsLib = {
  ref<T extends O>(input?: unknown): input is t.CrdtRef<T> {
    if (input == null || !Obj.isObject(input)) return false;
    return !!toAutomergeHandle(input as t.CrdtRef<O>);
  },

  id(input?: unknown): input is t.DocumentId {
    return isValidDocumentId(input);
  },

  proxy(input?: unknown): input is { via: 'worker-proxy' } {
    if (input == null || !Obj.isObject(input)) return false;
    const via = (input as { via?: unknown }).via;
    return via === 'worker-proxy';
  },
};
