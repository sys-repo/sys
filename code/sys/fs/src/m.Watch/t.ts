import type { t } from './common.ts';

/**
 * Tools for watching file-system changes.
 */
export declare namespace Watch {
  /** File-system watch helper library. */
  export type Lib = {
    /** Start a file-system watcher instance. */
    readonly start: (paths: Start.PathInput, options?: Start.Options) => Promise<Instance>;
  };

  /** A live file-system watcher. */
  export type Instance = t.Lifecycle & {
    readonly $: t.Observable<Event>;

    /** The paths being watched. */
    readonly paths: readonly t.StringPath[];

    /** Flag indicating if all the watched paths exist. */
    readonly exists: boolean;

    /** Watcher mode flags. */
    readonly is: { readonly recursive?: boolean };

    /** Error(s) that may have occurred during setup or while watching. */
    readonly error?: t.StdError;
  };

  /** An event fired by a watched file-system location. */
  export type Event = Deno.FsEvent;

  /**
   * Start operation contracts.
   */
  export namespace Start {
    /** Paths accepted by `Watch.start`. */
    export type PathInput = t.StringPath | t.StringPath[];

    /** Options accepted by `Watch.start`. */
    export type Options = {
      recursive?: boolean;
      until?: t.UntilInput;
    };
  }
}
