/**
 * @module
 * YAML-backed staging CLI helpers for staged-data filesystem workflows.
 */
export type * as t from './t.ts';

import type { t } from './common.ts';
import { menu } from './u.menu.ts';
import { StageProfileSchema } from './schema/mod.ts';
import { StageProfileFs } from './u.fs.ts';
import { runCreateProfile } from './u.create.ts';
import { runStageProfile } from './u.stage.ts';
import { run } from './u.run.ts';
import { FmtHelp } from './u.help.ts';
import { Fmt } from './u.fmt.ts';

export const SlcDataCli: t.SlcDataCli.Lib = {
  help: FmtHelp.output,
  run,
  menu,
  Fmt: { result: Fmt.result },
  StageProfile: {
    fs: StageProfileFs,
    schema: StageProfileSchema,
    path(cwd, profile) {
      return StageProfileFs.path(cwd, profile);
    },
    create: runCreateProfile,
    stage({ cwd, profile, target }) {
      return runStageProfile({ cwd, path: StageProfileFs.path(cwd, profile), target });
    },
  },
};
