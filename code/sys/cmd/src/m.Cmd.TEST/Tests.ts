import type { t } from './common.ts';
import type { CmdTestsLib } from './t.ts';

import { eventTests as events } from './Tests.Cmd.Events.ts';
import { flagsTests as flags } from './Tests.Cmd.Is.ts';
import { methodTests as method } from './Tests.Cmd.Method.ts';
import { patchTests as patch } from './Tests.Cmd.Patch.ts';
import { pathTests as path } from './Tests.Cmd.Path.ts';
import { queueTests as queue } from './Tests.Cmd.Queue.ts';
import { cmdTests as cmd } from './Tests.Cmd.ts';

export const Tests: CmdTestsLib = {
  all(setup: t.CmdTestSetup, args: t.TestArgs) {
    Object.entries(Tests.Index).forEach(([, test]) => test(setup, args));
  },
  Index: {
    cmd,
    events,
    path,
    patch,
    flags,
    method,
    queue,
  },
} as const;
