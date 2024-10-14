import type { t } from '../common.ts';

/**
 * A library of helper functions for working with binary files in the browser.
 */
export type FileLib = {
  /**
   * Default constants used by the library.
   */
  readonly DEFAULTS: {
    /**
     * The default MIME type used when none is specified.
     */
    readonly mimetype: string;
  };

  /**
   * Convert bytes to a human-readable string, eg: 1337 → "1.34 kB".
   */
  readonly size: t.FormatBytes;

  /**
   * Converts a Uint8Array to a Blob object.
   *
   * @param data - The Uint8Array to convert.
   * @param mimetype - Optional MIME type for the Blob. Defaults to DEFAULTS.mimetype.
   * @returns A Blob representing the input data.
   */
  toBlob(data: Uint8Array, mimetype?: string): Blob;

  /**
   * Reads a Blob or File object into a Uint8Array.
   *
   * @param input - The Blob or File to read.
   * @returns A Promise that resolves to a Uint8Array containing the file data.
   */
  toUint8Array(input: Blob | File): Promise<Uint8Array>;

  /**
   * Initiates a file download in the browser.
   *
   * @param filename - The name to give the downloaded file.
   * @param data - The data to download, as a Uint8Array or Blob.
   * @param options - Optional parameters.
   * @param options.mimetype - Optional MIME type for the Blob.
   * @returns A Promise that resolves when the download has been initiated.
   */
  download(
    filename: string,
    data: Uint8Array | Blob,
    options?: { mimetype?: string },
  ): Promise<void>;

  /**
   * Fetches a file from a URL and initiates a download in the browser.
   *
   * @param url - The URL of the file to download.
   * @param filename - The name to give the downloaded file.
   * @returns A Promise that resolves when the download has been initiated.
   */
  downloadUrl(url: string, filename: string): Promise<void>;
};
