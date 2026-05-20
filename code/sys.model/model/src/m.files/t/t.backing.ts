import type { t } from '../common.ts';
import type { FilesCapability } from './t.capability.ts';
import type { FilesCmd } from './t.cmd.ts';
import type { FilesPolicy } from './t.policy.ts';

/**
 * Common structural surfaces and option fragments for Files backing adapters.
 */
export declare namespace FilesBacking {
  /** Minimal Cmd surface exposed by a bounded Files backing. */
  export type CmdSurface<K extends string = string> = {
    /** Backing kind, when surfaced as owner-local metadata. */
    readonly kind?: K;

    /** Capability facts for the bounded Files view. */
    readonly capabilities: FilesCapability.Capabilities;

    /** Canonical Files Cmd handlers. */
    readonly handlers: FilesCmd.HandlerMap;
  };

  /** Runtime shape shared by model-owned Files backing adapters. */
  export type Runtime<K extends string> = CmdSurface<K> & {
    /** Backing kind, surfaced only as owner-local metadata. */
    readonly kind: K;

    /** Snapshotted Files access policy used by this backing. */
    readonly policy: FilesPolicy.Shape;
  };

  /** Generic live backing surfaces. */
  export namespace Live {
    /** Runtime shape shared by live Files backing adapters. */
    export type Runtime<K extends string> = FilesBacking.Runtime<K> & {
      /** Read-only live backing diagnostics; not Files authority. */
      readonly diagnostics: Diagnostics;
    };

    /** Read-only diagnostics for deterministic live backing orchestration/tests. */
    export type Diagnostics = {
      /** Number of currently active `files:watch` subscriptions. */
      readonly activeWatchCount: () => number;

      /** Resolve when at least one `files:watch` subscription is active. */
      readonly whenWatchActive: () => Promise<void>;
    };
  }

  /** Shared options for bounded Files backing creation. */
  export type Options = {
    /** Files access policy. Defaults to deny-all. */
    readonly policy?: FilesPolicy.Shape;

    /** Default page size for list/manifest results. */
    readonly defaultLimit?: t.NumberTotal;
  };

  /** Shared options for backings that can return inline text. */
  export type InlineReadOptions = {
    /** Maximum bytes returned by `files:read`. */
    readonly maxReadBytes?: t.NumberBytes;
  };
}
