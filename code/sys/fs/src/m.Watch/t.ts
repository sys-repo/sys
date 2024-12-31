import type { t } from './common.ts';

/**
 * Tools for watching file-system changes.
 */
export type FsWatchLib = {
  /**
   * Start a file-system watcher instance.
   */
  start(
    paths: t.StringPath | t.StringPath[],
    options?: { recursive?: boolean; dispose$?: t.UntilObservable },
  ): Promise<t.FsWatcher>;
};

/**
 * A live file-system watcher.
 */
export type FsWatcher = t.Lifecycle & {
  readonly $: t.Observable<t.FsWatchEvent>;

  /** The paths being wathced. */
  readonly paths: t.StringPath[];

  /** Flag indicating if all the watched paths exist. */
  readonly exists: boolean;

  /** Flags */
  readonly is: { readonly recursive?: boolean };

  /** Error(s) that may have occured during setup or while watching. */
  readonly error?: t.StdError;
};

/** An event fired by a watched file-system location. */
export type FsWatchEvent = Deno.FsEvent;
