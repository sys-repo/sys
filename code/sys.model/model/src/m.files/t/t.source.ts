import type { t } from '../common.ts';
import type { Core } from './t.core.ts';

/**
 * Source values accepted by text-ingesting Files backings.
 */
export declare namespace FilesSource {
  /** Text file source value without path/kind/size; those are derived by the backing. */
  export type TextFile = {
    /** Text content. */
    readonly content: string;
    /** Last modified time, Unix epoch milliseconds, when known. */
    readonly modifiedAt?: t.UnixTimestamp;
    /** Content hash, when known. */
    readonly hash?: t.StringHash;
    /** Media/content type, when known. */
    readonly mediaType?: t.StringMimeType;
  };

  /** Text file source shorthand or structured metadata. */
  export type TextFileInput = string | TextFile;
  /** Text file sources keyed by canonical root-relative Files path. */
  export type TextFileMap = { readonly [path: Core.StringPath]: TextFileInput };

  /** Text-file source tree; empty directories must be explicit. */
  export type TextTree = {
    /** File content keyed by canonical root-relative Files path. */
    readonly files?: TextFileMap;
    /** Additional empty directories to expose; parent directories are derived. */
    readonly dirs?: readonly Core.StringPath[];
  };
}
