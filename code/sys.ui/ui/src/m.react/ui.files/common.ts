import { Pkg, pkg, type t } from '../common.ts';

export * from '../common.ts';
export { Files as FilesBase } from '@sys/model/files';

const name = 'Files.InfoPanel';
const fields: readonly t.FileInfoPanel.Field[] = [
  'status:title',
  'capabilities',
  'error',
];

export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  title: 'Files',
  fields,
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
