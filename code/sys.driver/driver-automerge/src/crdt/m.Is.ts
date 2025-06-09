import { type t, Is, Obj } from './common.ts';

type O = Record<string, unknown>;

export const CrdtIs: t.CrdtIsLib = {
  ref<T extends O>(input?: unknown): input is t.CrdtRef<T> {
    if (input == null || !Obj.isObject(input)) return false;
    const doc = input as t.CrdtRef<O>;
    return (
      Is.string(doc.id) &&
      Is.string(doc.instance) &&
      Is.func(doc.change) &&
      Is.record(doc.current) &&
      Is.func(doc.dispose) &&
      Is.bool(doc.disposed)
    );
  },
};
