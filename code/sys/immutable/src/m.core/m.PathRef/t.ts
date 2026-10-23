import type { t } from './common.ts';

type O = Record<string, unknown>;
type PathInput = t.ObjectPath | undefined | null;

/**
 * Path-bound projection of `ImmutableRef<T>` state.
 */
export declare namespace PathRef {
  /** PathRef helper library. */
  export type Lib = {
    bind<TRoot extends O, P = unknown, V = unknown>(
      args: Args<TRoot, P, V>,
    ): Instance<TRoot, P, V>;
  };

  /** Factory args for a path-bound reference projection. */
  export type Args<TRoot extends O, P = unknown, V = unknown> = {
    readonly root: t.ImmutableRef<TRoot, P, t.ImmutableEvents<TRoot, P>>;
    readonly path: PathInput;
    readonly initial?: () => V;
  };

  /** Path-bound projection of a root immutable reference. */
  export type Instance<TRoot extends O = O, P = unknown, V = unknown> = {
    readonly root: t.ImmutableRef<TRoot, P, t.ImmutableEvents<TRoot, P>>;
    readonly path: t.ObjectPath;
    readonly current: V;
    change(mutator: (draft: V) => void): void;
    events(until?: t.UntilInput): { readonly $: t.Observable<{ readonly after: V }> };
  };
}
