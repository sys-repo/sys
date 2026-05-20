import type { t } from '../common.ts';
import type { FilesCore } from './t.core.ts';

/**
 * Pure policy model for bounded Files views.
 */
export declare namespace FilesPolicy {
  /** Policy document shape. Default posture is deny unless allowed. */
  export type Shape = {
    /** Allow listing matching entries/scopes. */
    readonly list?: FilesCore.Match;

    /** Allow statting matching entries. */
    readonly stat?: FilesCore.Match;

    /** Allow reading matching files. */
    readonly read?: FilesCore.Match;

    /** Allow watching matching entries/scopes. */
    readonly watch?: FilesCore.Match;

    /** Allow producing a manifest for this view. */
    readonly manifest?: boolean;

    /** Deny path/name matches after allow rules. */
    readonly deny?: FilesCore.Match;

    /** Maximum inline read size for this policy. */
    readonly maxReadBytes?: t.NumberBytes;
  };

  /** Options for the readonly policy helper. */
  export type ReadonlyOptions = {
    /** Deny path/name matches after allow rules. */
    readonly deny?: FilesCore.Match;

    /** Override watch allow-list. Use false to disable watch. */
    readonly watch?: FilesCore.Match | false;

    /** Maximum inline read size for this policy. */
    readonly maxReadBytes?: t.NumberBytes;
  };

  /** Pure policy helper surface. */
  export type Lib = {
    /** Build a read-oriented policy from one allow-list. */
    readonly readonly: (allow: FilesCore.Match, options?: ReadonlyOptions) => Shape;
  };
}
