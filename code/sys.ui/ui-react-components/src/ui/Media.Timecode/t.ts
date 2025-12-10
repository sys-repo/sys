import type { t } from './common.ts';

/** Type exports:  */
export type * from './t.Playback.ts';

/**
 * UI primitives for working with time-code
 */
export type MediaTimecodeLib = {
  Playback: t.FC<t.PlayerControlsProps>;
};
