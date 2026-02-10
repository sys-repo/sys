import { type t, PathRef } from './common.ts';

type O = Record<string, unknown>;

/**
 * Bind a root immutable ref to a sub-path and expose an EffectRef-compatible surface.
 */
export function bindRefPath<TRoot extends O, TState>(args: {
  root: t.ImmutableRef<TRoot>;
  path: t.ObjectPath;
  initial?: () => TState;
}) {
  return PathRef.bind<TRoot, unknown, TState>(args);
}
