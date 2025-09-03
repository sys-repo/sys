import type { t } from './common.ts';
export type * from './t.bundle.ts';
export type * from './t.toMap.ts';
export type * from './t.write.ts';

/**
 * Tools for generating and saving bundles of files as a structured object.
 *
 * NOTE: This is useful for converting file-system layouts into a simple
 *       {object} that can be embedded and included within a module's source code.
 */
export type FileMapLib = {
  /** Helpers for encoding/decoding file data. */
  readonly Data: FileMapDataLib;

  /** Boolean flag assertions. */
  readonly Is: FileMapIsLib;

  /** Convert a directory to an in-memory FileMap (keys sorted). */
  toMap: t.FileMapToMap;

  /** Build a FileMap from a directory then write a single JSON artifact to a file. */
  bundle: t.FileMapBundle;

  /** Parse a raw JSON value into a FileMap; returns { fileMap } on success or { error } if invalid. */
  validate(json: unknown): t.FileMapValidateResult;

  /**
   * Filter on a filemap returning a new instance (non-mutating).
   * Keep entries for which the predicate returns true.
   */
  filter(filemap: t.FileMap, fn: t.FileMapFilter): t.FileMap;

  /** Materialize a FileMap into a target directory with optional per-file transforms. */
  write: t.FileMapWrite;
};

/** Predicate used to keep (true) or drop (false) a filemap entry. */
export type FileMapFilter = (e: FileMapFilterArgs) => boolean;
/** Arguments supplied to the FileMap filter predicate. */
export type FileMapFilterArgs = {
  readonly path: t.StringPath;
  readonly filename: string;
  readonly ext: string;
  readonly contentType: t.StringContentType;
  readonly value: string;
};

/** Outcome of parsing a raw JSON value into the `FileMap.fromJson` method. */
export type FileMapValidateResult = { readonly fileMap?: t.FileMap; readonly error?: t.StdError };

/**
 * Represents a bundled set of paths/files as a structured object.
 */
export type FileMap = { [path: t.StringPath]: string };

/**
 * Helpers for encoding/decoding file data.
 */
export type FileMapDataLib = {
  /** Encode a file's text. */
  encode(contentType: string, input: string | Uint8Array): string;

  /** Decode an encoded file. */
  decode(input: string): string | Uint8Array;

  /** Derive a content-type (mime) for the given path. */
  readonly contentType: {
    fromPath(path: t.StringPath): string;
    fromUri(path: t.StringUri): string;
  };
};

/**
 * Boolean flag assertions.
 */
export type FileMapIsLib = {
  /** Determine if the given string a data URN format (RFC 2397). */
  dataUri(input: string): boolean;

  /** Determine if the given path or filename is dotfile, eg ".gitignore" */
  dotfile(filename: string): boolean;

  /** Supported formats */
  readonly supported: {
    /** Determine if the given content-type is supported. */
    contentType(path: t.StringPath): boolean;
  };

  /** Content-type formats. */
  readonly contentType: {
    /** Content-type is a simple string. */
    string(contentType: string): boolean;

    /** Content-type is a binary format (Uint8Array). */
    binary(contentType: string): boolean;
  };
};
