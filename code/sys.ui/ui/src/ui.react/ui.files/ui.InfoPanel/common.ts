import { Pkg, pkg, type t } from '../common.ts';

export * from '../common.ts';

const name = 'Files.InfoPanel';
const fieldOrder: readonly t.Files.InfoPanel.Field[] = [
  'title',
  'title.status',
  'title.status.label',
  'status',
  'fidelity',
  'capabilities',
  'error',
  'transport',
  'events',
];
const fields: readonly t.Files.InfoPanel.Field[] = [
  'title',
  'title.status',
  'capabilities',
  'error',
  'transport',
  'events',
];
const events: Required<t.Files.InfoPanel.Events.State> = { enabled: false };

export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  title: 'Files',
  fields,
  fieldOrder,
  events,
  animation: true,
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
