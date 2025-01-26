import { type t, VitepressTmpl as Tmpl } from './common.ts';

import { backup } from './u.backup.ts';
import { update } from './u.update.ts';

/**
 * Helpers for establishing and updating the project environment.
 */
export const Env: t.VitepressEnvLib = {
  /** Template library for a VitePress project. */
  Tmpl,

  /** Create a new file-generator instances. */
  tmpl: Tmpl.create,

  /** Initialize the local machine environment with latest templates */
  update,

  /** Create a project folder snapshot. */
  backup,
};
