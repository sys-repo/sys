import type { t } from './common.ts';

/**
 * <Component>:
 */
export type BinaryFileProps = {
  doc?: t.Crdt.Ref;
  path?: t.ObjectPath;

  // Appearance:
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Lightweight, serialisable snapshot of a browser `File`.
 *
 * Stores just enough metadata to recreate the original `File`
 * via `new File([bytes], name, { type, lastModified })`.
 *
 * @property bytes         Raw file contents.
 * @property name          Original filename (e.g. `'logo.png'`).
 * @property type          MIME type (e.g. `'image/png'`).
 * @property lastModified  Last-modified time, in milliseconds since epoch.
 */
export type BinaryFile = {
  bytes: Uint8Array; //               ← eg: binary content
  name: string; //                    ← eg: "logo.png"
  type: string; //                    ← eg: "image/png"
  modifiedAt: t.UnixTimestamp; //     ← eg: ms since epoch
  hash: t.StringHash;
};

/**
 * A map (keyed on the hash value of the file:Uint8Array)
 * of each file-stype
 */
export type BinaryFileMap<T = t.BinaryFile> = { [hash: string]: T };
