/**
 * @module
 * YAML-backed staging CLI helpers for filesystem workflows.
 */
export type * as t from './t.ts';

import type { t } from './common.ts';
import { menu } from './u.menu.ts';
import { StageProfileSchema } from './schema/mod.ts';
import { StageProfileFs } from './u.fs.ts';

export const SlcDataCli: t.SlcDataCli.Lib = {
  menu,
  StageProfile: {
    fs: StageProfileFs,
    schema: StageProfileSchema,
    path(cwd, profile) {
      return StageProfileFs.path(cwd, profile);
    },
  },
};
