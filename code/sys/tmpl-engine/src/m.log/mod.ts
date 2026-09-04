import type { t } from './common.ts';
import { bundled } from './u.bundled.ts';
import { table } from './u.table.ts';

export const Log: t.TmplLogLib = Object.freeze({
  table,
  bundled,
});
