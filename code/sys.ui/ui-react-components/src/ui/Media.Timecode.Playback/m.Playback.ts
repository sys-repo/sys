import type { t } from './common.ts';

import { createRunner as runner } from './u.runner.create.ts';
import { createPlaybackRuntimeFromDecks, createVideoDeckRuntime } from './u.runtime.deckAdapter.ts';
import { projectRunnerState as runnerState } from './u.project.runnerState.ts';
import { projectTimeline as timeline } from './u.project.timeline.ts';
import { createTimelineController } from './u.controller.timeline.ts';
import { useRunner } from './use.Runner.ts';
import { noop } from './u.runtime.noop.ts';

export const Playback: t.TimecodePlaybackLib = {
  runner,
  useRunner,
  project: { runnerState, timeline },

  controller: {
    timeline: (r: t.PlaybackRunner) => createTimelineController(r),
  },

  runtime: {
    noop,
    fromVideoSignals: (args: t.VideoDeckRuntimeArgs): t.PlaybackRuntime => {
      const decks = createVideoDeckRuntime(args);
      return createPlaybackRuntimeFromDecks(decks);
    },
  },
};
