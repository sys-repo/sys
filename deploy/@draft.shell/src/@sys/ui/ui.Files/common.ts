import { Pkg, pkg } from '../common.ts';

export * from '../common.ts';
export { Files as FilesBase } from '@sys/model/files';

const name = 'Files.InfoPanel';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  title: 'Files',
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
