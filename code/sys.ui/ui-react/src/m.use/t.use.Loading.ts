import { type t } from './common.ts';

/**
 * Hook Factory: Keep track of several parts of a component that are loading.
 */
export type UseLoading = <P extends string>(parts: P[]) => LoadingHook<P>;

/**
 * Hook: Keep track of several parts of a component that are loading.
 */
export type LoadingHook<P extends string> = {
  readonly is: {
    /** True once every part has been marked loaded. */
    readonly complete: boolean;
    /** True when loading but not yet complete. */
    readonly loading: boolean;
  };

  /** The percentage of parts have been loaded (0..1). */
  readonly percent: t.Percent;

  /** All the parts being waited on. */
  readonly parts: t.LoadingHookPart<P>[];

  /**
   * Mark a single part done when you pass its name.
   * Always returns `true` once *all* parts are loaded.
   */
  ready(part?: P): boolean;
};

/** A single part registered with the loading hook. */
export type LoadingHookPart<P extends string> = {
  readonly name: P;
  readonly loaded: boolean;
};
