import { Pkg, pkg, type t } from '../common.ts';

export * from '../common.ts';

type Field = t.Files.InfoPanel.Field;

/**
 * Constants:
 */
const name = 'Files.InfoPanel.Config';
const fields: readonly Field[] = [
  'status',
  'status:title',
  'fidelity',
  'capabilities',
  'error',
  'events',
];
const fieldLabels: Partial<Record<Field, string>> = {
  'status:title': 'status title',
};

export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  fields,
  fieldLabels,
  reorder: true,
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
