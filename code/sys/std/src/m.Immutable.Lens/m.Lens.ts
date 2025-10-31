import { type t } from './common.ts';
import { makeLens } from './u.make.ts';
import { joinAll } from './u.ts';

/**
 * Path-based lens helpers for working with a generic Immutable<T> structure.
 */
export const Lens: t.LensLib = {
  at<V = unknown, T = unknown, P = unknown>(doc: t.Immutable<T, P>, ...segments: t.ObjectPath[]) {
    const path = joinAll([], segments);
    return makeLens<T, P, V>(doc, path);
  },
};
