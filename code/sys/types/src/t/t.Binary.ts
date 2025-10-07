import type { t } from './common.ts';

/**
 * Lightweight, serialisable snapshot of a browser `File`.
 *
 * Stores just enough metadata to recreate the original `File` via:
 *    new File([bytes], name, { type, lastModified })
 * or via the utility `File.fromFile` method.
 *
 * @property bytes        Raw file contents.
 * @property name         Original filename (e.g. "logo.png").
 * @property type         MIME type (e.g. "image/png").
 * @property modifiedAt   Last-modified time, in ms since epoch.
 * @property hash         Optional content hash (e.g. SHA-256).
 */
export type BinaryFile = {
  readonly bytes: Uint8Array;
  readonly name: string;
  readonly type: string;
  readonly modifiedAt: t.UnixTimestamp;
  readonly hash?: t.StringHash;
};
