export * from '../common.ts';

/**
 * Constants:
 */
export const exclude = [
  '**/node_modules/',
  '**/.git/',
  '**/dist/',
  '**/.tmp/',
  '**/-tmp/',
  '**/.DS_Store',
] as const;

export const D = { toolname: 'Clipboard Tools' } as const;
