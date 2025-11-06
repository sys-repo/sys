import { type t, Path } from './common.ts';
import { makeLens } from './u.make.ts';

/**
 * Path-based lens helpers for working with a generic Immutable<T> structure.
 */
export const Lens: t.ImmutableLensLib = {
  at<V = unknown, T = unknown, P = unknown>(doc: t.Immutable<T, P>, ...segments: t.ObjectPath[]) {
    const safe = segments.filter(Boolean);
    const path = Path.joinAll(...safe);
    return makeLens<T, P, V>(doc, path);
  },
};
