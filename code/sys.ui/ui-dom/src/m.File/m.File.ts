import { type t, D, DEFAULTS, Time } from './common.ts';
import { FileSize as Size } from './m.FileSize.ts';

/**
 * Helpers for working with binary files in the browser.
 */
export const File: t.FileLib = {
  DEFAULTS,
  Size,

  /**
   * Convert a Uint8Array to a Blob, preserving the visible range.
   * - Zero-copy when backed by a real ArrayBuffer.
   * - Falls back to a copy when backed by SharedArrayBuffer.
   */
  toBlob(data: Uint8Array, mimetype: string = D.mimetype) {
    if (data.buffer instanceof ArrayBuffer) {
      // Respect byteOffset/byteLength without copying when possible.
      const ab =
        data.byteOffset === 0 && data.byteLength === data.buffer.byteLength
          ? data.buffer
          : data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
      return new Blob([ab], { type: mimetype });
    }

    // SharedArrayBuffer case → copy into a fresh ArrayBuffer-backed view.
    const copy = new Uint8Array(data);
    return new Blob([copy], { type: mimetype });
  },

  /**
   * Read a Blob/File object into a [Uint8Array].
   */
  async toUint8Array(input: Blob | File) {
    const ab = await input.arrayBuffer();
    return new Uint8Array(ab);
  },

  /**
   * Convert a BinaryFile-like object into a browser File.
   * - Uses safe toBlob (handles SAB / offsets).
   * - Preserves name, type, and lastModified.
   */
  toFile(args) {
    const type = args.type ?? D.mimetype;
    const blob = File.toBlob(args.bytes, type);
    const lastModified = args.modifiedAt ?? Date.now();
    return new globalThis.File([blob], args.name, { type, lastModified });
  },

  /**
   * Convert a Blob into a BinaryFile-like object.
   * - Extracts bytes, name (if provided), type, and lastModified.
   * - Supports optional hash computation.
   */
  fromFile(input, opts = {}) {
    const { computeHash } = opts;
    return File.fromBlob(input, { computeHash });
  },

  /**
   * Convert a Blob into a BinaryFile-like object.
   * - Extracts bytes, name (if provided), type, and lastModified.
   * - Supports optional hash computation.
   */
  async fromBlob(input, opts = {}) {
    const bytes = new Uint8Array(await input.arrayBuffer());

    const type = input.type || opts?.defaultType || D.mimetype;
    const maybeFile = input as Partial<File>; // NB: structural duck typing.
    const name = maybeFile.name ?? opts?.name ?? 'unnamed';
    const modifiedAt = maybeFile.lastModified ?? opts?.defaultModifiedAt ?? Date.now();

    const hash = opts?.computeHash ? await opts.computeHash(bytes) : undefined;
    return { bytes, name, type, modifiedAt, hash };
  },

  /**
   * Initiates a file download from the browser.
   */
  download(filename: string, data: Uint8Array | Blob, options: { mimetype?: string } = {}) {
    return new Promise<void>((resolve) => {
      const { mimetype } = options;
      const blob = data instanceof Blob ? data : File.toBlob(data, mimetype);
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement('a');

      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);

      a.click();
      Time.delay(100, () => {
        document.body.removeChild(a);
        globalThis.URL.revokeObjectURL(url);
        resolve();
      });
    });
  },

  /**
   * Pull the file at the given URL and download it from the browser.
   */
  async downloadUrl(url: string, filename: string) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    return File.download(filename, await res.blob());
  },
} as const;
