import type { t } from '../common.ts';
import type { Core } from './t.u.core.ts';

/**
 * Pure policy model for bounded Files views.
 */
export declare namespace FilesPolicy {
  /** Pure policy helper surface. */
  export type Lib = {
    /** Build a read-oriented policy from one allow-list. */
    readonly readonly: (allow: Core.Match, options?: ReadonlyOptions) => Shape;
  };

  /** Policy document shape. Default posture is deny unless allowed. */
  export type Shape = {
    /** Allow listing matching entries/scopes. */
    readonly list?: Core.Match;
    /** Allow statting matching entries. */
    readonly stat?: Core.Match;
    /** Allow reading matching files. */
    readonly read?: Core.Match;
    /** Allow writing matching files. */
    readonly write?: Core.Match;
    /** Allow removing matching entries. */
    readonly remove?: Core.Match;
    /** Allow watching matching entries/scopes. */
    readonly watch?: Core.Match;
    /** Allow producing a manifest for this view. */
    readonly manifest?: boolean;
    /** Deny path/name matches after allow rules. */
    readonly deny?: Core.Match;
    /** Maximum inline read size for this policy. */
    readonly maxReadBytes?: t.NumberBytes;
    /** Maximum write payload size for this policy. */
    readonly maxWriteBytes?: t.NumberBytes;
  };

  /** Options for the readonly policy helper. */
  export type ReadonlyOptions = {
    /** Deny path/name matches after allow rules. */
    readonly deny?: Core.Match;
    /** Override watch allow-list; false disables watch. */
    readonly watch?: Core.Match | false;
    /** Maximum inline read size for this policy. */
    readonly maxReadBytes?: t.NumberBytes;
  };
}
