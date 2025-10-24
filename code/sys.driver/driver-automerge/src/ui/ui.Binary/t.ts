import type { t } from './common.ts';

/**
 * User interface for working with `binary` data within CRDT's.
 */
export type BinaryLib = {
  readonly View: React.FC<BinaryFileProps>;

  /**
   * Converts a `File` object to a `BinaryFile` representation
   * with raw bytes and metadata.
   */
  fromBrowserFile(file: File): Promise<t.BinaryFile>;

  /** Converts a `BinaryFile` back into a browser `File` object. */
  toBrowserFile(file: t.BinaryFile): File;

  /** Converts a clipboard paste operation into an array of [BinaryFiles]. */
  fromClipboard(clipboardData: DataTransfer): Promise<t.BinaryFile[]>;
};

/**
 * <Component>
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
