import type { t } from './common.ts';

type BrowserFile = InstanceType<typeof globalThis.File>;

/**
 * Helpers for working with binary files in the browser.
 */
export declare namespace File {
  /** Helpers for working with binary files in the browser. */
  export type Lib = {
    /** Default constants used by the library. */
    readonly DEFAULTS: Defaults;

    /** Tools for working with a file-size (bytes). */
    readonly Size: Size.Lib;

    /**
     * Convert a Uint8Array to a Blob, preserving the visible range.
     * - Zero-copy when backed by a real ArrayBuffer.
     * - Falls back to a copy when backed by SharedArrayBuffer.
     */
    toBlob(data: Uint8Array, mimetype?: string): Blob;

    /** Reads a Blob or File object into a Uint8Array. */
    toUint8Array(input: Blob | BrowserFile): Promise<Uint8Array>;

    /**
     * Convert a BinaryFile-like object into a browser File.
     * - Uses safe toBlob (handles SAB / offsets).
     * - Preserves name, type, and lastModified.
     */
    toFile(args: ToFileArgs): BrowserFile;

    /**
     * Convert a File into a BinaryFile-like object.
     * - Preserves name, type, and lastModified.
     * - Supports optional hash computation.
     */
    fromFile(input: BrowserFile, opts?: FromFileOptions): Promise<t.BinaryFile>;

    /**
     * Convert a Blob into a BinaryFile-like object.
     * - Extracts bytes, name (if provided), type, and lastModified.
     * - Supports optional hash computation.
     */
    fromBlob(input: Blob, opts?: FromBlobOptions): Promise<t.BinaryFile>;

    /** Initiates a file download in the browser. */
    download(filename: string, data: Uint8Array | Blob, options?: DownloadOptions): Promise<void>;

    /** Fetches a file from a URL and initiates a download in the browser. */
    downloadUrl(url: string, filename: string): Promise<void>;
  };

  /** Default constants used by the library. */
  export type Defaults = {
    /** The default MIME type used when none is specified. */
    readonly mimetype: string;
  };

  /** Arguments used to convert bytes into a browser File. */
  export type ToFileArgs = {
    bytes: Uint8Array;
    name: string;
    type?: string;
    modifiedAt?: number;
  };

  /** Options used when converting a File into a binary-file shape. */
  export type FromFileOptions = {
    computeHash?: (bytes: Uint8Array) => string | Promise<string>;
  };

  /** Options used when converting a Blob into a binary-file shape. */
  export type FromBlobOptions = FromFileOptions & {
    name?: string;
    defaultType?: string;
    defaultModifiedAt?: number;
  };

  /** Options used when initiating a browser download. */
  export type DownloadOptions = {
    mimetype?: string;
  };

  /**
   * Tools for working with a file-size (bytes).
   */
  export namespace Size {
    /** Tools for working with a file-size (bytes). */
    export type Lib = {
      /** Convert bytes to a human-readable string, eg: 1337 → "1.34 kB". */
      toString: t.FormatBytes;
    };
  }
}
