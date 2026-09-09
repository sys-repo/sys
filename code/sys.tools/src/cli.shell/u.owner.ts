import { type t } from './common.ts';

/** Managed shell block owner metadata for @sys/tools. */
export const OWNER = {
  id: '@sys.shell',
  label: '@sys/tools shell',
  commandHint: 'sys shell',
} as const satisfies t.ShellTool.Owner;
