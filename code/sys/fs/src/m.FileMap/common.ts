export * from '../common.ts';

export { Fs } from '../m.Fs/m.Fs.ts';
export { Path } from '../m.Path/mod.ts';

export const D = {
  contentType: 'text/plain',

  /**
   * Canonical content-type registry for FileMap.
   * - `text`: extensions that should be treated as text
   * - `binary`: extensions that should be treated as binary
   * - `structuredText`: MIME strings (not extension-based) that are text-like
   */
  contentTypes: {
    /** Merge of text + binary (ext → mime). */
    all(): Record<string, string> {
      return { ...this.text, ...this.binary };
    },
    text: {
      '.ts': 'application/typescript',
      '.tsx': 'application/typescript+jsx',
      '.json': 'application/json',
      '.md': 'text/markdown',
      '.svg': 'image/svg+xml',
      '.txt': 'text/plain',
    } satisfies Record<string, string>,
    binary: {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
    } satisfies Record<string, string>,
    /** Non-extension MIME strings that should be treated as text. */
    structuredText: {
      'application/markdown': true,
      'application/javascript': true,
    } satisfies Record<string, true>,
  },
} as const;
export const DEFAULTS = D;
