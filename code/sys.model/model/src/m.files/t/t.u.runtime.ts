import type { t } from '../common.ts';
import type { Files } from '../t.ts';

/**
 * Runtime structural surfaces and option fragments for backing adapters.
 */
export declare namespace Runtime {
  /** Minimal Cmd surface exposed by a bounded Files backing. */
  export type CmdSurface<K extends string = string> = {
    /** Backing kind, when surfaced as owner-local metadata. */
    readonly kind?: K;
    /** Capability facts for the bounded Files view. */
    readonly capabilities: Files.Capabilities;
    /** Canonical Files Cmd handlers. */
    readonly handlers: Files.Cmd.HandlerMap;
  };

  /** Runtime shape shared by model-owned Files backing adapters. */
  export type Shape<K extends string> = CmdSurface<K> & {
    /** Backing kind, surfaced only as owner-local metadata. */
    readonly kind: K;
    /** Snapshotted Files access policy used by this backing. */
    readonly policy: Files.Policy.Shape;
  };

  /** Shared options for bounded Files backing creation. */
  export type Options = {
    /** Files access policy; defaults to deny-all. */
    readonly policy?: Files.Policy.Shape;
    /** Default page size for list/manifest results. */
    readonly defaultLimit?: t.NumberTotal;
  };

  /** Shared options for backings that can return inline text. */
  export type InlineReadOptions = {
    /** Maximum bytes returned by `files:read`. */
    readonly maxReadBytes?: t.NumberBytes;
  };

  /** Shared options for backings that can write complete file values. */
  export type InlineWriteOptions = {
    /** Maximum bytes accepted by `files:write`. */
    readonly maxWriteBytes?: t.NumberBytes;
  };
}
