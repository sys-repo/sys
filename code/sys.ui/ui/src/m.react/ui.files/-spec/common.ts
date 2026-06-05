import type { t } from './-t.ts';

export * from '../common.ts';
export * from '../../-test.ui.ts';
export type * as t from './-t.ts';

const endpoint: t.StringUrl = 'ws://localhost:5051/files';
const timeout: t.Msecs = 3_000;

export const SPEC = {
  endpoint,
  timeout,
} as const;
