import { type t } from './common.ts';
import { Rel } from './m.Rel.ts';

/**
 * Predicates over object-paths (arrays of segments).
 */
export const Is: t.ObjPathIsLib = {
  path(v?: unknown): v is t.ObjectPath {
    if (!Array.isArray(v)) return false;
    for (const x of v) {
      const type = typeof x;
      if (type === 'string') continue;
      if (type === 'number' && Number.isInteger(x) && Number.isSafeInteger(x)) continue;
      return false;
    }
    return true;
  },

  prefixOf(a, b) {
    const r = Rel.relate(a, b);
    return r === 'equal' || r === 'ancestor';
  },

  eql(a, b) {
    return Rel.relate(a, b) === 'equal';
  },

  ancestorOf(a, b) {
    return Rel.relate(a, b) === 'ancestor';
  },

  descendantOf(a, b) {
    return Rel.relate(a, b) === 'descendant';
  },
};
