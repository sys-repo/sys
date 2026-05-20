import type { FilesCore } from './t.core.ts';
import type { FilesEntry } from './t.entry.ts';

/**
 * Files change hints. List/stat/read remain truth.
 */
export declare namespace FilesChange {
  /** Change event hint. List/stat/read remain truth. */
  export type Change = {
    /** Change kind. */
    readonly kind: 'created' | 'modified' | 'deleted';

    /** Changed root-relative path. */
    readonly path: FilesCore.StringPath;

    /** Entry metadata for create/modify hints, when known. */
    readonly entry?: FilesEntry.Entry;

    /** Monotonic sequence number, when provided by the backing. */
    readonly seq?: FilesCore.Seq;
  };
}
