import type { t } from '../common.ts';
import type { Core } from './t.u.core.ts';
import type { FilesEntry } from './t.entry.ts';

/**
 * Files change hints. List/stat/read remain truth.
 */
export declare namespace FilesChange {
  /** Source of a change hint. */
  export type Origin = 'command' | 'fs-watch';

  /** Change event hint. List/stat/read remain truth. */
  export type Change = {
    /** Change kind. */
    readonly kind: 'created' | 'modified' | 'deleted';

    /** Changed root-relative path. */
    readonly path: Core.StringPath;

    /** Entry metadata for create/modify hints, when known. */
    readonly entry?: FilesEntry.Entry;

    /** Monotonic sequence number, when provided by the backing. */
    readonly seq?: Core.Seq;

    /** Change hint origin, when provided by the backing. */
    readonly origin?: Origin;

    /** Request/correlation id for command-origin hints, when provided. */
    readonly correlation?: t.Cmd.ReqId;
  };
}
