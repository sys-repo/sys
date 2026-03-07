import type { t } from './common.ts';

type O = Record<string, unknown>;
type PathInput = t.ObjectPath | undefined | null;

/**
 * PathRef library.
 */
export type PathRefLib = {
  bind<TRoot extends O, P = unknown, V = unknown>(
    args: PathRefArgs<TRoot, P, V>,
  ): PathRef<TRoot, P, V>;
};

/**
 * Factory args for a path-bound reference projection.
 */
export type PathRefArgs<TRoot extends O, P = unknown, V = unknown> = {
  readonly root: t.ImmutableRef<TRoot, P, t.ImmutableEvents<TRoot, P>>;
  readonly path: PathInput;
  readonly initial?: () => V;
};

/**
 * Path-bound projection of a root immutable reference.
 */
export type PathRef<TRoot extends O = O, P = unknown, V = unknown> = {
  readonly root: t.ImmutableRef<TRoot, P, t.ImmutableEvents<TRoot, P>>;
  readonly path: t.ObjectPath;
  readonly current: V;
  change(mutator: (draft: V) => void): void;
  events(until?: t.UntilInput): { readonly $: t.Observable<{ readonly after: V }> };
};
