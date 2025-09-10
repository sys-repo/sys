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
 * A map (keyed on the hash value of the file:Uint8Array)
 * of each file-stype
 */
export type BinaryFileMap<T = t.BinaryFile> = { [hash: string]: T };

/**
 * Helpers for working with the `BinaryFile` type.
 */
export type BinaryLib = {
  /**
   * Converts a `File` object to a `BinaryFile` representation
   * with raw bytes and metadata.
   */
  fromBrowserFile(file: File): Promise<t.BinaryFile>;

  /**
   * Converts a `BinaryFile` back into a browser `File` object.
   */
  toBrowserFile(file: t.BinaryFile): File;

  /**
   * Converts a clipboard paste operation into an array of [BinaryFiles].
   */
  fromClipboard(clipboardData: DataTransfer): Promise<t.BinaryFile[]>;
};
