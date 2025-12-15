import type { t } from './common.ts';

import { createRunner as runner } from './u.createRunner.ts';
import { useRunner } from './use.Runner.ts';
import { projectRunnerState as runnerState } from './u.project.runnerState.ts';
import { projectTimeline as timeline } from './u.project.timeline.ts';

export const Playback: t.TimecodePlaybackLib = {
  runner,
  useRunner,
  project: { runnerState, timeline },
};
