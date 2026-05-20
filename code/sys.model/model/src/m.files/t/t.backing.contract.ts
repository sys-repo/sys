import type { BackingLive } from './t.backing.live.ts';
import type { BackingRuntime } from './t.backing.runtime.ts';

/**
 * Common structural surfaces and option fragments for Files backing adapters.
 */
export declare namespace Backing {
  /** Minimal Cmd surface exposed by a bounded Files backing. */
  export type CmdSurface<K extends string = string> = BackingRuntime.CmdSurface<K>;

  /** Runtime shape shared by model-owned Files backing adapters. */
  export type Runtime<K extends string> = BackingRuntime.Runtime<K>;

  /** Generic live backing surfaces. */
  export namespace Live {
    /** Runtime shape shared by live Files backing adapters. */
    export type Runtime<K extends string> = BackingLive.Runtime<K>;

    /** Read-only diagnostics for deterministic live backing orchestration/tests. */
    export type Diagnostics = BackingLive.Diagnostics;
  }

  /** Shared options for bounded Files backing creation. */
  export type Options = BackingRuntime.Options;

  /** Shared options for backings that can return inline text. */
  export type InlineReadOptions = BackingRuntime.InlineReadOptions;
}
