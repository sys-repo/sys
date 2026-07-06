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
const fieldLabels = {
  status: 'status',
  'status:title': 'status:title',
  fidelity: 'fidelity',
  capabilities: 'capabilities',
  error: 'error',
  events: 'events',
} satisfies Record<Field, string>;

export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  fields,
  fieldLabels,
  reorder: true,
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
