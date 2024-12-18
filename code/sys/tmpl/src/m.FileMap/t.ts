import type { t } from './common.ts';

/**
 * Tools for generating and saving bundles of files as a structured object.
 *
 * NOTE: This is useful for converting file-system layouts into a simple
 *       {object} that can be embedded included within a module's source code.
 */
export type FileMapLib = {
  /** Helpers for encoding/decoding file data. */
  readonly Data: FileMapDataLib;

  /** Bundle the files wihtin directory into a `FileMap` object  */
  bundle(dir: t.StringDir): Promise<FileMap>;
};

/**
 * Helpers for encoding/decoding file data.
 */
export type FileMapDataLib = {
  /** Encode a file's text. */
  encode(input: string): string;

  /** Decode an encoded file. */
  decode(input: string): string;
};

/**
 * Represents a bundled set of paths/files as a structured object.
 */
export type FileMap = { [path: t.StringPath]: string };
