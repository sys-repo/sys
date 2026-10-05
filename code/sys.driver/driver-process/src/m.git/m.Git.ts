import type { t } from './common.ts';
import { fileAtRef } from './u.file.ts';
import { init } from './u.init.ts';
import { probe } from './u.probe.ts';
import { root } from './u.root.ts';
import { status } from './u.status.ts';
import { statusPorcelainV2Z } from './u.status.v2z.ts';

/** Thin system driver for Git. */
export const Git: t.GitLib = {
  fileAtRef,
  init,
  probe,
  root,
  status,
  statusPorcelainV2Z,
};
