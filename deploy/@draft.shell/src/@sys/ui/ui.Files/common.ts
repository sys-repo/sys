import { pkg, Pkg } from '../common.ts';

export * from '../common.ts';

const name = 'Files.InfoPanel';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  title: 'Files',
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
