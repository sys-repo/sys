import { isValidDocumentId } from '@automerge/automerge-repo';

import { type t, Obj, Is } from './common.ts';
import { toAutomergeHandle } from '../m.Crdt.Ref/u.toAutomergeHandle.ts';

type O = Record<string, unknown>;

export const CrdtIs: t.CrdtIsLib = {
  repo(input?: unknown): input is t.CrdtRepo {
    if (input == null || !Obj.isObject(input)) return false;
    const repo = input as t.CrdtRepo;
    return (
      Is.record(repo.id) &&
      Is.record(repo.sync) &&
      Is.array(repo.stores) &&
      Is.func(repo.events) &&
      Is.func(repo.whenReady) &&
      Is.func(repo.create) &&
      Is.func(repo.get) &&
      Is.func(repo.delete)
    );
  },

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
