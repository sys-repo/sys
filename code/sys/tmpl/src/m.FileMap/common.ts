export * from '../common.ts';

export const DEFAULTS = {
  contentTypes: {
    '.json': 'application/json',
    '.ts': 'text/plain',
    '.tsx': 'text/plain',
    '.gitignore': 'text/plain',
    '.md': 'text/markdown',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  },
} as const;
