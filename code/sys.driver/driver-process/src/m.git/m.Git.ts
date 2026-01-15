import type { t } from './common.ts';
import { probe } from './u.probe.ts';
import { status } from './u.status.ts';
import { statusPorcelainV2Z } from './u.status.v2z.ts';
import { root } from './u.root.ts';

/** Thin system driver for Git. */
export const Git: t.GitLib = {
  probe,
  status,
  statusPorcelainV2Z,
  root,
};
