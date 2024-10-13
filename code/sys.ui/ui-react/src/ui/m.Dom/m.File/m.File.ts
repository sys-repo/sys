import { Text, Time } from '../common.ts';

const DEFAULTS = {
  mimetype: 'application/octet-stream',
};

/**
 * Helpers for working with binary files in the browser.
 */
export const File = {
  DEFAULTS,
  size: Text.bytes,

  /**
   * Convert a [Uint8Array] to a [Blob].
   */
  toBlob(data: Uint8Array, mimetype: string = DEFAULTS.mimetype) {
    return new Blob([data], { type: mimetype });
  },

  /**
   * Read a Blob/File object into a [Uint8Array].
   */
  toUint8Array(input: Blob | File) {
    return new Promise<Uint8Array>((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result;
          if (result === null) throw new Error('File reader returned null');
          if (typeof result === 'string') return resolve(new TextEncoder().encode(result));
          if (typeof result === 'object') return resolve(new Uint8Array(result));
        };
        reader.readAsArrayBuffer(input);
      } catch (error) {
        reject(error);
      }
    });
  },

  /**
   * Initiates a file download from the browser
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
