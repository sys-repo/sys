import { type t, isRecord } from './common.ts';
import { Mutate } from './m.Path.Mutate.ts';
import { get } from './m.Path.get.ts';

type KeyMap = Record<string, unknown>;

export const Path: t.ObjPathLib = {
  Mutate,
  mutate: Mutate.set,
  get,

  exists(subject, path) {
    if (path.length === 0) return false;

    // Walk down to the root container of the final field.
    let node: unknown = subject;
    for (let i = 0; i < path.length - 1; i += 1) {
      if (node === null || node === undefined || typeof node !== 'object') {
        return false; // Cannot descend further.
      }
      node = (node as KeyMap)[path[i] as keyof KeyMap];
    }

    const parent = node;
    const field = path[path.length - 1];

    // Validate the parent container and its relationship to the field.
    if (Array.isArray(parent)) {
      return typeof field === 'number'; // NB: any numeric index is a potentially valid slot on an array.
    }

    // Key must be an own enumerable or non-enumerable property.
    if (isRecord(parent) || Array.isArray(parent)) {
      return Object.prototype.hasOwnProperty.call(parent, String(field));
    }

    // Parent isn't an array or plain object ⇒ slot cannot exist.
    return false;
  },
};
