import type { t } from '../common.ts';
import type { FilesBase } from './t.base.ts';

/**
 * Entry metadata visible inside a bounded Files view.
 */
export declare namespace FilesEntry {
  /** File or directory entry visible inside a bounded Files view. */
  export type Entry = File | Dir;

  /** Entry kind discriminant. */
  export type Kind = 'file' | 'dir';

  /** Common entry metadata. */
  export type Base = {
    /** Canonical root-relative path. */
    readonly path: FilesBase.StringPath;

    /** Entry kind. */
    readonly kind: Kind;

    /** Last observed modified time, Unix epoch milliseconds, when known. */
    readonly modifiedAt?: t.UnixTimestamp;

    /** Content hash or backing digest, when known. */
    readonly hash?: t.StringHash;
  };

  /** File entry metadata. */
  export type File = Base & {
    readonly kind: 'file';

    /** File size in bytes, when known. */
    readonly size?: t.NumberBytes;

    /** Media/content type, when known. */
    readonly mediaType?: t.StringMimeType;
  };

  /** Directory entry metadata. */
  export type Dir = Base & {
    readonly kind: 'dir';
  };
}
