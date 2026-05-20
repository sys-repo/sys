import type { t } from '../common.ts';
import type { FilesCore } from './t.core.ts';

/**
 * Source values accepted by text-ingesting Files backings.
 */
export declare namespace FilesSource {
  /** Text file source value without path/kind/size; those are derived by the backing. */
  export type TextFile = {
    readonly content: string;
    readonly modifiedAt?: t.UnixTimestamp;
    readonly hash?: t.StringHash;
    readonly mediaType?: t.StringMimeType;
  };

  /** Text file source shorthand or structured metadata. */
  export type TextFileInput = string | TextFile;

  /** Text file sources keyed by canonical root-relative Files path. */
  export type TextFileMap = { readonly [path: FilesCore.StringPath]: TextFileInput };

  /** Text-file source tree; empty directories must be explicit. */
  export type TextTree = {
    /** File content keyed by canonical root-relative Files path. */
    readonly files?: TextFileMap;

    /** Additional empty directories to expose. Parent directories are derived automatically. */
    readonly dirs?: readonly FilesCore.StringPath[];
  };
}
