export * from '../common.ts';

export const DEFAULTS = {
  contentTypes: {
    '.json': 'application/json',
    '.ts': 'text/plain',
    '.tsx': 'text/plain',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.md': 'text/markdown',
  },
} as const;
