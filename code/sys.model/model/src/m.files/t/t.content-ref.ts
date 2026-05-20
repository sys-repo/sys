import type { t } from '../common.ts';
import type { FilesBase } from './t.base.ts';

/**
 * Portable references to file content outside inline Cmd results.
 */
export declare namespace FilesContentRef {
  /** Portable reference to file content outside an inline Cmd result. */
  export type ContentRef = Url | Hash | Ref;

  /** Reference shape. */
  export type Kind = 'url' | 'hash' | 'ref';

  /** Common content-ref metadata. */
  export type Base = {
    /** Canonical root-relative file path represented by this ref. */
    readonly path: FilesBase.StringPath;

    /** Content size in bytes, when known. */
    readonly size?: t.NumberBytes;

    /** Media/content type, when known. */
    readonly mediaType?: t.StringMimeType;

    /** Text encoding when this ref points at textual content. */
    readonly encoding?: FilesBase.Encoding;
  };

  /** Fetchable URL ref, suitable for dynamic/static HTTP projections. */
  export type Url = Base & {
    readonly kind: 'url';
    readonly url: t.StringUrl;
    readonly hash?: t.StringHash;
  };

  /** Hash-addressed ref, suitable for manifests and content-addressed stores. */
  export type Hash = Base & {
    readonly kind: 'hash';
    readonly hash: t.StringHash;
  };

  /** Opaque backing-owned ref; not a host filesystem path. */
  export type Ref = Base & {
    readonly kind: 'ref';
    readonly ref: t.StringRef;
    readonly hash?: t.StringHash;
  };
}
