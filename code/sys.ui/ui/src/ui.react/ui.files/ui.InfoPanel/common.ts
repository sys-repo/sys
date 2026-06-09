import { Pkg, pkg, type t } from '../common.ts';

export * from '../common.ts';

const name = 'Files.InfoPanel';
const fields: readonly t.Files.InfoPanel.Field[] = [
  'status:title',
  'capabilities',
  'error',
  'events',
];
const events: Required<t.Files.InfoPanel.Events.State> = { enabled: false };

export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  title: 'Files',
  fields,
  events,
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
