import type { t } from '../common.ts';

/**
 * Tools for working with Vite.
 */
export type ViteLib = {
  /* Work with Vite in a child-process. */
  Process: t.ViteProcessLib;
};
