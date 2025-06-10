import { type t, Obj } from './common.ts';
import { toAutomergeHandle } from './u.ref.ts';

type O = Record<string, unknown>;

export const CrdtIs: t.CrdtIsLib = {
  ref<T extends O>(input?: unknown): input is t.CrdtRef<T> {
    if (input == null || !Obj.isObject(input)) return false;
    return !!toAutomergeHandle(input as t.CrdtRef<O>);
  },
};
