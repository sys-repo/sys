export * from '../common.ts';

export const exclude = [
  '**/node_modules/',
  '**/.git/',
  '**/dist/',
  '**/.tmp/',
  '**/-tmp/',
  '**/.DS_Store',
] as const;
