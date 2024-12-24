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

  /** Boolean flag assertions. */
  readonly Is: FileMapIsLib;

  /** Bundle the files wihtin directory into a `FileMap` object.  */
  bundle: t.FileMapBundler;

  /** Save a file-bundle to a target location. */
  write(target: t.StringDir, bundle: t.FileMap): Promise<FileMapSaveResponse>;
};

/** Resposne from `FileMap.write` method. */
export type FileMapSaveResponse = {
  readonly target: t.StringDir;
  readonly error?: t.StdError;
};

/**
 * Represents a bundled set of paths/files as a structured object.
 */
export type FileMap = { [path: t.StringPath]: string };

/** Bundles a directory into a `FileMap` data-uri object */
export type FileMapBundler = (
  dir: t.StringDir,
  options?: t.FileMapBundleOptions | t.FileMapBundleFilter,
) => Promise<FileMap>;

/** Options passed to the `FileMap.bundle` method. */
export type FileMapBundleOptions = { filter?: FileMapBundleFilter };

/** Filter the narrow down files included within a `FileMap` bundle. */
export type FileMapBundleFilter = (e: FileMapBundleFilterArgs) => boolean;
export type FileMapBundleFilterArgs = {
  path: t.StringPath;
  contentType: string;
  ext: string;
};

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
