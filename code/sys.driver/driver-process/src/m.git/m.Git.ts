import type { t } from './common.ts';
import { probe } from './u.probe.ts';

/** Thin system driver for Git. */
export const Git: t.GitLib = {
  probe,
};
