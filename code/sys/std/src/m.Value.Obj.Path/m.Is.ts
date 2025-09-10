import { type t } from './common.ts';
import { Rel } from './m.Rel.ts';

/**
 * Predicates over object-paths (arrays of segments).
 */
export const Is: t.ObjPathIsLib = {
  prefixOf(a, b) {
    const r = Rel.relate(a, b);
    return r === 'equal' || r === 'ancestor';
  },

  equal(a, b) {
    return Rel.relate(a, b) === 'equal';
  },

  ancestorOf(a, b) {
    return Rel.relate(a, b) === 'ancestor';
  },

  descendantOf(a, b) {
    return Rel.relate(a, b) === 'descendant';
  },
};
