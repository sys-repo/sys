import type { t } from './common.ts';

import { createTimelineController } from './u.controller.timeline.ts';
import { projectRunnerState as runnerState } from './u.project.runnerState.ts';
import { projectTimeline as timeline } from './u.project.timeline.ts';
import { useClock } from './u.runner.clock.playback.ts';
import { createRunner as runner } from './u.runner.create.ts';
import { createPlaybackRuntimeFromDecks, createVideoDeckRuntime } from './u.runtime.deckAdapter.ts';
import { noop } from './u.runtime.noop.ts';
import { useRunner } from './use.Runner.ts';

export const Playback: t.TimecodePlaybackLib = {
  runner,
  useRunner,
  useClock,
  project: { runnerState, timeline },

  controller: {
    timeline: (runner: t.PlaybackRunner) => createTimelineController(runner),
  },

  runtime: {
    noop,
    fromVideoSignals(args) {
      const decks = createVideoDeckRuntime(args);
      return createPlaybackRuntimeFromDecks(decks);
    },
  },
};
