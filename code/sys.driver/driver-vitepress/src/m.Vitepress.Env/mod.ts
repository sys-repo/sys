import type { t } from './common.ts';

import { createTmpl as tmpl } from '../m.Vitepress.Tmpl/mod.ts';
import { backup } from './u.backup.ts';
import { update } from './u.update.ts';

/**
 * Helpers for establishing and updating the project environment.
 */
export const Env: t.VitepressEnvLib = {
  /** Create a new file-generator instances. */
  tmpl,

  /** Initialize the local machine environment with latest templates */
  update,

  /** Create a project folder snapshot. */
  backup,
};
