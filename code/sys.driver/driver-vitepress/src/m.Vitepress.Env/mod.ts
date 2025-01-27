import { type t, VitepressTmpl as Tmpl } from './common.ts';

import { backup } from './u.backup.ts';

/**
 * Helpers for establishing and updating the project environment.
 */
export const VitepressEnv: t.VitepressEnvLib = {
  /** Template library for a VitePress project. */
  Tmpl,

  /** Create a project folder snapshot. */
  backup,
};
