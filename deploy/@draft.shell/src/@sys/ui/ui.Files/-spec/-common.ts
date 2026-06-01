import { DEFAULTS, type t } from '../common.ts';

export * from '../common.ts';
export type * as t from './-t.ts';

const endpoint: t.StringUrl = 'ws://localhost:5050/files';
const timeout: t.Msecs = 3_000;

export const D = {
  ...DEFAULTS,
  endpoint,
  timeout,
} as const;
