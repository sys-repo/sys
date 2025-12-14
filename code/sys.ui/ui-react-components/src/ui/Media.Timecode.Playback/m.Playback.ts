import type { t } from './common.ts';
import { createRunner as runner } from './u.createRunner.ts';
import { useRunner } from './use.Runner.ts';

export const Playback: t.TimecodePlaybackLib = {
  runner,
  useRunner,
};
