export * from '../common.ts';

export { Fs } from '../m.Fs/m.Fs.ts';
export { Path } from '../m.Path/mod.ts';

export const DEFAULTS = {
  contentType: 'text/plain',
  contentTypes: {
    '.json': 'application/json',
    '.md': 'text/markdown',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  },
} as const;
