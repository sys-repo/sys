import { type t, VitepressTmpl as Tmpl } from './common.ts';

import { backup } from './u.backup.ts';

/**
 * Helpers for establishing and updating the project environment.
 */
export const VitepressEnv: t.VitepressEnvLib = {
  /** Create a project folder snapshot. */
  backup,
};
